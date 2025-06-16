import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks, Depends
import time
import os
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any, Literal
from ..api.router import job_status
import logging as logger
from app.services.evaluate.model_evaluation import simulate_evaluation as run_evaluation_job

router = APIRouter(
    prefix="",
    tags=["Evaluate"],
    responses={404: {"description": "Not found evaluation route"}},
)

# Define the evaluation request model
class EvaluateRequest(BaseModel):
    model_name_or_path: str
    stage: str = "sft"
    eval_dataset: str
    adapter_name_or_path: Optional[str] = None
    output_dir: Optional[str] = None
    hub_token: Optional[str] = None
    
    # Advanced fields
    trust_remote_code: Optional[bool] = True
    finetuning_type: Optional[str] = "lora"
    quantization_method: Optional[str] = "bnb"
    template: Optional[str] = "llama3"
    flash_attn: Optional[str] = "auto"
    dataset_dir: Optional[str] = "data"
    cutoff_len: Optional[int] = 1024
    max_samples: Optional[int] = 10000
    preprocessing_num_workers: Optional[int] = 16
    per_device_eval_batch_size: Optional[int] = 8
    predict_with_generate: Optional[bool] = True
    max_new_tokens: Optional[int] = 512
    top_p: Optional[float] = 0.7
    temperature: Optional[float] = 0.95

# Define the evaluation response model
class EvaluateResponse(BaseModel):
    job_id: str
    status: str

def process_datasets(datasets: list[str]) -> tuple[list[str], bool, list[dict]]:
    """
    Process dataset string to handle custom datasets and create dataset details.
    
    Args:
        dataset: Dataset name, possibly with 'custom:' prefix
        
    Returns:
        processed_datasets: List of cleaned dataset names
        custom_datasets_found: Boolean indicating if custom datasets were found
        dataset_details: List of dictionaries with detailed dataset information
    """
    processed_datasets = []
    custom_datasets_found = False
    dataset_details = []
    
    if not datasets:
        return processed_datasets, custom_datasets_found, dataset_details
    
    for dataset in datasets:
        # Handle custom dataset prefix
        if dataset.startswith('custom:'):
            custom_dataset = dataset[7:]  # Remove 'custom:' prefix
            custom_datasets_found = True
            logger.info(f"Detected custom dataset: {custom_dataset}")
            processed_datasets.append(custom_dataset)
        else:
            processed_datasets.append(dataset)
    
    # Create detailed dataset information
    for ds in processed_datasets:
        ds_info = {"name": ds}
        
        # Check if it's a HuggingFace-style dataset path
        if '/' in ds and not os.path.exists(ds):
            ds_info["type"] = "huggingface"
            ds_info["username"] = ds.split('/')[0]
            ds_info["dataset_name"] = ds.split('/')[1] if len(ds.split('/')) > 1 else ""
            logger.info(f"HuggingFace dataset: {ds} (user: {ds_info['username']})")
        
        # Check if it's a local file path
        elif os.path.exists(ds):
            ds_info["type"] = "local"
            ds_info["path"] = os.path.abspath(ds)
            logger.info(f"Local dataset: {ds}")
        
        # Otherwise treat as a named dataset
        else:
            ds_info["type"] = "named"
            logger.info(f"Named dataset: {ds}")
        
        dataset_details.append(ds_info)
    
    return processed_datasets, custom_datasets_found, dataset_details

async def _run_evaluation_task(job_id: str, params: dict):
    """Background task to run evaluation and update job status."""
    try:
        job_status[job_id]["status"] = "RUNNING"
        job_status[job_id]["message"] = "Evaluation in progress"
        
        # Run the actual evaluation
        result = await run_evaluation_job(job_id, params)
        
        # Update job status based on result
        if result and isinstance(result, dict):
            job_status[job_id]["status"] = result.get("status", "COMPLETED").upper()
            job_status[job_id]["message"] = result.get("message", "Evaluation completed successfully")
            if "metrics" in result:
                job_status[job_id]["metrics"] = result["metrics"]
        else:
            job_status[job_id]["status"] = "COMPLETED"
            job_status[job_id]["message"] = "Evaluation completed successfully"
        
        job_status[job_id]["progress"] = 1.0
        logger.info(f"Evaluation job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in evaluation job {job_id}: {str(e)}")
        job_status[job_id]["status"] = "FAILED"
        job_status[job_id]["message"] = f"Error: {str(e)}"

@router.post("/v1/evaluate",
    response_model=EvaluateResponse,
    status_code=status.HTTP_200_OK,
)
async def evaluate_model(request: EvaluateRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Received evaluation request for model: {request.model_name_or_path}")
        
        # Process dataset
        processed_datasets, custom_datasets_found, dataset_details = process_datasets([request.eval_dataset])
        
        if not processed_datasets:
            raise HTTPException(status_code=400, detail="No valid datasets provided")
        
        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        
        # Prepare the full parameters dictionary
        full_params = {
            "model_name_or_path": request.model_name_or_path,
            "adapter_name_or_path": request.adapter_name_or_path,
            "stage": request.stage,
            "eval_dataset": ','.join(processed_datasets),
            "dataset": ','.join(processed_datasets),
            "has_custom_datasets": custom_datasets_found,
            "do_eval": True,
        }
        
        # Add output directory if specified, otherwise generate one
        if request.output_dir:
            full_params["output_dir"] = request.output_dir
        else:
            model_short_name = request.model_name_or_path.split('/')[-1]
            finetuning_type = request.finetuning_type or "lora"
            timestamp = time.strftime("%Y-%m-%d-%H-%M-%S")
            full_params["output_dir"] = f"saves/{model_short_name}/{finetuning_type}/eval_{timestamp}"
        
        # Add token if provided
        if request.hub_token:
            full_params["hub_token"] = request.hub_token
            os.environ["HF_TOKEN"] = request.hub_token
            os.environ["HUGGING_FACE_HUB_TOKEN"] = request.hub_token
            logger.info("Token provided for evaluation (set in environment variables)")
        else:
            os.environ["HF_TOKEN"] = ''
            os.environ["HUGGING_FACE_HUB_TOKEN"] = ''
            
        # Add all other parameters from the request
        for key, value in request_dict.items():
            if key not in ["model_name_or_path", "adapter_name_or_path", "stage", "eval_dataset", "output_dir", "hub_token"]:
                full_params[key] = value
        
        # Add detailed dataset information
        if dataset_details:
            full_params["dataset_details"] = dataset_details
            
        # Generate a job ID
        job_id = f"eval-{hash(request.model_name_or_path)}-{int(time.time())}"

        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Evaluation job queued",
            "parameters": full_params
        }

        # Schedule the evaluation as a background task
        background_tasks.add_task(_run_evaluation_task, job_id, full_params)
        
        logger.info(f"Evaluation job {job_id} scheduled for background execution")
        return {"job_id": job_id, "status": "PENDING"}
        
    except Exception as e:
        logger.error(f"Error handling evaluation request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
