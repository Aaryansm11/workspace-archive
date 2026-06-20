# Project Documentation — Aaryan's Workspace
**Period:** 2026-06-06 → 2026-06-20 · **Owner:** Aaryan S. Maralihalli
**Canonical workspace:** `~/Documents/aaryan-workspace-private` (mirrored to private GitHub repo `Aaryansm11/workspace-archive`). The older `~/Documents/AI-Project` is a stale duplicate.

This documents everything built and done across the engagement: the goal, the agenda, the process, and every workstream — what was done, **why**, and **what's left**.

## Goal
After learning he would **not be converted to full-time at HyperVerge**, the mission became: **land a strong early-career role** (Solutions/Integration · Backend/SDE · AI/ML) in Bangalore / remote India for a Jul-2026 new grad — and build every supporting asset around that (resumes, portfolio, LinkedIn, knowledge base) plus upskilling (DDIA, LeetCode).

## Agenda (phases, in order)
1. Knowledge base (Hypervault) → 2. Raycast capture/ask tool → 3. Resume system (10 tailored) → 4. GitHub + CI cleanup → 5. Resume finalization (QA + LaTeX) → 6. **Job-search campaign** (per-company applications) → 7. **Market research + referrals** (5-agent analysis) → 8. **DDIA distillation** (learning) → 9. **Portfolio + Master-Profile sync + LinkedIn fix**.

## How we worked (process / principles)
- **Truth-preserving always.** Tailor from one source of truth (`Resumes/00-Master-Profile.md`); never fabricate. When a claim was needed but untrue, we *made it real* (e.g., built SDIS CI) or flagged the stretch.
- **Followed the actual resume-tailoring skill** (not an ad-hoc method): library → gap analysis → discovery → Phase-3A research → generation, plus a **4-prompt QA** (ATS, bullets, 7-sec scan, summary).
- **Subagents for scale** — used multi-agent pipelines for market research (5 agents) and the DDIA distillation (read → condense → review).
- **Referrals over cold applications** for a stretch new-grad profile.
- **No AI attribution on any commit or project** (Aaryan's explicit constraint).

## Workstreams & docs
| # | Workstream | Doc |
|---|---|---|
| 1 | Hypervault (Obsidian KB) | [01-hypervault-kb.md](01-hypervault-kb.md) |
| 2 | Raycast capture/ask extension | [02-raycast-capture-ask.md](02-raycast-capture-ask.md) |
| 3 | Resume system (10 tailored, skill-based) | [03-resume-system.md](03-resume-system.md) |
| 4 | GitHub + CI (cleanup, green SDIS CI) | [04-github-and-ci.md](04-github-and-ci.md) |
| 5 | Decisions log + next steps | [05-decisions-and-next-steps.md](05-decisions-and-next-steps.md) |
| 6 | Resume finalization (QA + LaTeX exports) | [06-resume-finalization.md](06-resume-finalization.md) |
| 7 | **Job-search campaign & applications** | [07-job-search-campaign.md](07-job-search-campaign.md) |
| 8 | **Market research, salary/stability & referrals** | [08-market-research-and-referrals.md](08-market-research-and-referrals.md) |
| 9 | **DDIA book distillation** | [09-ddia-distillation.md](09-ddia-distillation.md) |
| 10 | **Portfolio, profile sync & infra** | [10-portfolio-profile-and-infra.md](10-portfolio-profile-and-infra.md) |

## Timeline
1. **Concept:** a KB ages into a trap unless notes are written to be re-verified → the half-life convention system.
2. **Hypervault built:** Obsidian vault, 3 pillars + operational folders, ~52 curated notes, Bases dashboards.
3. **Raycast extension** built + debugged (stdin, env, Keychain→token, React double-mount).
4. **Resume system:** the actual tailoring skill → 10 resumes + fit-ranking + Phase-3A research.
5. **GitHub + CI:** READMEs, profile, mirror, archived dups, **SDIS CI green (22/22)**, 5 real bugs fixed.
6. **Resume finalization:** 4-prompt QA → clean **LaTeX** PDFs matching Aaryan's own template, in `READY-TO-GO/`.
7. **Job-search campaign:** per-company tailored resumes + `Applications/` tracker (Glean, Razorpay, Postman, Plotline, Myelin, Navi, Yellow.ai); master resume for the portfolio.
8. **Market research + referrals:** 5-agent analysis (`_Market-Analysis.md`), salary/stability, referral playbook (Madhumita, Manav, Pranav), LinkedIn paste-ready content.
9. **DDIA distillation:** 491 pages → a ~17k-word core guide via a read/condense/review agent pipeline.
10. **Portfolio + profile:** AlgoScope + portfolio-site (TS, live) → Master Profile synced; LinkedIn vanity-URL fixed across all resumes + portfolio.

## Status at a glance
- ✅ Hypervault KB, Raycast extension (needs token + load), 10 resumes + master (LaTeX, ATS-safe)
- ✅ GitHub clean + SDIS CI green; portfolio + AlgoScope live; Master Profile synced
- ✅ Applications prepped for 7 companies with tailored resumes + a tracker
- 🔁 Active: referrals (Madhumita/Manav/Pranav), applying, LeetCode

## ⚠️ Top action items (Aaryan)
1. **Set the LinkedIn custom URL** `linkedin.com/in/aaryan-maralihalli` (else the link is dead everywhere).
2. **Finish 150 LeetCode** before sending SDE/ML resumes (still `[CONFIRM]` in the master).
3. **Rotate the Claude OAuth token** that leaked into chat earlier.
4. **Confirm role titles** at Razorpay/Postman (live reqs were Solutions/Support, not AI/ML).
5. **Reconsider Yellow.ai** (stability 1/5). Pin repos; paste LinkedIn content; load the Raycast extension.
