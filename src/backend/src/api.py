# Copyright 2025 the LlamaFactory team.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from enum import Enum
import asyncio
import os
import time
import gc
from contextlib import asynccontextmanager
from functools import partial
from typing import Annotated, Optional

from app.util.util import torch_gc
import uvicorn
import torch
from fastapi import Depends, FastAPI, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.util.server_util import APIConfig, lifespan

def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured application instance
    """
    # Create the FastAPI app with the fixed lifespan
    app = FastAPI(
        title="Training Framework API",
        description="API for training and evaluating models",
        version="0.1.0",
        lifespan=lifespan  # Fix: uncomment this line to use the lifespan
    )

    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api_key = os.getenv("API_KEY")
    security = HTTPBearer(auto_error=False)

    async def verify_api_key(auth: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]):
        if api_key and (auth is None or auth.credentials != api_key):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")

    # Mock storage for job status

    # Simple root endpoint for testing
    @app.get("/")
    async def root():
        return {"message": "Welcome to the Training API"}

    @app.get("/v1/test_call")
    async def test_call():
        """Test endpoint to verify API is working"""
        print("Test call received!")
        return {"message": "Hello, World!", "status": "API is working"}

    # from app.controller.status_controller import staus_router
    # from app.controller.train_controller import train_router
    # app.include_router(staus_router)
    # app.include_router(train_router)
    
    from app.api.router import api_router
    app.include_router(api_router)


    return app  # Make sure to return the app

# Create a module-level app instance to use with direct uvicorn commands
app = create_app()

def main():
    # We already have the app created above, so no need to create it again
    if app is None:
        print("ERROR: app is None!")
        return
        
    print(f"API server running on http://{APIConfig.HOST}:{APIConfig.PORT}")
    print(f"For testing, use: curl http://localhost:{APIConfig.PORT}/v1/test_call")
    print(f"Visit http://localhost:{APIConfig.PORT}/docs for API documentation")
    
    # Run with proper host binding and disable any interfaces that could be blocking
    uvicorn.run(
        app, 
        host=APIConfig.HOST, 
        port=APIConfig.PORT, 
        log_level=APIConfig.LOG_LEVEL,
        # reload=APIConfig.ENABLE_RELOAD,
        # reload=True,
        access_log=True,
    )

if __name__ == "__main__":
    main()
# uvicorn api:app --host 0.0.0.0 --port 8001 --reload