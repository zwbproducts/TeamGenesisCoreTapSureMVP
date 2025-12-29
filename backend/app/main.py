from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from .models import ReceiptData, CoverageOption, RecommendationResponse, PolicyConfirmation, ChatMessage, PosQrPayload, PosQrVerifyResponse
from .orchestrator import Orchestrator
from .agents.conversation import CHAT_INTENTS
from .config import get_pos_tenant_secrets
from .debug_logging import APIDebugLoggingMiddleware, configure_debug_logging
from .pos_qr import decode_qr_texts, get_nonce_store, verify_token
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="TapSure Agentic MVP", version="0.1.0")

DEBUG_HTTP = (os.getenv("TAPSURE_DEBUG_HTTP", "0") or "").strip().lower() in {"1", "true", "yes", "on"}
if DEBUG_HTTP:
    configure_debug_logging()
app.add_middleware(APIDebugLoggingMiddleware, enabled=DEBUG_HTTP)

# CORS
origins = [os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"), "http://localhost:8000", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # DEV: allow all to simplify running static frontends on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orch = Orchestrator()


def _truthy_env(name: str, default: str = "0") -> bool:
    return (os.getenv(name, default) or "").strip().lower() in {"1", "true", "yes", "on"}


def _pos_qr_required(request: Request) -> bool:
    # Manual override via header.
    header = (request.headers.get("x-pos-require-qr") or "").strip().lower()
    if header in {"1", "true", "yes", "on"}:
        return True

    # Explicit env toggle.
    if _truthy_env("POS_REQUIRE_QR", "0"):
        return True

    # Default to ON: prevent abuse (cat memes) unless explicitly disabled.
    mode = (os.getenv("POS_QR_ENFORCEMENT", "on") or "on").strip().lower()
    if mode in {"0", "off", "false", "disabled"}:
        return False
    if mode in {"1", "on", "true", "enabled"}:
        return True

    # auto: require QR when tenant secrets are configured.
    return bool(get_pos_tenant_secrets())

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/receipt/analyze", response_model=ReceiptData)
async def analyze_receipt(request: Request, receipt: UploadFile = File(...)):
    if not receipt:
        raise HTTPException(400, "No file uploaded")

    content_type = (receipt.content_type or "").lower()
    if not (content_type.startswith("image/") or content_type in {"application/octet-stream"}):
        raise HTTPException(415, "Unsupported content type")

    data = await receipt.read()
    try:
        pos_qr_verified = False
        pos_qr_reason: str | None = None
        pos_qr_payload: dict | None = None

        # POS mode: require a signed QR token to be present & valid.
        if _pos_qr_required(request):
            try:
                decoded = decode_qr_texts(data)
            except RuntimeError as e:
                raise HTTPException(503, str(e))
            except Exception:
                raise HTTPException(400, "Invalid image")

            if not decoded:
                raise HTTPException(400, "QR required")

            tenant_secrets = get_pos_tenant_secrets()
            if not tenant_secrets:
                raise HTTPException(500, "POS tenant secrets not configured")

            max_age = int(os.getenv("POS_QR_MAX_AGE_SECONDS", "900"))
            max_future_skew = int(os.getenv("POS_QR_MAX_FUTURE_SKEW_SECONDS", "60"))

            valid, reason, _payload = verify_token(
                token=decoded[0],
                tenant_secrets=tenant_secrets,
                nonce_store=get_nonce_store(),
                max_age_seconds=max_age,
                max_future_skew_seconds=max_future_skew,
            )
            if not valid:
                status = 409 if reason == "replay" else 400
                raise HTTPException(status, f"QR invalid: {reason}")

            pos_qr_verified = True
            pos_qr_reason = reason
            if isinstance(_payload, dict):
                pos_qr_payload = _payload

        result = await orch.handle_image_upload(
            data,
            filename=receipt.filename,
            pos_qr_verified=pos_qr_verified,
            pos_qr_reason=pos_qr_reason,
            pos_qr_payload=pos_qr_payload,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Analyze error: {e}")

@app.post("/api/coverage/recommend", response_model=RecommendationResponse)
async def recommend_coverage(payload: ReceiptData):
    try:
        rec = await orch.recommend_coverage(payload)
        return rec
    except Exception as e:
        raise HTTPException(500, f"Recommend error: {e}")

class ConfirmBody(BaseModel):
    receipt: ReceiptData
    selected: CoverageOption

@app.post("/api/flow/confirm", response_model=PolicyConfirmation)
async def confirm_flow(body: ConfirmBody):
    try:
        conf = await orch.confirm_policy(body.receipt, body.selected)
        return conf
    except Exception as e:
        raise HTTPException(500, f"Confirm error: {e}")

@app.post("/api/chat")
async def chat(msg: ChatMessage):
    try:
        reply = await orch.converse(msg.message, actor_role=msg.actor_role)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(500, f"Chat error: {e}")


@app.get("/api/chat/intents")
def chat_intents():
    return CHAT_INTENTS


@app.post("/api/pos/qr/verify", response_model=PosQrVerifyResponse)
async def pos_qr_verify(receipt: UploadFile = File(...)):
    if not receipt:
        raise HTTPException(400, "No file uploaded")

    content_type = (receipt.content_type or "").lower()
    if not (content_type.startswith("image/") or content_type in {"application/octet-stream"}):
        raise HTTPException(415, "Unsupported content type")

    data = await receipt.read()
    max_bytes = int(os.getenv("POS_QR_MAX_BYTES", "3000000"))
    if len(data) > max_bytes:
        raise HTTPException(413, "File too large")

    try:
        decoded = decode_qr_texts(data)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception:
        raise HTTPException(400, "Invalid image")

    if not decoded:
        raise HTTPException(400, "No QR code found")

    token = decoded[0]

    tenant_secrets = get_pos_tenant_secrets()
    if not tenant_secrets:
        raise HTTPException(500, "POS tenant secrets not configured")

    max_age = int(os.getenv("POS_QR_MAX_AGE_SECONDS", "900"))
    max_future_skew = int(os.getenv("POS_QR_MAX_FUTURE_SKEW_SECONDS", "60"))

    valid, reason, payload_dict = verify_token(
        token=token,
        tenant_secrets=tenant_secrets,
        nonce_store=get_nonce_store(),
        max_age_seconds=max_age,
        max_future_skew_seconds=max_future_skew,
    )

    payload_model = None
    if payload_dict:
        try:
            payload_model = PosQrPayload(**payload_dict)
        except Exception:
            payload_model = None

    resp = PosQrVerifyResponse(valid=valid, reason=reason, payload=payload_model, decoded_text=token)
    if reason == "replay":
        return JSONResponse(status_code=409, content=resp.model_dump())
    return resp
