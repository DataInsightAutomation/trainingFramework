import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks, Depends
import time
import os
from app.response.response import TrainRequest, TrainResponse
from app.services.train.supervised_fine_tuning.supervised_fine_tuning import simulate_training as run_training_job
from ..api.router import job_status
from app.config.training_defaults import get_default_config
from app.util.util import process_datasets

import logging as logger
from typing import List

router = APIRouter(
    prefix="",
    tags=["Train"],
    responses={404: {"description": "Not found pipeline route"}},
)


def map_stage_to_llamafactory(stage: str) -> str:
    """
    Map the frontend stage directly to LLaMA-Factory stage.
    Frontend stages now directly correspond to LLaMA-Factory stages.
    """
    valid_stages = ["sft", "pt", "rm", "ppo", "dpo", "kto", "orpo"]
    if stage in valid_stages:
        return stage
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported stage: {stage}")


def map_finetuning_method_to_llamafactory(method: str, quantization_bit: int = None) -> dict:
    """
    Convert frontend finetuning method to LLaMA-Factory parameters.
    """
    if method == "qlora":
        return {"finetuning_type": "lora", "quantization_bit": 4}
    elif method == "lora":
        return {"finetuning_type": "lora"}
    elif method == "freeze":
        return {"finetuning_type": "freeze"}
    elif method == "full":
        return {"finetuning_type": "full"}
    else:
        # Default to lora if unknown
        return {"finetuning_type": "lora"}


def validate_dataset_for_stage(datasets: List[str], stage: str) -> bool:
    """
    Validate if datasets are compatible with the training stage.
    Note: This is a basic validation based on dataset names.
    The actual validation is done by LLaMA-Factory based on dataset_attr.ranking
    """
    logger.info(f"Validating datasets {datasets} for stage '{stage}'")
    
    incompatible_datasets = []
    
    for dataset in datasets:
        dataset_lower = dataset.lower()
        
        if stage == 'rm':
            # RM stage needs datasets with ranking=True attribute
            # This is just a heuristic check - the real check is done by LLaMA-Factory
            if 'rlhf' in dataset_lower and 'comparison' not in dataset_lower and 'ranking' not in dataset_lower:
                incompatible_datasets.append(dataset)
                logger.warning(f"Dataset '{dataset}' appears to be an RLHF preference dataset. "
                              f"RM training requires datasets with ranking=True attribute (comparison data).")
        
        elif stage in ['sft', 'pt', 'ppo']:
            # Standard stages should use instruction/chat datasets (ranking=False)
            if 'rlhf' in dataset_lower or 'preference' in dataset_lower:
                incompatible_datasets.append(dataset)
                logger.warning(f"Dataset '{dataset}' appears to be a preference dataset, not suitable for {stage}")
    
    # For preference stages (dpo, kto, orpo), we expect preference datasets
    # For other stages, we'll be more permissive and let LLaMA-Factory do the actual validation
    
    if incompatible_datasets:
        return False
    
    return True


