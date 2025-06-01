import logging
import sys
import os
from typing import Optional

def configure_logger(name: Optional[str] = None) -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="[%(levelname)s|%(filename)s:%(lineno)d] %(asctime)s >> %(message)s"
    )