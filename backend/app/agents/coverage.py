from ..models import ReceiptData, CoverageOption, RecommendationResponse

CATEGORY_TABLE = {
    "Electronics": {"base_rate": 0.12, "features": ["Damage", "Theft", "Accidental"]},
    "Grocery": {"base_rate": 0.02, "features": ["Spoilage", "Delivery Loss"]},
    "Clothing": {"base_rate": 0.05, "features": ["Damage", "Theft"]},
    "Pharmacy": {"base_rate": 0.04, "features": ["Damage", "Loss"]},
    "Other": {"base_rate": 0.06, "features": ["Damage", "Theft"]},
}

PERIODS = [6, 12, 24]

class CoverageRecommender:
    def make_options(self, receipt: ReceiptData) -> RecommendationResponse:
        meta = CATEGORY_TABLE.get(receipt.category, CATEGORY_TABLE["Other"])
        base = meta["base_rate"]
        total = receipt.total or sum(i.price for i in receipt.items)

        def option(months: int, multiplier: float) -> CoverageOption:
            premium = round(total * base * multiplier, 2)
            return CoverageOption(
                coverage_period=f"{months} months",
                premium=premium,
                protection_type="Comprehensive" if receipt.category == "Electronics" else "Standard",
                features=meta["features"],
            )

        opts = [
            option(6, 0.45),
            option(12, 0.75),
            option(24, 1.1),
        ]
        # Suggest mid-tier by default, or longest for high value.
        suggested = opts[2] if total >= 500 and receipt.category == "Electronics" else opts[1]

        # If trust is low, suggest the shortest term to reduce exposure.
        if isinstance(receipt.trust_rating, int) and receipt.trust_rating <= 2:
            suggested = opts[0]
        return RecommendationResponse(options=opts, suggested=suggested)
