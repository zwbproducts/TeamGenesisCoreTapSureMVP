from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Item(BaseModel):
    name: str
    price: float
    eligible: bool = True

class ReceiptData(BaseModel):
    merchant: str = "Unknown"
    category: str = "Electronics"
    items: List[Item] = Field(default_factory=list)
    total: float = 0.0
    date: Optional[str] = None
    confidence: float = 0.5
    eligibility: str = "PENDING"  # APPROVED / DENIED / PENDING
    raw_text: Optional[str] = None

    # POS QR verification context (present when POS mode requires QR)
    pos_qr_verified: bool = False
    pos_qr_reason: Optional[str] = None
    pos_qr_payload: Optional["PosQrPayload"] = None

    # Trust signals used by chat + dashboards
    trust_rating: int = 3  # 1-5
    trust_confidence: float = 0.5  # 0-1

class CoverageOption(BaseModel):
    coverage_period: str
    premium: float
    protection_type: str
    features: List[str]

class RecommendationResponse(BaseModel):
    options: List[CoverageOption]
    suggested: CoverageOption

class PolicyConfirmation(BaseModel):
    policy_id: str
    status: str
    premium: float
    coverage_period: str

class ChatMessage(BaseModel):
    message: str
    actor_role: Optional[Literal["merchant", "customer", "insurer"]] = None


class PosQrPayload(BaseModel):
    tenant_id: str
    transaction_id: str
    timestamp: int
    nonce: str
    actor_role: Optional[Literal["merchant", "customer", "insurer"]] = None
    profile_id: str | None = None
    merchant_id: str | None = None
    plan_id: str | None = None
    amount_cents: int | None = None
    currency: str | None = None


class PosQrVerifyResponse(BaseModel):
    valid: bool
    reason: str
    payload: PosQrPayload | None = None
    decoded_text: str | None = None
