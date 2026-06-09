# 6 — Resume Finalization: QA Polish + Exports + READY-TO-GO

The final pass that turned the 10 generated resumes into a **submittable, maintainable** set.

## Exports (LaTeX + pandoc)
- Added **pandoc 3.9** and **tectonic 0.16** (self-contained LaTeX engine — no MacTeX) via Homebrew.
- Each resume → **`.pdf`** (clean **LaTeX**, Latin Modern serif, **Title-case ruled section headers, bold company+location / italic role with right-aligned dates** — matched to Aaryan's inbox template `resume6-1`, one page) + **`.docx`** (ATS) + **`.tex`** (LaTeX source) + **`.md`** (source).
- Pipeline: `READY-TO-GO/_build/md2tex.py` (markdown → LaTeX, with the style/template) → **tectonic** → PDF; **pandoc** → DOCX. Re-run via `READY-TO-GO/convert.sh`.
- Note: the skill does **not** prescribe any visual format (it's content/structure only), so the LaTeX style is custom-built to match Aaryan's own `resume6-1.tex` template: `\section*` + titlerule, `hidelinks`, `\quad` contact line, bold Company,Location / italic Role + right-aligned dates, **Projects as bold title + right-aligned repo link + bullets**, **Skills as bullets**. Margins set to **0.5in** (vs the template's 1in) so the fuller content stays **one page**. A few compact ML entries were normalized to `**Company** — Role · Dates · Location` + bullet so they render as proper subheadings.

## 4-prompt QA polish (applied to all 10)
The skill's output + the "4 prompts" as a QA layer:
- **P4 — summary:** rewrote every summary *results-first*, specific, 5-second clarity. Examples:
  - **AI/LLM** → leads with "**RAG and fine-tuning**" (the two most in-demand skills).
  - **Healthcare-ML** → leads with the **IEEE paper + ROC-AUC 0.757**.
  - **Solutions** → leads with "**>95% conversion (~10% lift) across 15+ LOBs**."
- **P2 — bullets:** verified verb + what + measurable result (already met; tightened where verbose).
- **P3 — 7-second scan:** top-third (name / role / summary / first experience) scans fast; kept to one page.
- **P1 — ATS keywords:** each role's success-profile keywords present (from Phase 3A research). *Full P1 vs a specific JD is an at-application step.*
- **Truth-preserving:** nothing invented — everything maps to `Resumes/00-Master-Profile.md`.

## READY-TO-GO/ — canonical & updatable
```
Resumes/READY-TO-GO/
├── README.md       how to use + update
├── convert.sh      ./convert.sh → regenerates all .tex + .pdf + .docx (needs pandoc + tectonic)
├── _build/md2tex.py  markdown→LaTeX converter (holds the template/style)
├── ML/        AI-LLM ⭐ · Healthcare-Biosignals · ML-Engineer · Applied-Scientist
├── Solutions/ Integration-Solutions · Implementation-Integration · Technical-Account-Manager
└── SDE/       Backend-Python · Full-Stack · Data-Platform
```
- 10 resumes × (`.md` + `.tex` + `.pdf` + `.docx`) = 40 files.
- **Send** the `.pdf` (clean LaTeX, one page); `.docx` for ATS portals; `.tex` to hand-tweak.
- `02-Output/` keeps the original `.md` drafts (its stale exports were removed).

## Update workflow (future)
1. Edit the `.md` in `READY-TO-GO/{track}/`.
2. Run `./convert.sh` → regenerates `.tex` + `.pdf` + `.docx`.

## Before sending (reminders)
- Finish **LeetCode 150** (listed on SDE/ML resumes).
- Run **Prompt 1 (ATS keyword gap)** against each real posting and tweak.
