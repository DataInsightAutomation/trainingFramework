from fastapi import APIRouter, HTTPException, status
from app.response.response import ModelsResponse, DatasetsResponse, Model, Dataset
import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks
import time
import os
import logging
from pydantic import BaseModel, Field
from typing import Optional, List
from ..api.router import job_status
from app.services.export.export import export_model as run_export_job
from .train_controller import process_datasets


logger = logging.getLogger(__name__)

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
    # export_format: str = "safetensors"
    export_hub_model_id: Optional[str] = None
    hf_hub_token: Optional[str] = None
    
    # Advanced options
    quantization: Optional[bool] = False
    quantization_bits: Optional[int] = 8
    merge_adapter: Optional[bool] = True
    push_to_hub: Optional[bool] = False
    private: Optional[bool] = True

class ExportResponse(BaseModel):
    job_id: str
    status: str

async def _run_export_task(job_id: str, params: dict):
    """Background task to run model export and update job status."""
    try:
        job_status[job_id]["status"] = "RUNNING"
        job_status[job_id]["message"] = "Export in progress"
        
        # Run the actual export
        result = await run_export_job(job_id, params)
        
        # Update job status based on result
        if result and isinstance(result, dict):
            job_status[job_id]["status"] = result.get("status", "COMPLETED").upper()
            job_status[job_id]["message"] = result.get("message", "Export completed")
        else:
            job_status[job_id]["status"] = "COMPLETED"
            job_status[job_id]["message"] = "Export completed successfully"
        
        job_status[job_id]["progress"] = 1.0
        logger.info(f"Export job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in export job {job_id}: {str(e)}")
        job_status[job_id]["status"] = "FAILED"
        job_status[job_id]["message"] = f"Error: {str(e)}"

@router.post("/v1/export",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
)
async def export_model(request: ExportRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Export request received for model: {request.model_name_or_path}")
        
        # Get provided fields (excluding None values)
        request_dict = request.dict(exclude_none=True)
        
        # Set environment variables for HuggingFace token if provided
        
        # Prepare export parameters
        export_params = {
            "model_name_or_path": request.model_name_or_path,
            "adapter_name_or_path": request.adapter_name_or_path,
            "export_dir": request.export_dir,
            # "export_format": request.export_format,
        }

        # processed_datasets, custom_datasets_found, dataset_details = process_datasets(request.datasets)

        # Add optional parameters
        if request.export_hub_model_id:
            export_params["export_hub_model_id"] = request.export_hub_model_id
        
        # Add advanced parameters if provided
        export_params.update({k: v for k, v in request_dict.items() 
                          if k not in ["model_name_or_path", "adapter_name_or_path", 
                                       "export_dir", "export_format", 
                                       "export_hub_model_id", "hf_hub_token"]})
        
        # Generate a job ID
        job_id = f"export-{hash(request.model_name_or_path)}-{int(time.time())}"
        if hasattr(request, 'hf_hub_token') and request.hf_hub_token:
            # export_params["hub_token"] = request.hf_hub_token  # Add to params for functions that accept it directly
            # export_params["push_to_hub"] = True  # Ensure we push to hub if token is provided
            os.environ["HF_TOKEN"] = request.hf_hub_token    # Set in environment for libraries that check env vars
            # Add this additional environment variable for better compatibility
            os.environ["HUGGING_FACE_HUB_TOKEN"] = request.hf_hub_token
            logger.info("Token provided for training (set in environment variables)")
        else:
            os.environ["HF_TOKEN"] = ''    # Set in environment for libraries that check env vars
            os.environ["HUGGING_FACE_HUB_TOKEN"] = ''
        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Export job queued",
            "parameters": export_params
        }

        # Schedule the export as a background task
        background_tasks.add_task(_run_export_task, job_id, export_params)
        
        logger.info(f"Export job {job_id} scheduled for background execution")
        return {"job_id": job_id, "status": "PENDING"}
    
    except Exception as e:
        logger.error(f"Error handling export request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/export/status/{job_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def get_export_status(job_id: str):
    """Get the status of an export job."""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail=f"Export job {job_id} not found")
    
    return job_status[job_id]