def auto_configure_dataset_for_stage(datasets: List[str], stage: str) -> dict:
    """
    Automatically configure dataset attributes based on the training stage.
    This creates dataset overrides that will be passed to LLaMA-Factory.
    """
    dataset_overrides = {}
    
    for dataset_name in datasets:
        if stage == "rm":
            # For RM training, override to ranking=True
            dataset_overrides[dataset_name] = {"ranking": True}
            logger.info(f"🔧 Override dataset '{dataset_name}' to ranking=True for RM training")
        else:
            # For other stages, override to ranking=False  
            dataset_overrides[dataset_name] = {"ranking": False}
            logger.info(f"🔧 Override dataset '{dataset_name}' to ranking=False for {stage} training")
    
    return dataset_overrides


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
        # Get stage and finetuning method from request
        stage = getattr(request, 'stage', 'sft')  # Default to SFT if not provided
        finetuning_method = getattr(request, 'finetuning_method', 'lora')  # Default to LoRA
        
        # Map stage directly to LLaMA-Factory stage FIRST (before validation)
        validated_stage = map_stage_to_llamafactory(stage)
        
        # Determine if this is a basic or advanced request
        is_advanced = any(getattr(request, field, None) is not None for field in [
            'trust_remote_code', 'lora_rank', 'lora_target', 'lora_alpha', 'lora_dropout',
            'template', 'cutoff_len', 'max_samples', 'overwrite_cache', 'preprocessing_num_workers',
            'per_device_train_batch_size', 'gradient_accumulation_steps', 'learning_rate',
            'num_train_epochs', 'lr_scheduler_type', 'warmup_ratio', 'bf16',
            'output_dir', 'logging_steps', 'save_steps', 'plot_loss', 'overwrite_output_dir',
            'quantization_bit'
        ])
        
        logger.info(f"Request type: {'Advanced' if is_advanced else 'Basic'}")
        logger.info(f"Model: {request.model_name}, Stage: {validated_stage}, Method: {finetuning_method}")
        
        # Process datasets with stage-aware configuration
        # Extract advanced config from request if available  
        advanced_config = {}
        if is_advanced:
            advanced_config = {
                'custom_column_mapping': getattr(request, 'custom_column_mapping', False),
                'prompt_column': getattr(request, 'prompt_column', 'instruction'),
                'query_column': getattr(request, 'query_column', 'input'),
                'chosen_column': getattr(request, 'chosen_column', 'chosen'),
                'rejected_column': getattr(request, 'rejected_column', 'rejected'),
                'response_column': getattr(request, 'response_column', 'output')
            }
        
        processed_datasets, custom_datasets_found, dataset_details = process_datasets(
            request.datasets, 
            validated_stage, 
            advanced_config if advanced_config else None
        )

        logger.info(f"✅ Dataset auto-configured for stage '{validated_stage}'")

        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        
        # Map finetuning method to LLaMA-Factory parameters
        finetuning_config = map_finetuning_method_to_llamafactory(
            finetuning_method,
            getattr(request, 'quantization_bit', None)
        )
        
        # Start with basic LLaMA-Factory parameters
        full_params = {
            "model_name_or_path": request.model_name,
            "dataset": ','.join(processed_datasets) if processed_datasets else None,
            "stage": validated_stage,  # Direct mapping to LLaMA-Factory stage
            "do_train": True,
            # "ranking": ranking,
            **finetuning_config  # Apply finetuning type and quantization
        }
        
        # Add model path if provided
        if hasattr(request, 'model_path') and request.model_path:
            full_params["model_name_or_path"] = request.model_path
            logger.info('Using model_path instead of model_name')
            
        # Add token if provided
        if hasattr(request, 'token') and request.token:
            full_params["hub_token"] = request.token
            os.environ["HF_TOKEN"] = request.token
            os.environ["HUGGING_FACE_HUB_TOKEN"] = request.token
            logger.info("Token provided for training")
        else:
            os.environ["HF_TOKEN"] = ''
            os.environ["HUGGING_FACE_HUB_TOKEN"] = ''

        # Add LoRA parameters if using LoRA-based finetuning
        if finetuning_config.get("finetuning_type") == "lora":
            lora_params = {
                "lora_rank": getattr(request, 'lora_rank', 8),
                "lora_alpha": getattr(request, 'lora_alpha', 16),
                "lora_dropout": getattr(request, 'lora_dropout', 0.0),
                "lora_target": getattr(request, 'lora_target', 'all')
            }
            full_params.update({k: v for k, v in lora_params.items() if v is not None})

        # Add advanced parameters if provided
        if is_advanced:
            # Exclude frontend-specific fields that don't map to LLaMA-Factory
            excluded_fields = [
                "model_name", "model_path", "datasets", "stage", "finetuning_method", 
                "finetuning_type", "token",
                # Custom dataset configuration fields (used by process_datasets but not LLaMA-Factory)
                "custom_column_mapping", "prompt_column", "query_column", 
                "chosen_column", "rejected_column", "response_column", "train_method"
            ]
            advanced_params = {k: v for k, v in request_dict.items() 
                            if k not in excluded_fields}
            full_params.update(advanced_params)

        # Apply stage-specific defaults
        defaults = get_default_config(validated_stage)
        for param_name, default_value in defaults.items():
            if param_name not in full_params:
                full_params[param_name] = default_value
        
        # Generate output directory if not specified
        if "output_dir" not in full_params:
            model_short_name = request.model_name.split('/')[-1]
            finetuning_type = finetuning_config.get("finetuning_type", "lora")
            
            full_params["output_dir"] = f"saves/{model_short_name}/{validated_stage}/{finetuning_type}"
            logger.info(f"Generated output_dir: {full_params['output_dir']}")
        
        # Add detailed dataset information
        if dataset_details:
            full_params["dataset_details"] = dataset_details
        
        # Handle PPO stage specific requirements
        if validated_stage == "ppo":
            # PPO requires a reward model path
            reward_model_path = full_params.get("reward_model")
            if not reward_model_path:
                # Generate default reward model path
                model_short_name = request.model_name.split('/')[-1]
                reward_model_path = f"saves/{model_short_name}/rm/lora"
                full_params["reward_model"] = os.path.join(os.getcwd(), reward_model_path)
                logger.info(f"Using default reward model path: {full_params['reward_model']}")
        
        # Generate a job ID
        job_id = f"train-{hash(request.model_name)}-{int(time.time())}"

        # Store job statusj
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Job queued",
            "parameters": full_params
        }
        
        logger.info(f"LLaMA-Factory parameters: {full_params}")
        
        # Schedule the training as a background task
        background_tasks.add_task(_run_training_task, job_id, full_params)
        
        logger.info(f"Job {job_id} scheduled for background execution")
        return {"job_id": job_id, "status": "PENDING"}
        
    except Exception as e:
        import traceback
        logger.error("Error handling training request:\n" + traceback.format_exc())
        logger.error(f"Error handling training request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
