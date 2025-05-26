import asyncio
import os
from typing import Optional, Any

import yaml

from app.util.util import is_ray_available
from ....api.router import job_status
from llamafactory.train.callbacks import TrainerCallback


async def simulate_training(job_id: str, train_args: Optional[dict[str, Any]] = None) -> None:
    """Simulate a training job for demo purposes"""
    # stages = ["PREPARING", "TRAINING", "FINALIZING", "COMPLETED"]

    # for stage_idx, stage in enumerate(stages):
    #     job_status[job_id]["status"] = stage
    #     job_status[job_id]["message"] = f"Model is in {stage.lower()} stage"

    #     # Simulate progress within the stage
    #     for i in range(1, 6):
    #         progress = (stage_idx * 25) + (i * 5)
    #         job_status[job_id]["progress"] = progress
    #         await asyncio.sleep(1)  # Simulate time passing
    # # from llamafactory.train.tuner import run_exp
    from transformers import EarlyStoppingCallback, PreTrainedModel

    from llamafactory.hparams import get_infer_args, get_ray_args, get_train_args, read_args
    from llamafactory.train.trainer_utils import get_ray_trainer, get_swanlab_callback
    if is_ray_available():
        import ray
        from ray.train.huggingface.transformers import RayTrainReportCallback
    from llamafactory.train.tuner import _training_function

    def run_exp(args: Optional[dict[str, Any]] = None, callbacks: Optional[list["TrainerCallback"]] = None) -> None:
        args = read_args(args)
        if "-h" in args or "--help" in args:
            get_train_args(args)

        ray_args = get_ray_args(args)


        print(args, 'args')
        print(ray_args, 'ray_args')

        callbacks = callbacks or []
        if ray_args.use_ray:
            callbacks.append(RayTrainReportCallback())
            trainer = get_ray_trainer(
                training_function=_training_function,
                train_loop_config={"args": args, "callbacks": callbacks},
                ray_args=ray_args,
            )
            trainer.fit()
        else:
            _training_function(config={"args": args, "callbacks": callbacks})



    print(os.getcwd(), 'os.getcwd()')

    example_path = "../examples"
    # tiny_random_llama3_file_name  = example_path + "tiny-random-llama3.yaml"
    tiny_random_llama3_file_name  = "tiny-random-llama3.yaml"
    # tiny_random_llama3_file_name  = "intel_llama3_lora_sft.yaml"
    tiny_random_llama3_file_name = os.path.join(example_path, tiny_random_llama3_file_name)

    with open(tiny_random_llama3_file_name, "r") as f:
        TRAIN_ARGS = yaml.safe_load(f)
    print(TRAIN_ARGS,'TRAIN_ARGS')
# dataset_dir: /home/dut7071/lun/LLaMA-Factory/data
    TRAIN_ARGS['dataset_dir'] = os.path.join(os.getcwd(), '../data')
    TRAIN_ARGS['dataloader_num_workers'] = 0
    # TRAIN_ARGS['dataset'] = "custom_test_hugginface_alpaca"
    # run_exp(TRAIN_ARGS)
    print('received full_params:', train_args)
    train_args["dataset_dir"] = os.path.join(os.getcwd(), '../data')
    train_args["dataloader_num_workers"] = 0
    run_exp(train_args)
