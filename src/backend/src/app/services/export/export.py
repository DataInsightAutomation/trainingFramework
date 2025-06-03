import os
import logging
import shutil
import torch
import tempfile
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig
import time
from typing import Dict, Any, Optional
from huggingface_hub import HfApi
import json
from llamafactory.train.tuner import export_model as export_model_llama
from ..train.supervised_fine_tuning.supervised_fine_tuning import _prepare_training_arguments, _extract_dataset_name, _clean_training_args

logger = logging.getLogger(__name__)
async def export_model(job_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Export a model by merging base model with adapter and optionally
    applying quantization and uploading to HuggingFace Hub.
    
    Args:
        job_id: Unique identifier for the export job
        params: Dictionary containing export parameters
    
    Returns:
        Dictionary with export status and information
    """
    # Capture original temp dir and set a new one with more space
    original_tmpdir = os.environ.get('TMPDIR')
    home_tmpdir = os.path.join('/home/dut7042', 'export_tmp')
    os.makedirs(home_tmpdir, exist_ok=True)
    os.environ['TMPDIR'] = home_tmpdir
    
    try:
        logger.info(f"Starting export for job {job_id}")
        logger.info(f"Export parameters: {params}")
        logger.info(f"Using temporary directory: {home_tmpdir}")
        
        # Check disk space
        disk_info = shutil.disk_usage(home_tmpdir)
        free_gb = disk_info.free / (1024 * 1024 * 1024)
        logger.info(f"Available disk space: {free_gb:.2f} GB")
        
        if free_gb < 5:
            raise ValueError(f"Not enough disk space. Only {free_gb:.2f} GB available, minimum 5GB recommended.")
        
        # Get export directory from params or set default in home directory
        export_dir = params.get('export_dir', os.path.join('/home/dut7042', 'exports'))
        logger.info(f"Export directory set to: {export_dir}")
        
        # Store original export_dir before preparation
        original_export_dir = export_dir
        
        # Create export directory if it doesn't exist
        os.makedirs(export_dir, exist_ok=True)
        
        # Prepare parameters
        params = _prepare_training_arguments(params or {})
        
        # Ensure the export_dir parameter is preserved
        # if 'output_dir' not in params:
            # params['output_dir'] = export_dir
        
        # Extract and process dataset information
        _clean_training_args(params)
        
        # Store export-specific params before removal
        export_format = params.get('export_format', 'safetensors')
        merge_adapter = params.get('merge_adapter', True)
        push_to_hub = params.get('push_to_hub', False)
        export_hub_model_id = params.get('export_hub_model_id', None)
        
        # Log parameters after preparation
        logger.info(f"Prepared parameters: {params}")
        
        # Remove keys that might cause conflicts
        keys_to_remove = ['dataloader_num_workers', 'export_format', 'merge_adapter', 
                         'private', 'push_to_hub', 'quantization', 'quantization_bits']
        for key in keys_to_remove:
            if key in params:
                del params[key]

        # Call LlamaFactory export with additional logging
        logger.info(f"Calling export_model_llama with parameters: {params}")
        export_model_llama(params)
        logger.info(f"Export model completed successfully")

        # Return success result
        return {
            "status": "completed",
            "message": "Export completed successfully",
            "export_path": original_export_dir,
            "hub_model_id": export_hub_model_id if push_to_hub else None
        }
    
    except Exception as e:
        logger.error(f"Export failed for job {job_id}: {str(e)}")
        return {
            "status": "failed",
            "message": f"Export failed: {str(e)}"
        }
    finally:
        # Restore original temp dir
        if original_tmpdir:
            os.environ['TMPDIR'] = original_tmpdir
        else:
            os.environ.pop('TMPDIR', None)
        logger.info(f"Temporary directory restored to: {os.environ.get('TMPDIR', 'default system temp')}")
