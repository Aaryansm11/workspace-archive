# Master Plan — AI/ML + System Design + Freelance (Jun 10 → Sep 30, 2026)

> Built 2026-06-10. Constraints: internship ends ~Jun 30 · 1-month runway after (job needed by ~Jul 31, hard wall Aug 31) · GTX 1070 8GB incoming · target: AI Solutions Architect-track role >10 LPA + freelance income on the side.

---

## 0. The strategic verdicts (answers to your exact questions)

**DSA: NOT equal priority. 45 min/day, maintenance mode.**
You have 150+ LeetCode already. The roles you're targeting (Solutions, AI Engineer at startups, Glean-tier backend) gate on DSA at *screen* level, not Codeforces level. 45 min/day on a curated 60-problem list (below) keeps you interview-ready. Going 4 hrs/day on DSA is how freshers burn their differentiation — your differentiation is shipped AI systems + KYC domain + IEEE paper.

**OS/DBMS/CN: interview-prep level only, NOT study-level. Total budget: 4 days, and only in July.**
- DBMS: 70% covered by DDIA anyway (transactions, indexing, isolation levels). Add a 1-day pass on normalization + SQL joins + ACID definitions.
- OS: 1.5 days — processes vs threads, scheduling, deadlock conditions, paging/virtual memory, semaphores. (Any "Top 50 OS interview questions" list + your own notes.)
- CN: 1.5 days — TCP vs UDP, 3-way handshake, HTTP/1.1 vs 2 vs 3, TLS handshake, DNS resolution, what happens when you type a URL. You already half-know this from API integration work.
- These only matter for trad SDE interviews at GCCs/larger firms. Startup AI interviews almost never go deep here.

**AIML: yes, go all-in. This is your stream.** The market signal is unambiguous — 60–70% of 2026 fresher JDs now list AI/ML proficiency, agentic AI/RAG is the hottest skill, and AI-native startups pay ₹15–25L for freshers *with a real shipped portfolio*. You already have 70% of that portfolio. The gap is (1) refreshed fundamentals so you can survive a deep-dive interview, and (2) one undeniable production-grade flagship.

**System design: DDIA is the right call** — but read it the smart way (chapter map below), and pair it with *ML* system design, because "AI Solutions Architect" interviews are 70% ML-system-design, 30% classic.

**Role thesis: confirmed.** "AI engineer / solutions engineer who can design the system around the model" is the single most defensible fresher position in 2026. Pure-SDE fresher pipeline is oversupplied; pure-ML-research needs a Masters. You sit in the gap.

**Freelance: yes, but two tracks, not one** (Section 5). Track A (AI-training contractor: Mercor/Outlier/Turing) is the *reliable money* — $15–60/hr for India-based contributors, low acquisition cost, starts paying in weeks. Track B (client work: Upwork/Contra) is the *compounding asset* but takes 1–3 months to get first contracts as a new profile. Start A immediately, build B in parallel.

---

## 1. Time budget

**Jun 10–30 (internship still on): ~4 hrs/day weekdays, 9 hrs/day weekends ≈ 100 hrs**

| Block | Weekday | Weekend |
|---|---|---|
| DSA (morning, before work) | 45 min | 1 hr |
| DDIA (commute/lunch/audio+notes) | 45 min | 1.5 hr |
| AIML rebuild (evening) | 2 hr | 4 hr |
| Job apps + referral follow-ups | 30 min | 1 hr |
| Freelance setup (weekends only) | — | 1.5 hr |

**Jul 1–31 (full-time): 9–10 hrs/day, 6 days/week ≈ 240 hrs**

| Block | Daily |
|---|---|
| Flagship project / fine-tune project | 4.5 hr |
| AIML theory (paired with the build) | 1.5 hr |
| DDIA + ML system design | 1.5 hr |
| DSA | 45 min |
| Applications + interviews + freelance proposals | 1.5 hr |

---

## 2. Phase 0 — Jun 10–30 ("rebuild while employed")

