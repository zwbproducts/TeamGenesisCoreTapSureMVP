from __future__ import annotations

import ast
import json
from typing import Any, Optional

from ..config import LLM_MODEL, get_client


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _parse_context(context: str) -> dict[str, Any]:
    """Best-effort parse orchestrator context.

    `Orchestrator` currently passes `str(self._state)` (Python literal w/ single quotes).
    If we ever pass JSON instead, this will still work.
    """
    raw = (context or "").strip()
    if not raw:
        return {}

    # Try JSON first
    try:
        val = json.loads(raw)
        return val if isinstance(val, dict) else {}
    except Exception:
        pass

    # Fallback to Python literal
    try:
        val = ast.literal_eval(raw)
        return val if isinstance(val, dict) else {}
    except Exception:
        return {}


def _format_role_trust(actor_role: Optional[str], trust_rating: Any, trust_confidence: Any) -> str:
    role_norm = (actor_role or "").strip().lower()
    role_label = {
        "merchant": "Merchant",
        "customer": "Customer",
        "insurer": "Insurer",
    }.get(role_norm, "Unknown")

    rating_label = "?"
    if isinstance(trust_rating, int):
        rating_label = str(max(1, min(5, trust_rating)))

    conf_pct = "?%"
    if isinstance(trust_confidence, (int, float)):
        c = float(trust_confidence)
        if c != c:  # NaN
            c = 0.0
        c = max(0.0, min(1.0, c))
        conf_pct = f"{int(round(c * 100.0))}%"

    return f"Role={role_label}, Trust={rating_label}/5 @{conf_pct}"


# Canonical list of intents + the phrases we recognize in fallback mode.
# Tests iterate this list to ensure every phrase is recognized.
CHAT_INTENTS: list[dict[str, Any]] = [
    {
        "name": "how_it_works",
        "phrases": [
            "how it works",
            "how does this work",
            "what is tapsure",
            "explain tapsure",
        ],
        "expects_any": ["upload", "receipt", "coverage", "confirm"],
    },
    {
        "name": "greeting",
        "phrases": ["hi", "hello", "hey", "good morning", "good evening"],
        "expects_any": ["upload", "receipt", "help"],
    },
    {
        "name": "coverage_includes",
        "phrases": [
            "what does coverage include",
            "what's covered",
            "what is covered",
            "coverage details",
            "what do i get",
        ],
        "expects_any": ["coverage", "features", "protect"],
    },
    {
        "name": "eligibility",
        "phrases": [
            "am i eligible",
            "eligibility",
            "do i qualify",
            "is this eligible",
            "will this be approved",
        ],
        "expects_any": ["eligible", "approved", "denied", "pending"],
    },
    {
        "name": "ask_total",
        "phrases": [
            "what's my total",
            "what is my total",
            "total amount",
            "how much did i spend",
            "receipt total",
        ],
        "expects_any": ["total", "$"],
    },
    {
        "name": "ask_merchant",
        "phrases": [
            "what merchant",
            "which store",
            "where did i buy",
            "merchant name",
        ],
        "expects_any": ["merchant", "store"],
    },
    {
        "name": "ask_premium",
        "phrases": [
            "what's my premium",
            "premium",
            "how much is the premium",
            "cost per month",
            "price",
        ],
        "expects_any": ["premium", "$"],
    },
    {
        "name": "ask_policy_id",
        "phrases": [
            "what's my policy id",
            "policy id",
            "policy number",
            "my policy",
        ],
        "expects_any": ["policy", "id"],
    },
    {
        "name": "next_steps",
        "phrases": ["what now", "next step", "next steps", "how do i confirm", "activate"],
        "expects_any": ["upload", "coverage", "confirm"],
    },
    {
        "name": "help",
        "phrases": ["help", "support", "contact", "issue", "problem"],
        "expects_any": ["help", "receipt", "coverage"],
    },
]


def _match_intent(message: str) -> str:
    m = _normalize(message)
    words = set(m.split())
    for intent in CHAT_INTENTS:
        for phrase in intent["phrases"]:
            p = _normalize(phrase)
            if not p:
                continue

            # Avoid substring collisions like "hi" in "which".
            if " " not in p:
                if p in words:
                    return intent["name"]
                continue

            if p in m:
                return intent["name"]
    return "unknown"

