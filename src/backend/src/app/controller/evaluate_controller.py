import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks, Depends
import time
import os
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any, Literal
from ..api.router import job_status
import logging as logger
from app.services.evaluate.model_evaluation import simulate_evaluation as run_evaluation_job
from app.services.evaluate.benchmark_evaluation import simulate_benchmark as run_benchmark_job

router = APIRouter(
    prefix="",
    tags=["Evaluate"],
    responses={404: {"description": "Not found evaluation route"}},
)

# Define the evaluation request models with proper inheritance
class EvaluateBaseRequest(BaseModel):
    model_name_or_path: str
    evaluation_type: str
    hub_token: Optional[str] = None
    trust_remote_code: Optional[bool] = True

# Training evaluation specific request
class TrainingEvaluateRequest(EvaluateBaseRequest):
    evaluation_type: Literal["training"] = "training"
    stage: str = "sft"
    eval_dataset: str
    adapter_name_or_path: Optional[str] = None
    output_dir: Optional[str] = None
    
    # Advanced fields
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

# Benchmark evaluation specific request
class BenchmarkEvaluateRequest(EvaluateBaseRequest):
    evaluation_type: Literal["benchmark"] = "benchmark"
    task: str
    task_dir: str = "evaluation"
    save_dir: Optional[str] = None
    template: str = "fewshot"
    
    # Advanced fields for benchmark
    n_shot: Optional[int] = 5
    lang: Optional[str] = "en"
    batch_size: Optional[int] = 4
    seed: Optional[int] = 42

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

async def _run_benchmark_task(job_id: str, params: dict):
    """Background task to run benchmark evaluation and update job status."""
    try:
        job_status[job_id]["status"] = "RUNNING"
        job_status[job_id]["message"] = "Benchmark evaluation in progress"
        
        # Run the actual benchmark
        result = await run_benchmark_job(job_id, params)
        
        # Update job status based on result
        if result and isinstance(result, dict):
            job_status[job_id]["status"] = result.get("status", "COMPLETED").upper()
            job_status[job_id]["message"] = result.get("message", "Benchmark completed successfully")
            if "metrics" in result:
                job_status[job_id]["metrics"] = result["metrics"]
        else:
            job_status[job_id]["status"] = "COMPLETED"
            job_status[job_id]["message"] = "Benchmark completed successfully"
        
        job_status[job_id]["progress"] = 1.0
        logger.info(f"Benchmark job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in benchmark job {job_id}: {str(e)}")
        job_status[job_id]["status"] = "FAILED"
        job_status[job_id]["message"] = f"Error: {str(e)}"