### Week 1 (Jun 10–16)
- **Day 1–2:** Execute the job moves from `_Job-Targets-2026-06-10.md`: HyperVerge FTE conversation, Madhumita→Razorpay referral, Postman TSE application, Manav→Glean. 30 min of resume keyword fixes (TypeScript/Next.js line, "Postman" mention, SDIS→"permissions-aware enterprise search").
- **DSA:** Arrays & Hashing + Two Pointers sets (list in §7).
- **DDIA:** Ch 1 (Reliable, Scalable, Maintainable) + Ch 2 (Data Models) — Ch 2 at skim speed, you know document-vs-relational from MERN.
- **AIML evenings — Karpathy "Neural Networks: Zero to Hero", in order:**
  1. *The spelled-out intro to neural networks and backpropagation: building micrograd* (2h25m) — code along, don't watch passively.
  2. *The spelled-out intro to language modeling: building makemore* (1h57m)
  3. *Building makemore Part 2: MLP* (1h15m)
  - This rebuilds backprop/loss/embedding intuition faster than any course re-take. Every line typed by hand.

### Week 2 (Jun 17–23)
- **DSA:** Sliding Window + Stack + Binary Search sets.
- **DDIA:** Ch 3 (Storage and Retrieval) — **do not skim this one**: LSM-trees vs B-trees, SSTables, indexes. This is the #1 most-asked DDIA material AND it's how vector DBs work under the hood (HNSW lives next to this mentally).
- **AIML:**
  4. *makemore Part 3: Activations & Gradients, BatchNorm* (1h55m)
  5. *makemore Part 4: Becoming a Backprop Ninja* (1h55m) — this one is optional-but-gold; if time-crunched, do the first hour.
  6. *Let's build GPT: from scratch, in code, spelled out* (1h56m) — **non-negotiable.** After this you can whiteboard attention, which is THE deep-dive interview question.
- **Weekend:** Set up the 1070 rig: Ubuntu 22.04 or WSL2, CUDA 12.x (Pascal still supported), PyTorch, `llama.cpp`, Ollama. Verify: run Qwen2.5-7B-Instruct Q4_K_M locally. Note 1070 limits: no bf16, no flash-attention (Pascal sm_61) — fine for inference + small LoRA; you'll rent for real runs.

### Week 3 (Jun 24–30, internship wrap-up)
- **DSA:** Linked List + Trees first half.
- **DDIA:** Ch 4 (Encoding/Evolution) at skim speed — you know JSON/proto basics; absorb the schema-evolution idea.
- **AIML:**
  7. *Let's build the GPT Tokenizer* (2h13m)
  8. Hugging Face **LLM Course** (hf.co/learn): Ch 1 (Transformer models), Ch 2 (Using Transformers), Ch 3 (Fine-tuning) — fast pass, you're mapping Karpathy intuition onto the production toolkit.
- **Freelance setup (weekend):** Apply to **Mercor** (mercor.com — AI interview, upload resume, takes <1hr; India contributors $15–120/hr) and **Outlier** (coding-evaluation queues, ~$30–60/hr for code domains). Also **Turing** LLM-trainer track and **DataAnnotation** as backup. These convert your existing Python/code-review skill into dollars with zero portfolio needed.
- **Exit internship cleanly:** Get the HV conversion answer in writing if possible; ask your manager + the client-side contacts for LinkedIn recommendations *now* (they evaporate after you leave); collect metrics evidence.

---

## 3. Phase 1–3 — July ("the build month")

### Project 1 (FLAGSHIP) — "Verity": production agentic-RAG service for compliance/KYC docs (Jul 1–14)
Extend SDIS into what an AI Solutions Architect would actually sell. Exact spec:
- **Core:** FastAPI + Postgres + pgvector (move off FAISS-in-process — interviewers respect "I migrated to pgvector and here's why"). Hybrid retrieval: BM25 (Postgres FTS) + dense + **reranker** (bge-reranker-base, runs on the 1070).
- **Agentic layer:** LangGraph (or hand-rolled state machine — better interview story) with 3 tools: document search, structured extraction (Pydantic schemas), and a compliance-checklist verifier. Streamed responses (SSE).
- **The differentiator — EVALS:** RAGAS or DeepEval suite: faithfulness, answer relevancy, context precision on a 50-question golden set you author from public RBI/KYC circulars (your domain!). CI runs evals on every PR. **Nobody at fresher level ships evals. This is the line on the resume that gets calls.**
- **Ops:** Langfuse tracing (self-hosted, Docker), token-cost dashboard, rate limiting, JWT (reuse SDIS), Dockerized, deployed on a ₹400/mo Hetzner/Railway box with the LLM on Groq/Gemini-Flash free tiers + local Ollama fallback.
- **Ship:** README with architecture diagram, 3-min demo video, blog post "Building an auditable RAG system for KYC compliance" (cross-post LinkedIn). Add to portfolio + resume.
- Day-split: D1–2 scaffold+ingestion, D3–4 hybrid retrieval+rerank, D5–6 agent loop+tools, D7–8 golden set+evals, D9–10 tracing+deploy, D11–12 polish+video+post, D13–14 buffer (it always slips).

