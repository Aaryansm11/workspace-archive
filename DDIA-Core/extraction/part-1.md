# DDIA Part I — Foundations of Data Systems (Chapters 1–4)

High-density extraction. Optimized for system-design interviews and real engineering.

---

## Chapter 1 — Reliable, Scalable, Maintainable Applications

### Thinking about data systems
- Modern apps are **data-intensive** (bottleneck = amount/complexity/rate-of-change of data), not compute-intensive.
- Standard building blocks: **databases** (store/retrieve), **caches** (remember expensive results), **search indexes** (keyword/filter), **stream processing** (async message to another process), **batch processing** (periodically crunch accumulated data).
- Boundaries between tool categories are blurring (Redis = store used as queue; Kafka = queue with DB-like durability). Apps increasingly stitch multiple specialized tools together via application code → **you become a data system designer**, responsible for guarantees (e.g. cache stays consistent on writes).
- Three core concerns this chapter (and book) focuses on: **Reliability, Scalability, Maintainability.**

### Reliability — "continuing to work correctly, even when things go wrong"
- "Working correctly" = performs expected function; tolerates user mistakes/misuse; good-enough performance under expected load; prevents unauthorized access/abuse.
- **Fault vs. failure**: a *fault* = one component deviating from spec; a *failure* = whole system stops providing service to user. Can't reduce fault probability to zero → design fault-tolerance to **prevent faults from causing failures**. Goal: build reliable systems from unreliable parts.
- **Fault-tolerant / resilient**: anticipates and copes with faults. Only meaningful to tolerate *certain types* of fault.
- **Deliberately inducing faults** (e.g. Netflix Chaos Monkey, killing random processes) keeps fault-tolerance machinery continuously exercised → many critical bugs come from poor error handling.
- Prefer *tolerating* over *preventing* faults — except where no cure exists (security: a leaked secret/data breach cannot be undone → prevention).

