# from ..src.train import main

# main()

import os
from dataclasses import dataclass, field
from typing import Any

import pytest
from transformers import DataCollatorWithPadding

from llamafactory.data import get_dataset, get_template_and_fix_tokenizer
from llamafactory.hparams import get_train_args
from llamafactory.model import load_model, load_tokenizer
from llamafactory.train.sft.trainer import CustomSeq2SeqTrainer
# from llamafactory.extras.constants import AUDIO_PLACEHOLDER


DEMO_DATA = os.getenv("DEMO_DATA", "llamafactory/demo_data")

# TINY_LLAMA3 = os.getenv("TINY_LLAMA3", "llamafactory/tiny-random-Llama-3")
TINY_LLAMA3 = os.getenv("TINY_LLAMA3", "llamafactory/tiny-random-Llama-3")

import yaml


# print current dir
# print(os.getcwd(), 'os.getcwd()')

example_path = "examples/eval"
# tiny_random_llama3_file_name  = example_path + "tiny-random-llama3.yaml"
intel_lora_sft_llama  = "intel_lora_sft_llama3.yaml"
intel_lora_sft_llama = os.path.join(example_path, intel_lora_sft_llama)

with open(intel_lora_sft_llama, "r") as f:
    TRAIN_ARGS = yaml.safe_load(f)
print(TRAIN_ARGS,'TRAIN_ARGS')
TRAIN_ARGS.update({
    "output_dir": 'saves/tests/intel_lora_sft_llama',
})
# TRAIN_ARGS = {
#     "model_name_or_path": TINY_LLAMA3,
#     "stage": "sft",
#     "do_train": True,
#     "finetuning_type": "lora",
#     "dataset": "llamafactory/tiny-supervised-dataset",
#     "dataset_dir": "ONLINE",
#     "template": "llama3",
#     "cutoff_len": 1024,
#     "overwrite_output_dir": True,
#     "per_device_train_batch_size": 1,
#     "max_steps": 1,
#     "report_to": "none",
# }

from llamafactory.train.tuner import run_exp

@dataclass
class DataCollatorWithVerbose(DataCollatorWithPadding):
    verbose_list: list[dict[str, Any]] = field(default_factory=list)

    def __call__(self, features: list[dict[str, Any]]) -> dict[str, Any]:
        features = [
            {k: v for k, v in feature.items() if k in ["input_ids", "attention_mask", "labels"]}
            for feature in features
        ]
        self.verbose_list.extend(features)
        batch = super().__call__(features)
        return {k: v[:, :1] for k, v in batch.items()}  # truncate input length


@pytest.mark.parametrize("disable_shuffling", [False, True])
def test_shuffle(disable_shuffling: bool):
    import sys
    # first_arg = sys.argv[1]
    # first_arg = sys.argv[1] if len(sys.argv) > 1 else "default_value"

    run_exp(TRAIN_ARGS)
    # model_args, data_args, training_args, finetuning_args, _ = get_train_args(
    #     {
    #         "output_dir": os.path.join("output", f"shuffle{str(disable_shuffling).lower()}"),
    #         "disable_shuffling": disable_shuffling,
    #         **TRAIN_ARGS,
    #     }
    # )
    # tokenizer_module = load_tokenizer(model_args)
    # tokenizer = tokenizer_module["tokenizer"]
    # template = get_template_and_fix_tokenizer(tokenizer, data_args)
    # dataset_module = get_dataset(template, model_args, data_args, training_args, stage="sft", **tokenizer_module)
    # model = load_model(tokenizer, model_args, finetuning_args, training_args.do_train)
    # data_collator = DataCollatorWithVerbose(tokenizer=tokenizer)
    # trainer = CustomSeq2SeqTrainer(
    #     model=model,
    #     args=training_args,
    #     finetuning_args=finetuning_args,
    #     data_collator=data_collator,
    #     **dataset_module,
    #     **tokenizer_module,
    # )
    # trainer.train()
    # if disable_shuffling:
    #     print(data_collator.verbose_list[0]["input_ids"],'data_collator.verbose_list[0]["input_ids"]')
    #     assert data_collator.verbose_list[0]["input_ids"] == dataset_module["train_dataset"][0]["input_ids"]
    # else:
    #     print(data_collator.verbose_list[0]["input_ids"],'data_collator.verbose_list[0]["input_ids"]')
    #     assert data_collator.verbose_list[0]["input_ids"] != dataset_module["train_dataset"][0]["input_ids"]
