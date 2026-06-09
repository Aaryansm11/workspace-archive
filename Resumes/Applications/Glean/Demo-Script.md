# Glean — Live Demo Script (SDIS)

**Why SDIS:** mirrors Glean's product (RAG over docs + security/audit + APIs) and has a real debugging story. *(LANGTRON is the backup if they lean ML.)*

## 60-second walkthrough
**[Repo + README]**
> "SDIS — a **secure RAG service**. Ingests docs, redacts PII, embeds + indexes them, serves retrieval over an API — built for **enterprise trust**, so every layer has auth + an audit trail."

**[Architecture, ~15s]**
> "FastAPI front door with **JWT + RBAC**. On ingest, a **PII-redaction** layer (spaCy NER + regex) masks/hashes sensitive fields *before* storage/indexing. Embeddings → **FAISS**; metadata + an **immutable audit log** → **Postgres**. Dockerized, with a **pytest suite in GitHub Actions CI**."

**[`app/services/redaction.py`, ~15s]**
> "Core piece — the PII detector returns typed spans; the redactor supports **mask / hash / remove** modes so a customer chooses how aggressive to be."

**[Live-debug moment, ~15s — the part they're testing]**
> "A real bug I fixed: the detector emitted **lowercase** type labels (`email`) but the API/tests expected **uppercase** (`EMAIL`), so every downstream filter silently matched nothing. The tests caught it — I standardized span types to uppercase **and** made the mask lookup case-insensitive so labels still resolved, then the suite went green."

## Design choices to defend
- **FAISS?** Fast, local, no external dep for a security-sensitive service; swap to pgvector/managed later.
- **Redact before indexing?** Never put raw PII in the vector store or logs — compliance-safe default.
- **RBAC + JWT + immutable audit?** Enterprise trust — every access authorized + traceable (= Glean's "security & audit").
- **Postgres + FAISS?** Right tool per job — ACID metadata/audit vs vector similarity.

## Have open before the call
1. Repo (README + structure)  2. `app/services/redaction.py`  3. The green CI run (or run `pytest`)  4. *(power move)* re-introduce the casing bug → tests fail → fix → green, live.

## If asked "did you use AI to build this?"
> "Yes — Claude Code. But I reviewed every change, understand each layer, and just walked you through a bug I diagnosed and fixed myself." (That *is* the AI-fluency signal.)
