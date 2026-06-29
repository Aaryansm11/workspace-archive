# RIBU — Backend Developer (two roles)

**Location:** Bangalore (onsite) · **Type:** onsite · **Source/link:** www.ribuworld.com
**Hiring team / contacts:** Apply via **jobs@ribuworld.com** — subject line must match the role exactly.
**Captured:** 2026-06-23

> RIBU = visual content / creative production company (premium photography, post-production, CGI, content automation, AI). Two open backend roles, both onsite Bangalore. Apply to **both** — distinct emphases.

---

## Role 1 — Senior Backend Developer  (subject line: "Backend Developer")

### About the role
Design, develop, optimize scalable, secure, high-performance backend systems. AWS serverless architectures, APIs, data pipelines, backend services powering media & workflow applications.

### Requirements
- **Python** backend on **AWS serverless** (Lambda, API Gateway, message queuing)
- Scalable **REST APIs**; **PostgreSQL** relational + non-relational modeling
- **IaC** (AWS SAM, YAML, CloudFormation)
- **BPMN workflow tools** (Camunda) — hybrid workflows + human tasks
- Secure coding, **JWT/OAuth2**, data encryption; performance/scalability/reliability
- Collaborate with frontend/DevOps/QA; **mentor juniors**, code reviews
- AWS Certification (Associate/SA) *desirable*; exposure to **media workflows (image/video/3D)** *desirable*

### Fit notes (Aaryan)
**Strong matches:** Python, FastAPI REST API design, PostgreSQL (+pgvector, Neo4j non-relational), message queuing (Kafka/Redpanda), event-driven distributed systems, JWT/RBAC, secure coding (SDIS: PII redaction, audit logging, signatures), Docker, AWS (EC2/S3/IAM/ECS), CI/CD, media pipeline (StudyLoop audio+PDF), multi-stage async workflows.
**Gaps:** AWS Lambda/serverless specifically (have ECS + event-driven Kafka), AWS SAM/CloudFormation, Camunda/BPMN, OAuth2 (have JWT), AWS cert. "Senior" (new-grad).
**Strategy:** lead with backend/distributed-systems depth + StudyLoop media pipeline + SDIS secure service. Map Kafka -> "message queuing", event-driven workers -> "workflow orchestration". Honest on serverless: position transferable AWS + event-driven experience; don't claim Lambda/Camunda.

---

## Role 2 — AI Backend Developer  (subject line: "AI Backend Developer")

### About the role
Build scalable distributed systems, **AI-powered platforms, search capabilities, high-performance media workflows** for a **greenfield AI SaaS** product (creative workflows for fashion/ecommerce). Small core early team, end-to-end ownership.

### Requirements
- **Python** + **FastAPI/Flask**; **PostgreSQL** (schema design, query optimization)
- Scalable **REST APIs** + **distributed systems**; **AWS serverless + event-driven**
- **AI-native backend**: agent orchestration, workflow automation, **human-in-the-loop**, **LLM / AI service integration**
- **Search**: OpenSearch/Elasticsearch/**PostgreSQL full-text**/**vector search**, metadata + semantic retrieval
- **Image/video/digital-asset** workflows; high-volume media movement cloud<->on-prem
- File transfer (FTP/SFTP, **multipart uploads, cloud object storage**, hybrid cloud/on-prem); DAM/storage integrations
- Strong **OOP, system design, DSA**; **ownership mindset**, fast-paced
- Performance/scalability/reliability/security/observability; mentor juniors

### Fit notes (Aaryan)
**Strong matches (excellent fit):** FastAPI/Flask, PostgreSQL+pgvector schema, **vector search (pgvector, FAISS) + semantic retrieval**, **LLM integration + RAG** (LANGTRON Mistral-7B LoRA, SDIS RAG, StudyLoop scoring), event-driven distributed systems (Kafka/Redpanda), **object storage (MinIO/S3, multipart)**, media/asset pipeline (StudyLoop audio+PDF at volume), DSA (150+), system design, greenfield solo-build ownership.
**Gaps:** OpenSearch/Elasticsearch (have pgvector/FAISS instead), FTP/SFTP (have object storage), AWS Lambda serverless (have event-driven + ECS/S3), formal "agentic frameworks". "Senior"/mentoring (new-grad).
**Strategy:** this is the stronger fit — lead with AI/LLM + vector search + event-driven + media pipeline. StudyLoop + LANGTRON + SDIS line up almost 1:1 with the JD. Honest substitutions: pgvector/FAISS for OpenSearch, object-storage/multipart for FTP/SFTP.
