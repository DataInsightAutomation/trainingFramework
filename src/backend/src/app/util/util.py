from enum import Enum
import importlib
import torch
import gc

# Fix missing imports for torch utility functions
def _is_package_available(name: str) -> bool:
    return importlib.util.find_spec(name) is not None
def is_ray_available():
    return _is_package_available("ray")
def is_torch_xpu_available():
    return hasattr(torch, 'xpu') and torch.xpu.is_available()

def is_torch_npu_available():
    return hasattr(torch, 'npu') and torch.npu.is_available()

def is_torch_mps_available():
    return hasattr(torch, 'mps') and torch.mps.is_available()

def is_torch_cuda_available():
    return torch.cuda.is_available()

def torch_gc() -> None:
    """Collect the device memory."""
    gc.collect()
    if is_torch_xpu_available():
        torch.xpu.empty_cache()
    elif is_torch_npu_available():
        torch.npu.empty_cache()
    elif is_torch_mps_available():
        torch.mps.empty_cache()
    elif is_torch_cuda_available():
        torch.cuda.empty_cache()

class EngineName(str, Enum):
    """Supported inference engine types."""
    HF = "huggingface"
    VLLM = "vllm"
    SGLANG = "sglang"
