import asyncio
import logging as logger
import os
import time
import random
from typing import Dict, Any, Optional
from ..train.supervised_fine_tuning.supervised_fine_tuning import _prepare_training_arguments, _clean_training_args, run_training_job

# temporray, use the training style but adaption first.
async def _run_evaluate(job_id: str, train_args: Dict[str, Any]):

    # train_args['per_device_eval_batch_size'] = 64
    # train_args["predict_with_generate"] = True
    # # train_args["predict_with_generate"] = False

    return await run_training_job(job_id, train_args)


async def simulate_evaluation(job_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulate the evaluation process of a model.
    
    In a real implementation, this would call the appropriate evaluation code
    based on the provided parameters.
    
    Args:
        job_id: The unique identifier for this evaluation job
        params: Dictionary containing evaluation parameters
        
    Returns:
        Dictionary with evaluation results and status
    """
    logger.info(f"Starting evaluation job {job_id} with parameters: {params}")
    
    # Get key parameters
    model_name = params.get("model_name_or_path", "unknown")
    adapter_path = params.get("adapter_name_or_path", "unknown")
    datasets = params.get("eval_dataset", "").split(",")
    
    # Log key information
    logger.info(f"Evaluating model: {model_name}")
    logger.info(f"Using adapter: {adapter_path}")
    logger.info(f"Datasets: {datasets}")
    
    # Simulate work with progress updates
    await _run_evaluate(job_id, params)
    
    # Generate simulated metrics
    metrics = {}
    for dataset in datasets:
        dataset_name = dataset.strip()
        if dataset_name:
            # Simulate different metrics depending on the finetuning method
            metrics[dataset_name] = {
                "accuracy": round(random.uniform(0.7, 0.95), 4),
                "f1": round(random.uniform(0.65, 0.9), 4),
                "precision": round(random.uniform(0.6, 0.95), 4),
                "recall": round(random.uniform(0.6, 0.95), 4),
            }
            
            # Add BLEU score for text generation tasks
            if params.get("predict_with_generate", False):
                metrics[dataset_name]["bleu"] = round(random.uniform(20, 40), 2)
    
    # In a real implementation, we would save the results to a file
    output_dir = params.get("output_dir", "")
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"Results would be saved to {output_dir}")
    
    # Return results
    return {
        "status": "COMPLETED",
        "message": f"Evaluation of {model_name} completed successfully",
        "metrics": metrics,
        "job_id": job_id,
        "completion_time": time.time()
    }

# For future implementation: real evaluation function
async def evaluate_model(job_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform actual model evaluation using the provided parameters.
    This would use libraries like transformers, datasets, etc.
    """
    # Real implementation would go here
    # For now, delegate to the simulation function
    return await simulate_evaluation(job_id, params)
