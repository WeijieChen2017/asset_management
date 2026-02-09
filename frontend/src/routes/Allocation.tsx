import { useState } from 'react';
import { usePortfolio } from '../store/portfolio';
import { marketData } from '../data/demoState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WeightsBarChart } from '../components/charts/WeightsBarChart';
import { DataTable } from '../components/tables/DataTable';
import { useToast } from '../components/ui/Toast';
import { Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

type TickerRow = {
  symbol: string;
  name: string;
  category: string;
  weight: number;
  price: number;
  return1Y: number;
  vol: number;
  beta: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-accent-blue',
  growth: 'bg-accent-green',
  speculation: 'bg-accent-warning',
  cash: 'bg-accent-violet',
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  growth: 'Growth',
  speculation: 'Speculation',
  cash: 'Cash',
};

const SCHEME_ICONS = [TrendingUp, TrendingUp, Minus, TrendingDown, TrendingDown];

const tickerColumns: ColumnDef<TickerRow, unknown>[] = [
  {
    accessorKey: 'symbol',
    header: 'Symbol',
    cell: ({ getValue }) => <span className="font-semibold">{getValue() as string}</span>,
  },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ getValue }) => {
      const cat = getValue() as string;
      return (
        <span className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-400'}`} />
          <span className="font-medium">{CATEGORY_LABELS[cat] ?? cat}</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'weight',
    header: 'Weight',
    cell: ({ getValue }) => <span className="tabular-nums font-semibold">{(getValue() as number).toFixed(2)}%</span>,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => <span className="tabular-nums font-medium">${(getValue() as number).toFixed(2)}</span>,
  },
  {
    accessorKey: 'return1Y',
    header: '1Y Return',
    cell: ({ getValue }) => {
      const v = getValue() as number;
      return (
        <span className={`tabular-nums ${v >= 0 ? 'text-accent-green' : 'text-accent-danger'}`}>
          {v >= 0 ? '+' : ''}{v.toFixed(1)}%
        </span>
      );
    },
  },
  {
    accessorKey: 'vol',
    header: 'Volatility',
    cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toFixed(1)}%</span>,
  },
  {
    accessorKey: 'beta',
    header: 'Beta',
    cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span>,
  },
];

export default function Allocation() {
  const { state, dispatch } = usePortfolio();
  const { toast } = useToast();
  const { allocation } = state;

  const [selectedScheme, setSelectedScheme] = useState(allocation.activeScheme);
  const scheme = marketData.schemes.find((s) => s.id === selectedScheme) ?? marketData.schemes[0];

  const handleApply = () => {
    dispatch({ type: 'SET_SCHEME', payload: { schemeId: selectedScheme } });
    toast(`Applied "${scheme.name}" scheme`, 'success');
  };

  // Build ticker rows for selected scheme
  const tickerRows: TickerRow[] = Object.entries(scheme.holdings)
    .map(([symbol, weight]) => {
      const ticker = marketData.tickers[symbol];
      return {
        symbol,
        name: ticker?.name ?? symbol,
        category: ticker?.category ?? 'unknown',
        weight,
        price: ticker?.price ?? 0,
        return1Y: ticker?.return1Y ?? 0,
        vol: ticker?.vol ?? 0,
        beta: ticker?.beta ?? 1,
      };
    })
    .sort((a, b) => {
      const order = ['core', 'growth', 'speculation', 'cash'];
      return order.indexOf(a.category) - order.indexOf(b.category) || b.weight - a.weight;
    });

  const barData = tickerRows.map((r) => ({ name: r.symbol, weight: r.weight }));

  // Category breakdown for stacked bar
  const categories = ['core', 'growth', 'speculation', 'cash'] as const;
  const totalWeight = Object.values(scheme.weights).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Asset Allocation</h2>
          <p className="text-sm text-text-secondary mt-1">
            Select a market regime to set portfolio allocation targets
          </p>
        </div>
        <Button onClick={handleApply} disabled={selectedScheme === allocation.activeScheme}>
          <Check size={14} />
          Apply Scheme
        </Button>
      </div>

      {/* Scheme Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {marketData.schemes.map((s, i) => {
          const Icon = SCHEME_ICONS[i];
          const isSelected = s.id === selectedScheme;
          const isActive = s.id === allocation.activeScheme;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScheme(s.id)}
              className={`text-left rounded-xl border-2 p-5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-accent-blue bg-accent-blue/10 ring-1 ring-accent-blue/50 shadow-lg shadow-accent-blue/10'
                  : 'border-border-custom bg-surface-2 hover:border-accent-blue/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={22} className={isSelected ? 'text-accent-blue' : 'text-text-secondary'} />
                {isActive && <Badge variant="info">Active</Badge>}
              </div>
              <p className="text-base font-bold text-text-primary">{s.name}</p>
              <div className="mt-3 space-y-1.5">
                {categories.map((cat) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{CATEGORY_LABELS[cat]}</span>
                    <span className="text-text-primary font-medium tabular-nums">{s.weights[cat]}%</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Category Breakdown Bar */}
      <Card title={`Category Breakdown — ${scheme.name}`}>
        <div className="space-y-4">
          <div className="flex h-10 rounded-lg overflow-hidden">
            {categories.map((cat) => {
              const pct = scheme.weights[cat];
              if (pct === 0) return null;
              return (
                <div
                  key={cat}
                  className={`${CATEGORY_COLORS[cat]} flex items-center justify-center text-sm font-semibold text-white`}
                  style={{ width: `${(pct / totalWeight) * 100}%` }}
                >
                  {pct}%
                </div>
              );
            })}
          </div>
          <div className="flex gap-6 justify-center">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`} />
                {CATEGORY_LABELS[cat]} ({scheme.weights[cat]}%)
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Target Weights Chart + Ticker Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Target Weights">
          <WeightsBarChart data={barData} />
        </Card>
        <Card title="Holdings Detail">
          <DataTable data={tickerRows} columns={tickerColumns} searchable searchPlaceholder="Search tickers..." />
        </Card>
      </div>

      {allocation.lastRunAt && (
        <p className="text-xs text-text-muted">
          Last allocation run: {new Date(allocation.lastRunAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
