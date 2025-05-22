from http.client import HTTPException
from app.response.response import StatusResponse
from fastapi import status, FastAPI
from fastapi import APIRouter, Depends
from ..api.router import job_status

router = APIRouter(
    prefix="",
    tags=["Project"],
    responses={404: {"description": "Not found pipeline route"}},
)

@router.get("/v1/train/{job_id}/status",
    response_model=StatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_job_status(job_id: str):
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    status_info = job_status[job_id]
    return {
        "job_id": job_id,
        **status_info
    }