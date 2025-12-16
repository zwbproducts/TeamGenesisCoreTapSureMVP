from pathlib import Path


def test_decode_demo_pos_qr_receipt_fixture():
    from app.pos_qr import decode_qr_texts

    p = Path(__file__).resolve().parents[0] / "fixtures" / "demo_pos_qr_receipt.png"
    data = p.read_bytes()
    texts = decode_qr_texts(data)
    assert texts, "Expected to decode at least one QR text from demo_pos_qr_receipt.png"
    assert texts[0].startswith("TSQR1."), f"Expected TSQR1 token, got: {texts[0][:40]}"
