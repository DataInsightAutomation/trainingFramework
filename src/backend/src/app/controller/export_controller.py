from fastapi import APIRouter, HTTPException, status
from app.response.response import ModelsResponse, DatasetsResponse, Model, Dataset
import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks
import time
import os
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..api.router import job_status
from app.services.export.export import export_model as run_export_job

# Set up logger using centralized configuration - will only configure once
import logging as logger
# Create router for resources
router = APIRouter(
    prefix="",
    tags=["Export"],
    responses={404: {"description": "Resource not found"}},
)

class ExportRequest(BaseModel):
    model_name_or_path: str
    adapter_name_or_path: str
    export_dir: str
    export_hub_model_id: Optional[str] = None
    hf_hub_token: Optional[str] = None
    
    # Advanced options - remove default values
    quantization: Optional[bool] = None
    quantization_bits: Optional[int] = None
    merge_adapter: Optional[bool] = None
    export_adapter: Optional[bool] = None
    push_to_hub: Optional[bool] = None
    private: Optional[bool] = None
    
    # Export config fields - remove default values
    export_size: Optional[int] = None
    export_device: Optional[str] = None
    export_legacy_format: Optional[bool] = None
    export_quantization_dataset: Optional[str] = None
    export_quantization_nsamples: Optional[int] = None
    export_quantization_maxlen: Optional[int] = None
    export_quantization_bit: Optional[int] = None

class ExportResponse(BaseModel):
    job_id: str
    status: str

def get_default_export_config() -> Dict[str, Any]:
    """Return default configuration for export."""
    return {
        # "quantization": True,
        "quantization_bits": 8,
        # "merge_adapter": True,
        "export_adapter": False,
        "push_to_hub": False,
        "private": False,
        "export_size": 5,
        "export_device": "auto",
        "export_legacy_format": False,
        # "export_quantization_nsamples": 128,
        # "export_quantization_maxlen": 1024,
        # "export_quantization_bit": 8,
        # "export_quantization_dataset": None,
    }

async def _run_export_task(job_id: str, params: dict):
    """Background task to run model export and update job status."""
    try:
        logger.info(f"Starting export job {job_id} with parameters: {params}")
        job_status[job_id]["status"] = "RUNNING"
        job_status[job_id]["message"] = "Export in progress"
        
        # Run the actual export
        logger.debug(f"Calling run_export_job with job_id: {job_id}")
        result = await run_export_job(job_id, params)
        logger.debug(f"Export job result: {result}")
        
        # Update job status based on result
        if result and isinstance(result, dict):
            status_value = result.get("status", "COMPLETED").upper()
            message_value = result.get("message", "Export completed")
            logger.info(f"Export job {job_id} completed with status: {status_value}, message: {message_value}")
            
            job_status[job_id]["status"] = status_value
            job_status[job_id]["message"] = message_value
        else:
            logger.info(f"Export job {job_id} completed with default success status")
            job_status[job_id]["status"] = "COMPLETED"
            job_status[job_id]["message"] = "Export completed successfully"
        
        job_status[job_id]["progress"] = 1.0
        logger.info(f"Export job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in export job {job_id}: {str(e)}", exc_info=True)  # Added exc_info for full traceback
        job_status[job_id]["status"] = "FAILED"
        job_status[job_id]["message"] = f"Error: {str(e)}"

@router.post("/v1/export",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
)
async def export_model(request: ExportRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Export request received for model: {request.model_name_or_path}, adapter: {request.adapter_name_or_path}")
        
        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        logger.debug(f"Request parameters: {request_dict}")
        
        # Get default configuration
        default_config = get_default_export_config()
        
        # Prepare export parameters starting with defaults
        export_params = default_config.copy()
        
        # Update with provided values from request (overriding defaults)
        export_params.update({
            "model_name_or_path": request.model_name_or_path,
            "adapter_name_or_path": request.adapter_name_or_path,
            "export_dir": request.export_dir,
        })
        
        # Add optional parameters if provided (will override defaults)
        for key, value in request_dict.items():
            if value is not None and key not in ["model_name_or_path", "adapter_name_or_path", "export_dir", "hf_hub_token"]:
                export_params[key] = value
                
        # Handle hub model ID separately
        if request.export_hub_model_id:
            export_params["export_hub_model_id"] = request.export_hub_model_id
        
        # Generate a job ID
        job_id = f"export--{hash(request.model_name_or_path)}-{int(time.time())}"
        logger.info(f"Generated job ID: {job_id}")
        
        # Handle HF token through environment variables
        if hasattr(request, 'hf_hub_token') and request.hf_hub_token:
            os.environ["HF_TOKEN"] = request.hf_hub_token
            os.environ["HUGGING_FACE_HUB_TOKEN"] = request.hf_hub_token
            logger.info("Token provided for export (set in environment variables)")
        else:
            os.environ["HF_TOKEN"] = ''
            os.environ["HUGGING_FACE_HUB_TOKEN"] = ''
            logger.info("No token provided for export")
            
        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Export job queued",
            "parameters": export_params
        }
        logger.debug(f"Initial job status set: {job_status[job_id]}")
        
        background_tasks.add_task(_run_export_task, job_id, export_params)
        
        logger.info(f"Export job {job_id} scheduled for background execution")
        return {"job_id": job_id, "status": "PENDING"}
    
    except Exception as e:
        logger.error(f"Error handling export request: {str(e)}", exc_info=True)  # Added exc_info for full traceback
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/export/status/{job_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_export_status(job_id: str):
    """Get the status of an export job."""
    logger.info(f"Status request received for export job: {job_id}")
    
    if job_id not in job_status:
        logger.warning(f"Export job {job_id} not found in job_status")
        raise HTTPException(status_code=404, detail=f"Export job {job_id} not found")
    
    logger.info(f"Returning status for job {job_id}: {job_status[job_id]}")
    return job_status[job_id]