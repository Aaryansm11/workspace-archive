# DDIA Part III — Derived Data (Chapters 9–11)

> Source: *Designing Data-Intensive Applications* (Kleppmann). Covers Ch9 (end of Part II) + Part III intro + Ch10 Batch Processing + Ch11 Stream Processing.
> **NOTE:** Ch12 "The Future of Data Systems" (data integration, unbundling DBs, correctness/ethics) is **not present** in this source file — the book ends after Ch11 references (the final chapter appears as "???" placeholders throughout, i.e. a pre-publication copy). Only Ch9–11 are extractable.

---

# Chapter 9 — Consistency and Consensus

Core goal: find general-purpose abstractions with useful guarantees (like transactions hid crashes/races/disk failures) so apps can ignore distributed-systems problems. The most important: **consensus** = getting all nodes to agree on something. Reliably reaching consensus despite network faults and process crashes is surprisingly hard. Key use: leader election / failover (avoid **split brain** = two nodes both think they're leader → data loss).

## Consistency Guarantees
- **Eventual consistency** (better name: **convergence**): if writes stop, eventually all replicas return same value. Very weak — says nothing about *when*. Reads can return anything/nothing before convergence. Edge cases only appear under faults or high concurrency → bugs hard to find by testing.
- Stronger models cost performance / fault-tolerance but are easier to use correctly.
- Distributed consistency (coordinating replica state under delays/faults) is mostly independent from transaction isolation (avoiding race conditions between concurrent txns), though related.

## Linearizability
- AKA atomic consistency, strong consistency, immediate consistency, external consistency.
- **Definition / intuition:** make the system *appear as if there is only one copy of the data, and all operations on it are atomic*. It is a **recency guarantee**: once a write completes, all later reads (any client) see that value (or newer), never stale.
- **Constraint that makes it linearizable:** there is a single point in time at which a value atomically flips; once any read returns the new value, all subsequent reads (any client) must too. Operation "markers" joined in sequential order must only move forward in time.
- Operations modeled on a **register** (one key/row/document). Ops: `read(x)⇒v`, `write(x,v)⇒r`, `cas(x, vold, vnew)⇒r` (compare-and-set: atomically set if current==vold).
- A read concurrent with a write may return old OR new (this alone = **regular register**); linearizability adds the no-flip-back rule.
- Testable (expensive) by recording request/response timings and checking for a valid sequential order (Knossos/Jepsen).

### Linearizability vs. Serializability (don't confuse)
- **Serializability** = isolation property of *transactions* (multi-object); txns behave as if run in *some* serial order (order may differ from real order). Does not prevent stale reads of single objects.
- **Linearizability** = recency guarantee on single-object reads/writes; no grouping into txns, so does NOT prevent write skew (unless you materialize conflicts).
- Both = **strict serializability / strong-1SR**. 2PL and actual serial execution are typically linearizable. **SSI is NOT linearizable** (reads from a consistent snapshot deliberately exclude recent writes).

### When linearizability is required (use cases)
- **Locking & leader election:** the lock must be linearizable so all nodes agree who holds it. ZooKeeper/etcd use consensus to provide this. (Curator gives higher-level recipes.) Also fine-grained: Oracle RAC uses a lock per disk page.
- **Uniqueness constraints** (username, email, filename, seat booking, no-negative-balance, stock levels): need a single up-to-date value all nodes agree on — like a lock. CAS requires consensus.
- **Cross-channel timing dependencies:** if there's a second communication channel (Alice's voice; message queue + file storage in image-resizer), a non-linearizable store causes race conditions (resizer reads stale/missing image). Linearizability auto-preserves causality across channels.

### Alternatives to linearizability for constraints
You can often avoid it with **compensating transactions** + apology workflows (email "pick another username", order more stock + discount, overdraft fee with daily withdrawal cap). Foreign-key / attribute constraints don't need linearizability.

### Implementing linearizable systems (per replication method)
- **Single-leader (potentially linearizable):** reads from leader or synchronously-updated followers can be linearizable. BUT: must *know* who the leader is (a delusional old leader violates it); async failover can lose data (violates durability + linearizability); snapshot isolation breaks it. Partitioning (separate leader per partition) doesn't break it (single-object guarantee).
- **Consensus algorithms (linearizable):** prevent split-brain & stale replicas → safe linearizable storage. (ZooKeeper, etcd.)
- **Multi-leader (not linearizable):** concurrent writes on multiple nodes, async replication → conflicts.
- **Leaderless / Dynamo-style (probably not):** "strong consistency via quorums (w+r>n)" is not quite true. LWW (time-of-day clocks) is non-linearizable (clock skew). Sloppy quorums ruin it. Even strict quorums can be non-linearizable (race in Fig 9-6: reader B starts after reader A finishes but gets old value).
  - Can be made linearizable at perf cost: readers do **synchronous read repair** before returning; writers read latest quorum state before writing. Cassandra waits for read repair on quorum reads but loses it under concurrent LWW writes. Riak doesn't (perf). CAS still needs consensus.

### The cost of linearizability & CAP
- **Network interruption between datacenters:** single-leader → followers' DC can't reach leader → can't write or do linearizable reads (becomes unavailable). Multi-leader → keeps operating (writes queue and exchange later).
- **CAP theorem (Brewer 2000):** if app needs linearizability and replicas get partitioned, disconnected replicas must wait or error (unavailable). If app doesn't need it, each replica works independently (available, not linearizable). → "**C**onsistent or **A**vailable when **P**artitioned." (Better than "pick 2 of 3": partitions aren't a choice, they just happen.)
- CAP is narrow (only linearizability + only network partitions; ignores delays/dead nodes), uses an idiosyncratic definition of availability, and has **little practical value today**; best avoided (superseded by more precise results).
- **Linearizability is slow always, not just during faults** — and the cost is *performance*, not fault tolerance. Even multi-core CPU RAM isn't linearizable (caches/store buffers; need memory barriers/fences). **Attiya & Welch:** response time of linearizable read/write is *at least proportional to network delay uncertainty*. No faster algorithm exists; weaker models can be much faster.

## Ordering Guarantees
Ordering recurs everywhere: leader determines write order in replication log; serializability = some serial order; clocks/timestamps try to order events. Deep links between **ordering, linearizability, and consensus**.

