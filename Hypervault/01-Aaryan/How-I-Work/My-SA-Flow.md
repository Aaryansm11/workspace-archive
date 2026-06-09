---
type: concept
half_life: medium
status: current
created: 2026-06-04
updated: 2026-06-04
review_by: 2026-12-04
tags: [aaryan, how-i-work, process]
related: ["[[SA-Lifecycle-Overview]]", "[[HubSpot-Milestones]]", "[[JIRA]]"]
---

# My SA Flow — how I actually run a client

> [!note] This is *my* working copy, not the official process. The official spine is [[SA-Lifecycle-Overview]];
> this note captures how I really do it, including the unwritten steps. **Edit this freely** — it's the one
> place the background work (JIRA, HubSpot, HubSpot/Slack-bot, HubSpot metrics) is written down.

## My loop per client
1. **Discovery** — run the [[Discovery-Call]]; leave with problem + primary BI + target.
2. **Design** — build & test config on staging; write the [[BRD]]; Lead/Peer sign-off → client sign-off.
   - ↳ HubSpot: *"Solution Design Done"* via Slack bot ([[HubSpot-Milestones]]); set mode of integration.
3. **Integration** — [[Integration-Tech-Deep-Dive-Call]]; share staging creds; client builds.
   - ↳ raise any bug / gap on [[JIRA]] as I find it (don't batch — file immediately, follow up in-ticket).
4. **Sanity** — run the [[Sanity-Checklist]]; client fixes deviations; issue prod creds.
   - ↳ HubSpot: integration close date, metabase link, test-suite-created → Go Live Ready.
5. **Go live** — mark *"Gone Live"*; open HyperCare query; first-draft [[BI-Metrics-Doc]].
6. **Stabilize (28d) → BI (90d)** — monitor [[Metabase]]; deliver final BI + CSAT.

## My background checklist (the stuff no diagram shows)
- [ ] HubSpot deal exists before I start (else ping KAM — [[Who-Does-What]]).
- [ ] Every milestone updated **same day, via the bot only**.
- [ ] HubSpot metrics / dashboard fields kept current (lead metrics are reviewed weekly).
- [ ] JIRA raised for every issue + feature request; escalations flagged in Service Desk ([[Service-Desk-Escalations]]).
- [ ] Client folder in [[Clients-MOC|04-Clients]] kept current (it's short half-life — date it).

## TODO for me to fill in
<!-- The bits that are specific to how *you* work that aren't in the source docs yet:
     - exact Slack-bot commands you use
     - your personal templates / snippets
     - shortcuts, saved Metabase queries, who you ping for what -->
