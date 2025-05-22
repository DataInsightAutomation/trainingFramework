from contextlib import asynccontextmanager
import os
import asyncio
from fastapi import FastAPI

from app.util.util import torch_gc
class APIConfig:
    """Configuration settings for the API server."""
    MEMORY_CLEANUP_INTERVAL = int(os.getenv("MEMORY_CLEANUP_INTERVAL", "300"))  # seconds
    HOST = os.getenv("API_HOST", "0.0.0.0")
    PORT = int(os.getenv("API_PORT", "8001"))
    LOG_LEVEL = os.getenv("API_LOG_LEVEL", "info")
    ENABLE_RELOAD = os.getenv("API_ENABLE_RELOAD", "false").lower() == "true"

async def sweeper(interval: int = APIConfig.MEMORY_CLEANUP_INTERVAL) -> None:
    """Periodically clean up GPU memory to prevent memory leaks.

    Args:
        interval: Time between cleanup operations in seconds
    """
    print(f"Memory sweeper started (interval: {interval}s)")
    while True:
        torch_gc()
        await asyncio.sleep(interval)

# Fix the lifespan function - was causing the app to be None
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle events.

    Sets up resources when the app starts and cleans up when it shuts down.
    """
    # Create task for memory cleanup
    print("API server starting up...")
    cleanup_task = asyncio.create_task(sweeper())

    try:
        yield
    finally:
        print("API server shutting down...")

        # Cancel the cleanup task when shutting down
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            print("Memory sweeper task cancelled")

        # Clean up resources
        print("Cleaning up resources...")
        torch_gc()