"""
TapSure Integration Test Suite
Tests all backend functionality and identifies missing/stub implementations.
Tests will FAIL (RED) if functionality is incomplete or stubbed.
"""

import pytest
import asyncio
from io import BytesIO
from PIL import Image
from app.orchestrator import Orchestrator
from app.agents.receipt import ReceiptAnalyzer
from app.agents.coverage import CoverageRecommender
from app.agents.conversation import ConversationalAgent
from app.models import ReceiptData, Item, CoverageOption


class TestReceiptAnalyzer:
    """Test receipt analysis with real OCR and parsing"""
    
    @pytest.mark.asyncio
    async def test_analyze_real_receipt(self):
        """✅ MUST extract merchant, items, total from actual image"""
        analyzer = ReceiptAnalyzer()
        
        # Create a test receipt image with text
        img = Image.new('RGB', (400, 600), color='white')
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        receipt_text = """
        BEST BUY
        Electronics Store
        ==================
        iPhone 15 Pro     $999.99
        USB-C Cable        $19.99
        ==================
        TOTAL:          $1,019.98
        Date: 2025-12-11
        """
        draw.text((10, 10), receipt_text, fill='black')
        
        buf = BytesIO()
        img.save(buf, format='PNG')
        image_bytes = buf.getvalue()
        
        result = await analyzer.analyze(image_bytes, "test_receipt.png")
        
        # STRICT ASSERTIONS - will fail if OCR/parsing is broken
        assert result.merchant != "Unknown", "❌ FAIL: Merchant detection is stubbed/broken"
        assert result.category == "Electronics", "❌ FAIL: Category inference is stubbed/broken"
        assert result.total > 0, "❌ FAIL: Total extraction is stubbed/broken"
        assert len(result.items) > 0, "❌ FAIL: Item extraction is stubbed/broken"
        assert result.confidence > 0, "❌ FAIL: Confidence scoring is stubbed/broken"
        assert result.eligibility in ["APPROVED", "DENIED", "PENDING"], "❌ FAIL: Eligibility logic missing"
        
        print(f"✅ PASS: Receipt analyzed - {result.merchant}, ${result.total}, {len(result.items)} items")
    
    @pytest.mark.asyncio
    async def test_ocr_quality_threshold(self):
        """✅ MUST return confidence score based on OCR quality"""
        analyzer = ReceiptAnalyzer()
        
        # Create low-quality image (blurry/noisy)
        img = Image.new('RGB', (200, 200), color='gray')
        buf = BytesIO()
        img.save(buf, format='PNG')
        
        result = await analyzer.analyze(buf.getvalue(), "noisy.png")
        
        # Confidence MUST be calculated, not hardcoded
        assert 0 <= result.confidence <= 1, "❌ FAIL: Confidence is not in valid range"
        assert result.confidence < 0.9, "❌ FAIL: Low quality image should have lower confidence"
        
        print(f"✅ PASS: OCR confidence calculated - {result.confidence}")


