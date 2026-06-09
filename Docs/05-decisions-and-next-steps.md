# 5 — Decisions Log + Next Steps

## Key decisions (with rationale)

### Knowledge base (Hypervault)
- **Design for re-verification, not belief** → half-life + dated frontmatter + supersede-don't-delete. *Why:* stale notes mislead; the KB's job is the fastest path back to the current answer.
- **Vault = `Hypervault/` subfolder; move sources into `80-Sources/`.** *Why:* native `[[wikilinks]]`/backlinks/graph to the source library.
- **Core plugins only; dashboards via Bases.** *Why:* zero community-plugin installs; use what's already enabled.
- **Curated layer linking to sources, not bulk-copy.** *Why:* small, durable, re-verifiable.
- **Connector = direct file access (Claude Code), not MCP.** *Why:* simplest; MCP only needed for the desktop app.

### Raycast extension
- **Raycast over Hammerspoon.** *Why:* already installed; gives a form UI for free.
- **Claude CLI as the brain; headless OAuth token auth.** *Why:* reuses Aaryan's plan (no API cost); token bypasses the Keychain that Raycast-spawned processes can't read.
- **Capture-only on drop (auto-file deferred).** *Why:* instant + cheap; curate on demand.

### Resumes
- **Use the actual resume-tailoring skill** (not Claude's own workflow). *Why:* Aaryan explicitly required following the skill steps.
- **Role-archetype base resumes** (not 10 specific JDs). *Why:* casting a wide net now; ATS-tune per posting later with Prompt 1.
- **Did Phase 3A market research properly** after initially skipping it. *Why:* Aaryan caught the omission; the skill requires it.
- **Swaps:** dropped Java-Backend (only 1 project) and classic Data-Scientist (no stats/experimentation) → **AI/LLM Engineer** + **Healthcare/Biosignals ML**. *Why:* evidence-backed > padded.
- **Truth-preserving, repeatedly:** refused to fabricate CI (built it real instead); LeetCode listed only if finished; Kubernetes omitted (unverified); Node/TS removed from Full-Stack; corrected an over-stated security alarm. *Why:* a resume claim must survive an interview.

### GitHub
- **All commits authored as Aaryansm11, no AI attribution.** *Why:* Aaryan's credibility — recruiters shouldn't see "Claude" on his repos. (He should be able to explain everything committed.)
- **Mirror our-life-hq without secrets; build SDIS CI to green before claiming it.** *Why:* don't propagate secrets; a red badge is worse than none.

## Next steps / action items

### 🔴 Do before applying
- [ ] **Rotate the leaked Claude OAuth token** → [claude.ai/settings/claude-code](https://claude.ai/settings/claude-code) (revoke all, mint fresh).
- [ ] **Finish 150 LeetCode** — it's on the SDE/ML resumes; don't send under-count.
- [ ] **Review the 10 resumes** in `Resumes/READY-TO-GO/` (4-prompt QA done; clean **LaTeX `.pdf`** to send, `.docx` for ATS portals). Edit `.md` + run `convert.sh` to update.
- [ ] **Fill LinkedIn** by pasting from `Resumes/LinkedIn/LinkedIn-Profile-Content.md` (I can't post directly — no LinkedIn write API). ~15 min, section by section. Add a headshot + banner.

### 🟡 GitHub polish (mostly manual)
- [ ] **Pin 6 repos:** `ecg-ppg-arrhythmia-prediction`, `LANGTRON`, `SDIS`, `Langtron-KGS`, `our-life-hq`, `Live_emostream`.
- [ ] **Rotate AirlineDB MySQL password** if reused anywhere.
- [ ] (Optional) rotate Supabase anon key for our-life-hq.

### 🟢 Tooling
- [ ] **Load the Raycast extension:** `cd raycast-hypervault && npm install && npm run dev`; set ⌘⇧U; paste the fresh token in preferences.
- [ ] (Optional) wire **auto-file-on-drop** toggle.

### 🔵 Growth / skill gaps surfaced by the research
- [ ] Learn **TypeScript** (Full-Stack JDs expect it) and **MLOps** (MLflow/Docker/K8s for ML Eng).
- [ ] (Optional) deeper **LinkedIn per-role benchmarking** for tighter resume terminology.
- [x] **DOCX + print-ready HTML exported** for all 10 (in `Resumes/02-Output/`). Submit the **.docx** (ATS-friendly) or open the **.html** → ⌘P → *Save as PDF* for a clean PDF. Re-run `pandoc` if you edit the markdown.
- [ ] At each real application: run **Prompt 1 (ATS keyword gap)** against that specific JD (P1 needs a real posting, so it's an at-apply step, not a bulk one).

### Maintenance
- [ ] Keep Hypervault current via the conventions; act on the **Review Queue**.
- [ ] Capture new work via Raycast; run **Process Inbox** to file it.
