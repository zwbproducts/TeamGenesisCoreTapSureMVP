from .agents.receipt import ReceiptAnalyzer
from .agents.coverage import CoverageRecommender
from .agents.conversation import ConversationalAgent
from .models import ReceiptData, RecommendationResponse, CoverageOption, PolicyConfirmation, PosQrPayload
import json
import uuid


def _infer_actor_role(message: str) -> str | None:
    m = (message or "").strip().lower()
    if not m:
        return None
    merchant_any = ["merchant", "store", "shop", "cashier", "pos", "terminal", "till"]
    customer_any = ["customer", "i bought", "i purchased", "my receipt", "refund", "return"]
    insurer_any = ["insurer", "insurance", "underwriter", "underwriting", "claim", "policyholder"]

    for w in merchant_any:
        if w in m:
            return "merchant"
    for w in insurer_any:
        if w in m:
            return "insurer"
    for w in customer_any:
        if w in m:
            return "customer"
    return None


def _compute_trust(analysis: ReceiptData) -> tuple[int, float]:
    if analysis.pos_qr_verified:
        # Verified signed QR is the strongest signal.
        return 5, max(float(analysis.confidence or 0.0), 0.95)

    base = float(analysis.confidence or 0.0)
    if (analysis.merchant or "").strip().lower() == "unknown":
        base *= 0.7
    base = max(0.0, min(1.0, base))
    rating = max(1, min(4, int(base * 4) + 1))
    return rating, base


_PROFILE_TABLE: dict[str, dict[str, object]] = {
    # Merchants
    "merchant_gold": {"role": "merchant", "trust": 5, "conf": 0.98},
    "merchant_new": {"role": "merchant", "trust": 4, "conf": 0.90},
    "merchant_flagged": {"role": "merchant", "trust": 2, "conf": 0.85},
    # Customers
    "customer_loyal": {"role": "customer", "trust": 5, "conf": 0.97},
    "customer_new": {"role": "customer", "trust": 3, "conf": 0.80},
    "customer_chargeback": {"role": "customer", "trust": 2, "conf": 0.88},
    # Insurers
    "insurer_partner": {"role": "insurer", "trust": 5, "conf": 0.99},
    "insurer_auditor": {"role": "insurer", "trust": 4, "conf": 0.92},
    "insurer_unknown": {"role": "insurer", "trust": 3, "conf": 0.85},
}


def _compute_trust_from_profile(analysis: ReceiptData) -> tuple[int, float] | None:
    if not analysis.pos_qr_verified:
        return None
    payload = analysis.pos_qr_payload
    if payload is None:
        return None
    profile_id = (payload.profile_id or "").strip()
    if not profile_id:
        return None
    profile = _PROFILE_TABLE.get(profile_id)
    if not profile:
        return None

    rating = int(profile.get("trust") or 3)
    conf = float(profile.get("conf") or 0.85)

    # Small deterministic adjustments based on transaction metadata.
    # Higher amounts add a tiny confidence bump; flagged profiles never exceed 2/5.
    amt = payload.amount_cents
    if isinstance(amt, int) and amt >= 50000:
        conf += 0.02
    if profile_id == "merchant_flagged":
        rating = min(rating, 2)
        conf = min(conf, 0.90)
    if profile_id == "customer_chargeback":
        rating = min(rating, 2)

    conf = max(0.0, min(1.0, conf))
    rating = max(1, min(5, rating))
    return rating, conf

class Orchestrator:
    def __init__(self):
        self.receipt = ReceiptAnalyzer()
        self.coverage = CoverageRecommender()
        self.chat = ConversationalAgent()
        self._state = {}

    async def handle_image_upload(
        self,
        image_bytes: bytes,
        filename: str,
        *,
        pos_qr_verified: bool = False,
        pos_qr_reason: str | None = None,
        pos_qr_payload: dict | None = None,
    ) -> ReceiptData:
        analysis = await self.receipt.analyze(image_bytes, filename)

        payload_model = None
        if isinstance(pos_qr_payload, dict) and pos_qr_payload:
            try:
                payload_model = PosQrPayload(**pos_qr_payload)
            except Exception:
                payload_model = None

        analysis = analysis.model_copy(
            update={
                "pos_qr_verified": bool(pos_qr_verified),
                "pos_qr_reason": pos_qr_reason,
                "pos_qr_payload": payload_model,
            }
        )

        # Prefer profile-based trust when the signed QR includes a profile_id.
        trust = _compute_trust_from_profile(analysis)
        if trust is None:
            trust_rating, trust_confidence = _compute_trust(analysis)
        else:
            trust_rating, trust_confidence = trust
        analysis = analysis.model_copy(update={"trust_rating": trust_rating, "trust_confidence": trust_confidence})

        self._state["receipt"] = analysis.model_dump()
        self._state["trust"] = {"rating": trust_rating, "confidence": trust_confidence}

        # If the signed QR includes a role, treat it as authoritative for this session.
        if payload_model is not None and payload_model.actor_role in {"merchant", "customer", "insurer"}:
            self._state["actor_role"] = payload_model.actor_role
        if payload_model is not None and payload_model.profile_id:
            self._state["profile_id"] = payload_model.profile_id
        if payload_model is not None:
            self._state["pos_qr"] = {"verified": True, "reason": pos_qr_reason, "payload": payload_model.model_dump()}
        else:
            self._state["pos_qr"] = {"verified": bool(pos_qr_verified), "reason": pos_qr_reason}
        return analysis

    async def recommend_coverage(self, receipt: ReceiptData) -> RecommendationResponse:
        rec = self.coverage.make_options(receipt)
        self._state['recommendation'] = rec.model_dump()
        return rec

    async def confirm_policy(self, receipt: ReceiptData, selected: CoverageOption) -> PolicyConfirmation:
        policy_id = str(uuid.uuid4())[:8]
        self._state['policy'] = {"id": policy_id, "selected": selected.model_dump()}
        return PolicyConfirmation(policy_id=policy_id, status="ACTIVE", premium=selected.premium, coverage_period=selected.coverage_period)

    async def converse(self, message: str, actor_role: str | None = None) -> str:
        if actor_role in {"merchant", "customer", "insurer"}:
            self._state["actor_role"] = actor_role
        elif "actor_role" not in self._state:
            inferred = _infer_actor_role(message)
            if inferred:
                self._state["actor_role"] = inferred

        context = json.dumps(self._state, default=str)
        return await self.chat.respond(message, context=context)
