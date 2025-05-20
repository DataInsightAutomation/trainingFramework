need install pytest
accelerator
datasets
peft


(intel-train) dut7071@PG16WVAW7071DUT:~/lun/frameworks.ai.trainingframework.src/backend/src$ python cli.py 
<audio> AUDIO_PLACEHOLDER
to be develop yet


(intel-train) dut7071@PG16WVAW7071DUT:~/lun/frameworks.ai.trainingframework.src/backend/tests$ PYTHONPATH=../src pytest run_train.py

(intel-train) dut7071@PG16WVAW7071DUT:~/lun/frameworks.ai.trainingframework.src/backend $ PYTHONPATH=src pytest tests/train/from_example/tiny_random_llama3.py
(intel-train) dut7071@PG16WVAW7071DUT:~/lun/frameworks.ai.trainingframework.src/backend $ PYTHONPATH=src pytest tests/eval/from_example/intel_lora_sft_llama.py


PYTHONPATH=src python src/train.py examples/intel_llama3_lora_sft.yaml.yaml 


python train.py llama_factory/examples/train_lora/llama3_lora_sft.yaml
python train.py ../examples/intel-llama3_lora_sft.yaml



python src/train.py ./examples/intel_llama3_lora_sft.yaml


dut7071@PG16WVAW7071DUT:~/lun/frameworks.ai.trainingframework.src/backend$
python src/train.py examples/tiny-random-llama3.yaml 


evaluate

python src/train.py     --stage sft     --model_name_or_path /home/dut7042/lun/LLaMA-Factory/Llama-3.2-1B-Instruct     --preprocessing_num_workers 16     --finetuning_type lora     --quantization_method bnb     --template llama3     --flash_attn auto     --dataset_dir data     --eval_dataset custom_test_smaller_alpaca_eval     --cutoff_len 1024     --max_samples 100000     --per_device_eval_batch_size 64    --predict_with_generate True     --max_new_tokens 512     --top_p 0.7     --temperature 0.95     --output_dir saves/Llama-3.2-1B-Instruct/lora/eval_2025-05-20-10-07-46     --trust_remote_code True     --do_predict True  --adapter_name_or_path saves/Llama-3.2-1B-Instruct/lora/sft 

