## Quick context — what this repo is

- Backend: FastAPI app in `backend/app`. Entrypoint: `backend/app/main.py`.
- Frontend: static single-page UI in `frontend/` that calls the backend APIs or falls back to in-browser OCR (Tesseract.js).
- Design: small event-driven multi-agent MVP. `Orchestrator` wires the agents: `ReceiptAnalyzer`, `CoverageRecommender`, `ConversationalAgent`.

## Key files to read first

- `backend/app/main.py` — routes and FastAPI wiring.
- `backend/app/orchestrator.py` — where agents are composed and state is kept during a flow.
- `backend/app/models.py` — pydantic models that define data shapes (ReceiptData, CoverageOption, RecommendationResponse, PolicyConfirmation).
- `backend/app/agents/` — agent implementations (receipt parsing, coverage rules, chat). Look for LLM fallbacks.
- `backend/app/config.py` — how LLM/Tesseract clients are configured (env vars: LLM_BASE_URL, OPENAI_API_KEY / LLM_API_KEY, LLM_MODEL, TESSERACT_CMD).

## How to run (developer notes)

1. Install system prerequisites (Debian/Ubuntu): `sudo apt install python3-venv python3-pip`.
2. Create venv and install packages from `backend/requirements.txt`:
   - from project root:
     - `python3 -m venv .venv`
     - `.venv/bin/python -m pip install -r backend/requirements.txt`
3. Start backend (run from project root or set PYTHONPATH):
   - Recommended (from project root):
     - `PYTHONPATH=$(pwd)/backend .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
   - Or cd into `backend/` and run (ensure `.venv` path is correct):
     - `cd backend && ../.venv/bin/python -m uvicorn app.main:app --reload`
4. Frontend: open `frontend/index.html` or serve via `python -m http.server -d frontend 5173`.

Note: the backend will run fine without any LLM keys; agents fall back to heuristics if no OpenAI-compatible client is configured.

## Project-specific conventions & patterns

- Agents live under `backend/app/agents/`. Use package-relative imports:
  - Import top-level models from agents with two dots: `from ..models import ReceiptData` (not `from .models`).
- `config.get_client()` returns an OpenAI-compatible client if `LLM_BASE_URL` or `LLM_API_KEY` (or `OPENAI_API_KEY`) is set. Agents should always handle `None` client.
- `ReceiptAnalyzer` tries LLM-based structured parsing first, then falls back to regex/heuristics and `pytesseract` OCR.
- `CoverageRecommender` uses `CATEGORY_TABLE` and deterministic math (no external calls) — good place to add business rules.
- `Orchestrator` is the single place that coordinates flows and holds ephemeral state for a session; prefer adding small agent methods rather than spreading orchestration logic.

## Integration points / external deps

- OCR: `pytesseract` (backend) / Tesseract.js (frontend fallback). Set `TESSERACT_CMD` in env if needed.
- LLMs: OpenAI-compatible via `openai.OpenAI` client. For local usage, README suggests Ollama and using `LLM_BASE_URL`.
- HTTP client: `httpx` is available in `requirements.txt` if you need outbound HTTP calls.

## Common troubleshooting

- If you see `ModuleNotFoundError: No module named 'app'` or similar, run uvicorn from the `backend` folder or set `PYTHONPATH` to `backend/` so the `app` package is importable.
- If `python3 -m venv` fails, install `python3-venv` (system package). If `pip` is missing, install `python3-pip`.
- Port 8000 may be in use; either stop the process or start on a different port.

## Small examples (copyable)

- Health check:
  - `curl http://localhost:8000/health` → `{ "status": "ok" }`
- Analyze receipt (multipart):
  - `curl -F "receipt=@myreceipt.jpg" http://localhost:8000/api/receipt/analyze`
- Recommend coverage (JSON body using model from `/api/receipt/analyze`):
  - `curl -H "Content-Type: application/json" -d '@receipt.json' http://localhost:8000/api/coverage/recommend`

## Where to extend

- Add new agents in `backend/app/agents/` and register them in `Orchestrator`.
- Business rules belong in `agents/coverage.py` (stateless functions preferred).

If anything is unclear or you want me to include examples for tests, CI, or a Dockerfile for reproducible runtime, tell me which target (dev vs CI vs Docker) and I’ll add it.
