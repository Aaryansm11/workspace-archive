# 2 — Raycast Extension ("Hypervault")

**Location:** `/Users/aaryanmaralihalli/Documents/AI-Project/raycast-hypervault/` · builds clean (`ray build`).

## What it is
A hotkey-summoned tool to (a) **capture** anything into the vault, (b) **ask** the vault with staleness-aware answers, (c) **curate** the inbox. Chosen over Hammerspoon because **Raycast was already installed**.

## Commands
- **Capture to Vault** (`view`) — form with a paste box + drag-drop **file field**; writes a dated note to `00-Inbox/` (+ files to `00-Inbox/attachments/`). Instant, no AI.
- **Ask the Vault** (`view`) — runs the `claude` CLI headlessly inside the vault; answer ends with a confidence verdict (✅ confident / ⚠️ may be stale / 🚫 superseded / ❓ not in vault), governed by `Hypervault/CLAUDE.md`. Read-only tools.
- **Process Inbox** (`no-view`, detached) — curates raw captures into proper notes per the conventions (allowed to edit).

## The brain
The **Claude Code CLI** (`/opt/homebrew/bin/claude`), called headlessly (`claude -p`), reusing Aaryan's Claude account. `Hypervault/CLAUDE.md` makes every answer self-rate confidence/staleness from note frontmatter (`review_by`/`status`/`half_life`).

## Bugs we hit & fixed (the debugging journey)
1. **stdin hang** — Raycast left an empty stdin open; CLI waited. → spawn with `stdio: ['ignore', ...]`.
2. **"Not logged in"** — the spawned process lacked `USER`/`LOGNAME` for Keychain lookup; then we learned Raycast-spawned processes can't reliably read the macOS **Keychain** at all. → switched to a headless **`CLAUDE_CODE_OAUTH_TOKEN`** (from `claude setup-token`), stored in a Raycast password preference.
3. **`exit code null`** — React dev double-mount killed the first `claude` process; its result leaked. → guard ignores torn-down runs.
4. Error display improved to surface `stdout` (where the CLI prints errors).

## Setup (what Aaryan still needs to do)
1. ⚠️ **Rotate the OAuth token** that leaked into chat: [claude.ai/settings/claude-code](https://claude.ai/settings/claude-code) → revoke all → `claude setup-token` for a fresh one.
2. Put the fresh token in **Raycast → Settings → Extensions → Hypervault → Claude OAuth Token**.
3. Load the extension: `cd raycast-hypervault && npm install && npm run dev` (Raycast running).
4. Set hotkey **⌘⇧U** on *Capture to Vault*.

## Architecture notes
- Files: `src/capture.tsx`, `src/ask.tsx`, `src/process-inbox.tsx`, `src/claude.ts` (resolver + env + spawn + detached runner).
- DOCX/PDF generation for resumes isn't here (no `document-skills` plugin) — use pandoc if needed.

## Deferred / optional
- **Auto-file-on-drop** toggle (drop → instant capture *and* background curation). Discussed; not built — current default is capture-only + on-demand *Process Inbox*.
