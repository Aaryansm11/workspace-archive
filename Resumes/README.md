# Resume System — Aaryan

A truth-preserving resume pipeline (same philosophy as the resume-tailoring skill we discussed).

## How it works
1. **[00-Master-Profile.md](00-Master-Profile.md)** — the single source of truth. Everything true about Aaryan.
   Tailoring only ever *selects, reframes, and emphasizes* from here — it never invents.
2. **01-Roles/** — one file per target role: the role's emphasis, target keywords, and which Master-Profile
   items to feature.
3. **02-Output/** — generated resumes, grouped `Solutions/ · SDE/ · ML/` (Markdown → later DOCX/PDF).
4. **03-Research/** — per-role notes (what the role screens for, keyword gaps).

## Conventions
- Every resume fits **one page** unless a role expects more.
- Bullets follow **action verb + what + measurable result**; numbers come from the Master Profile, never invented.
- Each output names the **anchor experience/projects** it leads with, and any **gap** vs the role.

## Status
- Master Profile built (with `[CONFIRM:]` gaps). Roles defined: see chat. Resumes: pending discovery answers.
