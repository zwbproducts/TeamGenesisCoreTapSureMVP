# TapSure — Investor & Partner Readiness Checklists (POS Automation)

Version: 0.1 (draft)
Date: 2025-12-12

Purpose: A practical checklist for what TapSure must build to be credible as a **POS-integrated automation product** (insurers + merchants), and how that differs by investor/buyer audience.

Assumptions (edit these to match your pitch):
- Wedge: **receipt/digital-transaction driven protection or reimbursement** offered at checkout.
- TapSure is a **workflow automation layer** (not a risk carrier) in the MVP.
- Output contract: `approve | deny | needs-more-info` + reasons + required evidence.

Note: This is product/engineering guidance, not legal/financial advice.

---

## A. Baseline “Real MVP” (must-have for any serious conversation)

### A1) The wedge is crisp
- [ ] One narrow use-case (1–2) with a single happy path; remove other flows from the demo.
- [ ] One buyer and one user persona defined (e.g., merchant ops + customer, or insurer ops + policyholder).
- [ ] One success metric you can measure in a pilot (cycle time, attach rate, cost/case, approval rate).

### A2) POS ingestion (not just image upload)
- [ ] A digital receipt / transaction ingestion endpoint (webhook or API) that accepts structured payloads.
- [ ] Idempotency keys + retry-safe processing (POS systems resend events).
- [ ] Canonical transaction model: merchant id, store id, timestamp, currency, totals, tax, line items.
- [ ] Receipt image remains optional (for exceptions), not the core path.

### A3) Case lifecycle + persistence
- [ ] First-class `Case` model: `intake → extracted/normalized → decision → policy/confirmation → closed`.
- [ ] Persistent storage (SQLite for pilot, Postgres for scale) + resumable state.
- [ ] Audit log / event trail: who/what/when + decision trace.

### A4) Deterministic decisioning + explainability
- [ ] Deterministic rules engine is the source of truth; LLM only assists parsing.
- [ ] Every decision returns: rules triggered, inputs used, missing data, and next actions.
- [ ] Hard constraints: exclusions, max item value, restricted categories, jurisdiction/region flags.

### A5) Security & privacy basics
- [ ] Replace promo-code gating with tenant auth: API keys (partners) + scoped roles (ops).
- [ ] Rate limiting; request size limits; content-type validation.
- [ ] Safe file handling for uploads (if enabled): strict types, storage rules, deletion.
- [ ] PII policy: retention window, deletion endpoint, minimal sensitive logging.

### A6) Reliability & cost controls
- [ ] Async processing for OCR/LLM so POS requests stay fast; deliver results via webhook/poll.
- [ ] Request IDs + structured logs; metrics for latency/error/cost per case.
- [ ] LLM budget per case + caching + “LLM-off parity mode”.

### A7) Partner integration deliverables
- [ ] One-page integration spec: auth, idempotency, retries, status lifecycle, schemas.
- [ ] Sandbox mode + example payloads.

---

## B. Investor-readiness tiers

### 1) Angel-ready (build + proof)
Goal: convince someone you can build fast and there’s early pull.
- [ ] Baseline MVP (Section A) is demoable end-to-end.
- [ ] 5–10 target design partners identified with contactable intros.
- [ ] A pilot plan with measurable success criteria and timeline (2–6 weeks).
- [ ] Basic unit/integration tests around the decision contract and case persistence.
- [ ] A simple pricing hypothesis (per case, per store, per month) with target gross margin.

### 2) YC-ready (wedge + speed + pull)
Goal: prove a sharp wedge and credible path to distribution.
- [ ] A single vertical wedge with a “wow” metric (e.g., 10× faster, 70% fewer touchpoints).
- [ ] At least one live pilot or LOI with clear integration scope.
- [ ] A compounding advantage story: labeled outcomes + decision traces improve automation.
- [ ] Onboarding that works without founder babysitting (docs + sandbox + quickstart).
- [ ] Clear boundary: what TapSure automates vs what humans/partners handle.