### Causality
- Causality imposes a **partial order**: `A happened-before B` means B may depend on / build on A. Concurrent = neither happened-before the other (incomparable).
- "Consistent" snapshot = consistent with causality (if it has an answer it has the question). Read skew violates causality. SSI detects write skew by tracking causal dependencies.
- **Linearizability (total order) is stronger than causal consistency (partial order).** Linearizability implies causality (and auto-preserves it across channels).
- **Causal consistency is the strongest model that does NOT slow down under network delays and stays available under partitions** (CAP doesn't apply). Many systems that seem to need linearizability really only need causal consistency. Research area, not much in production yet.
- Tracking causality: need to know which version was read → version vectors generalized across the whole DB (not just one key). Similar to SSI conflict detection.

### Sequence number ordering
- Tracking all causal deps is impractical → use **sequence numbers / logical-clock timestamps** (counters, not time-of-day). Compact, total order. Can be made **consistent with causality** (if A→B then seq(A)<seq(B); concurrent ops arbitrary).
- Single-leader: leader increments counter → total order consistent with causality.
- **Non-causal generators** (multi-leader/leaderless/partitioned): odd/even per node, node-id bits, physical-clock timestamps (LWW), pre-allocated blocks. All scale better than one leader BUT are **inconsistent with causality** (counters lag between nodes; clock skew; block ranges out of order).

### Lamport timestamps (Lamport 1978)
- Pair **(counter, node ID)**; node ID breaks ties → unique + total order.
- **Key rule:** every node/client tracks the max counter it has seen and includes it on every request; on receiving a higher counter, a node bumps its own to that max. → every causal dependency raises the timestamp → total order consistent with causality.
- **Lamport ≠ version vectors:** version vectors can tell concurrent vs. causally-dependent; Lamport always forces a total order and can't distinguish.

### Total order broadcast (atomic broadcast)
- Timestamp ordering is insufficient for e.g. uniqueness constraints: total order only "emerges" after you've collected all ops; at decision time you can't know if another node is concurrently claiming the same username. Need to know **when the order is finalized**.
- **Total order broadcast** = protocol with two properties (must hold even under faults; messages keep retrying after network repair):
  1. **Reliable delivery:** no messages lost; if delivered to one node, delivered to all.
  2. **Totally ordered delivery:** messages delivered to every node in the same order.
- Order is **fixed at delivery time** — can't retroactively insert earlier. Stronger than timestamp ordering. Equivalent to a **log** (deliver = append).
- Uses: DB replication = **state machine replication** (same writes, same order → consistent replicas); serializable txns (deterministic stored procedures in same order); fencing-token lock service (seq number = fencing token; ZooKeeper's **zxid**). ZooKeeper/etcd implement total order broadcast.

### Linearizability ↔ total order broadcast
- Total order broadcast is **asynchronous** (fixed order, no recency guarantee); linearizability is a recency guarantee. Different but linked.
- **Build linearizable CAS from total order broadcast** (append-only log): (1) append your tentative claim; (2) read log, wait for your msg to come back; (3) if the first msg for that username is yours → commit, else abort. Gives linearizable writes; reads need extra work (this alone gives **sequential/timeline consistency**, slightly weaker). Make reads linearizable by: sequencing reads through the log; querying latest log position then waiting (ZooKeeper `sync()`); or reading from a synchronously-updated replica (chain replication).
- **Build total order broadcast from linearizable storage:** use a linearizable atomic **increment-and-get** (or CAS) register as a gapless sequence-number source; attach to each message; deliver consecutively (wait for gaps). Unlike Lamport, **no gaps** — key difference.
- **Proven:** linearizable CAS / increment-and-get register, total order broadcast, and **consensus are all equivalent**.

## Distributed Transactions and Consensus
Situations needing agreement: **leader election** (avoid split brain) and **atomic commit** (all nodes commit or all abort).

### FLP impossibility
- **FLP (Fischer–Lynch–Paterson):** no deterministic algorithm reliably achieves consensus if a node may crash — BUT only in a restrictive model (no clocks/timeouts). Allowing timeouts (failure suspicion) or randomness makes consensus solvable. In practice consensus is achievable.

### Atomic commit & Two-Phase Commit (2PC)
- Single-node atomicity: commit hinges on the moment the **commit record** is durably written (one disk on one node makes it atomic).
- Multi-node: can't just send commit to all independently (some commit, some abort → inconsistent; commit is **irrevocable**). 2PC = algorithm for atomic commit across nodes (all commit or all abort). Exposed to apps via **XA transactions** (JTA) / WS-AtomicTransaction.
- **2PC ≠ 2PL** (2PC = atomic commit; 2PL = serializable isolation).
- Uses a **coordinator / transaction manager** (often a library in the app process). Participants = the DB nodes.
- **Flow:** app gets globally-unique txn ID → does work on each participant tagged with txn ID → **Phase 1:** coordinator sends **prepare** to all; each participant durably writes all data + checks constraints, replies "yes" = *promise to commit without error if asked* (gives up right to abort). → coordinator writes commit/abort decision to its log = **commit point** → **Phase 2:** sends commit/abort; retries **forever** until success.
- **Two points of no return:** participant's "yes" vote, and the coordinator's decision. These promises give atomicity.
- **Coordinator failure:** after a participant votes yes but before hearing back, its txn is **in doubt / uncertain** — it cannot unilaterally commit or abort (timeout doesn't help). Must wait for coordinator to recover (which reads its log; txns without a commit record are aborted). 2PC is therefore a **blocking** protocol.
- **3PC** (non-blocking) needs bounded network delay + bounded response times + a **perfect failure detector**; impractical with unbounded delay. So 2PC remains in use.

### Distributed transactions in practice
- Mixed reputation: important safety vs. operational problems, killing performance. MySQL distributed txns ~10x slower (fsync forcing + extra round-trips). Many cloud services avoid them.
- Two types:
  - **Database-internal** (VoltDB, FoundationDB, MySQL Cluster NDB): same software everywhere → can optimize; works reasonably well; distributed SSI possible.
  - **Heterogeneous** (different vendors / non-DB e.g. message broker): much harder; must share one atomic commit protocol.
- **Exactly-once message processing:** atomically commit a message ack + the DB writes from processing it → effectively-once even with retries. Only works if all affected systems share the atomic commit protocol (e.g. email server lacking 2PC → emails could be sent multiple times).

### XA transactions
- **X/Open XA** (1991): a **C API** (not a network protocol) for interfacing with a transaction coordinator. Supported by Postgres, MySQL, DB2, SQL Server, Oracle; brokers ActiveMQ, HornetQ, MSMQ, IBM MQ. In Java = JTA over JDBC/JMS drivers.
- Coordinator is usually a library in the app process; logs commit/abort to local disk. If the app crashes, the coordinator dies with it → participants stuck in doubt; that server must restart and read the log to resolve.
- **Holding locks while in doubt:** in-doubt txns hold row-level exclusive locks (and shared locks under 2PL) until resolved — blocking other txns, possibly for minutes/forever (if log lost). Large parts of the app can become unavailable.
- **Orphaned in-doubt txns** (lost/corrupt log) require manual admin resolution. **Heuristic decisions** = let a participant unilaterally commit/abort = "probably breaking atomicity" — emergency only.

### Limitations of distributed transactions
- The coordinator is itself a **database** (stores outcomes) → needs the same care; often a **single point of failure**, frequently not HA by default.
- Coordinator logs become crucial durable state → app servers no longer stateless.
- XA is a **lowest common denominator**: can't detect cross-system deadlocks, doesn't work with SSI.
- 2PC needs **all** participants to respond → **amplifies failures** (any broken part fails the whole txn), counter to fault tolerance.

### Fault-tolerant consensus
- Formal consensus: one or more nodes **propose** values; algorithm **decides** one. Properties:
  - **Uniform agreement:** no two nodes decide differently.
  - **Integrity:** no node decides twice.
  - **Validity:** if a node decides v, v was proposed by some node.
  - **Termination:** every non-crashed node eventually decides. (Termination = **liveness**; the other three = **safety**.)
- A hard-coded "dictator" satisfies the first three but not termination (like 2PC coordinator failure).
- **Termination requires a majority** of nodes functioning (assumes < half crashed). Safety properties hold even if a majority fails or there's a severe partition — a big outage can stop progress but cannot corrupt decisions.
- Most algorithms assume **no Byzantine faults**; can be made Byzantine-tolerant if < 1/3 nodes are faulty (rare in practice).

### Consensus algorithms & total order broadcast
- Best-known: **Viewstamped Replication (VSR), Paxos, Raft, Zab.** Similar but not identical. (Don't implement your own — it's hard.)
- Most decide a **sequence** of values → they are **total order broadcast** algorithms (= repeated rounds of consensus). VSR/Raft/Zab implement it directly; Paxos's version = **Multi-Paxos** (more efficient than one-value-at-a-time).
- Total order broadcast properties map to consensus: agreement→same order; integrity→no dup; validity→no corruption; termination→no loss.

### Single-leader replication & consensus
- Manual leader = "dictator" consensus (no termination — needs humans). Automatic failover gets closer to fault-tolerant total order broadcast.
- Chicken-and-egg: to elect a leader you need consensus, but consensus algorithms use a leader. Solved with **epoch numbering**:
  - Epoch = ballot (Paxos) / view (VSR) / **term** (Raft). Within each epoch the leader is unique; epochs are totally ordered & monotonically increasing; higher epoch wins.
  - For each decision the leader must collect votes from a **quorum** (majority); a node votes only if unaware of a higher-epoch leader. Two majorities (election + proposal) overlap → at least one voter has seen any newer election → leader knows it still holds leadership.
  - vs 2PC: consensus needs only a **majority** (not every participant) and has a recovery process.

### Limitations of consensus
- Voting = synchronous replication (perf cost; many DBs accept async + possible data loss for speed).
- Needs a **strict majority**: ≥3 nodes to tolerate 1 failure, ≥5 to tolerate 2. Minority partition is blocked.
- Fixed membership; dynamic membership extensions are less well understood.
- Rely on **timeouts** to detect failed nodes → in geo-distributed / variable-delay networks, false leader-failure → frequent elections → terrible performance (more time electing than working). Raft has bad edge cases with one consistently unreliable link (leadership bounces). Robustness to unreliable networks = open research.

### Membership & Coordination services (ZooKeeper / etcd)
- They look like key-value stores but implement consensus. Apps rarely use them directly — used indirectly via HBase, Hadoop YARN, OpenStack Nova, Kafka. Modeled after Google's **Chubby**.
- Hold **small** data (fits in memory, but persisted), replicated via fault-tolerant total order broadcast. Run on a fixed small number (usually 3 or 5) doing majority votes, serving many clients — "outsourced" coordination.
- Features (only the first truly needs consensus, but the combo is what's useful):
  - **Linearizable atomic operations** (CAS) → distributed lock, usually a **lease** with expiry.
  - **Total ordering** → monotonically increasing **zxid** / version (`cversion`) = fencing tokens.
  - **Failure detection** via long-lived sessions + heartbeats; locks tied to **ephemeral nodes** auto-deleted on session timeout.
  - **Event notifications** (watches) → learn of node joins/failures without polling.
- Use cases: leader/primary election; **allocating partitioned work to nodes** (rebalancing via atomic ops + ephemeral nodes + watches). Data is slow-changing ("node X is leader for partition 7"), NOT runtime app state (use BookKeeper for that).
- **Service discovery:** ZooKeeper/etcd/Consul; but discovery likely **doesn't require consensus** (DNS-style stale-but-available reads are fine). Leader election *does* need consensus. Some systems offer **read-only caching replicas** (async, non-voting) for non-linearizable reads.
- **Membership service:** agreement on which nodes are live (couple failure detection with consensus). Can wrongly declare a live node dead, but agreement is still valuable (e.g. pick lowest-numbered member as leader).

### Consensus summary — problems reducible to / equivalent to consensus
Linearizable CAS register · atomic transaction commit · total order broadcast · locks/leases · membership/coordination service · uniqueness constraint. All trivial on a single node / single leader (which is why single-leader DBs give linearizability, uniqueness, ordered replication log). On leader failure: (1) wait (no termination — XA/JTA), (2) manual failover (relational DBs), (3) automatic via consensus algorithm. A single-leader DB still needs consensus to **maintain leadership / change leaders** ("kicks the can down the road"). Not everything needs consensus — leaderless/multi-leader cope without it by tolerating branching/merging version histories.

---

# Part III Intro — Derived Data

Real apps combine many datastores (DBs, indexes, caches, analytics) and move data between them. Two categories:
- **Systems of record (source of truth):** authoritative; new data written here first; each fact represented once (normalized). If discrepancy, system of record wins.
- **Derived data systems:** result of transforming data from another system; **re-creatable** from the source if lost. Examples: caches, denormalized values, indexes, materialized views, ML/recommendation summaries. Redundant but essential for read performance.
- A DB is just a tool — system-of-record vs derived depends on **how you use it**. Being explicit about which data derives from which brings clarity to architecture (running theme of Part III).
- Ch10 = batch dataflow (MapReduce etc.); Ch11 = same ideas with lower delay (streams).

---

# Chapter 10 — Batch Processing

Three system types by performance measure:
- **Services (online):** wait for request, respond ASAP; measure = **response time**; availability key.
- **Batch (offline):** take large bounded input, run job, produce output; runs minutes→days, scheduled; measure = **throughput**.
- **Stream (near-real-time / nearline):** between the two; operates on events shortly after they happen → lower latency than batch.

MapReduce (Google 2004; Hadoop/CouchDB/MongoDB) — declining importance but a clear lens on batch processing. Resembles old IBM card-sorting machines (history repeats).

## Batch Processing with Unix Tools
- Example: top-5 pages via `awk '{print $7}' | sort | uniq -c | sort -r -n | head -n 5`. Processes GBs in seconds, easy to modify.
- **Sorting vs in-memory aggregation:** the Ruby hash-table approach needs working set in memory (depends on # distinct keys); the **sort** approach spills to disk efficiently (mergesort = sequential I/O, GNU `sort` parallelizes across cores + spills) → scales beyond memory. Bottleneck = disk read rate.
- **Unix philosophy** (McIlroy 1964; 1978): (1) each program does one thing well; (2) expect output to be another program's input — avoid columnar/binary/interactive formats; (3) build/test early, throw away clumsy parts; (4) use tools to lighten tasks. ≈ Agile/DevOps. `sort` does one thing well, becomes powerful only combined (e.g. with `uniq`).
- **Uniform interface = the file (file descriptor)** = ordered byte sequence; works for files, pipes, sockets, devices. By convention ASCII text, records separated by `\n`. Enables composability. (Web's URLs+HTTP = analogous uniform interface.)
- **Separation of logic and wiring:** programs use **stdin/stdout**; shell wires them up (loose coupling / inversion of control). Limits: hard with multiple in/outputs; can't pipe to a network connection without extra tools (netcat/curl).
- **Transparency/experimentation:** inputs immutable (re-run safely), pipe into `less` to inspect, write a stage to a file to restart from there. Biggest limitation: **single machine only** → Hadoop.

## MapReduce and Distributed Filesystems
- MapReduce ≈ Unix tools distributed across thousands of machines. A job takes inputs → produces outputs; doesn't modify input; output written once, sequentially.
- Reads/writes a **distributed filesystem**: **HDFS** (open-source GFS). **Shared-nothing**: each machine's disks pooled into one big FS; daemon per machine; central **NameNode** tracks block→machine. Blocks **replicated** (copies, or erasure coding e.g. Reed-Solomon for lower overhead). Contrast NAS/SAN (centralized shared storage appliance). Scaled to tens of thousands of machines / hundreds of PB on commodity HW. S3/Azure Blob/Swift are similar (but object stores separate storage from compute, losing data-locality scheduling).

### Job execution
- 4 conceptual steps (mirror the Unix example): read input → break into records; **map**: extract (key,value) from each record (0+ pairs); sort by key (implicit, you don't write it — most important aspect); **reduce**: framework groups by key, calls reduce with an iterator over values for that key.
- Parallelized by **partitioning**: each input file/block → a separate mapper task. **Put computation near the data** (run mapper on a machine holding a replica → save network).
- # map tasks = # input blocks; # reduce tasks = configured by author. Framework copies code (jars) to machines, runs map, emits key-value pairs.
- To get same keys to same reducer, framework uses **hash of key** → reduce partition. Each mapper partitions its output by reducer, writes sorted files to local disk (SSTable-like). When mapper done, reducers **fetch** (the **shuffle** = partition-by-reducer + sort + copy). Reducer merges sorted files preserving order; reduce called per key with an iterator (may exceed memory). Output written to HDFS (local replica + replicas elsewhere).

### Workflows
- One job is limited → chain into **workflows** (output dir of one = input dir of next; chaining via directory names, implicit). Unlike Unix pipes, intermediate state is fully written to temp files. Job only starts when all dependency jobs **succeeded** (failed jobs' partial output discarded). Workflow schedulers: **Oozie, Azkaban, Luigi, Airflow, Pinball**. Recommendation systems often 50–100 jobs. Higher-level tools: **Pig, Hive, Cascading, Crunch, FlumeJava**.

### Joins & grouping
- Batch join = resolve **all** occurrences of an association (full table scan of all users at once), not per-user lookup (which an index would do). Querying a remote DB per record = too slow + non-deterministic + can overwhelm DB. Better: take a **copy** of the DB (ETL) into the same distributed FS.
- **Reduce-side sort-merge join:** mappers emit (user_id, value) from both datasets; partition+sort makes records with same key adjacent at the reducer; **secondary sort** can ensure the DB record arrives before activity events; reducer joins with low memory, no network. Mappers "send messages" to reducers (key = destination address). Separates network communication from app logic; framework handles partial failures (transparent retries).
- **GROUP BY / aggregation:** same "bring related data together" pattern (count, sum, top-k). **Sessionization** = group activity by session/user (e.g. A/B testing).
- **Handling skew (hot keys / linchpin objects, e.g. celebrities):** one overloaded reducer delays the whole job.
  - **Skew join** (Pig) / **sharded join** (Crunch): send hot-key records to a *random* reducer; replicate the other join input's hot-key records to all reducers.
  - Skewed **grouping**: two-stage — first stage sends to random reducers (partial aggregates), second combines.

### Map-side joins (no reducers, no sorting; mapper reads a block, writes a block)
Faster if you can make assumptions about input.
- **Broadcast hash join:** large dataset ⋈ small dataset that fits in memory; each mapper loads the small input into an in-memory hash table, scans the large input. (Pig "replicated join", Hive "MapJoin", also Impala.) Alternative: small input as read-only index on local disk (OS page cache).
- **Partitioned hash join (bucketed map join in Hive):** both inputs partitioned the same way (same key, hash fn, # partitions) → join each partition independently; each mapper loads only its partition.
- **Map-side merge join:** inputs partitioned AND sorted the same way → mapper merges incrementally (like a reducer would), no memory limit.
- Output of reduce-side join is partitioned/sorted by join key; map-side join output is partitioned/sorted like the large input. Need to know physical layout (partitions, sort keys) — kept in **HCatalog / Hive metastore**.

### Output of batch workflows
Neither OLTP nor analytics; closer to analytics (scans large input) but output is usually a data structure, not a report.
- **Search indexes:** Google's original use (5–10 jobs); mappers partition docs, each reducer builds index for its partition (document-partitioned, parallelizes well; immutable once built). Rebuild wholesale, or incrementally (Lucene segment files).
- **Key-value stores as output:** build ML models / recommendation DBs. Don't write to the production DB from inside the job (per-record network requests slow; concurrent writers overwhelm DB; breaks the all-or-nothing guarantee + exposes partial output / speculative execution). Instead **build the DB files inside the job**, write to HDFS, then bulk-load read-only (Voldemort, Terrapin, ElephantDB, HBase bulk loading). No WAL needed (immutable). Voldemort: serve old files while copying new, then atomic switch; easy rollback.
- **Philosophy** (like Unix): inputs immutable, output fully replaces previous, no side effects → **human fault tolerance** (roll back buggy code & re-run; keep old output dir to switch back — read/write DBs can't do this); minimize irreversibility → faster feature dev; automatic retry safe; same files reused by many jobs (incl. monitoring); separation of logic/wiring. Differences from Unix: structured formats (**Avro, Parquet**) instead of untyped text → schema-based encoding + schema evolution.

### MapReduce vs distributed (MPP) databases
- MapReduce paper wasn't new — MPP DBs (Gamma, Teradata, Tandem NonStop SQL) had parallel join algorithms a decade earlier. Biggest difference: MPP = parallel **analytic SQL**; MapReduce+DFS = general-purpose "OS" running arbitrary programs.
- **Diversity of storage:** DFS stores raw bytes/any model → "dump data now, figure out processing later" (**schema-on-read**, "**data lake**" / "**sushi principle: raw data is better**"); MPP needs careful up-front schema (schema-on-write). Shifts interpretation burden to the consumer. Hadoop often used for ETL into MPP warehouses.
- **Diversity of processing models:** not all processing fits SQL (ML, full-text relevance, image analysis → need arbitrary code). MapReduce lets engineers run their own code; many models (incl. SQL via Hive) coexist on the same shared cluster/files (HBase OLTP, Impala MPP-style — both on HDFS, neither uses MapReduce). No need to import into specialized systems.
- **Designing for frequent faults:** MPP aborts & retries whole query on node failure, keeps data in memory (hash joins). MapReduce tolerates per-task failure (retry one task), eagerly writes to disk → suited for very large/long jobs. **Why frequent failures matter at Google:** mixed-use datacenters; batch jobs run at **low priority** and can be **preempted** (~5% chance/hour, > order of magnitude above hardware failures); a 100-task/10-min job has >50% chance of a preemption → must tolerate frequent termination for better cluster utilization. Open-source schedulers (YARN, Mesos, Kubernetes) rarely do general priority preemption → MapReduce's design makes less sense there.

## Beyond MapReduce
MapReduce is a useful learning tool but hard to use directly (implement joins from scratch) and slow for some workloads.
- **Materialization of intermediate state:** MapReduce fully **materializes** intermediate state to HDFS (good for widely-shared/reused datasets, loose coupling). Downsides vs Unix pipes: a job can't start until all preceding tasks finish (stragglers slow the whole workflow); mappers often redundant (just re-read reducer output).
- **Dataflow engines (Spark, Tez, Flink):** handle the whole workflow as one job. Functions = **operators** (not just map/reduce); connect operators by: repartition+sort (sort-merge join/grouping), partition-without-sort (partitioned hash join), or broadcast (broadcast hash join). Advantages: sort only where needed; avoid redundant map tasks; scheduler sees the whole DAG → locality optimizations; intermediate state in memory / local disk (less I/O than HDFS replication); operators start as soon as input ready; reuse JVM processes. Same code can run on MapReduce or Tez (config change). Tez = thin (uses YARN shuffle); Spark/Flink = full frameworks.
- **Fault tolerance:** MapReduce recovers by re-reading materialized HDFS input. Spark/Flink/Tez **recompute** lost intermediate state from ancestry — Spark **RDD** (resilient distributed dataset) tracks ancestry; Flink **checkpoints** operator state. Requires **deterministic** operators (else recomputed data differs → must kill+rerun downstream; cascading faults). Non-determinism creeps in via hash-table iteration order, randomness, clocks, external sources (fix: seeded PRNG). If recomputation is expensive vs. data size, materialize instead.
- Dataflow engines ≈ Unix pipes; Flink built on **pipelined execution** (incremental). But sorting must consume full input before output → accumulates state. Inputs/outputs still usually HDFS (immutable in, fully replaced out); improvement = no intermediate HDFS writes.

### Graphs & iterative processing
- Batch graph analysis (PageRank, transitive closure) traverses edges, propagates info, repeats until convergence. "Repeat until done" doesn't fit plain MapReduce (single pass). Iterative approach with external scheduler re-running jobs is inefficient (re-reads whole dataset each iteration).
- **Note:** dataflow engines arrange *operators* as a **DAG** — that's NOT graph processing (data there is relational tuples; in graph processing the *data* is a graph).
- **Pregel model (Bulk Synchronous Parallel / BSP):** Apache Giraph, Spark GraphX, Flink Gelly. One vertex "sends a message" to another (along edges); each iteration a function is called per vertex with incoming messages; **vertex remembers state in memory between iterations** (only processes new messages); no messages = no work. Like the actor model but state/messages are fault-tolerant & durable, communication in fixed rounds.
  - **Fault tolerance:** messages batched; framework guarantees **exactly-once** message processing per iteration despite unreliable network; achieved by periodic **checkpointing** of all vertex state to durable storage (roll back to last checkpoint; or selectively recover lost partition if deterministic + messages logged).
  - **Parallel execution:** "think like a vertex"; framework partitions graph (usually by hash of vertex ID — no locality). → lots of cross-machine communication; intermediate state (messages) often bigger than the graph → can be slow. If graph fits in memory/disk on one machine, single-machine (GraphChi) often beats distributed. Distributed (Pregel) only when graph too big for one machine.

### High-level APIs and languages
- Hive/Pig/Cascading/Crunch (less code; portable to Tez without rewrite); Spark/Flink have their own dataflow APIs (à la FlumeJava). Relational-style building blocks (join, group, filter, aggregate). Allow **interactive** use (shell, incremental) — good for exploration; ≈ Unix philosophy.
- **Move toward declarative:** cost-based **query optimizers** (Hive, Spark, Flink) auto-pick join algorithms & reorder joins to minimize intermediate state. But MapReduce/dataflow keep **function callbacks** → can call arbitrary code (parsing, NLP, image, statistics) using existing library ecosystems (Maven/npm/Rubygems) — long distinguished them from MPP DBs. Declarative features also help simple filter/select: column-oriented reads, **vectorized execution** (tight CPU-cache-friendly loops, avoid per-record calls; Spark generates JVM bytecode, Impala uses LLVM native code). → batch frameworks start looking like MPP DBs while keeping flexibility.
- **Domain specialization:** reusable building blocks for ML/numerical (**Mahout** on MapReduce/Spark/Flink; **MADlib** inside MPP), spatial (k-nearest-neighbors), genome (approximate string search). Batch engines and MPP DBs converging — "all just systems for storing and processing data."

## Ch10 Summary (key reusable points)
- Design principles inherited from Unix: immutable inputs, output → another program's input, compose small tools. Uniform interface: files+pipes (Unix) → distributed FS (MapReduce).
- Two core problems: **partitioning** (bring related data together) + **fault tolerance** (MapReduce writes to disk → easy task-level recovery but slow; dataflow keeps more in memory → recomputes more; deterministic operators reduce recompute).
- **Join algorithms:** sort-merge (reduce-side), broadcast hash (small input in memory), partitioned hash (both inputs co-partitioned).
- Restricted programming model (stateless callbacks, no external side effects) lets the framework hide distributed-systems problems: safe retries, discard failed output, only one successful attempt's output is visible → stronger semantics than online services.
- Batch job's defining feature: reads **bounded** input, produces derived output without modifying input; knows when it's done → eventually completes. (Next: streams = **unbounded** input, never complete.)

---

# Chapter 11 — Stream Processing

Batch artificially divides unbounded data into fixed chunks (daily/hourly) → results lag. Process more frequently / continuously → **stream processing**. A **stream** = data incrementally available over time (stdin/stdout, lazy lists, file APIs, TCP, audio/video).

## Transmitting Event Streams
- Batch record → stream **event**: small, self-contained, immutable object describing something that happened at a point in time (usually with a timestamp). Encoded as text/JSON/binary.
- Generated once by a **producer** (publisher/sender), processed by multiple **consumers** (subscribers/recipients). Related events grouped into a **topic / stream**.
- **Polling** a datastore for new events is expensive at low latency (low hit rate, high overhead). Better: **notify** consumers. DB triggers exist but are limited/afterthought → specialized **messaging systems**.

### Messaging systems (publish-subscribe)
A direct producer→consumer channel (Unix pipe / TCP) is 1:1; messaging systems allow many producers & many consumers per topic. Two key differentiating questions:
1. **Producers faster than consumers?** Options: **drop** messages, **buffer** in a queue (what if queue exceeds memory? spill to disk → perf impact), or **backpressure / flow control** (block producer — Unix pipes & TCP do this).
2. **Nodes crash / go offline?** Messages lost? Durability needs disk writes and/or replication (a cost). Acceptability is app-dependent: occasional missing sensor reading OK; counting events → reliable delivery important.
- Batch's strong reliability (auto-retry, discard partial output → exactly-once visible effect) is the goal to replicate in streaming.

### Direct messaging (producer→consumer, no intermediary)
- **UDP multicast** (finance/stock feeds, low latency; app-level recovery of lost packets).
- Brokerless libs: **ZeroMQ, nanomsg** (pub-sub over TCP/IP multicast).
- **StatsD/Brubeck** (unreliable UDP metrics — counters only correct if all received).
- Direct **HTTP/RPC push**: **webhooks** (register a callback URL, called on each event).
- Limitation: app must tolerate message loss; assume producers/consumers constantly online. Offline consumer misses messages; producer crash loses retry buffer.

### Message brokers (message queues)
- A **database optimized for message streams**, running as a server; producers/consumers are clients. Centralizes data → tolerates clients coming/going; durability moved to broker (memory-only or disk). Faced with slow consumers, generally allow **unbounded queueing**.
- **Consumers asynchronous:** producer only waits for broker to buffer (not for processing).
- **Brokers vs databases:**
  - Brokers **auto-delete** a message once successfully delivered (not for long-term storage); DBs keep data until explicitly deleted.
  - Brokers assume **small working set** (short queues); large backlogs degrade throughput.
  - DBs have secondary indexes/queries; brokers offer topic-pattern subscriptions.
  - DB queries = point-in-time snapshot (won't notify you of later changes unless you re-poll); brokers **notify** clients of new messages but don't support arbitrary queries.
  - Some brokers do 2PC (XA/JTA). Traditional view standardized in **JMS, AMQP**; impls: RabbitMQ, ActiveMQ, HornetQ, Qpid, TIBCO EMS, IBM MQ, Azure Service Bus.

#### Multiple consumers patterns
- **Load balancing:** each message → one consumer (share work, parallelize expensive processing). AMQP: multiple clients on same queue; JMS: shared subscription.
- **Fan-out:** each message → all consumers (independent "tune in"; ≈ several batch jobs reading same file). JMS topic subscriptions; AMQP exchange bindings.
- Can combine (multiple consumer groups, load-balanced within each).

#### Acknowledgements & redelivery
- Consumer must **ack** after processing so broker can remove the message. No ack (closed/timed-out connection) → broker **redelivers** to another consumer (may double-process if the ack was just lost → needs atomic commit protocol).
- **Load balancing + redelivery reorders messages:** if consumer 2 crashes on m3 while consumer 1 does m4, m3 redelivered to consumer 1 → order m4,m3,m5. Even with order-preserving brokers (JMS/AMQP), this combo reorders. Fine if messages independent; problematic with causal dependencies.

### Partitioned logs (log-based message brokers)
- Traditional broker = transient (deletes after delivery → can't replay; new consumer gets only future messages). DBs/files = durable (read arbitrarily far back). **Log-based brokers** combine durable storage + low-latency notification.
- **Log** = append-only sequence of records on disk. Producer appends; consumer reads sequentially; at end, waits for notification (`tail -f` style).
- **Partition** the log (Ch6) across machines; group partitions into a topic. Within a partition, each message gets a monotonically increasing **offset** (sequence number); messages in a partition are totally ordered; **no ordering across partitions**.
- Examples: **Apache Kafka, Amazon Kinesis Streams, Twitter DistributedLog**. Millions of msgs/sec via partitioning + replication for fault tolerance.

#### Logs vs traditional messaging
- Fan-out trivial (consumers read independently). Load balancing = assign whole **partitions** to nodes in a consumer group (each partition read sequentially, single-threaded). Downsides: parallelism ≤ # partitions; one slow message blocks subsequent messages in that partition (**head-of-line blocking**).
- **Use JMS/AMQP** when messages expensive to process, want per-message parallelism, ordering not important. **Use log-based** when high throughput, fast per-message processing, ordering important.
- **Consumer offsets:** all messages below current offset processed; broker only periodically records the offset (not per-message acks) → less bookkeeping, batching/pipelining → higher throughput. Like the log sequence number in DB replication (broker ≈ leader, consumer ≈ follower). Failover: another node resumes at last offset (may reprocess a few → handled later).
- **Disk usage:** log split into **segments**; old segments deleted/archived → bounded **circular/ring buffer** on disk. Slow consumer past a deleted segment misses messages. (Back-of-envelope: 6 TB drive @ 150 MB/s ≈ 11 hours of buffer at max write rate; in practice days/weeks.) Monitor consumer lag, alert before it misses; a slow consumer only affects itself (big operational advantage).
- **Replaying old messages:** consuming is read-only (non-destructive). Offset under consumer control → start a copy at yesterday's offset, output elsewhere, vary code — repeatable, like batch. Good for integrating dataflows, experimentation, recovery from bugs.

## Databases and Streams
- A DB write is an event that can be captured. A **replication log** is already a stream of write events. **State machine replication:** same events, same order, deterministic processing → same final state — just event streams again.

### Keeping systems in sync
- Same data lives in OLTP DB + cache + search index + warehouse → must stay in sync. ETL = batch full copy. Faster alternative: **dual writes** (app writes to each system).
- **Dual writes are broken:** (1) **race condition** — concurrent writes (X=A vs X=B) can arrive in different orders at DB vs index → permanently inconsistent, silently (unless version vectors). (2) **partial failure** — one write succeeds, other fails (atomic commit problem, expensive). No single leader determines order. Fix: make one system the leader, others followers.

### Change Data Capture (CDC)
- Observe all DB changes and extract them in a replicable form, ideally as an immediate **stream**. Replication logs were long an internal detail, not a public API — CDC exposes them.
- Makes the source DB the **leader**, derived systems (search index, warehouse) **followers** — just consumers of the change stream. A log-based broker preserves ordering (avoids the redelivery reorder issue).
- **Implementation:** triggers (fragile, high overhead) or parsing the replication log/WAL/binlog (robust but must handle schema changes). LinkedIn **Databus**, Facebook **Wormhole**, Yahoo **Sherpa**; **Bottled Water** (Postgres WAL), **Maxwell/Debezium** (MySQL binlog), **Mongoriver** (MongoDB oplog), **GoldenGate** (Oracle).
- Usually **asynchronous** → source not slowed by slow consumers, but all replication-lag issues apply.
- **Initial snapshot:** can't keep all changes forever; to build a new index you need a **consistent snapshot** at a known **log offset**, then apply changes from there.
- **Log compaction:** storage engine periodically keeps only the most recent value per key (null = deletion/tombstone). Disk usage ∝ current DB contents, not # writes. Lets a new consumer start from offset 0 and get a full DB copy without a separate snapshot. Supported by **Kafka** → broker usable as durable storage.
- **API support for change streams:** RethinkDB (query subscriptions), Firebase, CouchDB (change feeds), Meteor (MongoDB oplog). **Kafka Connect** integrates CDC tools with Kafka.

### Event sourcing (Domain-Driven Design community)
- Store all changes to **application state** as a log of change events. vs CDC:
  - **CDC:** app uses DB mutably (update/delete); log extracted at low level; app unaware.
  - **Event sourcing:** app logic explicitly built on **immutable events**; event store append-only; events designed to mirror **application-level intent** (e.g. "username registered", not "row updated").
- Similar to chronicle data model and a star-schema fact table. Tools: **Event Store** (or any DB / log broker).
- **Deriving current state:** users want current state, not history → transform the event log into application state via deterministic logic (re-runnable). **Log compaction differs:**
  - CDC event = whole new record → keep only latest per key (compaction works).
  - Event sourcing events = intent, later events don't override prior → **need full history**; compaction not possible the same way. Use **snapshots** as a performance optimization (intend to keep all raw events forever, re-process when needed).
- **Commands vs events:** a user request is first a **command** (may fail validation). Validate **synchronously**; if accepted it becomes an **event** = durable, immutable **fact**. Consumers cannot reject events. (Alternatively split into tentative event + later confirmation event for async validation.)

### State, streams, immutability
- Mutable state = result of an immutable event stream over time. Mutable state and an append-only immutable event log are **two sides of the same coin** (the **changelog** = evolution of state).
- Math analogy: app state = **integral** of the event stream; change stream = **derivative** of state by time. (Pat Helland: "The truth is the log. The database is a cache of a subset of the log.")
- **Advantages of immutable events:** auditability (like accountants' append-only ledgers — fix mistakes with **compensating** transactions, never erase); recovery from buggy code (append-only log easy to inspect/recover vs destructive overwrite); captures **more information** than current state (e.g. item added then removed from cart still useful for analytics).
- **Deriving multiple views** from one event log → run new read-optimized views alongside old without modifying them; easier than schema migration (run side-by-side, then retire old). Separating write form from read form → **CQRS** (Command Query Responsibility Segregation). Makes normalization/denormalization debate largely irrelevant — denormalize freely in read views since the translation keeps them updated. (Twitter home timelines = read-optimized, highly denormalized, kept in sync by fan-out.)
- **Concurrency control:** event-log consumers are async → user may not see own write in a derived view ("read your own writes" problem). Solutions: update read view synchronously with append (needs txn / same store / distributed txn), or total-order-broadcast approach. Event sourcing simplifies concurrency: design each event as a **self-contained** user action → single append in one place (easy to make atomic); if log & state partitioned the same way, a single-threaded consumer needs **no concurrency control** (processes one event at a time; log defines serial order).
- **Immutability & deletion:** Datomic/git/Mercurial/Fossil rely on immutable data. But sometimes you must truly delete (privacy/GDPR, leaks) — not enough to append a "deleted" event; you must **rewrite history** (Datomic **excision**, Fossil **shunning**). Truly deleting is hard (copies in storage engines, SSDs, backups) — more "harder to retrieve" than "impossible."

## Processing Streams
Three things to do with a stream: (1) write to a DB/cache/index/store for querying; (2) push to users (email/push/dashboard); (3) **process input streams → output streams** (pipelines). A processor = **operator / job**: reads input read-only, writes output append-only. Partitioning/parallelization similar to MapReduce; mapping/filtering same. Crucial difference: a **stream never ends** → no sort-merge joins; can't just restart a years-running job from the beginning.

### Uses
- Monitoring: fraud detection, trading, manufacturing fault detection, military/intelligence — sophisticated pattern matching.

#### Complex Event Processing (CEP) — 1990s
- Search for **event patterns** (like regex for events). Declarative query language (often SQL) or GUI; engine maintains a state machine; emits a **complex event** on match.
- **Inverted relationship:** queries are stored long-term, events flow past them (DBs store data, treat queries as transient). Impls: **Esper, IBM InfoSphere Streams, Apama, TIBCO StreamBase, SQLstream.**

#### Stream analytics
- Aggregations/statistical metrics over many events (rate, rolling average, compare to prior intervals). Computed over **windows**.
- Often use **probabilistic algorithms**: bloom filters (set membership), **HyperLogLog** (cardinality), percentile estimators — less memory, approximate. (Stream processing is NOT inherently lossy/approximate.)
- Frameworks: Apache Storm, Spark Streaming, Flink, Concord, Samza, Kafka Streams; hosted: Google Cloud Dataflow, Azure Stream Analytics.

#### Maintaining materialized views
- CDC/event-sourcing keeping caches/indexes/warehouses up-to-date = maintaining **materialized views**. Unlike analytics, needs **all** events ever (a window stretching back to the beginning of time, post log compaction), not just a recent window. Samza/Kafka Streams support this (Kafka log compaction).

#### Search on streams
- Search **individual events** by complex criteria (full-text). Media monitoring / real-estate alerts: query stored in advance, documents run past queries (inverse of normal search). Optimize by **indexing the queries** too.

#### Message passing & RPC vs stream processing
- Actor frameworks (concurrency/distributed execution; ephemeral 1:1; arbitrary cyclic patterns) ≠ stream processors (data management; durable multi-subscriber; acyclic pipelines). Cross-over: Storm **distributed RPC** (user queries interleaved with event streams); can build stream processors on actors (check fault-tolerance guarantees).

### Reasoning about time
- Batch uses the **timestamp in each event** (deterministic; re-run = same result), not the system clock. Many stream frameworks default to the local **processing-time** clock (simple, OK if processing lag negligible) — breaks down with lag.
- **Event time vs processing time:** delays from network faults, broker/processor contention, consumer restart, reprocessing/backfill. Also **out-of-order** messages (B's event reaches broker before A's). Analogy: watching Star Wars in release order ≠ narrative order. **Confusing the two → bad data:** a restarted processor measuring rate by processing time shows a false spike while clearing the backlog, though the real rate was steady.
- **Knowing when a window is complete:** you can never be sure all events for a window have arrived (stragglers may be buffered elsewhere). Options for stragglers: (1) **ignore** them (track/alert on dropped count); (2) **recompute & issue a correction** (retract previous output). **Low watermark** = "no more messages with timestamp earlier than t" — wait for it before closing a window; but client-generated timestamps can still produce stragglers below the watermark.
- **Whose clock?** Mobile app offline buffers events for hours/days → appear as extreme stragglers; device clocks untrusted (may be wrong). Fix: log **three timestamps** — event occurred (device clock), event sent (device clock), event received (server clock) → estimate device-server offset → estimate true event time. (Batch has the same issue, just less noticeable.)
- **Window types:**
  - **Tumbling:** fixed length, every event in exactly one window (round timestamp to interval).
  - **Hopping:** fixed length, **overlapping** (5-min window, 1-min hop) for smoothing.
  - **Sliding:** all events within an interval of each other (no fixed boundaries); buffer sorted by time, drop expired.
  - **Session:** no fixed duration; group same-user events that occur close together; ends after inactivity (e.g. 30 min). For website analytics (sessionization).

### Stream joins (harder than batch — events can appear anytime)
- **Stream-stream join (window join):** join two event streams within a time window (e.g. search event + click event by session ID, to compute click-through rate; click may never come or come days later, or even before the search). Processor maintains **state** (e.g. last hour's events indexed by session ID); on each event, add to its index and check the other index. (Embedding search details in the click event ≠ join — misses no-click searches.)
- **Stream-table join (stream enrichment):** enrich activity events with profile info from a DB. Querying a remote DB per event = slow/overloading → load a **local copy** of the DB into the processor (in-memory hash table or local index). Unlike batch (point-in-time snapshot), the processor is long-running so the local copy must be kept up-to-date via **CDC** (subscribe to the profile DB changelog).
- **Table-table join (materialized view maintenance):** both inputs are DB changelogs (e.g. Twitter timeline: tweets stream + follows stream). Maintain a per-user timeline cache; processor keeps a followers set per user. = maintaining a materialized view of a join (`tweets JOIN follows`); updated on every underlying change. (Stream as derivative of table → join changes follow the product rule `(u·v)′ = u′v + uv′`.)
- **Time-dependence:** all three maintain state from one input, query it from the other. **Order matters** (follow-then-unfollow vs reverse). Within a partition order is preserved, but **no ordering guarantee across streams/partitions** → which profile version joins which event is ambiguous → join becomes **non-deterministic** (re-run may interleave differently → different result). Logging interleaving helps but isn't enough for fault recovery.

### Fault tolerance & exactly-once
- Batch achieves **exactly-once semantics** (visible effect as if each record processed once) by discarding failed tasks' output (immutable input, separate output files, output visible only on success). Streams: can't wait for completion (infinite); can't discard all output (long-running, continuous).
- **Microbatching (Spark Streaming):** break stream into ~1-second blocks, treat each as a mini batch. Implicitly a tumbling window by processing time; larger windows need explicit carry-over. (Tradeoff: small batches = more overhead; large = more delay.)
- **Checkpointing (Flink):** periodic rolling checkpoints of operator state to durable storage; on crash, restart from last checkpoint, discard output since then. Triggered by **barriers** in the stream (no forced window size).
- Both give exactly-once **within the framework**. But once output **leaves** the processor (DB write, external broker, email/push), the framework can't discard it → restart causes the side-effect twice.
- **Atomic commit revisited:** make all outputs/side-effects (downstream messages, DB writes, state changes, offset advances) take effect **iff** processing succeeds — atomically, all or none. = distributed-transaction / 2PC territory, but feasible efficiently in restricted environments: **Google Cloud Dataflow**, planned for Kafka — relies on writing the commit as a **single-object write** to a fault-tolerant store (single-object writes are easy to make atomic).
- **Idempotence:** an operation you can perform multiple times with the same effect as once (set key = idempotent; increment counter = not). Make non-idempotent ops idempotent with metadata — e.g. store the triggering message **offset** with the value → skip if already applied. (Storm Trident.) Assumptions: restart replays same messages in same order (log-based broker), deterministic processing, no concurrent updates to the same value; may need **fencing** on failover (prevent a presumed-dead-but-alive node from interfering). Low overhead, effective for exactly-once.
- **Rebuilding state after failure:** windowed aggregations, join tables/indexes must survive failure. Options: state in a remote replicated store (per-message queries slow); or **state local + periodically replicated** (better) — Flink snapshots operator state to HDFS; Samza/Kafka Streams replicate state changes to a dedicated **log-compacted Kafka topic** (like CDC). Sometimes state can just be **rebuilt from input streams** (replay a short window, or rebuild a CDC-maintained local DB replica from the log-compacted change stream).

## Ch11 Summary (key points)
- Stream processing ≈ batch but continuous on **unbounded** input. Message brokers / event logs = streaming equivalent of a filesystem.
- **Two broker types:** **AMQP/JMS-style** (broker assigns individual messages, per-message acks, deletes on ack — good for async RPC / task queues, order unimportant, no replay) vs **log-based** (assigns whole partitions, ordered delivery, offset checkpointing, retains on disk → replayable — good for derived state/output streams).
- Streams come from: user activity, sensors, data feeds, and **DB writes** (changelog via CDC or event sourcing; log compaction → full DB copy). Representing DBs as streams enables system integration (keep derived systems up-to-date; build fresh views from scratch).
- **Three join types:** stream-stream (window), stream-table (changelog keeps local DB copy current; enrich activity events), table-table (both changelogs; produces stream of changes to the materialized join view).
- **Time** is hard: processing time vs event timestamp; stragglers after a window is "complete."
- **Fault tolerance / exactly-once** via finer-grained mechanisms: microbatching, checkpointing, transactions (atomic commit), or idempotent writes — must discard failed tasks' partial output without discarding all output.
