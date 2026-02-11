# TapSure — Agentic Insurance MVP

**Team Genesis Core** — A production-grade, event-driven multi-agent insurance platform built to revolutionize how merchants and consumers interact with instant coverage.

Upload a receipt. Get intelligent coverage recommendations in milliseconds. Confirm protection. Repeat.

**Designed and architected by [Zebbediah Winston Beck](https://github.com/zebbediah) — CEO/Founder/Chief Software Architect at Zero Gravity Engineering (Pty) Ltd**

## Technology Stack

- **Backend**: FastAPI + composable agent modules (OpenAI-compatible LLM optional, graceful heuristic fallbacks)
- **Frontend**: Mobile-first vanilla HTML/CSS/JS + Tesseract.js OCR
- **Architecture**: Event-driven orchestrator pattern with pluggable agents (ReceiptAnalyzer, CoverageRecommender, ConversationalAgent)

Quick start
1) Backend
- Create a virtual env
  - Windows (PowerShell)
    python -m venv .venv
    .venv\Scripts\Activate.ps1
- Install deps
    pip install -r backend/requirements.txt
- Configure env
    copy backend/.env.example backend/.env
    # set OPENAI_API_KEY if you want AI OCR/LLM; otherwise fallback heuristics run
- Run API
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

2) Frontend
- Open frontend/index.html in a browser, or serve statically (e.g., `python -m http.server 5173 -d frontend`)
- By default it calls http://localhost:8000

Key endpoints
- POST /api/receipt/analyze  (multipart file: receipt)
- POST /api/coverage/recommend (JSON receipt payload)
- POST /api/flow/confirm (JSON selection)
- POST /api/chat (JSON {message})

---

## POS-ready automation roadmap (color-coded todo)