### 3) “Normal VC” ready (repeatability + scale)
Goal: show repeatable sales + scalable ops.
- [ ] Multi-tenant configuration (rule tables per partner) without code changes.
- [ ] Operational dashboard: case queue, exceptions, SLA tracking.
- [ ] Security posture story (at least: key management, audit logs, basic threat model).
- [ ] Pipeline for integrations (adapters) + a realistic sales motion.
- [ ] Evidence of distribution (partnership channel, POS provider, insurer program).

### 4) $50k-for-8% style creator/strategic investor readiness
Goal: de-risk “will it work with a real partner?” and “can you ship in weeks?”
- [ ] A tight milestone plan: 2–3 deliverables in 30–45 days (not a giant roadmap).
- [ ] A working partner demo: webhook intake → case created → decision → webhook back.
- [ ] Cost model: expected infra/LLM cost per case and how you cap it.
- [ ] Clear commercial packaging: pilot fee + per-case pricing after.
- [ ] Avoid deal-killers: broad exclusivity, IP assignment, or “you can’t sell to competitors.”

### 5) Partner marketplace (Cofeespace / general partnerships)
Goal: be easy to trial and integrate.
- [ ] Public docs + Postman collection.
- [ ] Self-serve sandbox credentials.
- [ ] Clear support + escalation path during pilot.
- [ ] A reference integration in one POS/provider (even if minimal).

---

## C. Buyer-readiness by audience

### 1) Major platform (e.g., Amazon-like) readiness
They care about: scale, security, auditability, and predictable failure modes.
- [ ] Strong multi-tenant isolation + least-privilege keys.
- [ ] SLOs + monitoring: p95 latency, error budgets, on-call story.
- [ ] Data governance: retention, deletion, access controls, encryption at rest/in transit.
- [ ] Contract-first APIs with versioning and backwards compatibility.
- [ ] Vendor security questionnaire readiness (even if lightweight initially).

### 2) South Africa top insurers (enterprise insurer readiness)
They care about: compliance posture, audit trails, fraud, and integration with legacy.
- [ ] Full decision trace + audit log exports.
- [ ] Jurisdiction-aware rules (regional constraints) and configurable program rules.
- [ ] Fraud/abuse signals: duplicate receipts, abnormal patterns, velocity checks.
- [ ] Integration story: webhooks + batch imports + SFTP/CSV fallback (optional).
- [ ] Clear data residency position (where data is stored) + retention policy.

### 3) Merchants at point-of-sale (adoption readiness)
They care about: attach rate, low friction, and “don’t slow down checkout.”
- [ ] POS integration that adds <1 step; async decisioning.
- [ ] Customer-facing UX that is short and clear (accept/decline + price + summary).
- [ ] Merchant-facing dashboard for disputes/exceptions.
- [ ] Revenue share model or simple economics they can understand.

### 4) SME GMs (small/medium business buyer readiness)
They care about: ROI, simplicity, and low support burden.
- [ ] “Day-1 value” setup in <1 hour (or done-for-you onboarding).
- [ ] Clear monthly pricing + predictable costs.
- [ ] Simple reporting: how many cases, time saved, revenue added.
- [ ] Minimal compliance overhead; clear terms and data handling summary.

---

## D. Minimum “Pilot Package” (what you ship for your first real partner)
- [ ] Webhook intake + idempotency
- [ ] Case persistence + status lifecycle
- [ ] Deterministic decision + explanation trace
- [ ] Results webhook back to partner
- [ ] Tenant API keys + rate limiting
- [ ] A single dashboard view (even minimal) for exceptions
- [ ] 10–20 golden test transactions/receipts + regression checks

---

## E. What to cut (to stay MVP)
- [ ] Don’t chase “all insurance” or “all merchants.”
- [ ] Don’t become a carrier in MVP (unless you already have underwriting + compliance muscle).
- [ ] Don’t rely on LLMs for final decisions; use them to parse.
- [ ] Don’t build a huge UI suite before the webhook/case lifecycle works.
