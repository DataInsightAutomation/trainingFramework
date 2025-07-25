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

def process_datasets(datasets: list[str], stage: str = None, advanced_config: dict = None) -> tuple[list[str], bool, list[dict]]:
    """
    Process dataset list and automatically configure for the training stage.
    
    Args:
        datasets: List of dataset names
        stage: Training stage (rm, sft, dpo, etc.)
        advanced_config: Advanced configuration overrides from frontend
        
    Returns:
        processed_datasets: List of cleaned dataset names
        custom_datasets_found: Boolean indicating if custom datasets were found
        dataset_details: Dictionary with dataset configurations
    """
    processed_datasets = []
    custom_datasets_found = False
    dataset_details = {}
    
    if not datasets:
        return processed_datasets, custom_datasets_found, dataset_details
        
    # Parse advanced configuration
    auto_config = advanced_config.get('dataset_auto_config', True) if advanced_config else True
    ranking_override = advanced_config.get('dataset_ranking_override', 'auto') if advanced_config else 'auto'
    custom_mapping = advanced_config.get('custom_column_mapping', False) if advanced_config else False
    
    for dataset in datasets:
        # Handle custom dataset prefix
        if dataset.startswith('custom:'):
            custom_dataset = dataset[7:]  # Remove 'custom:' prefix
            custom_datasets_found = True
            logger.info(f"Detected custom dataset: {custom_dataset}")
            processed_datasets.append(custom_dataset)
        else:
            processed_datasets.append(dataset)
    
    # Create detailed dataset information with stage-specific configuration
    for ds in processed_datasets:
        dataset_details[ds] = {}
        
        # Check if it's a HuggingFace-style dataset path
        if '/' in ds and not os.path.exists(ds):
            dataset_details[ds]["hf_hub_url"] = ds
        else:
            dataset_details[ds]["file_name"] = ds
        
        # Configure ranking based on user preferences
        if auto_config and ranking_override == 'auto':
            # Auto-configure based on stage
            if stage == 'rm':
                dataset_details[ds]["ranking"] = True
                logger.info(f"🔧 Auto-configured dataset '{ds}' with ranking=True for RM training")
            else:
                dataset_details[ds]["ranking"] = False
                logger.info(f"🔧 Auto-configured dataset '{ds}' with ranking=False for {stage} training")
        else:
            # Use manual override
            if ranking_override == 'true':
                dataset_details[ds]["ranking"] = True
                logger.info(f"🔧 Manual override: dataset '{ds}' with ranking=True")
            elif ranking_override == 'false':
                dataset_details[ds]["ranking"] = False
                logger.info(f"🔧 Manual override: dataset '{ds}' with ranking=False")
            else:
                # Fallback to auto
                dataset_details[ds]["ranking"] = stage == 'rm'
        
        # Configure column mapping based on training stage requirements
        if custom_mapping and advanced_config:
            # Use custom column mapping from user
            if stage in ['rm', 'dpo', 'kto', 'orpo']:
                # These stages need preference/comparison columns
                dataset_details[ds]["columns"] = {
                    "prompt": advanced_config.get('prompt_column', 'instruction'),
                    "query": advanced_config.get('query_column', 'input'),
                    "chosen": advanced_config.get('chosen_column', 'chosen'),
                    "rejected": advanced_config.get('rejected_column', 'rejected')
                }
            elif stage in ['sft', 'pt']:
                # These stages need standard instruction/response columns
                dataset_details[ds]["columns"] = {
                    "prompt": advanced_config.get('prompt_column', 'instruction'),
                    "query": advanced_config.get('query_column', 'input'),
                    "response": advanced_config.get('response_column', 'output')
                }
            # Note: PPO doesn't need explicit column mapping as it uses the reward model
            logger.info(f"🔧 Custom column mapping applied to dataset '{ds}' for {stage}: {dataset_details[ds].get('columns', 'none')}")
        else:
            # Use automatic column mapping based on stage
            if stage == 'rm':
                # RM needs preference/comparison data
                dataset_details[ds]["columns"] = {
                    "prompt": "instruction",
                    "query": "input", 
                    "chosen": "chosen",
                    "rejected": "rejected"
                }
                logger.info(f"🔧 Auto-configured RM preference columns for dataset '{ds}'")
            elif stage in ['dpo', 'kto', 'orpo']:
                # Direct preference optimization also needs chosen/rejected
                dataset_details[ds]["columns"] = {
                    "prompt": "instruction",
                    "query": "input", 
                    "chosen": "chosen",
                    "rejected": "rejected"
                }
                logger.info(f"🔧 Auto-configured preference columns for {stage} on dataset '{ds}'")
            elif stage in ['sft', 'pt']:
                # Standard instruction/response training
                dataset_details[ds]["columns"] = {
                    "prompt": "instruction",
                    "query": "input",
                    "response": "output"
                }
                logger.info(f"🔧 Auto-configured standard columns for {stage} on dataset '{ds}'")
            # Note: PPO doesn't get explicit column mapping - it uses the reward model internally

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
