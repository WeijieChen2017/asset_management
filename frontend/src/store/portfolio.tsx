import React, { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { demoState, marketData } from '../data/demoState';
import { OrderSide, OrderStatus, OrderType, type Allocation, type PortfolioState, type RecommendedTrade } from '../types/portfolio';

type Action =
  | { type: 'SET_STATE'; payload: PortfolioState }
  | { type: 'PATCH_STATE'; payload: Partial<PortfolioState> }
  | { type: 'SET_SCHEME'; payload: { schemeId: number } }
  | { type: 'RUN_ALLOCATION'; payload: { objective: string; riskTarget: number; constraints: Allocation['constraints'] } }
  | { type: 'SUBMIT_ORDER'; payload: { symbol: string; side: OrderSide; quantity: number; type: OrderType; limitPrice?: number } }
  | { type: 'REBALANCE' };

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
      const newOrder = {
        orderId: `ORD-${String(state.trading.orders.length + 1).padStart(3, '0')}`,
        symbol,
        side,
        quantity,
        type,
        limitPrice,
        status: type === OrderType.Market ? OrderStatus.Filled : OrderStatus.Working,
        filledQty: type === OrderType.Market ? quantity : 0,
        createdAt: new Date().toISOString(),
        filledAt: type === OrderType.Market ? new Date().toISOString() : undefined,
      };
      return {
        ...state,
        trading: {
          ...state.trading,
          orders: [newOrder, ...state.trading.orders],
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
