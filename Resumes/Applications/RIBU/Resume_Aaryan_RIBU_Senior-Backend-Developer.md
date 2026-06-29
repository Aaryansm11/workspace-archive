# Aaryan S. Maralihalli
**Backend Developer (Python · AWS · PostgreSQL)**
Bangalore, India · aaryanmaralihalli@gmail.com · +91-9019884683
[github.com/Aaryansm11](https://github.com/Aaryansm11) · [linkedin.com/in/aaryan-maralihalli](https://linkedin.com/in/aaryan-maralihalli) · [portfolio](https://portfolio-zeta-ten-85.vercel.app)

---

## Summary
Backend engineer who builds **secure, scalable, event-driven Python services end-to-end** — REST APIs on **FastAPI**, relational data on **PostgreSQL**, message-queued distributed workflows, and a **media-processing pipeline** (audio + PDF) on object storage. Strong on secure coding (JWT/RBAC, PII redaction, audit logging) and reliability patterns (retries, DLQ, idempotency). Shipped production REST/SDK integrations for enterprise fintech clients at HyperVerge. CS graduate (Jul 2026), IEEE-published.

## Experience

**HyperVerge** — Integration Engineer Intern · Jan 2026 – Jun 2026 · Bangalore
*Enterprise AI identity-verification / KYC platform*
- Integrated and debugged **production REST APIs / SDKs** for **6 enterprise fintech clients**; configured API rate limits, staging app IDs, and issued production credentials.
- Drove **post-go-live performance & reliability** — monitored conversion/drop-off, diagnosed failures, and shipped fixes with Product/Engineering; took **3 clients live at >95% conversion**.
- Built **"HV Deals Bot"** — a **Python + Slack** backend service tracking deal state and next steps across the team.

**Integrated Genetic Solutions (IGS)** — Project Intern · Jun 2024 – Aug 2024 · Bangalore
- Supported **React + Django** integration for secure uploads and API telemetry on a HIPAA-compliant product processing **5M+ records**.

## Selected Projects
- **StudyLoop — event-driven AI platform** *(media pipeline + distributed backend)*: decomposed a **FastAPI** monolith into **gateway + worker services** on **Kafka (Redpanda)** — topics keyed for ordering, **consumer groups, retries w/ backoff+jitter, dead-letter queues + replay, idempotency ledger, graceful degradation**. Ingests **audio + PDF media** to **object storage (MinIO/S3)** then **PostgreSQL + pgvector**; multi-stage async workflows across services. Dockerized.
- **SDIS — Secure Document Intelligence Service:** **FastAPI** service with **JWT auth, RBAC, PII redaction (spaCy), immutable audit logging + digital signatures**; embedding search over **PostgreSQL** (SQLAlchemy/Alembic); Dockerized with **pytest + GitHub Actions CI**.
- **Live Emostream:** event-driven **Kafka + Spark + Redis** pipeline with **nginx** load balancing; **Locust-tested to 1,000 concurrent users**.
- **Langtron-KGS:** **FastAPI** microservice converting documents to a **Neo4j** knowledge graph (spaCy NER + BERT) — relational *and* non-relational data modeling.

## Skills
**Languages:** Python, Java, SQL, JavaScript/TypeScript
**Backend & APIs:** FastAPI (async), Flask, Django, Spring Boot, REST API design, JWT, RBAC, SQLAlchemy/Alembic, asyncio
**Data:** PostgreSQL (+ pgvector), MySQL, Neo4j, Redis — relational & non-relational schema design, query optimization
**Distributed / Infra:** Kafka (Redpanda), event-driven architecture, message queues, DLQ/retries/idempotency, Docker & docker-compose, AWS (EC2/S3/IAM/ECS), nginx, GitHub Actions CI/CD
**Media / pipelines:** high-volume audio + PDF ingestion, object storage (MinIO/S3), data pipelines
**CS foundations:** Data Structures & Algorithms (150+ LeetCode), OOAD, DBMS, secure coding, testing (pytest)

## Publication & Education
- **IEEE ICASI 2026 (Kyoto), Oral Presentation** — *"An Interpretable Model for Stroke Prediction and Arrhythmia Classification using ECG & PPG."*
- **B.Tech, Computer Science** — PES University, Bangalore — 2022 – Jul 2026
- *Certifications:* WebGL (PESU I/O); Problem Solving — Intermediate (HackerRank); CITI Program
