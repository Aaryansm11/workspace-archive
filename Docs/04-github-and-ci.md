# 4 — GitHub Cleanup + SDIS CI

**Account:** `Aaryansm11` (resume account). Note: `gh` is also logged into a second account `aaryansmaralihalli` (holds the original `our-life-hq`). All commits below authored as **Aaryan S. Maralihalli** (`113530894+Aaryansm11@users.noreply.github.com`) — **no AI attribution**, per Aaryan's request.

## What was done
| Action | Result |
|---|---|
| **Profile README** | created `Aaryansm11/Aaryansm11` → shows on [github.com/Aaryansm11](https://github.com/Aaryansm11) |
| **READMEs added** | `ecg-ppg-arrhythmia-prediction` (the IEEE-paper repo), `CloudComputingMonolithic`, `AirlineDBManagement` |
| **AirlineDB password fix** | hardcoded MySQL password → `MYSQL_PASSWORD` env var |
| **Mirror** | `our-life-hq` → [Aaryansm11/our-life-hq](https://github.com/Aaryansm11/our-life-hq), `.env*` excluded |
| **Archived** | `demo_capstone`, `capstone_proto`, `CAPSTONE-100-ALTERNATE` (duplicate capstones) |
| **SDIS CI** | GitHub Actions workflow, **green 22/22**, merged to `main` |

## Security findings (handled honestly)
- **our-life-hq `.env.production` was committed** — but it contains only the Supabase **anon key**, which is **public-by-design** (RLS-protected). So *lower risk than first flagged* (correction made). Mirror excludes it; rotation optional.
- **AirlineDB hardcoded MySQL password** — moved to env var; **rotate it if reused** (it remains in old git history).
- ⚠️ **A Claude OAuth token leaked into the chat transcript** during debugging — **must be rotated** (see doc 02).

## SDIS CI — 5 real bugs fixed to get green
The CI loop (push → run → read failure → fix → repeat) surfaced genuine repo problems:
1. `cryptography==41.0.8` — **non-existent version** → `41.0.7` (repo was not `pip install`-able).
2. spaCy model download URL broken → install the model **wheel** directly.
3. `from typing import str` in `app/utils/text.py` — **invalid import that crashed the module** → `Any, Dict, List`.
4. PII span **types lowercase vs uppercase** (broke every detection filter) → uppercase + case-insensitive mask labels.
5. **phone regex** didn't handle `(555) 123-4567` → broadened. Plus added `redacted_text` key to applied spans.
Result: **22 passed, 0 failed** → CI badge green on `main`. These are real improvements Aaryan can speak to in interviews.

## Manual follow-ups (Aaryan)
- **Pin 6 repos** on the profile (GitHub UI): `ecg-ppg-arrhythmia-prediction`, `LANGTRON`, `SDIS`, `Langtron-KGS`, `our-life-hq`, `Live_emostream`.
- **Rotate** the AirlineDB MySQL password if reused; (our-life-hq anon key optional).
