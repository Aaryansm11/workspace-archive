# Review — DDIA-Core-Guide.md vs. extractions

**Reviewer:** senior technical review pass
**Date:** 2026-06-09
**Files reviewed:** `DDIA-Core-Guide.md` (the guide) against `extraction/part-1.md`, `part-2.md`, `part-3.md`

---

## Verdict

The guide is **accurate** (very few real errors) and **well-organized**, but it is **too compressed for its stated goal**. At ~8,500 words (~20 pages) it reads like a strong cheat-sheet, not the "comprehensive core ~100 pages" the user wants. The extractions contain a large amount of *mechanism detail, worked examples, and "why" reasoning* that the guide drops — and that is exactly the material needed for deep learning and senior-level system-design interviews.

**The single biggest problem is DEPTH, not accuracy or coverage of topic headings.** Almost every concept is *named*, but many are explained in one compressed line where the reader needs the underlying mechanism and a worked example to actually understand and recall it.

**Target:** expand to ~18,000–25,000 words. The expansion should be ~70% **depth** (mechanism + worked examples + why), ~25% **completeness** (genuinely missing concepts below), ~5% trim/restructure.

Priorities: **P1** = do first (highest learning/interview value, or a real error). **P2** = important for a true "core." **P3** = nice to have / polish.

---

## 1. ACCURACY (errors, oversimplifications, misstatements)

Overall accuracy is high. Issues found:

- **[P1] Ch9 — "SSI is NOT linearizable" framing is correct but the one-liner risks over-generalizing.** The guide says "2PL and serial execution are typically linearizable; SSI is NOT." This matches the extraction. Keep it, but when expanding add the *reason* from the extraction (SSI reads from a consistent snapshot that deliberately excludes recent writes) so the reader doesn't memorize it as a bare fact. Minor — depth fix, not an error.

- **[P2] Ch5 — "DynamoDB is single-leader" nuance is missing.** The extraction explicitly flags a common interview trap: *Dynamo* (Amazon-internal, the paper) is leaderless, but *DynamoDB* (the product) is single-leader. The guide lists "Dynamo-style; Riak, Cassandra, Voldemort" without the DynamoDB caveat. Add the distinction — it is a frequent interview gotcha.

- **[P2] Ch7 — "snapshot isolation prevents read skew" is right, but the guide conflates SI's phantom behavior.** The extraction's Ch7 summary is precise: "SI prevents straightforward phantoms in read-only queries; write-skew phantoms need index-range locks (or serializable)." The guide's table just says SI "stops read skew (non-repeatable read)" and lumps phantoms entirely under serializable. Tighten this when expanding the isolation section.

- **[P3] Ch3 — "B-tree pages traditionally 4 KB" is fine**, but the guide states branching factor "in the hundreds" without noting it depends on page size / key size. Extraction says "k typically in hundreds." Acceptable as-is; optionally add the dependency.

- **[P3] Ch1 — "hardware faults only 10-25% of outages" appears under Human errors.** The extraction says human config errors are the leading cause and hardware faults are 10–25%. The guide phrases it correctly. No change needed; flagging only to confirm it's not an error.

- **[P3] Ch11 — "stream processing is NOT inherently lossy/approximate."** The extraction makes this explicit point (probabilistic algorithms are an *optimization*, not a requirement). The guide omits the clarifying sentence; readers sometimes wrongly believe streaming = approximate. Add one line.

No factual errors serious enough to mislead. The guide's "Ch12 not in source" labeling is honest and correctly handled.

---

## 2. COMPLETENESS (present in extractions, missing/too thin in guide), per chapter

### Ch1 — Reliable, Scalable, Maintainable
- **[P2]** The **standard building blocks** list (databases, caches, search indexes, stream processing, batch processing) and the "boundaries are blurring" point (Redis-as-queue, Kafka-as-durable-DB) — the *reason* you become a data-system designer — is dropped. Add a short paragraph; it frames the whole book.
- **[P2]** **Latency vs response time** distinction (response time = what client sees = service + network + queueing; latency = duration awaiting service). Missing entirely. This is a precise definition interviewers probe.
- **[P3]** **Elastic vs manually-scaled** systems. Missing. One line.
- **[P3]** The concrete second satisfaction stat ("1s slowdown → 16% drop in a satisfaction metric") and "optimizing p99.99 is too expensive (diminishing returns, random events)" nuance. Add to round out the percentiles discussion.
- **[P3]** Percentile **computation** methods (forward decay, t-digest, HdrHistogram). Currently only "histograms" is mentioned. Add the algorithm names.

