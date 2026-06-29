# ChronoSend — Feature Additions

This document highlights the security, reliability, and observability upgrades
added beyond the initial scaffold.  It also covers the companion
**Termite Biotech** data analysis pipeline.

---

## Security Hardening

| Feature | What changed | Why |
|---|---|---|
| **Google Client ID → env var** | Login page reads `VITE_GOOGLE_CLIENT_ID`; button hidden when unset | No more hardcoded secrets in source |
| **Message body encryption at rest** | AES-256-GCM on every `POST`/`PATCH`; auto-decrypt on `GET`; legacy plaintext fallback | Plaintext never touches the disk |
| **CSRF protection** | Crypto cookie + `X-CSRF-Token` header required on state-changing `/api` requests | Prevents cross-site request forgery |
| **Auth hardening** | Short-lived JWT access tokens (15 min) + hashed refresh tokens; bcrypt cost 12 | Industry-standard credential hygiene |

## Reliability & Resilience

| Feature | What changed | Why |
|---|---|---|
| **WebSocket reconnection** | Exponential backoff: 1s → 2s → 4s → … capped at 30s | Survives transient network drops |
| **DB-backed job queue** | In-memory `JobQueue` + crash recovery from `scheduled_messages` on restart | No lost messages after process restart |
| **calculateNextRun fix** | Iterative loop replaces recursion (max 1000 iterations) | Eliminates stack overflow on long-running recurrence chains |
| **Connection status indicator** | Wifi/WifiOff icon in TopBar reflects live WS state | User always knows connection health |

## SMTP Flexibility

| Feature | What changed | Why |
|---|---|---|
| **Custom SMTP** | `smtp_host`, `smtp_port`, `smtp_secure` fields in credentials schema + email sender dispatch | Users can use any SMTP provider, not just Gmail |

## Testing

- **48 server tests** (up from 26) — 9 suites covering auth, admin, messages, settings, scheduler, crypto, CSRF, health, persistence
- **28 frontend tests** — auth, utils, WebSocket client
- **New suites:** `csrf.test.ts`, `persistence.test.ts`, `health.test.ts`

---

## Termite Biotech — Data Analysis Pipeline

A standalone Python 3 script (`termite-analysis.py`) reads the four biofuel
research CSVs and produces a structured JSON report.

### What it computes

| CSV | Output |
|---|---|
| `cellulase_assay_data.csv` | Per-isolate mean/max activity rankings, glucose ranges |
| `fermentation_results.csv` | Per-strain max ethanol, productivity (g/L/h), ethanol trajectories |
| `agricultural_waste_test.csv` | Substrate + pretreatment glucose yield rankings |
| `glucose_calibration.csv` | Linear regression equation, R², detection limit, linear range |

### Usage

```bash
python termite-analysis.py                       # uses termite-projects/.../data
python termite-analysis.py --data-dir ./examples/termite  # custom path
```

Full JSON output is written to `{data-dir}/analysis_results.json`.

### Example

```bash
# Run on the bundled sample data
python termite-analysis.py --data-dir examples/termite
```

See [`examples/termite/`](./examples/termite/) for sample CSVs and expected output.
