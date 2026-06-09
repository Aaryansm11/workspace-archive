# 1 — Hypervault (Obsidian Knowledge Base)

**Location:** `/Users/aaryanmaralihalli/Documents/AI-Project/Hypervault/` (open this folder as the Obsidian vault).

## Why it exists
A personal KB for Aaryan's Solutions Architect work. The driving concern: **a knowledge base becomes a trap when notes are written to be *believed* instead of *re-verified*.** So the whole design optimizes for "fastest path back to the current answer," not "store the answer."

## The conventions (the anti-staleness system) — `Hypervault/95-Maps/00-Conventions.md`
- **Half-life on every note:** `long` (why/architecture), `medium` (process/owners), `short` (versions/configs/URLs).
- **Frontmatter:** `type, half_life, status, created, updated, review_by, source_url, source_file, tags, related`.
- **Rules:** date everything · write the *why* + *how-I-checked*, not just the *what* · runbooks are **leads, not verdicts** (end with `Last verified:`) · **link to live sources** (don't copy) · **supersede, never delete** (banner + `status: superseded` + move to `99-Archive/`).
- **Review Queue** (a Bases dashboard) surfaces anything past `review_by` → staleness becomes visible.

## Structure (3 pillars + operational)
```
00-Inbox/         capture + Daily/
01-Aaryan/        How-I-Work, Active-Threads, Learnings, Growth
02-SA-Role/       Lifecycle, Artifacts, Process-Tools, Client-Skills, Collaboration
03-HyperVerge/    Products-Modules, Workflow-Builder, APIs-SDKs, Domain-Compliance, Internal-Tools
04-Clients/       per-client (most volatile)
80-Sources/       the original ~1,530 scraped docs/Notion/courses (excluded from graph/search)
90-Templates/     note skeletons (core Templates plugin)
95-Maps/          Home, Glossary, 00-Conventions, Review-Queue.base, Clients.base
99-Archive/       superseded notes
```
~52 curated notes seeded; each `[[wikilinks]]` to the moved-in `80-Sources/`.

## Key decisions
- **Vault = `Hypervault/` subfolder; sources moved into `80-Sources/`** (not kept outside) → native wikilinks + backlinks + graph to sources.
- **Core plugins only** (Templates, Daily Notes, Properties, **Bases**, Graph, Backlinks) — **no community-plugin installs**; dashboards use core **Bases**.
- **Curated layer that links to sources** (not bulk-copying 1,530 files) — keeps it small, durable, re-verifiable.

## Connector (how Claude reads/writes it)
- **Primary:** direct file access via Claude Code (zero setup) — say "update the KRA note," Claude edits markdown, Obsidian reloads.
- **Optional:** Obsidian Local REST API + an MCP server (only needed for the Claude desktop app / remote). Documented in `01-Aaryan/How-I-Work/Working-With-Claude.md`.

## How to use
Open `Hypervault/95-Maps/Home.md` (bookmark it). Capture fast into `00-Inbox`; promote durable bits into pillars with frontmatter; let the Review Queue tell you what to re-verify.