### Project 2 — Fine-tune with receipts (Jul 15–24)
- **Task:** Fine-tune **Qwen2.5-3B-Instruct** (QLoRA, 4-bit) into a *KYC/fintech document-extraction specialist* — train on synthetic instruction pairs you generate (extract fields from noisy KYC-style docs → JSON). 3B QLoRA fits on the 1070 (batch 1, grad-accum, 1k context); when you need the 7B/8B run, rent a **RunPod RTX 4090 (~$0.35–0.45/hr, ~$8–12 total)** — congrats, you've hit your "rent compute" milestone with a real reason.
- **The receipts:** eval harness comparing base vs fine-tuned vs GPT-4o-mini on a held-out set (exact-match + JSON-validity + field-F1). Publish the model + dataset card on HuggingFace, weights & a writeup.
- **Theory pairing while these run:** Chip Huyen, **"AI Engineering"** (2025): Ch 1–2 (foundation models, evaluation methodology) during Project 1; Ch 5–6 (prompt engineering, RAG & agents) during Project 1; Ch 7 (fine-tuning) + Ch 9 (inference optimization) during Project 2. This book IS the AI-solutions-architect interview syllabus right now.

### System design thread (all July, 1.5 hr/day)
- **DDIA:** Ch 5 (Replication) → Ch 6 (Partitioning) → Ch 7 (Transactions) → Ch 8 (Trouble with Distributed Systems) → Ch 9 (Consistency & Consensus — read for ideas, don't memorize Raft internals) → Ch 11 (Stream Processing — fast, you've used Kafka). **Skip/skim Ch 10 (batch) and Ch 12.** Write a 10-line summary per chapter in your vault; that note-set is your revision deck.
- **ML system design:** after DDIA Ch 7, alternate days with Chip Huyen's *Machine Learning Systems Design* material + 6 practice questions: design a RAG platform for 10k enterprise docs; design fraud detection for UPI-scale traffic; design a KYC-document pipeline (you can teach this one); design semantic search for an e-commerce catalog; design an LLM eval/monitoring system; design a recommendation feed. Whiteboard each: requirements → data → model choice → serving → evals → failure modes.
- **Classic SD vocabulary:** one weekend pass of system-design-primer (GitHub) for load balancer/CDN/cache/queue vocabulary.

### DSA thread (all July, 45 min/day)
Finish the 60-problem list (§7), then 1 mock/week (Pramp or a friend) + re-solve your wrong-answer pile. If a Glean/Razorpay interview lands, switch to 2 hrs/day for the 5 days prior — targeted, not chronic.

### Applications thread (July)
- Week 1: All Tier-1/Tier-2 from `_Job-Targets-2026-06-10.md` that haven't responded; re-sweep their boards (postings refresh ~weekly).
- Week 2 onward, add: **IBM Associate Developer 2026 drive (Hyderabad, ~21 LPA, AI/GenAI roles — live now, apply immediately)**, Sarvam AI, Krutrim, Fractal, Tiger Analytics, Quantiphi (AI services, fresher-friendly, 8–14L — interview practice + floor), Wellfound "AI engineer" filter ≤50-person startups (these hire on portfolio, not pedigree), AiPrise founder pitch if not done.
- Target volume: **8–10 quality applications/week** with the right resume variant each time + a 3-line note referencing the company's actual product.
- LinkedIn: post the Project 1 writeup, the fine-tune writeup, and one DDIA-notes thread. 3 posts in July. Recruiters search "RAG + Bangalore + fresher" — be findable.

