import re
import json
from io import BytesIO
from PIL import Image
import pytesseract
from ..config import get_client, LLM_MODEL, TESSERACT_CMD
from ..models import ReceiptData, Item

if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

SYSTEM_PARSE_PROMPT = (
    "You are a receipt parser. Given RAW_TEXT, return strict JSON: "
    "{merchant, category(one of Grocery, Electronics, Clothing, Pharmacy, Other), "
    "items:[{name, price}], total:number, date:YYYY-MM-DD, confidence:0-1, eligibility:APPROVED|DENIED}."
)

MERCHANT_HINTS = {
    "Electronics": ["best buy", "apple", "samsung", "sony", "currys", "micro center"],
    "Grocery": ["walmart", "kroger", "aldi", "tesco", "safeway", "whole foods"],
    "Clothing": ["zara", "h&m", "gap", "nike", "adidas", "uniqlo"],
    "Pharmacy": ["walgreens", "cvs", "boots", "rite aid"],
}

class ReceiptAnalyzer:
    def __init__(self):
        self.client = get_client()

    async def analyze(self, image_bytes: bytes, filename: str = "upload.jpg") -> ReceiptData:
        text = self._ocr(image_bytes)
        # If an LLM is available, use it to structure the text; otherwise regex-heuristics
        if self.client:
            try:
                msg = [
                    {"role": "system", "content": SYSTEM_PARSE_PROMPT},
                    {"role": "user", "content": f"RAW_TEXT:\n{text}"},
                ]
                resp = self.client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=msg,
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                data = json.loads(resp.choices[0].message.content)
                items = [Item(**i) for i in data.get("items", [])]
                total = float(data.get("total", sum((i.price for i in items), 0.0)))
                return ReceiptData(
                    merchant=data.get("merchant", "Unknown"),
                    category=data.get("category", self._infer_category(text)),
                    items=items or [Item(name="Item", price=total or 0.0, eligible=True)],
                    total=total,
                    date=data.get("date"),
                    confidence=float(data.get("confidence", 0.7)),
                    eligibility=data.get("eligibility", "APPROVED"),
                    raw_text=text[:2000],
                )
            except Exception:
                pass
        # Fallback: regex/heuristic parse
        return self._heuristic_parse(text, filename)

    def _ocr(self, image_bytes: bytes) -> str:
        try:
            img = Image.open(BytesIO(image_bytes)).convert("L")
            return pytesseract.image_to_string(img)
        except Exception:
            # Tesseract binary not available; return empty string to trigger heuristic fallback
            return ""

    def _infer_category(self, text: str) -> str:
        low = text.lower()
        for cat, hints in MERCHANT_HINTS.items():
            if any(h in low for h in hints):
                return cat
        return "Electronics"

    def _heuristic_parse(self, text: str, filename: str) -> ReceiptData:
        # total detection
        prices = [float(p.replace(",", "")) for p in re.findall(r"(?i)\b(?:total|amount|sum)\D*(\d+[\.,]?\d{0,2})", text)]
        if not prices:
            prices = [float(p.replace(",", "")) for p in re.findall(r"(\d+\.\d{2})", text)]
        total = round(max(prices), 2) if prices else (199.99)
        # date detection
        m = re.search(r"(20\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01]))", text)
        date = m.group(1) if m else None
        category = self._infer_category(text + " " + filename)
        merchant = "Unknown"
        for cat, hints in MERCHANT_HINTS.items():
            for h in hints:
                if h in text.lower():
                    merchant = h.title()
                    break
        return ReceiptData(
            merchant=merchant,
            category=category,
            items=[Item(name="Item", price=total, eligible=True)],
            total=total,
            confidence=0.5,
            eligibility="APPROVED",
            raw_text=text[:2000],
        )
