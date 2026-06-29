# RIBU — Application & Screening Answers

Applies to **both** roles (Senior Backend Developer · AI Backend Developer). Apply to each separately — email `jobs@ribuworld.com` with the exact subject line ("Backend Developer" / "AI Backend Developer") and the matching resume PDF.

## Q: "Why RIBU / why this role?"
- RIBU is building **AI-native creative infrastructure that moves high-volume media at scale** — that's exactly the kind of system I most enjoy: event-driven backends, media pipelines, and AI/retrieval glued together. My StudyLoop project is a smaller version of the same shape (audio/PDF ingestion → object storage → ML serving → vector search).
- The **AI Backend** role's greenfield, small-core-team, end-to-end-ownership framing fits how I already work — I solo-architected StudyLoop's distributed backbone (Kafka, DLQ/idempotency/retries) and its RAG/vector-search layer.
- I want to do **applied AI + systems** together, not one or the other. RIBU is one of the few places where backend, search, LLMs, and media all meet.

## Q: "You're early-career but these say 'Senior' — why apply?"
> Honest framing: I'm a 2026 CS grad, not a 4–5 yr senior. I'm applying on **demonstrated depth, not tenure** — a built-and-verified event-driven distributed system, real LLM/RAG/vector-search projects, and an IEEE publication. I'd join wherever the team places me on level; the work itself is what I'm matching to. (Lead the AI Backend application — it emphasizes ownership/skills over years.)

## Q: "Experience with AWS serverless (Lambda/SQS/SNS)?"
> Direct serverless (Lambda) is a **gap** — I'll say so. What I bring that transfers: **event-driven architecture** with Kafka/Redpanda (consumer groups, DLQ, retries, idempotency), and AWS **ECS/S3/IAM** + Docker. The concepts (queues, fan-out, idempotent handlers, backpressure) are exactly what I built; mapping them onto Lambda/SQS/SNS is a ramp, not a relearn.

## Q: "Search experience — OpenSearch/Elasticsearch?"
> I've built **vector search and semantic retrieval** with **pgvector (HNSW)** and **FAISS**, plus **Neo4j** knowledge-graph + full-text/metadata search. I haven't run OpenSearch/Elasticsearch in production, but the retrieval concepts (indexing, recall@k, hybrid lexical+semantic) carry directly.

## Q: "Media / digital-asset workflows?"
> StudyLoop moves **audio + PDF** through ingestion → **object storage (MinIO/S3, multipart)** → processing workers. Same pattern RIBU needs for image/video/3D assets; I haven't done FTP/SFTP or 3D specifically (gap I'll name).

## Demo / exercise prep
- **Lead demo: StudyLoop** — whiteboard the event-driven flow (gateway → Kafka topics keyed by project_id → transcription/analysis workers → pgvector), then show DLQ/replay + idempotency. Defends: why Kafka over direct calls, ordering guarantees, exactly-once-ish semantics, graceful degradation.
- **AI depth: LANGTRON** (Mistral-7B LoRA + FAISS sub-100ms) and **SDIS** (RAG + JWT/RBAC + PII redaction + CI).
- Be ready to **live-code a REST endpoint in FastAPI** and a **PostgreSQL schema + query** (schema design + EXPLAIN/optimization).

## Notes
- Subject lines must be exact. Resume PDFs: `Resume_Aaryan_RIBU_Senior-Backend-Developer.pdf` and `Resume_Aaryan_RIBU_AI-Backend-Developer.pdf`.
- Before sending: confirm **LeetCode 150** milestone (claimed on the resume).
