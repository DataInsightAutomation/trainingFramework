import asyncio
from http.client import HTTPException
import time
from app.response.response import TrainRequest, TrainResponse
from app.train.services.supervised_fine_tuning.sft import simulate_training
from ..api.router import job_status

# Dictionary to track status of all training jobs
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
        print('sleep awhile')
        # time.sleep(10)
        # Generate a job ID
        job_id = f"train-{hash(request.model_name)}-{int(time.time())}"

        # Store job status
        job_status[job_id] = {
            "status": "PENDING",
            "progress": 0.0,
            "message": "Job queued"
        }

        # Start a background task to run the training (simulated here)
        # In a real app, you'd start an actual training job
        # asyncio.create_task(simulate_training(job_id))
        await simulate_training(job_id)

        return {"job_id": job_id, "status": "PENDING"}
    except Exception as e:
        print(f"Error handling training request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
