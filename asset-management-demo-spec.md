# Asset Management / Portfolio Demo — AI Build Prompt + Backend→Frontend Contract

Copy/paste this file into your AI coding tool to generate the UI and wire it to a backend.

---

## 1) “Build my app” prompt (UI + UX + module loop)

```text
You are a senior product designer + frontend architect. Design and implement a professional web UI for an Asset Management / Portfolio Platform demo with 3 connected modules:

1) Asset Allocation
2) Simple Portfolio + Trading System
3) Reporting + Analysis

Data flow rules:
- Output of (1) feeds into (2) and (3)
- Output of (2) feeds into (3)
- Output of (3) feeds back into (1) and (2)

Goal: produce an institutional-grade UI that looks like a real investment platform. Use a consistent design system (typography, spacing, components, states) and an accessible color palette.

UI REQUIREMENTS
- Layout: App shell with left sidebar nav + top bar.
- Top bar must include: portfolio selector, date range selector, benchmark selector, “Last updated” timestamp, environment badge (DEMO), and a Run/Refresh button.
- Landing (Home) page should show a small “Platform Loop” diagram (1→2→3→1&2) plus quick status cards (Allocation, Orders, Risk, Performance).
- Each module is a separate route:
  A) Asset Allocation: inputs panel (constraints/risk target) + efficient frontier chart + target weights view (bar chart + table) + “Generate targets” button.
  B) Trading System: positions table + order ticket drawer (side panel) + orders blotter with states (Working/Filled/Rejected) + “Rebalance to targets” action.
  C) Reporting & Analysis: KPI row (Return, Vol, Sharpe, Max DD) + performance chart + drawdown chart + attribution table + factor/sector exposures.

DESIGN SYSTEM
- Style: modern institutional (clean, not playful). Use cards, subtle borders, minimal shadows.
- Typography: Inter or similar; clear hierarchy.
- Grid & spacing: 8px spacing system; consistent paddings; responsive.
- Tables must feel “finance-grade”: sticky headers, sortable columns, column chooser, search, export button (can be mock), row hover, right-aligned numbers.
- Charts: simple, readable; no neon colors; consistent legends; tooltips; units (% / bps / $).
- States: loading skeletons, empty state guidance (“Run allocation to generate target weights”), error banners, and toasts.

COLOR PALETTE (use consistently)
- Background: #0B1220
- Surface/card: #111A2E
- Surface-2: #0F172A
- Border: #23304A
- Text primary: #E6EEF9
- Text secondary: #A9B7D0
- Muted: #6B7A99
- Primary accent: #3B82F6 (blue)
- Secondary accent: #22C55E (green)
- Warning: #F59E0B (amber)
- Danger: #EF4444 (red)
- Highlight: #A78BFA (violet) used sparingly (e.g., selected series)

DATA INTEGRATION REQUIREMENTS
- The UI must read all data from a single backend API contract (defined below). Use a single PortfolioState snapshot model plus event updates.
- Every object must include: id, asOf timestamp, and version integer for optimistic updates.
- Pages must render even if some sections are missing (graceful degradation).

DELIVERABLES
1) High-level IA + page structure
2) Component list (tables/charts/forms)
3) Frontend routes and state model
4) Example UI mock structure (wireframe-level)
5) API integration plan consistent with the backend contract below (endpoints + JSON shapes)
6) Optional: include a small “demo mode” dataset fallback if API is unreachable

Now generate:
- The complete UI plan and the backend contract mapping for the 3-module loop.
```

---

## 2) Backend → Frontend instructions (data contract your UI can read)

### A) Core idea: one snapshot + optional events

- `GET /v1/portfolio/{portfolioId}/state` returns a **single JSON snapshot** containing everything the UI needs (allocation, positions, orders, reports).
- Optional: `WS /v1/stream?portfolioId=...` pushes incremental updates as events.

Frontend philosophy: **render from state**, then patch with events.

---

### B) PortfolioState (single source of truth)

