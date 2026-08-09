
# Project EquiCheck | Accessibility Automation Portal

**Submitted by:** Ganjar Setia <ganjar.setia@gmail.com>  
**Challenge:** Oobee Accessibility Automation Challenge

EquiCheck is a web portal that scans a target webpage for accessibility bugs using
[Playwright](https://playwright.dev/) and [axe-core](https://github.com/dequelabs/axe-core),
then uses an LLM (via [OpenCode Zen](https://opencode.ai/docs/zen/)) to explain each WCAG
violation in beginner friendly language and suggest fixes.

Built as a take home assignment, a reliable working prototype focused on clean
architecture, testability, and demonstrable accessibility practice.

---

## Features

- Scan any public URL for WCAG 2.x accessibility violations.
- Accordion-based results with severity badges, descriptions, HTML snippets and official
  axe/WCAG references.
- A **"Get help"** button on every violation that sends the offending HTML + violation data
  to an LLM and returns:
  - **The problem** in plain language
  - **Why it matters** (affected users / real world impact)
  - **Suggested fix**
  - **Corrected HTML** example
  - **WCAG reference** link
- Friendly error handling for invalid URLs, timeouts, navigation failures and AI outages.

---

## Architecture

```
React + Vite (client)
        │  POST /api/scan, /api/explain
        ▼
Express API (server)
        │
        ├── Playwright (headless Chromium)
        │         └── @axe-core/playwright  → normalized violations
        │
        └── AI Service ─────────────► OpenCode Zen (OpenAI compatible endpoint)
```

### Folder structure

```
equicheck/
├── client/                 # React + Vite SPA
│   └── src/
│       ├── features/
│       │   ├── scan/       # ScanForm
│       │   └── results/    # ResultsAccordion, ViolationItem, AiHelpDialog
│       └── services/       # centralized API client
├── server/                 # Express API
│   └── src/
│       ├── routes/         # /api/scan, /api/explain
│       ├── services/       # scanService (Playwright), aiService (Zen), promptBuilder
│       ├── utils/          # urlValidator
│       └── middleware/     # error handling
├── docs/                   # assignment + spec + task breakdown
├── .env                    # OPENCODE_ZEN_API (your key)
└── package.json            # npm workspaces, dev/start/test/lint scripts
```

### Data flow

1. User enters a URL → `POST /api/scan`.
2. Server validates the URL (http/https only), launches headless Chromium, navigates, injects
   and runs axe-core, then normalizes violations (`id`, `ruleId`, `impact`, `description`,
   `html`, `target`, `failureSummary`, `checks`, links).
3. Frontend renders the results as accordions grouped/sorted by severity.
4. Clicking **"Get help"** → `POST /api/explain` with the violation.
5. Server builds a deterministic prompt and calls OpenCode Zen; the LLM returns a structured
   JSON explanation rendered in a dialog.

---

## Setup

### Prerequisites

- Node.js ≥ 18 (tested on v24)
- npm ≥ 10
- An OpenCode Zen API key (https://opencode.ai/auth) — free models are fine. You can use my API key, just download it [here](https://drive.google.com/file/d/1TJ60lAXGVXEdTo5f7Kiiua_xfghV9DhO/view?usp=drive_link) & click get request access

### 1. Install & configure

```bash
# Install all workspace dependencies (client + server)
npm install

# Install the Playwright Chromium browser (required for scanning)
npx playwright install chromium
```

Copy `.env.example` to `.env` at the repo root and set your key:
Or you can use my `.env`, just download it [here](https://drive.google.com/file/d/1TJ60lAXGVXEdTo5f7Kiiua_xfghV9DhO/view?usp=drive_link) & click get request access

```
OPENCODE_ZEN_API=sk-...
```

> The server loads `.env` from the repo root. Add your key as `OPENCODE_ZEN_API` that is
> the variable read by `server/src/config.js`.

### 2. Run locally

```bash
# Runs both the API (port 3001) and the Vite dev server (port 5173) with hot reload
npm run dev
```

Open http://localhost:5173, enter a public URL (or `http://localhost:8899/some-page.html`
served locally), and hit **Scan**.

Run pieces separately:

```bash
npm run dev:server   # API only on http://localhost:3001
npm run dev:client   # Vite dev server only
```

### 3. Production build

```bash
npm run build        # builds client into client/dist
npm start            # serves the API; point a static host at client/dist
```

---

## Environment variables

| Variable              | Default                  | Description                                        |
| --------------------- | ------------------------ | -------------------------------------------------- |
| `OPENCODE_ZEN_API`    | *(required)*             | OpenCode Zen API key.                              |
| `ZEN_MODEL`           | `deepseek-v4-flash-free` | Model used for explanations (free: `big-pickle`). |
| `PORT`                | `3001`                    | API port.                                          |
| `HOST`                | `localhost`               | API bind host.                                     |
| `CORS_ORIGIN`         | `true` (allow all)       | CORS origin for `cors` middleware.                |
| `SCAN_TIMEOUT_MS`     | `30000`                  | Page navigation timeout for scans.                 |
| `ZEN_TIMEOUT_MS`      | `60000`                  | AI request timeout.                               |
| `MAX_NODES_PER_VIOLATION` | `5`                  | Cap on HTML nodes returned per violation.          |
| `LOG_DIR`                | `server/logs`         | Directory for log files (created automatically).   |
| `LOG_FILE`               | `equicheck.log`       | Log file name (git-ignored).                       |
| `LOG_LEVEL`              | `info`                | Logging verbosity: `debug` \| `info` \| `warn` \| `error`. |

See [server/.env.example](server/.env.example) for the full list (`.env` itself is git ignored).

---

## Testing

```bash
npm test            # server + client unit/integration/component tests
npm test:server     # backend only (vitest + supertest)
npm test:client     # frontend only (vitest + testing-library)
npm run lint        # ESLint for both workspaces
```

### What's covered

- **Backend:** URL validation, prompt-builder determinism, LLM parsing (JSON, markdown
  fences, plain-text fallback, HTTP/network/timeout errors), `/api/scan` & `/api/explain`
  routes (mocked Playwright/AI).
- **Frontend:** ScanForm validation & loading states, ResultsAccordion empty/summary
  rendering, and the Get Help → AI explain → dialog success/error flow (mocked API).

---

## Technical trade-offs

| Decision                            | Why / trade-off                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| **Browser launched per scan**       | Simple, isolated; avoids long lived resource leaks. Slower for high throughput. For production: I will not use this, I will make it stand by, running parallel & distributed. So it can run much faster for scan, etc.  |
| **No authentication / users**       | Out of scope for a prototype (see SPEC non-goals).                              |
| **Cloud LLM via OpenCode Zen**      | No local model infra; free models suffice. Request data leaves the machine.      |
| **No caching of scans or replies**  | Keeps the prototype simple; repeated scans re trigger work.                      |
| **JavaScript (not TypeScript)**     | I want to coding it fast. Faster to ship a clean prototype; JSDoc + ESLint keep it safe. Types trade-off. For production: I will use TypeScript 7 |
| **Axe tags limited to WCAG + best-practice** | Focuses results on well understood criteria, not every possible rule. |
| **Axe scan retried on SPA navigation**    | SPAs that navigate after load can destroy the axe execution context; we retry a few times so scans succeed instead of failing. Adds up to ~1.6 s latency on such pages. |
| **Navigates on `domcontentloaded`**       | Waits only for the DOM (what axe scans), not every image/script/ad. Heavy sites (e.g. Yahoo, portals) otherwise exceed the timeout while their assets stream in. |
| **HTML snippet truncated**           | Caps prompt/response size and respects LLM token limits.                        |
| **Strict JSON LLM output**          | Structured UI + testable parsing; the app degrades gracefully on malformed reply.|
| **Robust JSON extraction**          | A brace aware parser (string/escape-aware) extracts the JSON object even when the model appends prose after it, and unwraps accidentally nested responses, so users never see raw JSON. |
| **AI retried on transient failures** | Free models intermittently fail (empty reply, 429, 5xx); a few retries make "Get help" reliable. Adds latency on failures. |
| **Provider failures surfaced openly** | When the AI fails, the UI says it's an OpenCode Zen/provider problem, not the app and offers a **Try again** button, so users aren't misled into thinking their scan broke. |
| **File logging**                    | Errors & warnings go to `server/logs/` (git-ignored) for triage in a prototype with no monitoring. |

---

### Additional info - My general Quality standards

For real projects I apply an end to end quality pipeline:

1. **Clear requirements** – shared spec and acceptance criteria before code.
2. **Good engineering practices** – clean architecture, readable & reviewed code, sensible conventions.
3. **Automated testing** – unit, integration and end to end tests gate every change.
4. **Code review** – peers review before anything merges.
5. **CI/CD quality gates** – lint, test, type-check and build must pass on every push.
6. **Production monitoring** – structured logs, metrics and alerts catch issues nobody expected.
7. **Continuous improvement** – every outage/incident becomes a follow-up task, and standards are revisited as the product evolves.

### What this assignment actually used

This prototype is a scoped, time-boxed slice of that framework, so I focused on the
parts with the highest value for a maintainable one-off deliverable:

- **Clear requirements** – the spec, task breakdown and this README live under
  [`docs/`](docs/), so the assignment's intent and scope are unambiguous.
- **TDD (Test-driven development)** – behaviours were specified and tested as the code
  was written, not retrofitted. The suite covers URL validation, LLM JSON parsing
  (including malformed, nested and fenced replies), prompt determinism, the `/api/scan`
  and `/api/explain` routes with mocked Playwright and AI dependencies, plus the
  frontend scan → results → "Get help" flows.
- **Logging** – structured request and error logs go to `server/logs/equicheck.log`
  (git-ignored), so production-style triage is possible even without a monitoring stack.

---

## Roadmap / not implemented

- Persistent scan history & reports
- Scan scheduling & diffing
- Auth and multi-user workspaces
- SSRF guardrails beyond protocol/host checks
- Caching of scan results / AI explanations in production

---
