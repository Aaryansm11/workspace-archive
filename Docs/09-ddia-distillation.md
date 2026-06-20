# 9 — DDIA Book Distillation (learning workstream)

## Goal
Aaryan added *Designing Data-Intensive Applications* (Kleppmann, 491 pages) and wanted to **consume the core**, roughly "the 100 pages that matter," without the filler.

## Process — a read → condense → review agent pipeline
1. **Extract:** poppler `pdftotext` → `DDIA-Core/DDIA.txt` (~186k words). Too large for one agent's context, so the read stage was split.
2. **Read (3 parallel agents)** — one per range (Part I ch1–4, ch5–8, ch9–12). Each wrote a dense extraction to `DDIA-Core/extraction/part-1..3.md`.
3. **Condense (agent)** → `DDIA-Core/DDIA-Core-Guide.md` (first draft ~8.5k words).
4. **Review (agent)** → `DDIA-Core/_review.md`: accurate but **too compressed**; gave a per-chapter change list (add mechanisms, worked examples, the "why").
5. **Revise** → expanded the guide to **~17,100 words**.

## Output: `DDIA-Core/DDIA-Core-Guide.md`
Intro + depth-contract + TOC, all chapters (TL;DR → mechanism → worked example → tradeoffs → pitfalls), comparison tables (B-tree vs LSM, isolation levels, replication modes, broker types, etc.), a **Decision Cheat-Sheet**, and a **Flashcard Review**.

## Honest notes
- **Chapter 12 is not in the PDF** (pre-publication copy with placeholders), so it's a short, clearly-labeled general-knowledge summary; Ch1–11 are from the actual text.
- **On "100 pages":** ~17k words ≈ 35–45 printed pages is the genuine high-signal core. DDIA has little filler, so padding to a literal 100 pages would re-reproduce the book. Density was kept where it is by design.

## Artifacts
`DDIA-Core/DDIA.txt` (extracted text), `DDIA-Core/extraction/part-1..3.md` (raw notes), `DDIA-Core/_review.md` (the review), `DDIA-Core/DDIA-Core-Guide.md` (the deliverable). Tooling installed: **poppler** (pdftotext).
