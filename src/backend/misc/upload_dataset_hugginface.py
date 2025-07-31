from huggingface_hub import HfApi
import os
from huggingface_hub.utils import RepositoryNotFoundError

def final_repo_id(repo_id: str, str_to_replace_as: str) -> str:
    """
    Finalizes the repo ID by replacing placeholders.
    """
    return repo_id.replace("<REPLACE>", str_to_replace_as)

api = HfApi(token=os.getenv("HF_TOKEN"))
user_name = os.getenv("HF_USER_NAME", "")
repo_id = f"{user_name}/<REPLACE>_alpaca_mini_slice"

# Create repositories with error handling
for repo_visibility in ["public", "private"]:
    repo_id_visibility = final_repo_id(repo_id, repo_visibility)
    is_private = repo_visibility == "private"
    
    try:
        # Check if repository exists
        api.repo_info(repo_id=repo_id_visibility, repo_type="dataset")
        print(f"Repository already exists: {repo_id_visibility}")
    except RepositoryNotFoundError:
        # Create repository if it doesn't exist
        api.create_repo(
            repo_id=repo_id_visibility,
            repo_type="dataset",
            private=is_private
        )
        print(f"Created {repo_visibility} dataset repository: {repo_id_visibility}")

    # Uploading files to the dataset repository
    api.upload_file(
        path_in_repo="train.json",
        path_or_fileobj="mini_alpaca_500.json",
        repo_id=repo_id_visibility,
        repo_type="dataset",
    )

    api.upload_file(
        path_in_repo="test.json",
        path_or_fileobj="mini_alpaca_100_eval.json",
        repo_id=repo_id_visibility,
        repo_type="dataset",
    )

    api.upload_file(
        path_in_repo="pred.json",
        path_or_fileobj="mini_alpaca_50_pred.json",
        repo_id=repo_id_visibility,
        repo_type="dataset",
    )