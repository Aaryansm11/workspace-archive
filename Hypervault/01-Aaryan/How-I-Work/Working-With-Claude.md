---
type: runbook
half_life: medium
status: current
created: 2026-06-04
updated: 2026-06-04
review_by: 2026-12-04
tags: [aaryan, how-i-work, claude, meta]
related: ["[[00-Conventions]]", "[[Home]]"]
---

# Working with Claude on this vault

This vault is plain markdown on disk — so Claude can read and write it directly. Two ways to drive it.

## Primary: direct file access (zero setup, already works)
When you run Claude Code in `…/AI-Project`, it has full read/write to these files. Just ask in plain
language and it edits the markdown; **Obsidian reloads the file automatically.**

Good asks:
- *"Add a client note for <X> from this call transcript."*
- *"Update the KRA note — v1.x rule changed to <…>, supersede the old line."*
- *"This debugging session — capture it as a runbook lead in 03-HyperVerge/Internal-Tools."*
- *"What's stale? Anything past its review_by."*

Always tell Claude to follow [[00-Conventions]] (frontmatter, dates, supersede-don't-delete).

## Optional: Local REST API + MCP (only for the Claude **desktop app** / remote)
Not needed for Claude Code. Set up only if you want the desktop app to reach the vault:
1. Obsidian → Settings → Community plugins → install **Local REST API**; copy its API key.
2. Run an Obsidian MCP server (e.g. an `obsidian-mcp` / `mcp-obsidian` package) pointed at that key + port.
3. Register it as an MCP server in the desktop app's config.

> [!info] Why direct access is the default
> The vault is local and you're already in Claude Code — the REST API only adds value when something *can't*
> reach the filesystem (desktop app sandbox, remote machine). Skip the moving parts until you need them.

**Last verified:** 2026-06-04
