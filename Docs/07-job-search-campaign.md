# 7 — Job-Search Campaign & Applications

## Why this phase
Aaryan was **not converted to full-time at HyperVerge** (internship ends Jun 2026). So the engagement pivoted from "build the system" to **running an actual job search** as a Jul-2026 new grad, using the assets already built (10 role-tailored resumes, the Master Profile, the GitHub cleanup).

## Goal
Land a strong early-career role in **Bangalore / remote India** across three role families:
- **Solutions / Integration Engineer** (his HyperVerge lane, strongest fit)
- **Backend / SDE**
- **AI / ML / AI Engineer** (his projects + IEEE paper are the edge)
- *(APM as a deliberate stretch.)*

## How applications are organized
Per-company folders under `Resumes/Applications/{Company}/`, each holding: `JD.md` (role + fit notes + comp), the tailored resume (`.md/.tex/.pdf/.docx`), and for tracked ones `Application-Answers.md`, `Outreach.md`, `Demo-Script.md`. Supporting files: `README.md` (status tracker), `_TEMPLATE/` (copy for new companies), `convert.sh` (rebuilds any company resume's pdf/docx/tex via the shared `../READY-TO-GO/_build/md2tex.py`), plus `_Job-Targets-*.md`, `_Market-Analysis.md`, `_Salary-and-Roles.md`, `Referrals.md`.

## Companies pursued (as of 2026-06)
| Company | Role applied-for | Path | Notes |
|---|---|---|---|
| **Glean** | Solutions Architect | referral via **Manav** → Nityang (HR) | Senior (6–10 yr) reach; SDIS/RAG is literally their domain. Also a Backend/ML SWE option. |
| **Razorpay** | AI/ML Engineer (live req is **Solutions Engineer**) | referral via **Madhumita** | Top fit + stability. ⚠️ resume titled AI/ML but live opening is Solutions — confirm req. |
| **Postman** | AI Engineer (live reqs were **TSE + Fullstack**) | direct apply | Strong API+AI keyword match; ⚠️ same title-mismatch caveat. |
| **Plotline** | AI Product Engineer | direct apply | Front-end + real-time + AI; "engagement" framing is a slight stretch. |
| **Myelin Foundry** | ML Engineer | direct/referral | Edge-AI / applied ML. |
| **Navi** | Associate Product Manager | referral via **Pranav Gangrade** (1st°) | Function switch + 0 PM yrs → reach; reframed Solutions work into product language. |
| **Yellow.ai** | SDE / Backend | (later **flagged: reconsider**) | Market analysis rated stability **1/5** (two 2025 layoff rounds). |

## The master resume (portfolio / general)
Built a **role-agnostic master resume** for the portfolio and general sharing: first a one-page high-value version, then on request a **comprehensive 2-page "everything" version**, then a final **one-page** iteration keeping only the highest-value content with details. Lives in `READY-TO-GO/Resume_Aaryan_Master.*`.

## Resume format
All resumes render through `READY-TO-GO/_build/md2tex.py` → **tectonic** (LaTeX) → PDF, styled to match **Aaryan's own `resume6-1.tex`**: Latin Modern serif, Title-case ruled sections, bold company + italic role with right-aligned dates, projects as bold-title + right-aligned repo link + bullets, `·` dot-separated contact line, one page. `.docx` (pandoc) for ATS portals.

## QA: the 4-prompt pass + ATS review
Every resume went through the **4 prompts** (P1 ATS keywords, P2 verb+what+result bullets, P3 7-second scan, P4 summary punch). On the ML-track resumes (Razorpay/Postman/Plotline) the ATS review found: **structurally ATS-safe** (single column, standard headers, quantified, text-based — submit the `.docx`), keyword-strong for AI roles, but two score-capping issues no wording fixes: **role-title mismatch** (live reqs were Solutions/Support, not AI/ML) and the **new-grad-vs-years** gap. Conclusion: the **referral** matters more than ATS tuning.

## Truth-preserving (held throughout)
Refused to fabricate (e.g., the CI/CD project was *built real* on SDIS, not faked). Flagged stretches honestly: "fintech-native AI" (his fintech work was KYC integration, not ML modeling), "engagement" framing for Plotline (his metric was KYC verification conversion), "HV Deals Bot adopted org-wide" (source says "across the team"), and **"150+ LeetCode" — still `[CONFIRM]`: don't ship the number until it's actually reached.**
