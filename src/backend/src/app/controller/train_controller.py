import asyncio
from http.client import HTTPException
import time
import os
from app.response.response import TrainRequest, TrainResponse
from app.train.services.supervised_fine_tuning.sft import simulate_training
from ..api.router import job_status

from fastapi import status
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="",
    tags=["Project"],
    responses={404: {"description": "Not found pipeline route"}},
)


@router.post("/v1/train",
    response_model=TrainResponse,
    status_code=status.HTTP_200_OK,
)
async def train_model(request: TrainRequest):
    try:
        print(f"Received training request: {request}")
        
        # Print basic request information
        print("Basic Request Details:")
        print(f"  - Model Name: {request.model_name}")
        print(f"  - Model Path: {request.model_path}")
        print(f"  - Datasets: {request.datasets}")
        print(f"  - Train Method: {request.train_method}")
        
        # Prepare the full parameter set
        # Start with the basic parameters
        full_params = {
            "model_name_or_path": request.model_name,
            "model_path": request.model_path,
            "datasets": request.datasets,
            "train_method": request.train_method,
        }
        
        # Add all the advanced parameters with their defaults or provided values
        for field_name, field_value in request.dict().items():
            # Skip the basic parameters we already added
            if field_name in ["model_name", "model_path", "datasets", "train_method"]:
                continue
                
            # Skip null values
            if field_value is None:
                continue
                
            # Add to the full parameter set
            full_params[field_name] = field_value
        
        # Generate output directory if not specified
        if not request.output_dir:
            model_short_name = request.model_name.split('/')[-1]
            full_params["output_dir"] = f"saves/{model_short_name}/{request.finetuning_type}/{request.stage}"
        
        # Add dataset directory if not specified
        if not request.dataset_dir:
            full_params["dataset_dir"] = os.path.join(os.path.dirname(__file__), "../../../data")
        
        print("Full parameter set:")
        for key, value in full_params.items():
            print(f"  - {key}: {value}")
        
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
        await simulate_training(job_id)

        return {"job_id": job_id, "status": "PENDING"}
    except Exception as e:
        print(f"Error handling training request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
