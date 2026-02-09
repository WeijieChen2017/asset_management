import { OrderSide, OrderStatus, OrderType, type PortfolioState, type MarketData } from '../types/portfolio';
import rawMarketData from './marketData.json';

const marketData = rawMarketData as MarketData;

function generatePerformanceSeries() {
  const series = [];
  let portfolio = 100;
  let benchmark = 100;
  const start = new Date('2025-12-01');
  for (let i = 0; i < 45; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    portfolio += (Math.random() - 0.47) * 1.2;
    benchmark += (Math.random() - 0.48) * 0.9;
    series.push({
      date: d.toISOString().slice(0, 10),
      portfolio: +portfolio.toFixed(2),
      benchmark: +benchmark.toFixed(2),
    });
  }
  return series;
}

function generateDrawdownSeries() {
  const series = [];
  const start = new Date('2025-12-01');
  let dd = 0;
  for (let i = 0; i < 45; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dd += (Math.random() - 0.55) * 0.4;
    if (dd > 0) dd = 0;
    series.push({
      date: d.toISOString().slice(0, 10),
      drawdown: +dd.toFixed(3),
    });
  }
  return series;
}

// Default to Scheme 3 (Neutral)
const defaultScheme = marketData.schemes.find((s) => s.id === 3) ?? marketData.schemes[0];
const defaultWeights = defaultScheme.holdings;

// Build positions from market data tickers that are in the default scheme
function buildPositions() {
  const totalAum = 125_400_000;
  return Object.entries(defaultWeights).map(([symbol, weight]) => {
    const ticker = marketData.tickers[symbol];
    if (!ticker) {
      return {
        symbol,
        name: symbol,
        sector: 'Unknown',
        quantity: 0,
        avgCost: 0,
        currentPrice: 0,
        marketValue: 0,
        weight,
        dayPnl: 0,
        totalPnl: 0,
        beta: 1.0,
      };
    }
    const marketValue = (weight / 100) * totalAum;
    const quantity = Math.round(marketValue / ticker.price);
    const avgCost = +(ticker.price * (1 - ticker.return1Y / 200)).toFixed(2);
    const totalPnl = Math.round((ticker.price - avgCost) * quantity);
    const dayPnl = Math.round(marketValue * (Math.random() - 0.45) * 0.01);
    return {
      symbol,
      name: ticker.name,
      sector: ticker.sector,
      quantity,
      avgCost,
      currentPrice: ticker.price,
      marketValue: Math.round(marketValue),
      weight,
      dayPnl,
      totalPnl,
      beta: ticker.beta,
    };
  });
}

export { marketData };

export const demoState: PortfolioState = {
  portfolio: {
    id: 'pf-001',
    name: 'Global Growth Fund',
    benchmark: 'S&P 500',
    currency: 'USD',
    totalAum: 125_400_000,
  },
  allocation: {
    activeScheme: 3,
    objective: 'Neutral',
    riskTarget: 12.0,
    constraints: {
      maxPosition: 8.0,
      maxSector: 25.0,
      turnoverLimit: 20.0,
    },
    targetWeights: defaultWeights,
    lastRunAt: '2026-02-09T10:30:00Z',
    frontier: [
      { risk: 6.0, return: 4.2, sharpe: 0.70 },
      { risk: 8.0, return: 6.8, sharpe: 0.85 },
      { risk: 10.0, return: 9.1, sharpe: 0.91 },
      { risk: 12.0, return: 11.0, sharpe: 0.92, label: 'Current' },
      { risk: 14.0, return: 12.4, sharpe: 0.89 },
      { risk: 16.0, return: 13.2, sharpe: 0.83 },
      { risk: 18.0, return: 13.8, sharpe: 0.77 },
      { risk: 20.0, return: 14.1, sharpe: 0.71 },
      { risk: 22.0, return: 14.2, sharpe: 0.65 },
    ],
  },
  trading: {
    positions: buildPositions(),
    orders: [
      { orderId: 'ORD-001', symbol: 'AAPL', side: OrderSide.Buy, quantity: 200, type: OrderType.Limit, limitPrice: 190.00, status: OrderStatus.Working, filledQty: 0, createdAt: '2026-02-09T09:45:00Z' },
      { orderId: 'ORD-002', symbol: 'NVDA', side: OrderSide.Sell, quantity: 500, type: OrderType.Market, status: OrderStatus.Filled, filledQty: 500, createdAt: '2026-02-09T09:30:00Z', filledAt: '2026-02-09T09:30:05Z' },
      { orderId: 'ORD-003', symbol: 'META', side: OrderSide.Buy, quantity: 300, type: OrderType.Limit, limitPrice: 400.00, status: OrderStatus.PartiallyFilled, filledQty: 150, createdAt: '2026-02-09T10:00:00Z' },
    ],
    recommendedTrades: [],
    lastRebalanceAt: null,
  },
  reporting: {
    kpis: {
      ytdReturn: 8.42,
      annualizedVol: 11.8,
      sharpe: 0.92,
      maxDrawdown: -5.3,
      trackingError: 2.1,
      informationRatio: 0.68,
    },
    performanceSeries: generatePerformanceSeries(),
    drawdownSeries: generateDrawdownSeries(),
    attribution: [
      { group: 'Technology', name: 'AAPL', contribution: 1.82 },
      { group: 'Technology', name: 'MSFT', contribution: 1.45 },
      { group: 'Technology', name: 'NVDA', contribution: 2.10 },
      { group: 'Technology', name: 'META', contribution: 0.65 },
      { group: 'Technology', name: 'GOOGL', contribution: 1.12 },
      { group: 'Financials', name: 'JPM', contribution: 0.75 },
      { group: 'Financials', name: 'V', contribution: 0.48 },
      { group: 'Healthcare', name: 'JNJ', contribution: -0.28 },
      { group: 'Healthcare', name: 'UNH', contribution: 0.42 },
      { group: 'Consumer Staples', name: 'PG', contribution: 0.18 },
      { group: 'Consumer Staples', name: 'KO', contribution: 0.12 },
    ],
    sectorExposures: [
      { name: 'Technology', weight: 31.2 },
      { name: 'Healthcare', weight: 13.6 },
      { name: 'Financials', weight: 12.6 },
      { name: 'Consumer Staples', weight: 8.7 },
      { name: 'Cash', weight: 30.0 },
    ],
    factorExposures: [
      { factor: 'Market', exposure: 1.02 },
      { factor: 'Size', exposure: 0.15 },
      { factor: 'Value', exposure: -0.22 },
      { factor: 'Momentum', exposure: 0.38 },
      { factor: 'Quality', exposure: 0.45 },
      { factor: 'Low Vol', exposure: -0.18 },
    ],
    feedbackSignals: [
      { type: 'warning', message: 'Technology sector exposure (31.2%) exceeds target max (25%). Consider rebalancing.', suggestedRiskTarget: 11.0, flags: ['SECTOR_OVERWEIGHT'] },
      { type: 'info', message: 'Portfolio Sharpe ratio (0.92) is near optimal frontier peak. Current allocation is efficient.', flags: ['EFFICIENT'] },
    ],
  },
  lastUpdated: '2026-02-09T10:35:00Z',
  demoMode: true,
};