class TestCoverageRecommender:
    """Test coverage recommendation logic"""
    
    def test_coverage_calculation_accuracy(self):
        """✅ MUST calculate premiums based on category and amount"""
        recommender = CoverageRecommender()
        
        # High-value electronics
        receipt = ReceiptData(
            merchant="Apple Store",
            category="Electronics",
            items=[Item(name="MacBook Pro", price=2499.99, eligible=True)],
            total=2499.99,
            confidence=0.95,
            eligibility="APPROVED"
        )
        
        result = recommender.make_options(receipt)
        
        assert len(result.options) == 3, "❌ FAIL: Must provide 3 coverage options"
        assert result.suggested is not None, "❌ FAIL: Must suggest best option"
        
        # Verify premiums are calculated, not random
        premiums = [opt.premium for opt in result.options]
        assert all(p > 0 for p in premiums), "❌ FAIL: All premiums must be > 0"
        assert premiums[0] < premiums[1] < premiums[2], "❌ FAIL: Premiums should increase with period"
        
        # Verify category affects pricing
        grocery_receipt = ReceiptData(
            merchant="Walmart",
            category="Grocery",
            items=[Item(name="Groceries", price=150.00, eligible=True)],
            total=150.00,
            confidence=0.9,
            eligibility="APPROVED"
        )
        
        grocery_result = recommender.make_options(grocery_receipt)
        assert grocery_result.options[0].premium < result.options[0].premium, \
            "❌ FAIL: Grocery should be cheaper than Electronics"
        
        print(f"✅ PASS: Coverage calculations work - ${premiums}")
    
    def test_suggested_logic(self):
        """✅ MUST suggest appropriate tier based on value and category"""
        recommender = CoverageRecommender()
        
        # Low-value item should suggest mid-tier
        low_value = ReceiptData(
            merchant="Target",
            category="Clothing",
            items=[Item(name="Shirt", price=29.99, eligible=True)],
            total=29.99,
            confidence=0.9,
            eligibility="APPROVED"
        )
        
        result_low = recommender.make_options(low_value)
        assert result_low.suggested.coverage_period == "12 months", \
            "❌ FAIL: Low-value items should suggest mid-tier"
        
        # High-value electronics should suggest longest coverage
        high_value = ReceiptData(
            merchant="Best Buy",
            category="Electronics",
            items=[Item(name="TV", price=1500.00, eligible=True)],
            total=1500.00,
            confidence=0.95,
            eligibility="APPROVED"
        )
        
        result_high = recommender.make_options(high_value)
        assert result_high.suggested.coverage_period == "24 months", \
            "❌ FAIL: High-value electronics should suggest 24-month coverage"
        
        print("✅ PASS: Suggestion logic works correctly")


class TestConversationalAgent:
    """Test chat/conversational capabilities"""
    
    @pytest.mark.asyncio
    async def test_context_awareness(self):
        """✅ MUST use context from previous interactions"""
        agent = ConversationalAgent()
        
        context = str({
            "receipt": {"merchant": "Apple", "total": 999.99, "category": "Electronics"},
            "recommendation": {"suggested": {"premium": 89.99, "coverage_period": "12 months"}}
        })
        
        response = await agent.respond("What's my total?", context=context)
        
        # Response MUST reference the context (not generic fallback)
        assert "999" in response or "Apple" in response or "premium" in response.lower(), \
            "❌ FAIL: Agent is not using context - likely using fallback stub"
        
        print(f"✅ PASS: Agent is context-aware - {response[:50]}")
    
    @pytest.mark.asyncio
    async def test_coverage_questions(self):
        """✅ MUST answer coverage-related questions intelligently"""
        agent = ConversationalAgent()
        
        response = await agent.respond("What does the coverage include?")
        
        # Must give specific answer, not generic fallback
        assert len(response) > 50, "❌ FAIL: Response too short - likely generic stub"
        assert "coverage" in response.lower() or "protect" in response.lower(), \
            "❌ FAIL: Agent not addressing coverage question properly"
        
        print(f"✅ PASS: Agent handles coverage questions - {response[:80]}")


