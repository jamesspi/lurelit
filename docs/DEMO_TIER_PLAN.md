# Lurelit Demo Tier — Implementation Plan

A restricted, publicly-hosted version of Lurelit that gives users a taste of the product without the threat-hunting features and with hard caps on AI usage to control costs.

---

## Table of Contents

1. [Goals & Constraints](#goals--constraints)
2. [Architecture Overview](#architecture-overview)
3. [Feature Scope — What's In vs Out](#feature-scope)
4. [Rate Limiting & Cost Control](#rate-limiting--cost-control)
5. [Workflow Changes (Elastic)](#workflow-changes)
6. [Application Changes (Next.js)](#application-changes)
7. [Authentication & User Identification](#authentication--user-identification)
8. [Deployment Strategy](#deployment-strategy)
9. [Monitoring & Alerting](#monitoring--alerting)
10. [Implementation Phases](#implementation-phases)

---

## Goals & Constraints

| Goal | Detail |
|------|--------|
| Let prospects experience Lurelit | Real AI-powered analysis, not just a canned demo |
| Exclude hunting features | No environment threat hunts (ES|QL agent), no HITL approval flows |
| Cap AI costs hard | Per-user and global daily/monthly ceilings |
| Low friction onboarding | No Elastic credentials required; anonymous or lightweight sign-up |
| Clear upgrade path | Users see what they're missing and can easily move to full version |

**Non-goals:** The demo tier does NOT connect to a real Elastic environment. It runs against an isolated Kibana instance (or a trimmed workflow) with no customer data access.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  demo.lurelit.app (Vercel / Docker)                         │
│                                                             │
│  ┌────────────────────────┐    ┌──────────────────────┐     │
│  │ Next.js App (demo mode)│───▶│  Rate Limit Layer    │     │
│  │ • Hunt UI hidden       │    │  (Upstash Redis)     │     │
│  │ • Demo badge/banner    │    │  • Per-IP / Per-user │     │
│  │ • Upgrade CTAs         │    │  • Global daily cap  │     │
│  └────────────┬───────────┘    └──────────┬───────────┘     │
│               │                           │                 │
│               ▼                           ▼                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Kibana (Isolated Demo Instance)                   │     │
│  │  • "Demo" workflow (no hunt steps)                 │     │
│  │  • Shared demo credentials (service account)       │     │
│  │  • No org data indices                             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Scope

### Included (Demo Tier)

| Feature | Notes |
|---------|-------|
| Screenshot upload & classification | Full Opus 4.7 vision analysis — the flagship capability |
| IOC extraction | URLs, domains, IPs, hashes, emails, phone numbers |
| IOC enrichment (VirusTotal + urlscan.io) | May be limited by VT free tier (4 req/min) |
| Enrichment summary (AI) | Opus 4.6 agent summarization |
| Real-time workflow timeline | Step-by-step progress visualization |
| Verdict panel & red flags | Full classification display |
| Cost display | Show token usage transparently |
| History (limited) | Last N analyses for the session only |
| Demo mode fallback | When all rate limits are exhausted, fall back to canned demo |

### Excluded (Full Tier Only)

| Feature | Reason | UX Treatment |
|---------|--------|--------------|
| Environment threat hunt | Most expensive AI step ($$$); requires org data | Grayed-out step card with "Upgrade to unlock" |
| HITL hunt approval flow | Depends on hunting | Hidden entirely |
| Bulk/parallel analysis | Cost multiplier | Single-image only; "Upgrade for bulk" tooltip |
| Slack notifications | Requires user Slack workspace | Hidden |
| Settings/config panel | Demo uses fixed config | Hidden |
| Setup wizard | Not needed for demo | Disabled |
| Metrics dashboard (full) | Limited history makes it sparse | Simplified version or hidden |
| Custom avatar upload | Minor; simplifies session management | Hidden |

### UX for Excluded Features

- **Workflow timeline:** Show the "Environment Threat Hunt" step in a locked/disabled state with a lock icon and tooltip: *"Threat hunting searches your org's logs for IOC matches. Available in the full version."*
- **Persistent banner:** Subtle top bar — *"You're using Lurelit Demo — [See full features] [Get started free]"*
- **Post-analysis CTA:** After results are shown, a card appears: *"Want to hunt for these IOCs in your environment? Upgrade to Lurelit →"*

---

## Rate Limiting & Cost Control

### Tier Architecture

Use **Upstash Redis** (already a dependency for Vercel deploy) for all counters.

```
Rate Limit Keys:
  demo:global:daily:{YYYY-MM-DD}     → counter (global daily cap)
  demo:global:monthly:{YYYY-MM}      → counter (global monthly cap)
  demo:user:{identifier}:daily       → counter (per-user daily cap)
  demo:user:{identifier}:total       → counter (per-user lifetime cap)
```

### Proposed Limits

| Scope | Limit | Rationale |
|-------|-------|-----------|
| **Per user, per day** | 5 analyses | Enough to evaluate the product; prevents single-user abuse |
| **Per user, lifetime** | 20 analyses | Encourages conversion before limit hit |
| **Global, per day** | 200 analyses | Hard budget ceiling (~$30-50/day at ~$0.15-0.25/analysis without hunt) |
| **Global, per month** | 3,000 analyses | Monthly budget ~$450-750 |
| **Concurrent global** | 10 simultaneous | Prevents burst spikes |

### Cost Estimate Per Analysis (No Hunt)

| Step | Model | Est. Tokens | Est. Cost |
|------|-------|-------------|-----------|
| Screenshot analysis | Opus 4.7 (vision) | ~2K in + ~1K out | ~$0.105 |
| Enrichment summary | Opus 4.6 (agent) | ~1.5K in + ~500 out | ~$0.060 |
| **Total per analysis** | | | **~$0.17** |

Without the hunt step (~$0.08-0.15 per hunt), plus removing Slack formatting (Sonnet, ~$0.01), the demo saves ~40-50% per analysis vs full.

### Implementation: Rate Limit Middleware

Add a new module `src/lib/rate-limit.ts`:

```typescript
// Pseudocode structure
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: 'user_daily' | 'user_lifetime' | 'global_daily' | 'global_monthly' | 'concurrent';
}

async function checkDemoRateLimit(userIdentifier: string): Promise<RateLimitResult>
async function recordDemoUsage(userIdentifier: string): Promise<void>
```

Integrate at the `/api/submit` route level — check before starting the workflow.

### Exhausted Limit UX

When limits are hit:
1. Return `429 Too Many Requests` with a JSON body including `reason`, `remaining`, and `resetAt`
2. Frontend shows a friendly modal: *"You've used all your demo analyses for today. Come back tomorrow, or upgrade for unlimited access."*
3. Optionally fall back to the existing canned demo mode so users can still see the UI flow

---

## Workflow Changes

### Option A: Separate Demo Workflow (Recommended)

Create a second workflow YAML derived from the main one, with these modifications:

```yaml
# workflow/demo-phishing-screenshot-analyzer.yaml
name: "Phishing & Smishing Screenshot Analyzer (Demo)"

inputs:
  - name: image_base64
    type: string
  - name: media_type
    type: string
    default: "image/png"
  # hunt_enabled removed — always disabled

steps:
  # Step 1 — analyze_screenshot (unchanged)
  # Step 2 — parse_analysis (unchanged)
  # Step 3 — IOC enrichment (unchanged, but with on-failure:continue for VT rate limits)
  # Step 4 — summarize_enrichment (unchanged)
  # Step 5 — REMOVED: hunt_router, hunt_in_environment, ask_hunt_approval, etc.
  # Step 6 — format_report (simplified: no hunt_results field)
```

**Why separate workflow:**
- Cleaner than conditional logic
- No risk of demo users accidentally triggering hunts
- Can be deployed to a dedicated Kibana space with restricted connectors
- Allows independent versioning of demo vs full experience

### Option B: Use `hunt_enabled: false` Input

The existing workflow already supports `hunt_enabled: false` which skips hunting. This is simpler but:
- Still exposes the hunt router step (shows in logs/timeline)
- Relies on workflow conditional logic being correct
- Shares the same Kibana space/connectors

**Recommendation:** Start with Option B for speed, migrate to Option A when demo traffic scales.

---

## Application Changes

### New Environment Variables

```env
# Demo tier control
LURELIT_DEMO_MODE=true              # Enables demo tier restrictions
DEMO_DAILY_USER_LIMIT=5             # Per-user daily cap
DEMO_LIFETIME_USER_LIMIT=20         # Per-user lifetime cap
DEMO_DAILY_GLOBAL_LIMIT=200         # Global daily cap
DEMO_MONTHLY_GLOBAL_LIMIT=3000      # Global monthly cap
DEMO_MAX_CONCURRENT=10              # Max simultaneous analyses
```

### Code Changes Summary

| File/Module | Change |
|-------------|--------|
| `src/lib/rate-limit.ts` | **New** — Rate limiting logic using Upstash Redis |
| `src/lib/config.ts` | Add `demoMode` to `GlobalConfig` interface |
| `src/app/api/submit/route.ts` | Add rate limit check before workflow submission; force `hunt_enabled: false` |
| `src/app/api/resume/[executionId]/route.ts` | Block HITL resume in demo mode (return 403) |
| `src/proxy.ts` | Allow unauthenticated access when `LURELIT_DEMO_MODE=true` |
| `src/components/Nav.tsx` | Show demo banner; hide settings |
| `src/components/WorkflowTimeline.tsx` | Show hunt step as "locked" |
| `src/components/HumanApproval.tsx` | Hide entirely in demo mode |
| `src/components/UploadZone.tsx` | Disable multi-file; show limit counter |
| `src/app/page.tsx` | Show remaining analyses count |
| `src/app/results/[executionId]/page.tsx` | Add post-analysis upgrade CTA |
| `src/app/history/page.tsx` | Limit to session-only history |
| `src/components/SettingsModal.tsx` | Hide in demo mode |
| `src/components/DemoBanner.tsx` | **New** — Persistent upgrade banner |
| `src/components/RateLimitModal.tsx` | **New** — Friendly limit-reached modal |
| `src/components/LockedFeature.tsx` | **New** — Reusable "upgrade to unlock" overlay |

### Demo Session Management

Since demo users don't authenticate with Kibana credentials, we need an alternative identity:

```typescript
// Demo session: lightweight, cookie-based
interface DemoSession {
  id: string;          // UUID, generated on first visit
  createdAt: number;   // Timestamp
  analysesUsed: number; // Denormalized from Redis (for UI display)
}
```

- Set a `lurelit_demo_session` cookie (httpOnly, 30-day expiry)
- Use the session ID as the rate limit `userIdentifier`
- Optionally combine with IP address fingerprinting to prevent cookie-clearing abuse

---

## Authentication & User Identification

### Demo Tier: No Kibana Login Required

The demo instance uses a **service account** to authenticate with Kibana:

```env
DEMO_KIBANA_USERNAME=lurelit-demo-svc
DEMO_KIBANA_PASSWORD=<rotated regularly>
# OR
DEMO_KIBANA_API_KEY=<encoded API key>
```

The proxy (`src/proxy.ts`) is modified:
- When `LURELIT_DEMO_MODE=true`, skip the Kibana credential check
- Inject the service account credentials for all Kibana API calls
- The demo user never sees or enters Kibana creds

### Anti-Abuse Measures

| Measure | Implementation |
|---------|---------------|
| Cookie-based identity | `lurelit_demo_session` cookie with UUID |
| IP-based fallback | If cookie missing/cleared, rate limit by IP |
| Image deduplication | Hash uploaded images; reject exact duplicates from same user |
| Payload size limit | Cap image to 5MB (already reasonable for screenshots) |
| CAPTCHA (optional, phase 2) | Add Cloudflare Turnstile if abuse is detected |
| Geographic restriction (optional) | Block known VPN/datacenter IP ranges if bot traffic appears |

---

## Deployment Strategy

### Recommended: Separate Deployment

Run the demo tier as a **separate deployment** from the production app:

| Aspect | Production | Demo Tier |
|--------|-----------|-----------|
| Domain | `app.lurelit.io` | `demo.lurelit.app` |
| Kibana instance | Customer's own | Isolated demo Kibana |
| Auth | Kibana credentials | Anonymous (cookie session) |
| Workflow | Full (with hunt) | Trimmed (no hunt) |
| Data | Customer indices | No org data |
| Cost control | Customer's problem | Your budget, rate limited |

### Vercel Deployment (Simplest)

```
demo.lurelit.app → Vercel project "lurelit-demo"
  • Same codebase, different env vars
  • LURELIT_DEMO_MODE=true
  • DEMO_KIBANA_API_KEY=<service account>
  • Upstash Redis for rate limiting + config
  • KIBANA_URL points to isolated demo Kibana
  • WORKFLOW_ID points to demo workflow
```

### Isolated Kibana Instance

Options for the backend Kibana:
1. **Elastic Cloud (Serverless)** — cheapest for low-traffic demo; pay per usage
2. **Elastic Cloud (Hosted)** — more control; ~$95/mo for smallest tier
3. **Self-hosted on same Docker host** — lowest cost but more ops burden

The demo Kibana needs:
- Anthropic connector (for Claude API calls)
- VirusTotal connector (free tier key)
- urlscan.io connector (free tier key)
- The demo workflow imported
- A service account with `workflow_execute` privileges only
- **No data indices** (hunt is disabled anyway)

---

## Monitoring & Alerting

### Metrics to Track

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Daily analysis count | Redis counter | >80% of global daily limit |
| Monthly analysis count | Redis counter | >80% of global monthly limit |
| AI cost per day | Kibana workflow metrics | >$40/day |
| Error rate | Vercel/app logs | >10% of submissions failing |
| Unique users per day | Redis HyperLogLog | Informational (growth tracking) |
| Conversion funnel | Upgrade CTA clicks | Informational |

### Cost Circuit Breaker

If global daily cost exceeds a hard ceiling (e.g., $50):
1. Immediately switch all new submissions to canned demo mode
2. Send alert to ops (Slack/email)
3. Existing in-flight analyses complete normally
4. Resets at midnight UTC

Implement as an atomic Redis check in the rate limit layer.

---

## Implementation Phases

### Phase 1 — MVP Demo (Core)

**Scope:** Get a working restricted demo deployed with basic rate limiting.

**Changes:**
- [ ] Add `src/lib/rate-limit.ts` with Upstash Redis counters
- [ ] Add `LURELIT_DEMO_MODE` environment variable handling
- [ ] Modify `src/app/api/submit/route.ts` to enforce limits + force `hunt_enabled: false`
- [ ] Modify `src/proxy.ts` to allow anonymous access in demo mode
- [ ] Add demo session cookie generation
- [ ] Add `DemoBanner.tsx` component
- [ ] Add `RateLimitModal.tsx` component
- [ ] Hide hunt-related UI (conditional rendering based on demo mode flag)
- [ ] Block `/api/resume` endpoint in demo mode
- [ ] Deploy to Vercel with isolated demo Kibana
- [ ] Use existing workflow with `hunt_enabled: false`

### Phase 2 — Polish & Anti-Abuse

**Scope:** Improve UX and prevent abuse.

- [ ] Create dedicated demo workflow YAML (no hunt steps at all)
- [ ] Add `LockedFeature.tsx` overlay for hunt step in timeline
- [ ] Add post-analysis upgrade CTA card
- [ ] Add remaining-analyses counter in upload zone
- [ ] Implement IP-based fallback rate limiting
- [ ] Add image hash deduplication
- [ ] Add analytics/tracking for conversion funnel (upgrade CTA clicks)
- [ ] Graceful degradation: fall back to canned demo when limits hit

### Phase 3 — Scale & Optimize

**Scope:** Optimize costs and handle growth.

- [ ] Implement cost circuit breaker
- [ ] Add Cloudflare Turnstile CAPTCHA for suspicious traffic
- [ ] Cache common analysis results (same image → serve cached verdict)
- [ ] Consider cheaper model substitution for demo (e.g., Sonnet for classification instead of Opus for vision — trade quality for cost)
- [ ] Add email capture gate (optional: require email before first analysis)
- [ ] A/B test limit thresholds (3 vs 5 vs 10 daily)
- [ ] Implement geographic/bot traffic filtering if needed

---

## Cost Projections

### Conservative Estimate (Phase 1)

| Assumption | Value |
|-----------|-------|
| Daily unique demo users | 50 |
| Avg analyses per user per day | 3 |
| Cost per analysis (no hunt) | $0.17 |
| **Daily AI cost** | **~$25.50** |
| **Monthly AI cost** | **~$765** |

### With Limits Enforced

| Scenario | Monthly Cost |
|----------|-------------|
| 100 analyses/day avg | ~$510 |
| 200 analyses/day (cap) | ~$1,020 |
| 3,000 analyses/month (cap) | ~$510 (max) |

### Infrastructure Costs

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro (demo project) | $20 |
| Upstash Redis (Pro) | $10 |
| Elastic Cloud Serverless (demo Kibana) | ~$50-95 |
| Anthropic API usage | $510-1,020 (capped) |
| VirusTotal (free tier) | $0 |
| urlscan.io (free tier) | $0 |
| **Total monthly** | **~$590-1,145** |

---

## Open Questions

1. **Email gate?** — Should we require email before first analysis (lead gen) or keep it fully anonymous (lower friction)?
2. **Model downgrade for demo?** — Could use Sonnet 4.6 for vision analysis instead of Opus 4.7 to halve costs, at some quality reduction. Users would see "better" results on upgrade.
3. **Shared vs per-user Kibana execution history?** — If demo users share a service account, all executions appear under one user in Kibana. May need filtering logic.
4. **Data retention** — How long do we keep demo analysis results? Suggest 7 days, then auto-purge.
5. **Geographic targeting** — Should the demo be available globally or geo-restricted to reduce abuse from bot-heavy regions?
