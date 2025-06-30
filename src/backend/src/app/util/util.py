from enum import Enum
import importlib
import torch
import gc
import logging as logger
import os

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

def process_datasets(datasets: list[str]) -> tuple[list[str], bool, list[dict]]:
    """
    Process dataset list to handle custom datasets and create dataset details.
    
    Args:
        datasets: List of dataset names, possibly with 'custom:' prefix
        
    Returns:
        processed_datasets: List of cleaned dataset names
        custom_datasets_found: Boolean indicating if custom datasets were found
        dataset_details: List of dictionaries with detailed dataset information
    """
    processed_datasets = []
    custom_datasets_found = False
    dataset_details = []
    
    if not datasets:
        return processed_datasets, custom_datasets_found, dataset_details
        
    for dataset in datasets:
        # Handle custom dataset prefix
        if dataset.startswith('custom:'):
            custom_dataset = dataset[7:]  # Remove 'custom:' prefix
            custom_datasets_found = True
            logger.info(f"Detected custom dataset: {custom_dataset}")
            processed_datasets.append(custom_dataset)
        else:
            processed_datasets.append(dataset)
    dataset_details = {}
    # Create detailed dataset information
    for ds in processed_datasets:
        # ds_info = {"name": ds}
        dataset_details[ds] = {}

        # Check if it's a HuggingFace-style dataset path
        if '/' in ds and not os.path.exists(ds):
            dataset_details[ds]["hf_hub_url"] = ds
        else:
            dataset_details[ds]["file_name"] = ds
            logger.warning(f"Unknown dataset type for: {ds}")

    
    return processed_datasets, custom_datasets_found, dataset_details


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
