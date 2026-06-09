# 3 — Resume System

**Location:** `/Users/aaryanmaralihalli/Documents/AI-Project/Resumes/`
- `00-Master-Profile.md` — single source of truth (everything true about Aaryan; resumes tailor *from* this, nothing invented).
- `01-Roles/`, `02-Output/{Solutions,SDE,ML}/`, `03-Research/` (success-profiles + staging), `batches/batch-2026-06-06-jobsearch/` (gap analysis, discovered experiences, batch summary).

## Context
Aaryan wasn't converted from his HyperVerge internship → needs to apply broadly. Goal: 10 resumes across **Solutions / SDE / ML**.

## Method (the actual resume-tailoring skill)
Installed `~/.claude/skills/resume-tailoring` and followed its phases (after an initial misstep where Claude used its own workflow — corrected on Aaryan's instruction):
- **Phase 0** library = Master Profile (built from resume + capstone + IEEE paper + HyperVerge task sheets + GitHub).
- **Phase 1** aggregate gap analysis (`_aggregate_gaps.md`).
- **Phase 2** shared discovery interview (`_discovered_experiences.md`).
- **Phase 3A** per-role **market research** (`03-Research/success-profiles.md`, with sources) — *was skipped initially, then done properly.*
- **Phase 3/4** generate + refine 10 resumes + batch summary.
- Plus the **4 prompts** as a QA layer (ATS keywords, bullet formula, 7-sec scan, summary punch).

## The 10 resumes (fit-ranked — apply in this order)
1. **AI/LLM Engineer** ⭐ (RAG + fine-tuning = top market skills; matches LANGTRON/SDIS) · 2. **Healthcare/Biosignals ML** (IEEE paper + domain edge) · 3. **Solutions/Sales Eng** · 4. **Integration Eng** · 5. **ML Engineer** · 6. **Backend (Python)** · 7. **TAM** (target junior/associate) · 8. **Data/Platform** (Kafka/Spark) · 9. **Full-Stack** (React+Python) · 10. **ML/Research Eng** (paper-led; pure "Applied Scientist" usually needs a PhD).

## Truth-preserving rules applied (important)
- **Refused to fabricate** a CI/CD project → instead built it for real on SDIS (now true).
- **LeetCode "150+"** is on SDE/ML resumes — **must be finished before sending** (Aaryan is completing this month).
- **Kubernetes omitted** — Aaryan was unsure / unverified.
- **Full-Stack:** dropped Node.js/TypeScript claims (he lacks them) → positioned as React + Python.
- **Data Scientist → reframed to ML/Research Engineer** (no stats/experimentation evidence).
- Real numbers pulled from his **task sheets** (15+ lines-of-business, full KYC module range) + HyperVerge KB.

## Honest scope note
Phase 3A did role-**requirement** research (the substance). Deeper LinkedIn per-role benchmarking can be layered on later for even tighter terminology.

## QA + canonical output
All 10 went through a **4-prompt QA pass** (results-first summaries, metric-led bullets, 7-second top-third, ATS keywords) and are packaged in **`Resumes/READY-TO-GO/{Solutions,SDE,ML}/`** as `.md` + **`.docx`** (submit — ATS-friendly) + **`.html`** (open → ⌘P → Save as PDF). This folder is **canonical and updatable**: edit the `.md`, run `READY-TO-GO/convert.sh` to regenerate. (`02-Output/` keeps the original `.md` drafts.) Stylesheet: `Resumes/03-Research/_export/style.html`.

## Next
- Finish LeetCode 150. Review the 10. At each application, run **Prompt 1 (ATS)** against the real JD. Optional: deeper LinkedIn research; learn TS + MLOps (named gaps).
