import os
from typing import Optional, Any, Literal, Union, TYPE_CHECKING, Dict, List
import logging
import json
from dataclasses import dataclass

from datasets import load_from_disk

from llamafactory.hparams.data_args import DataArguments
from llamafactory.extras.misc import has_tokenized_data
from llamafactory.data.data_utils import get_dataset_module, split_dataset
import llamafactory.data.loader as llamafactory_loader
from llamafactory.extras.constants import DATA_CONFIG
from llamafactory.extras.misc import use_modelscope, use_openmind
from llamafactory.data.parser import DatasetAttr

if TYPE_CHECKING:
    from transformers import PreTrainedTokenizer, ProcessorMixin, Seq2SeqTrainingArguments
    from llamafactory.hparams import DataArguments, ModelArguments
    from llamafactory.data.data_utils import DatasetModule
    from llamafactory.template import Template

logger = logging.getLogger(__name__)


def override_get_dataset_list(dataset_names: Optional[list[str]], dataset_dir: str) -> list["DatasetAttr"]:
    """
    Get the attributes of datasets from a list of dataset names.
    
    Args:
        dataset_names: List of dataset names or JSON string of dataset details
        dataset_dir: Directory where datasets are stored
        
    Returns:
        List of DatasetAttr objects
    """
    logger.debug(f"Processing datasets: {dataset_names} from directory: {dataset_dir}")
    
    # Handle JSON input for dataset names
    try:
        dataset_details = json.loads(dataset_names) if isinstance(dataset_names, str) else dataset_names
        if isinstance(dataset_details, list) and all(isinstance(detail, dict) for detail in dataset_details):
            dataset_names = [dataset_detail["name"] for dataset_detail in dataset_details]
            logger.info(f"Parsed dataset names from details: {dataset_names}")
        else:
            logger.info(f"Using dataset names as provided: {dataset_names}")
    except (json.JSONDecodeError, TypeError):
        logger.info(f"Using dataset names as provided: {dataset_names}")
        dataset_details = None
    
    if dataset_names is None:
        dataset_names = []

    # Load dataset info from config file
    config_path = os.path.join(dataset_dir, DATA_CONFIG)
    try:
        with open(config_path) as f:
            dataset_info = json.load(f)
    except Exception as err:
        if len(dataset_names) != 0:
            raise ValueError(f"Cannot open dataset config at {config_path}: {str(err)}")
        dataset_info = {}

    # Process dataset details if available
    if dataset_details:
        for dataset_detail in dataset_details:
            _process_dataset_detail(dataset_detail, dataset_info)
    
    logger.debug(f"Final dataset info: {dataset_info}")
    
    # Create dataset attributes list
    dataset_list = _create_dataset_attributes(dataset_names, dataset_info)
    return dataset_list


def _process_dataset_detail(dataset_detail: Dict[str, Any], dataset_info: Dict[str, Any]) -> None:
    """Process a single dataset detail and update dataset_info accordingly."""
    if not isinstance(dataset_detail, dict):
        raise ValueError(f"Dataset detail {dataset_detail} is not a dictionary.")
    
    required_keys = ["name", "type"]
    for key in required_keys:
        if key not in dataset_detail:
            raise ValueError(f"Dataset detail {dataset_detail} does not contain '{key}' key.")
    
    dataset_name = dataset_detail["name"]
    data_type = dataset_detail.get("type", "local")
    
    if dataset_name not in dataset_info:
        dataset_info[dataset_name] = {}
    else:
        # Dataset info already exists, no need to update
        return
    
    dataset_info[dataset_name]["file_name"] = dataset_name
    dataset_info[dataset_name]['dataset_name'] = dataset_name
    
    # Set the appropriate URL field based on data_type
    type_to_field = {
        "huggingface": "hf_hub_url",
        "modelscope": "ms_hub_url",
        "openmind": "om_hub_url",
        "script": "script_url",
        "cloud_file": "cloud_file_name"
    }
    
    if data_type in type_to_field:
        dataset_info[dataset_name][type_to_field[data_type]] = dataset_name


