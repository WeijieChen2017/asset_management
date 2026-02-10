export enum OrderStatus {
  Working = 'Working',
  Filled = 'Filled',
  PartiallyFilled = 'PartiallyFilled',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export enum OrderSide {
  Buy = 'Buy',
  Sell = 'Sell',
}

export enum OrderType {
  Market = 'MKT',
  Limit = 'LMT',
}

export interface TickerData {
  name: string;
  sector: string;
  category: 'core' | 'growth' | 'speculation' | 'cash';
  price: number;
  return1Y: number;
  vol: number;
  beta: number;
  history: { date: string; close: number }[];
}

export interface MarketScheme {
  id: number;
  name: string;
  weights: { core: number; growth: number; speculation: number; cash: number };
  holdings: Record<string, number>;
}

export interface MarketData {
  fetchedAt: string;
  tickers: Record<string, TickerData>;
  schemes: MarketScheme[];
}

export interface Allocation {
  activeScheme: number;
  objective: string;
  riskTarget: number;
  constraints: {
    maxPosition: number;
    maxSector: number;
    turnoverLimit: number;
  };
  targetWeights: Record<string, number>;
  lastRunAt: string | null;
  frontier: FrontierPoint[];
}

export interface FrontierPoint {
  risk: number;
  return: number;
  sharpe: number;
  label?: string;
}

export interface Position {
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  weight: number;
  dayPnl: number;
  totalPnl: number;
  beta: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  type: OrderType;
  limitPrice?: number;
  status: OrderStatus;
  filledQty: number;
  createdAt: string;
  filledAt?: string;
}

export interface RecommendedTrade {
  symbol: string;
  side: OrderSide;
  quantity: number;
  reason: string;
  expectedSlippageBps?: number;
  fillProbability?: number;
}

export interface OrderPlanSlice {
  qty: number;
  type: string;
  limitOffsetBps?: number;
}

export interface OrderPlanItem {
  symbol: string;
  parentQty: number;
  slices: OrderPlanSlice[];
}

export interface Fill {
  orderId: string;
  fillQty: number;
  fillPrice: number;
  fillTime: string;
}

export interface SuggestedControls {
  maxParticipationRate: number;
  maxOrderNotional: number;
  preferLimitOrders: boolean;
}

export interface Trading {
  positions: Position[];
  orders: Order[];
  recommendedTrades: RecommendedTrade[];
  orderPlan: OrderPlanItem[] | null;
  fills: Fill[];
  controlsSuggested: SuggestedControls | null;
  lastRebalanceAt: string | null;
}

export interface PerformancePoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
}

export interface Attribution {
  group: string;
  name: string;
  contribution: number;
}

export interface Exposure {
  name: string;
  weight: number;
}

export interface FactorExposure {
  factor: string;
  exposure: number;
}

export interface FeedbackSignal {
  type: 'info' | 'warning' | 'danger';
  message: string;
  suggestedRiskTarget?: number;
  flags?: string[];
}

export interface KPIs {
  ytdReturn: number;
  annualizedVol: number;
  sharpe: number;
  maxDrawdown: number;
  trackingError: number;
  informationRatio: number;
}

export interface ExecutionReport {
  executionMetrics: {
    implementationShortfallBps: number;
    slippageBps: number;
    spreadCostBps: number;
  };
  orderScores: {
    orderId: string;
    qualityScore: number;
    notes: string[];
  }[];
  anomalies: string[];
}

export interface AllocationExplainability {
  explanations: {
    type: string;
    message: string;
    evidence: Record<string, unknown>;
  }[];
  targetVsBenchmark: {
    symbol: string;
    targetWeight: number;
    benchmarkWeight: number;
    activeWeight: number;
  }[];
}

export interface ExpectedSummary {
  expectedReturn: number;
  expectedVol: number;
  expectedTrackingError: number;
}

export interface SuggestedAllocationInputs {
  riskTarget: number;
  constraints: {
    maxSectorWeight: number;
    turnoverLimit: number;
  };
  reasons: {
    message: string;
    severity: string;
  }[];
}

export interface Reporting {
  kpis: KPIs;
  performanceSeries: PerformancePoint[];
  drawdownSeries: DrawdownPoint[];
  attribution: Attribution[];
  sectorExposures: Exposure[];
  factorExposures: FactorExposure[];
  feedbackSignals: FeedbackSignal[];
  execution: ExecutionReport | null;
  allocationExplainability: AllocationExplainability | null;
  expectedSummary: ExpectedSummary | null;
  suggestedAllocationInputs: SuggestedAllocationInputs | null;
}

export interface Portfolio {
  id: string;
  name: string;
  benchmark: string;
  currency: string;
  totalAum: number;
}

export interface PortfolioState {
  portfolio: Portfolio;
  allocation: Allocation;
  trading: Trading;
  reporting: Reporting;
  lastUpdated: string;
  demoMode: boolean;
}