### Ch2 — Data Models
- **[P2]** The **layered-model abstraction** intro (real world → app objects → JSON/relational/graph → bytes → signals; each layer hides the one below). Missing. It's the conceptual spine of the chapter.
- **[P2]** **Triple-store / SPARQL / Turtle** detail is thin. The guide names them but doesn't show the (subject, predicate, object) decomposition where object is *either* a primitive (= property) *or* another vertex (= edge). That duality is the whole idea. Add a worked example.
- **[P3]** **Datalog** rules example (`within_recursive`, recursion/composition) — currently just "Prolog subset." Add the `head :- body` rule form and why rules compose.
- **[P3]** **Locality is not unique to documents** (Spanner interleaving, Oracle index cluster tables, Bigtable column families). The guide gives the document-locality caveat but not these counterexamples.

### Ch3 — Storage and Retrieval
- **[P1]** The **"world's simplest database"** (`db_set`/`db_get` append-and-scan) is the on-ramp that makes hash indexes and the log idea click. Missing. Add it as the opening worked example.
- **[P2]** **Hash index real-world details**: binary length-prefixed format, crash recovery via snapshotting each segment's hash map, partial-write detection via checksums, single-writer-thread concurrency, and *why append-only is good* (sequential >> random on HDD and SSD; simpler crash recovery; merging fixes fragmentation). The guide compresses all of this into one line. These are exactly the mechanism details an interview drills.
- **[P2]** **SSTable sparse-index mechanics** (jump to known offset of `handbag`, scan forward to find `handiwork`) and the **block-compression** rationale (disk bandwidth > CPU → spend CPU to save I/O). The guide names "sparse index" and "compress blocks" without the mechanism.
- **[P2]** **Heap file** concept (rows stored in no particular order, referenced by secondary indexes to avoid duplication) — the basis for understanding clustered vs covering indexes. Missing.
- **[P3]** **Star schema worked detail**: fact table = one row per event, dimension tables = who/what/where/when/how/why, even date is a dimension. The guide has this but could use one concrete row example.

### Ch4 — Encoding and Evolution
- **[P2]** **Worked byte-size comparison** is the most memorable part of this chapter and it's reduced to parenthetical numbers. Make it an explicit table: textual JSON 81 → MessagePack 66 → Thrift BinaryProtocol 59 → Thrift CompactProtocol 34 → Protobuf 33 → Avro 32. Show *why* each shrinks (drop whitespace → drop field names via tags → bit-pack type+tag → variable-length ints → drop tags entirely). This single table teaches the whole chapter.
- **[P2]** **Variable-length integer encoding** (top bit = continuation; −64..63 in 1 byte) — the mechanism behind the compactness. One sentence currently absent.
- **[P3]** **Protobuf has no list type → `repeated`**, and the safe `optional`→`repeated` evolution. Missing; it's a concrete evolution rule.
- **[P3]** **ASN.1 heritage / DER encodes X.509 certs.** Minor, but a nice "this is everywhere" hook.

### Ch5 — Replication
- **[P2]** **Read-scaling architecture** (many followers for read-heavy web workloads, realistic only with async). The guide mentions read scaling abstractly but not this concrete pattern.
- **[P2]** The **happens-before tracking algorithm** (the version-number/sibling protocol: server keeps version per key, returns all non-overwritten values + version on read, client merges and writes back with prior version, server overwrites ≤ that version and keeps higher as siblings). The guide states the *concept* (siblings, version vectors) but omits the step-by-step *algorithm*, which is the part worth actually learning.
- **[P2]** **Sibling merging mechanics**: union for add-only, tombstones for deletes so removed items don't resurrect. The guide mentions "union + tombstones" in one clause — expand into the shopping-cart worked example from the extraction.
- **[P3]** **Cross-device read-after-write** complications (centralized metadata, same-DC routing). One line missing.
- **[P3]** **Version vectors vs vector clocks** terminology note (version vectors ≈ client-server, vector clocks ≈ peer-to-peer). Minor.

