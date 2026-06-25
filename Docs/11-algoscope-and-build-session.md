# 11 — AlgoScope Build + Portfolio/Infra Session

**Session:** 2026-06-08 → 2026-06-25 · captures the full conversation, agenda, goals, process, and
every change. Companion to [10-portfolio-profile-and-infra.md](10-portfolio-profile-and-infra.md)
(high-level) and [04-github-and-ci.md](04-github-and-ci.md).

## Goal & agenda

Build a tool Aaryan wanted for **learning DSA** — *see* how data moves through the data structures a
solution uses — then ship it, feature it on the portfolio, and clean up all the GitHub/CI plumbing.

Agenda, in the order it happened:
1. **AlgoScope** — design + build the DSA visualizer (the bulk of the work).
2. **Portfolio** — feature AlgoScope as a highlighted "NEW" card; change the role title.
3. **GitHub + CI/CD** — push both projects, wire Vercel auto-deploy, remove AI attribution.
4. **GitHub profile** — make `github.com/Aaryansm11` look alive.
5. **Private archive** — back the workspace up to a private repo; document it (this file).

**Process / principles:** auto-detect with manual override (never force the user to annotate code);
execute-and-trace over static parsing; no backend (so it scales + deploys free); **no AI attribution
on any commit** (standing constraint); verify everything live (CDP screenshots, real builds).

---

## Part A — AlgoScope (the main build)

### What it is
Paste a Python **LeetCode-format** solution + input, press **Run**, and step (**Before / Next**)
through an animated simulation on a black canvas: **one differently-shaped card per data-structure
instance**, with **curved arrows** showing exactly where each element moves next.

