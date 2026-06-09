# DDIA — The Core

A high-signal study guide distilled from *Designing Data-Intensive Applications* (Martin Kleppmann). This is the essential core: precise definitions, the mechanisms underneath them, one worked example per concept, the core tradeoffs, and the rules of thumb. Built for system-design interviews and real engineering decisions — fuller than a cheat sheet, denser than the book.

> **Source coverage note:** Ch1–11 are distilled from the provided extraction of the book. **Ch12 was *not* in the source PDF**; a short clearly-labeled summary is included from general knowledge.

---

## How to use this guide — the depth contract

Every chapter follows the same skeleton, so you always know where to look:

1. **TL;DR** — the one-paragraph thesis.
2. **Definitions + mechanism** — each fact is given as *fact → how it works → why it matters* (2–4 sentences), not a bare bullet.
3. **Worked example(s)** — one concrete scenario you can trace end to end.
4. **Comparison table** — with a **"when it bites you"** column (the failure mode, not just the property).
5. **Tradeoffs / when to use.**
6. **Interview pitfalls** — the common wrong answers to *not* give.

Each Part ends with a **recap box** tying its chapters together. The guide closes with a **Decision Cheat-Sheet** and a **Flashcard Review** (the old one-liners, repositioned for final-night cramming).

Cross-references like *(see Ch9)* point you to where a concept recurs (MVCC in Ch3 & Ch7; fencing tokens in Ch8 & Ch9; CDC in Ch5 & Ch11; 2PL vs 2PC across Ch7 & Ch9).

---

## Table of Contents

