from fastapi import APIRouter, HTTPException, status
from app.response.response import ModelsResponse, DatasetsResponse, Model, Dataset

# Create router for resources
router = APIRouter(
    prefix="/v1/resources",
    tags=["Resources"],
    responses={404: {"description": "Resource not found"}},
)

# Mock data for models - in production, this would come from a database or file system
AVAILABLE_MODELS = [
    Model(id="llamafactory/tiny-random-Llama-3", name="Tiny-random-llama-3", description="Small Llama 3 instruction-tuned model"),
    Model(id="meta-llama/Llama-3.2-1B-Instruct", name="Llama-3.2-1B-instruct", description="Small Llama 3 base model"),
    Model(id="llama3-8b", name="Llama 3 (8B)", description="Medium-sized Llama 3 model"),
    Model(id="llama3-70b", name="Llama 3 (70B)", description="Large Llama 3 model"),
    Model(id="gpt4", name="GPT-4", description="OpenAI GPT-4 model"),
    Model(id="gpt4o", name="GPT-4o", description="OpenAI GPT-4o model"),
    Model(id="gpt3.5", name="GPT-3.5 Turbo", description="OpenAI GPT-3.5 Turbo model"),
    Model(id="mistral-7b", name="Mistral (7B)", description="Mistral 7B model"),
    Model(id="mixtral", name="Mixtral 8x7B", description="Mixtral 8x7B MoE model"),
    Model(id="phi-3", name="Phi-3", description="Microsoft Phi-3 model"),
    Model(id="claude-3", name="Claude 3 Opus", description="Anthropic Claude 3 Opus model"),
    Model(id="claude-3-sonnet", name="Claude 3 Sonnet", description="Anthropic Claude 3 Sonnet model"),
    Model(id="claude-3-haiku", name="Claude 3 Haiku", description="Anthropic Claude 3 Haiku model"),
    Model(id="falcon-180b", name="Falcon (180B)", description="TII Falcon 180B model"),
    Model(id="gemma-7b", name="Gemma (7B)", description="Google Gemma 7B model"),
    Model(id="gemma-2b", name="Gemma (2B)", description="Google Gemma 2B model"),
]

# Mock data for datasets - in production, this would come from a database or file system
AVAILABLE_DATASETS = [
    Dataset(id="alpaca-cleaned", name="Alpaca (Cleaned)", description="Cleaned version of the Stanford Alpaca dataset", category="Instruction"),
    Dataset(id="custom_test_hugginface_alpaca", name="Custom Test Huggingface Alpaca", description="Custom test dataset based on Huggingface Alpaca mini", category="Instruction"),
    Dataset(id="custom_test_smaller_alpaca_test", name="Custom Test Smaller Alpaca Test", description="Custom test dataset based on a smaller version of Alpaca", category="Instruction"),
    Dataset(id="alpaca-gpt4", name="Alpaca-GPT4", description="GPT-4 generated Alpaca dataset", category="Instruction"),
    Dataset(id="dolly-15k", name="Dolly 15k", description="Databricks' Dolly 15k instruction dataset", category="Instruction"),
    Dataset(id="oasst1", name="Open Assistant", description="Open Assistant dataset", category="Conversation"),
    Dataset(id="cnn-dailymail", name="CNN/DailyMail", description="CNN/DailyMail summarization dataset", category="Summarization"),
    Dataset(id="squad-v2", name="SQuAD v2", description="Stanford Question Answering Dataset v2", category="QA"),
    Dataset(id="wikitext-103", name="WikiText-103", description="WikiText-103 language modeling dataset", category="General"),
    Dataset(id="c4", name="C4", description="Common Crawl Cleaned Colossal Corpus", category="General"),
    Dataset(id="gsm8k", name="GSM8K", description="Grade School Math 8K", category="Math"),
    Dataset(id="mmlu", name="MMLU", description="Massive Multitask Language Understanding", category="Benchmark"),
]

@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """
    Get a list of available models for training or evaluation
    """
    return {"models": AVAILABLE_MODELS}

@router.get("/datasets", response_model=DatasetsResponse)
async def get_datasets():
    """
    Get a list of available datasets for training or evaluation
    """
    return {"datasets": AVAILABLE_DATASETS}
