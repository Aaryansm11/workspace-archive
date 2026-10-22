# READY-TO-GO Resumes (canonical set)

The polished, submittable resumes — QA-passed (4-prompt: results-first summary, metric-led bullets, 7-second top-third, ATS keywords). **This is the folder to keep updated.**

## Each resume comes in 4 formats
- **`.pdf`** — clean **LaTeX** (Latin Modern, one page). **Use this for humans / most applications.**
- **`.docx`** — ATS-friendly Word (use when a portal requires `.doc`/`.docx`).
- **`.md`** — the editable **source of truth**.
- **`.tex`** — LaTeX source (tweak directly if you like).

## Master (general / portfolio)
`Resume_Aaryan_Master` (in this folder's root) — **role-agnostic**, shows the full breadth (ML · backend · solutions). Best for your **portfolio**, LinkedIn *Featured*, or general sharing where no single track fits.

## The 10 role-tailored (apply in this fit-ranked order)
**ML/AI** — `AI-LLM-Engineer` ⭐ · `Healthcare-Biosignals-ML` · `ML-Engineer` · `Applied-Scientist`
**Solutions** — `Integration-Solutions-Engineer` · `Implementation-Integration-Engineer` · `Technical-Account-Manager`
**SDE** — `Backend-Engineer-Python` · `Full-Stack-Engineer` · `Data-Platform-Engineer`

## Business track (added 2026-10-22) — `Business/`
Built around the HyperVerge **Key Account Manager** role (Aug 2026 – present): 34-account BFSI book, ~$22K MRR, ~112% GRR, **$8K MRR booked / $5K realised in the first 3 months**. Projects are trimmed to two one-liners; technical depth is framed as the edge.
- `Account-Executive-Manager` — for **AE / AM / KAM / CSM** roles (deals, negotiation, retention, expansion).
- `Business-Strategy` — for **business / strategy / BizOps / growth** roles (portfolio analytics, market research, pricing, revenue leakage).
Headlines describe experience (BFSI account management, revenue growth, solutions), **not** a title you don't hold yet.

## To update in the future
1. Edit the relevant **`.md`**.
2. Run **`./convert.sh`** → regenerates `.docx` + `.tex` + `.pdf`. Requires **pandoc** + **tectonic** (both installed). LaTeX style lives in `_build/md2tex.py`.

## Before you send (truth holds)
- **Finish 150 LeetCode** — it's on the SDE/ML resumes.
- At each application, run **Prompt 1 (ATS keyword gap)** against the specific job posting and tweak.
- Everything here maps to verified facts in `../00-Master-Profile.md` — nothing invented.
