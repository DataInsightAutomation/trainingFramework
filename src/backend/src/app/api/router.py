# app/api/router.py
import importlib
import pkgutil
from fastapi import APIRouter
from app import controller

api_router = APIRouter()
job_status = {}

import logging

for _, module_name, _ in pkgutil.iter_modules(controller.__path__):
    module = importlib.import_module(f"app.controller.{module_name}")
    if hasattr(module, "router") and isinstance(module.router, APIRouter):
        api_router.include_router(module.router)
        logging.info(f"Including router from: {module_name}")
    else:
        logging.warning(f"No router found in: {module_name}")
