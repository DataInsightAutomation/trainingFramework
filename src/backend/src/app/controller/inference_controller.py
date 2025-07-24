# payload frontend/input request
# {
#     "model_name_or_path": "meta-llama/Meta-Llama-3-8B-Instruct",
#     "adapter_name_or_path": "saves/llama3-8b/lora/sft",
#     "template": "llama3",
#     "finetuning_type": "lora",
#     "infer_backend": "huggingface",
#     "input": "hj"
# }
import asyncio
from fastapi import HTTPException, status, APIRouter, BackgroundTasks, Depends, Request
import time
import os
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any, Literal
from ..api.router import job_status
import logging as logger
from app.services.evaluate.model_evaluation import simulate_evaluation as run_evaluation_job
from app.services.evaluate.benchmark_evaluation import simulate_benchmark as run_benchmark_job
import uuid

from llamafactory.chat.chat_model import ChatModel
from fastapi.responses import StreamingResponse

router = APIRouter()

# In-memory chat history store: {session_id: [message, ...]}
chat_histories: Dict[str, List[Dict[str, str]]] = {}

class ChatRequest(BaseModel):
    model_name_or_path: str
    adapter_name_or_path: Optional[str] = None
    template: Optional[str] = None
    finetuning_type: Optional[str] = None
    infer_backend: Literal["huggingface", "vllm"]  # extend as needed
    input: str
    session_id: Optional[str] = None  # <-- add session_id for tracking

class ChatResponse(BaseModel):
    response: str
    session_id: str  # <-- include session_id in the response

@router.post("/chat/notstream", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):

    obj_chat_model = ChatModel({
        "model_name_or_path": request.model_name_or_path,
        "adapter_name_or_path": request.adapter_name_or_path,
        "template": request.template,
        "finetuning_type": request.finetuning_type,
        "infer_backend": request.infer_backend
    })

    session_id = request.session_id or str(uuid.uuid4())
    # Retrieve or initialize chat history
    history = chat_histories.setdefault(session_id, [])
    # Add current user message
    history.append({"role": "user", "content": request.input})

    output = await obj_chat_model.achat(
        messages=history,
        system=None,
        tools=None,
        images=None,
        videos=None,
        audios=None
    )

    # Add assistant response to history
    try:
        assistant_msg = output.choices[0].message.content
    except Exception:
        assistant_msg = str(output)
    history.append({"role": "assistant", "content": assistant_msg})

    return ChatResponse(response=assistant_msg, session_id=session_id)

@router.post("/chat")
async def chat_stream_endpoint(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    history = chat_histories.setdefault(session_id, [])
    history.append({"role": "user", "content": request.input})

    obj_chat_model = ChatModel({
        "model_name_or_path": request.model_name_or_path,
        "adapter_name_or_path": request.adapter_name_or_path,
        "template": request.template,
        "finetuning_type": request.finetuning_type,
        "infer_backend": request.infer_backend,
        "low_cpu_mem_usage": False
    })
    async def token_generator():
        async for chunk in obj_chat_model.astream_chat(
            messages=history,
            system=None,
            tools=None,
            images=None,
            videos=None,
            audios=None
        ):
            yield chunk
        # Optionally, collect the full assistant response and add to history here

    # Return session_id in a header for streaming (since body is stream)
    return StreamingResponse(
        token_generator(),
        media_type="text/plain",
        headers={
            "X-Session-ID": session_id,
            "Access-Control-Expose-Headers": "X-Session-ID"
        }
    )

