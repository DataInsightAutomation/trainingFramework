from pydantic import BaseModel

class TrainResponse(BaseModel):
    job_id: str
    status: str

class TrainRequest(BaseModel):
    model_name: str
    model_path: str
    dataset: str
    train_method: str

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float = 0.0
    message: str = ""