**Part I — Foundations of Data Systems**
- [Ch1 — Reliable, Scalable, Maintainable Applications](#ch1--reliable-scalable-maintainable-applications)
- [Ch2 — Data Models and Query Languages](#ch2--data-models-and-query-languages)
- [Ch3 — Storage and Retrieval](#ch3--storage-and-retrieval)
- [Ch4 — Encoding and Evolution](#ch4--encoding-and-evolution)
- [Part I recap](#part-i-recap)

**Part II — Distributed Data**
- [Ch5 — Replication](#ch5--replication)
- [Ch6 — Partitioning](#ch6--partitioning)
- [Ch7 — Transactions](#ch7--transactions)
- [Ch8 — The Trouble with Distributed Systems](#ch8--the-trouble-with-distributed-systems)
- [Part II recap](#part-ii-recap)

**Part III — Derived Data**
- [Ch9 — Consistency and Consensus](#ch9--consistency-and-consensus)
- [Ch10 — Batch Processing](#ch10--batch-processing)
- [Ch11 — Stream Processing](#ch11--stream-processing)
- [Ch12 — The Future of Data Systems (not in PDF)](#ch12--the-future-of-data-systems-not-in-source-pdf)
- [Part III recap](#part-iii-recap)

**Synthesis**
- [Decision Cheat-Sheet](#decision-cheat-sheet)
- [Flashcard Review](#flashcard-review)

---

# Part I — Foundations of Data Systems

## Ch1 — Reliable, Scalable, Maintainable Applications

**TL;DR:** Modern apps are *data-intensive* — the bottleneck is the amount, complexity, and rate-of-change of data, not raw CPU. You stitch databases, caches, indexes, batch jobs, and streams into one composite system, which makes *you* the data-system designer responsible for its guarantees. The three pillars to reason about are **Reliability, Scalability, Maintainability**.

### The building blocks (and why you become the designer)

A data-intensive app is assembled from standard parts: **databases** (store and retrieve), **caches** (remember expensive results), **search indexes** (keyword/filter), **stream processing** (send a message to another process asynchronously), and **batch processing** (periodically crunch accumulated data). The boundaries between these categories are blurring — Redis is a datastore people use as a message queue, and Kafka is a message queue with database-like durability. Because no single tool covers all your access patterns, you wire several specialized systems together in application code, and *you* — not any one vendor — become responsible for the guarantees of the whole (e.g. keeping the cache consistent with the database on writes). That responsibility is the reason this book exists.

### Reliability — "continuing to work correctly even when things go wrong"

- **Fault vs failure.** A *fault* is one component deviating from spec; a *failure* is the whole system stopping its service to users. You cannot drive fault probability to zero, so the goal is **fault tolerance**: design so faults don't cascade into failures. The discipline is building a reliable system from unreliable parts.
- **Deliberately induce faults** (Netflix Chaos Monkey kills random processes) so the fault-tolerance machinery is exercised continuously — many of the worst bugs live in untested error-handling paths, which only run during a real incident.
- **Prefer tolerating faults over preventing them — except where there is no cure.** A leaked secret cannot be un-leaked, so security faults must be *prevented*; a crashed node can be tolerated, so it should be.
- **Fault types:**
  - **Hardware faults** are mostly random and independent. A disk's MTTF is ~10–50 years, so a 10,000-disk cluster expects ~1 disk death per day. The classic mitigation is hardware redundancy (RAID, dual PSUs); the modern trend adds software fault-tolerance that survives the loss of a whole machine (cloud VMs can vanish without warning), which also enables patching one node at a time without full-system downtime.
  - **Software errors (systematic faults)** are correlated across nodes — the same bad assumption is baked into every copy of the code — so they cause far more failures than hardware. They lie dormant until a usually-true assumption breaks (the Linux kernel leap-second bug on 30 June 2012). Mitigate with testing, process isolation, crash-and-restart, production monitoring, and self-checking invariants (e.g. a queue asserting #in == #out).
  - **Human errors** are the leading cause of outages; hardware faults are only ~10–25%. Mitigate with well-designed abstractions and admin APIs (easy to do the right thing), sandboxes that decouple the place people err from the place that causes failure, fast recovery (quick config rollback, gradual rollout), detailed telemetry, and training.

### Scalability — coping with increased load

Scalability is not a 1-D label ("X is scalable" is meaningless). The real question is: *if the system grows in a particular way, what are our options for coping?*

- **Load parameters** describe load for *your* architecture: requests/sec, read:write ratio, active users, cache hit rate, fan-out.
- **Latency vs response time** (a precise distinction interviewers probe): *response time* is what the client sees = service time + network delays + queueing delays. *Latency* is the narrower duration a request spends *latent*, waiting to be handled. You optimize response time; queueing is often the dominant term.

**Worked example — Twitter's fan-out (Nov 2012).** Tweets are posted at ~4.6k/s (12k/s peak), but home timelines are read at ~300k/s. The hard problem is *fan-out*, not write volume.
- *Approach 1:* store every tweet in one global collection; build a timeline at read time by joining follows → users → tweets and merging by time. Cheap writes, expensive reads.
- *Approach 2:* keep a per-user precomputed home-timeline cache (a "mailbox"); on each post, fan out into every follower's cache. Cheap reads, expensive writes — 4.6k tweets/s × ~75 followers ≈ 345k cache writes/s on average, and a celebrity with 30M+ followers triggers 30M+ writes for one tweet (target delivery < 5s).
- Twitter moved 1 → 2 because reads outnumber writes by ~2 orders of magnitude, then went **hybrid**: ordinary users are fanned out on write; celebrity tweets are merged at read time. The key load parameter turned out to be the *distribution of followers per user*, weighted by tweet rate.

**Performance is a distribution, not a number.** Use percentiles. **p50 = median = "typical."** The **tail (p95/p99/p999)** matters because the slowest requests often hit your most valuable customers (they have the most data). Amazon found **+100 ms response time ≈ −1% sales**, and a 1 s slowdown cut a satisfaction metric by 16%; but optimizing p99.99 is usually too expensive (it's dominated by random events with diminishing returns). SLOs/SLAs are stated in percentiles. The tail is driven by **queueing delay** and **head-of-line blocking** (a server handles only a few requests in parallel, so a few slow ones back up the rest), so measure on the **client side**. Watch for **tail latency amplification**: one user request fans out to many backend calls and waits for the slowest, so the more backends you touch, the higher the fraction of slow user requests. Percentiles are computed with rolling windows and approximation algorithms (**forward decay, t-digest, HdrHistogram**); to aggregate across machines you **add the histograms** — *averaging percentiles is mathematically meaningless*.

**Scaling.** *Scale up (vertical)* = a bigger machine; *scale out (horizontal / shared-nothing)* = distribute across many. Good architectures mix both; a few powerful machines are often simpler and cheaper than many tiny ones. *Elastic* systems auto-add resources on detected load (good for unpredictable spikes); *manually-scaled* systems are simpler with fewer surprises. Stateless services distribute easily; stateful data systems are hard, so the common wisdom is to keep the DB on one node until cost or HA forces distribution. **There is no magic scaling sauce** — scalable architectures are application-specific, built around the assumption of which operations are common.

### Maintainability — most cost is ongoing, not initial development

- **Operability:** make it easy to keep running — monitoring/visibility, automation and standard-tool integration, good defaults with override freedom, predictable behavior, and an operational model ("if I do X, Y happens").
- **Simplicity:** manage complexity by removing **accidental complexity** (complexity from the implementation, not inherent to the problem). The best weapon is **abstraction** — SQL hides on-disk structures, concurrency control, and crash recovery behind one clean interface that improves for everyone at once.
- **Evolvability:** make change easy, because requirements never stop shifting. This book is about agility at the *data-system* level.

> **Interview pitfalls (Ch1):** Don't say "X is scalable" — name the load parameter and the growth direction. Don't quote a *mean* latency — interviewers want percentiles and the tail. Don't conflate latency with response time. Don't claim hardware redundancy is the main reliability lever — human error dominates outages.

---

## Ch2 — Data Models and Query Languages

**TL;DR:** Data models shape both how you build software and how you think about the problem. Apps are built in *layers* of models, each hiding the one below. The big three general-purpose models are relational, document, and graph — document fits tree-like one-to-many data, relational fits many-to-one/many-to-many, and graph fits "anything related to everything."

### The layered-model idea (the spine of the chapter)

Every application stacks models: the real world → application objects and APIs → a general-purpose model (JSON / relational / graph) → bytes on disk → electrical signals. Each layer exposes a clean model and hides the complexity of the layer below, and each model bakes in assumptions about usage (some operations are fast, others awkward). Choosing a data model is choosing which operations will be easy in your domain.

### Relational vs document

- **Relational** (Codd, 1970): data lives in *relations* (tables) of *tuples* (rows); the model hides the internal representation behind a clean interface. The **NoSQL** wave (2009) was driven by demand for scalability, a preference for open-source, queries relational DBs serve poorly, and frustration with rigid schemas. The likely long-term outcome is **polyglot persistence** — relational and non-relational coexisting.
- **Object-relational impedance mismatch:** OOP objects don't map cleanly to tables, requiring an awkward translation layer; ORMs (Hibernate, ActiveRecord) reduce the boilerplate but don't remove the gap.

**Worked example — the LinkedIn résumé (one-to-many).** A résumé has one user with many positions, many education entries, and contact info. You can model this three ways: normalized separate tables joined by foreign keys; structured column types; or a single **JSON document**. JSON wins here because the one-to-many structure forms a tree that you load all at once — it has **locality** (one read instead of a multi-way join), and its shape matches the application object.

- **Normalization needs many-to-one relationships.** Store an *ID* rather than duplicated human-meaningful text: an ID has no meaning so it *never needs to change*, whereas duplicated text (a region name, a company name) must be updated everywhere if it changes, risking write overhead and inconsistency. Many-to-one and many-to-many relationships are exactly what documents handle poorly — document joins are weak or absent, so you emulate them with multiple queries in application code. Because data tends to become *more interconnected* over time (companies and schools become entities you want to link to), the document model loses appeal as an app matures.

**Are document DBs repeating history?** The 1970s hierarchical **IMS** had the identical limitation — great for one-to-many, bad for many-to-many, no joins. Two solutions emerged: **relational** (won) and **network/CODASYL** (faded). CODASYL required the programmer to follow a hand-coded *access path* from a root record (like navigating a linked list), which made the best use of 1970s hardware but made queries fragile — changing an access path meant rewriting code. The relational **query optimizer** breaks this: it chooses access paths automatically, built *once* so all applications benefit, and you can declare a new index and have queries use it with no rewrites. Document DBs reverted to hierarchical *nesting* but resolve cross-document relationships by ID (like foreign keys) — they did **not** repeat CODASYL's access-path mistake.

| | Document | Relational | When it bites you |
|---|---|---|---|
| Schema | schema-on-read (implicit) | schema-on-write (enforced) | document: a buggy writer silently introduces a malformed shape that only crashes the *reader* months later |
| Locality | strong (whole doc) | weaker (shredded across tables) | document: the DB loads the *entire* doc for a tiny field → large docs make every read expensive |
| Many-to-one / many-to-many | awkward (weak joins) | strong (joins) | document: as data interconnects, app code fills with manual join logic that's slow and racy |
| Format change | write new docs, handle old in code | `ALTER TABLE` | relational: MySQL may copy the whole table → minutes/hours of downtime on a large table |

- **Schema-on-read vs schema-on-write** is the database analogue of dynamic vs static type checking. Schema-on-read wins for *heterogeneous* data (many object types, or structure set by an external system you don't control); schema-on-write wins when records share a structure, giving you documentation plus enforcement.
- **Locality is not unique to documents.** Google **Spanner** interleaves child rows within a parent table, Oracle has multi-table index cluster tables, and Bigtable-family stores (Cassandra, HBase) use **column families** — all give document-like locality inside a relational model.
- **Convergence:** relational DBs added JSON/XML support (PostgreSQL 9.3+) and document DBs added joins (RethinkDB) — a **hybrid relational+document model is a good route**.

### Query languages

- **Declarative (SQL)** specifies the *pattern* of the results, not the steps — so the optimizer picks indexes, join methods, and order, hides internals (it can reorganize storage without breaking your query), and parallelizes well across CPU cores. **Imperative (CODASYL via COBOL)** specifies exact operations in exact order, which is hard to optimize and hard to parallelize because the order is fixed. The web analogy: CSS and XPath are declarative (the browser auto-applies and auto-removes `li.selected > p`) while imperative JavaScript DOM manipulation is verbose, buggy, and hard to optimize.
- **MapReduce** is in between: you supply `map` (emit key-value pairs per record) and `reduce` (fold per key), both of which must be **pure functions** so the framework can run them anywhere, in any order, and re-run them on failure. MongoDB later added a *declarative* **aggregation pipeline** (`$match`, `$group`, `$sum`) — the moral being that a NoSQL system may accidentally reinvent SQL.

### Graph models — "anything related to everything"

Graphs (social networks, the web graph, road networks) are vertices + edges, both with properties, and are great for **evolvability** because you extend them by adding edge types. Two families:

- **Property graph** (Neo4j): a vertex holds {id, outgoing edges, incoming edges, properties}; an edge holds {id, tail vertex, head vertex, label, properties}. You can model it as two relational tables (`vertices`, `edges`) and index both `tail_vertex` and `head_vertex` to traverse in both directions. Query with **Cypher**: `(idaho)-[:WITHIN]->(usa)`, and the variable-length path `()-[:WITHIN*0..]->()` means "follow `WITHIN` zero-or-more times" (like a regex `*`). Doing the same in SQL needs a `WITH RECURSIVE` common table expression — about 29 lines versus 4 in Cypher — because graph queries need a *variable* number of joins.

- **Triple-store** (Datomic): every fact is a 3-tuple **(subject, predicate, object)**. The clever duality: the *object* is either a primitive value — in which case (predicate, object) is a *property* (e.g. `(lucy, age, 33)`) — or another vertex — in which case the predicate is an *edge label* (e.g. `(lucy, marriedTo, alain)`). That single rule covers both properties and relationships, which is why triples are equivalent to a property graph. **Turtle** is the readable triple format; **SPARQL** is the query language (it predates and inspired Cypher's pattern matching, and is even more concise). The **RDF / semantic web** vision was over-hyped in the early 2000s, but triples remain a fine internal model.

- **Datalog** (a subset of Prolog) writes a triple as `predicate(subject, object)` and lets you define **rules** of the form `head :- body` — the rule fires when every predicate on the right matches (uppercase tokens are variables). Rules can recurse and compose, so a `within_recursive` rule can be reused by other rules; this makes Datalog clumsy for one-off queries but powerful for complex, composable ones.

A graph DB is **not** CODASYL: any vertex can connect to any vertex (no schema restriction), you can access a vertex directly by ID or property index (no forced access path), there is no required ordering, and queries are declarative.

> **Interview pitfalls (Ch2):** Don't call document DBs "schemaless" — they're schema-*on-read*; the reader still assumes a structure. Don't claim document beats relational for joins — it's the reverse. Don't confuse a graph DB with CODASYL. Don't forget that "locality" is achievable in relational systems too (column families, interleaving).

---

## Ch3 — Storage and Retrieval

**TL;DR:** Two workload divides drive everything — **OLTP** (transactional, key lookups, *seek-bound*) vs **OLAP** (analytic, big scans, *bandwidth-bound*) — and two OLTP storage families — **log-structured (LSM)** vs **page-oriented (B-trees)**. For analytics, **column-oriented storage** dominates. An index is a derived structure that speeds reads but slows every write, so you choose indexes per query pattern rather than indexing everything.

### The world's simplest database (the on-ramp)

Start with the simplest possible storage engine. `db_set key value` appends `key,value` to a text file; `db_get key` scans the whole file and returns the *last* occurrence. Writes are blazing fast because appending to a file is *sequential*. But `db_get` is O(n) — it reads the entire file every time — which is hopeless at scale. The fix is an **index**: an extra structure derived from the primary data that speeds reads. The fundamental trade-off appears immediately: a well-chosen index speeds reads, but *every* index slows writes (it must be updated on each write), which is why databases don't index everything by default — you choose indexes from knowledge of the query patterns.

### Hash indexes (Bitcask)

Keep an **in-memory hash map** of key → byte-offset in the append-only data file. On write, append the value and update the map; on read, look up the offset, seek, and read. This is essentially **Bitcask** (Riak's default engine), and it's excellent when there are *many writes per key but few distinct keys* (e.g. a URL → play-count counter) — but it *requires all keys to fit in RAM*. To stop the file growing without bound, break it into **segments** and run **compaction**: throw away duplicate keys, keeping only the most recent value per key, merging immutable segments in the background into a fresh file before atomically switching reads over.

Real-world mechanism details (the parts interviews drill):
- **Format:** length-prefixed binary records (no escaping needed).
- **Deletion:** append a **tombstone** record that tells compaction to discard prior values for that key.
- **Crash recovery:** Bitcask snapshots each segment's hash map to disk, so on restart it reloads the map instead of re-scanning every segment.
- **Partial writes:** detected with checksums and discarded.
- **Concurrency:** a single writer thread (segments are append-only and immutable), with many concurrent readers.
- **Why append-only is good:** sequential writes vastly outpace random writes on *both* HDDs and SSDs; crash recovery is simpler (no half-overwritten values); and merging cures fragmentation.

**Limitations:** keys must fit in memory (on-disk hash maps perform badly — random I/O, costly resizing), and **range queries are inefficient** because you must look up each key individually.

### SSTables and LSM-trees

An **SSTable (Sorted String Table)** is a segment whose key-value pairs are **sorted by key**, with each key appearing once per merged segment. Sorting buys three things:
1. **Efficient merging** (mergesort-style, side-by-side) even when the data is larger than RAM — when merging two segments, keep the value from the more recent one.
2. A **sparse in-memory index** suffices — you store one key every few KB. To find `handiwork`, jump to the known offset of `handbag` and scan forward, since the file is sorted. *(Worked: the index has `handbag → offset 100000` and `handsome → offset 104000`; `handiwork` falls between, so you seek to 100000 and scan a few KB.)*
3. **Block compression** — group records into a block and compress it before writing; the sparse index points at block boundaries. This trades CPU for I/O, which is a win because disk bandwidth is scarcer than CPU.

To produce sorted writes from an unsorted stream, keep an in-memory balanced tree (the **memtable**, e.g. red-black). The flow:
- Write → insert into the memtable.
- When the memtable exceeds a threshold (a few MB) → flush it as a new SSTable; reset the memtable.
- Read → check the memtable, then the newest on-disk segment, then older segments.
- A background **merge + compaction** combines segments and discards overwritten/deleted keys.
- A separate **append-only write-ahead log** records each write so the memtable can be restored after a crash; it's discarded once the memtable is flushed.

This is the **LSM-tree** (Log-Structured Merge-tree), used by LevelDB, RocksDB, Cassandra, and HBase (the Google **Bigtable** lineage, which coined "SSTable" and "memtable"); Lucene uses the same idea for its term dictionary. Lookups for *missing* keys are slow (you check the memtable and every segment), so a **Bloom filter** approximates set membership and tells you a key is *definitely absent* so you can skip the disk reads. LSM strengths: handles data far larger than memory, efficient range queries (sorted), and high write throughput (sequential writes).

### B-trees

The B-tree is the most widely used index — standard in nearly every relational DB. Like SSTables it keeps keys sorted, but it uses **fixed-size pages** (traditionally **4 KB**) read and written one at a time, matching the hardware. A page is the **root** holding *k* keys and *k+1* child references, each child responsible for a continuous key range; you descend until a **leaf** page. The **branching factor** (children per page) is typically in the hundreds — though it depends on page size and key size — giving height O(log n).

The defining contrast with LSM is **update-in-place**: B-trees overwrite pages where they sit, whereas LSM only appends. Some operations overwrite several pages at once (a page split rewrites two children plus the parent), so a crash mid-way can corrupt the index — hence a **write-ahead log (WAL / redo log)**, an append-only file written *before* the tree pages are modified, used to restore consistency on recovery. In-place updates also need **latches** (lightweight locks) for concurrency. Optimizations include **copy-on-write** (LMDB writes a modified page to a new location, also enabling snapshots — *see Ch7 MVCC*), key abbreviation in interior pages (B+ trees), sequential leaf layout, and sibling pointers for range scans.

| | LSM-tree | B-tree | When it bites you |
|---|---|---|---|
| Writes | faster (random → sequential) | slower (in-place + WAL) | B-tree: write-heavy workloads pay WAL + page + split write amplification |
| Reads | check multiple structures (Bloom helps) | key in one place, predictable | LSM: a read may probe the memtable + every segment |
| Latency predictability | compaction can spike the tail | more predictable | LSM: under write-heavy load, compaction *starves* reads → tail-latency spikes |
| Transactions / locking | copies live in several segments | key in exactly one place | LSM: range locks are awkward; B-tree attaches range locks directly to the tree |
| Space | more compact | more fragmentation | B-tree: leaves partial pages and fragmentation over time |
| Rule | **benchmark with your workload** | | a benchmark on someone else's workload tells you nothing |

### Other indexing structures

- **Secondary indexes** are non-unique; the index value is a *postings list* of matching row IDs (or the row ID is appended to the key). The indexed entry can store the actual row, or a reference to a **heap file** — rows stored in no particular order, referenced by *all* secondary indexes so the row isn't duplicated per index. A **clustered index** stores the row directly in the index (MySQL InnoDB's primary key); a **covering index** stores *some* columns so a query can be answered "from the index alone."
- **Multi-column:** a **concatenated index** on (lastname, firstname) works like a phone book — useful for lastname or lastname+firstname, but *useless for firstname alone*. **Multi-dimensional** indexes (geospatial 2D range on lat AND long) can't be served by a plain B-tree (it narrows one dimension); use a space-filling curve into a 1D B-tree, or **R-trees** (PostGIS).
- **Fuzzy** indexes (Lucene) search within an edit distance using a Levenshtein automaton over the term dictionary.
- **In-memory DBs** (VoltDB, Redis) get durability from a change log, periodic snapshots, or replication. The counter-intuitive point: their speed comes **not** from avoiding disk *reads* (disk engines also serve from the OS page cache) but from **avoiding the cost of encoding in-memory data structures into a disk-writable form**. **Anti-caching** extends them past RAM by evicting LRU records to disk at record granularity.

### OLTP vs OLAP

| Property | OLTP | OLAP | 
|---|---|---|
| Read | few records, by key (via index) | aggregate over many records |
| Write | random-access, low-latency, from user | bulk import (ETL) / event stream |
| Used by | end users via app | analysts, decision support |
| Data | latest state | history of events over time |
| Size | GB–TB | TB–PB |
| Bottleneck | disk **seek time** | disk **bandwidth** |

A **data warehouse** is a separate read-only copy loaded via **ETL (Extract–Transform–Load)**, so expensive analytic scans never touch the business-critical OLTP system. It's usually relational (SQL fits analytics) but its internals diverge from OLTP. The dominant schema is the **star schema**: a central **fact table** where one row = one event (e.g. *one product purchased* — captured as individual events for maximum analysis flexibility, which makes fact tables enormous), surrounded by **dimension tables** answering who/what/where/when/how/why. Even *date* is a dimension (so you can encode holidays). The **snowflake** schema normalizes dimensions further but is usually avoided because the star is simpler for analysts. Tables are very wide — fact tables often have 100+ columns.

### Column-oriented storage

Analytic queries touch ~4–5 of those 100+ columns, but a row store must load *all* columns of every matching row. **Column-oriented storage** stores each column's values together in a separate file, relying on every column file storing rows in the *same order* so row N is the Nth entry in each file. This pays off three ways:
- **Compression** — values within a column repeat, so **bitmap encoding** (one bitmap per distinct value, one bit per row) plus run-length encoding makes them tiny. `WHERE product_sk IN (30,68,69)` becomes a bitwise OR of three bitmaps; `WHERE product_sk=31 AND store_sk=3` a bitwise AND (correct because the columns share row order).
- **Vectorized execution** — load a compressed column chunk into L1 cache and iterate in a tight loop over the whole chunk (operating on compressed data directly), avoiding per-record function calls and branch mispredictions.
- **Sort order** is imposed on *whole rows* (you can't sort columns independently, or you'd lose row correspondence). The first sort column produces long runs that run-length-encode billions of rows down to a few KB, and acts as an index. C-Store/Vertica store the same data sorted *several different ways* (the redundant replicas needed for fault tolerance carry different sort orders; the query picks the best fit).

Writes are hard (you can't update compressed sorted columns in place), so column stores use an **LSM** approach: buffer writes in an in-memory store, merge into the column files in bulk. **Materialized views** and **data cubes** pre-aggregate for speed but cost flexibility — keep the raw data and use cubes only as a boost.

> **Interview pitfalls (Ch3):** Don't say in-memory DBs are fast because they "skip the disk" — they skip the *encode-to-disk-format* step. Don't claim LSM is strictly better than B-trees (or vice versa) — it's workload-dependent; *benchmark*. Don't propose a concatenated (lastname, firstname) index to serve firstname-only queries. Don't reach for column storage in an OLTP path — it's for scan-heavy analytics.

---

## Ch4 — Encoding and Evolution

**TL;DR:** Code and data formats evolve, and old/new versions coexist — rolling upgrades server-side, lagging clients on the edge. You therefore need **backward compatibility** (new code reads old data — easy, you know the old format) *and* **forward compatibility** (old code reads new data — trickier, old code must ignore additions). Schema-driven binary encodings (Avro/Thrift/Protobuf) give compactness *plus* clean evolution semantics.

### Why both directions matter

Code doesn't change instantaneously: server-side you do a **rolling upgrade** (a few nodes at a time, no downtime), and client-side you're at the user's mercy (they may never update). So old and new code, reading old and new data, all coexist — which is why both compatibility directions are required.

**Encoding/serialization** turns in-memory objects into a byte sequence; **decoding/parsing** reverses it.
- **Language-specific** formats (Java `Serializable`, Python `pickle`) are convenient but bad: language lock-in, a serious **security** hole (decoding can instantiate arbitrary classes → remote code execution, CWE-502), versioning as an afterthought, and poor efficiency. Use only transiently.
- **Textual (JSON/XML/CSV)** are standardized and multi-language, which makes them ideal for **cross-organization interchange** (agreeing on the format matters more than its efficiency). Their problems: number ambiguity (integers above 2^53 lose precision in JSON/JavaScript doubles — Twitter returns tweet IDs as strings too), no binary-string support (Base64, +33% size), and weak/optional schemas.

### The byte-size progression (this one table teaches the chapter)

Encoding the same record `{userName, favoriteNumber, interests}`:

| Encoding | Bytes | Why it shrinks |
|---|---|---|
| Textual JSON (whitespace removed) | 81 | baseline — field names + punctuation as text |
| MessagePack (binary JSON) | 66 | drop whitespace/punctuation; pack type+length into bytes; **field names still embedded** |
| Thrift BinaryProtocol | 59 | replace field *names* with numeric **field tags** |
| Thrift CompactProtocol | 34 | pack field type+tag into one byte; **variable-length integers** |
| Protocol Buffers | 33 | same bit-packing as Thrift Compact |
| Avro | 32 | **drop tags entirely** — just concatenated values, schema resolves them |

The mechanism behind the small sizes is **variable-length integers**: the top bit of each byte is a *continuation* flag, so small numbers (−64..63) fit in one byte and only large numbers spend more. Each step removes redundancy: whitespace → field names → fixed-width type/tag bytes → fixed-width integers → and finally the tags themselves.

### Thrift / Protocol Buffers

The schema lives in an **IDL** and is compiled (**code generation**) into classes. Each field carries a numeric **field tag** plus a type annotation — there are *no field names in the data*, which is what makes the tag a compact alias. `required` vs `optional` makes **no encoding difference**; `required` only adds a runtime presence check. Protobuf has no list type — it uses `repeated` (the same tag appears multiple times), which enables the safe `optional → repeated` evolution.

**Evolution rules:** you may **rename** a field (data refers to tags, not names) but you may **never change a tag**. **Add** a field with a *new* tag; for backward compatibility it can't be `required` (old data lacks it), so it must be optional or have a default — and old code reading new data uses the type annotation to skip unknown tags (forward compatibility). **Remove** only optional fields, and **never reuse a tag number**.

### Avro

Avro has **no tag numbers**. The encoding is just concatenated values with *nothing* identifying fields or types, so you can only decode it with the exact schema used to write it. Avro's key idea is reconciling a **writer's schema** (what the data was written with) against a **reader's schema** (what the reader expects): the library matches fields **by name**, ignoring a writer-only field and filling a reader-only field with its declared default. Field order doesn't matter.

**Evolution rules:** to stay compatible you may only **add or remove a field that has a default value** (adding one without a default breaks backward compat; removing one without a default breaks forward compat). `null` is not a default for anything — you must use a **union type** `union { null, long }`, and `null` may only be the default if it's the *first* branch. Avro's lack of tag numbers is exactly why it shines for **dynamically generated schemas** — you can dump a relational schema to an Avro schema (table → record, column → field by name) and regenerate it on every DB schema change without hand-assigning tags, whereas Thrift/Protobuf would need manual tag assignment each time.

The reader learns the writer's schema from context: once per file (Avro object container files for Hadoop), via a per-record **version number** plus a schema registry (LinkedIn Espresso), or by negotiation at connection setup (RPC).

### Modes of dataflow

1. **Via databases.** The writer encodes, a later reader decodes — possibly years later, since **data outlives code**. The classic snag: old code reads a record containing a new field it doesn't understand, updates it, and writes it back — it must **preserve the unknown field**, but naively decoding into a model object and re-encoding can drop it. Schema evolution makes a database full of mixed historical encodings *appear* to have a single schema.

2. **Via services (REST/RPC).** **REST** is a design philosophy on HTTP (URLs as resources, HTTP caching/auth/content-negotiation) and dominates public APIs; **SOAP** is a heavy XML WS-* stack falling out of favor. **RPC** tries to make a remote call look local (*location transparency*), which is fundamentally flawed: a network call is unpredictable, may return without a result (a timeout — did it happen?), may duplicate the action on retry (so you need **idempotence**), has wildly variable latency, and must encode all parameters. Modern RPC (gRPC over Protobuf, Finagle, Rest.li) is explicit that remote ≠ local, using futures and streams. The compatibility assumption is that **servers upgrade first**, so you need backward-compat requests and forward-compat responses; cross-org APIs keep **multiple versions** live because the provider can't force clients to upgrade.

3. **Via asynchronous message passing (brokers).** A producer sends to a named topic; the broker (RabbitMQ, ActiveMQ, **Kafka**) buffers and delivers to consumers. Advantages over direct RPC: it buffers if the recipient is down, redelivers to crashed consumers, decouples sender from recipient (the sender needn't know who consumes), and supports one-to-many. It's one-way / fire-and-forget; brokers don't enforce a data model, so any encoding works (preserve unknown fields when republishing). The **actor model** gets location transparency to work better here than RPC precisely because it already assumes messages can be lost.

> **Interview pitfalls (Ch4):** Don't swap "backward" and "forward" compatibility — backward = *new code reads old data*. Don't claim `required`/`optional` change the bytes (they don't — it's a runtime check). Don't ever reuse a Protobuf/Thrift tag number. Don't say RPC makes remote calls "just like local calls" — naming that flaw is the point.

---

<a name="part-i-recap"></a>
### Part I recap

- **Reliability, scalability, maintainability** are the three lenses; load is multi-dimensional (name the parameter), performance is a *distribution* (percentiles, not means), and most cost is *ongoing maintenance*.
- **Data models are layered** and domain-specific: document for tree-like one-to-many, relational for many-to-one/many-to-many, graph for highly interconnected data — and they're converging.
- **Storage splits two ways:** log-structured (LSM, write-optimized, sequential) vs page-oriented (B-tree, in-place, predictable reads) for OLTP; column-oriented for OLAP scans. Indexes speed reads but tax every write.
- **Encoding is an architecture decision:** rolling upgrades demand backward *and* forward compatibility; schema-driven binary formats (Avro/Thrift/Protobuf) give compactness plus clean evolution.

---

# Part II — Distributed Data

There are two reasons to spread data across nodes: **replication** (keep copies on several nodes → availability, lower latency via geo-proximity, read scaling) and **partitioning/sharding** (split the data → scale beyond one machine). They are separate mechanisms that usually combine — each partition is replicated across several nodes, and a node can be leader for some partitions and follower for others. The baseline assumption is **shared-nothing**: each machine has its own CPU/RAM/disk and communicates only over the network.

## Ch5 — Replication

**TL;DR:** Three strategies cover almost everything — **single-leader, multi-leader, leaderless**. Replication is easy if data never changes; all the difficulty is handling *changes*. The synchronous/asynchronous choice profoundly shapes fault behavior, and async + failover can silently lose committed writes.

### Single-leader (master–slave)

One replica is the **leader**; all writes go to it and are written to its local storage first. **Followers** receive the change via a **replication log** and apply writes **in the same order**. Reads go to the leader or any follower; writes only to the leader. Used by PostgreSQL, MySQL, Oracle Data Guard, MongoDB, and message brokers (Kafka).

| Mode | Pro | Con / when it bites you |
|---|---|---|
| **Synchronous** | follower guaranteed up-to-date and durable | one slow follower blocks *all* writes |
| **Asynchronous** | leader unaffected by lagging followers | unreplicated confirmed writes are *lost* if the leader dies |
| **Semi-synchronous** | ≥2 up-to-date nodes guaranteed | a balance; if the sync follower lags, an async one is promoted to sync |

- **Read-scaling architecture:** a read-heavy web workload uses many followers to serve reads — but this is only realistic with **asynchronous** replication, because synchronous-to-all would make a single follower outage halt the system. The trade is stale follower reads.
- **New followers** are added without downtime: take a consistent snapshot tied to an exact log position (PostgreSQL LSN, MySQL binlog coords), copy it, then stream all changes since that position until caught up.
- **Outages.** A follower recovers easily via **catch-up recovery** (replay the log since its last processed transaction). A leader failure requires **failover**, which is hard: *detect* the failure (usually a timeout, no foolproof method), *choose* the most up-to-date follower (itself a **consensus** problem — *see Ch9*), and *reconfigure* clients. Failover hazards: with async replication the new leader may be **missing recent writes**, usually discarded — the **GitHub incident** promoted a stale follower whose auto-increment counter lagged, reusing primary keys already handed out by Redis and disclosing private data. **Split brain** (two leaders both accepting writes) corrupts data, so systems use fencing/STONITH. And timeout tuning is a trap: too short causes false failovers that worsen an already-struggling system. Many teams therefore prefer **manual** failover.
- **Replication-log implementations:** *statement-based* breaks on nondeterminism (`NOW()`, auto-increment); *WAL shipping* is low-level and couples the storage engine, blocking zero-downtime version upgrades; *logical/row-based* is decoupled and enables **CDC** (*see Ch11*); *trigger-based* is flexible but heavier.

### Replication lag → eventual consistency

Reading async followers yields stale data — **eventual consistency**, where "eventually" is deliberately vague (usually sub-second, but seconds-to-minutes under load). Three anomalies, each with a guarantee that fixes it:

1. **Read-after-write (read-your-writes):** a user must see their *own* updates immediately (no promise about others'). Implement by reading user-modifiable data from the leader, by reading from the leader for a window after the last write, or by tracking a last-write timestamp and only reading from a sufficiently fresh replica. Cross-device read-after-write adds complexity (centralized metadata, same-datacenter routing).
2. **Monotonic reads:** never see time go *backwards* (a newer value then an older one). Implement by routing each user to the *same* replica (e.g. by hash of user ID).
3. **Consistent prefix reads:** writes that are causally ordered are seen in that order (no answer before its question). This breaks in partitioned DBs with no global write order; fix by keeping causally-related writes in one partition.

Transactions exist precisely so the database provides these stronger guarantees, keeping the application simple.

### Multi-leader

Multiple nodes accept writes, each also a follower to the others. Use cases: multi-datacenter (a leader per DC — local writes, DC-outage tolerance), offline clients (CouchDB — each device is a local leader), and collaborative editing (Google Docs).

The **big downside is write conflicts**: single-leader blocks the second writer, but multi-leader accepts both and detects the conflict *later* — too late to ask the user. Handling, in order of preference:
- **Conflict avoidance** (best): route all writes for a given record to the same leader (e.g. by the user's home DC). Breaks down if the leader must change.
- **Convergence:** **last-write-wins (LWW)** picks the highest timestamp — popular but **dangerously prone to data loss**; or merge values; or record the conflict and prompt the user.
- **Custom resolution:** run app code on write (Bucardo) or store siblings and resolve on read (CouchDB). Research directions: **CRDTs**, mergeable structures, operational transformation (Google Docs).

**Topologies:** all-to-all (best fault tolerance, but messages can **overtake** each other → causality problems → use **version vectors**), circular, and star (a single node failure interrupts the latter two).

### Leaderless (Dynamo-style)

The client (or a coordinator that does *not* enforce ordering) writes to several replicas in parallel and succeeds once enough ack; there's **no failover** — a down node simply misses the write. Used by **Riak, Cassandra, Voldemort**, and modeled on Amazon's internal *Dynamo* paper.

> **Accuracy note — Dynamo vs DynamoDB (a frequent interview trap):** the *Dynamo* paper describes Amazon's internal *leaderless* store. But **DynamoDB**, the AWS product, is **single-leader**. They share a name and a lineage, not an architecture — don't claim DynamoDB is leaderless.

A returning node catches up via **read repair** (on a multi-node read, the client writes the newer value back to stale replicas) and a background **anti-entropy** process (which not all systems have — without it, rarely-read values lose durability).

**Quorums:** with n replicas, w write-acks, and r read-queries, if **w + r > n** the read and write sets overlap, so a read is expected to see an up-to-date value. Common: n=3, w=r=2 (tolerates 1 down); n=5, w=r=3 (tolerates 2). But quorums tune the *probability* of staleness, not a guarantee — stale reads still happen via sloppy quorums, concurrent writes, partially-failed writes, or restore-from-an-old-replica. **Sloppy quorums + hinted handoff** accept writes on other reachable nodes to boost write availability, but aren't a real quorum (a later read may not see the write until handoff completes).

**Detecting concurrent writes — the happens-before algorithm.** A *happens-before* B if B knows about, depends on, or builds upon A; two operations are **concurrent** if neither knows about the other. (Concurrency is about *causal knowledge, not wall-clock overlap* — a slow network can make non-overlapping ops concurrent.) The single-replica protocol:
- The server keeps a **version number** per key, incrementing it on every write and storing it with the value.
- On a **read**, the server returns *all* non-overwritten values plus the latest version number. The client must read before writing.
- On a **write**, the client includes the version from its prior read and **merges** all the values it received.
- The server **overwrites** all values at or below that version (they're now subsumed) but **keeps** any higher versions as **siblings** (they were concurrent). A write with no version number is concurrent with everything.

**Worked example — shopping-cart sibling merge.** Two devices add to one cart concurrently. Device 1 (having read version 2 = `[milk]`) writes `[milk, eggs]`; device 2 (also having read version 2) writes `[milk, flour]`. Neither read the other, so the server keeps both as siblings. On the next read the client receives `[milk, eggs]` and `[milk, flour]`, **merges** them by union into `[milk, eggs, flour]`, and writes that back. Union works for add-only carts; **deletes need a tombstone** (a deletion marker carrying a version) so a removed item doesn't resurrect during a later merge. With multiple replicas, use a **version vector** — one version number per replica per key (a variant called dotted version vectors in Riak 2.0) — so it's safe to read from one replica and write to another.

> **Interview pitfalls (Ch5):** Don't say "DynamoDB is leaderless" — that's *Dynamo* (the paper). Don't claim quorums *guarantee* fresh reads — they tune probability. Don't reach for LWW casually — it silently loses concurrent (and even some non-concurrent) writes. Don't treat sloppy quorums as real quorums.

---

## Ch6 — Partitioning

**TL;DR:** Each record belongs to exactly one partition (shard); the goal is scalability. The core trade-off is **key-range** partitioning (sorted, supports range scans, but hot-spot risk) vs **hash** partitioning (even spread, but range queries lost). Secondary indexes are either document-partitioned (local) or term-partitioned (global). Don't `hash mod N`.

Partitioning and replication combine: each partition is replicated to several nodes. The aim is to spread data and load **evenly** — uneven distribution is **skew**, and an overloaded partition is a **hot spot**. (Note: this "partition" is unrelated to network partitions / netsplits.)

| | Key-range partitioning | Hash partitioning | When it bites you |
|---|---|---|---|
| Layout | continuous sorted ranges | hash → range of hash values | |
| Range queries | efficient | lost (adjacent keys scattered) | hash: a "find all events between 9am–10am" query must hit every partition |
| Hot spots | risk | even distribution | key-range: a **timestamp key** sends *all* of today's writes to one partition |
| Used by | BigTable/HBase, RethinkDB | Cassandra, MongoDB (MD5) | |
| Rebalancing | dynamic split/merge | usually fixed # of partitions | |

- **Cassandra compound key:** the first column is hashed for the partition, and the remaining columns are a *sort index within* that partition — so with a fixed first column you get efficient range scans on the rest. This is elegant for one-to-many data like `(user_id, update_timestamp)`.
- **Hot keys** (a celebrity user) defeat hashing, because all activity targets one key. The app must compensate, e.g. by appending a random suffix (2 digits → 100 sub-keys) to split the writes — but then reads must fan out across all sub-keys and track which keys are split.

> **Accuracy note — consistent hashing (a common interview over-credit):** "consistent" here means Karger's CDN-caching technique, *not* ACID or replica consistency. Consistent hashing actually works *poorly* for databases and is rarely used; prefer the plain term **hash partitioning**. Don't claim it "solves" database partitioning.

### Secondary indexes

- **Document-partitioned (local):** each partition indexes only its own documents, so writes touch one partition — but reads must **scatter/gather** across all partitions (red cars live everywhere), which is prone to tail-latency amplification. MongoDB, Cassandra, Elasticsearch.
- **Term-partitioned (global):** a single global index, itself partitioned by term, so reads hit the one partition holding the term (no scatter/gather) — but a single document write may touch **multiple** index partitions, so updates are often asynchronous (DynamoDB global secondary indexes update within a fraction of a second).

### Rebalancing

- **`hash mod N` — DON'T.** Worked numbers: with key `123456`, `mod 10 = 6`, `mod 11 = 3`, `mod 12 = 0` — changing N moves almost every key. The fix is to decouple the partition count from the node count.
- **Fixed number of partitions:** create *many more* partitions than nodes (e.g. 1000 partitions on 10 nodes). The key→partition mapping stays constant; only the partition→node *assignment* changes when a node joins (it steals whole partitions). You can weight powerful nodes with more partitions. The partition count is fixed at setup = your max future node count. (Riak, Cassandra, Elasticsearch.)
- **Dynamic partitioning** (key-range DBs): split a partition when it grows too big (HBase default 10 GB) and merge when too small. Pre-split to avoid a single hot partition on an empty DB.
- **Automatic vs manual:** fully automatic rebalancing is convenient but dangerous when combined with automatic failure detection — a slow, overloaded node gets declared dead, triggering a rebalance that adds *more* load and causes a **cascading failure**. Keep a human in the loop.

### Request routing (service discovery)

"Which node holds key foo?" has three answers: the client contacts *any node* (which forwards if it doesn't own the partition; Cassandra/Riak via gossip), a routing tier forwards, or a partition-aware client connects directly. The core difficulty is that everyone must agree on the (changing) partition→node mapping — a **consensus**-flavored problem — so a coordination service like **ZooKeeper** (*see Ch9*) often holds the authoritative map.

| Routing approach | Who knows the mapping | Example |
|---|---|---|
| Any node + forward | gossiped among nodes | Cassandra, Riak |
| Routing tier | a partition-aware proxy | MongoDB `mongos`, Couchbase moxi |
| Partition-aware client | the client library, watching ZooKeeper | LinkedIn Espresso (Helix), Kafka |

**MPP** analytic DBs go beyond single-key lookups and scatter/gather, parallelizing complex joins/aggregations across partitions.

> **Interview pitfalls (Ch6):** Don't credit consistent hashing with solving DB partitioning. Don't `hash mod N`. Don't forget hash partitioning *loses* range queries — name the compound-key workaround. Don't enable fully-automatic rebalancing next to automatic failure detection without acknowledging the cascade risk.

---

## Ch7 — Transactions

**TL;DR:** A transaction groups reads/writes that all commit or all abort, simplifying the programming model against partial failure and concurrency. **ACID** is precise on atomicity and durability but vague on isolation. Weak isolation levels are widely used and cause real, money-losing bugs; only **serializability** prevents all race conditions, and it does so three different ways.

### ACID, precisely

- **Atomicity** — better named *abortability*. If a fault occurs partway through, the transaction aborts and all its writes are discarded (all-or-nothing → safe to retry). It is *not* about concurrency.
- **Consistency** — the odd one out; it's a property of the *application's* invariants, not the database ("tossed in to make the acronym work").
- **Isolation** — concurrent transactions are isolated; the gold standard is **serializability** (the result is as if transactions ran one at a time).
- **Durability** — committed data survives crashes (WAL + replication + backups). *Perfect* durability doesn't exist (fsync can lie, firmware bugs, silent corruption, SSDs losing data when unpowered for weeks).
- *(BASE = "not ACID," even vaguer.)*

**Single- vs multi-object.** Storage engines give single-object atomicity (via the log) and isolation (via a per-object lock), plus **atomic increment** and **compare-and-set (CAS)** — but these aren't full transactions. You need **multi-object transactions** to keep foreign-key references valid, to update denormalized fields together, and to keep secondary indexes consistent with values. On **error handling**: abort and retry, but beware that an ack-lost success causes double execution (need dedup), retrying an overloaded system worsens it (exponential backoff), and external side effects like emails may repeat.

### Weak isolation levels (and the race each stops)

| Level | Stops | Mechanism | When it bites you |
|---|---|---|---|
| **Read committed** | dirty reads + dirty writes | row locks for writes; serve old committed value for reads | doesn't stop the lost-update counter race |
| **Snapshot isolation (MVCC)** | read skew (non-repeatable read) | each txn reads a consistent snapshot; readers don't block writers and vice versa | doesn't stop write skew or lost updates (in some impls) |
| **Serializable** | everything incl. write skew + phantoms | serial execution / 2PL / SSI | performance cost (varies by implementation) |

- **Dirty read** = seeing another transaction's *uncommitted* writes; **dirty write** = overwriting an uncommitted write. Read committed prevents both — write locks held to commit stop dirty writes, and the DB remembers both old and new values (serving the old until commit) to stop dirty reads without making readers wait.

- **Read skew** = a transaction sees different parts of the database at different points in time (money seems to vanish mid-transfer because you read the source account *after* the debit but the destination *before* the credit). It's tolerable under read committed but intolerable for backups, analytics, and integrity checks.

**Snapshot isolation and MVCC visibility (the mechanism that makes SI work).** Each transaction gets a unique, always-increasing **txid**; each row carries `created_by` and `deleted_by` txids (an update is a delete + a create). **Readers never block writers, writers never block readers** — there are no read locks. The **visibility rules** at the reader's snapshot are:
1. At transaction start, list all *in-progress* txids; ignore their writes *even if they later commit*.
2. Ignore writes by *aborted* transactions.
3. Ignore writes by any *later* txid (started after you).
4. All other writes are visible.

So an object is visible iff its creating transaction had committed before the reader started **and** it wasn't deleted (or its deleting transaction hadn't committed before the reader started).

**Worked example — a money transfer under MVCC.** Alice has \$1000 split across two accounts (\$500 each) and runs a balance query while a transfer of \$100 from account 2 to account 1 commits. Without SI she might read account 1 *after* the +\$100 (=\$600) but account 2 *before* the −\$100 (=\$500), seeing \$1100. Under SI, her read transaction snapshots the txid list at start; the transfer's txid is either entirely visible or entirely invisible to her, so she reads a consistent \$1000. Implementation-wise, append-only/copy-on-write B-trees (CouchDB, Datomic, LMDB) make this cheap: each write creates a new root, and every root *is* a consistent snapshot.

> **Accuracy note — SI and phantoms (be precise):** snapshot isolation prevents *read skew* and *straightforward phantoms in read-only queries*. It does **not** by itself prevent write-skew phantoms — those need index-range locks or full serializability. Don't lump all phantom behavior under "serializable only" — be specific.

- **Lost update** = two read-modify-write cycles clobber each other (incrementing a counter, editing a JSON list, saving a wiki page). Prevent it with **atomic write operations** (`UPDATE ... SET value = value + 1` — best when expressible), explicit locks (`SELECT ... FOR UPDATE`), **automatic detection** (PostgreSQL repeatable read, Oracle serializable, SQL Server snapshot detect-and-retry — but **NOT** MySQL/InnoDB), or **CAS** (`UPDATE ... WHERE id=.. AND content='old'`, valid only if the WHERE doesn't read an old snapshot). On replicated data, locks and CAS don't apply — use siblings + merge or commutative operations; **LWW loses updates**.

- **Write skew** generalizes lost update: two transactions read the *same* objects, then update *different* objects, each on a premise the other invalidates. The canonical case: two on-call doctors each check "≥2 doctors on call" (both read 2), and both go off-call — leaving zero. Atomic single-object ops don't help (different objects), and automatic lost-update detection doesn't catch it. The only real prevention is an explicit lock on the read rows, or **serializability**.

- **Phantoms:** a write in one transaction changes the *result set* of another's search. When the search returns rows you can `SELECT FOR UPDATE` them — but when you're checking the *absence* of rows (no booking for this room/time, no user with this name), there's nothing to lock. The last-resort hack is **materializing conflicts** (pre-create lock rows for every room×timeslot); otherwise, go serializable.

### Serializability — three implementations

| Approach | How | Tradeoffs / when it bites you |
|---|---|---|
| **Actual serial execution** | one txn at a time on a single thread (VoltDB, Redis, Datomic) | feasible since ~2007 (RAM + short OLTP txns); needs **stored procedures**; throughput capped at **one CPU core**; cross-partition txns are very slow |
| **Two-phase locking (2PL)** | shared/exclusive locks held to commit; **readers block writers, writers block readers** | the standard for ~30 years; **deadlocks**; unstable, slow tail latency under contention; needs predicate / index-range locks for phantoms |
| **Serializable snapshot isolation (SSI)** | optimistic — run on a snapshot, abort at commit if a premise went stale | full serializability, small penalty; **no blocking** → predictable latency; scales past one core (FoundationDB); bad under high contention (aborts) |

**Actual serial execution — the numbers.** It became feasible because RAM is cheap enough to hold the active dataset and OLTP transactions are short. Because a single-threaded loop can't afford network round-trips mid-transaction, you must submit each transaction as a **stored procedure** that runs to completion against in-memory data. To scale past one core, you *partition* so each transaction touches one partition (one thread per partition, near-linear scaling) — but **cross-partition transactions need lock-step coordination and are vastly slower** (VoltDB does ~1000 cross-partition writes/sec, and adding machines doesn't help).

**SSI — the two detection cases (with the doctors example).** SSI runs on an MVCC snapshot and detects when a transaction acted on a *premise* that became stale by commit time:
1. **Stale MVCC read.** Track when a transaction *ignored* another's write due to visibility rules. When doctor A reads "2 on call" (ignoring doctor B's concurrent off-call write because B hadn't committed), the system records the dependency. At A's commit, if B's write has since committed, A is **aborted and retried** — catching the write skew.
2. **Write affecting a prior read.** Like an index-range lock but **non-blocking** — a "tripwire" records which transactions read which index range. When a transaction writes, it *notifies* the transactions that recently read the affected range that their read may be stale; the reader aborts only if the conflicting write committed before the reader commits.

The granularity is a tuning knob (precise tracking = more bookkeeping; coarse = more unnecessary aborts). SSI's big win over 2PL is **no lock blocking** → predictable, low-variance latency and lock-free read-only queries; over serial execution, it isn't capped at one core. Its weakness is a high **abort rate** under contention, so read-write transactions should be short.

> **Note:** **2PL ≠ 2PC** (and 2PC ≠ 2PL). 2PL is *isolation* (this chapter); 2PC is *atomic commit across nodes* (*see Ch9*). Don't let the shared "2P" fool you.

> **Interview pitfalls (Ch7):** Don't say snapshot isolation prevents write skew — only serializable does. Don't claim "serializable = linearizable" — they're orthogonal (*see Ch9*). Don't assume MySQL/InnoDB repeatable read auto-detects lost updates (it doesn't). Don't pitch serial execution without stored procedures and partitioning.

---

## Ch8 — The Trouble with Distributed Systems

**TL;DR:** In distributed systems, **partial failure** is the norm and **non-deterministic** — you often can't even tell whether an operation succeeded. Networks, clocks, and process pauses are all unreliable. Design assuming "anything that can go wrong will," then state a **system model** you can reason about.

### Partial failure

A single computer is deterministic — it works or it crashes (designed to crash rather than return wrong results). A distributed system instead has *some* parts working while others fail, with no clear signal. The HPC/supercomputer world dodges this by treating partial failure as total (checkpoint, and on any failure restart the whole cluster), but cloud-scale online services can't stop for repair — at scale *something is always broken*, so the goal is to **build a reliable system from unreliable components** (TCP retransmits over unreliable IP; error-correcting codes over noisy channels).

### Unreliable networks

A request+response can fail in many *indistinguishable* ways: the request is lost or delayed, the remote node is down or paused, or the response is lost or delayed. **If you don't get a response, you cannot tell why** — and the usual remedy, a **timeout**, still doesn't tell you whether the request was processed (it may be queued and delivered later). Network faults are common even within one datacenter (~12/month in one study), and redundant gear doesn't help against human misconfiguration.

**Timeouts and the root cause of variable delay.** There's no correct timeout: too long means slow detection, too short means falsely declaring a live-but-slow node dead, shifting its load and potentially causing a **cascading failure**. A hypothetical network with bounded delay *d* and bounded handling *r* would justify a timeout of *2d + r*, but real async networks have **unbounded delays**. The dominant cause is **queueing**:
- **switch queues** fill under congestion (then drop and resend);
- the destination **OS queues** packets when all CPU cores are busy;
- **VM pauses** queue packets in the VMM;
- TCP **flow control** queues at the sender;
- TCP **retransmits** on its own timeout, which the app sees as delay;
- **noisy neighbors** in multitenant clouds share links, switches, and CPUs.

Queueing is worst near maximum capacity, because spare capacity is what drains queues. Choose timeouts experimentally — better, measure the RTT distribution and *jitter* continuously and adapt (the **Phi Accrual** detector in Akka and Cassandra). Circuit-switched phone networks have *bounded* delay (reserved bandwidth) but waste capacity; datacenters choose packet switching for high utilization at the cost of variable delay. **Variable delay is a cost-benefit tradeoff, not a law of nature.**

### Unreliable clocks

There are two kinds of clock, for two purposes:
- **Time-of-day clock** (`CLOCK_REALTIME`): wall-clock time, NTP-synced so it's comparable across machines — but it can **jump backwards** on a reset and historically had coarse resolution, making it **unsuitable for measuring elapsed time**.
- **Monotonic clock** (`CLOCK_MONOTONIC`): always moves forward, only differences are meaningful, and you must not compare it across machines. Use it for **durations and timeouts**.

NTP is fickle: quartz **drift** (~200 ppm ≈ 17 s/day), network-limited accuracy (≥35 ms over the internet, spiking to ~1 s), leap seconds, and VM pauses. Worse, **incorrect clocks fail silently** — a drifting clock looks fine while quietly corrupting data — so you must monitor clock offsets and declare too-drifted nodes dead. This is exactly why **LWW with time-of-day timestamps fails to order causally**: a causally-*later* write can receive an *earlier* timestamp (its node's clock lags) and be silently dropped. Use **logical clocks** (counters) for ordering instead.

A clock reading is really a **confidence interval**, not a point. **Google TrueTime (Spanner)** exposes this as `[earliest, latest]`. **Why waiting out the interval guarantees causality:** when Spanner commits a read-write transaction, it *waits out the length of the confidence interval* before reporting success. This ensures that any later transaction's interval cannot overlap an earlier committed one, so timestamps strictly reflect causal order — and it only works because the uncertainty is kept small (a GPS or atomic clock per datacenter, ~7 ms).

### Process pauses

A node can be paused mid-function — by stop-the-world **GC** (sometimes minutes), VM suspend/live-migration, swapping/thrashing, or `SIGSTOP` — and not notice while the rest of the world declares it dead.

**Worked failure — the leader and the lease.** A leader holds a *lease* (a lock with a timeout) it must renew before expiry. The naive renew-loop is wrong for two reasons: (a) it compares a lease expiry set on *another* machine against its *local* clock, assuming synchronized clocks; and (b) it assumes little time passes between *checking* the lease and *using* it. If a GC pause occurs between the check and the write, the lease can expire, another leader can be elected, and the paused node — on resuming — proceeds to write anyway, corrupting data (a real HBase bug). This is precisely what **fencing tokens** fix (*see below*). Server data systems can't afford hard real-time guarantees (an RTOS is expensive and lower-throughput), so they instead *tolerate* pauses — treating a GC as a brief planned outage and draining traffic first.

### Knowledge, truth, and lies

- **Truth is defined by the majority.** A node can't trust its own judgment (it might have an asymmetric fault, or be a GC-paused node that everyone declared dead and that then "resurrects"). **Quorums** ensure only one majority decision can exist, so no two conflicting decisions are possible (3 nodes tolerate 1 failure, 5 tolerate 2).
- **Fencing tokens.** The lock service returns a **monotonically increasing token** with each grant, and every write must carry its token. Crucially, the **resource itself** must reject any write bearing a token lower than one it has already seen — *don't trust the client* to behave. ZooKeeper's `zxid` works as a fencing token. This stops the paused-then-resurrected leader above: its token is now stale, so the resource rejects its write.
- **Byzantine faults** are nodes that *lie* (send arbitrary/corrupted responses). BFT (correct if > 2/3 of nodes are honest) matters for aerospace (radiation-flipped bits) and trustless multi-org systems (Bitcoin), but **server-side data systems can safely assume no Byzantine faults** — BFT is complex and expensive, and same-software nodes would share any bug anyway. Still guard against *weak* lying with checksums, input sanitization, and multi-server NTP.

### System models

- **Timing:** *synchronous* (bounded delay — unrealistic), *partially synchronous* (usually bounded, occasionally not — realistic), *asynchronous* (no timing assumptions — very restrictive).
- **Node failure:** *crash-stop*, *crash-recovery* (disk survives, memory is lost), *Byzantine*.
- The most useful real-world model is **partially synchronous + crash-recovery**.
- **Safety** ("nothing bad happens" — a violation is at a specific moment and permanent) vs **liveness** ("something good eventually happens"). Distributed algorithms require **safety always** (never return a wrong result, even if every node crashes), but allow liveness caveats (make progress only if a majority is up and the network eventually recovers).

> **Interview pitfalls (Ch8):** Don't say "no response means the node is down" — you literally cannot tell. Don't use a time-of-day clock to measure elapsed time. Don't trust the *client* to check a lease — the *resource* must reject stale fencing tokens. Don't design server systems for Byzantine fault tolerance — assume non-Byzantine.

---

<a name="part-ii-recap"></a>
### Part II recap

- **Replication and partitioning combine** on a shared-nothing base: copies for availability/latency/read-scaling, shards for write-scaling.
- **Replication topology dictates consistency:** single-leader is simple but failover is hard and async can lose data; multi-leader and leaderless tolerate more faults but introduce conflicts you must detect (happens-before, version vectors) and merge.
- **Partitioning trades range queries for even spread;** don't `hash mod N`, keep a human in rebalancing, and route via a consensus-backed map.
- **Transactions buy simplicity against concurrency,** but weak isolation leaks real bugs (lost update, write skew, phantoms); serializability fixes all of them three ways (serial / 2PL / SSI).
- **Distributed systems fail partially and non-deterministically:** networks, clocks, and pauses are unreliable, so reason within an explicit model, demand safety always, and use quorums + fencing tokens.

---

# Part III — Derived Data

Real applications combine many datastores. Two categories: **systems of record** (the source of truth — authoritative, written first, each fact represented once) and **derived data systems** (caches, indexes, materialized views, ML summaries — redundant but *re-creatable* from the source if lost). Which is which depends on *how you use it*; being explicit about what derives from what is the architectural discipline that runs through Part III. Ch10 is batch dataflow; Ch11 is the same ideas with lower delay.

## Ch9 — Consistency and Consensus

**TL;DR:** The crown jewel is **consensus** — getting nodes to agree (e.g. electing a leader to avoid split-brain). **Linearizability** is the strong recency guarantee; **causal consistency** is the strongest model that stays fast and available under partitions. Linearizable CAS, total-order broadcast, and consensus are all *provably equivalent* — and this chapter shows the constructions, not just the claim.

### Consistency guarantees

- **Eventual consistency / convergence:** if writes stop, replicas eventually agree. It's very weak — it says nothing about *when*, and its edge cases only surface under faults or concurrency, making bugs hard to test for.
- **Linearizability** (a.k.a. atomic / strong consistency): make the system *appear as if there is a single copy of the data and every operation on it is atomic*. It is a **recency guarantee** — once a write completes, every later read (from any client) sees that value or a newer one, never a stale one. The value flips at a single point in time and never flips back. Operations are modeled on a single **register** with `read`, `write`, and `cas(x, vold, vnew)`. It's testable (expensively) by recording operation timings and checking for a valid sequential order (Jepsen/Knossos).

**Linearizability vs serializability — don't confuse them.** Serializability is an *isolation* property of *transactions* (they behave as if run in *some* serial order; it does *not* stop a stale single-object read). Linearizability is a *recency* property of single-object reads/writes (it does *not* stop write skew). Both together = **strict serializability**. 2PL and actual serial execution are typically linearizable; **SSI is NOT linearizable** — and the *reason* matters: SSI reads from a consistent MVCC snapshot that *deliberately excludes recent writes*, which is the opposite of a recency guarantee.

**When linearizability is required.** Locking and leader election (all nodes must agree who holds the lock — ZooKeeper/etcd provide this via consensus); uniqueness constraints (a username, a non-negative balance — CAS on a single agreed value, which needs consensus); and **cross-channel timing dependencies** — e.g. an image-resizer where the web server stores a full-size image and *separately* enqueues a resize job; if the message-queue channel is faster than the storage channel's replication, the resizer reads a stale or missing image. Linearizability automatically preserves causality across such channels. You can often *avoid* linearizability with compensating transactions and apology workflows ("pick another username," overdraft fee).

**Per replication style:** single-leader is *potentially* linearizable (only if you truly know the leader and read from it or sync followers; async failover and SI break it); consensus algorithms are linearizable (ZooKeeper, etcd); multi-leader is not; leaderless is *probably not* (quorums aren't quite enough — even strict quorums can be non-linearizable; synchronous read-repair can get there at a performance cost).

**Cost and CAP.** **CAP** says: if you need linearizability and a partition happens, disconnected replicas must wait or error (unavailable); if you don't, they stay available but non-linearizable — "**C**onsistent or **A**vailable when **P**artitioned." CAP is narrow (only linearizability, only partitions, an idiosyncratic definition of availability) and of **little practical value** today. The deeper point: **linearizability is slow *always*, not just under faults** — even multi-core CPU RAM isn't linearizable without memory barriers, and **Attiya & Welch** proved a linearizable read/write's response time is *at least proportional to the network-delay uncertainty*. No algorithm beats that; weaker models can be much faster.

### Ordering and causality

- **Causality is a partial order** (concurrent operations are incomparable); **linearizability is a total order** and is therefore *stronger* — it implies causality. A "consistent" snapshot is one consistent with causality (if it contains an answer, it contains the question).
- **Causal consistency is the strongest model that does NOT slow down under network delays and stays available under partitions** (CAP doesn't apply to it). Many systems that *seem* to need linearizability really only need causal consistency — because a partial order needs no global coordination point, whereas a total order does.
- **Sequence numbers** give a compact total order. A single leader just increments a counter, producing a total order consistent with causality. Non-causal generators (odd/even per node, physical-clock timestamps, pre-allocated blocks) scale better but are *inconsistent with causality*.
- **Lamport timestamps** = (counter, node ID). The rule: every node tracks the maximum counter it has seen and includes it on every request; on receiving a higher counter it bumps its own to match. This yields a total order consistent with causality — but Lamport timestamps **can't distinguish concurrent from causally-dependent** operations (version vectors can), and the total order only *emerges* after you've collected all operations, so at decision time you can't yet know if another node is concurrently claiming the same username.
- **Total-order broadcast (atomic broadcast)** fixes that "when is the order final?" gap with two properties (which must hold even under faults): **reliable delivery** (no message lost; delivered to one ⇒ delivered to all) and **totally ordered delivery** (every node receives messages in the same order). The order is **fixed at delivery time** — you can't retroactively insert an earlier message. It is equivalent to a **log** (deliver = append), and underpins state-machine replication, serializable transactions, and fencing-token services (ZooKeeper `zxid`).

**Worked construction — linearizable CAS from total-order broadcast** (the proof, not the claim). Suppose every node can broadcast in total order. To claim a unique username:
1. **Append** your tentative claim ("user X claims `alice`") to the log.
2. **Read** the log back and wait for *your own* message to be delivered.
3. **Check:** if the *first* message claiming `alice` is yours, you win → commit. If someone else's claim came first, you lose → abort.

Because all nodes see the same total order, they all agree on who was first — that's a linearizable compare-and-set. (This alone gives linearizable *writes*; linearizable *reads* need a bit more — sequence reads through the log, or query the latest log position and wait, as ZooKeeper's `sync()` does, or read from a synchronously-updated replica.)

**Worked construction — the reverse, total-order broadcast from linearizable storage.** Take a linearizable atomic **increment-and-get** register. For each message you want to broadcast, increment-and-get a sequence number and attach it; deliver messages in consecutive sequence-number order, waiting if there's a gap. Unlike Lamport timestamps, this produces **no gaps**, which is the key difference that makes it a true total-order broadcast.

**Proven equivalence:** a linearizable CAS / increment-and-get register, total-order broadcast, and **consensus** are all equivalent — solve one and you can build the others.

### Distributed transactions and consensus

- **FLP impossibility:** no *deterministic* algorithm can guarantee consensus if a node may crash — but only in the timing-free asynchronous model. Allowing timeouts (failure suspicion) or randomness makes consensus achievable in practice.

- **Two-phase commit (2PC)** is atomic commit across nodes (**≠ 2PL**, *see Ch7*). Stepwise:
  1. The application gets a globally-unique transaction ID.
  2. It does work on each participant, tagged with that ID.
  3. **Phase 1 — prepare:** the coordinator sends `prepare` to all participants. Each one durably writes all its data, checks constraints, and votes "yes" — which is an **irrevocable promise to commit if asked** (it gives up its right to abort).
  4. The coordinator writes its decision to its own log — the **commit point**.
  5. **Phase 2 — commit/abort:** the coordinator sends the decision and **retries forever** until every participant acknowledges.

  There are **two points of no return**: a participant's "yes" vote, and the coordinator's decision. The fatal weakness: if the coordinator fails *after* a participant voted yes but *before* the participant hears the decision, that participant is **in doubt** — it cannot unilaterally commit or abort (a timeout doesn't help), so it must wait for the coordinator to recover. **2PC is therefore a blocking protocol**, and an in-doubt transaction holds its locks the whole time, potentially making large parts of the application unavailable. (**3PC** is non-blocking but needs bounded delay and a perfect failure detector, so it's impractical.) **XA transactions** expose 2PC to applications; the coordinator becomes a stateful single point of failure, and XA is a lowest-common-denominator (no cross-system deadlock detection, no SSI). 2PC needs *all* participants to respond, so it **amplifies failures**.

- **Fault-tolerant consensus** has four properties: **uniform agreement** (no two nodes decide differently), **integrity** (no node decides twice), **validity** (a decided value was proposed) — these three are *safety* — plus **termination** (every non-crashed node eventually decides) — *liveness*. **Termination requires a majority** to be functioning; the safety properties hold even if a majority fails (a big outage can stop progress but cannot corrupt decisions). Algorithms: **Paxos (Multi-Paxos), Raft, Zab, Viewstamped Replication** — most implement total-order broadcast (= repeated rounds of consensus). Don't implement your own.

**Epoch numbering — why it breaks the chicken-and-egg.** To elect a leader you need consensus, but consensus algorithms use a leader — circular. The resolution: an **epoch** (Raft *term* / Paxos *ballot* / VSR *view*) is a monotonically increasing number; within each epoch the leader is unique, and a higher epoch wins. For *each* decision the leader must collect votes from a **quorum**, and a node won't vote if it's aware of a higher-epoch leader. The crucial argument: the *election* quorum and the *proposal* quorum must **overlap** (two majorities always share at least one node), so at least one voter on any proposal has also seen any newer election — meaning the leader will learn it's been superseded and step down. That overlap is what guarantees only one current leader's decisions stick. (Versus 2PC: consensus needs only a *majority*, not every participant, and has a recovery process.)

**Consensus limits:** voting is synchronous (a performance cost), it needs a strict majority (≥3 to tolerate 1, ≥5 to tolerate 2 — a minority partition is blocked), membership is fixed, and it relies on **timeouts** — so in variable-delay or geo-distributed networks, false leader-failures cause election storms (Raft's leadership can bounce on one consistently-flaky link).

**ZooKeeper / etcd** (modeled on Google **Chubby**) hold *small*, slow-changing coordination data, replicated via fault-tolerant total-order broadcast on 3–5 nodes. Their features: **linearizable atomic operations** (locks/leases — *only this one truly needs consensus*; the rest are layered on top), **total ordering** (monotonic `zxid` = fencing tokens), **failure detection** (ephemeral nodes auto-deleted on session timeout), and **watches** (event notifications without polling). They're used indirectly (HBase, Kafka, YARN). Good for leader election and allocating partitioned work — not for runtime application state. Note that **service discovery probably doesn't need consensus** (stale DNS-style reads are fine), but leader election does.

> **Bottom line:** linearizable CAS, atomic commit, total-order broadcast, locks/leases, membership, and uniqueness constraints all reduce to consensus. Every one of them is trivial on a single leader — which is why single-leader databases give them for free, and why they still need consensus to *change* leaders ("kicking the can down the road"). Leaderless/multi-leader systems cope without consensus by tolerating branching-and-merging version histories.

> **Interview pitfalls (Ch9):** Don't equate serializable with linearizable. Don't say SSI is linearizable — its snapshot reads exclude recent writes. Don't claim CAP forces a permanent "pick 2 of 3" choice — partitions just happen, and CAP only covers linearizability. Don't confuse 2PC (atomic commit, blocking) with 2PL (isolation). Don't say "everything needs consensus" — causal consistency often suffices and stays available.

---

## Ch10 — Batch Processing

**TL;DR:** A batch job reads **bounded** input and produces derived output *without modifying the input*, optimizing for **throughput**, and it knows when it's done. MapReduce inherits the Unix philosophy — immutable inputs, composable stages, fault tolerance via writing to disk. The two core problems are **partitioning** (bring related data together) and **fault tolerance**.

Three system types by their performance measure: **services** (online — response time, availability), **batch** (offline — throughput, bounded input), and **stream** (near-real-time — between the two).

### Unix tools as the model

`awk '{print $7}' | sort | uniq -c | sort -r -n | head` finds the top pages in a log, processing gigabytes in seconds. The reason `sort` scales is that it **spills to disk** (mergesort = sequential I/O, parallelized across cores) rather than holding everything in memory like a hash aggregation. The **Unix philosophy**: each program does one thing well; one program's output is the next's input; the **uniform interface is the file** (an ordered byte stream); and there's a **separation of logic and wiring** (programs use stdin/stdout; the shell wires them together). The fatal limitation is that it runs on a single machine.

### MapReduce + distributed filesystem

MapReduce is Unix tools spread across thousands of machines, reading and writing a **distributed filesystem** (**HDFS** = open-source GFS): a shared-nothing pool where blocks are replicated and a central NameNode tracks block→machine. A job:
1. Reads input and breaks it into records.
2. **map** extracts key-value pairs from each record (0 or more).
3. An *implicit* **sort by key** — you don't write it, and it's the most important aspect.
4. **reduce** is called per key with an iterator over that key's values.

**The shuffle, in mechanism detail.** To get the same keys to the same reducer, the framework hashes each key to a reduce partition. Each *mapper* partitions its output by reducer and writes *sorted* files to its local disk (SSTable-like). When a mapper finishes, the *reducers* **fetch** their partitions from it — this fetch-partition-and-merge step is the **shuffle** (= partition-by-reducer + sort + copy). Each reducer merges the sorted files (preserving order) and calls `reduce` per key with an iterator that may exceed memory. Computation is placed *near the data* (run the mapper on a machine holding a replica). Jobs chain into **workflows** (one job's output directory is the next's input; intermediate state is fully materialized to temp files; schedulers are Airflow, Oozie, Luigi), and a job only starts once all its dependencies *succeed*.

### Joins

A batch join resolves *all* occurrences of an association by a full scan, not a per-record remote DB lookup (too slow, non-deterministic, and it would overwhelm the DB) — so you take an ETL **copy** of the DB into the distributed filesystem first.

| Join | How (mechanism) | When | When it bites you |
|---|---|---|---|
| **Reduce-side sort-merge** | both sides' mappers emit (key, value); partition+sort makes same-key records adjacent at the reducer; a secondary sort can make the DB record arrive before the events | general-purpose | a hot key sends a huge group to one reducer |
| **Broadcast hash** | *no reducers* — each mapper loads the small input into an in-memory hash table, then scans a block of the large input | one input fits in memory | the "small" side grows past memory |
| **Partitioned (bucketed) hash** | both inputs co-partitioned (same key, hash fn, # partitions) → join per partition; each mapper loads only its partition | both inputs partitioned alike | requires the upstream layout to match exactly |
| **Map-side merge** | inputs partitioned AND sorted alike → mapper merges incrementally, no memory limit | both partitioned + sorted | needs both physical properties |

The map-side family has *no reducers and no sort step* — a mapper reads a block and writes a block — but it requires you to *know the physical layout* (partitioning and sort keys), kept in the **HCatalog / Hive metastore**. **Skew** (a celebrity "linchpin" key) overloads one reducer and delays the whole job; the fix is a **skew/sharded join** (send hot-key records to *random* reducers and replicate the other side to all of them) plus two-stage grouping.

### Output and philosophy

The output is usually a data structure, not a report — a search index (each reducer builds a partition; document-partitioned, immutable once built) or a key-value store. **Build the read-only DB files *inside the job* and bulk-load them** (Voldemort, ElephantDB) rather than writing to a live database per record. *Why,* concretely: per-record network writes are slow; many concurrent map/reduce tasks would overwhelm the DB; writing externally breaks the job's all-or-nothing guarantee; and **speculative execution** (running duplicate tasks to beat stragglers) would expose partial output. Building immutable files and atomically switching to them gives **human fault tolerance**: inputs are immutable, the output fully replaces the previous version, and there are no side effects — so if you ship buggy code, you roll it back and just re-run, and retries are safe. (Versus Unix: structured, schema-evolved formats like Avro/Parquet instead of untyped text.)

### MapReduce vs MPP, and beyond

MPP databases are parallel analytic **SQL** with up-front schemas; MapReduce + DFS is a general-purpose "OS" that runs arbitrary code over raw bytes — the **schema-on-read / data lake** philosophy ("raw data is better"). MapReduce tolerates *frequent* faults (it writes to disk and retries a single task), which matters at Google because **batch jobs run at low priority and get preempted** ~5%/hour: a 100-task job running 10 minutes has a **>50% chance of at least one preemption**, so tolerating frequent termination is what enables high cluster utilization. **Dataflow engines (Spark, Tez, Flink)** treat the whole workflow as one DAG of *operators*, sorting only where needed, keeping intermediate state in memory, and starting operators as soon as input is ready. They get **fault tolerance by recomputation** (Spark's RDD ancestry, Flink's checkpoints), which requires **deterministic** operators (a seeded PRNG, no clock-dependence) or a recomputed value would differ from the original and cascade. **Pregel / BSP** (Giraph, GraphX) handles iterative graph processing: "think like a vertex" — each vertex keeps state in memory between rounds, processes only new messages, and gets exactly-once message delivery via periodic checkpointing. High-level APIs (Hive, Spark/Flink) are adding cost-based optimizers and vectorized execution, converging with MPP databases while keeping arbitrary-code flexibility.

> **Interview pitfalls (Ch10):** Don't say MapReduce "writes to the database as it goes" — it builds immutable files and bulk-loads. Don't forget the implicit sort is the heart of the shuffle. Don't pitch recomputation-based fault tolerance without deterministic operators. Don't confuse a *dataflow DAG of operators* with *graph processing* (Pregel) — the former's data is tuples, the latter's data is a graph.

---

## Ch11 — Stream Processing

**TL;DR:** A stream processes **unbounded** input continuously, closing the latency gap that batch's fixed chunks create. Message brokers and event logs are the streaming filesystem, and representing **databases as streams** (CDC, event sourcing) is the key to keeping derived systems in sync. Time and exactly-once semantics are the hard parts — but stream processing is **not** inherently lossy or approximate.

An **event** is a small, immutable, self-contained record of something that happened, usually timestamped — generated once by a **producer** and processed by multiple **consumers**, grouped into a **topic/stream**. Polling for new events is expensive, so consumers are **notified** via messaging systems.

### Messaging systems

Two questions distinguish them: (1) *Are producers faster than consumers?* → drop messages, buffer (spill to disk), or apply **backpressure**. (2) *What if nodes crash?* → durability via disk and/or replication. Direct messaging (UDP multicast, ZeroMQ, webhooks) requires the application to tolerate loss.

| | **AMQP/JMS broker** | **Log-based broker (Kafka, Kinesis)** | When it bites you |
|---|---|---|---|
| Delivery | assigns *individual* messages | assigns whole **partitions** | log: parallelism is capped at the partition count |
| Ordering | lost under load-balancing + redelivery | totally ordered *within a partition* (offsets) | AMQP: a crash mid-message reorders m3 after m4 on redelivery |
| Acks | per-message; deletes on ack | periodic **offset** checkpoint; retained on disk | log: one slow message causes **head-of-line blocking** in its partition |
| Replay | no (transient) | yes (non-destructive — rewind the offset) | AMQP: a new consumer can't see past messages |
| Best for | async RPC / task queues, expensive per-message work, order unimportant | high throughput, fast per-message, ordering important, derived state | |

**Log-based broker disk mechanics.** The log is split into segments and old segments are deleted — a bounded **ring buffer** on disk. A back-of-the-envelope: a 6 TB drive at 150 MB/s holds ~11 hours of buffer *at the maximum write rate*, and in practice days or weeks. You **monitor consumer lag** and alert before a consumer falls off the end of the buffer; the operational win is that a slow consumer **only affects itself** (it doesn't block others, unlike a queue backing up).

### Databases and streams

A database write is an event, and a **replication log is already a stream**. Keeping an OLTP DB, a cache, a search index, and a warehouse in sync via **dual writes is broken**: concurrent writes can arrive in different orders at different systems (a permanent, silent inconsistency), and partial failure leaves one system updated and another not. The fix is to make *one* system the leader and the others followers:

- **Change Data Capture (CDC)** makes the source DB the leader and derived systems its followers, consuming its change stream (a log-based broker preserves order). It's implemented by parsing the WAL/binlog/oplog (Debezium, Maxwell, Bottled Water). A new consumer needs an **initial consistent snapshot** at a known log offset; **log compaction** (keep only the latest value per key) lets a consumer rebuild a full DB copy from offset 0, so Kafka can act as durable storage.
- **Event sourcing** stores changes as a log of immutable, *application-intent* events ("username registered," not "row updated"). The app derives current state by replaying. Unlike CDC, later events don't override prior ones, so you **need the full history** (snapshots are only an optimization). A user request first arrives as a **command** (which may fail validation — validate synchronously); once accepted it becomes an immutable **event** that consumers cannot reject.
- **State, streams, immutability.** Mutable state and an append-only event log are *two sides of the same coin*: **state is the *integral* of the event stream, and the change stream is its *derivative*** ("the truth is the log; the database is a cache of a subset of the log"). The payoffs: auditability, recovery from buggy code, capturing more information than the current state, and **deriving multiple read views** from one log → **CQRS** (separate the write form from read-optimized, freely denormalized read views, kept in sync automatically).

### Processing streams

A processor reads input read-only and writes output append-only. Because a stream never ends, there are no sort-merge joins and no restart-from-the-beginning. Uses: **Complex Event Processing** (stored queries, events flow past them — the inverse of a database; Esper); **stream analytics** (aggregations over **windows**, often using probabilistic algorithms like Bloom filters and **HyperLogLog** — *these are an optimization for memory, not a requirement; stream processing is not inherently lossy*); and **maintaining materialized views** (which need *all* events ever, not a recent window).

**Reasoning about time.** Use the **event-time** timestamp (deterministic, re-runnable), not the **processing-time** system clock — a processor restarted with a backlog would otherwise show a false spike as it clears the backlog, even though the real rate was steady. Messages arrive out of order, and you can never truly know a window is complete; options are to *ignore* stragglers (with alerting) or *recompute and issue a correction*. A **low watermark** declares "no more messages earlier than t." For mobile/offline clients with untrusted clocks, log **three timestamps** to reconstruct true event time: *event occurred* (device clock), *event sent* (device clock), and *event received* (server clock) — the difference between "sent" and "received" estimates the device-server clock offset, which you subtract from "occurred." **Window types:** tumbling (fixed, non-overlapping), hopping (fixed, overlapping — for smoothing), sliding (interval-based), session (groups one user's activity, ends after inactivity).

**Stream joins.** *Stream-stream (window join):* join two event streams within a time window (a search event and a click event by session ID → click-through rate); the processor maintains an indexed state of recent events from each stream. *Stream-table (enrichment):* enrich events with DB data via a **local copy kept current by CDC** — and unlike batch (which uses a point-in-time snapshot), the long-running stream processor must continuously update its local copy from the DB changelog. *Table-table (materialized-view maintenance):* both inputs are changelogs (tweets + follows → a timeline cache), maintaining a materialized view of the join — and since a stream is the derivative of a table, the join's changes follow the product rule `(u·v)′ = u′v + uv′`. All three are time-dependent and, with no cross-partition ordering guarantee, can be **non-deterministic**.

**Fault tolerance and exactly-once.** Batch gets exactly-once by discarding failed tasks' output, but a stream can't wait for completion. Techniques: **microbatching** (Spark Streaming treats ~1s blocks as mini-batches); **checkpointing** via barriers (Flink rolls operator state to durable storage); **atomic commit** of outputs + side-effects + offset; and **idempotence**. The atomic-commit insight is *why* it's tractable despite being 2PC-like: it reduces to a **single-object write** (outputs + state + offset together) to a fault-tolerant store, and single-object writes are easy to make atomic (Google Cloud Dataflow does this). Idempotence is achieved by storing the triggering message's **offset** with the value and skipping if it's already applied (Storm Trident) — assuming replay in the same order, deterministic processing, and possibly **fencing** on failover to stop a presumed-dead-but-alive node from interfering. State is rebuilt after failure by keeping it **local + periodically replicated** (Flink → HDFS, Kafka Streams → a log-compacted topic) or by replaying input streams.

> **Interview pitfalls (Ch11):** Don't say streaming is "approximate by nature" — probabilistic algorithms are an optimization. Don't use processing time for windowing — use event time. Don't sync derived systems with dual writes — use CDC from one leader. Don't claim exactly-once is impossible in streams — it's an atomic single-object write of state + offset, or idempotent writes keyed by offset.

---

## Ch12 — The Future of Data Systems (not in source PDF)

> **Note:** Chapter 12 was **not present** in the provided extraction (the source ended at Ch11). The following is a standard summary of its themes **(from general knowledge, not your PDF)**, included for completeness.

- **Data integration:** no single tool fits all needs — combine specialized systems and keep them in sync. Choose a **system of record** and derive everything else from it via batch and stream processing.
- **Unbundling the database:** treat the components a database bundles (storage engine, indexes, replication, caches, materialized views) as separate composable services wired together with logs/streams — a "dataflow" / "database inside-out" architecture, often with a log (Kafka) as the integration backbone.
- **Derived state via streams:** use change logs and deterministic transformations to maintain indexes, caches, and materialized views; the log gives a single authoritative ordering that keeps all derived views consistent.
- **End-to-end correctness:** weak guarantees compound, so push correctness to the **application / end-to-end** layer. Achieve **exactly-once** via idempotence + end-to-end operation IDs rather than relying solely on transactions in the middle; asynchronous, eventually-consistent systems can still be correct with the right constraints (e.g. uniqueness enforced at one log).
- **Trust, but verify:** continuously **audit** derived data against the source rather than blindly trusting integrity, because systems and their assumptions break.
- **Ethics and responsibility:** predictive analytics, surveillance, bias and feedback loops, and consent. Treat data as a **liability** as well as an asset — respect privacy, minimize collection, and weigh the human consequences of systems built on personal data.

---

<a name="part-iii-recap"></a>
### Part III recap

- **Systems of record vs derived data** is the organizing distinction: derived data (caches, indexes, views) is redundant and re-creatable, so the discipline is being explicit about what derives from what.
- **Consensus is the crown jewel** and many problems reduce to it (linearizable CAS, atomic commit, total-order broadcast, locks, uniqueness); all are trivial on a single leader, which is why single-leader DBs need consensus only to *change* leaders. Linearizable CAS ⇔ total-order broadcast ⇔ consensus, with concrete constructions both ways.
- **Batch (bounded, knows when done) and stream (unbounded, never completes)** share a philosophy: immutable inputs, derived outputs, and fault tolerance through re-runnability — give exactly-once by discarding failed output (batch) or atomic single-object commits / idempotence (stream).
- **Keep derived systems in sync with CDC from one leader, never dual writes;** the log unifies state and stream (state = integral, changelog = derivative).

---

# Synthesis

## Decision Cheat-Sheet

Reason through these dimensions in order. Each line links back to the fuller chapter section above.

**1. Data model** (Ch2)
- Tree-like, self-contained, mostly read whole → **document**.
- Many-to-one / many-to-many, normalized, ad-hoc joins → **relational**.
- "Anything related to everything," variable-length traversals → **graph**.
- Mixed → hybrid relational+document; expect polyglot persistence.

**2. Storage engine** (Ch3)
- Write-heavy, data >> RAM, range scans → **LSM-tree** (Cassandra, RocksDB).
- Read-heavy, predictable latency, range/transactional locking → **B-tree** (relational DBs).
- Analytics (big scans, few columns) → **column-oriented** + compression + sort order (Vertica, Parquet).
- Active set fits in RAM, exotic structures → **in-memory** (Redis).
- *Always benchmark with your workload.*

**3. Replication** (Ch5)
- Read scaling, simple, single write path → **single-leader** (async for performance; accept stale follower reads + possible failover data loss).
- Multi-datacenter / offline / collaborative → **multi-leader** (handle write conflicts; prefer conflict avoidance / CRDTs).
- Max fault tolerance, tunable staleness, no failover → **leaderless quorums** (w+r>n; expect siblings + merge). *(Dynamo = leaderless paper; DynamoDB = single-leader product.)*
- Need read-your-writes / monotonic / consistent-prefix → add that specific guarantee (read from leader, pin to one replica, co-locate causal writes).

**4. Partitioning** (Ch6)
- Need range queries → **key-range** (watch hot spots; rebalance by split/merge).
- Need even distribution → **hash** (lose range queries; fixed # of partitions; move whole partitions; never `hash mod N`).
- Both → **compound key** (hash prefix + sort suffix).
- Secondary indexes: read-heavy on the term → **term-partitioned (global)**; write-heavy → **document-partitioned (local)**.
- Keep a **human in the loop** for rebalancing/failover to avoid cascades.

**5. Transactions / consistency** (Ch7, Ch9)
- Single-object atomic increment/CAS may suffice — don't reach for multi-object txns reflexively.
- Need FK / denormalized / secondary-index consistency → **multi-object transactions**.
- Default to **read committed**; add **snapshot isolation (MVCC)** for consistent reads (backups, analytics, integrity checks).
- Risk of **write skew / phantoms** → **serializable** (serial execution if small/fast & partitionable; SSI for scalable optimistic; 2PL otherwise).
- Need a single agreed value (locks, leader election, uniqueness) → **linearizability via consensus** (ZooKeeper/etcd). Often only **causal consistency** is truly needed (stays available under partitions).
- Cross-system atomicity → 2PC/XA (blocking, lowest-common-denominator) — prefer to avoid; consider idempotence + compensating transactions.

**6. Batch vs stream** (Ch10, Ch11)
- Bounded input, throughput-oriented, periodic, re-runnable → **batch** (MapReduce / Spark / Flink; immutable inputs, derived output, bulk-load not per-record writes).
- Unbounded input, low latency, continuous derived state → **stream** (Kafka log-based broker; CDC / event sourcing to sync derived systems).
- Keeping derived systems in sync → **CDC from one leader**; never **dual writes**.
- Need replayability + ordering → **log-based broker**; need per-message parallelism with unimportant order → **AMQP/JMS broker**.
- Exactly-once → idempotent writes keyed by message offset (+ fencing), or framework checkpointing / atomic single-object commit.

## Flashcard Review

*Final-night cramming — each is the load-bearing fact, stripped to its core. (Repositioned from the original one-liners.)*

- **Fault vs failure:** a fault is one component off-spec; a failure is the whole system not serving users. Build reliable systems from unreliable parts.
- **Percentiles, not means:** p50 = typical, p99/p999 = the tail (your most valuable users). +100ms ≈ −1% sales. Averaging percentiles is meaningless — add histograms.
- **Latency ≠ response time:** response time = service + network + queueing (what the client sees); latency = time spent waiting to be served.
- **Tail latency amplification:** one user request fans out to many backends → you wait for the slowest.
- **Backward compat** = new code reads old data (easy); **forward compat** = old code reads new data (trickier). Rolling upgrades need both.
- **Byte-size progression:** JSON 81 → MessagePack 66 → Thrift Binary 59 → Thrift Compact 34 → Protobuf 33 → Avro 32; each step drops redundancy (whitespace → names → fixed type/tag → varints → tags).
- **Avro** matches fields by name (no tags) → great for dynamically generated schemas; **Thrift/Protobuf** use numeric field tags (never reuse them).
- **db_set/db_get:** append-and-scan is the simplest DB — fast writes, O(n) reads; an index trades write speed for read speed.
- **LSM = random writes → sequential writes** (high throughput); **B-tree = update-in-place** (predictable reads, key in one place, WAL for crash safety).
- **In-memory DBs are fast not from skipping disk reads** (disk engines use the page cache too) **but from skipping the in-memory→disk encoding.**
- **Column storage** wins analytics: read only needed columns, compress with bitmaps, sort whole rows, vectorize.
- **Sync vs async replication:** async + failover can silently lose committed writes (the GitHub primary-key reuse incident).
- **Quorum: w + r > n** → read/write sets overlap. Still tunes *probability*, not a guarantee, of fresh reads.
- **Dynamo ≠ DynamoDB:** the paper is leaderless; the AWS product is single-leader.
- **Happens-before** defines causality; concurrency is about causal knowledge, not wall-clock overlap. Keep concurrent values as siblings, merge by union + tombstones.
- **Don't `hash mod N`** (123456 mod 10/11/12 all differ → moves everything). Use a fixed large number of partitions; only the assignment changes.
- **Consistent hashing** (Karger, CDN caches) ≠ ACID consistency, and works poorly for DBs.
- **The only isolation level that stops write skew is serializable.**
- **MVCC visibility:** ignore in-progress, aborted, and later txids' writes; an object is visible iff its creator committed-before-start and it isn't deleted-before-start.
- **SSI** = optimistic serializability: run on a snapshot, abort on commit if a premise went stale (stale-read case + write-affects-prior-read tripwire); no blocking, scales past one core.
- **2PL ≠ 2PC.** 2PL = serializable isolation (readers block writers); 2PC = atomic commit across nodes (blocks on coordinator failure; two points of no return).
- **In distributed systems, no response ≠ failure** — you cannot tell why a request didn't answer.
- **Two clocks:** monotonic for durations, time-of-day for timestamps. Time-of-day can jump backwards → LWW can't order causally.
- **TrueTime** waits out the confidence interval so later transactions' intervals can't overlap earlier committed ones → timestamps respect causality (~7ms uncertainty).
- **Truth is defined by the majority;** fencing tokens (monotonic, *checked by the resource*) stop a paused-then-resurrected node from corrupting data.
- **Server data systems can safely assume no Byzantine faults.**
- **Safety always, liveness eventually:** never return a wrong answer; progress only when a majority is up.
- **Linearizability** = recency on one object; **serializability** = some serial order over transactions; together = strict serializability. **SSI is not linearizable** (snapshot excludes recent writes).
- **Causal consistency is the strongest model that stays available under partitions** — often all you actually need.
- **Linearizability is slow always** (≥ proportional to network-delay uncertainty), not just during faults.
- **Linearizable CAS = total-order broadcast = consensus.** Build CAS from TOB (append claim, read log, first claim wins); build TOB from a gapless linearizable increment-and-get. Single-leader gives them free; needs consensus to *change* leaders.
- **Consensus needs a majority** (≥3 tolerates 1, ≥5 tolerates 2) and uses timeouts → variable-delay networks cause election storms. Epoch numbering + two overlapping quorums keep one current leader.
- **ZooKeeper/etcd:** outsourced consensus — linearizable locks/leases (the only part needing consensus), fencing tokens, failure detection via ephemeral nodes, watches.
- **Dual writes are broken;** use **CDC from one leader** to keep derived systems in sync.
- **State is the integral of the event stream; the changelog is its derivative.** "Truth is the log; the DB is a cache of the log." → event sourcing + CQRS.
- **Batch = bounded input, knows when done; stream = unbounded, never completes.**
- **Two broker types:** AMQP/JMS (per-message, deletes on ack, no replay) vs log-based/Kafka (whole partitions, offsets, replayable ring buffer; a slow consumer only hurts itself).
- **Three timestamps** for untrusted device clocks: occurred + sent (device) and received (server) → estimate the offset.
- **Exactly-once in streams** = idempotent writes keyed by message offset (+ fencing), or an atomic single-object commit of state + outputs + offset.
- **Build read-only DB files inside a batch job and bulk-load them** — never write to a live DB per record (slow, overwhelms the DB, breaks all-or-nothing, exposes speculative output).
- **Immutable inputs + full-replace output = human fault tolerance:** roll back buggy code and just re-run.
- **Stream processing is not inherently lossy** — probabilistic algorithms are a memory optimization.
- **If you can keep it on one machine, do** — distribution buys scale, fault tolerance, and latency, but costs you determinism.
