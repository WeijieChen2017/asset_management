import type { PortfolioState } from '../types/portfolio';

export type MLModelId = 'ML_12' | 'ML_13' | 'ML_23' | 'ML_31' | 'ML_32';

export interface MLModelDef {
  id: MLModelId;
  name: string;
  location: string;
  goal: string;
  owningModule: string;
  readsFrom: string[];
  writesTo: string[];
  confidence: number;
  buildInput: (state: PortfolioState) => Record<string, unknown>;
  mockOutput: Record<string, unknown>;
}

const toWeightArray = (weights: Record<string, number>) =>
  Object.entries(weights).map(([symbol, weight]) => ({ symbol, weight: +(weight / 100).toFixed(4) }));

const toRatio = (value: number) => (value > 1 ? +(value / 100).toFixed(4) : value);

export const mlModels: MLModelDef[] = [
  {
    id: 'ML_12',
    name: 'Trade Planner',
    location: 'Allocation → Trading',
    goal: 'Convert target weights + current positions into executable trades + optional slicing plan.',
    owningModule: 'backend/services/trading/ml_12_trade_plan.py',
    readsFrom: [
      'allocation.runId',
      'allocation.targetWeights',
      'allocation.inputs.constraints.turnoverLimit',
      'portfolio.nav',
      'portfolio.cash',
      'portfolio.positions',
    ],
    writesTo: ['trading.recommendedTrades', 'trading.orderPlan'],
    confidence: 0.78,
    buildInput: (state) => ({
      allocation: {
        runId: state.allocation.lastRunAt ?? 'A-LOCAL-RUN',
        targetWeights: toWeightArray(state.allocation.targetWeights),
        constraints: { turnoverLimit: toRatio(state.allocation.constraints.turnoverLimit) },
      },
      portfolio: {
        nav: state.portfolio.totalAum,
        cash: Math.round(state.portfolio.totalAum * 0.02),
        positions: state.trading.positions.map((pos) => ({
          symbol: pos.symbol,
          qty: pos.quantity,
          price: pos.currentPrice,
        })),
      },
      market: {
        liquidity: state.trading.positions.slice(0, 5).map((pos) => ({
          symbol: pos.symbol,
          adv: 80000000,
          spreadBps: 1.2,
        })),
        timestamp: new Date().toISOString(),
      },
      riskControls: {
        maxOrderNotional: 500000,
        maxParticipationRate: 0.1,
      },
    }),
    mockOutput: {
      recommendedTrades: [
        {
          symbol: 'AAPL',
          side: 'BUY',
          qty: 500,
          reason: 'rebalance_to_target',
          expectedSlippageBps: 3.4,
          fillProbability: 0.92,
        },
      ],
      orderPlan: [
        {
          symbol: 'AAPL',
          parentQty: 500,
          slices: [
            { qty: 200, type: 'MKT' },
            { qty: 300, type: 'LMT', limitOffsetBps: 2 },
          ],
        },
      ],
    },
  },
  {
    id: 'ML_13',
    name: 'Allocation Explainer',
    location: 'Allocation → Reporting',
    goal: 'Produce explainability + expected risk/return summary for reporting.',
    owningModule: 'backend/services/reporting/ml_13_allocation_explain.py',
    readsFrom: ['allocation.inputs', 'allocation.frontier', 'allocation.targetWeights'],
    writesTo: ['reporting.expectedSummary', 'reporting.allocationExplainability'],
    confidence: 0.84,
    buildInput: (state) => ({
      allocation: {
        runId: state.allocation.lastRunAt ?? 'A-LOCAL-RUN',
        inputs: {
          objective: state.allocation.objective,
          riskTarget: toRatio(state.allocation.riskTarget),
          constraints: {
            maxPositionWeight: toRatio(state.allocation.constraints.maxPosition),
            maxSectorWeight: toRatio(state.allocation.constraints.maxSector),
            turnoverLimit: toRatio(state.allocation.constraints.turnoverLimit),
          },
        },
        targetWeights: toWeightArray(state.allocation.targetWeights),
        frontier: state.allocation.frontier.map((point) => ({ risk: toRatio(point.risk), ret: toRatio(point.return) })),
      },
      benchmark: {
        id: state.portfolio.benchmark,
        weights: toWeightArray(state.allocation.targetWeights),
      },
      riskModel: {
        covVersion: 'COV-20260209',
        factorModel: 'barra_like_v1',
      },
    }),
    mockOutput: {
      expectedSummary: {
        expectedReturn: 0.125,
        expectedVol: 0.12,
        expectedTrackingError: 0.034,
      },
      explanations: [
        {
          type: 'constraint_binding',
          message: 'Max sector weight constraint limited Technology exposure.',
          evidence: { constraint: 'maxSectorWeight', value: 0.25 },
        },
      ],
      targetVsBenchmark: [
        {
          symbol: 'AAPL',
          targetWeight: 0.06,
          benchmarkWeight: 0.07,
          activeWeight: -0.01,
        },
      ],
    },
  },
  {
    id: 'ML_23',
    name: 'Execution Evaluator',
    location: 'Trading → Reporting',
    goal: 'Convert orders/fills into execution-quality metrics and anomalies for reporting.',
    owningModule: 'backend/services/reporting/ml_23_execution_eval.py',
    readsFrom: ['trading.orders', 'trading.fills'],
    writesTo: ['reporting.execution'],
    confidence: 0.81,
    buildInput: (state) => ({
      trading: {
        orders: state.trading.orders.map((order) => ({
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side.toUpperCase(),
          qty: order.quantity,
          type: order.type,
          createdAt: order.createdAt,
        })),
        fills: state.trading.fills.map((fill) => ({
          orderId: fill.orderId,
          fillQty: fill.fillQty,
          fillPrice: fill.fillPrice,
          fillTime: fill.fillTime,
        })),
      },
      market: {
        referencePrices: state.trading.positions.slice(0, 5).map((pos) => ({
          symbol: pos.symbol,
          arrivalPrice: pos.currentPrice,
          vwap5m: +(pos.currentPrice * 1.0003).toFixed(2),
        })),
        spreadsBps: state.trading.positions.slice(0, 5).map((pos) => ({ symbol: pos.symbol, bps: 1.2 })),
      },
    }),
    mockOutput: {
      executionMetrics: {
        implementationShortfallBps: 4.3,
        slippageBps: 4.3,
        spreadCostBps: 1.2,
      },
      orderScores: [
        {
          orderId: 'O-7771',
          qualityScore: 0.81,
          notes: ['Filled quickly', 'Slightly above arrival'],
        },
      ],
      anomalies: [],
    },
  },
  {
    id: 'ML_31',
    name: 'Allocation Advisor',
    location: 'Reporting → Allocation',
    goal: 'Use reporting/risk results to suggest new allocation inputs (risk target, constraints).',
    owningModule: 'backend/services/allocation/ml_31_alloc_feedback.py',
    readsFrom: [
      'reporting.kpis',
      'reporting.exposures',
      'reporting.feedbackSignals.flags',
      'allocation.inputs',
    ],
    writesTo: ['reporting.suggestedAllocationInputs'],
    confidence: 0.76,
    buildInput: (state) => ({
      reporting: {
        kpis: {
          returnYtd: toRatio(state.reporting.kpis.ytdReturn),
          volYtd: toRatio(state.reporting.kpis.annualizedVol),
          sharpeYtd: state.reporting.kpis.sharpe,
          maxDrawdownYtd: toRatio(state.reporting.kpis.maxDrawdown),
        },
        exposures: {
          sectors: state.reporting.sectorExposures.map((sector) => ({
            name: sector.name,
            weight: toRatio(sector.weight),
          })),
          factors: state.reporting.factorExposures.map((factor) => ({
            name: factor.factor,
            exposure: factor.exposure,
          })),
        },
        flags: state.reporting.feedbackSignals.flatMap((signal) => signal.flags ?? []),
      },
      allocation: {
        inputs: {
          riskTarget: toRatio(state.allocation.riskTarget),
          constraints: {
            maxSectorWeight: toRatio(state.allocation.constraints.maxSector),
            turnoverLimit: toRatio(state.allocation.constraints.turnoverLimit),
          },
        },
      },
    }),
    mockOutput: {
      suggestedAllocationInputs: {
        riskTarget: 0.11,
        constraints: { maxSectorWeight: 0.22, turnoverLimit: 0.12 },
      },
      reasons: [
        { message: 'Tracking error rising; reduce active risk.', severity: 'MEDIUM' },
        { message: 'Sector concentration flagged; tighten max sector weight.', severity: 'HIGH' },
      ],
    },
  },
  {
    id: 'ML_32',
    name: 'Trading Controller',
    location: 'Reporting → Trading',
    goal: 'Use reporting + execution metrics to suggest trading throttles/controls.',
    owningModule: 'backend/services/trading/ml_32_trading_controls.py',
    readsFrom: [
      'reporting.execution.executionMetrics',
      'reporting.feedbackSignals.flags',
      'trading.controlsSuggested',
    ],
    writesTo: ['trading.controlsSuggested'],
    confidence: 0.79,
    buildInput: (state) => ({
      reporting: {
        executionMetrics: state.reporting.execution?.executionMetrics ?? { implementationShortfallBps: 12.0 },
        marketRegime: { volRegime: state.reporting.kpis.annualizedVol > 12 ? 'HIGH' : 'NORMAL' },
        flags: state.reporting.feedbackSignals.flatMap((signal) => signal.flags ?? []),
      },
      trading: {
        currentControls: state.trading.controlsSuggested ?? {
          maxParticipationRate: 0.1,
          maxOrderNotional: 500000,
          preferLimitOrders: false,
        },
      },
    }),
    mockOutput: {
      suggestedTradingControls: {
        maxParticipationRate: 0.06,
        maxOrderNotional: 300000,
        preferLimitOrders: true,
      },
      tradeGating: { allowRebalance: true, blockReasons: [] },
    },
  },
];

export const mlModelMap = mlModels.reduce<Record<MLModelId, MLModelDef>>((acc, model) => {
  acc[model.id] = model;
  return acc;
}, {} as Record<MLModelId, MLModelDef>);
