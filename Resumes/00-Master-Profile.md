# Master Profile — Aaryan S. Maralihalli (single source of truth)

> Everything true about Aaryan, in one place. Every resume is tailored *from* this file — nothing gets
> invented during tailoring. `[CONFIRM: …]` marks gaps the discovery step must fill before final resumes.
> Last built: 2026-06-06. **Updated 2026-06-12** (synced with GitHub + live portfolio; AlgoScope, portfolio-site, and TypeScript/Next.js confirmed real and verified).

## Contact
- Aaryan S. Maralihalli · aaryanmaralihalli@gmail.com · +91-9019884683
- github.com/Aaryansm11 · linkedin.com/in/aaryan-maralihalli · **portfolio: portfolio-zeta-ten-85.vercel.app**

## Education
- **PES University, Bangalore** — B.Tech, Computer Science & Engineering — 2022 – **Jul 2026** · CGPA omitted by choice

## Experience

### HyperVerge — Integration Engineer Intern (KYC & identity, fintech) · **Jan 2026 – Jun 2026** (internship)
AI identity-verification / KYC platform. Owned client-facing solutioning and integrations for banking/fintech accounts.
- Designed and delivered KYC product integrations for enterprise fintech/banking clients (**HomeCredit, PaytmMoney, Mobikwik, Shivalik Bank, IndMoney, Emergency Paisa**) across **Name Match, eSign / eSign Start, Video KYC, Selfie/Liveness/Face Match, DigiLocker, and document APIs (White-bg-gen, PDF Preview)**.
- Authored Solution Design Docs (Notion), issued production credentials, configured API rate limits and staging app IDs, and managed deal milestones in HubSpot.
- Drove **post-go-live Business Impact (BI) & stabilization** — monitored conversion/drop-off (e.g., IndMoney drop-off, HomeCredit BI), and pushed optimizations.
- Raised and resolved JIRA tickets; coordinated with Product/Engineering on feature requests and shipped a workaround for an eSign-Start gap to production.
- **Built "HV Deals Bot"** — an internal Slack bot (Python backend) that tracks every deal's stage and next steps across the team, so no step is missed and the process is documented for new joiners.
- **Impact (confirmed):** handled **6 enterprise clients**; took **3 live at >95% verification conversion** — a **~10% conversion lift** vs their prior flow — by mapping pain points to the right modules and proactively adding modules clients hadn't scoped; **3 more clients in active integration** at internship end.

### Integrated Genetic Solutions (IGS), Bangalore — Project Intern (Medical AI & Web Dev) — Jun–Aug 2024
- Migrated a legacy JavaScript + Bootstrap medical dashboard to a **React MERN** stack, improving processing of **5M+ blood lab values**.
- Worked on **SafeScribe**, IGS' HIPAA-compliant medical AI for extracting lab values across major labs (Quest, LabCorp, BioReference); assisted React + Django integration for secure uploads and API telemetry.
- `[CONFIRM: keep as-is? It reads "observed"-heavy — can we surface anything you actually built/owned?]`

## Publication
- **"An Interpretable Model for Stroke Prediction and Arrhythmia Classification using ECG & PPG"** — IEEE ICASI 2026 (Intl. Conference on Applied System Innovation), Kyoto, Japan, Apr 14–17 2026 — **Oral Presentation** (Paper J260481). Authors: Jananii Ramesh; **Aaryan S. Maralihalli**; Ajay Krishna; Siddhant Sachan; Saritha.

## Projects (with accurate tech + role fit)

### ⭐ CallSense — Sales-Call Intelligence Platform  `[ML, SDE, Systems]`  *(new, 2026-07; live + verified)*
Repo: `callsense` (private) · Live: **callsense-aaryan-s-maralihallis-projects.vercel.app** · API: `callsense-production-d0b3.up.railway.app/docs`
- Built for an AI-engineer take-home (FitNova sales-call QA), then production-hardened and deployed. **Full loop:** source-agnostic ingestion (folder/REST/CRM adapters, sha256 idempotency keys) → **Postgres-backed job queue (`FOR UPDATE SKIP LOCKED`, retries + backoff + jitter, dead-letter, crash-resume)** → local **faster-whisper** STT (Hinglish; language-hint keeps output in Devanagari) → **voice-based mono diarisation (numpy-only spectral+pitch fingerprints, deterministic 2-means)** with an LLM content-check that flips swapped speaker roles → PII redaction (regex + Luhn) **before** any external API → **Gemini rubric scoring + issue flags behind a closed taxonomy and a quote-verification gate** (Unicode fuzzy match; unverified flags dropped; timestamps derived by code, never the model) → compliance cap (one critical mis-selling flag caps the call score at 40).
- **Human feedback loop:** advisor disputes → TL upholds/dismisses → composite recomputes (cap lifts) → resolutions become few-shot calibration examples injected into future prompts; append-only audit log. Three role dashboards (Director/TL/Advisor) with audio-synced transcript, flags pinned at timestamps, click-flag-to-seek.
- **Deployed on free tiers:** Vercel (Next.js; edge rewrite proxies all API traffic because Indian ISPs refuse DNS for `*.up.railway.app`) → Railway Docker (FastAPI + inline worker thread, Whisper `base`) → Neon Postgres. **37 tests + GitHub Actions CI** (postgres service container). Measured: Whisper `small` ≈ 3.3× real-time on CPU; ~300–400 five-minute calls/day/worker.
- **Stack:** FastAPI, SQLAlchemy 2 + Alembic, PostgreSQL (SKIP LOCKED queue, JSONB, window-function rollup views), faster-whisper, Gemini (google-genai), Next.js + Tailwind + Recharts, Docker Compose, Railway/Vercel/Neon.