class ConversationalAgent:
    def __init__(self):
        self.client = get_client()

    async def respond(self, message: str, context: str = "") -> str:
        parsed = _parse_context(context)
        actor_role = parsed.get("actor_role") if isinstance(parsed.get("actor_role"), str) else None
        profile_id = parsed.get("profile_id") if isinstance(parsed.get("profile_id"), str) else None
        trust = parsed.get("trust") if isinstance(parsed.get("trust"), dict) else {}
        trust_rating = trust.get("rating")
        trust_confidence = trust.get("confidence")

        prefix = _format_role_trust(actor_role, trust_rating, trust_confidence)

        if self.client:
            try:
                resp = self.client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a friendly, concise TapSure assistant. "
                                "Tailor answers to the actor role when known (merchant vs customer vs insurer). "
                                "Use trust signals (rating/confidence) to calibrate certainty and ask clarifying questions when confidence is low."
                            ),
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Actor role: {actor_role or 'unknown'}\n"
                                f"Profile id: {profile_id or 'none'}\n"
                                f"Trust rating: {trust_rating}\n"
                                f"Trust confidence: {trust_confidence}\n"
                                f"Context (JSON): {context}\n"
                                f"Question: {message}"
                            ),
                        },
                    ],
                    temperature=0.2,
                )
                content = resp.choices[0].message.content or ""
                content = content.strip() if isinstance(content, str) else str(content)
                return f"{prefix}\n{content}" if content else prefix
            except Exception:
                pass

        # Deterministic fallback (no LLM configured)
        receipt = parsed.get("receipt") if isinstance(parsed.get("receipt"), dict) else {}
        recommendation = parsed.get("recommendation") if isinstance(parsed.get("recommendation"), dict) else {}
        policy = parsed.get("policy") if isinstance(parsed.get("policy"), dict) else {}

        actor_role_fallback = actor_role if actor_role in {"merchant", "customer", "insurer"} else None

        merchant = str(receipt.get("merchant") or "").strip() or None
        category = str(receipt.get("category") or "").strip() or None
        total = receipt.get("total")
        eligibility = str(receipt.get("eligibility") or "").strip() or None

        suggested = recommendation.get("suggested") if isinstance(recommendation.get("suggested"), dict) else {}
        suggested_premium = suggested.get("premium")
        suggested_period = suggested.get("coverage_period")

        policy_id = None
        if isinstance(policy.get("id"), str):
            policy_id = policy.get("id")
        elif isinstance(policy.get("policy_id"), str):
            policy_id = policy.get("policy_id")

        intent = _match_intent(message)

        if intent == "how_it_works":
            return f"{prefix}\nUpload a receipt, we analyze it, suggest coverage options, and you confirm to activate a policy."

        if intent == "greeting":
            if actor_role_fallback == "merchant":
                return f"{prefix}\nHi! If you're the merchant, upload the POS receipt so I can verify the signed QR and confirm coverage eligibility."
            if actor_role_fallback == "insurer":
                return f"{prefix}\nHi! If you're the insurer, I can summarize receipt/QR verification signals, eligibility, and suggested coverage."
            return f"{prefix}\nHi! Upload a receipt to check eligibility and get coverage options, or ask about coverage."

        if intent == "coverage_includes":
            base = "Coverage includes protection features based on your purchase category."
            if category:
                return f"{prefix}\n{base} For {category}, options typically include features like damage/theft and related protections."
            return f"{prefix}\n{base} Upload a receipt to get the exact coverage features for your category."

        if intent == "eligibility":
            if eligibility:
                return f"{prefix}\nYour receipt eligibility is {eligibility}. Upload a receipt (or re-upload) to re-check if needed."
            return f"{prefix}\nEligibility depends on the merchant/category and receipt details. Upload a receipt to get an APPROVED/DENIED/PENDING result."

        if intent == "ask_total":
            if isinstance(total, (int, float)):
                return f"{prefix}\nYour receipt total is ${float(total):.2f}."
            return f"{prefix}\nI don't have a receipt total yet—upload a receipt and I'll calculate the total."

        if intent == "ask_merchant":
            if merchant:
                return f"{prefix}\nYour merchant/store is {merchant}."
            return f"{prefix}\nI don't see a merchant yet—upload a receipt and I'll extract the store name."

        if intent == "ask_premium":
            if isinstance(suggested_premium, (int, float)) and suggested_period:
                return f"{prefix}\nThe suggested premium is ${float(suggested_premium):.2f} for {suggested_period}."
            return f"{prefix}\nPremium depends on your receipt total and category. Upload a receipt and I'll suggest coverage with a premium."

        if intent == "ask_policy_id":
            if policy_id:
                return f"{prefix}\nYour policy id is {policy_id}."
            return f"{prefix}\nYou don't have an active policy yet. Confirm a coverage option to activate one, then I'll show your policy id."

        if intent == "next_steps":
            return f"{prefix}\nNext steps: upload a receipt → review coverage options → confirm to activate your policy."

        if intent == "help":
            return f"{prefix}\nI can help with eligibility, coverage options, premiums, and policy confirmation. Try: 'how it works' or upload a receipt."

        if actor_role_fallback == "insurer":
            return f"{prefix}\nI can help validate eligibility and summarize verification/trust signals. Ask about eligibility, premiums, or the verification result."
        return f"{prefix}\nI'm here to help. Upload a receipt to get started, or ask about coverage options."
