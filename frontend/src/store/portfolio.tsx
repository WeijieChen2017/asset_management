import React, { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { demoState, marketData } from '../data/demoState';
import { OrderSide, OrderStatus, OrderType, type Allocation, type OrderPlanItem, type PortfolioState, type RecommendedTrade } from '../types/portfolio';

type Action =
  | { type: 'SET_STATE'; payload: PortfolioState }
  | { type: 'PATCH_STATE'; payload: Partial<PortfolioState> }
  | { type: 'SET_SCHEME'; payload: { schemeId: number } }
  | { type: 'RUN_ALLOCATION'; payload: { objective: string; riskTarget: number; constraints: Allocation['constraints'] } }
  | { type: 'SUBMIT_ORDER'; payload: { symbol: string; side: OrderSide; quantity: number; type: OrderType; limitPrice?: number } }
  | { type: 'REBALANCE' }
  | { type: 'RUN_ML_MODEL'; payload: { modelId: string; output: unknown } }
  | { type: 'APPLY_SUGGESTED_ALLOCATION' };

function generateRecommendedTrades(
  positions: PortfolioState['trading']['positions'],
  targetWeights: Record<string, number>,
  totalAum: number
): RecommendedTrade[] {
  const trades: RecommendedTrade[] = [];
  positions.forEach((pos) => {
    const targetWeight = targetWeights[pos.symbol] ?? 0;
    const currentWeight = pos.weight;
    const diff = targetWeight - currentWeight;
    if (Math.abs(diff) > 0.3) {
      const targetValue = (targetWeight / 100) * totalAum;
      const currentValue = pos.marketValue;
      const diffValue = targetValue - currentValue;
      const qty = Math.abs(Math.round(diffValue / pos.currentPrice));
      if (qty > 0) {
        trades.push({
          symbol: pos.symbol,
          side: diff > 0 ? OrderSide.Buy : OrderSide.Sell,
          quantity: qty,
          reason: diff > 0 ? `Underweight by ${diff.toFixed(1)}%` : `Overweight by ${Math.abs(diff).toFixed(1)}%`,
        });
      }
    }
  });
  return trades;
}

function normalizeOrderSide(side: unknown): OrderSide {
  if (typeof side === 'string' && side.toUpperCase().startsWith('S')) return OrderSide.Sell;
  return OrderSide.Buy;
}

function normalizePct(value: number): number {
  return value <= 1 ? value * 100 : value;
}

function normalizeOrderPlan(orderPlan: unknown): OrderPlanItem[] | null {
  if (!Array.isArray(orderPlan)) return null;
  return orderPlan.map((item) => ({
    symbol: String((item as { symbol?: unknown }).symbol ?? ''),
    parentQty: Number((item as { parentQty?: unknown }).parentQty ?? 0),
    slices: Array.isArray((item as { slices?: unknown }).slices)
      ? ((item as { slices: unknown[] }).slices).map((slice) => ({
          qty: Number((slice as { qty?: unknown }).qty ?? 0),
          type: String((slice as { type?: unknown }).type ?? 'MKT'),
          limitOffsetBps: (slice as { limitOffsetBps?: unknown }).limitOffsetBps as number | undefined,
        }))
      : [],
  }));
}

function reducer(state: PortfolioState, action: Action): PortfolioState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'PATCH_STATE':
      return { ...state, ...action.payload, lastUpdated: new Date().toISOString() };

    case 'SET_SCHEME': {
      const scheme = marketData.schemes.find((s) => s.id === action.payload.schemeId);
      if (!scheme) return state;
      return {
        ...state,
        allocation: {
          ...state.allocation,
          activeScheme: scheme.id,
          objective: scheme.name,
          targetWeights: scheme.holdings,
          lastRunAt: new Date().toISOString(),
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'RUN_ALLOCATION': {
      const scheme = marketData.schemes.find((s) => s.id === state.allocation.activeScheme);
      const newTargetWeights = scheme ? scheme.holdings : state.allocation.targetWeights;
      return {
        ...state,
        allocation: {
          ...state.allocation,
          objective: scheme?.name ?? action.payload.objective,
          riskTarget: action.payload.riskTarget,
          constraints: action.payload.constraints,
          targetWeights: newTargetWeights,
          lastRunAt: new Date().toISOString(),
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REBALANCE': {
      const trades = generateRecommendedTrades(
        state.trading.positions,
        state.allocation.targetWeights,
        state.portfolio.totalAum
      );
      return {
        ...state,
        trading: {
          ...state.trading,
          recommendedTrades: trades,
          lastRebalanceAt: new Date().toISOString(),
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'SUBMIT_ORDER': {
      const { symbol, side, quantity, type, limitPrice } = action.payload;
      const now = new Date().toISOString();
      const refPrice = state.trading.positions.find((pos) => pos.symbol === symbol)?.currentPrice ?? limitPrice ?? 0;
      const newOrder = {
        orderId: `ORD-${String(state.trading.orders.length + 1).padStart(3, '0')}`,
        symbol,
        side,
        quantity,
        type,
        limitPrice,
        status: type === OrderType.Market ? OrderStatus.Filled : OrderStatus.Working,
        filledQty: type === OrderType.Market ? quantity : 0,
        createdAt: now,
        filledAt: type === OrderType.Market ? now : undefined,
      };
      return {
        ...state,
        trading: {
          ...state.trading,
          orders: [newOrder, ...state.trading.orders],
          fills: type === OrderType.Market
            ? [{ orderId: newOrder.orderId, fillQty: quantity, fillPrice: refPrice, fillTime: now }, ...state.trading.fills]
            : state.trading.fills,
        },
        lastUpdated: now,
      };
    }

    case 'RUN_ML_MODEL': {
      const { modelId, output } = action.payload;
      const now = new Date().toISOString();

      if (modelId === 'ML_12') {
        const modelOutput = output as {
          recommendedTrades?: Array<{ symbol: string; side: string; qty: number; reason: string; expectedSlippageBps?: number; fillProbability?: number }>;
          orderPlan?: unknown;
        };
        const recommendedTrades: RecommendedTrade[] = Array.isArray(modelOutput.recommendedTrades)
          ? modelOutput.recommendedTrades.map((trade) => ({
              symbol: trade.symbol,
              side: normalizeOrderSide(trade.side),
              quantity: trade.qty,
              reason: trade.reason,
              expectedSlippageBps: trade.expectedSlippageBps,
              fillProbability: trade.fillProbability,
            }))
          : [];
        return {
          ...state,
          trading: {
            ...state.trading,
            recommendedTrades,
            orderPlan: normalizeOrderPlan(modelOutput.orderPlan),
            lastRebalanceAt: now,
          },
          lastUpdated: now,
        };
      }

      if (modelId === 'ML_13') {
        const modelOutput = output as {
          expectedSummary?: PortfolioState['reporting']['expectedSummary'];
          explanations?: PortfolioState['reporting']['allocationExplainability'] extends infer T
            ? T extends { explanations: infer E }
              ? E
              : never
            : never;
          targetVsBenchmark?: PortfolioState['reporting']['allocationExplainability'] extends infer T
            ? T extends { targetVsBenchmark: infer B }
              ? B
              : never
            : never;
        };
        return {
          ...state,
          reporting: {
            ...state.reporting,
            expectedSummary: modelOutput.expectedSummary ?? null,
            allocationExplainability: {
              explanations: modelOutput.explanations ?? [],
              targetVsBenchmark: modelOutput.targetVsBenchmark ?? [],
            },
          },
          lastUpdated: now,
        };
      }

      if (modelId === 'ML_23') {
        return {
          ...state,
          reporting: {
            ...state.reporting,
            execution: output as PortfolioState['reporting']['execution'],
          },
          lastUpdated: now,
        };
      }

      if (modelId === 'ML_31') {
        const modelOutput = output as {
          suggestedAllocationInputs?: { riskTarget: number; constraints: { maxSectorWeight: number; turnoverLimit: number } };
          reasons?: Array<{ message: string; severity: string }>;
        };
        return {
          ...state,
          reporting: {
            ...state.reporting,
            suggestedAllocationInputs: modelOutput.suggestedAllocationInputs
              ? {
                  ...modelOutput.suggestedAllocationInputs,
                  reasons: modelOutput.reasons ?? [],
                }
              : null,
          },
          lastUpdated: now,
        };
      }

      if (modelId === 'ML_32') {
        const modelOutput = output as {
          suggestedTradingControls?: PortfolioState['trading']['controlsSuggested'];
        };
        return {
          ...state,
          trading: {
            ...state.trading,
            controlsSuggested: modelOutput.suggestedTradingControls ?? null,
          },
          lastUpdated: now,
        };
      }

      return state;
    }

    case 'APPLY_SUGGESTED_ALLOCATION': {
      const suggestion = state.reporting.suggestedAllocationInputs;
      if (!suggestion) return state;
      return {
        ...state,
        allocation: {
          ...state.allocation,
          riskTarget: normalizePct(suggestion.riskTarget),
          constraints: {
            ...state.allocation.constraints,
            maxSector: normalizePct(suggestion.constraints.maxSectorWeight),
            turnoverLimit: normalizePct(suggestion.constraints.turnoverLimit),
          },
          lastRunAt: new Date().toISOString(),
        },
        reporting: {
          ...state.reporting,
          suggestedAllocationInputs: null,
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

const PortfolioContext = createContext<{ state: PortfolioState; dispatch: Dispatch<Action> } | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, demoState);
  return (
    <PortfolioContext.Provider value={{ state, dispatch }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