**Fault types:**
- **Hardware faults**: disks crash, RAM faults, blackouts, unplugged cables. Disk MTTF ~10–50 yrs → in a 10,000-disk cluster, expect ~1 disk death/day. First response: hardware redundancy (RAID, dual PSUs, hot-swap CPUs, backup generators). Trend → software fault-tolerance tolerating loss of whole machines (cloud VMs vanish without warning; lets you patch one node at a time without full-system downtime). Hardware faults are mostly **random and independent**.
- **Software errors (systematic faults)**: correlated across nodes → cause far more failures than hardware faults. Examples: bad-input crash bug (Linux kernel leap-second bug, June 30 2012); runaway process exhausting shared resource; a dependency slowing/corrupting; **cascading failures**. Often lie dormant until triggered by unusual circumstances (a usually-true assumption stops being true). No quick fix; mitigations: test thoroughly, process isolation, crash+restart, measure/monitor/analyze in prod, self-check invariants (e.g. queue: #in == #out).
- **Human errors**: leading cause of outages — config errors by operators; hardware faults only 10–25% of outages. Mitigations: well-designed abstractions/APIs/admin interfaces (easy to do right thing, hard to do wrong — but not so restrictive people work around them); **decouple** places people err from places that cause failures (full-featured sandbox with real data); test at all levels; **fast recovery** (quick config rollback, gradual code rollout, tools to recompute data); detailed monitoring (**telemetry**); good management/training.
- Reliability matters even for "non-critical" apps (lost productivity, revenue, reputation, user data like family photos). May consciously sacrifice for dev/operational cost (prototype, thin-margin service) — but do it knowingly.

### Scalability — ability to cope with increased load
- Not a 1-D label ("X is scalable" is meaningless). Ask: *if the system grows in a particular way, what are our options for coping?*

**Describing load — load parameters** (depends on architecture): req/sec, read:write ratio, active users, cache hit rate, etc.
- **Twitter example (Nov 2012)**: post tweet 4.6k/s avg (12k/s peak); home timeline reads 300k/s. Real challenge = **fan-out**, not write volume.
  - *Approach 1*: write tweet to global collection; on read, join follows→users→tweets and merge by time. Cheap writes, expensive reads.
  - *Approach 2*: maintain a per-user home-timeline cache (mailbox); on post, fan-out into each follower's cache. Cheap reads, expensive writes. 4.6k tweets/s → ~345k writes/s (avg 75 followers/tweet); celebrities (>30M followers) → 30M+ writes per tweet; target delivery <5s.
  - Twitter moved 1→2 (reads ~2 orders of magnitude > writes, so do more work at write time). Now **hybrid**: most users fanned out; celebrities excepted and merged at read time → consistently good performance.
  - Key load parameter = distribution of followers/user (weighted by tweet rate).

**Describing performance:**
- Two questions: (a) increase load, keep resources fixed → how does perf change? (b) increase load, how much extra resource to keep perf fixed?
- **Throughput** (records/sec, job time) matters for batch (Hadoop); **response time** matters for online systems.
- **Latency vs. response time**: *response time* = what client sees (service time + network + queueing delays). *Latency* = duration request waits to be handled (latent, awaiting service).
- Response time = a **distribution**, not a single number. Outliers from context switches, TCP retransmit, GC pause, page fault, even rack vibration.
- Use **percentiles**, not mean. **Median = p50** (half faster, half slower) = "typical." Tail: **p95, p99, p999**.
- High percentiles (tail latency) matter: Amazon specs p99.9 for internal services — slowest requests often = most valuable customers (more data/purchases). **100ms ↑ response time → ~1% ↓ sales**; **1s slowdown → 16% ↓ a satisfaction metric**. But optimizing p99.99 deemed too expensive (dominated by random events; diminishing returns).
- **SLOs/SLAs** defined in percentiles (e.g. median <200ms, p99 <1s, up 99.9% of time).
- **Queueing delays** dominate high percentiles; a server handles few things in parallel (CPU cores) → few slow requests cause **head-of-line blocking**. Measure on the **client side**. Load generators must keep sending independently of response (else artificially short queues skew results).
- **Tail latency amplification**: one end-user request → many backend calls (even in parallel) → must wait for slowest. More backend calls ⇒ higher chance ≥1 is slow ⇒ higher fraction of slow end-user requests.
- Computing percentiles: rolling window; approximation algorithms (**forward decay, t-digest, HdrHistogram**). **Averaging percentiles is mathematically meaningless** — to aggregate, **add the histograms**.

**Approaches for coping with load:**
- **Scaling up (vertical)** = bigger machine; **scaling out (horizontal)** = distribute across smaller machines = **shared-nothing architecture**. Good architectures mix both pragmatically (few powerful machines often simpler/cheaper than many tiny VMs).
- **Elastic** (auto-add resources on detected load) vs. **manually scaled** (simpler, fewer surprises). Elastic good for unpredictable load.
- Stateless services distribute easily; **stateful data systems** are hard to make distributed. Common wisdom: keep DB on single node (scale up) until cost/HA forces distribution (may change as tooling improves).
- **No magic scaling sauce** — scalable architectures are application-specific, built around assumptions of which ops are common/rare (the load parameters). Wrong assumptions waste effort. Early-stage: iterate on features > scale for hypothetical load. Still built from general-purpose building blocks in familiar patterns.

### Maintainability — most software cost is ongoing maintenance, not initial dev
Three design principles:
- **Operability**: make it easy for ops to keep the system running. Good ops tasks: monitor health + restore service; track problems; keep platforms patched; watch inter-system effects; capacity planning; deployment/config tooling; complex migrations; security; predictable processes; preserve org knowledge. Data systems help by: good monitoring/visibility; automation + standard-tool integration; avoiding dependence on individual machines; good docs + operational model ("if I do X, Y happens"); good defaults with override freedom; self-healing + manual control; predictable behavior.
- **Simplicity**: manage complexity (not UI simplicity). Symptoms of complexity ("big ball of mud"): state-space explosion, tight coupling, tangled dependencies, inconsistent naming, perf hacks, special-casing. Complexity → blown budgets + more bugs. Distinguish **accidental complexity** (from implementation, not inherent to the problem) — remove it. Best tool against accidental complexity: **abstraction** (hides detail behind clean façade, reusable, improvements benefit all users; e.g. high-level languages hide machine code; SQL hides on-disk structures/concurrency/crash recovery). Good abstractions are hard to find, especially in distributed systems.
- **Evolvability** (extensibility/modifiability/plasticity): make change easy. Requirements are in constant flux. Agile/TDD/refactoring help at small scale; this book = agility at the **data-system level**. Closely tied to simplicity + good abstractions.

---

## Chapter 2 — Data Models and Query Languages

- Data models profoundly affect both how software is written *and* how we think about the problem. Apps layer models: real world → app objects/APIs → general-purpose model (JSON/XML/relational/graph) → bytes on disk → electrical signals. Each layer hides complexity below via a clean model. Every model embeds assumptions about usage (some ops easy/fast, others awkward/slow).

### Relational vs. Document Model
- **Relational** (Codd, 1970): data in *relations* (tables) = unordered collections of *tuples* (rows). Dominant ~25–30 yrs. Roots in 1960s–70s business data processing (transaction processing + batch). Goal: hide internal representation behind clean interface. Generalized far beyond original scope.
- History of challengers: network & hierarchical models (1970s–80s), object DBs (late 80s–early 90s), XML DBs (early 2000s, niche). All hyped, none lasted.
- **NoSQL** (2009 hashtag; "Not Only SQL"): drivers = greater scalability (huge datasets / high write throughput), preference for free/OSS, specialized queries not well-served by relational, frustration with restrictive schemas / desire for dynamic-expressive models. Likely outcome: **polyglot persistence** (relational + non-relational coexist).

**Object-relational impedance mismatch**: OOP objects ↔ tables/rows/columns require awkward translation. ORMs (ActiveRecord, Hibernate) reduce boilerplate but don't eliminate the gap.
- Résumé/LinkedIn example: one-to-many (positions, education, contact_info) modeled as: normalized separate tables + FKs; OR structured/XML/JSON column types (SQL:1999+); OR JSON/XML in a text column (can't query inside).
- **JSON for self-contained docs**: reduces impedance mismatch, has **locality** (one query/one place vs. multi-way join or multiple queries), makes the **tree structure** explicit. Document DBs: MongoDB, RethinkDB, CouchDB, Espresso. (JSON has its own problems — Ch 4.)

**Many-to-one & many-to-many — normalization:**
- Store **IDs** vs. duplicated text? ID has no human meaning → **never needs to change**; human-meaningful info may change, and if duplicated, all copies must update (write overhead + inconsistency risk). **Removing duplication = normalization.** Rule of thumb: if you duplicate values that could live in one place, schema isn't normalized.
- Normalization needs **many-to-one** relationships (many people → one region) — these **don't fit the document model well**. Relational: refer to rows by ID, joins easy. Document DBs: joins often weak/unsupported → emulate in app code (multiple queries) = moves work + complexity to app, usually slower.
- Data tends to become **more interconnected** over time (organizations/schools as entities, recommendations) → many-to-many appears → document model becomes less appealing.

**Are document DBs repeating history?**
- 1970s **IMS** (IBM, hierarchical model): tree of records-within-records, like JSON. Good for one-to-many; bad for many-to-many; no joins. Same problems as document DBs today.
- Two solutions to hierarchical limits: **relational** (won) and **network/CODASYL** (faded).
- **Network/CODASYL model**: generalization of hierarchical; a record can have multiple parents. Links = pointers (on disk), not FKs. Access only via following an **access path** from a root (like linked-list traversal / navigating n-dimensional space). Manual access-path selection made best use of 1970s hardware (slow tape seeks) but made code complex/inflexible — changing access paths required rewriting query code.
- **Relational model**: lay all data out in the open; a relation = collection of tuples, no nested labyrinths, no access paths. Read/insert any rows freely. The **query optimizer** auto-decides access paths (order, indexes) — build the optimizer **once**, all apps benefit. Declare a new index → queries auto-use it (no query rewrite). General-purpose optimizer wins long-term over hand-coded access paths.
- **Document DBs reverted to hierarchical** in one aspect (nested records in parent). But for many-to-one/many-to-many they're *not fundamentally different* from relational: related item referenced by ID (**foreign key** / **document reference**), resolved at read time via join/follow-up queries. Document DBs did *not* go down the CODASYL path.

**Relational vs. document today:**
- *Document strengths*: schema flexibility, locality (better perf for whole-doc access), closer to app data structures for tree-like data.
- *Relational strengths*: better joins, many-to-one + many-to-many support.
- **Which gives simpler app code?** Tree-of-one-to-many data (whole tree loaded at once) → document model good; relational "shredding" into multiple tables → cumbersome. Highly interconnected data → document awkward, relational OK, **graph most natural**.
- Document limitation: can't refer directly to a nested item (must say "2nd item in positions list of user 251") — fine if not too deeply nested.

**Schema flexibility:**
- Document DBs are **schema-on-read** (implicit schema, interpreted at read), vs. relational **schema-on-write** (explicit, enforced). Not truly "schemaless" — code reading assumes structure. Analogy: dynamic (runtime) vs. static (compile-time) type checking.
- Changing data format: document → just write new docs in new format + handle old in app code (e.g. `if (!user.first_name) user.first_name = user.name.split(" ")[0]`). Relational → `ALTER TABLE ... ADD COLUMN` (usually ms; **MySQL copies the whole table** = minutes/hours of downtime on large tables; tools exist to work around) + `UPDATE` (slow — every row rewritten; can instead default NULL + fill at read).
- Schema-on-read advantageous when data is **heterogeneous** (many object types, or structure set by external/uncontrolled systems). Schemas useful when all records share structure (documentation + enforcement).

**Data locality:**
- Doc stored as single contiguous string (JSON/XML/BSON). Locality win **only if you need large parts at once**. DB usually loads the **entire document** even for a small part (wasteful for large docs); updates usually rewrite the whole doc (only size-preserving updates can be in-place). → keep documents **fairly small**, avoid writes that grow them.
- Locality not unique to documents: Google **Spanner** interleaves rows within a parent table; Oracle **multi-table index cluster tables**; Bigtable **column-family** concept (Cassandra, HBase).

**Convergence**: relational DBs added XML (mid-2000s) + JSON (PostgreSQL 9.3+, DB2 10.5+) support, indexing/querying inside. Document DBs added joins (RethinkDB; MongoDB drivers do client-side joins, slower). Models converging → **hybrid relational+document is a good route**. (Codd's original relational model allowed nested relations — "nonsimple domains" — anticipating JSON-like structures.)

### Query Languages for Data
- **Declarative (SQL, relational algebra)**: specify the *pattern* of desired results (conditions, transforms) not *how* to get them. The query optimizer chooses indexes/join methods/order.
- **Imperative (IMS, CODASYL via COBOL)**: tell the computer exact operations in exact order.
- Declarative advantages: more concise/easier; **hides implementation details** → DB can change internals/optimize (e.g. reorder records to reclaim disk) without breaking queries; limited functionality gives DB more optimization room; **parallelizes well** (CPUs scale by cores not clock; imperative hard to parallelize because order is fixed).
- Web analogy: **CSS / XSL+XPath** are declarative styling (browser auto-applies/removes `li.selected > p`); imperative JS DOM manipulation is verbose, buggy (won't auto-remove style when class removed), and hard to optimize. Same lesson as SQL > imperative query APIs.

**MapReduce querying:**
- Programming model for bulk processing across many machines (Google). Neither fully declarative nor imperative — logic = snippets of code (**map** = collect, **reduce** = fold/inject) called repeatedly by the framework. Supported (limited form) by MongoDB, CouchDB for read-only queries.
- `map` called once per matching doc, emits key-value pairs; pairs grouped by key; `reduce` called once per key to combine. Example: shark sightings per month — map emits `("1995-12", n)`; reduce sums per month.
- **map/reduce must be pure functions** (only use input, no extra queries, no side-effects) → DB can run anywhere, any order, re-run on failure. Still powerful (parse strings, call libs, compute).
- Usability problem: two coordinated functions harder than one query; less optimizer opportunity. MongoDB 2.2 added a declarative **aggregation pipeline** (`$match`, `$group`, `$sum`...) — JSON syntax, ~subset of SQL. Moral: **a NoSQL system may accidentally reinvent SQL in disguise.**

### Graph-like Data Models
- For pervasive many-to-many / "anything related to everything." Graph = **vertices** (nodes/entities) + **edges** (relationships/arcs). Examples: social graphs, web graph (PageRank), road/rail networks (shortest path). Graphs can be heterogeneous (Facebook: people, locations, events, checkins, comments as vertices; friendships, attendance, etc. as edges). Good for **evolvability** — extend easily.
- Two model families: **property graph** (Neo4j, Titan, InfiniteGraph) and **triple-store** (Datomic, AllegroGraph). Declarative query langs: **Cypher, SPARQL, Datalog**. Imperative: Gremlin. Frameworks: Pregel.

**Property graph model:**
- **Vertex** = {unique id, outgoing edges, incoming edges, properties (key-value)}.
- **Edge** = {unique id, tail vertex (start), head vertex (end), label (relationship kind), properties}.
- Can model as two relational tables (`vertices`, `edges`); index both `tail_vertex` and `head_vertex` to traverse forward & backward.
- Key properties: (1) any vertex → edge → any vertex (no schema restriction); (2) efficient in/out traversal both directions; (3) different labels store different info in one clean graph.

**Cypher** (Neo4j, declarative): arrow notation `(Idaho)-[:WITHIN]->(USA)`. Variable-length path `()-[:WITHIN*0..]->()` = "follow WITHIN edge zero-or-more times" (like regex `*`). Query optimizer picks execution strategy (scan all people vs. start from US/Europe locations and work backward via index).

**Graph queries in SQL**: possible but painful. Relational joins are usually fixed in advance; graph queries need **variable number of joins**. SQL:1999 **recursive common table expressions** (`WITH RECURSIVE`) express variable-length traversal — but ~29 lines vs. ~4 in Cypher. Different models suit different use cases.

**Graph DB vs. CODASYL network model** — NOT the same:
- CODASYL: schema restricts nesting; graph: any vertex → any vertex (more flexible).
- CODASYL: reach record only via access path; graph: direct access by unique ID or property index.
- CODASYL: children = ordered set (storage consequences); graph: no defined ordering (sort only at query time).
- CODASYL: imperative, fragile to schema change; graph: declarative (Cypher/SPARQL) (imperative possible too).

**Triple-stores & SPARQL:**
- All info as 3-part statements: **(subject, predicate, object)**. e.g. `(Jim, likes, bananas)`. Subject = vertex. Object = either a primitive (predicate+object = property key+value, e.g. `(lucy, age, 33)`) OR another vertex (predicate = edge label, e.g. `(lucy, marriedTo, alain)`). Mostly equivalent to property graph.
- **Turtle** (subset of N3) = readable triple format; `_:name` = vertex; semicolons group multiple statements about same subject.
- **Semantic web / RDF**: idea = publish machine-readable data (a web "database of everything"). Over-hyped early 2000s, never realized in practice, acronym-heavy — but triples are a good *internal* model regardless. **RDF** (Resource Description Framework). RDF/XML is verbose; Turtle preferable. RDF quirk: subject/predicate/object often **URIs** (namespacing so different orgs' "within" don't conflict); URI needn't resolve to anything.
- **SPARQL**: query lang for RDF triple-stores (predates Cypher; Cypher borrowed its pattern-matching). Even more concise than Cypher: `?person :bornIn / :within* / :name "United States".` RDF doesn't distinguish properties from edges (both = predicates) → same syntax for both. Powerful even without the semantic web.

**Datalog** (foundation; 1980s academia; subset of Prolog):
- Used in Datomic, Cascalog (Datalog over Hadoop). Suggested as a future for parallel programming.
- Triple written as **predicate(subject, object)** instead of (subject, predicate, object).
- Define **rules** that create new predicates derived from data or other rules (`within_recursive`, `migrated`); rules can recurse/reuse. `head :- body` — rule applies if all RHS predicates match; uppercase = variables. Less convenient for one-off queries; better for complex data because rules combine/reuse.

### Ch 2 Summary
- History: hierarchical (one big tree, bad at many-to-many) → relational (solved it) → NoSQL diverged: **document DBs** (self-contained docs, rare cross-doc relationships) and **graph DBs** (anything related to everything). All three (document/relational/graph) widely used, each best in its domain; emulating one with another is awkward → no one-size-fits-all.
- Document + graph DBs typically don't enforce a schema (easier to adapt).
- Query langs: SQL, MapReduce, MongoDB aggregation pipeline, Cypher, SPARQL, Datalog (+ CSS, XSL/XPath parallels).
- Specialized models not covered: genome sequence-similarity (GenBank), particle physics petabyte-scale, full-text search/information retrieval.

---

## Chapter 3 — Storage and Retrieval

- A DB does two things: store data; give it back later. App devs should understand storage internals to **pick the right engine** and tune it. Big divide: engines optimized for **transactional (OLTP)** vs. **analytic (OLAP)** workloads. Two OLTP storage families: **log-structured** and **page-oriented (B-trees)**.

### Data structures that power your database
- World's simplest DB = append `key,value` to a file (`db_set`), read = scan for last occurrence (`db_get`).
- **Append-only log**: writes very fast (sequential). Reads O(n) — terrible at scale.
- **Index**: extra structure derived from primary data; speeds reads, **slows writes** (must update on every write). DBs don't index everything by default — devs/DBAs choose indexes from knowledge of query patterns. **Key trade-off: well-chosen indexes speed reads, every index slows writes.**

**Hash indexes** (key-value):
- In-memory hash map: key → byte offset in the data file. Append → also update map. Lookup → map gives offset, seek, read. This is essentially **Bitcask** (default Riak engine).
- Requires **all keys fit in RAM**; values can exceed RAM (one disk seek; or filesystem-cache hit → no I/O). Great for **many writes per key, few distinct keys** (e.g. URL → play count).
- Avoid unbounded file growth: break log into **segments**; **compaction** = throw away duplicate keys, keep most recent value per key; merge segments in background (segments are immutable → merged segment written to new file, then switch reads, delete old). Each segment has its own hash map; check most-recent first.
- Real-world details: binary format (length-prefixed strings, no escaping); **deletion** = append a **tombstone** record (tells merge to discard prior values); **crash recovery** = Bitcask snapshots each segment's hash map to disk (faster than re-reading); **partially written records** detected via checksums; **concurrency** = one writer thread (segments append-only/immutable → many concurrent readers).
- Why append-only is good: sequential writes >> random writes (HDDs *and* SSDs); simpler concurrency/crash recovery (no half-overwritten values); merging avoids fragmentation.
- Hash index **limitations**: must fit in memory (on-disk hash maps perform poorly — random I/O, expensive to grow, fiddly collisions); **range queries inefficient** (must look up each key individually).

**SSTables and LSM-trees:**
- **SSTable (Sorted String Table)**: same as log segment but key-value pairs **sorted by key**, each key appears once per merged segment. Advantages:
  1. **Merging is efficient** (mergesort-style, side-by-side, even if bigger than RAM); adjacent-segment merge → keep value from most recent segment.
  2. **Sparse in-memory index** suffices (not every key) — one key per few KB; to find `handiwork`, jump to known offset of `handbag` and scan (since sorted). (Fixed-size records could use binary search w/o index; real records variable-length.)
  3. Group records into a **block + compress** before disk; sparse index points at block start (disk bandwidth > CPU → spend CPU to reduce I/O).
- Getting sorted writes: maintain in-memory balanced tree (**memtable** — Red-Black/AVL); insert in any order, read sorted. Flow:
  - Write → add to memtable.
  - Memtable > threshold (few MB) → write out as SSTable (most recent segment); empty memtable.
  - Read → memtable, then newest on-disk segment, then older, etc.
  - Background **merge + compaction** combines segments, discards overwritten/deleted.
- Crash safety: separate **append-only log on disk** for each write (unsorted, only to restore memtable); discard once memtable flushed.
- Used by **LevelDB, RocksDB** (embeddable libs; LevelDB usable in Riak); **Cassandra, HBase** (inspired by Google **Bigtable** paper, which coined SSTable + memtable). Originally **Log-Structured Merge-Tree (LSM-Tree)** by Patrick O'Neil et al. **Lucene** (Elasticsearch/Solr full-text) uses similar SSTable-like sorted files for its **term dictionary** (term → postings list of doc IDs).
- Optimization: lookups for non-existent keys are slow (check memtable + all segments) → **Bloom filters** (memory-efficient set approximation; tells you a key *definitely isn't* present → skips disk reads).
- LSM strengths: works well even when data >> memory; **range queries** efficient (sorted); **high write throughput** (sequential disk writes).

**B-trees** — most widely-used index (introduced 1970, "ubiquitous" by 1979). Standard in nearly all relational DBs + many non-relational.
- Like SSTables: keys sorted (efficient lookups + range queries). Unlike: **fixed-size pages/blocks** (traditionally **4 KB**), read/write one page at a time (matches hardware). Each page has an on-disk address → pages reference pages → a tree.
- One page = **root**; contains *k* keys + *k*+1 child references; each child responsible for a continuous key range (k typically in hundreds). Descend until **leaf page** (values inline or references). **Branching factor** = # child refs per page.
- Update: find leaf, change value, write page back (refs stay valid). Insert: find page whose range covers the key, add; if no room, **split into two half-full pages**, update parent. Keeps tree balanced: **height O(log n)** for n keys. (Deletion more involved.) Similar to Red-Black/2-3 trees but larger branching factor.
- **Update-in-place** (overwrite page) vs. LSM **append-only**. Overwriting is a real hardware op (HDD: seek+wait+overwrite sector; SSD: more complex, also slow). Some ops overwrite several pages (split writes 2 children + parent) → crash mid-way = corrupted index (orphan page).
- Crash resilience: **write-ahead log (WAL / redo log)** — append-only file; every B-tree modification written there *before* applying to tree pages; used to restore consistency after crash.
- **Write amplification**: B-tree writes data ≥ twice (WAL + page, + splits); LSM also re-writes via background merges. Which is better depends on workload/tuning — **benchmark with your workload**. (Write amplification especially concerns SSDs — limited overwrite cycles before wearout.)
- B-tree concurrency: in-place updates need **latches** (lightweight locks). LSM simpler (background merge doesn't interfere; atomic segment swap).

**B-tree optimizations:**
- **Copy-on-write** (LMDB) instead of WAL — modified page written to new location, parent versions point at it (also helps concurrency / snapshot isolation).
- Abbreviate keys (esp. interior pages — only need boundaries) → higher branching factor, fewer levels (≈ **B+ tree**).
- Lay out leaf pages **sequentially on disk** for range scans (hard to maintain as tree grows; LSM keeps sequential keys nearby more easily because it rewrites large segments).
- Sibling pointers on leaf pages (scan in order without going back to parent).
- **Fractal trees** borrow log-structured ideas to reduce seeks.

**B-trees vs. LSM-trees:**
- LSM-trees: typically **faster writes** (turn random into sequential writes → much higher random-write throughput); appealing for write-heavy.
- B-trees: thought **faster for reads** (LSM must check multiple structures). Benchmarks often inconclusive / workload-sensitive.
- LSM downside: **compaction can interfere** with reads/writes (limited disk resources → request may wait); high-percentile response times can spike; B-trees more predictable.
- B-tree advantage: each key in **exactly one place** → good for **strong transactional semantics** (range locks attach directly to tree). LSM may have multiple copies in different segments.
- LSM also more compact (less fragmentation/space overhead). No simple rule — **test empirically.** B-trees deeply ingrained, won't disappear; log-structured increasingly popular in new datastores.

**Other indexing structures:**
- **Primary key index** = unique row/document/vertex; **secondary indexes** (CREATE INDEX) — keys not unique. Handle non-uniqueness: index value = list of matching row IDs (postings list), or append row ID to key. Both B-tree + LSM work as secondary indexes.
- **Storing values in the index**: value = actual row OR reference to row in a **heap file** (rows stored in no particular order; avoids duplication across multiple secondary indexes). Update without size change → in-place; larger value → move + update all indexes or leave forwarding pointer.
- **Clustered index**: store the row directly in the index (avoids extra hop). MySQL InnoDB: primary key is always clustered, secondaries refer to PK. SQL Server: one clustered index per table.
- **Covering index / index with included columns**: stores *some* columns in the index → query answered from index alone ("covers" the query). Speeds reads, costs storage + write overhead.
- **Multi-column indexes**:
  - **Concatenated index** = combine fields into one key (e.g. (lastname, firstname) like a phone book). Can find by lastname or lastname+firstname, but **useless for firstname alone**.
  - **Multi-dimensional indexes** (geospatial): 2D range query (lat AND long) can't be answered efficiently by a standard B-tree/LSM (gives one dimension range, not both). Options: **space-filling curve** → 1D B-tree; or specialized **R-trees** (PostGIS via PostgreSQL GiST). Useful beyond geo: (red,green,blue) color search; (date, temperature) weather — narrow both simultaneously (HyperDex).
- **Fuzzy indexes** (similar/misspelled keys): Lucene searches within an **edit distance** (Levenshtein); its in-memory index is a **finite-state automaton** over key characters (trie-like) → transformed into a **Levenshtein automaton**. Beyond that: classification/ML/information retrieval.

**Keeping everything in memory:**
- Disks tolerated because **durable** + cheaper/GB than RAM. As RAM gets cheaper → **in-memory databases**.
- Some (Memcached) are cache-only (OK to lose on restart). Durable in-memory DBs achieve durability via: special hardware (battery-backed RAM, rare), writing a **change log** to disk, periodic **snapshots**, or replication. On restart, reload from disk/replica.
- Counter-intuitive: speed advantage is **NOT** from avoiding disk reads (disk-based engines also serve from OS page cache). It's from **avoiding the overhead of encoding in-memory structures into a disk-writable form**.
- Also enable **data models hard to do on disk** (Redis: priority queues, sets).
- Vendors: VoltDB, MemSQL, Oracle TimesTen (relational); RAMCloud (durable KV, log-structured); Redis/Couchbase (weak durability, async disk writes).
- **Anti-caching**: extend in-memory architecture beyond RAM by evicting LRU data to disk, loading back on access (like OS virtual memory/swap, but DB works at record granularity, not page). Still requires indexes to fit in RAM.

### Transaction Processing vs. Analytics (OLTP vs OLAP)
- **Transaction** = group of reads+writes forming a logical unit. *Transaction processing* just means low-latency reads/writes (vs. periodic batch); needn't have ACID.
- **OLTP (online transaction processing)**: interactive, user-facing; look up small # records by key via index; insert/update from user input.
- **OLAP (online analytic processing)**: scan huge # records, compute aggregates (count/sum/avg) for business intelligence reports. Written by analysts.

**Table 3-1 — OLTP vs OLAP:**
| Property | OLTP | OLAP |
|---|---|---|
| Read pattern | small # records per query, by key | aggregate over large # records |
| Write pattern | random-access, low-latency, from user | bulk import (ETL) or event stream |
| Used by | end user via web app | internal analyst, decision support |
| Data represents | latest state (current point in time) | history of events over time |
| Dataset size | GB–TB | TB–PB |

- Late 1980s/early 1990s: companies stopped running analytics on OLTP systems → separate **data warehouse**.

**Data warehousing:**
- Separate read-only DB analysts can query freely without harming OLTP (which is HA, low-latency, business-critical; DBAs guard it from expensive ad-hoc scans).
- Contains read-only copy of data from all OLTP systems. Loaded via **ETL (Extract-Transform-Load)**: extract (periodic dump or continuous stream) → transform into analysis-friendly schema + clean → load.
- Advantage: optimize for analytic access patterns (OLTP indexing algorithms are bad at analytic queries). Common in large enterprises; rare in small companies (less data, fewer OLTP systems).
- Data model usually **relational** (SQL fits analytics). Internals diverge from OLTP though both expose SQL. Some products (MS SQL Server, SAP HANA) do both but with increasingly separate engines under a common SQL interface.
- Vendors: Teradata, Vertica, SAP HANA, ParAccel (Amazon RedShift = hosted ParAccel). SQL-on-Hadoop: Hive, Shark, Impala, Stinger, Presto, Tajo, Drill (some based on Google **Dremel**).

**Stars and snowflakes (analytic schemas):**
- **Star schema / dimensional modeling**: central **fact table** (each row = an event, e.g. one product purchased; captured as individual events for max analysis flexibility → fact tables huge, tens of PB at Apple/Walmart/eBay). Fact columns = attributes (price, cost) + FKs to **dimension tables** (who/what/where/when/how/why). Even date/time → dimension table (encode holidays etc.). "Star" = fact in center, dimensions radiating out.
- **Snowflake schema**: dimensions further broken into sub-dimensions (more normalized). Star usually preferred — simpler for analysts.
- Tables are very **wide**: fact tables often 100+ columns; dimension tables wide too.

### Column-oriented storage
- Problem: trillions of rows, PB of data in fact tables. Typical analytic query touches **4–5 of 100+ columns** (`SELECT *` rare). Row-oriented storage must load *all* columns of all matching rows from disk → slow.
- **Column-oriented storage**: store all values of each column together (each column in a separate file). Query reads only needed columns. Relies on **each column file storing rows in the same order** → reassemble row N = take Nth entry from each column file. Applies to non-relational too (**Parquet** = columnar for document model, based on Dremel).

**Column compression:**
- Column values often repetitive → compress well. **Bitmap encoding**: column with n distinct values → n bitmaps (one per distinct value, one bit per row; bit=1 if row has that value). Small n → one bit/row. Larger n / sparse → additionally **run-length encode** (very compact).
- Bitmap indexes great for warehouse queries:
  - `WHERE product_sk IN (30,68,69)`: bitwise **OR** of three bitmaps.
  - `WHERE product_sk=31 AND store_sk=3`: bitwise **AND** (works because columns share row order — kth bit = same row).

**Memory bandwidth & vectorized execution:**
- Big bottleneck for scans = disk→memory bandwidth, but also CPU efficiency: memory→CPU-cache bandwidth, branch misprediction, pipeline bubbles, **SIMD**.
- Columnar enables: load compressed column chunk into **L1 cache**, iterate in a tight loop (vs. per-record function calls/conditions); operators (AND/OR) operate on compressed chunks directly = **vectorized processing**.

**Sort order in column storage:**
- Order of rows can be imposed (like SSTables) as an index. **Must sort whole rows together** (not each column independently, or you'd lose row correspondence). DBA picks sort columns from common queries (e.g. `date_key` first → scan only recent dates; second sort key `product_sk` groups same-product-same-day).
- Sorting also **aids compression**: first sort column → long runs → run-length encode billions of rows down to a few KB. Effect strongest on first sort key; later keys more jumbled.
- **C-Store / Vertica**: store the same data **sorted several different ways** (data is replicated for fault-tolerance anyway → make redundant copies use different sort orders; query picks best-fitting version). Analogous to multiple secondary indexes in row stores — but column store has no pointers, only columns of values.

**Writing to column storage:**
- Optimizations (columnar, compression, sort) make **writes hard**: can't update-in-place compressed columns; inserting a row mid-sorted-table would rewrite all column files.
- Solution: **LSM-trees**. Writes → in-memory store (sorted), merged with on-disk column files in bulk (this is what Vertica does). Queries combine on-disk + in-memory; optimizer hides the distinction (inserts/updates/deletes immediately reflected).

**Aggregation: data cubes & materialized views:**
- **Materialized view**: actual on-disk copy of query results (vs. *virtual view* = a query shortcut expanded on the fly). Must be updated when underlying data changes → expensive writes → rare in OLTP, more sensible in read-heavy warehouses.
- **Data cube / OLAP cube**: grid of aggregates grouped by dimensions. e.g. 2D grid (date × product), each cell = SUM(net_price) for that date+product; aggregate along rows/columns for reduced summaries. Generalizes to n dimensions (hypercube).
- Advantage: certain queries become very fast (pre-computed). Disadvantage: less flexible (can't query dimensions not in the cube, e.g. "sales of items >$100"). Keep raw data; use cubes only as a perf boost.

### Ch 3 Summary
- Two broad categories: **OLTP** (user-facing, huge request volume, small # records/query, disk **seek time** bottleneck) and **analytics/warehouse** (low query volume, each scans millions of records, disk **bandwidth** bottleneck → columnar storage).
- OLTP two schools: **log-structured** (append-only, never update in place — Bitcask, SSTables, LSM-Trees, LevelDB, Cassandra, HBase, Lucene) and **update-in-place** (fixed-size overwritable pages — B-trees, all major relational + many non-relational). Log-structured key idea: turn random writes into sequential writes (higher throughput on HDD/SSD).
- For analytics: indexes less relevant (sequential scans); encode data compactly → **column-oriented storage**.

---

## Chapter 4 — Encoding and Evolution

- Apps change → stored data changes (new fields/record types). Relational = one schema in force at a time (changeable via migrations/`ALTER`). Schema-on-read = mix of old/new formats coexist.
- Code changes aren't instantaneous: **server-side = rolling upgrade** (staged rollout, few nodes at a time, no downtime, encourages frequent releases); **client-side = at user's mercy** (may not update).
- → Old and new code + old and new data formats **coexist**. Need compatibility both ways:
  - **Backward compatibility**: newer code can read data written by older code. (Easier — you know the old format.)
  - **Forward compatibility**: older code can read data written by newer code. (Trickier — old code must ignore newer additions.)

### Formats for Encoding Data
- Two representations: in-memory (objects/structs/lists with pointers, optimized for CPU) vs. byte sequence (self-contained, for file/network). Translation: **encoding / serialization / marshalling** (in-mem → bytes); **decoding / parsing / deserialization / unmarshalling** (reverse). (Note: "serialization" also means something different in transactions → book says "encoding". Encoding ≠ encryption.)

**Language-specific formats** (Java `Serializable`, Ruby `Marshal`, Python `pickle`, Kryo):
- Convenient but deeply problematic: **tied to one language** (lock-in, hard to integrate other orgs); **security** (decoding instantiates arbitrary classes → remote code execution — CWE-502); versioning/forward+backward compatibility often an afterthought; bad efficiency (Java built-in serialization notorious — slow + bloated). → use only for transient purposes.

**JSON, XML, CSV (textual):**
- Standardized, multi-language, widely supported (and disliked). XML = too verbose/complex; JSON popular via browser/JS support + simplicity; CSV less powerful.
- Subtle problems: **number ambiguity** — XML/CSV can't distinguish number vs. numeric string; JSON distinguishes string/number but not int/float and no precision (integers > 2^53 inaccurate in IEEE 754 double / JavaScript → Twitter returns tweet IDs as both number and decimal **string**). **No binary string support** (JSON/XML) → Base64 hack (+33% size). Optional schemas (XML Schema, JSON Schema) — powerful but complex; many JSON tools skip them. CSV has no schema, vague escaping (commas/newlines in values).
- Despite flaws, good enough for many purposes, esp. **data interchange between organizations** (agreeing on the format matters more than its prettiness/efficiency).

**Binary encodings:**
- For internal use (no lowest-common-denominator pressure) → more compact/faster. Matters at TB scale.
- Binary JSON variants (MessagePack, BSON, BJSON, UBJSON, BISON, Smile) and binary XML (WBXML, Fast Infoset) keep the JSON/XML data model → still must **embed all field names** in the data (no schema).
- **MessagePack** example: encodes `{userName, favoriteNumber, interests}` in **66 bytes** vs. **81 bytes** textual JSON (whitespace removed). First byte 0x83 = object with 3 fields; type+length packed into bytes; field name `userName` stored inline. Small saving — questionable vs. loss of human-readability.

**Thrift and Protocol Buffers** (binary, **schema-required**):
- Protocol Buffers (Google), Thrift (Facebook); both OSS 2007–08. Schema in an **IDL**; **code generation** produces classes per language.
- Thrift IDL: `struct Person { 1: required string userName, 2: optional i64 favoriteNumber, 3: optional list<string> interests }`.
- Protobuf: `message Person { required string user_name = 1; optional int64 favorite_number = 2; repeated string interests = 3; }`.
- Encoded record = concatenation of encoded fields; each field carries a **field tag** (the schema number) + datatype annotation — **no field names** in the data (tags are compact aliases).
- **Thrift BinaryProtocol = 59 bytes**; **Thrift CompactProtocol = 34 bytes** (packs field type+tag into one byte; **variable-length integers** — top bit = continuation; −64..63 in 1 byte, −8192..8191 in 2 bytes); **Protocol Buffers = 33 bytes** (similar bit-packing). (Thrift also has DenseProtocol (C++ only) + two JSON formats.)
- `required` vs `optional`: **no encoding difference**; `required` only enables a runtime presence check (useful for catching bugs).

**Field tags & schema evolution:**
- Each field identified by **tag number** + datatype; unset fields omitted. **Can rename a field** (data never refers to names) but **cannot change a tag** (invalidates existing data).
- **Add field**: give it a **new tag**. Old code reading new data ignores unknown tags (datatype annotation tells it how many bytes to skip) → **forward compatibility**. For **backward compatibility**, a newly added field **cannot be `required`** (old data wouldn't have it) → must be `optional` or have a **default value**.
- **Remove field**: only remove `optional` fields (never `required`); **never reuse the removed tag number** (old data may still carry it).
- **Change datatype**: maybe possible, risk of precision loss/truncation (e.g. 64-bit value read into 32-bit var truncates).
- Protobuf has **no list type** — uses `repeated` (same tag appears multiple times) → can safely change `optional` → `repeated` (old code reading new data sees last element; new code reading old sees 0-or-1 element). Thrift has a dedicated `list` type (supports **nested lists** but not the optional→repeated evolution).

**Avro** (Apache; 2009, Hadoop sub-project, because Thrift didn't fit Hadoop):
- Two schema languages: **Avro IDL** (human) + JSON-based (machine). Example IDL: `record Person { string userName; union { null, long } favoriteNumber = null; array<string> interests; }`.
- **No tag numbers** in the schema. Encodes example record in just **32 bytes** (most compact). Encoding = **values concatenated** with **nothing identifying fields or datatypes** (string = length-prefix + UTF-8; int = variable-length, like Thrift CompactProtocol). → can only decode if reader uses the **exact same schema** as writer (any mismatch = garbage).

**Writer's schema vs. reader's schema (Avro's key idea):**
- App encodes with its **writer's schema**; decodes expecting its **reader's schema**. They needn't be identical — only **compatible**. Avro library **resolves differences** by matching fields **by name** (writer-only field → ignored; reader-only field → filled with reader's declared **default value**). Field order doesn't matter.

**Avro schema evolution rules:**
- Forward compat = new schema (writer) + old schema (reader). Backward compat = new schema (reader) + old schema (writer).
- To maintain compatibility, **only add/remove a field that has a default value**. Add field w/o default → breaks backward compat. Remove field w/o default → breaks forward compat.
- `null` isn't a default for anything — must use a **union type** (`union { null, long }`), and `null` can only be the default if it's the **first branch** of the union. (Explicitness prevents bugs — "billion-dollar mistake.") → Avro has **no optional/required markers** (uses unions + defaults instead).
- Change datatype OK if Avro can convert. Rename field via **aliases** in reader's schema (backward but not forward compatible). Adding a union branch = backward but not forward compatible.

**How does the reader know the writer's schema?** (can't embed full schema per record — too big). Depends on context:
- **Large file, many records** (Hadoop): writer's schema once at file start (Avro **object container files**).
- **Database, individually-written records**: prefix each record with a **version number**; keep a list of schema versions in the DB; reader fetches the matching writer's schema (Espresso works this way).
- **Network connection**: negotiate schema version at connection setup (Avro RPC).
- A schema-version database is valuable: documentation + compatibility checking.

**Dynamically generated schemas** — Avro's edge over Thrift/Protobuf (no tag numbers):
- Dump a relational DB → generate an Avro schema from the relational schema (table→record, column→field by name). If DB schema changes (add/remove column), regenerate Avro schema; readers match by name → old reader's schema still works. Thrift/Protobuf would need **manual tag assignment** on every schema change.

**Code generation & dynamic languages:**
- Thrift/Protobuf rely on code generation — useful in **statically typed** languages (efficient in-mem structures, IDE type-checking/autocomplete). Pointless/frowned-upon in dynamic languages (JS/Ruby/Python). Avro offers **optional** code gen + works without it: an object container file is **self-describing** (embeds writer's schema) → open like a JSON file (great with Apache Pig).

**Merits of schemas:**
- Thrift/Protobuf/Avro schema languages simpler than XML/JSON Schema (no regex/range validation) → easier to implement, wide language support. Heritage: **ASN.1** (1984; tag-number evolution; DER still encodes X.509 SSL certs — but complex/poorly-documented). Most relational DBs use proprietary schema-based binary protocols (driver via ODBC/JDBC).
- Nice properties: **more compact** than binary-JSON (omit field names); schema = up-to-date **documentation** (required for decoding); schema DB enables **compatibility checks before deploy**; **code generation** for statically typed languages.
- → schema evolution gives schema-on-read flexibility **plus** better guarantees and tooling.

### Modes of Data Flow

**1. Via databases:**
- Writer encodes, reader decodes. Single process = "sending a message to your future self" → needs **backward compat**. Multiple processes (different apps, or instances during a rolling upgrade) → newer code may write, older code may read → **forward compat** also needed.
- **Snag**: old code reads a record (with a new field it doesn't know), updates, writes back → must **preserve the unknown field** (else it's lost). Encoding formats support this, but app-level care needed (decoding into model objects then re-encoding can drop unknown fields — Figure 4-7).
- **Data outlives code**: a value may be 5ms or 5yrs old; old data stays in original encoding unless rewritten. Rewriting/migrating large datasets is expensive → most DBs avoid it. Relational DBs allow adding a column with null default w/o rewriting (read fills null for missing). LinkedIn **Espresso** uses Avro for storage → uses Avro schema-evolution. Schema evolution makes the whole DB *appear* single-schema despite mixed historical encodings.
- **Archival storage**: snapshots/dumps written in the latest schema (copying anyway → encode consistently); immutable → Avro object container files fit well; good chance to use a column-oriented analytics format (**Parquet**).

**2. Via services: REST and RPC:**
- Client/server: server exposes an **API = service**; client makes requests. The web works this way (browsers → web servers via HTTP/URLs/SSL/HTML). Non-browser clients: native apps, JS via **XMLHttpRequest** (**Ajax**) → server returns data (JSON) not HTML. A server can also be a client to another service → decompose into **service-oriented architecture (SOA) / microservices**. Goal: independently deployable/evolvable services (each owned by one team, frequent releases) → old/new versions run simultaneously → **data encoding must be compatible across versions**.
- **Web service** = HTTP used to talk to a service (not only on the web). Three contexts: (1) client app → service over public internet; (2) service → service same org/datacenter (SOA/microservices, sometimes "middleware"); (3) service → service across orgs via internet (data exchange, public APIs, credit-card processing, OAuth).
- Two approaches:
  - **REST** = design philosophy on HTTP principles (simple data formats, URLs identify resources, use HTTP cache/auth/content-negotiation). Gaining popularity esp. cross-org + microservices. API following it = **RESTful**.
  - **SOAP** = XML-based protocol; aims to be HTTP-independent, avoids most HTTP features; huge complex **WS-\*** standards. API described in **WSDL** (RESTful equivalent ≈ **Swagger/OpenAPI**); WSDL enables code generation (good for statically typed langs). WSDL not human-readable, SOAP messages complex → heavy tool dependence; interoperability problems between vendors. Falling out of favor except in large enterprises.

**Remote Procedure Calls (RPC):**
- Lineage: EJB/Java RMI (Java only), DCOM (Microsoft), CORBA (complex, no fwd/bwd compat). RPC idea (since 1970s): make a remote call look like a local function (**location transparency**) — **fundamentally flawed** because a network request differs from a local call:
  - Local call predictable (succeeds/fails on your params); network call **unpredictable** (lost request/response, slow/unavailable remote) → must anticipate, **retry**.
  - Network call may **return without a result** (timeout) → you don't know if it happened.
  - **Retries** may duplicate the action (if only the response was lost) unless you build **idempotence/deduplication**.
  - Network latency **wildly variable** (sub-ms to many seconds).
  - Must **encode all parameters** into bytes (can't pass pointers/references) — problematic for large objects.
  - Client/server may be **different languages** → datatype translation issues (e.g. JS numbers > 2^53).
- → don't make a remote service look like a local object — it's fundamentally different. Part of REST's appeal: it doesn't hide that it's a network protocol.

**Current RPC directions:**
- Frameworks on each encoding: Thrift + Avro have RPC; **gRPC** = RPC over Protocol Buffers; **Finagle** uses Thrift; **Rest.li** uses JSON over HTTP. New gen is explicit about remote ≠ local: **futures/promises** (Finagle, Rest.li) encapsulate async-may-fail + parallel requests; gRPC supports **streams** (series of requests/responses). Some provide **service discovery** (find IP/port of a service).
- Custom binary RPC > JSON-over-REST on **performance**. But REST wins on: experimentation/debugging (curl/browser, no codegen), universal language/platform support, vast tooling ecosystem (caches, load balancers, proxies, firewalls, monitoring). → **REST predominant for public APIs**; RPC mainly intra-org, same datacenter.
- **RPC data encoding/evolution**: reasonable to assume **servers upgraded first, clients second** → need **backward compat on requests, forward compat on responses**. Compat inherited from encoding (Thrift/gRPC/Avro per their rules; SOAP via XML Schema w/ pitfalls; REST/JSON: adding optional request params + new response fields usually keeps compat). Cross-org RPC → provider can't force client upgrades → compat needed long/indefinitely → often **maintain multiple API versions** side-by-side. **API versioning**: version in URL, or HTTP `Accept` header, or per-API-key version stored server-side.

**3. Via asynchronous message passing** (between RPC and databases):
- Like RPC: message delivered to another process with low latency. Like databases: goes via an intermediary — a **message broker** (message queue / message-oriented middleware) that stores the message temporarily.
- Advantages over direct RPC: **buffer** if recipient unavailable/overloaded (reliability); **automatic redelivery** to crashed process (prevents loss); sender needn't know recipient's IP/port (good for ephemeral cloud VMs); **one message → many recipients**; **decouples** sender from recipient (publish, don't care who consumes).
- **One-way / asynchronous**: sender doesn't expect a reply (a reply, if any, goes on a separate channel) — send and forget.
- **Message brokers**: old = TIBCO, IBM WebSphere, webMethods; newer OSS = RabbitMQ, ActiveMQ, HornetQ, NATS, Apache Kafka. Usage: process sends to a named **queue/topic**; broker delivers to consumers/subscribers. Many producers + many consumers per topic; one-way data flow (a consumer can republish to another topic, or to a reply queue → request-response like RPC).
- Brokers don't enforce a data model — message = bytes + metadata → **any encoding**. Backward+forward compat → change publishers/consumers independently, deploy in any order. Preserve unknown fields when republishing (Figure 4-7 issue).

**Distributed actor frameworks:**
- **Actor model** = concurrency model: logic in **actors** (not threads); each actor processes one message at a time (no locks/race conditions), communicates via async messages; **delivery not guaranteed** (messages can be lost).
- **Distributed actor frameworks** scale this across nodes — same message-passing whether local or remote (transparently encoded over network). **Location transparency works better here than in RPC** because the actor model already assumes messages can be lost (even locally) → less local/remote mismatch. Still integrates a broker + actor model; rolling upgrades still need forward/backward compat.
- Three frameworks: **Akka** (default Java serialization = no compat; replaceable with Protobuf for rolling upgrades); **Orleans** (default custom encoding doesn't support rolling upgrade → set up new cluster, shift traffic, shut old down; custom serialization plugins available); **Erlang OTP** (hard to change record schemas despite HA focus; new `maps` type, Erlang R17/2014, may help).

### Ch 4 Summary
- Encoding details affect efficiency **and** app architecture / deployment options. **Rolling upgrades** (gradual deploy) → no-downtime releases, less risk, encourage frequent small releases → great for evolvability. → assume mixed versions running → all data must be **backward** (new code reads old data) + **forward** (old code reads new data) compatible.
- Formats: language-specific (single language, often no compat); textual (JSON/XML/CSV — widespread, compat depends on usage, vague on datatypes); binary schema-driven (Thrift/Protobuf/Avro — compact, clear compat semantics, schema = docs + codegen, but not human-readable).
- Dataflow modes: **databases** (writer encodes, reader decodes); **RPC/REST** (client encodes request, server decodes+encodes response, client decodes); **async message-passing** (broker/actors; sender encodes, recipient decodes).
- Conclusion: with care, backward/forward compat + rolling upgrades are very achievable.
