import os
from typing import Optional, Any, Dict, List
import logging
import json

from app.util.util import is_ray_available
from llamafactory.train.callbacks import TrainerCallback
from llamafactory.hparams import get_ray_args, get_train_args, read_args
from llamafactory.train.trainer_utils import get_ray_trainer
from llamafactory.train.tuner import _training_function
from llamafactory.data import get_template_and_fix_tokenizer
from llamafactory.model import load_tokenizer

if is_ray_available():
    import ray
    from ray.train.huggingface.transformers import RayTrainReportCallback

from .dataset_adapters import get_dataset

logger = logging.getLogger(__name__)

async def run_training_job(job_id: str, train_args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run a training job with the specified parameters.
    
    Args:
        job_id: Unique identifier for the training job
        train_args: Dictionary of training arguments
        
    Returns:
        Dict containing job status information
    """
    # Use default empty dict instead of None check
    train_args = _prepare_training_arguments(train_args or {})
    
    result = {"status": "success", "job_id": job_id}
    
    try:
        # Extract and process dataset information
        dataset_details = train_args.pop('dataset_details', None)
        if not dataset_details:
            logger.warning(f"No dataset details provided for job {job_id}")
            result["status"] = "warning"
            result["message"] = "No dataset details provided"
            return result
            
        dataset_name = _extract_dataset_name(dataset_details)
        dataset_name_json = json.dumps(dataset_details) if dataset_details else None
        
        # Remove keys that might cause conflicts
        _clean_training_args(train_args)
        
        # Set up paths for tokenized dataset
        if dataset_name:
            save_dir = os.path.join(os.getcwd(), '../data/processed_datasets', dataset_name.replace('/', '_'))
            train_args['tokenized_path'] = save_dir
        
        # Parse arguments and prepare for training
        model_args, data_args, training_args, finetuning_args, generating_args = get_train_args(train_args)
        
        # Use extended data arguments to control saving behavior
        # Load tokenizer and template
        tokenizer_module = load_tokenizer(model_args)
        tokenizer = tokenizer_module["tokenizer"]
        template = get_template_and_fix_tokenizer(tokenizer, data_args)
        
        # Set dataset information and preprocess
        if dataset_name_json:
            data_args.dataset = dataset_name_json
            # Pre-process dataset
            get_dataset(template, model_args, data_args, training_args, stage="sft", **tokenizer_module)
        
        # Run the training
        logger.info(f"Starting training job {job_id}")
        _run_training(train_args)
        logger.info(f"Finished training job {job_id}")
        
        result["message"] = "Training completed successfully"
        return result
        
    except Exception as e:
        logger.error(f"Error in training job {job_id}: {str(e)}")
        result["status"] = "error"
        result["message"] = str(e)
        return result


def _prepare_training_arguments(train_args: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare and enhance training arguments."""
    train_args = train_args.copy()
    train_args["dataset_dir"] = os.path.join(os.getcwd(), '../data')
    train_args["dataloader_num_workers"] = 0
    return train_args


def _extract_dataset_name(dataset_details: Any) -> Optional[str]:
    """Extract dataset name from dataset details."""
    if dataset_details and isinstance(dataset_details, list) and len(dataset_details) > 0:
        return dataset_details[0].get('name')
    return None


def _clean_training_args(train_args: Dict[str, Any]) -> None:
    """Remove unnecessary or conflicting keys from training arguments."""
    keys_to_remove = ["dataset_from_huggingface", "dataset_details", 
                       "has_custom_datasets", "dataset_name"]
    for key in keys_to_remove:
        if key in train_args:
            del train_args[key]


def _run_training(args: Dict[str, Any], callbacks: Optional[List[TrainerCallback]] = None) -> None:
    """Run the training with the specified arguments."""
    args = read_args(args)
    ray_args = get_ray_args(args)
    
    callbacks = callbacks or []
    
    if ray_args.use_ray:
        callbacks.append(RayTrainReportCallback())
        trainer = get_ray_trainer(
            training_function=_training_function,
            train_loop_config={"args": args, "callbacks": callbacks},
            ray_args=ray_args,
        )
        trainer.fit()
    else:
        _training_function(config={"args": args, "callbacks": callbacks})


# Update the alias for backward compatibility
async def simulate_training(job_id: str, train_args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return await run_training_job(job_id, train_args)