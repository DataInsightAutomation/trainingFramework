from huggingface_hub import HfApi, login
import os
from huggingface_hub.utils import RepositoryNotFoundError

api = HfApi(token=os.getenv("HF_TOKEN"))
# Set your Hugging Face repo name and organization/username
HF_REPO_ID = "easydata2022/mmlu-custom-small"
try:
    # Check if repository exists
    api.repo_info(repo_id=HF_REPO_ID, repo_type="dataset")
    print(f"Repository already exists: {HF_REPO_ID}")
except RepositoryNotFoundError:
    # Create repository if it doesn't exist
    api.create_repo(
        repo_id=HF_REPO_ID,
        repo_type="dataset",
        private=False
    )
    print(f"Created {HF_REPO_ID} dataset repository: {HF_REPO_ID}")

# Optional: login with your token (or set HF_TOKEN env variable)
# login(token="hf_your_token_here")

# Path to your custom dataset files
base_dir = os.path.dirname(__file__)
files_to_upload = [
    "mmlu-custom-small.py",
    "mmlu.zip",
    "mapping.json"
]

api = HfApi()

for fname in files_to_upload:
    path = os.path.join(base_dir, fname)
    print(f"Uploading {fname} to {HF_REPO_ID} ...")
    api.upload_file(
        path_or_fileobj=path,
        path_in_repo=fname,
        repo_id=HF_REPO_ID,
        repo_type="dataset",
        commit_message=f"Add {fname}"
    )
print("All files uploaded!")
