# Project Documentation — Aaryan's Workspace
**Period:** 2026-06-06 → 2026-06-07 · **Owner:** Aaryan S. Maralihalli

This documents everything built across this engagement: what was done, **why** (decisions), and **what's left** (next steps). Four workstreams, all in `/Users/aaryanmaralihalli/Documents/AI-Project/`.

## The four workstreams
| # | Workstream | What | Doc |
|---|---|---|---|
| 1 | **Hypervault** | Obsidian knowledge base for the SA role / HyperVerge / Aaryan, built to age well | [01-hypervault-kb.md](01-hypervault-kb.md) |
| 2 | **Raycast extension** | Hotkey "capture to vault" + "ask the vault" (staleness-aware) + "process inbox" | [02-raycast-capture-ask.md](02-raycast-capture-ask.md) |
| 3 | **Resume system** | 10 role-tailored resumes via the resume-tailoring skill (truth-preserving) | [03-resume-system.md](03-resume-system.md) |
| 4 | **GitHub + CI** | Profile/README polish, mirror, archive, security fixes, **green SDIS CI** | [04-github-and-ci.md](04-github-and-ci.md) |

➡️ **Resume finalization (QA + exports + READY-TO-GO):** [06-resume-finalization.md](06-resume-finalization.md)
➡️ **Decisions log + all next steps:** [05-decisions-and-next-steps.md](05-decisions-and-next-steps.md)

## Timeline (how we got here)
1. **Concept:** discussed how a knowledge base *ages into a trap* unless notes are written to be re-verified, not believed → the half-life convention system.
2. **Hypervault built:** Obsidian vault (`Hypervault/`), 3 pillars + operational folders, sources moved in, ~52 curated notes, Bases dashboards.
3. **Raycast extension built + debugged:** capture/ask/process-inbox; worked through a chain of real bugs (stdin, env vars, Keychain→token, React double-mount) to a working tool.
4. **Resume system:** installed the actual resume-tailoring skill, ran its phases (library → gap analysis → discovery → **Phase 3A market research** → generation), produced 10 resumes + a fit-ranking.
5. **GitHub + CI:** READMEs, profile, mirror of `our-life-hq`, archived duplicate repos, fixed a hardcoded password, and got **SDIS CI green (22/22)** — fixing 5 real bugs along the way.
6. **Resume finalization:** 4-prompt QA polish on all 10 → **DOCX + print-ready HTML** packaged in `Resumes/READY-TO-GO/` (canonical, with `convert.sh`).

## Status at a glance
- ✅ Hypervault KB — built & in use
- ✅ Raycast extension — built & compiling; **needs:** rotate leaked token + `npm run dev` + hotkey (see doc 2)
- ✅ 10 resumes — QA-polished & exported (DOCX + print-ready HTML) in `Resumes/READY-TO-GO/`; **needs:** finish LeetCode 150 before sending
- ✅ GitHub cleanup + SDIS CI green on `main`; **needs:** pin 6 repos (manual)

## ⚠️ Top action items (full list in doc 05)
1. **Rotate the Claude OAuth token** that leaked into chat → [claude.ai/settings/claude-code](https://claude.ai/settings/claude-code).
2. **Finish 150 LeetCode** before sending any SDE/ML resume (it's listed on them).
3. **Pin 6 repos** on GitHub; rotate AirlineDB MySQL password if reused.
4. **Load the Raycast extension** (`npm run dev`) + set ⌘⇧U.
