#!/usr/bin/env python3
"""Fetch real market data for all tickers and write to marketData.json."""

import json
import os
from datetime import datetime, timezone

import yfinance as yf

# --- Ticker categories ---
CATEGORIES = {
    "core": ["AAPL", "MSFT", "JNJ", "PG", "JPM", "UNH", "KO", "V"],
    "growth": ["NVDA", "AMZN", "META", "GOOGL", "CRM", "ADBE"],
    "speculation": ["PLTR", "COIN", "MARA", "SMCI", "SOFI"],
    "cash": ["BIL", "SHV", "SGOV", "USFR"],
}

ALL_TICKERS = [t for tickers in CATEGORIES.values() for t in tickers]

# --- 5 Schemes ---
SCHEMES = [
    {"id": 1, "name": "Extreme Bull",   "weights": {"core": 40, "growth": 30, "speculation": 20, "cash": 10}},
    {"id": 2, "name": "Moderate Bull",   "weights": {"core": 40, "growth": 30, "speculation": 10, "cash": 20}},
    {"id": 3, "name": "Neutral",         "weights": {"core": 40, "growth": 30, "speculation":  0, "cash": 30}},
    {"id": 4, "name": "Mild Bear",       "weights": {"core": 40, "growth": 15, "speculation":  0, "cash": 45}},
    {"id": 5, "name": "Extreme Bear",    "weights": {"core": 40, "growth":  0, "speculation":  0, "cash": 60}},
]

OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "src", "data", "marketData.json"
)


def fetch_ticker_data(symbol: str, spy_returns) -> dict | None:
    """Fetch 1Y daily data for a single ticker and compute metrics."""
    try:
        tk = yf.Ticker(symbol)
        hist = tk.history(period="1y")
        if hist.empty or len(hist) < 20:
            print(f"  WARNING: {symbol} has insufficient data ({len(hist)} rows), skipping")
            return None

        info = tk.info or {}
        closes = hist["Close"]
        current_price = float(closes.iloc[-1])
        start_price = float(closes.iloc[0])
        return_1y = ((current_price / start_price) - 1) * 100

        daily_returns = closes.pct_change().dropna()
        vol = float(daily_returns.std() * (252 ** 0.5) * 100)

        # Beta vs SPY
        aligned = daily_returns.align(spy_returns, join="inner")
        if len(aligned[0]) > 20:
            cov = aligned[0].cov(aligned[1])
            var_spy = aligned[1].var()
            beta = float(cov / var_spy) if var_spy > 0 else 1.0
        else:
            beta = 1.0

        # Determine category
        category = "core"
        for cat, tickers in CATEGORIES.items():
            if symbol in tickers:
                category = cat
                break

        # Price history (weekly samples to keep JSON small)
        history = []
        for i in range(0, len(hist), 5):
            row = hist.iloc[i]
            history.append({
                "date": row.name.strftime("%Y-%m-%d"),
                "close": round(float(row["Close"]), 2),
            })
        # Always include most recent
        last_row = hist.iloc[-1]
        last_entry = {
            "date": last_row.name.strftime("%Y-%m-%d"),
            "close": round(float(last_row["Close"]), 2),
        }
        if not history or history[-1]["date"] != last_entry["date"]:
            history.append(last_entry)

        return {
            "name": info.get("shortName", info.get("longName", symbol)),
            "sector": info.get("sector", "N/A"),
            "category": category,
            "price": round(current_price, 2),
            "return1Y": round(return_1y, 1),
            "vol": round(vol, 1),
            "beta": round(beta, 2),
            "history": history,
        }
    except Exception as e:
        print(f"  ERROR fetching {symbol}: {e}")
        return None


def build_scheme_holdings(scheme: dict, tickers_data: dict) -> dict:
    """Distribute each category's weight equally among its tickers."""
    holdings = {}
    for category, category_weight in scheme["weights"].items():
        if category_weight == 0:
            continue
        cat_tickers = [t for t in CATEGORIES[category] if t in tickers_data]
        if not cat_tickers:
            continue
        per_ticker = round(category_weight / len(cat_tickers), 2)
        for t in cat_tickers:
            holdings[t] = per_ticker
    return holdings


def main():
    print("Fetching SPY benchmark data...")
    spy = yf.Ticker("SPY")
    spy_hist = spy.history(period="1y")
    spy_returns = spy_hist["Close"].pct_change().dropna()

    print(f"Fetching data for {len(ALL_TICKERS)} tickers...")
    tickers_data = {}
    for symbol in ALL_TICKERS:
        print(f"  {symbol}...")
        data = fetch_ticker_data(symbol, spy_returns)
        if data:
            tickers_data[symbol] = data

    print(f"Successfully fetched {len(tickers_data)}/{len(ALL_TICKERS)} tickers")

    # Build schemes with holdings
    schemes_output = []
    for scheme in SCHEMES:
        holdings = build_scheme_holdings(scheme, tickers_data)
        schemes_output.append({
            "id": scheme["id"],
            "name": scheme["name"],
            "weights": scheme["weights"],
            "holdings": holdings,
        })

    output = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "tickers": tickers_data,
        "schemes": schemes_output,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote market data to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
