# DDIA Part II — Distributed Data (Chapters 5–8)

Two ways data is distributed across nodes:
- **Replication** — keep a copy of the same data on several nodes. Gives redundancy (availability if nodes fail), can reduce latency (geo-proximity), and scale read throughput.
- **Partitioning (sharding)** — split a big database into smaller subsets (partitions), assign to different nodes. For scale.
- These are separate mechanisms that usually combine (each partition replicated across several nodes).
- **Shared-nothing** architecture is the baseline assumption: each machine has its own CPU/RAM/disk and communicates only over the network.

---

## Chapter 5 — Replication

Replication = keeping a copy of the same data on multiple networked machines. Easy if data never changes; all difficulty is in handling **changes**. Three algorithms cover almost all distributed DBs: **single-leader, multi-leader, leaderless**.

### Leaders and Followers (leader-based / master-slave / active-passive)
- Each node storing a copy is a **replica**. Every write must be processed by every replica or they diverge.
- Mechanism:
  1. One replica is the **leader** (master/primary); all client writes go to it, written to its local storage first.
  2. **Followers** (read replicas/slaves/hot standbys) receive the data change via a **replication log / change stream** and apply writes **in the same order** as the leader.
  3. Reads can go to leader or any follower; writes only to the leader.
- Used by PostgreSQL, MySQL, Oracle Data Guard, SQL Server AlwaysOn, MongoDB, RethinkDB, Espresso, and message brokers (Kafka, RabbitMQ), DRBD.

#### Synchronous vs. asynchronous replication
- **Synchronous**: leader waits for follower's ack before reporting success. Pro: follower guaranteed up-to-date (durable if leader dies). Con: if the sync follower doesn't respond, all writes block.
- **Asynchronous**: leader doesn't wait. Pro: leader keeps processing even if followers lag. Con: if leader fails unrecoverably, un-replicated confirmed writes are **lost** (weakened durability).
- Impractical for **all** followers to be sync (any one outage halts the system). **Semi-synchronous**: one follower sync, rest async — guarantees up-to-date copy on ≥2 nodes; if sync follower goes slow/down, an async one is promoted to sync.
- Fully async is common — almost inevitable with many or geo-distributed followers.

#### Setting up new followers (without downtime)
1. Take a **consistent snapshot** of leader (ideally no lock; same feature used for backups).
2. Copy snapshot to new follower.
3. Follower requests all changes since snapshot — snapshot must be tied to an exact log position (PostgreSQL: **log sequence number**; MySQL: **binlog coordinates**).
4. When backlog processed, follower has **caught up** and streams changes live.

#### Handling node outages
- **Follower failure → catch-up recovery**: follower keeps a log of changes received; on restart it requests all changes since the last processed transaction, applies them, catches up. Easy.
- **Leader failure → failover** (tricky): promote a follower, reconfigure clients to write to new leader, point other followers at it.
  - Auto-failover steps: (1) **detect** leader failed (usually a timeout, e.g. 30s — no foolproof detection); (2) **choose** new leader (election by majority, or appointed by a controller; best candidate = most up-to-date — a **consensus** problem); (3) **reconfigure** clients + ensure old leader steps down to follower.
- Failover hazards:
  - With async replication, new leader may be missing recent writes; old leader's un-replicated writes are usually **discarded** (violates durability expectations).
  - Discarding is dangerous with external coordinated systems — e.g. **GitHub incident**: out-of-date MySQL follower promoted, its auto-increment counter lagged, reused primary keys already used in Redis → private data disclosed.
  - **Split brain**: two nodes both believe they're leader; if both accept writes with no conflict resolution, data is lost/corrupted. Safety: **fencing / STONITH** (Shoot The Other Node In The Head) — but can shut down both if unlucky.
  - **Timeout tuning**: long = slow recovery; short = unnecessary failovers from transient slowdowns/glitches, which can worsen an already-struggling system.
- These (node failures, unreliable networks, consistency/durability/availability/latency tradeoffs) are fundamental distributed-systems problems → many ops teams prefer **manual** failover.

#### Implementation of replication logs
- **Statement-based**: log/forward every SQL statement. Breaks on non-determinism: `NOW()`/`RAND()`, auto-increment, `UPDATE ... WHERE` order-dependence, side-effecting triggers/stored procs. MySQL <5.1 used it; now falls back to row-based on any non-determinism. VoltDB uses it but requires deterministic transactions.
- **Write-ahead log (WAL) shipping**: ship the storage engine's append-only log (LSM segments or B-tree WAL) over the network; follower rebuilds identical structures. Used by PostgreSQL, Oracle. Con: **very low-level** (byte/disk-block detail) → tightly coupled to storage engine; usually can't run different DB versions on leader/followers, so **zero-downtime upgrades** are blocked.
- **Logical (row-based) log replication**: separate log format decoupled from storage engine — sequence of row-level records (insert = all new column values; delete = enough to identify row, usually PK; update = identify row + new values). MySQL binlog (row-based) uses this. Pros: backward-compatible (different versions/engines), easy for external parsing → **change data capture (CDC)**.
- **Trigger-based**: move replication to application layer via triggers/stored procedures (e.g. Databus, Bucardo) or log readers (Oracle GoldenGate). Flexible (replicate subset, cross-DB, custom conflict logic) but higher overhead and more bug-prone.

### Problems with Replication Lag
- **Read-scaling architecture**: many followers serve reads (good for read-heavy web workloads); only works realistically with **async** replication (sync to all = unreliable).
- Reading async followers → stale data; same query on leader vs follower can differ. This is **eventual consistency** (the term "eventually" is deliberately vague — no bound on lag; normally sub-second but can hit seconds/minutes near capacity or with network problems).

Three anomalies + guarantees to fix them:

1. **Reading your own writes → read-after-write (read-your-writes) consistency**: a user must always see their **own** updates after reload (no promises about others'). Techniques: read user-modifiable data from leader (e.g. own profile from leader, others from followers); for a window after last update read from leader; track last-write timestamp (logical = LSN, or wall clock) and only read from sufficiently-fresh replica; route a user's requests to the leader's datacenter. **Cross-device** read-after-write adds complexity (centralized metadata, may need same-datacenter routing).

2. **Monotonic reads**: stronger than eventual, weaker than strong consistency. Guarantees a user making sequential reads won't see **time go backwards** (won't read older data after newer). Implementation: each user always reads from the **same replica** (e.g. chosen by hash of user ID).

3. **Consistent prefix reads**: if writes happen in a certain causal order, any reader sees them in the **same order** (prevents seeing an answer before its question). A problem in **partitioned** DBs where partitions are independent (no global write order). Fix: keep causally-related writes in the same partition, or use a guarantee like snapshot isolation.

