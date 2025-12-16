from __future__ import annotations

import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _md_to_story(md: str):
    styles = getSampleStyleSheet()

    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        spaceBefore=12,
        spaceAfter=8,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        spaceBefore=10,
        spaceAfter=6,
    )
    h3 = ParagraphStyle(
        "H3",
        parent=styles["Heading3"],
        fontSize=12,
        leading=16,
        spaceBefore=8,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        spaceBefore=0,
        spaceAfter=4,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=14,
        bulletIndent=6,
    )

    story = []
    in_code = False

    for raw in md.splitlines():
        line = raw.rstrip("\n")

        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue

        if not line.strip():
            story.append(Spacer(1, 6))
            continue

        if line.startswith("# "):
            story.append(Paragraph(_escape(line[2:].strip()), h1))
            continue
        if line.startswith("## "):
            story.append(Paragraph(_escape(line[3:].strip()), h2))
            continue
        if line.startswith("### "):
            story.append(Paragraph(_escape(line[4:].strip()), h3))
            continue

        m = re.match(r"^[-*]\s+(.*)$", line)
        if m:
            item = _escape(m.group(1).strip())
            story.append(Paragraph(item, bullet, bulletText="•"))
            continue

        story.append(Paragraph(_escape(line.strip()), body))

    return story


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: generate_gdd_pdf.py <input.md> <output.pdf>")
        return 2

    input_path = Path(sys.argv[1]).expanduser().resolve()
    output_path = Path(sys.argv[2]).expanduser().resolve()

    if not input_path.exists():
        print(f"Input not found: {input_path}")
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)

    md = input_path.read_text(encoding="utf-8")
    story = _md_to_story(md)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
        title=input_path.stem,
    )
    doc.build(story)

    print(f"Wrote: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
