# 10 — Portfolio, Profile Sync & Infra

## Portfolio + AlgoScope (new, real, verified)
Two new TypeScript projects shipped (built in a separate chat, verified on GitHub + live):
- **`portfolio-site`** — Next.js + shadcn + TypeScript, cinematic 3D intro. Live: portfolio-zeta-ten-85.vercel.app.
- **`algoscope`** — in-browser DSA visualizer (paste a Python LeetCode solution, watch it run via **Pyodide**: animated data-structure cards, call-stack). Live: algoscope-beta.vercel.app.

These made **TypeScript / Next.js genuine skills** (retiring the earlier "lacked TypeScript" caveat, when we'd removed TS from the Full-Stack resume).

## Master Profile sync (2026-06-12)
`Resumes/00-Master-Profile.md` was out of date (built 2026-06-06). Surveyed GitHub + the live portfolio and synced it: added AlgoScope + portfolio-site as projects, added TypeScript/Next.js/shadcn to skills, added the portfolio URL, recorded the verifications, marked the old "GitHub write access" item resolved, and left **`[CONFIRM: LeetCode 150+]`** open. The single-source-of-truth rule holds: resumes tailor *from* this file.

## LinkedIn vanity-URL fix
The resumes used `linkedin.com/in/aaryan-maralihalli` (a **dead** link), while the portfolio used the real `…-8b111224a`. First corrected all 30 resume `.md` files to the working `-8b111224a` URL; then Aaryan decided to **claim the clean custom URL** instead, so we **reverted resumes to the plain `aaryan-maralihalli`** and **changed the portfolio to the plain one too** (pushed). 
> ⚠️ **Pending (Aaryan):** actually set the custom URL in LinkedIn (*Settings → Edit public profile & URL*) — until then, the clean link is dead everywhere by design.

## Workspace & repo state
- **Two local copies:** `~/Documents/AI-Project` (older, **stale**) and `~/Documents/aaryan-workspace-private` (**canonical**). Master Profiles will drift; only the canonical one is maintained.
- **Private GitHub repo:** `Aaryansm11/workspace-archive` (the canonical workspace's `origin`, branch `main`). Added a `.gitignore` (`.DS_Store`, LaTeX `*.aux/*.log/*.out`, etc.).
- **All commits authored as Aaryan S. Maralihalli, no AI attribution** (standing constraint).
- **Tooling installed on the machine:** pandoc, tectonic (LaTeX), poppler (pdftotext).

## GitHub repos (current)
Public: `portfolio-site`, `algoscope`, `SDIS`, `ecg-ppg-arrhythmia-prediction`, `our-life-hq`, `LANGTRON`, `Langtron-KGS`, `Live_emostream`, `hospital_management_ooad`, `AirlineDBManagement`, `CloudComputingMonolithic`, `TDL-FinancialReportPipeline`, `CAPSTONE75`, profile `Aaryansm11`. Archived dup capstones (`demo_capstone`, `capstone_proto`, `CAPSTONE-100-ALTERNATE`). Private: `workspace-archive`.

## Session addendum (2026-06-25) — full detail in [11-algoscope-and-build-session.md](11-algoscope-and-build-session.md)
The AlgoScope/portfolio work was expanded and hardened. New since the notes above:
- **AlgoScope feature-complete + deployed** (Pyodide DSA visualizer: structure cards, curved insert/pop arrows, recursion call-stack, narration, pattern detector, complexity meter, predict-mode, test-case panel, save library). Full build doc → #11.
- **Portfolio:** AlgoScope is now a featured **"NEW"** card (big "Open" button + Code + architecture modal). **Role title** changed everywhere → **"Solutions/Integration Engineer"** (OG image → "Solutions Engineer").
- **Film-grade intro experiment was reverted** — Aaryan didn't like it; the live intro is the original "hey → peek → tap → siuu". Verified no remnants.
- **CI/CD:** both Vercel projects connected to GitHub via the Vercel app → **auto-deploy on every push to `main`, no tokens** (tokens revoked). Production URLs are **stable aliases** (unchanged by redeploys).
- **AI attribution removed** from `algoscope` + `portfolio-site` history (force-pushed); contributors show **Aaryansm11 only**.
- **GitHub profile README** revamped (typing header, badges, live auto-updating stat/streak/language cards).
