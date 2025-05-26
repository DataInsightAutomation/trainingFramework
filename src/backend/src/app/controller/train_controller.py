import asyncio
from http.client import HTTPException
import time
import os
from app.response.response import TrainRequest, TrainResponse
from app.train.services.supervised_fine_tuning.sft import simulate_training
from ..api.router import job_status
from app.config.training_defaults import get_default_config

from fastapi import status
from fastapi import APIRouter, Depends

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

@router.post("/v1/train",
    response_model=TrainResponse,
    status_code=status.HTTP_200_OK,
)
async def train_model(request: TrainRequest):
    try:
        # Determine if this is a basic or advanced request
        is_advanced = any(getattr(request, field) is not None for field in [
            'trust_remote_code', 'stage', 'finetuning_type', 'lora_rank', 'lora_target',
            'template', 'cutoff_len', 'max_samples', 'overwrite_cache', 'preprocessing_num_workers',
            'per_device_train_batch_size', 'gradient_accumulation_steps', 'learning_rate',
            'num_train_epochs', 'lr_scheduler_type', 'warmup_ratio', 'bf16',
            'output_dir', 'logging_steps', 'save_steps', 'plot_loss', 'overwrite_output_dir'
        ])
        
        print(f"Request type: {'Advanced' if is_advanced else 'Basic'}")
        
        # Print basic request information
        print("Basic Request Details:")
        print(f"  - Model Name: {request.model_name}")
        print(f"  - Model Path: {request.model_path}")
        print(f"  - Datasets: {request.datasets}")
        print(f"  - Train Method: {request.train_method}")
        
        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        
        # Start with basic parameters
        full_params = {
            "model_name_or_path": request.model_name,
            "model_path": request.model_path,
            "dataset": ','.join(request.datasets) if request.datasets else None,
            # stage is the training method mapped to internal representation
            "stage": map_train_method_from_input(request.train_method), 
            "do_train": True, # seems like need, not sure when it should no need.
        }
        
        if is_advanced:
            # In advanced mode, add all provided advanced parameters
            advanced_params = {k: v for k, v in request_dict.items() 
                            if k not in ["model_name", "model_path", "datasets", "train_method"]}
            
            if advanced_params:
                print("Advanced parameters provided:")
                for field_name, field_value in advanced_params.items():
                    print(f"  - {field_name}: {field_value}")
                    full_params[field_name] = field_value

        # Apply method-specific defaults for missing parameters
        defaults = get_default_config(request.train_method)
        
        print(f"Applying defaults for {request.train_method} method")
        for param_name, default_value in defaults.items():
            if param_name not in full_params:
                full_params[param_name] = default_value
                print(f"  - Using default for {param_name}: {default_value}")
        
        # Generate output directory if not specified
        if "output_dir" not in full_params:
            model_short_name = request.model_name.split('/')[-1]
            training_method = request.train_method
            finetuning_type = full_params.get("finetuning_type", "default")
            stage = full_params.get("stage", "default")
            
            full_params["output_dir"] = f"saves/{model_short_name}/{training_method}/{finetuning_type}/{stage}"
            print(f"  - Generated output_dir: {full_params['output_dir']}")

        # Ensure model_name_or_path is either a local path or remote model path
        if request.model_path:
            print('model_path is not provided, using model_name instead')
            full_params["model_name_or_path"] = request.model_name
        del full_params["model_path"]
            
        # Generate a job ID
        job_id = f"train-{hash(request.model_name)}-{int(time.time())}"

        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Job queued",
            "parameters": full_params  # Store the full parameter set
        }

        # Start a background task to run the training
        await simulate_training(job_id, full_params)
        print("job completed for job_id:", job_id)
        return {"job_id": job_id, "status": "PENDING"}
    except Exception as e:
        print(f"Error handling training request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