### ⭐ Capstone / Published — Self-Supervised Cardiac Pattern Discovery for Stroke Risk  `[ML, DS]`
Repos: `ecg-ppg-arrhythmia-prediction`, `CAPSTONE75` (deployment). The published work above.
- Self-supervised **contrastive learning (SimCLR / NT-Xent)** on **MIMIC-III** ECG/PPG — **133,157** 10s segments, 8 channels, 288 matched patients; custom 1D-CNN **WaveformEncoder** (~238K params, 128-d embeddings).
- Multi-modal fusion with a **Random Forest** clinical model (14 features) — **ROC-AUC 0.757**, recall 0.57 on rare (~5%) stroke class; benchmarked vs **CHA₂DS₂-VASc**.
- **Explainable AI**: temporal saliency, channel importance, integrated gradients; **FastAPI** inference server + Streamlit dashboard + PDF reports.

### ⭐ LANGTRON — AI Technical Memory Assistant  `[ML, SDE]`
- **Fine-tuned Mistral-7B (LoRA)** for technical recall; **dual-model** (memory + problem-solving) architecture.
- **FAISS** semantic memory with **sub-100ms** retrieval; automatic activity monitoring; 100% local (no cloud).

### ⭐ Langtron-KGS — Knowledge Graph Microservice  `[ML, SDE]`  *(not on current resume)*
- Converts unstructured docs (PDF/DOCX/TXT) into a **knowledge graph**: **spaCy NER + BERT relation extraction → Neo4j**; Wikidata entity linking.
- **FastAPI** REST API + Streamlit graph visualization; modular, logged, monitored.

### ⭐ SDIS — Secure Document Intelligence Service  `[SDE, ML]`  *(resume mislabels it "Secure Data Ingestion")*
- Enterprise secure **RAG** platform: PII **redaction (spaCy)**, embedding search (**FAISS**, OpenAI/HF), **RBAC + JWT**, **immutable audit logging + digital signatures**, multi-tenancy.
- **FastAPI**, **PostgreSQL**, rate limiting, CORS; Docker on AWS ECS. `[CONFIRM: align resume bullet to actual repo scope]`

### ⭐ StudyLoop — Event-Driven AI Study Platform  `[SDE, ML, Systems]`  *(new, 2026; in progress)*
Repos: `studyloop` (private full source) · `studyloop-showcase` (public). Portfolio piece for applied ML × distributed systems.
- **Event-driven microservices** on a Kafka-compatible broker (**Redpanda**): decomposed a FastAPI monolith into **gateway + transcription-worker + analysis-worker**; topics keyed by `project_id` for per-entity ordering; **consumer groups, manual offset commit, exponential backoff + jitter retries, per-topic dead-letter queues + replay, idempotency ledger (`event_id` / `processed_events`), bounded concurrency, graceful degradation** — verified end-to-end (backpressure / DLQ / replay).
- **Media + data pipeline:** ingests **audio recordings and PDF documents** → **object storage (MinIO / S3-compatible)** → ML model-serving services (speech-to-text, embeddings, scoring) called over **versioned HTTP contracts** → **PostgreSQL + pgvector vector search (HNSW indexes)** for note↔document semantic relevance (RAG) → LLM coverage scoring.
- **Stack:** FastAPI (async), **Redpanda/Kafka**, **PostgreSQL + pgvector**, **MinIO**, Redis, Docker Compose; shared `app` package with thin service entrypoints. `[ML models currently served as stable stubs that swap to real impls behind unchanged contracts — systems backbone is built & demoable.]`

### Live Emostream — Event-Driven Real-Time Emotion/Emoji Streaming  `[SDE, Data]`
- **Kafka + Spark Structured Streaming + Redis + Flask-SocketIO**, concurrent emoji broadcast over event-driven architecture; **nginx load balancing**; **Locust** load tested to 1000 concurrent users.