@router.post("/v1/evaluate",
    response_model=EvaluateResponse,
    status_code=status.HTTP_200_OK,
)
async def evaluate_model(request: Union[TrainingEvaluateRequest, BenchmarkEvaluateRequest], background_tasks: BackgroundTasks):
    """
    Handle evaluation requests, supporting both training and benchmark evaluations.
    FastAPI will automatically validate and convert the request to the appropriate model.
    """
    try:
        # Convert Pydantic model to dict for consistency with existing code
        request_dict = request.dict()
        evaluation_type = request.evaluation_type
        model_name = request.model_name_or_path
        
        logger.info(f"Received {evaluation_type} evaluation request for model: {model_name}")
        
        if evaluation_type == "benchmark":
            return await handle_benchmark_evaluation(request_dict, background_tasks)
        else:
            return await handle_training_evaluation(request_dict, background_tasks)
            
    except Exception as e:
        logger.error(f"Error handling evaluation request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_training_evaluation(request: dict, background_tasks: BackgroundTasks):
    """Handle training evaluation request."""
    # Extract required fields for training evaluation
    model_name = request.get("model_name_or_path")
    eval_dataset = request.get("eval_dataset")
    
    if not eval_dataset:
        raise HTTPException(status_code=400, detail="Evaluation dataset is required")
    
    # Process dataset
    processed_datasets, custom_datasets_found, dataset_details = process_datasets([eval_dataset])
    
    if not processed_datasets:
        raise HTTPException(status_code=400, detail="No valid datasets provided")
    
    # Prepare parameters
    full_params = {
        "model_name_or_path": model_name,
        "adapter_name_or_path": request.get("adapter_name_or_path"),
        "stage": request.get("stage", "sft"),
        "eval_dataset": ','.join(processed_datasets),
        "dataset": ','.join(processed_datasets),
        "has_custom_datasets": custom_datasets_found,
        "do_eval": True,
        "evaluation_type": "training"
    }
    
    # Add output directory if specified, otherwise generate one
    if request.get("output_dir"):
        full_params["output_dir"] = request["output_dir"]
    else:
        model_short_name = model_name.split('/')[-1]
        finetuning_type = request.get("finetuning_type", "lora")
        timestamp = time.strftime("%Y-%m-%d-%H-%M-%S")
        full_params["output_dir"] = f"saves/{model_short_name}/{finetuning_type}/eval_{timestamp}"
    
    # Add token if provided
    if request.get("hub_token"):
        full_params["hub_token"] = request["hub_token"]
        os.environ["HF_TOKEN"] = request["hub_token"]
        os.environ["HUGGING_FACE_HUB_TOKEN"] = request["hub_token"]
        logger.info("Token provided for evaluation (set in environment variables)")
    else:
        os.environ["HF_TOKEN"] = ''
        os.environ["HUGGING_FACE_HUB_TOKEN"] = ''
        
    # Add all other parameters from the request
    for key, value in request.items():
        if key not in ["model_name_or_path", "adapter_name_or_path", "stage", "eval_dataset", 
                       "output_dir", "hub_token"]:
            full_params[key] = value
    
    # Add detailed dataset information
    if dataset_details:
        full_params["dataset_details"] = dataset_details
        
    # Generate a job ID
    job_id = f"eval-{hash(model_name)}-{int(time.time())}"

    # Store job status
    job_status[job_id] = {
        "status": "PENDING",
        "progress": 0.0,
        "message": "Training evaluation job queued",
        "parameters": full_params
    }

    # Schedule the evaluation as a background task
    print(f"Scheduling training evaluation job {job_id} with parameters: {full_params}")
    background_tasks.add_task(_run_evaluation_task, job_id, full_params)
    
    logger.info(f"Training evaluation job {job_id} scheduled for background execution")
    return {"job_id": job_id, "status": "PENDING"}

async def handle_benchmark_evaluation(request: dict, background_tasks: BackgroundTasks):
    """Handle benchmark evaluation request."""
    # Extract required fields for benchmark evaluation
    model_name = request.get("model_name_or_path")
    task = request.get("task")
    
    if not task:
        raise HTTPException(status_code=400, detail="Benchmark task is required")
    
    # Prepare parameters
    full_params = {
        "model_name_or_path": model_name,
        "task": task,
        "task_dir": request.get("task_dir", "evaluation"),
        "template": request.get("template", "fewshot"),
        "evaluation_type": "benchmark"
    }
    
    # Add save directory if specified, otherwise generate one
    if request.get("save_dir"):
        full_params["save_dir"] = request["save_dir"]
    else:
        model_short_name = model_name.split('/')[-1]
        timestamp = time.strftime("%Y-%m-%d-%H-%M-%S")
        full_params["save_dir"] = f"{task}_results_{model_short_name}_{timestamp}"
    
    # Add token if provided
    if request.get("hub_token"):
        full_params["hub_token"] = request["hub_token"]
        os.environ["HF_TOKEN"] = request["hub_token"]
        os.environ["HUGGING_FACE_HUB_TOKEN"] = request["hub_token"]
        logger.info("Token provided for benchmark (set in environment variables)")
    else:
        os.environ["HF_TOKEN"] = ''
        os.environ["HUGGING_FACE_HUB_TOKEN"] = ''
    
    # Add advanced benchmark parameters
    advanced_params = ["n_shot", "lang", "batch_size", "seed", "trust_remote_code"]
    for param in advanced_params:
        if param in request:
            full_params[param] = request[param]
    
    # Generate a job ID
    job_id = f"bench-{hash(model_name)}-{int(time.time())}"

    # Store job status
    job_status[job_id] = {
        "status": "PENDING",
        "progress": 0.0,
        "message": "Benchmark evaluation job queued",
        "parameters": full_params
    }

    # Schedule the benchmark as a background task
    print(f"Scheduling benchmark job {job_id} with parameters: {full_params}")
    background_tasks.add_task(_run_benchmark_task, job_id, full_params)
    
    logger.info(f"Benchmark job {job_id} scheduled for background execution")
    return {"job_id": job_id, "status": "PENDING"}