def _create_dataset_attributes(dataset_names: List[str], dataset_info: Dict[str, Any]) -> List[DatasetAttr]:
    """Create DatasetAttr objects from dataset names and info."""
    dataset_list = []
    
    for name in dataset_names:
        if name not in dataset_info:
            raise ValueError(f"Undefined dataset {name} in dataset configuration.")

        dataset_attr = None
        info = dataset_info[name]
        
        # Determine the dataset source
        has_hf_url = "hf_hub_url" in info
        has_ms_url = "ms_hub_url" in info
        has_om_url = "om_hub_url" in info
        
        if has_hf_url or has_ms_url or has_om_url:
            if has_ms_url and (use_modelscope() or not has_hf_url):
                dataset_attr = DatasetAttr("ms_hub", dataset_name=info["ms_hub_url"])
            elif has_om_url and (use_openmind() or not has_hf_url):
                dataset_attr = DatasetAttr("om_hub", dataset_name=info["om_hub_url"])
            else:
                dataset_attr = DatasetAttr("hf_hub", dataset_name=info["hf_hub_url"])
        elif "script_url" in info:
            dataset_attr = DatasetAttr("script", dataset_name=info["script_url"])
        elif "cloud_file_name" in info:
            dataset_attr = DatasetAttr("cloud_file", dataset_name=info["cloud_file_name"])
        else:
            dataset_attr = DatasetAttr("file", dataset_name=info["file_name"])

        dataset_attr.join(info)
        dataset_list.append(dataset_attr)
        
    return dataset_list


# Override the original function
llamafactory_loader.get_dataset_list = override_get_dataset_list

def get_dataset(
    template: "Template",
    model_args: "ModelArguments",
    data_args: "DataArguments",
    training_args: "Seq2SeqTrainingArguments",
    stage: Literal["pt", "sft", "rm", "ppo", "kto"],
    tokenizer: "PreTrainedTokenizer",
    processor: Optional["ProcessorMixin"] = None,
) -> "DatasetModule":
    r"""Get the train dataset and optionally gets the evaluation dataset."""
    # Load tokenized dataset if path exists

    if data_args.tokenized_path is not None:
        if has_tokenized_data(data_args.tokenized_path):
            logger.warning_rank0("Loading dataset from disk will ignore other data arguments.")
            tokenized_data = load_from_disk(data_args.tokenized_path)
            dataset_module = get_dataset_module(tokenized_data)
            if data_args.streaming:
                dataset_module["train_dataset"] = dataset_module["train_dataset"].to_iterable_dataset()

            logger.info_rank0(f"Loaded tokenized dataset from {data_args.tokenized_path}.")
            return dataset_module

        if data_args.streaming:
            raise ValueError("Turn off `streaming` when saving dataset to disk.")

    # Load and preprocess dataset
    with training_args.main_process_first(desc="load dataset"):
        dataset = llamafactory_loader._get_merged_dataset(data_args.dataset, model_args, data_args, training_args, stage)
        eval_dataset = llamafactory_loader._get_merged_dataset(
            data_args.eval_dataset,
            model_args,
            data_args,
            training_args,
            stage,
            return_dict=data_args.eval_on_each_dataset,
        )

    with training_args.main_process_first(desc="pre-process dataset"):
        dataset = llamafactory_loader._get_preprocessed_dataset(
            dataset, data_args, training_args, stage, template, tokenizer, processor, is_eval=False
        )
        if isinstance(eval_dataset, dict):
            for eval_name, eval_data in eval_dataset.items():
                eval_dataset[eval_name] = llamafactory_loader._get_preprocessed_dataset(
                    eval_data, data_args, training_args, stage, template, tokenizer, processor, is_eval=True
                )
        else:
            eval_dataset = llamafactory_loader._get_preprocessed_dataset(
                eval_dataset, data_args, training_args, stage, template, tokenizer, processor, is_eval=True
            )

        dataset_dict = split_dataset(dataset, eval_dataset, data_args, seed=training_args.seed)
        if data_args.tokenized_path is not None:  # save tokenized dataset to disk
            if training_args.should_save:
                dataset_dict.save_to_disk(data_args.tokenized_path)
                logger.info_rank0(f"Tokenized dataset is saved at {data_args.tokenized_path}.")
                logger.info_rank0(f"Please launch the training with `tokenized_path: {data_args.tokenized_path}`.")

        return get_dataset_module(dataset_dict)