Legend:
- ![P0](https://img.shields.io/badge/P0-MUST-critical) = required to be a reliable POS automation product
- ![P1](https://img.shields.io/badge/P1-SHOULD-orange) = strongly recommended for adoption + ops
- ![P2](https://img.shields.io/badge/P2-NICE-lightgrey) = good polish / later

### Product wedge (stop being “generic insurance”)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Pick 1–2 POS use-cases (e.g., receipt-based protection / reimbursement) and remove everything else from the happy path.
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Define the decision output contract: **approve / deny / needs-more-info**, with explicit reasons and required evidence.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add a “human handoff” lane (merchant support / insurer ops) instead of pretending 100% can be automated.

### POS ingestion (how merchants actually feed you data)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Add a POS webhook/API ingestion route (digital receipt payload) alongside image upload.
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Support idempotency keys + retries (POS systems will resend events).
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Normalize receipt line items (SKU/UPC, category, quantity, price, tax, merchant id, timestamp).
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Build “adapters” per POS/provider (keep core logic provider-agnostic).

### Pricing + coverage engine (cost-effective + explainable)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Make coverage recommendation deterministic-first with transparent formulas + rule traces (LLM only for parsing ambiguous text).
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Add hard constraints: max item value, excluded categories, jurisdiction flags, waiting periods.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add configurable rule tables per insurer/merchant program (multi-tenant config, not code changes).
- [ ] ![P2](https://img.shields.io/badge/P2-NICE-lightgrey) Add a calibration harness with golden receipts + expected outputs (regression safety).

### Automation workflow (end-to-end, not a demo)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Introduce a first-class `Case` model: intake → extracted data → decision → policy/confirmation → audit.
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Persist cases (SQLite/Postgres) and make the flow resumable.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add outbound webhooks for: decision ready, policy issued, exception required.

### Security, privacy, and trust (table stakes for insurers)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Replace promo-code gating with real auth (merchant API keys / OAuth) + tenant isolation.
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Rate limiting + upload limits + content-type validation + malware scanning strategy.
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) PII handling: redaction support, retention policy, deletion endpoint, minimal logging of sensitive fields.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add an audit log: who/what/when for every decision and data mutation.

### Reliability & ops (so it doesn’t die at checkout)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Add async processing for OCR/LLM (queue) so POS calls stay fast (<500ms) and results arrive via webhook/poll.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add structured logging + request IDs + metrics (latency, error rate, cost per case).
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Add cost controls: LLM call budget per case, caching, and “LLM-off mode” parity tests.

### Integration deliverables (what partners expect)
- [ ] ![P0](https://img.shields.io/badge/P0-MUST-critical) Publish an integration spec: webhook schemas, auth, retries, idempotency, status codes.
- [ ] ![P1](https://img.shields.io/badge/P1-SHOULD-orange) Provide a reference POS “button” flow: offer → accept → pay → policy issuance.
- [ ] ![P2](https://img.shields.io/badge/P2-NICE-lightgrey) Add SDK snippets (JS/Python) + Postman collection for partners.

Notes
- OpenAI is optional. You can run 100% free using:
  - OCR: Tesseract (open-source)
  - LLM: Ollama local models (OpenAI-compatible API)
- This is an MVP for rapid iteration and can be swapped to LangGraph/Temporal later.

Serverless frontend-only mode (no Python, no Ollama)
- Just run a static server; OCR and parsing happen entirely in the browser using Tesseract.js.
  ```
  npx serve frontend -l 5173
  ```
- When the API isn’t reachable, the UI auto-switches to local OCR + local recommendation.
- To re-enable the real backend later, start the API and refresh the page.

Free setup (no paid APIs)
1) Install Tesseract OCR (Windows):
   - Download: https://github.com/tesseract-ocr/tesseract
   - After install, add tesseract.exe to PATH or set TESSERACT_CMD in backend/.env
2) Install Ollama and pull a model:
   - https://ollama.com/download
   - Run in a terminal:
     ollama pull llama3.1:8b
   - (Optional) For vision models use: ollama pull llama3.2-vision:11b
3) Configure backend/.env:
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_API_KEY=ollama
   LLM_MODEL=llama3.1:8b
   # TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe
4) Start the backend and front-end as above.

---

## 🟢🟡🔴 Run Everything (scripts, copy/paste)

Legend: 🟢 recommended · 🟡 optional/helpful · 🔴 strict/fail-fast

### 🟢 1) Install everything (first time)

```bash
./install-all.sh
```

### 🟢 2) Run backend + frontend-v2 (recommended)

```bash
./dev-all.sh
```

- Backend: `http://localhost:8000`
- Frontend-v2: `http://localhost:5174`
- Logs: `.logs/backend.log` and `.logs/frontend-v2.log`

### 🟡 Run with max logging + POS QR enforced (demo mode)

This turns on HTTP logs + frontend API logs and enforces QR-gating.

```bash
./dev-all-verbose.sh
```

### 🟢 Run just one piece

Backend only:

```bash
./dev-backend.sh
```

Frontend-v2 only:

```bash
./dev-frontend-v2.sh
```

Legacy static frontend only:

```bash
./dev-frontend-static.sh
```

### 🟡 Kill stuck dev servers/ports

```bash
./kill-latent.sh
```

### 🔴 Run tests (strict, fail-fast)

```bash
./test-all-strict.sh
```

---

## 🟢 POS QR demo (anti-abuse flow)

1) Generate a demo receipt image with a signed `TSQR1` token QR:

```bash
./gen-demo-pos-qr.sh
ls -la backend/fixtures/demo_pos_qr_receipt.png
```

2) Run the backend with tenant secrets configured:

```bash
POS_TENANT_SECRETS='{"demo":"dev-secret"}' \
POS_QR_ENFORCEMENT=on \
./dev-backend.sh
```

3) Upload `backend/fixtures/demo_pos_qr_receipt.png` in the UI.

Optional QR diagnostics (prints decoded texts):

```bash
./debug-qr.sh backend/fixtures/demo_pos_qr_receipt.png
```

---

## 🟡 Useful env toggles

Backend:
- `TAPSURE_DEBUG_HTTP=1` (detailed HTTP request/response logs)
- `POS_QR_ENFORCEMENT=on|off|auto` (default: `on`)
- `POS_REQUIRE_QR=1` (force QR required)
- `POS_TENANT_SECRETS='{"demo":"dev-secret"}'` (required to verify tokens)
- `POS_QR_MAX_AGE_SECONDS=900`, `POS_QR_MAX_FUTURE_SKEW_SECONDS=60`, `POS_QR_MAX_BYTES=3000000`

Frontend-v2 (read at dev-server startup):
- `VITE_API_URL=http://localhost:8000`
- `VITE_DEBUG_LOGGING=1` (logs every API call in the browser console)
- `VITE_POS_REQUIRE_QR=1` (adds `X-POS-Require-QR: 1` header for uploads)