- Don't pretend async replication is sync. Apps **can** provide stronger guarantees (e.g. reading from leader) but it's complex/error-prone → this is why **transactions** exist (DB provides stronger guarantees so the app is simpler). Distributed DBs often abandoned transactions claiming they're too costly — not necessarily true.

### Multi-leader replication (master-master / active-active)
- More than one node accepts writes; each leader is also a follower to the others.

**Use cases:**
- **Multi-datacenter**: a leader per DC; intra-DC leader-follower, inter-DC leader-to-leader.
  - vs single-leader: better **performance** (writes local, async cross-DC), better **datacenter-outage tolerance** (each DC independent), better **network-problem tolerance** (async tolerates flaky inter-DC links). Tools: Tungsten (MySQL), BDR (Postgres), GoldenGate (Oracle).
- **Clients with offline operation** (e.g. calendar apps): each device = a local leader; async multi-leader sync when online. Lag can be hours/days. CouchDB designed for this.
- **Collaborative editing** (Google Docs/Etherpad): each client's local replica is a leader; lock-free small-unit changes bring multi-leader conflict challenges.

**Big downside: write conflicts.** Same data modified concurrently on different leaders.
- **Sync vs async conflict detection**: single-leader blocks/aborts the second writer; multi-leader accepts both and detects the conflict **later** (too late to ask user). Making detection sync defeats the purpose (just use single-leader).
- **Conflict avoidance** (most recommended, since handling is often poor): route all writes for a given record to the same leader (e.g. by user's home DC). Breaks down if leader must change (DC failure, user moved).
- **Converging to a consistent state** (all replicas must end identical):
  - **Last write wins (LWW)** — pick highest unique ID/timestamp, discard rest. Popular but **dangerously prone to data loss**.
  - Higher-numbered replica wins (also loses data).
  - Merge values (e.g. concatenate "B/C").
  - Record conflict explicitly, resolve later (prompt user).
- **Custom conflict resolution**: run app code **on write** (background handler, e.g. Bucardo/Perl, can't prompt user) or **on read** (store all conflicting versions, return on next read, app/user resolves — CouchDB). Resolution is per **row/document**, not per transaction.
- **Automatic conflict resolution research**: **CRDTs** (conflict-free replicated data types — sets/maps/counters/lists, two-way merge; Riak 2.0); **mergeable persistent data structures** (git-like, three-way merge); **operational transformation** (Google Docs/Etherpad, for ordered lists like text).
- "What is a conflict?" can be subtle (e.g. meeting-room double-booking across leaders even with availability check).

**Multi-leader topologies** (write propagation paths):
- **All-to-all** (most general; best fault tolerance — multiple paths). **Circular** (MySQL default; each node forwards). **Star/tree** (root forwards). To prevent infinite loops, each write tagged with node IDs it passed through; a node ignores writes tagged with its own ID.
- Circular/star: single node failure interrupts replication (manual reconfig). All-to-all: messages may **overtake** each other → causality problems (an update arriving before its insert). Timestamps insufficient (clocks unreliable); use **version vectors**. Many systems implement conflict detection poorly (Postgres BDR no causal ordering; Tungsten doesn't even try).

### Leaderless replication (Dynamo-style)
- Any replica accepts writes directly from clients; client (or a coordinator that does NOT enforce ordering) sends writes to several replicas. Used by Dynamo (Amazon-internal; note **DynamoDB** is single-leader), Riak, Cassandra, Voldemort.
- **No failover**: client writes to all replicas in parallel; success once enough (e.g. 2 of 3) ack. Down node simply misses the write.
- Reads also go to **several nodes in parallel**; a **version number** picks the newer value.

**Catch-up after a node returns:**
- **Read repair**: on a multi-node read, client detects stale responses and writes the newer value back to the stale replica. Good for frequently-read values.
- **Anti-entropy process**: background process compares replicas and copies missing data (no ordering guarantee, may lag). Not all systems have it (e.g. Voldemort) — without it, rarely-read values have reduced durability.

**Quorums for reading and writing:**
- n replicas; every write confirmed by **w** nodes; every read queries **r** nodes. If **w + r > n**, read and write sets overlap → expect an up-to-date value.
- Common: n odd (3 or 5), w = r = (n+1)/2. Read-heavy: w = n, r = 1 (fast reads but one failed node blocks all writes).
- Tolerance: w<n → tolerate write with a node down; r<n → tolerate read with a node down. n=3,w=2,r=2 tolerates 1 down; n=5,w=3,r=3 tolerates 2 down.
- More than n nodes may exist in the cluster (allows partitioning); any value lives on exactly n.

**Limitations of quorum consistency** (stale reads possible even with w+r>n):
- Sloppy quorum (no guaranteed overlap).
- Concurrent writes — unclear ordering; must merge; LWW loses writes via clock skew.
- Concurrent read+write — read may get old or new.
- Write succeeded on <w replicas, not rolled back where it did succeed.
- Node with new value fails, restored from old-value replica → count drops below w.
- Timing edge cases (see linearizability).
- → Dynamo-style is optimized for eventual consistency; w/r tune probability of staleness, not absolute guarantees. Usually you do **not** get read-your-writes/monotonic/consistent-prefix. Stronger guarantees need transactions or consensus.

**Monitoring staleness**: leader-based exposes replication lag (positions in ordered log). Leaderless has no fixed write order → hard to monitor; with read-repair-only, an unread value can be arbitrarily ancient. Quantifying "eventual" is important for operability.

**Sloppy quorums and hinted handoff**:
- A network interruption can cut a client off from the n home nodes even though those nodes are alive. Tradeoff: error out, or accept writes on **other reachable nodes** (= **sloppy quorum**).
- **Hinted handoff**: when network heals, temporarily-accepted writes are sent to the proper home nodes.
- Sloppy quorums boost **write availability** but are **not a real quorum** — only a durability assurance (data on w nodes somewhere); a later r-read may not see it until handoff completes. Default-on in Riak; off in Cassandra/Voldemort.
- **Multi-datacenter leaderless**: Cassandra/Voldemort include all-DC nodes in n but usually wait only for a local quorum (async cross-DC). Riak keeps client↔node traffic local, async cross-cluster.

**Detecting concurrent writes:**
- Events arrive in different orders at different nodes → permanent inconsistency if naively overwritten. Replicas must converge.
- **LWW**: keep most "recent" by timestamp, discard others. Achieves convergence at cost of **durability** — concurrent (and even non-concurrent) writes silently dropped. Safe only if each key written once and then immutable (e.g. UUID keys in Cassandra). Cassandra's only conflict method; optional in Riak.
- **Happens-before relationship**: A happens-before B if B knows about / depends on / builds upon A. Two ops are **concurrent** if neither happens-before the other (neither knows about the other). Three possibilities for any A,B: A→B, B→A, or concurrent. Concurrency is about **causal knowledge, not wall-clock overlap** (slow/interrupted network can make non-overlapping ops concurrent).
- **Tracking happens-before (single replica) — algorithm:**
  - Server keeps a **version number** per key, increments on each write, stores it with the value.
  - On read, server returns all non-overwritten values + latest version. Client must read before writing.
  - On write, client includes the version from its prior read and **merges** all values it received.
  - Server overwrites all values at-or-below that version, keeps higher versions (concurrent) as **siblings**.
  - A write with no version number is concurrent with everything (overwrites nothing).
- **Merging siblings**: app must merge concurrent values (Riak: siblings). Union works for add-only carts; deletes need a **tombstone** (deletion marker with version) so removed items don't reappear on merge. CRDTs can auto-merge including deletions.
- **Version vectors** (multiple replicas): one version number **per replica per key**. Each replica increments its own and tracks the versions seen from others. The collection across replicas = **version vector** (variant: **dotted version vector**, Riak 2.0). Sent to clients on read, returned on write → distinguishes overwrites from concurrent writes; safe to read one replica and write another. (Version vectors ≈ client-server; vector clocks ≈ peer-to-peer.)

### Ch5 Summary
- Replication purposes: high availability, disconnected operation, latency, read scalability.
- Single-leader (easy, no conflict resolution, but follower reads stale) / multi-leader / leaderless (more robust under faults, weaker consistency, harder to reason about).
- Sync vs async profoundly affects fault behavior (async + failover can lose committed data).
- Consistency models under lag: read-after-write, monotonic reads, consistent prefix reads.
- Multi-leader/leaderless allow concurrent writes → conflicts; need happens-before detection + merge.

---

## Chapter 6 — Partitioning

Partition = each record/row/document belongs to exactly **one** partition; each partition is effectively a small DB. (Terminology: shard (Mongo/ES/Solr), region (HBase), tablet (BigTable), vnode (Cassandra/Riak), vBucket (Couchbase).) Main reason: **scalability** (data + query load spread across shared-nothing nodes). NOT the same as network partitions (netsplits).

- **Partitioning + replication** combine: each partition replicated to multiple nodes. A node may be leader for some partitions and follower for others. Schemes are mostly independent.

### Partitioning of key-value data
- Goal: spread data + load **evenly**. Uneven = **skewed**; a partition with disproportionate load = **hot spot**.
- Random assignment avoids hot spots but you'd have to query all nodes to read an item — too costly.

**Partitioning by key range** (like encyclopedia volumes):
- Assign a continuous range of keys per partition; boundaries (manual or auto) must **adapt to data** (ranges not evenly spaced). Used by BigTable/HBase, RethinkDB, MongoDB <2.4.
- Keys kept **sorted** within a partition → efficient **range scans**; concatenated keys fetch related records.
- Downside: **hot spots** for certain access patterns (e.g. timestamp key → all of today's writes hit one partition). Fix: prefix key with another field (e.g. sensor name) to spread writes — but range queries then need per-prefix scans.

**Partitioning by hash of key**:
- Good hash makes skewed data uniform; assign each partition a **range of hashes**. (Cryptographic strength unnecessary; Cassandra/Mongo use MD5.)
- Boundaries can be even or pseudo-random (**consistent hashing** — Karger et al., for CDN-style caches; "consistent" ≠ replica/ACID consistency; actually works poorly for DBs and rarely used → prefer the term **hash partitioning**).
- **Loses efficient range queries** (adjacent keys scattered). Mongo hash sharding sends range queries to all partitions; Riak/Couchbase/Voldemort don't support PK range queries.
- **Cassandra compromise**: **compound primary key** — first column hashed for the partition, remaining columns are a concatenated sort index within the partition. Can't range-scan the first column, but with a fixed first column you get efficient range scans on the rest → elegant for one-to-many (e.g. `(user_id, update_timestamp)`).

**Skewed workloads / relieving hot spots**:
- Hashing doesn't help when all activity targets **one key** (e.g. celebrity user). Most systems can't auto-compensate → app responsibility. Technique: append a random number (e.g. 2 digits → 100 keys) to hot keys to split writes; but reads must then query/combine all split keys + bookkeeping of which keys are split.

### Partitioning and secondary indexes
A secondary index (find all by color=red, etc.) doesn't map neatly to partitions. Two approaches:

- **Document-partitioned (local) index**: each partition keeps its own secondary index covering only its documents. Writes touch one partition. But reads must **scatter/gather** across all partitions (red cars live in many partitions). Scatter/gather is prone to **tail latency amplification**. Used by MongoDB, Riak, Cassandra, Elasticsearch, SolrCloud, VoltDB. Vendors recommend structuring so secondary queries hit one partition (not always possible).
- **Term-partitioned (global) index**: a global index, itself partitioned (possibly differently — by term value or hash of term). "Term" = e.g. `color:red`. Pro: reads efficient (go to the one partition holding the term, no scatter/gather). Con: writes slower/complex (one document write may update **multiple index partitions**); ideal up-to-date index needs a distributed transaction → in practice updates are often **asynchronous** (e.g. DynamoDB global secondary indexes update within a fraction of a second normally). Also Riak search, Oracle DW (local vs global choice).

### Rebalancing partitions
Triggered by load growth, data growth, machine failure. Requirements: fairly shared load after; DB stays available during; move minimal data.

**Strategies:**
- **hash mod N — DON'T**: changing N moves most keys (`123456 mod 10/11/12` all differ) → excessive rebalancing.
- **Fixed number of partitions**: create **many more partitions than nodes** (e.g. 1000 partitions on 10 nodes). New node steals whole partitions from existing nodes; number of partitions and key→partition mapping stay constant — only partition→node assignment changes. Can weight powerful nodes with more partitions. Used by Riak, Cassandra (≥1.2), Elasticsearch, Couchbase, Voldemort. Partition count fixed at setup = max nodes; each partition has overhead so don't set too high.
- **Dynamic partitioning** (for key-range DBs like HBase, RethinkDB): partitions **split** when exceeding a size (HBase default 10 GB) and **merge** when too small (like a B-tree top level). Adapts partition count to data volume. Caveat: empty DB starts with one partition → single node busy until first split; mitigate with **pre-splitting** (HBase, MongoDB). Works with hash partitioning too (Mongo ≥2.4).
- **Cassandra pre-1.2** used consistent hashing with one big range per node → poor load distribution, expensive node-add → replaced by fixed-partition approach.
- Most-used in practice: hashing with a fixed number of partitions, OR dynamic key-range partitioning (when range queries needed).

**Automatic vs manual rebalancing**: gradient from fully automatic to fully manual; some (Couchbase, Riak, Voldemort) auto-suggest but require admin commit. Fully automatic is convenient but **unpredictable** and dangerous with automatic failure detection (a slow overloaded node declared dead → rebalance adds load → **cascading failure**). A human in the loop is often safer.

### Request routing (a case of service discovery)
"Which IP/port for key foo?" Three approaches:
1. Client contacts **any node** (round-robin LB); node forwards if it doesn't own the partition.
2. Send to a **routing tier** (partition-aware load balancer) that forwards.
3. **Partition-aware client** connects directly.
- Core problem: all participants must agree on the partition→node mapping as it changes (a **consensus**-flavored problem).
- Common solution: separate coordination service like **ZooKeeper** holding authoritative mapping; nodes register, routers/clients subscribe and get notified on changes. Used by LinkedIn Espresso (Helix), MongoDB (own config server + mongos routers), HBase, SolrCloud, Kafka.
- **Cassandra/Riak**: **gossip protocol** among nodes (approach 1) — no external coordination service. Couchbase uses moxi routing tier (no auto-rebalance).
- IP addresses change slowly → DNS often sufficient there.

**Parallel query execution**: most NoSQL stores support only single-key + scatter/gather. **MPP** (massively parallel processing) analytic DBs break complex queries (joins/filters/groups/aggregations) into stages partitioned for parallel execution across nodes.

### Ch6 Summary
- Key range partitioning: sorted, efficient range queries, risk of hot spots; rebalance dynamically by splitting.
- Hash partitioning: even distribution, no efficient range queries; usually fixed partition count + move whole partitions.
- Hybrid (compound key): one part for partition, another for sort order.
- Secondary indexes: document-partitioned (local; write 1 partition, read scatter/gather) vs term-partitioned (global; write multiple partitions, read 1).
- Cross-partition writes are hard to reason about → motivates transactions.

---

## Chapter 7 — Transactions

A **transaction** groups several reads/writes into one logical unit: either it all **commits** or it **aborts/rolls back** (safe to retry). Frees the app from worrying about partial failure and concurrency. Not a law of nature — created to simplify the programming model; not every app needs them. Style largely unchanged since IBM System R (1975).

### ACID
- "ACID compliant" is vague in practice (esp. **isolation**); has become a marketing term. **BASE** = "not ACID" (Basically Available, Soft state, Eventual consistency) — even vaguer.
- **Atomicity** (better called *abortability*): NOT about concurrency. If a fault occurs partway through writes, the transaction aborts and all its writes are discarded — all-or-nothing → safe retry.
- **Consistency** (the odd one out — a property of the **application**, not the DB): app-defined **invariants** must hold. DB can enforce some (FK/uniqueness) but generally the app must define transactions that preserve validity. ("C tossed in to make the acronym work.")
- **Isolation**: concurrently-executing transactions are isolated; classic formalization = **serializability** (result as if run one at a time). Serializable is rarely used (perf cost); Oracle's "serializable" is actually **snapshot isolation** (weaker).
- **Durability**: once committed, data won't be lost (hardware fault/crash). Single node: non-volatile storage + WAL. Replicated: copied to some number of nodes. **Perfect durability doesn't exist** — use disk + replication + backups together (SSDs can violate fsync; firmware bugs; silent corruption; SSD loses data when unpowered for weeks).

### Single-object vs multi-object operations
- **Multi-object transactions** needed when several pieces must stay in sync (e.g. denormalized unread counter + emails). Without isolation: dirty reads (see counter 0 but unread email); without atomicity: out-of-sync state. Grouped by client TCP connection (`BEGIN`...`COMMIT`) in relational DBs. Many NoSQL stores lack grouping even with multi-put (partial-failure possible).
- **Single-object writes**: storage engines provide atomicity (via log) + isolation (via per-object lock) on a single object (e.g. avoid storing a half-sent JSON doc, half-spliced value, or partial read). Some provide **atomic increment** and **compare-and-set** (CAS) — these prevent lost updates but are **not** transactions ("lightweight transactions"/"ACID" marketing is misleading).
- **Need for multi-object transactions**: FK references across rows, denormalized document fields updated together, keeping **secondary indexes** consistent with values. Implementable without transactions but error handling + concurrency become much harder.

### Handling errors and aborts
- ACID philosophy: abort rather than violate guarantees; aborts enable safe retry. Leaderless stores work "best effort" (won't undo) → app must recover.
- Retry caveats: a succeeded-but-ack-lost transaction gets performed **twice** (need dedup); retrying overload makes it worse (limit retries, **exponential backoff**, treat overload specially); retry only **transient** errors not permanent (constraint violation); **side effects** (e.g. emails) may repeat — use **2PC** to commit/abort across systems; if client dies during retry, data lost.

### Weak isolation levels
Race conditions only arise when a transaction reads data concurrently modified, or two modify the same data. Concurrency bugs are timing-dependent, rare, hard to reproduce/test. Weak isolation is widely used (serializable has perf cost) and has caused real money loss, audits, and data corruption — even in "ACID" relational DBs (which often default to weak isolation).

#### Read committed (most basic)
Two guarantees: **no dirty reads** (only see committed data) and **no dirty writes** (only overwrite committed data).
- **Dirty read**: seeing another transaction's uncommitted writes — bad because partial updates confuse, and reads of later-rolled-back data are mind-bending.
- **Dirty write**: overwriting another transaction's uncommitted write — can interleave multi-object writes badly (car sale: listing→Bob but invoice→Alice). Does NOT prevent lost-update counter race (that's not a dirty write).
- Default in Oracle 11g, PostgreSQL, SQL Server 2012, MemSQL.
- **Implementation**: dirty writes prevented by **row-level locks** held until commit/abort. Dirty reads: read locks would make read-only txns wait on long writers, so instead the DB remembers **both old committed value and new uncommitted value**, serving the old until commit.

#### Snapshot isolation (SI) / MVCC (PostgreSQL/MySQL call it "repeatable read"; Oracle calls it "serializable")
- Solves **read skew / non-repeatable read**: a transaction sees different parts of the DB at different times (e.g. money seems to vanish mid-transfer). Acceptable under read committed; intolerable for backups, analytics, integrity checks (which scan large parts).
- Idea: each transaction reads from a **consistent snapshot** — all data committed at a single point in time; later changes by others are invisible.
- **Key principle**: **readers never block writers; writers never block readers** (write locks for dirty-write prevention only; no read locks). → long read queries run alongside writes without contention. Also called **multiversion** (MVCC) — keeps several committed versions per object.
- **PostgreSQL implementation**: each transaction gets a unique always-increasing **txid**; each row has **created_by** and **deleted_by** txid fields. Update = delete + create (two rows). Garbage collection removes rows no longer visible to any transaction.
- **Visibility rules** (consistent snapshot): at txn start, list in-progress txns — ignore their writes (even if they later commit); ignore aborted txns' writes; ignore writes by **later** txids; all other writes visible. An object is visible if the creating txn committed before the reader started AND it isn't deleted (or the deleting txn hadn't committed before reader started).
- **Indexes + MVCC**: index points to all versions, filter invisible ones (GC removes entries). Or **append-only / copy-on-write B-trees** (CouchDB, Datomic, LMDB): never overwrite pages, create new root per write → each root is a consistent snapshot; needs background compaction.
- **Naming confusion**: SQL standard (based on System R 1975) predates SI; it defines **repeatable read**, which superficially resembles SI, so Postgres/MySQL claim compliance by calling SI "repeatable read." Standard's isolation definitions are flawed/ambiguous; "nobody really knows what repeatable read means." DB2 uses "repeatable read" to mean serializability.

#### Preventing lost updates
**Lost update**: two concurrent read-modify-write cycles; one clobbers the other (counters, balances, JSON list edits, wiki full-page saves).
- **Atomic write operations** (best when expressible): `UPDATE counters SET value = value + 1 ...`; Mongo/Redis atomic ops. Implemented via exclusive lock on read (**cursor stability**) or single-threaded execution. ORMs make it easy to accidentally do unsafe read-modify-write.
- **Explicit locking** (`SELECT ... FOR UPDATE`): app locks rows it will update; needed when logic can't be a DB query (e.g. game move validity). Easy to forget a lock → bug.
- **Automatically detecting lost updates**: let cycles run in parallel, detect + abort + retry. Efficient with SI; auto-detected by PostgreSQL repeatable read, Oracle serializable, SQL Server snapshot — but **NOT** MySQL/InnoDB repeatable read. Advantage: no special app code needed → less error-prone.
- **Compare-and-set (CAS)**: update only if value unchanged since read (`UPDATE ... WHERE id=.. AND content='old'`). Unsafe if the WHERE may read an old snapshot — verify your DB's CAS.
- **Replicated data / conflict resolution**: locks/CAS assume a single up-to-date copy — don't apply to multi-leader/leaderless. Instead allow **siblings** + merge, or use **commutative** atomic ops (counter increment, set add — Riak 2.0 datatypes merge with no lost updates). **LWW is prone to lost updates** (and is the default in many replicated DBs).

#### Preventing write skew and phantoms
- **Write skew** (generalization of lost update): two transactions read the same objects, then update **different** objects, each based on a premise that's invalidated by the other. Example: two on-call doctors both check "≥2 on call" (both see 2), both go off-call → zero on call, invariant violated. (If both updated the *same* object you'd get dirty write/lost update.)
- Options to prevent write skew are **restricted**:
  - Atomic single-object ops don't help (multiple objects).
  - Auto lost-update detection doesn't help (not auto-detected in Postgres/MySQL repeatable read, Oracle serializable, SQL Server snapshot).
  - **Constraints** would need to span multiple objects — most DBs lack such; triggers/materialized views are hacky.
  - Best fallback short of serializable: **explicit lock** the dependent rows (`SELECT ... FOR UPDATE`).
  - True prevention needs **serializable isolation**.
- **More write-skew examples**: meeting-room double-booking; multiplayer-game move legality; claiming a username (unique constraint solves this one); double-spending (two tentative items both pass balance check).
- **Phantoms**: a write in one transaction changes the result set of another's search query. Pattern: SELECT to check condition → decide → write that changes the set → re-running SELECT would differ. When step-1 returns rows you can `SELECT FOR UPDATE` those rows; but when checking **absence** of rows, there's nothing to lock → phantom-driven write skew.
- **Materializing conflicts**: artificially create lock rows (e.g. all room×timeslot rows in advance) so a phantom becomes a concrete lock conflict. Hard, error-prone, leaks concurrency control into the data model → **last resort**; prefer serializable.

### Serializability
Strongest level: result equals **some serial order** → prevents **all** race conditions. Not universally used due to performance. Three implementations:

#### 1. Actual serial execution
- Run one transaction at a time on a **single thread** → serializable by definition. Became feasible (~2007) because (a) RAM cheap enough to keep active dataset **in memory**; (b) OLTP txns are short/small (long analytics run read-only on a snapshot outside the loop). Used by VoltDB/H-Store, Redis, Datomic. Can beat concurrent systems (no locking overhead) but throughput limited to **one CPU core**.
- **Stored procedures**: interactive multi-statement txns waste time on network round-trips → single-threaded serial systems require submitting the whole transaction as a **stored procedure** (executes fast with in-memory data). Old reputation (vendor-specific PL/SQL, hard to debug/version/test, perf-sensitive) overcome by modern impls using general languages (VoltDB Java/Groovy, Datomic Java/Clojure, Redis Lua). VoltDB also uses stored procs for **deterministic** replication.
- **Partitioning**: to scale beyond one core, partition so each txn touches a single partition → per-partition thread, **linear scaling** with cores. Cross-partition txns need coordination (lock-step across partitions) → vastly slower (VoltDB ~1000 cross-partition writes/sec, can't be improved by adding machines). Multi-secondary-index data needs lots of cross-partition coordination.
- **Constraints**: every txn small/fast (one slow txn stalls all); active dataset fits in memory (**anti-caching**: abort, async-load data, restart); write throughput fits one core or partitions without cross-partition coordination.

#### 2. Two-phase locking (2PL) — the standard for ~30 years
- NOT 2PC. Stronger than dirty-write locks: **readers block writers and writers block readers** (opposite of SI's mantra). Several readers OK while no writer; any writer needs **exclusive** access.
  - A read then B-write: B waits for A. A write then B-read: B waits for A (no reading old version).
- **Implementation**: per-object lock in **shared** or **exclusive** mode. Read → shared lock (multiple allowed); write → exclusive (sole holder); read-then-write → **upgrade** shared to exclusive. Locks held until end of transaction (two phases: acquire while executing, release at commit/abort). Used by MySQL InnoDB & SQL Server serializable, DB2 repeatable read.
- **Deadlocks** happen easily; DB auto-detects and aborts one (app must retry).
- **Performance**: significantly worse than weak isolation — lock overhead and especially **reduced concurrency**; unbounded waits possible; **unstable latencies**, very slow high percentiles under contention; one slow/large txn can stall everything; deadlocks much more frequent than under read committed → wasted retried work.
- **Predicate locks**: needed to prevent phantoms — lock all objects **matching a search condition** (even ones not yet existing). Shared predicate lock for reads; writers must check old/new value against existing predicate locks. With predicate locks, 2PL becomes truly serializable. But predicate locks perform **poorly** (expensive matching).
- **Index-range locks (next-key locking)**: practical approximation — lock a larger set (e.g. all room-123 bookings, or all rooms in the time range) by attaching a shared lock to an **index entry/range**. Writers updating that index part hit the lock and wait. Less precise but much lower overhead. Falls back to a whole-table shared lock if no suitable index.

#### 3. Serializable snapshot isolation (SSI) — optimistic
- Full serializability with only a small penalty over SI. First described 2008 (Cahill); PostgreSQL serializable (≥9.1), FoundationDB.
- **Pessimistic (2PL, serial execution) vs optimistic (SSI)**: optimistic lets txns proceed, then on **commit** checks whether isolation was violated and aborts+retries if so. Optimistic performs badly under **high contention** (many aborts), well with spare capacity. Commutative atomic ops reduce contention.
- Built on SI (reads from consistent snapshot) **plus** detection of serialization conflicts among writes.
- Core insight: a transaction acts on a **premise** (fact true at start) that may become stale by commit time. DB must detect action on an outdated premise and abort. Two cases:
  - **Detecting stale MVCC reads** (uncommitted write existed before the read): track when a txn ignores another's writes due to MVCC visibility; at commit, if those ignored writes have since committed, **abort**. Wait until commit (a read-only txn needn't abort; don't know yet whether it will write).
  - **Detecting writes that affect prior reads** (write after read): like index-range locks but **non-blocking** — record which txns read which index range (a **tripwire**). When a txn writes, it notifies txns that recently read the affected data that their read may be stale. The reader aborts only if the conflicting write has committed by the time the reader commits.
- **Performance**: tradeoff in tracking granularity (precise = more bookkeeping; coarse = more unnecessary aborts). Big win vs 2PL: **no blocking** on locks → predictable, low-variance latency; read-only queries lock-free. Vs serial execution: **not limited to one core** (FoundationDB distributes conflict detection, scales across machines + partitions). High **abort rate** hurts → read-write txns should be fairly short; less sensitive to slow txns than 2PL/serial.

### Ch7 Summary — race conditions and which level prevents them
- **Dirty reads** — prevented by read committed+.
- **Dirty writes** — prevented by almost all implementations.
- **Read skew (non-repeatable read)** — prevented by snapshot isolation (MVCC).
- **Lost updates** — prevented by some SI implementations (atomic ops, auto-detection, CAS, explicit locks).
- **Write skew** — only **serializable** prevents it.
- **Phantoms** — SI prevents straightforward phantoms in read-only queries; write-skew phantoms need index-range locks (or serializable).
- Three serializable implementations: actual serial execution (small/fast, single core or partitioned); 2PL (standard, poor perf); SSI (new, optimistic, scalable). Transactions apply regardless of data model and whether single-node or distributed (distributed adds further challenges — Ch8/9).

---

## Chapter 8 — The Trouble with Distributed Systems

Pessimistic premise: anything that can go wrong **will**. Assumes **non-Byzantine** faults (until the Byzantine section).

### Faults and Partial Failures
- Single computer: deterministic — works or doesn't; internal fault → total failure (designed to crash rather than return wrong results — "idealized system model with mathematical perfection").
- Distributed: **partial failure** — some parts broken while others work; **non-deterministic** (sometimes works, sometimes fails); you may not even know whether something succeeded. This non-determinism is what makes distributed systems hard.
- **Cloud vs supercomputing spectrum**:
  - **HPC/supercomputers**: reliable specialized hardware, checkpoint to durable storage, on failure stop the whole cluster and restart from checkpoint (treats partial failure as total — like a single node).
  - **Cloud**: commodity machines, IP/Ethernet (Clos topologies), elastic resources, metered billing; higher failure rates.
  - Internet services: **online** (need low latency always, can't stop for repair), commodity hardware (higher failure), big systems → something is **always** broken (giving up doesn't scale). Tolerating failed nodes enables **rolling upgrades**, kill-and-replace VMs. Geo-distribution → slow/unreliable internet.
- Must **build a reliable system from unreliable components** — an old idea (von Neumann): error-correcting codes over noisy channels; TCP over unreliable IP (retransmit, dedup, reorder). Limits exist (TCP can't remove delays; channel capacity limits) but it's still useful.
- Faults aren't rare — consider a wide range, artificially induce them in testing (chaos engineering). "Suspicion, pessimism and paranoia pay off."

### Unreliable Networks
- Shared-nothing = machines connected only by an **asynchronous packet network** with no delivery/timing guarantees.
- A request+response can fail in many indistinguishable ways: request lost, request queued/delayed, remote node down, remote node paused (e.g. GC) then resumes, response lost, response delayed. **If you don't get a response, you cannot tell why.**
- Usual handling: a **timeout** — but on timeout you still don't know if the request was processed (it may still be queued and delivered later).
- **Network faults in practice**: common even in single-company datacenters (~12 faults/month in one study; half single-machine, half whole-rack). Redundant gear doesn't help against **human error** (misconfig — a major cause). EC2 notorious for transient glitches; switch-upgrade reconfig can delay packets >1 minute; a NIC may drop all inbound but send outbound (one-direction working ≠ both).
- **Network partition / netsplit**: part of network cut off (book uses general "network fault" to avoid confusion with storage partitions). Even rare faults must be **handled** (or untested handling → deadlock, data loss). Handling ≠ tolerating (showing an error may be acceptable) — but you must know how your software reacts and that it recovers. Consider deliberately triggering faults (chaos monkey).

**Detecting faults** — limited explicit feedback:
- No process on port → OS sends RST/FIN (but if node crashed mid-request, you don't know how much was processed).
- A monitoring script can notify peers of a crash (HBase) so failover skips the timeout.
- Switch management interface can show hardware link failure (not available over internet/shared DCs).
- Router may send ICMP Destination Unreachable (router has no magic failure detection).
- Rapid feedback is useful but **can't be relied on** — even TCP ack ≠ application handled it. To be sure, need a positive **application-level** response. Otherwise: retry + timeout + declare dead.

**Timeouts and unbounded delays**:
- No simple right value: long timeout = slow detection/waits; short = risk of falsely declaring a slow-but-alive node dead → its load shifts to others → can cause **cascading failure**.
- A hypothetical network with bounded delay **d** and bounded handling time **r** would give a sensible timeout **2d + r**. Real systems have **unbounded delays** (async networks) and unbounded handling times → no guarantee.
- **Network congestion and queueing** is the main cause of variable delay: switch queues fill (congestion → dropped packets → resend); destination OS queues when all CPU cores busy; VMs paused tens of ms (queued by VMM); TCP **flow control** queues at the sender; TCP retransmits on its own timeout (app sees the delay). Queueing worst near max capacity (spare capacity drains queues). Multitenant clouds: **noisy neighbors** share links/switches/CPUs → highly variable delays. MapReduce-style batch jobs saturate links.
- **TCP vs UDP**: latency-sensitive apps (VoIP/video) use UDP — no flow control/retransmit, avoids some variable delay; good when delayed data is worthless (fill gap with silence).
- Choose timeouts **experimentally** (measure RTT distribution). Better: continually measure response times + **jitter** and adapt timeouts — **Phi Accrual failure detector** (Akka, Cassandra); TCP retransmit timeouts work similarly.

**Synchronous vs asynchronous networks**:
- Telephone network is very reliable because a call establishes a **circuit** — fixed reserved bandwidth end-to-end (e.g. ISDN 4000 frames/s, 16 bits/frame each direction). **Synchronous, no queueing → bounded delay.**
- Datacenter/internet (Ethernet, IP) are **packet-switched**, optimized for **bursty** traffic → queueing → **unbounded delays**. Circuits would waste capacity (must guess bandwidth) and slow transfers; TCP dynamically adapts to available capacity.
- Hybrids exist (ATM; InfiniBand link-layer flow control); QoS + admission control can emulate circuit-switching / statistically bounded delay — but **not enabled** in multitenant DCs/public clouds/internet → assume congestion, queueing, unbounded delay; no "correct" timeout.
- **Latency = consequence of dynamic resource partitioning**: static partitioning (circuits, dedicated hardware) gives latency guarantees but **lower utilization** (more expensive); dynamic sharing maximizes utilization (cheaper) at cost of **variable delays**. Variable delay is a cost-benefit tradeoff, not a law of nature.

### Unreliable Clocks
- Time used for durations (timeouts, percentiles, QPS) and points in time (reminders, cache expiry, log timestamps).
- Communication isn't instantaneous; receive time always later than send time by an unknown amount → hard to order events across machines. Each machine has its own (quartz) clock with its own slightly-off notion of time. **NTP** syncs clocks against time servers (which use GPS/atomic sources).

**Monotonic vs time-of-day clocks** (two kinds, different purposes):
- **Time-of-day clock** (wall-clock; `clock_gettime(CLOCK_REALTIME)`, `System.currentTimeMillis()`): seconds since epoch. NTP-synced (so timestamps mean roughly the same across machines) but can **jump backwards** when reset, often ignores leap seconds, historically coarse resolution → **unsuitable for measuring elapsed time**.
- **Monotonic clock** (`clock_gettime(CLOCK_MONOTONIC)`, `System.nanoTime()`): always moves forward; absolute value meaningless (only differences matter); **don't compare across machines**. NTP can **slew** (adjust rate, default ±0.05%) but not jump it. Good resolution (µs). Use it for **durations/timeouts** — no cross-node sync assumed.

**Clock synchronization and accuracy** — NTP/hardware clocks are fickle:
- Quartz **drifts** (temperature-dependent); Google assumes 200 ppm → ~6 ms per 30s resync, ~17 s/day.
- Clock too far off → NTP refuses to sync or forcibly resets (time jumps forward/back).
- Firewalled-off NTP server → misconfig unnoticed.
- NTP accuracy limited by network delay (≥35 ms over internet; spikes to ~1 s).
- Some NTP servers wrong/misconfigured (off by hours; clients query several, drop outliers).
- **Leap seconds** (59/61-second minute) crash systems not designed for them; mitigate by **smearing** (spread the adjustment over a day).
- VM virtualized clock can **jump** when the VM is paused.
- Untrusted devices (mobile/embedded) may have deliberately-wrong clocks.
- High accuracy achievable with effort (MiFID II requires HFT clocks within 100 µs of UTC; via GPS + **Precision Time Protocol** + careful monitoring).

**Relying on synchronized clocks** — dangerous because **incorrect clocks fail silently** (a drifting clock looks fine while causing subtle data loss). If software needs sync clocks, **monitor clock offsets** and declare too-far-drifted nodes dead.

- **Timestamps for ordering events**: LWW conflict resolution using time-of-day timestamps **fails to order causally** (a causally-later write can get an earlier timestamp → write silently lost). Problems with LWW: writes can mysteriously disappear (lagging-clock node can't overwrite a fast-clock node's value until skew elapses); can't distinguish quick-succession sequential writes from truly concurrent ones (need **version vectors**); two nodes can generate identical timestamps (need a random tiebreaker — can still violate causality). NTP can't be accurate enough (sync accuracy limited by RTT). Use **logical clocks** (incrementing counters) for ordering — they capture relative order, not time of day; time-of-day/monotonic = **physical clocks**.

- **Clock readings have a confidence interval**: fine resolution ≠ accuracy; a reading is really a **range** within a confidence interval (e.g. 95% confident time is 10.3–10.5 s). Most APIs don't expose uncertainty (`clock_gettime()` gives no error bound). Exception: **Google TrueTime (Spanner)** returns `[earliest, latest]`.

- **Synchronized clocks for global snapshots**: SI needs a monotonically-increasing transaction ID reflecting causality; hard to generate globally across partitions/DCs (coordination bottleneck). **Spanner** uses TrueTime: if two confidence intervals **don't overlap**, order is certain. To ensure timestamps reflect causality, Spanner **waits out the confidence-interval length** before committing a read-write txn (so later readers' intervals don't overlap) → needs uncertainty small (GPS/atomic clock per DC, ~7 ms). Active research area, not yet in mainstream non-Google DBs.

### Process pauses
- A node can be **paused for a long time at any point**, even mid-function, without noticing — the world keeps moving and may declare it dead.
- Leader-with-lease example: a lease (lock with timeout) must be renewed before expiry. Naive request loop is wrong because (a) it relies on **synchronized clocks** (lease expiry set on another machine, compared to local clock), and (b) it assumes little time passes between checking the lease and processing the request — false if a pause occurs (lease expires, another leader elected, paused node processes unsafely).
- Causes of long pauses: **stop-the-world GC** (sometimes minutes; even "concurrent" collectors pause); VM **suspend/resume** (live migration); laptop lid close; OS context switch / hypervisor switch (**steal time**); synchronous disk I/O (even hidden, e.g. Java lazy classloading); page faults / **swapping** / **thrashing** (often disable paging on servers); `SIGSTOP` (Ctrl-Z, or sent accidentally).
- Like multi-threaded code on one machine but **no shared memory** — mutexes/semaphores don't translate; only unreliable messages.

**Response time guarantees**:
- **Hard real-time systems** (aircraft, airbags, robots) have deadlines that must be met. Require an **RTOS** (guaranteed CPU scheduling), documented worst-case execution times, restricted/disallowed dynamic allocation (real-time GC exists but limited), and extensive testing. Very expensive; restricts languages/tools; real-time ≠ high performance (often **lower** throughput). Not economical for server-side data systems → they must tolerate pauses + clock instability.
- **Limiting GC impact**: treat GC pauses as **brief planned outages** — runtime warns app, app stops routing new requests to that node, drains outstanding, then GCs (used in some financial trading systems). Or GC only short-lived objects and **periodically restart** processes (rolling-restart, shift traffic away first). Reduces, doesn't eliminate, pauses.

### Knowledge, Truth and Lies
A node knows nothing for sure — only what messages it receives (or doesn't). Can't distinguish a node problem from a network problem. State assumptions in a **system model** and design to meet them; algorithms can be proven correct within a model.

- **The truth is defined by the majority**: a node can't trust its own judgment (asymmetric fault where outbound is dropped but the node thinks it's fine; or a GC-paused node wrongly declared dead then "resurrects"). Many algorithms rely on a **quorum / majority** (e.g. 2 of 3, 3 of 5) for decisions, including declaring nodes dead. Reason: only **one** majority can exist → no two conflicting decisions. With fixed n nodes: 3 tolerate 1 failure, 5 tolerate 2.

- **The leader and the lock**: systems often need exactly one of something (one leader per partition / one lock holder / one username owner). A node believing it's "the chosen one" doesn't mean the majority agrees — it may have been demoted during a network interruption or GC pause. **Data corruption bug** (real, HBase): a client's lease expires during a long pause; another client gets the lease and writes; the paused client returns, still thinks it holds the lease, and also writes → clash/corruption.

- **Fencing tokens**: the lock service returns a **monotonically increasing token** with each grant; every write to the protected resource must include its token. The **resource itself** must reject writes with a token lower than one it has already seen (client-side checking is insufficient). ZooKeeper's **zxid** or node **cversion** work as fencing tokens. Good practice — services shouldn't trust clients to be well-behaved.

- **Byzantine faults**: nodes may **lie** (send arbitrary/corrupted/faulty responses, claim false messages). The **Byzantine Generals Problem** = reaching consensus with traitors among n generals; **Byzantine fault tolerant (BFT)** = correct despite malfunctioning/malicious nodes. Relevant for aerospace (radiation-corrupted memory/registers → flight control must be BFT) and multi-org systems without a central authority (e.g. Bitcoin blockchain — mutually-untrusting parties agree).
  - In most server-side data systems we can **safely assume no Byzantine faults**: nodes are org-controlled, radiation low; BFT protocols are complex/expensive and impractical. Same-software-on-all-nodes means BFT can't save you from a shared bug (would need ≥4 independent implementations; BFT needs **>2/3** correct nodes). BFT also doesn't protect against security compromise (compromise one → probably all). Traditional protections (auth, access control, encryption, firewalls) remain the main defense.
  - **Weak forms of lying** worth guarding against (not full BFT): application-level **checksums** (corrupted packets sometimes evade TCP/UDP checks); **input sanitization** (range/size checks against DoS); NTP querying **multiple servers** + majority agreement to exclude outliers.

### System model and reality
Three **timing** models:
- **Synchronous**: bounded network delay, bounded pauses, bounded clock error — **not realistic**.
- **Partially synchronous**: synchronous most of the time, occasionally exceeds bounds — **realistic for most systems**.
- **Asynchronous**: no timing assumptions at all, not even a clock (no timeouts) — very restrictive.

Three **node-failure** models:
- **Crash-stop**: node fails only by crashing, never returns.
- **Crash-recovery**: node may crash and later recover; **stable (disk) storage survives**, in-memory state lost.
- **Byzantine (arbitrary)**: node does anything, including deceit.

Most useful for real systems: **partially synchronous + crash-recovery**.

**Correctness** = an algorithm satisfies its **properties** in all situations its system model allows. Example properties for a fencing-token algorithm:
- **Uniqueness** (no two requests get the same token) — safety
- **Monotonic sequence** (x completed before y began ⇒ tx < ty) — safety
- **Availability** (a non-crashing requester eventually gets a response) — liveness

**Safety vs liveness**:
- **Safety** = "nothing bad happens"; violation is at a **specific point in time** and **cannot be undone**.
- **Liveness** = "something good eventually happens" (definitions often contain "eventually"; eventual consistency is a liveness property); may not hold now but can be satisfied later.
- Distributed algorithms typically require **safety always** (even if all nodes crash or network fails — never return a wrong result), while **liveness is allowed caveats** (e.g. respond only if a majority is up and the network eventually recovers — as the partially-synchronous model assumes).

**Mapping models to reality**: models are simplified abstractions. Crash-recovery assumes stable storage survives — but disks corrupt, get wiped, firmware bugs lose drives; **amnesia** breaks quorum algorithms. Real implementations still need code for "impossible" cases (even if it's `printf("Sucks to be you"); exit(666)` → let a human clean up). Abstract models are valuable for distilling complexity and proving correctness; proof ≠ correct implementation, but theoretical analysis + empirical testing are equally important.

### Ch8 Summary
- All problems = **partial failures**: packets lost/delayed (no reply ⇒ no knowledge); clocks out of sync / jumping; processes paused (GC) then resurrected.
- Fault tolerance requires **detecting** faults (hard — mostly timeouts, which can't distinguish network from node failure; "limping" degraded nodes are worse than cleanly-dead ones), then **tolerating** them despite no shared memory/state — major decisions need quorum agreement.
- Unreliability of networks/clocks/processes is **not** inevitable (bounded delay + hard real-time are possible) but expensive with low utilization — most systems choose cheap/unreliable.
- Supercomputers assume reliable components (stop+restart on failure); distributed systems aim to run forever via node-level fault/maintenance handling (though a bad config rolled to all nodes still breaks everything).
- Distributed systems are justified not only by scalability but by **fault tolerance** and **low latency** (geo-proximity) — unattainable on one node. If you can keep things on a single machine, generally do so.
- Next (Ch9): algorithms/solutions (consensus) for these problems.
