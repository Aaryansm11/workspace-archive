# Master Profile — Aaryan S. Maralihalli (single source of truth)

> Everything true about Aaryan, in one place. Every resume is tailored *from* this file — nothing gets
> invented during tailoring. `[CONFIRM: …]` marks gaps the discovery step must fill before final resumes.
> Last built: 2026-06-06.

## Contact
- Aaryan S. Maralihalli · aaryanmaralihalli@gmail.com · +91-9019884683
- github.com/Aaryansm11 · linkedin.com/in/aaryan-maralihalli

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

### Live Emostream — Event-Driven Real-Time Emotion/Emoji Streaming  `[SDE, Data]`
- **Kafka + Spark Structured Streaming + Redis + Flask-SocketIO**, concurrent emoji broadcast over event-driven architecture; **nginx load balancing**; **Locust** load tested to 1000 concurrent users.

### Hospital Management System (OOAD)  `[SDE — Java]`
- **Spring Boot + Java + MySQL** CRUD system (departments, doctors, staff, appointments); OOAD design. *(Aaryan's main Java/Spring artifact — important for Java SDE roles.)*

### AirlineDB Management  `[SDE]` — DBMS project with front-end (Python). `[CONFIRM: stack/DB; add README]`
### CloudComputingMonolithic  `[SDE]` — Python; `[CONFIRM: what it does — monolith→microservices? add README]`
### FinFusion (TDL-FinancialReportPipeline, fork)  `[ML]` — multimodal stock forecasting (LSTM + transformer sentiment), MAPE ↑15–20%. `[CONFIRM: did you build/contribute, or just fork?]`
### Minor / supporting: Portfolio (HTML/CSS/JS), AirlineDB front-end, course repos. Duplicate capstone repos to archive: `CAPSTONE-100-ALTERNATE`, `demo_capstone`, `capstone_proto`.

## Skills (consolidated, accurate)
- **Languages:** Python, Java, JavaScript (React), SQL
- **ML / AI:** PyTorch, HuggingFace Transformers, LangChain, FAISS, spaCy, BERT; contrastive / self-supervised learning, LoRA fine-tuning, RAG, XAI (saliency, integrated gradients), Random Forest
- **Backend / Web:** FastAPI, Flask, Spring Boot, Django, React (MERN), REST, JWT, RBAC, Streamlit
- **Data / Infra:** Kafka, Spark, Redis, Neo4j, PostgreSQL, MySQL, HDF5, Pandas/NumPy
- **Cloud / DevOps:** AWS (EC2, S3, IAM, ECS), Docker, GitHub Actions, nginx, Locust
- **Domain:** KYC/identity & fintech integrations, healthcare/biosignals (ECG/PPG), solution design, BI & stabilization

## Certifications
- Graphics Programming with WebGL (PESU I/O); Problem Solving — Intermediate (HackerRank); CITI Program (Conflicts of Interest; Data/Specimens Only Research)

## Confirmed (2026-06-06)
- HyperVerge = **Integration Engineer Intern**, Jan–Jun 2026, internship only. Metrics confirmed (above).
- Graduation **Jul 2026**, no CGPA. Target: **Bangalore / remote** now, **US later**. Level: **new-grad**.
- **FinFusion = Aaryan's own work.** **IGS = keep** (led Bootstrap-JS → React migration).

## Remaining / needs input
- **GitHub write access:** `gh` is logged in as `aaryansmaralihalli` but repos are under `Aaryansm11` (read-only) → can't push until re-auth as `Aaryansm11`, or Aaryan applies changes manually.
- **HV Deals Bot** code location (to sanitize + publish).
- **Hospital Mgmt** — OK to add CI workflow + starter tests?
- Canonical capstone repo to keep (proposed: keep `ecg-ppg-arrhythmia-prediction` + `CAPSTONE75`; archive `demo_capstone`, `capstone_proto`, `CAPSTONE-100-ALTERNATE`).
