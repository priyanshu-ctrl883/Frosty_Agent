# Merchant dashboard

The merchant-facing console: agents, knowledge, channels, inbox, leads, meetings, quotes, billing,
team, webhooks and settings. Next 15 / React 19, against **our** API at `:8000`.

```bash
cp .env.example .env.local     # then fill in the Supabase values
pnpm --filter @frosty/merchant-dashboard dev
```

## What is ported and what is not

Phase E ports the parallel build's merchant dashboard (`frostrek/Frosty-Vibe-Code`) **one screen at
a time**, and the split is D44a's:

| Layer | Ported |
|---|---|
| **CSS** | ~100%. Their 5,495 lines reference 36 custom properties and the Thermal alias layer already defined 35 — only `--font-inter` was missing |
| **markup / composition** | most of it, unedited |
| **the data layer** | none. 30 of the 93 paths they call do not exist on our API, and their nav gates on four permission codenames in no row of `tenant_admin.permissions` |

### `.port-staging/`

Screens copied across but **not yet re-bound to our API**. They name endpoints we do not serve and
fields we do not return, so `tsconfig.json` excludes the directory — that keeps `tsc` and
`next build` green for the screens that ARE done, instead of a tree that cannot compile until the
last one lands.

**It must be empty when Phase E closes.** Two guards enforce the discipline, both in
`apps/api/tests/test_merchant_dashboard_api_contract.py`:

* nothing under `src/` may import from it;
* every `href` in `lib/nav.ts` must have a real `page.tsx`, with the exceptions named one by one in
  `NAV_PENDING` — the executable to-do list.

## Two traps worth knowing before you run it

**⚠️ Do not run `next build` while the dev server is up.** They share `.next`, and building under a
live dev server corrupts its webpack runtime — `Cannot find module './4.js'`, then every route 500s
with no client-side error to explain it. The cure is `rm -rf .next` and a restart. Stop the dev
server first.

**⚠️ `SUPABASE_ANON_KEY` is empty in the repo `.env`.** Sign-in cannot work until it is filled in;
the login screen detects it and says so rather than throwing. For local verification of the
authenticated screens you can seed a session directly — see `docs/DECISIONS.md` D64.

## The shape of it

```
src/
  app/                  one directory per screen, their CSS module beside it
  components/
    shell/AppShell.tsx  nav, plan chip, notification bell, account banners
    entitlements/       EntitlementGate — the soft lock
    ui/                 Button, Field, Data, PageState
  lib/
    workspace.tsx       ⚠️ the ONE provider: /v1/me + /v1/merchants/me + /v1/entitlements, once
    api.ts              apiRequest — reads the token itself, no merchant id anywhere
    types.ts            hand-written against OUR API; nothing in tsc verifies it
    nav.ts              gated on the permission each destination's first call really requires
    permissions.ts      the 18 real codes
    entitlements.ts     the 16 real feature keys
    contrast.ts         ⚠️ a deliberate duplicate of apps/widget/src/contrast.ts
```

### Things that are absent on purpose

Each of these is refused with the reason written on its own screen — the D44c pattern, because a gap
recorded only in a decisions log gets rediscovered as a missing feature and re-requested.

| Their screen | Why it is not here |
|---|---|
| **Automation** | writes `agent_versions.config.tools`, which our schema declares empty in Wave 1 and the brain never reads. It would save, return 200 and change nothing |
| **Impersonation banner** | `resolve_impersonation` has no production caller (D44h). A banner wired to a flag nobody sets makes the next reader assume impersonation is audited here |
| **Raw prompt editor** | D7 refuses raw system prompts; `AgentConfig` is `extra='forbid'`, so the control would 422 |
| **"Create another workspace"** | `uq_memberships_one_owned_merchant_per_user` permits exactly one. A second arrives by invitation |
| **11 of their 15 KB endpoints** | crawl, schedules, manual Q&A, scope — we serve four |
| **A merchant-side WhatsApp *connect*** | `POST /v1/wa/accounts` is `require_frostrek_principal` — staff provision the number, the merchant manages it |

### Still owed

* **`.port-staging` is not empty** — see `NAV_PENDING` for exactly which screens remain.
* **The seat count and every other numeric limit is display-only** (D51a). `/v1/entitlements` says
  `limits_enforced: false` in as many words, and the Team screen says so on the screen.
* **Four feature flags the nav locks on are enforced nowhere in the API** — `meeting_scheduling`,
  `quotations`, `webhooks`, `channel_whatsapp` (D63). The lock is a courtesy, not a boundary: a
  free-plan merchant can still register a webhook with `curl`.
* **No quota alert row is ever written.** Home computes the 80% banner live from the wallet, which
  covers the merchant-facing need, but nothing raises `credit_warning_80` — the service docstring
  claims otherwise and is wrong (D64).