```json
{
  "portfolioId": "P-001",
  "name": "Demo Balanced",
  "baseCurrency": "USD",
  "asOf": "2026-02-09T17:05:12Z",
  "version": 42,

  "allocation": {
    "runId": "A-20260209-001",
    "asOf": "2026-02-09T17:02:00Z",
    "version": 17,
    "inputs": {
      "universeId": "U-SP500-50",
      "objective": "max_sharpe",
      "riskTarget": 0.12,
      "constraints": {
        "maxPositionWeight": 0.08,
        "minPositionWeight": 0.00,
        "maxSectorWeight": 0.25,
        "turnoverLimit": 0.15
      }
    },
    "frontier": [
      { "risk": 0.08, "ret": 0.10 },
      { "risk": 0.10, "ret": 0.115 },
      { "risk": 0.12, "ret": 0.125 }
    ],
    "targetWeights": [
      { "symbol": "AAPL", "weight": 0.06 },
      { "symbol": "MSFT", "weight": 0.05 }
    ],
    "notes": ["Constraints satisfied", "Turnover within limit"]
  },

  "portfolio": {
    "asOf": "2026-02-09T17:05:12Z",
    "version": 22,
    "nav": 10000000,
    "cash": 250000,
    "positions": [
      {
        "symbol": "AAPL",
        "qty": 12000,
        "price": 185.12,
        "mv": 2221440,
        "pnlDay": 15400,
        "pnlTotal": 210000,
        "sector": "Technology",
        "beta": 1.1
      }
    ],
    "derived": {
      "exposureGross": 0.98,
      "exposureNet": 0.98,
      "trackingError": 0.034
    }
  },

  "trading": {
    "asOf": "2026-02-09T17:05:12Z",
    "version": 9,
    "recommendedTrades": [
      { "symbol": "AAPL", "side": "BUY", "qty": 500, "reason": "rebalance_to_target" }
    ],
    "orders": [
      {
        "orderId": "O-7771",
        "symbol": "AAPL",
        "side": "BUY",
        "qty": 500,
        "type": "MKT",
        "status": "WORKING",
        "createdAt": "2026-02-09T17:04:10Z",
        "filledQty": 0
      }
    ],
    "fills": []
  },

  "reporting": {
    "asOf": "2026-02-09T17:05:12Z",
    "version": 31,
    "kpis": {
      "returnYtd": 0.072,
      "volYtd": 0.115,
      "sharpeYtd": 0.63,
      "maxDrawdownYtd": -0.084
    },
    "performanceSeries": [
      { "date": "2026-01-02", "portfolio": 1.000, "benchmark": 1.000 },
      { "date": "2026-02-09", "portfolio": 1.072, "benchmark": 1.058 }
    ],
    "drawdownSeries": [
      { "date": "2026-02-09", "dd": -0.021 }
    ],
    "attribution": [
      { "group": "Sector", "name": "Technology", "contribution": 0.018 }
    ],
    "exposures": {
      "sectors": [{ "name": "Technology", "weight": 0.28 }],
      "factors": [{ "name": "Value", "exposure": -0.12 }]
    },
    "feedbackSignals": {
      "suggestedRiskTarget": 0.11,
      "flags": ["TE rising", "Concentration high in Tech"]
    }
  }
}
```

**Why this supports your loop**
- Allocation outputs → `allocation.targetWeights` used by Trading to compute `recommendedTrades`, and by Reporting to compare “target vs actual”.
- Trading outputs → `trading.orders/fills` feed Reporting performance/attribution.
- Reporting feedback → `reporting.feedbackSignals` feeds Allocation inputs and Trading risk controls.

---

### C) Minimal endpoints (enough for a demo)

#### Read
- `GET /v1/portfolios` → list portfolios (id, name)
- `GET /v1/portfolio/{id}/state` → the PortfolioState snapshot

#### Actions
- `POST /v1/portfolio/{id}/allocation/run`
  - body: allocation inputs (objective, riskTarget, constraints)
  - returns: `{ runId, status }` then the state updates
- `POST /v1/portfolio/{id}/trading/rebalance`
  - body: `{ allocationRunId }`
  - returns: `{ recommendedTradesCreated: n }`
- `POST /v1/portfolio/{id}/trading/orders`
  - body: order ticket fields
  - returns: `{ orderId, status }`

#### Streaming (optional, makes the demo feel real)
- `WS /v1/stream?portfolioId=...`

---

### D) Event messages (WebSocket patch shape)

```json
{
  "type": "STATE_PATCH",
  "portfolioId": "P-001",
  "asOf": "2026-02-09T17:05:30Z",
  "version": 43,
  "patch": {
    "trading": {
      "orders": [
        { "orderId": "O-7771", "status": "FILLED", "filledQty": 500 }
      ]
    }
  }
}
```

Frontend rule: **ignore patches** with `version <= currentVersion`.

---

### E) Frontend parsing rules (robustness)

1) **Treat numbers as numbers** (backend sends numeric types; UI formats them)
2) Always include:
- `asOf` (ISO timestamp)
- `version` (integer)
- IDs for runs/orders

3) Missing blocks are allowed:
- If `reporting` is absent → show “Run reporting” empty state
- If `allocation.targetWeights` empty → disable “Rebalance” and show hint

4) Stable enums
- Order `status`: `NEW | WORKING | PARTIALLY_FILLED | FILLED | REJECTED | CANCELED`

---

## 3) Page mapping: what each module reads/writes

### Asset Allocation page
- Reads: `allocation.inputs`, `allocation.frontier`, `allocation.targetWeights`
- Writes: `POST allocation/run`

### Trading page
- Reads: `portfolio.positions`, `allocation.targetWeights`, `trading.recommendedTrades`, `trading.orders`
- Writes: `POST trading/rebalance`, `POST trading/orders`

### Reporting & Analysis page
- Reads: `reporting.kpis`, `reporting.performanceSeries`, `reporting.attribution`, `reporting.exposures`, plus `portfolio` and `trading` context
- Writes (feedback): backend computes `reporting.feedbackSignals` and includes it in state

---

## 4) Optional: demo-mode fallback rule (recommended)

If the backend is unreachable, the frontend should:
- show a toast: “API unavailable — using demo dataset”
- load a static JSON object that matches **PortfolioState** exactly
- continue to allow page navigation and UI interactions (buttons can simulate state changes locally)

This keeps your demo reliable even without a live backend.

---
