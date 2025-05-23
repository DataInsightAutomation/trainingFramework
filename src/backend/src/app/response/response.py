from pydantic import BaseModel, Field
from typing import List, Optional

class TrainResponse(BaseModel):
    job_id: str
    status: str

class TrainRequest(BaseModel):
    # Basic parameters (always required)
    model_name: str
    model_path: str
    datasets: list[str]
    train_method: str
    
    # Advanced parameters (all optional with defaults)
    # Model configuration
    trust_remote_code: bool = Field(default=True)
    stage: str = Field(default="sft")
    do_train: bool = Field(default=True)
    
    # Fine-tuning configuration
    finetuning_type: str = Field(default="lora")
    lora_rank: int = Field(default=8)
    lora_target: str = Field(default="all")
    template: str = Field(default="llama3")
    
    # Dataset configuration
    cutoff_len: int = Field(default=2048)
    max_samples: Optional[int] = Field(default=None)
    overwrite_cache: bool = Field(default=False)
    preprocessing_num_workers: int = Field(default=4)
    dataloader_num_workers: int = Field(default=0)
    
    # Output configuration
    output_dir: Optional[str] = Field(default=None)
    logging_steps: int = Field(default=10)
    save_steps: int = Field(default=500)
    plot_loss: bool = Field(default=True)
    overwrite_output_dir: bool = Field(default=True)
    save_only_model: bool = Field(default=False)
    report_to: str = Field(default="none")
    
    # Training parameters
    per_device_train_batch_size: int = Field(default=1)
    gradient_accumulation_steps: int = Field(default=8)
    learning_rate: float = Field(default=0.0001)
    num_train_epochs: float = Field(default=1.0)
    lr_scheduler_type: str = Field(default="cosine")
    warmup_ratio: float = Field(default=0.1)
    bf16: bool = Field(default=True)
    resume_from_checkpoint: Optional[str] = Field(default=None)
    dataset_dir: Optional[str] = Field(default=None)
    
    # Additional parameters can be passed without validation
    additional_params: Optional[dict] = Field(default=None)

    class Config:
        # This allows additional fields to be accepted
        extra = "allow"

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float = 0.0
    message: str = ""

# New response models for model and dataset endpoints
class Model(BaseModel):
    id: str
    name: str
    description: str = ""

class Dataset(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = ""
    size_mb: float = 0.0

class ModelsResponse(BaseModel):
    models: List[Model]

class DatasetsResponse(BaseModel):
    datasets: List[Dataset]