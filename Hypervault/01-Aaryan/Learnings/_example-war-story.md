---
type: runbook
half_life: long
status: current
created: 2026-06-04
updated: 2026-06-04
tags: [aaryan, learning, example]
related: ["[[00-Conventions]]"]
---

# Example — how to write a learning so it doesn't rot

> [!note] This is a worked example/template, not a real incident. Copy its *shape* for real learnings, then
> delete this one (or leave it as the format reference).

A learning is most useful written as a **lead** — what to look at next time — plus the **why**, so it survives
even after the specific fix changes. Bad: "I set X=Y and it worked." Good: the below.

## Symptom
What I saw (the error, the client complaint, the metric dip). Be concrete + dated.

## What it turned out to be (this time)
The cause — flagged as "this time", because next time it might differ.

## Why it happened
The underlying reason. **This is the part that stays true** when versions/configs change.

## How I'd find it faster next time
1. First check … (the [[Kibana-Grafana|logs]] for the transactionId, the [[Output-Results-API]] flags, …)
2. Then …

## What I'd reuse
Link the runbook / concept note this should update, or the client note ([[Clients-MOC]]) it belongs to.

**Last verified:** 2026-06-04
