import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks, Depends
import time
import os
import logging
from app.response.response import TrainRequest, TrainResponse
from app.services.train.supervised_fine_tuning.supervised_fine_tuning import simulate_training as run_training_job
from ..api.router import job_status
from app.config.training_defaults import get_default_config

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["Project"],
    responses={404: {"description": "Not found pipeline route"}},
)


def map_train_method_from_input(train_method: str) -> str:
    """
    Map the input train method to the internal representation.
    """
    if train_method == "supervised":
        return "sft"
    elif train_method == "rlhf":
        return "rlhf"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported train method: {train_method}")


def process_datasets(datasets: list[str]) -> tuple[list[str], bool, list[dict]]:
    """
    Process dataset list to handle custom datasets and create dataset details.
    
    Args:
        datasets: List of dataset names, possibly with 'custom:' prefix
        
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


async def _run_training_task(job_id: str, params: dict):
    """Background task to run training and update job status."""
    try:
        job_status[job_id]["status"] = "RUNNING"
        job_status[job_id]["message"] = "Training in progress"
        
        # Run the actual training
        result = await run_training_job(job_id, params)
        
        # Update job status based on result
        if result and isinstance(result, dict):
            job_status[job_id]["status"] = result.get("status", "COMPLETED").upper()
            job_status[job_id]["message"] = result.get("message", "Training completed")
        else:
            job_status[job_id]["status"] = "COMPLETED"
            job_status[job_id]["message"] = "Training completed successfully"
        
        job_status[job_id]["progress"] = 1.0
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in training job {job_id}: {str(e)}")
        job_status[job_id]["status"] = "FAILED"
        job_status[job_id]["message"] = f"Error: {str(e)}"


@router.post("/v1/train",
    response_model=TrainResponse,
    status_code=status.HTTP_200_OK,
)
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    try:
        # Determine if this is a basic or advanced request
        is_advanced = any(getattr(request, field) is not None for field in [
            'trust_remote_code', 'stage', 'finetuning_type', 'lora_rank', 'lora_target',
            'template', 'cutoff_len', 'max_samples', 'overwrite_cache', 'preprocessing_num_workers',
            'per_device_train_batch_size', 'gradient_accumulation_steps', 'learning_rate',
            'num_train_epochs', 'lr_scheduler_type', 'warmup_ratio', 'bf16',
            'output_dir', 'logging_steps', 'save_steps', 'plot_loss', 'overwrite_output_dir'
        ])
        
        logger.info(f"Request type: {'Advanced' if is_advanced else 'Basic'}")
        logger.info(f"Model: {request.model_name}, Method: {request.train_method}")
        
        # Process datasets
        processed_datasets, custom_datasets_found, dataset_details = process_datasets(request.datasets)
        
        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        
        # Start with basic parameters
        full_params = {
            "model_name_or_path": request.model_name,
            "model_path": request.model_path,
            "dataset": ','.join(processed_datasets) if processed_datasets else None,
            "has_custom_datasets": custom_datasets_found,
            "stage": map_train_method_from_input(request.train_method), 
            "do_train": True,
        }
        
        # Add advanced parameters if provided
        if is_advanced:
            advanced_params = {k: v for k, v in request_dict.items() 
                            if k not in ["model_name", "model_path", "datasets", "train_method"]}
            full_params.update(advanced_params)

        # Apply method-specific defaults for missing parameters
        defaults = get_default_config(request.train_method)
        for param_name, default_value in defaults.items():
            if param_name not in full_params:
                full_params[param_name] = default_value
        
        # Generate output directory if not specified
        if "output_dir" not in full_params:
            model_short_name = request.model_name.split('/')[-1]
            training_method = request.train_method
            finetuning_type = full_params.get("finetuning_type", "default")
            stage = full_params.get("stage", "default")
            
            full_params["output_dir"] = f"saves/{model_short_name}/{training_method}/{finetuning_type}/{stage}"
            logger.info(f"Generated output_dir: {full_params['output_dir']}")

        # Use model_path if provided
        if request.model_path:
            logger.info('Using model_path instead of model_name')
            full_params["model_name_or_path"] = request.model_path
        
        # Add detailed dataset information
        if dataset_details:
            full_params["dataset_details"] = dataset_details
        
        # Remove model_path to avoid confusion
        if "model_path" in full_params:
            del full_params["model_path"]
            
        # Generate a job ID
        job_id = f"train-{hash(request.model_name)}-{int(time.time())}"

        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Job queued",
            "parameters": full_params
        }

        # Schedule the training as a background task
        background_tasks.add_task(_run_training_task, job_id, full_params)
        # await _run_training_task(job_id, full_params)
        
        logger.info(f"Job {job_id} scheduled for background execution")
        return {"job_id": job_id, "status": "PENDING"}
    except Exception as e:
        logger.error(f"Error handling training request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
