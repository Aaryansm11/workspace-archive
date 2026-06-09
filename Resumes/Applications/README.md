# Applications — per-company tracker

One folder per company you apply to. Each holds **everything** for that application: the JD, the tailored resume (md/pdf/docx/tex), your application answers, outreach/contacts, and a demo script.

## Structure
```
Applications/
├── README.md            ← this file (status tracker below)
├── convert.sh           ← regenerates every company resume's .pdf/.docx/.tex
├── _TEMPLATE/           ← copy this for a new company
│   ├── JD.md
│   ├── Application-Answers.md
│   └── Outreach.md
└── {Company}/
    ├── JD.md                                  the job description
    ├── Resume_Aaryan_{Company}_{Role}.{md,pdf,docx,tex}   tailored resume (send the .pdf)
    ├── Application-Answers.md                 screening Qs + your answers
    ├── Outreach.md                            contacts, cold messages, referral plan, status log
    └── Demo-Script.md                         what to show/say/defend if asked to demo live
```

## Add a new company
1. `cp -r _TEMPLATE {Company}` and paste the JD into `{Company}/JD.md`.
2. Tailor a resume into `{Company}/Resume_Aaryan_{Company}_{Role}.md` (start from `../00-Master-Profile.md` or the closest `../READY-TO-GO/` role resume; apply the 4 prompts).
3. Run **`./convert.sh`** → builds the `.pdf` + `.docx` + `.tex` (uses the shared LaTeX template in `../READY-TO-GO/_build/md2tex.py`).
4. Fill `Application-Answers.md` + `Outreach.md`; update the tracker below.

## Status tracker
| Company | Role | Est. comp (early-career, Bangalore) | Status | Key contact | Next step |
|---|---|---|---|---|---|
| **Glean** | Solutions Architect (Bangalore, hybrid) | ~₹40L+ (senior role; reach, would enter lower) | Reaching out | Nityang (HR), via Manav | Manav intro → apply on link → message Nityang |
| **Yellow.ai** | SDE / Backend (new-grad track) | ~₹9L to ₹16L (SDE1 avg ~₹10.5L) | ⚠️ Reconsider (unstable) | — | Likely skip: 2 layoff rounds 2025 + comp frozen. Only if nothing better (see `_Market-Analysis.md`) |
| **Navi** | Associate Product Manager | ~₹10L to ₹20L (avg ~₹15L) | To apply (reach) | Pranav Gangrade (1st°, @ Navi) | Message Pranav → Easy Apply |

See **`_Salary-and-Roles.md`** for prospective companies (Razorpay, Postman, Setu, Cashfree, IDfy, Hasura) with target roles + comp.

> Status options: *Reaching out · Applied · Replied · Screen · Interview · Offer · Closed.*
> ⚠️ This is a stretch (Glean wants 6–10 yrs; you're early-career) — the referral is the lever.