---

## 4. Decision gates & the 2-month fallback (Aug–Sep)

**Gate (Jul 31): do you have an offer or a final-round in flight?**

**If YES →** take the job (even 12–14L Solutions if that's what landed — income + title + leverage), keep freelancing 8–10 hrs/week, revisit market at +12 months with a year of AI-systems experience. Do NOT hold out for a unicorn offer past your runway.

**If NO → Fallback mode (Aug 1–Sep 30):**
1. **Income first (Aug Wk 1):** Scale AI-training contracting to 25–30 hrs/week (Mercor/Outlier/Turing queues — coding-eval queues pay best for your profile). At even $20/hr × 25 hr/wk ≈ ₹1.7L/mo — your runway problem is solved, panic removed, and it's *AI work* you can talk about.
2. **Widen the job funnel (Aug):** GCCs and captives (Walmart Global Tech, Target, Lowe's, Tesco Bengaluru, JPMC, Wells Fargo, ANZ — all run Aug–Oct fresher/early-career AI+data intakes, 12–22L, slower but stable); product-based service firms (Thoughtworks, Sahaj, Everest); keep startup apps flowing via Wellfound/Instahyre/Cutshort with your now-stronger portfolio. Aug–Sep = campus-season spillover, off-campus postings spike.
3. **One more flagship (Aug):** "Agent ops" project — multi-agent workflow (planner/executor/verifier) that automates a real business task end-to-end (e.g., invoice → extraction → validation → ERP-format export), with human-in-the-loop UI. This is what SMB clients buy on Upwork — build it once as portfolio, resell as gigs.
4. **Upwork push (Aug–Sep):** With 2 flagships + writeups: niche profile "RAG & document-AI for fintech/compliance", 4 portfolio pieces, 10 proposals/week on jobs <$1k with <10 proposals (filter: "payment verified", posted <24h). First 3 jobs: price low (₹15–25k), overdeliver, farm 5-star reviews. Contra (0% commission) mirror profile for inbound.
5. **Interview maintenance:** 2 mocks/week (1 DSA, 1 ML system design), keep the 45-min DSA habit.
6. **Hard floor (Sep 30):** if still nothing ≥10L, take the best offer on the table — including Quantiphi/Fractal-tier or a strong contract-to-hire — and keep compounding. A year of shipped AI work beats a gap, full stop.

---

## 5. Freelance — exact launch sequence

**Track A — AI-training contractor (start Jun 28–29, money in 2–4 weeks):**
| Platform | What you'd do | Realistic rate (India) | Note |
|---|---|---|---|
| Mercor | Coding/SWE eval, agent tasks | $15–60/hr (claims up to $120 for specialists) | AI-interview onboarding; your IEEE paper + repos help ranking |
| Outlier (Scale) | Code review/RLHF for coding models | $25–60/hr coding queues | Queue availability fluctuates; take assessments early |
| Turing | LLM trainer / eval | $15–40/hr | Also a job-pipeline play — they place devs with US clients |
| DataAnnotation / Invisible | Generalist + code tasks | $20–40/hr | Backup volume |
Apply to all four; queues come and go, layering = steady hours. Caution: NEVER during internship hours while still employed; check your HV contract's moonlighting clause before Jun 30.

**Track B — client freelancing (profile live Jul 12, after Project 1 ships):**
- Niche positioning, verbatim: *"I build production RAG & document-AI systems for fintech and compliance teams — retrieval, evals, and deployment, not just demos. Ex-HyperVerge (KYC for 6 enterprise fintechs), IEEE-published."*
- Platforms in order: **Upwork** (volume is here; expect 20–40 proposals before first win; new-freelancer boost helps), **Contra** (0% fee, link from LinkedIn/portfolio), **Fiverr** (productized gigs: "RAG chatbot on your docs — ₹20k", "LLM eval suite for your AI feature — ₹15k"). Skip Toptal/Braintrust/Arc until you have ~2 yrs equivalent track record — their vetting screens out freshers.
- Payments: Wise/Payoneer or Upwork direct-to-INR; register for the export-income paperwork (LUT/GST only needed past ₹20L/yr — ignore for now, keep invoices).
- Weekly cadence from Jul 12: 10 proposals (Upwork) + 1 portfolio post (LinkedIn/X). Track in a sheet: job link, bid, response. Iterate the pitch every 10 sends.

---

## 6. Compute plan (1070 + rentals)

- **1070 8GB handles:** all inference ≤8B at Q4/Q5 (llama.cpp/Ollama), embeddings + rerankers, Whisper, QLoRA on ≤3B (batch 1, grad-ckpt, 1k ctx), all classical ML. No bf16/flash-attn (Pascal) — use fp16-with-care or fp32 for small stuff.
- **Rent when:** fine-tuning ≥7B, context >2k training, anything multi-epoch on >50k samples. **RunPod** RTX 4090 ~$0.35–0.45/hr or A40 48GB ~$0.40/hr; **Vast.ai** often cheaper; Colab Pro (₹950/mo) for notebooks. Budget ₹2–3k total for July — that's all Project 2 needs.
- Keep a `compute-log.md`: what you ran, where, cost. (Becomes a blog post: "What ₹2,500 of rented GPU taught me about fine-tuning.")

---

## 7. The exact DSA list (60 problems — your maintenance set)

Arrays/Hashing: Two Sum · Group Anagrams · Top K Frequent · Product of Array Except Self · Longest Consecutive Sequence · Valid Sudoku · Encode/Decode Strings · Contains Duplicate II
Two Pointers: Valid Palindrome · 3Sum · Container With Most Water · Trapping Rain Water · Sort Colors
Sliding Window: Best Time to Buy/Sell Stock · Longest Substring Without Repeating · Longest Repeating Character Replacement · Minimum Window Substring · Permutation in String
Stack: Valid Parentheses · Min Stack · Daily Temperatures · Evaluate RPN · Largest Rectangle in Histogram
Binary Search: Binary Search · Search Rotated Sorted Array · Find Min in Rotated Sorted · Koko Eating Bananas · Median of Two Sorted Arrays (attempt, don't die on it)
Linked List: Reverse LL · Merge Two Sorted · Reorder List · Remove Nth From End · LRU Cache · Detect Cycle
Trees: Invert · Max Depth · Diameter · Balanced · LCA of BST · Level Order · Validate BST · Kth Smallest in BST · Build from Preorder+Inorder · Serialize/Deserialize
Heap: Kth Largest in Stream · Last Stone Weight · K Closest Points · Find Median from Data Stream
Backtracking: Subsets · Combination Sum · Permutations · Word Search
Graphs: Number of Islands · Clone Graph · Rotting Oranges · Course Schedule (I & II) · Pacific Atlantic · Graph Valid Tree · Word Ladder
1-D DP: Climbing Stairs · House Robber (I & II) · Longest Increasing Subsequence · Coin Change · Word Break
2-D DP: Unique Paths · Longest Common Subsequence · Edit Distance
Greedy/Intervals: Jump Game · Merge Intervals · Non-overlapping Intervals · Meeting Rooms II

Rule: 25 min attempt → read editorial → re-implement from blank file → log pattern in one line. Re-solve all "failed" ones on Sundays.

---

## 8. Weekly scorecard (fill every Sunday, 15 min)

| Metric | Target |
|---|---|
| Applications sent (quality) | 8–10 |
| Recruiter/referral conversations | ≥2 |
| DSA problems (new + redo) | 10–12 |
| DDIA chapters/notes | per schedule |
| Flagship commit days | ≥5 |
| Freelance: proposals / contractor hours | 10 / as available |
| Published (post, video, model card) | ≥1 per 2 weeks |

If two weeks miss >50% of targets, cut scope in this order: CN/OS prep → DSA to 30 min → Project 2's 7B run (keep 3B) — never cut applications or the flagship.

---

## 9. Sequence of what matters (if you remember nothing else)

1. HyperVerge conversion ask + referrals out — **this week**.
2. Karpathy series + DDIA Ch 1/3/5 — June.
3. Mercor/Outlier applications — Jun 28.
4. Verity (RAG+evals flagship) shipped + posted — Jul 14.
5. Fine-tune with eval receipts on HF — Jul 24.
6. 8–10 apps/week, every week, no exceptions.
7. Jul 31 gate → take the in-hand offer or flip to fallback income mode.