- **Live:** https://algoscope-beta.vercel.app
- **Repo:** https://github.com/Aaryansm11/algoscope
- **Local:** `~/Documents/AI-Project/algoscope` (full build log in the repo's `PROJECT_NOTES.md`)

### Locked decisions (from Aaryan)
- **Engine: Pyodide** (Python in the browser) — runs real pasted LeetCode Python 100% client-side,
  traced line-by-line with `sys.settrace`. **No backend** → static deploy, unlimited concurrency.
- **DS detection: auto-detect from type/usage, with a per-card override dropdown.**
- **Coverage:** array+pointers, stack, queue/deque, hashmap, set, linked list, tree, heap, graph,
  DP grid — delivered in phases.

### Architecture
1. **Tracer** (`src/lib/tracer.py`, runs inside Pyodide) — finds the `Solution` method (or top-level
   fn), evals the input cell for args, installs `sys.settrace`, and per line/call/return serializes
   all locals **+ the call stack** (for recursion). Serializer handles list/tuple/dict/set/deque +
   custom node objects (stable ids + cycle-breaking refs); depth/size/step caps with a `truncated`
   flag. A fast no-trace `run_result` powers the test panel.
2. **Trace model** (`src/lib/trace.ts`) — `Step { line, func, depth, vars, stack, ret }` with a
   tagged `SerializedValue` union.
3. **Classifier + diff/arrow pass** (`classify.ts`, `arrows.ts`) — type+usage → card kind; inserts
   draw `source-cell → new-element` arrows, removals draw `structure → local` (pop) arrows.
4. **Renderer** (`src/components/`) — one card per kind (`Cards.tsx`, `TreeView.tsx`,
   `CallStack.tsx`), Framer-Motion layout animations, and an SVG **ArrowLayer** that re-measures
   every frame (`perfect-arrows`) so curves stay glued to moving cells.
5. **App** (`App.tsx`) — CodeMirror editor + input, Run/◀▶/scrubber/autoplay, executing-line sync,
   narration, pattern chips, complexity meter, predict mode, save library, test panel.

### Stack
Vite + React + TypeScript · Tailwind v4 + shadcn/ui (black theme) · Framer Motion · perfect-arrows ·
CodeMirror 6 · **Pyodide loaded from the jsdelivr CDN (v0.28.3)** (the npm pkg is oddly versioned, so
it's not bundled). Deploy: Vercel static, framework **vite**.

### Features shipped (all of them)
- **Structures:** array (+ sliding pointer badges), stack, queue/deque, hash map, set, linked list,
  binary tree, **heap** (binary-heap tree from the array), **2-D grid / DP table** (write-highlighted
  cells), dict-graphs.
- **Flow arrows:** insert (`cell → element`) and **pop/remove** (`structure → local`), curved + animated.
- **Recursion:** a **call-stack tower** that grows/shrinks; depth + per-frame line.
- **Learning aids:** step **narration**, **pattern detector** (two-pointers/BFS/DFS/heap/DP/stack/
  hashmap), **complexity meter** (ops + depth + peak sizes), **predict-the-next-step** mode (blurs the
  change, reveal with Space), **test-case panel** (multi-input, expected vs actual, pass/fail, "view"
  to visualize), **save library** (localStorage), per-card **type override**, 9 seeded examples.
- Run / ◀ ▶ / scrubber / autoplay / ←→ keys, executing-line highlight, runtime-error + truncation UX.

### Build process (phases, as executed)
P0 scaffold → P1 Pyodide+tracer pipeline (verified Two Sum end-to-end) → P2 core cards → P3 curved
flow arrows → P4 node-link structures + recursion call-stack → P5 polish + the bonus modules
(narration, patterns, complexity, predict, save) → finally the two stretch items: **test-case panel**
and **pop/remove arrows**. Each structure verified live via headless-Chrome screenshots (tree+
recursion, DP grid, heap-as-tree, linked-list chain, stack/hashmap).

### Design rationale / Q&A (things Aaryan asked)
- **"Where are programs stored — will it get slow without a DB?"** No DB by design. Saved solutions
  live in the browser's **localStorage** (KB each, instant, ~5–10 MB cap → hundreds of saves).
  Everything computes in-browser, so there's no server to bottleneck.
- **"How many people can use it at once?"** Effectively **unlimited** — it's a static client-side app;
  each visitor runs Pyodide in their own browser (isolated). The only ceiling is CDN bandwidth, not
  compute. Pyodide's 6 MB loads from jsdelivr (not Vercel), so Vercel only serves the ~250 KB bundle.

---

## Part B — Portfolio integration

- **AlgoScope featured card** — added to `src/lib/data/projects.ts` as the first project with a new
  `demo` + `isNew` schema. Renders a **"NEW"** badge + violet glow, a big highlighted **"Open"** button
  → the live site, a **"Code"** button → the repo, and its own **architecture diagram** in the
  "How it works" modal (Editor → Pyodide → Tracer → Classify → Render → Flow).
- **Role title change** — everywhere "Solutions Architect" → **"Solutions/Integration Engineer"**;
  the **OG share image** → **"Solutions Engineer"** (`opengraph-image.tsx`, `layout.tsx`, `profile.ts`).
- **Film-grade intro experiment + rollback** — a parallel chat rewrote the cinematic intro (voxel
  materialization, in-scene camera rig, a WebGL `CinematicBackdrop`, hero swap). Aaryan didn't like it:
  it was committed ("film grade intro") then **reverted** ("Revert 'film grade intro'") and pushed.
  Verified clean: no remnants (`CinematicBackdrop`/voxel/film-grain all gone), reverted code builds,
  live site back to the original "hey → peek → tap → siuu" intro. It never affected the live site
  beyond a brief auto-deploy that was immediately reverted.

---

## Part C — GitHub + CI/CD

- **Repos created & pushed:** `Aaryansm11/algoscope`, `Aaryansm11/portfolio-site` (both public;
  branch `main`; the existing `Portfolio` name was taken, hence `portfolio-site`).
- **No AI attribution:** the first commits carried a `Co-Authored-By: Claude` trailer — Aaryan didn't
  want Claude as a contributor, so history was rewritten (`git filter-branch` msg-filter) and
  **force-pushed**. Verified: contributors API + anonymous co-author list both show **`Aaryansm11`
  only**. (GitHub's *Contributors widget* is cached and lags, but the data is clean.) All later
  commits omit the trailer.
- **Vercel ↔ GitHub auto-deploy (the "infra" win):** initially deployed via CLI + tokens; then
  connected each Vercel project to its GitHub repo via the **Vercel GitHub app** (`vercel git
  connect`). Now **every push to `main` auto-builds + deploys** — **no tokens needed** (Aaryan revoked
  them). Confirmed working: a push to `algoscope/main` produced a `src=git` production deploy.
  - **The shared URLs never change on redeploy** — `portfolio-zeta-ten-85.vercel.app` and
    `algoscope-beta.vercel.app` are **stable production aliases**; each deploy just re-points the alias.
  - Per-project: framework auto-detected (vite / nextjs), **deployment protection off** (public).

---

## Part D — GitHub profile README

The profile repo `Aaryansm11/Aaryansm11` (its README renders at `github.com/Aaryansm11`) looked flat.
Revamped it with: an **animated typing header** (rotating roles), **shields.io badges** (Portfolio ·
LinkedIn · Email · AlgoScope · profile-views), a **tech badge** grid, a **featured-projects** list
with live buttons, and **live GitHub stat cards** (`github-readme-stats` stats + top-langs +
streak, `tokyonight` theme).
- **These stat/streak/language cards auto-update** as Aaryan commits (they're images generated live
  from current GitHub data); the written sections are static until edited.
- Removed the `📫 email · open to roles` footer line on request.
- **Optional (Aaryan, UI-only):** pin the best 6 repos via "Customize your pins".

---

## Part E — Private archive (this workspace)

`~/Documents/aaryan-workspace-private` → private repo **`Aaryansm11/workspace-archive`** (`main`).
Contains Docs, Resumes, DDIA-Core, the raycast-hypervault source, and **only** `Hypervault/01-Aaryan`
(the rest of the HyperVerge KB is deliberately excluded). The initial bulk push was correctly flagged
by a safety guardrail (PII + proprietary KB) and **Aaryan ran it himself**; later incremental pushes
(job targets, master plan, application drafts, **and these docs**) synced normally. A `.gitignore`
keeps `.DS_Store` / `node_modules` / LaTeX intermediates out.

---

## Current state / URLs
| Thing | Where |
|---|---|
| AlgoScope (live) | https://algoscope-beta.vercel.app |
| AlgoScope (code) | https://github.com/Aaryansm11/algoscope |
| Portfolio (live) | https://portfolio-zeta-ten-85.vercel.app |
| Portfolio (code) | https://github.com/Aaryansm11/portfolio-site |
| GitHub profile | https://github.com/Aaryansm11 |
| Private archive | https://github.com/Aaryansm11/workspace-archive (private) |

Both web projects **auto-deploy on push** (no tokens). Tokens used during the session were **revoked**.

## Open items
- Pin the best 6 repos on the GitHub profile (UI-only).
- AlgoScope stretch ideas (not built): union-find/trie/segment-tree cards, DP-dependency arrows,
  shareable replay links (would need a backend/Supabase — currently unnecessary).
- Set the LinkedIn custom URL (shared across all assets — see doc #10).
