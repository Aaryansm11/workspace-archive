# Hypervault — Raycast extension

A capture box + staleness-aware Q&A for the [Hypervault](../Hypervault) Obsidian vault.

## Commands
- **Capture to Vault** — a form with a text area + drag-drop file field. Writes a dated note to
  `00-Inbox/` and copies files to `00-Inbox/attachments/`. Instant, no AI.
- **Ask the Vault** — type a question; runs the `claude` CLI headlessly inside the vault and renders the
  answer. The answer ends with a confidence verdict (✅ confident / ⚠️ may be stale / ❓ not in vault),
  governed by `Hypervault/CLAUDE.md`.
- **Process Inbox** — asks Claude to curate raw `00-Inbox/` captures into proper notes per the vault
  conventions (this one is allowed to edit/write).

## One-time setup
1. **Log in to the Claude CLI** (reuses your Claude account):
   ```sh
   claude            # follow the login prompt once, then quit
   ```
2. **Load the extension into Raycast:**
   ```sh
   cd raycast-hypervault
   npm install
   npm run dev       # Raycast must be running; the commands appear under "Hypervault"
   ```
3. In Raycast → Extensions → Hypervault → set a **hotkey** (e.g. ⌘⇧U) on *Capture to Vault*.
4. Check command **preferences** if your paths differ (vault path, claude path).

## Notes
- `npm run dev` keeps the extension live while running. To keep it permanently without dev mode, run
  `npm run build` then import the `dist` build, or keep `ray develop` running at login.
- Read-only by design: **Ask** is restricted to read tools; only **Process Inbox** can edit the vault.