class TestOrchestrator:
    """Test end-to-end orchestration flow"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self):
        """✅ MUST handle complete user journey: upload → recommend → confirm"""
        orch = Orchestrator()
        
        # Step 1: Upload and analyze
        img = Image.new('RGB', (400, 400), color='white')
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), "Best Buy\niPhone 15\n$999.99\nTotal: $999.99", fill='black')
        buf = BytesIO()
        img.save(buf, format='PNG')
        
        receipt = await orch.handle_image_upload(buf.getvalue(), "receipt.png")
        assert receipt.total > 0, "❌ FAIL: Receipt analysis broken"
        
        # Step 2: Get recommendations
        recommendations = await orch.recommend_coverage(receipt)
        assert len(recommendations.options) > 0, "❌ FAIL: Coverage recommendation broken"
        
        # Step 3: Confirm policy
        selected = recommendations.options[1]
        policy = await orch.confirm_policy(receipt, selected)
        
        assert policy.policy_id, "❌ FAIL: Policy ID generation broken"
        assert policy.status == "ACTIVE", "❌ FAIL: Policy status not set correctly"
        assert policy.premium == selected.premium, "❌ FAIL: Policy premium mismatch"
        
        # Step 4: Chat about the policy
        chat_response = await orch.converse("What's my policy ID?")
        assert len(chat_response) > 0, "❌ FAIL: Chat is stubbed/broken"
        
        print(f"✅ PASS: Full workflow complete - Policy {policy.policy_id}")
    
    @pytest.mark.asyncio
    async def test_state_persistence(self):
        """✅ MUST maintain state across operations"""
        orch = Orchestrator()
        
        # Create receipt
        img = Image.new('RGB', (300, 300), color='white')
        buf = BytesIO()
        img.save(buf, format='PNG')
        
        receipt = await orch.handle_image_upload(buf.getvalue(), "test.png")
        
        # State should be stored
        assert 'receipt' in orch._state, "❌ FAIL: Orchestrator not storing state"
        
        # Get recommendations
        rec = await orch.recommend_coverage(receipt)
        assert 'recommendation' in orch._state, "❌ FAIL: Orchestrator not updating state"
        
        # Confirm policy
        policy = await orch.confirm_policy(receipt, rec.options[0])
        assert 'policy' in orch._state, "❌ FAIL: Orchestrator not persisting policy state"
        
        print("✅ PASS: State persistence working")


class TestEdgeCases:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_invalid_image_handling(self):
        """✅ MUST handle corrupted/invalid images gracefully"""
        analyzer = ReceiptAnalyzer()
        
        # Invalid image data
        invalid_bytes = b"not an image at all"
        
        try:
            result = await analyzer.analyze(invalid_bytes, "invalid.jpg")
            # If it doesn't raise, it should still return valid structure
            assert hasattr(result, 'total'), "❌ FAIL: Invalid image not handled properly"
            print("✅ PASS: Invalid image handled gracefully")
        except Exception as e:
            # Should raise a specific, helpful error
            assert "image" in str(e).lower() or "invalid" in str(e).lower(), \
                "❌ FAIL: Error message not helpful for invalid image"
            print(f"✅ PASS: Invalid image raises proper error - {e}")
    
    def test_zero_total_handling(self):
        """✅ MUST handle receipts with $0 total"""
        recommender = CoverageRecommender()
        
        receipt = ReceiptData(
            merchant="Test",
            category="Electronics",
            items=[],
            total=0.0,
            confidence=0.5,
            eligibility="DENIED"
        )
        
        result = recommender.make_options(receipt)
        
        # Should not crash, should provide reasonable options
        assert len(result.options) > 0, "❌ FAIL: Zero total breaks coverage calculation"
        assert all(opt.premium >= 0 for opt in result.options), "❌ FAIL: Negative premiums for zero total"
        
        print("✅ PASS: Zero total handled correctly")
    
    @pytest.mark.asyncio
    async def test_empty_context_chat(self):
        """✅ MUST handle chat with no context"""
        agent = ConversationalAgent()
        
        response = await agent.respond("Hello", context="")
        
        assert len(response) > 0, "❌ FAIL: Chat fails with empty context"
        assert response != "ERROR", "❌ FAIL: Chat returns error for empty context"
        
        print(f"✅ PASS: Empty context handled - {response}")


if __name__ == "__main__":
    print("\n" + "="*80)
    print("🔥 TAPSURE INTEGRATION TEST SUITE 🔥")
    print("Tests will show RED ❌ for incomplete/stubbed implementations")
    print("="*80 + "\n")
    
    pytest.main([__file__, "-v", "--tb=short", "--color=yes"])