### ⭐ AlgoScope — In-Browser DSA Visualizer  `[Front-end, SDE]`  *(new, 2026-06; verified)*
Repo: `algoscope` (TypeScript) · Live: **algoscope-beta.vercel.app**
- Paste a Python LeetCode solution and **watch it run in-browser** via **Pyodide**: animated data-structure cards, flow arrows, recursion call-stack.
- **React / Next.js / TypeScript**, deployed on Vercel. Aaryan's main front-end / TypeScript artifact.

### ⭐ Portfolio site  `[Front-end]`  *(new, 2026-06; verified)*
Repo: `portfolio-site` (TypeScript) · Live: **portfolio-zeta-ten-85.vercel.app**
- **Next.js + shadcn + TypeScript**, cinematic 3D intro; showcases the full project set. Supersedes the old `Portfolio` (HTML) repo.

### Hospital Management System (OOAD)  `[SDE — Java]`
- **Spring Boot + Java + MySQL** CRUD system (departments, doctors, staff, appointments); OOAD design. *(Aaryan's main Java/Spring artifact — important for Java SDE roles.)*

### AirlineDB Management  `[SDE]` — DBMS project with front-end (Python). `[CONFIRM: stack/DB; add README]`
### CloudComputingMonolithic  `[SDE]` — Python; `[CONFIRM: what it does — monolith→microservices? add README]`
### FinFusion (TDL-FinancialReportPipeline, fork)  `[ML]` — multimodal stock forecasting (LSTM + transformer sentiment), MAPE ↑15–20%. `[CONFIRM: did you build/contribute, or just fork?]`
### Minor / supporting: Portfolio (HTML/CSS/JS), AirlineDB front-end, course repos. Duplicate capstone repos to archive: `CAPSTONE-100-ALTERNATE`, `demo_capstone`, `capstone_proto`.

## Skills (consolidated, accurate)
- **Languages:** Python, Java, **TypeScript / JavaScript** (React, **Next.js**), SQL  *(TypeScript now real — see algoscope + portfolio-site)*
- **ML / AI:** PyTorch, HuggingFace Transformers, LangChain, FAISS, spaCy, BERT; contrastive / self-supervised learning, LoRA fine-tuning, RAG, XAI (saliency, integrated gradients), Random Forest
- **Backend / Web:** FastAPI, Flask, Spring Boot, Django, **React, Next.js (TypeScript), shadcn**, MERN, REST, JWT, RBAC, Streamlit
- **Data / Infra:** Kafka, Spark, Redis, Neo4j, PostgreSQL, MySQL, HDF5, Pandas/NumPy
- **Cloud / DevOps:** AWS (EC2, S3, IAM, ECS), Docker, GitHub Actions, nginx, Locust
- **Domain:** KYC/identity & fintech integrations, healthcare/biosignals (ECG/PPG), solution design, BI & stabilization

## Certifications
- Graphics Programming with WebGL (PESU I/O); Problem Solving — Intermediate (HackerRank); CITI Program (Conflicts of Interest; Data/Specimens Only Research)

## Confirmed (2026-06-06)
- HyperVerge = **Integration Engineer Intern**, Jan–Jun 2026, internship only. Metrics confirmed (above).
- Graduation **Jul 2026**, no CGPA. Target: **Bangalore / remote** now, **US later**. Level: **new-grad**.
- **FinFusion = Aaryan's own work.** **IGS = keep** (led Bootstrap-JS → React migration).

## Confirmed / synced (2026-06-12 — verified on GitHub + live sites)
- **AlgoScope** (`algoscope`, TypeScript) and **portfolio-site** (`portfolio-site`, Next.js/TypeScript) are real, deployed, and his — verified on GitHub. **TypeScript / Next.js are now genuine skills** — this supersedes the earlier "lacked TypeScript" note (it became real via these two builds). They can be claimed and defended.
- Dup capstone repos archived (`demo_capstone`, `capstone_proto`, `CAPSTONE-100-ALTERNATE`); SDIS, ecg-ppg, our-life-hq, LANGTRON, Langtron-KGS, Live_emostream all live & public.
- Live portfolio headline: "AI/ML Engineer & Solutions/Integration Engineer."
- `[CONFIRM: LeetCode "150+" — the AI/ML resumes (Razorpay/Postman/Plotline) claim 150+ solved. Verify the milestone is actually reached before shipping that number.]`
- **Canonical workspace = `~/Documents/aaryan-workspace-private`** (the older `~/Documents/AI-Project` is a stale duplicate; a private `workspace-archive` repo also exists on GitHub).

## Remaining / needs input
- ~~**GitHub write access**~~ — **RESOLVED:** repos are under `Aaryansm11` and pushes work (`portfolio-site`, `algoscope`, SDIS pushed 2026-06).
- **HV Deals Bot** code location (to sanitize + publish).
- **Hospital Mgmt** — OK to add CI workflow + starter tests?
- Canonical capstone repo to keep (proposed: keep `ecg-ppg-arrhythmia-prediction` + `CAPSTONE75`; archive `demo_capstone`, `capstone_proto`, `CAPSTONE-100-ALTERNATE`).