### Ch6 — Partitioning
- **[P2]** **Consistent hashing clarification** — the extraction makes a sharp point: "consistent" ≠ ACID/replica consistency; consistent hashing (Karger) was for CDN caches and "actually works poorly for DBs and is rarely used" → prefer "hash partitioning." The guide doesn't mention consistent hashing at all, but it's a *very* common interview term and candidates often over-credit it. Add a short myth-busting note.
- **[P3]** **Fixed-partition mechanics**: key→partition mapping stays constant, only partition→node assignment changes; can weight powerful nodes with more partitions; partition count = max future nodes. The guide has the headline; add the "only assignment changes" mechanism.
- **[P3]** Concrete **request-routing implementations** (Espresso/Helix, mongos, gossip in Cassandra/Riak, DNS for slow-changing IPs). Partly present; could be a small table.

### Ch7 — Transactions
- **[P2]** **MVCC visibility rules** — the guide mentions `created_by`/`deleted_by` txids but not the actual visibility algorithm (at txn start snapshot the in-progress txid list; ignore their writes even if later committed; ignore aborted; ignore later txids; object visible if creator committed-before-start AND not deleted-before-start). This is the mechanism that makes SI work and is highly interviewable. Add it.
- **[P2]** **Append-only/copy-on-write B-trees for MVCC** (CouchDB/Datomic/LMDB: new root per write = a consistent snapshot). Currently only a passing mention under Ch3; tie it to SI here.
- **[P2]** **SSI two-detection-cases** in real depth: (a) *detecting stale MVCC reads* — track when a txn ignored another's writes via visibility, abort at commit if those have since committed; (b) *detecting writes that affect prior reads* — non-blocking "tripwire" recording which txns read which index range, notify them on write. The guide gives one compressed line ("run on a snapshot, abort on commit if a premise went stale"). Expand into the two cases with the on-call-doctors example threaded through.
- **[P2]** **Actual serial execution: partitioning + stored procedures** detail (cross-partition throughput ~1000 writes/s in VoltDB and can't be improved by adding machines; why stored procedures are required = avoid network round-trips inside the txn). The guide names these; add the worked numbers and the round-trip reasoning.
- **[P3]** **Index-range (next-key) locking vs predicate locking** mechanism — why predicate locks are correct but slow, and how index-range locks approximate them by attaching shared locks to index entries. The guide names both; add the one-step mechanism.

### Ch8 — Distributed Systems Trouble
- **[P2]** **Network congestion/queueing as the root cause of variable delay** — the extraction enumerates the queue sources (switch queues, OS queues when cores busy, VM pauses, TCP flow control, TCP retransmit, noisy neighbors). The guide lists them in one parenthetical; this is core mechanism and deserves a short bulleted breakdown.
- **[P2]** **The leader-and-lease worked failure** (why the naive renew loop is wrong: relies on synchronized clocks AND assumes little time passes between check and use → GC pause between them → corruption). The guide gestures at it; spell out the sequence because it directly motivates fencing tokens.
- **[P2]** **Spanner/TrueTime wait-out-the-interval mechanism** — *why* waiting out the confidence interval guarantees causality-respecting timestamps (so a later txn's interval can't overlap an earlier one). The guide states "waits out the interval"; add the one-sentence reason and the ~7 ms uncertainty figure.
- **[P3]** **Synchronous vs asynchronous networks** (circuit-switched bounded delay vs packet-switched unbounded; latency = consequence of *dynamic* resource partitioning; static partitioning gives guarantees but low utilization). The guide has the headline; the "cost-benefit tradeoff, not a law of nature" framing is good — keep and lightly expand.
- **[P3]** **Detecting faults** concrete signals (RST/FIN, ICMP unreachable, HBase monitoring script) and why none are reliable. Thin in guide.

### Ch9 — Consistency and Consensus
- **[P1]** **Building linearizable CAS from total order broadcast** (append tentative claim → read log → wait for your message → if first claim for the username is yours, commit, else abort) AND the reverse (build TOB from a linearizable increment-and-get register, no gaps). This is *the* concrete demonstration of the equivalence the chapter's TL;DR asserts. The guide states the equivalence as a fact but never shows the construction. Add both constructions — this is high interview value.
- **[P2]** **2PC flow in step detail**: globally-unique txn ID → work tagged with ID → Phase 1 prepare (participant durably writes data, checks constraints, votes yes = irrevocable promise, gives up right to abort) → coordinator writes decision = commit point → Phase 2 commit/abort, retry forever. **Two points of no return.** The guide has most of this but compresses the "two points of no return" and the "irrevocable promise" framing.
- **[P2]** **Epoch numbering / two-overlapping-quorums** mechanism — *why* it breaks the chicken-and-egg: each decision needs a quorum; election quorum and proposal quorum must overlap, so at least one voter has seen any newer election → the leader knows whether it's still current. The guide names "epoch numbering" and "two overlapping majorities" but doesn't connect them into the argument.
- **[P3]** **ZooKeeper feature → mechanism mapping** is good in the guide; add the explicit note that *only the linearizable atomic op truly needs consensus*, the rest are layered on top.
- **[P3]** **3PC and why it's impractical** (needs bounded delay + perfect failure detector). The guide omits 3PC entirely; one line would complete the 2PC discussion.

### Ch10 — Batch Processing
- **[P2]** **The MapReduce shuffle in mechanism detail**: mappers partition output by reducer, sort locally, write SSTable-like files to local disk; reducers fetch (the shuffle = partition + sort + copy); reducer merges preserving sort order; reduce called per key with an iterator that may exceed memory. The guide names "shuffle" but the step-by-step is the part worth learning.
- **[P2]** **Why build DB files inside the job and bulk-load** — the guide states the rule, but the *reasons* (per-record network writes are slow; concurrent writers overwhelm the DB; breaks all-or-nothing; speculative execution exposes partial output) are the interview substance. Expand.
- **[P2]** The **four join algorithms** are in a good table, but the *map-side* family (broadcast hash, partitioned/bucketed hash, map-side merge) needs the "no reducers, mapper reads a block writes a block" mechanism and the "you must know the physical layout (HCatalog/Hive metastore)" point.
- **[P3]** **Why frequent failures matter at Google** worked numbers (batch jobs at low priority, ~5%/hour preemption, 100-task/10-min job → >50% chance of preemption). The guide has the headline ~5%; add the >50% derivation — it's memorable.
- **[P3]** **Pregel/BSP "think like a vertex"** detail (vertex keeps state in memory between rounds, processes only new messages, exactly-once via checkpointing). Present but thin.

### Ch11 — Stream Processing
- **[P2]** **The three-timestamps technique** for untrusted device clocks (event occurred / event sent — both device clock; event received — server clock → estimate offset → reconstruct true event time). The guide names "log three timestamps"; add *which three and why* — it's a concrete, memorable interview answer.
- **[P2]** **Log-based broker disk mechanics** — the ring-buffer back-of-envelope (6 TB @ 150 MB/s ≈ 11 hours of buffer; days/weeks in practice), monitor consumer lag, a slow consumer only affects itself. The guide mentions ring buffer; add the sizing intuition and the operational advantage.
- **[P2]** **Exactly-once via atomic commit** — *why* it's feasible despite being 2PC-like: it reduces to a **single-object write** (outputs + state + offset) to a fault-tolerant store, and single-object writes are easy to make atomic. The guide lists the technique; add the "why it's tractable" insight.
- **[P3]** **Stream-table join via CDC-maintained local copy** — the guide has it; add the contrast with batch (batch uses a point-in-time snapshot; the long-running stream processor must keep its local copy current).
- **[P3]** **The derivative/product-rule analogy** for table-table joins `(u·v)′ = u′v + uv′` is in the guide — keep it, it's elegant; just make sure the state/stream "integral vs derivative" framing is introduced before it's used.

---

## 3. DEPTH — the most important section: where to add mechanism, worked examples, and "why"

This is where the bulk of the ~10,000-word expansion should go. Concrete per-chapter directives:

- **[P1] Add a worked example to every storage and consensus mechanism.** The chapters that most need worked examples (in priority order): **Ch3 (storage), Ch9 (consensus/linearizability), Ch7 (isolation), Ch5 (concurrent-write detection), Ch10 (joins).** For each, the reader should be able to trace one concrete scenario end to end. Specific examples to add are listed under Completeness above (db_set/db_get, the linearizable-CAS-from-TOB construction, MVCC visibility on a transfer, the version/sibling shopping-cart algorithm, reduce-side sort-merge join).

- **[P1] Convert "fact lists" into "fact + mechanism + why."** Right now many bullets state a conclusion without the reasoning that makes it stick. Examples that must gain a "why": *why* LSM writes are faster (random→sequential), *why* in-memory DBs are fast (skip the encode-to-disk step, not the disk read), *why* `hash mod N` is bad (worked `123456 mod 10/11/12`), *why* LWW loses data (causally-later write gets an earlier timestamp), *why* linearizability is slow always (Attiya & Welch: ≥ proportional to network-delay uncertainty; even multicore RAM needs memory barriers), *why* 2PC blocks (in-doubt participant can't unilaterally decide), *why* causal consistency stays available under partitions (partial order needs no global coordination). Several of these "why"s are already present as one-liners — expand each into 2–4 sentences with the underlying argument.

- **[P2] Add the "running examples" DDIA uses, because they aid recall.** The Twitter fan-out (present, good), the LinkedIn/résumé one-to-many (Ch2 — currently only named), the on-call-doctors write skew (Ch7 — present but should thread through SSI), the image-resizer cross-channel dependency (Ch9 — named, expand to the race), the meeting-room/seat-booking phantom (Ch7 — named), the shopping-cart sibling merge (Ch5 — should be worked).

- **[P2] Deepen the comparison tables with a "when it bites you" column.** The LSM/B-tree, key-range/hash, AMQP/log-broker, and isolation-level tables are excellent scaffolding but currently list properties. Add a short "failure mode / gotcha" note to each row (e.g. LSM row: "compaction can starve reads under write-heavy load → tail spikes"; key-range row: "timestamp keys = single hot partition for all of today's writes").

- **[P2] Expand Ch9 most aggressively.** It is the "crown jewel" chapter and currently one of the densest/thinnest relative to its importance. The linearizability↔TOB↔consensus equivalence, the 2PC step-through, epoch numbering, and the ZooKeeper feature mapping each deserve a full worked treatment. Budget the largest share of new words here.

- **[P2] Expand Ch3 and Ch7 next.** Storage internals (Ch3) and isolation/serializability (Ch7) are the two most-drilled topics in senior DB interviews and both are currently compressed below the level needed to *explain* (vs *recognize*) the mechanisms.

- **[P3] Add a short "interview pitfalls" callout per chapter** (2–3 lines): common wrong answers the reader should avoid (e.g. "quorums guarantee fresh reads" → false; "Dynamo = DynamoDB" → false; "serializable = linearizable" → false; "consistent hashing solves DB partitioning" → mostly not).

---

## 4. TRIM (redundant or low-value)

The guide is lean; little to cut. Minor items:

- **[P3]** The **Interview-Ready One-Liners** section overlaps heavily with the per-chapter TL;DRs and the Decision Cheat-Sheet. As the body grows, the one-liners risk becoming redundant restatement. *Recommendation: keep the one-liners but reposition them explicitly as a "final-night flashcard review,"* and remove any that merely repeat a TL;DR verbatim. Do **not** cut them outright — they have high last-mile value.
- **[P3]** Some vendor lists are exhaustive (e.g. every NTP/broker/warehouse vendor). Once the body is fuller, trim trailing vendor enumerations to 2–3 representative names plus "etc." to keep the prose readable. Low priority — they don't cost much.
- **[P2 — caution, not a cut]** Do **not** trim the Ch12 summary, but keep its "not in source PDF / from general knowledge" labeling prominent. It is correctly flagged; just ensure the disclaimer survives any reformatting.

---

## 5. STRUCTURE / CLARITY

- **[P1] Add a "How to use this guide" note up top** stating the depth contract: each chapter now gives definition → mechanism → worked example → tradeoffs → interview pitfalls. This sets reader expectations for a "core study guide" vs a cheat sheet, and disciplines the expansion to be consistent.
- **[P2] Standardize each chapter to a fixed skeleton:** TL;DR → Core concepts (with mechanisms) → Worked example(s) → Comparison table(s) → Tradeoffs / when-to-use → Interview pitfalls. The guide already roughly follows TL;DR + bullets + tables; formalizing the skeleton will make the longer version navigable.
- **[P2] Add per-part recap boxes.** After Part I, II, III, a 3–4 bullet "what ties this part together" (the extractions' part intros already give the material: Part II = replication + partitioning combine on shared-nothing; Part III = systems-of-record vs derived data). Currently the part intros exist but there's no closing synthesis per part.
- **[P3] Promote a few inline tables.** The encoding byte-size comparison (Ch4) and the request-routing approaches (Ch6) are currently prose/parenthetical and would read better as tables.
- **[P3] Cross-link related concepts.** Add explicit "(see Ch9)" style links where a concept recurs: 2PL↔2PC↔2PC-blocking, MVCC appears in Ch3 and Ch7, fencing tokens in Ch8 and Ch9, CDC in Ch5 and Ch11. The guide does some of this; make it systematic.
- **[P3] The Decision Cheat-Sheet is strong — keep it.** It is the highest-value synthesis artifact. As depth grows, ensure each cheat-sheet line links back to the (now fuller) chapter section.

---

## Suggested word budget for the expansion (~+11,000 words to hit ~20k)

| Chapter | Current (approx) | Add | Why |
|---|---|---|---|
| Ch1 | thin | +400 | latency/response-time, building blocks |
| Ch2 | medium | +600 | layered models, triple-store/SPARQL worked, Datalog |
| Ch3 | medium | +1,500 | db_set on-ramp, hash-index internals, SSTable mechanics, heap files |
| Ch4 | medium | +800 | byte-size table + varint mechanism + repeated |
| Ch5 | medium | +1,200 | happens-before algorithm, sibling merge worked, read-scaling |
| Ch6 | thin | +700 | consistent-hashing myth, fixed-partition mechanics, routing table |
| Ch7 | medium | +1,800 | MVCC visibility rules, SSI two cases, serial-execution numbers |
| Ch8 | medium | +1,100 | queueing breakdown, lease failure, TrueTime why |
| Ch9 | dense/thin | +2,200 | CAS-from-TOB construction, 2PC steps, epoch numbering |
| Ch10 | medium | +900 | shuffle mechanism, bulk-load reasons, map-side joins |
| Ch11 | medium | +1,000 | three timestamps, ring-buffer sizing, exactly-once why |
| Synthesis | good | +0 / trim | reposition one-liners as flashcards |

(Rough; the point is the *relative* emphasis — Ch9, Ch7, Ch3 get the most.)

---

## Top 10 actions, strictly prioritized

1. **[P1]** Ch9 — add the linearizable-CAS-from-total-order-broadcast construction (and reverse). Highest interview value; proves the equivalence the guide only asserts.
2. **[P1]** Ch3 — add the `db_set`/`db_get` on-ramp + hash-index internals + SSTable sparse-index/block mechanics.
3. **[P1]** Convert fact-lists to fact+mechanism+why across the guide (LSM, in-memory DBs, hash mod N, LWW, linearizability-is-slow, 2PC-blocks, causal-stays-available).
4. **[P1]** Ch7 — add MVCC visibility rules and the SSI two-detection-cases with the on-call-doctors example threaded through.
5. **[P1]** Add the "How to use this guide / depth contract" note and standardize the per-chapter skeleton.
6. **[P2]** Ch4 — make the byte-size comparison a table with the "why each shrinks" progression + varint mechanism.
7. **[P2]** Ch5 — add the happens-before version/sibling algorithm and the shopping-cart merge worked example; add the DynamoDB-vs-Dynamo caveat.
8. **[P2]** Ch9 — expand 2PC into stepwise flow (two points of no return) and add epoch-numbering / two-overlapping-quorums argument.
9. **[P2]** Ch8 — break out network queueing causes, the lease-renewal failure sequence, and the TrueTime "wait out the interval" reasoning.
10. **[P2]** Ch10 + Ch11 — add the shuffle mechanism + bulk-load reasons (Ch10) and the three-timestamps technique + exactly-once-as-single-object-write insight (Ch11).
