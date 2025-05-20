from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="meta-llama/Llama-3.2-1B-Instruct",
    # tmp will remove, when restart
    # local_dir="/tmp/Llama-3.2-1B-Instruct"
    
    local_dir="/home/dut7042/lun/LLaMA-Factory/Llama-3.2-1B-Instruct"
    # /home/dut7071/lun/LLaMA-Factory
)
