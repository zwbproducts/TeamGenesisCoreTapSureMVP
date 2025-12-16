import os
import json
from typing import Optional

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

LLM_BASE_URL = os.getenv("LLM_BASE_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")
TESSERACT_CMD = os.getenv("TESSERACT_CMD")  # for Windows if not on PATH


def get_client() -> Optional["OpenAI"]:
    """Return an OpenAI-compatible client if configuration is present, else None.
    Works with OpenAI, Ollama, vLLM, etc., via base_url.
    """
    if OpenAI is None:
        return None
    if not (LLM_API_KEY or LLM_BASE_URL):
        return None
    kwargs = {}
    if LLM_BASE_URL:
        kwargs["base_url"] = LLM_BASE_URL
    if LLM_API_KEY:
        kwargs["api_key"] = LLM_API_KEY
    try:
        return OpenAI(**kwargs)
    except Exception:
        return None


def get_pos_tenant_secrets() -> dict[str, str]:
    """Parse POS tenant secrets from env.

    Expected format:
      POS_TENANT_SECRETS='{"demo":"dev-secret"}'

    Returns an empty dict when not configured.
    """
    raw = os.getenv("POS_TENANT_SECRETS", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except Exception:
        return {}
    if not isinstance(data, dict):
        return {}
    out: dict[str, str] = {}
    for k, v in data.items():
        if isinstance(k, str) and isinstance(v, str) and k and v:
            out[k] = v
    return out
