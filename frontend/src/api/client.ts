import { demoState } from '../data/demoState';
import type { PortfolioState } from '../types/portfolio';

const API_BASE = '/api/v1';

let isDemoMode = true;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    isDemoMode = false;
    return res.json();
  } catch {
    isDemoMode = true;
    throw new Error('Backend unavailable — running in demo mode');
  }
}

export function getIsDemoMode() {
  return isDemoMode;
}

export async function fetchState(): Promise<PortfolioState> {
  try {
    return await fetchJson<PortfolioState>('/state');
  } catch {
    return { ...demoState };
  }
}

export async function runAllocation(params: {
  objective: string;
  riskTarget: number;
  constraints: { maxPosition: number; maxSector: number; turnoverLimit: number };
}): Promise<PortfolioState> {
  return fetchJson('/allocation/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function rebalance(): Promise<PortfolioState> {
  return fetchJson('/trading/rebalance', { method: 'POST' });
}

export async function submitOrder(order: {
  symbol: string;
  side: string;
  quantity: number;
  type: string;
  limitPrice?: number;
}): Promise<PortfolioState> {
  return fetchJson('/trading/order', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}
