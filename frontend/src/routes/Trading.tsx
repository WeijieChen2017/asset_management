import { useState } from 'react';
import { usePortfolio } from '../store/portfolio';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { DataTable } from '../components/tables/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { Select } from '../components/ui/Select';
import { ArrowDownUp, Plus } from 'lucide-react';
import { OrderSide, OrderStatus, OrderType, type Position, type Order, type RecommendedTrade } from '../types/portfolio';
import type { ColumnDef } from '@tanstack/react-table';

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function fmtPnl(v: number) {
  const formatted = fmt$(v);
  return <span className={v >= 0 ? 'text-accent-green' : 'text-accent-danger'}>{v >= 0 ? '+' : ''}{formatted}</span>;
}

const positionCols: ColumnDef<Position, unknown>[] = [
  { accessorKey: 'symbol', header: 'Symbol', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'sector', header: 'Sector', cell: ({ getValue }) => <span className="text-text-secondary">{getValue() as string}</span> },
  { accessorKey: 'quantity', header: 'Qty', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toLocaleString()}</span> },
  { accessorKey: 'currentPrice', header: 'Price', cell: ({ getValue }) => <span className="tabular-nums">${(getValue() as number).toFixed(2)}</span> },
  { accessorKey: 'marketValue', header: 'Mkt Value', cell: ({ getValue }) => <span className="tabular-nums">{fmt$(getValue() as number)}</span> },
  { accessorKey: 'weight', header: 'Weight', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toFixed(1)}%</span> },
  { accessorKey: 'dayPnl', header: 'Day P&L', cell: ({ getValue }) => fmtPnl(getValue() as number) },
  { accessorKey: 'totalPnl', header: 'Total P&L', cell: ({ getValue }) => fmtPnl(getValue() as number) },
  { accessorKey: 'beta', header: 'Beta', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toFixed(2)}</span> },
];

const tradeCols: ColumnDef<RecommendedTrade, unknown>[] = [
  { accessorKey: 'symbol', header: 'Symbol', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'side', header: 'Side', cell: ({ getValue }) => {
    const v = getValue() as string;
    return <Badge variant={v === 'Buy' ? 'success' : 'danger'}>{v}</Badge>;
  }},
  { accessorKey: 'quantity', header: 'Qty', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toLocaleString()}</span> },
  { accessorKey: 'reason', header: 'Reason', cell: ({ getValue }) => <span className="text-text-secondary">{getValue() as string}</span> },
];

function statusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    [OrderStatus.Filled]: 'success',
    [OrderStatus.Working]: 'info',
    [OrderStatus.PartiallyFilled]: 'warning',
    [OrderStatus.Rejected]: 'danger',
    [OrderStatus.Cancelled]: 'default',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

const orderCols: ColumnDef<Order, unknown>[] = [
  { accessorKey: 'orderId', header: 'Order ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
  { accessorKey: 'symbol', header: 'Symbol', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'side', header: 'Side', cell: ({ getValue }) => {
    const v = getValue() as string;
    return <Badge variant={v === 'Buy' ? 'success' : 'danger'}>{v}</Badge>;
  }},
  { accessorKey: 'quantity', header: 'Qty', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toLocaleString()}</span> },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => statusBadge(getValue() as OrderStatus) },
  { accessorKey: 'filledQty', header: 'Filled', cell: ({ getValue }) => <span className="tabular-nums">{(getValue() as number).toLocaleString()}</span> },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
];

export default function Trading() {
  const { state, dispatch } = usePortfolio();
  const { toast } = useToast();
  const { trading } = state;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState('');
  const [orderSide, setOrderSide] = useState<OrderSide>(OrderSide.Buy);
  const [orderQty, setOrderQty] = useState(100);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Market);
  const [limitPrice, setLimitPrice] = useState(0);

  const handleRebalance = () => {
    dispatch({ type: 'REBALANCE' });
    toast('Recommended trades generated from allocation targets', 'success');
  };

  const handleSubmitOrder = () => {
    if (!orderSymbol) return;
    dispatch({
      type: 'SUBMIT_ORDER',
      payload: {
        symbol: orderSymbol.toUpperCase(),
        side: orderSide,
        quantity: orderQty,
        type: orderType,
        limitPrice: orderType === OrderType.Limit ? limitPrice : undefined,
      },
    });
    toast(`Order submitted: ${orderSide} ${orderQty} ${orderSymbol.toUpperCase()}`, 'success');
    setDrawerOpen(false);
    setOrderSymbol('');
  };

  const openTicketForTrade = (trade: RecommendedTrade) => {
    setOrderSymbol(trade.symbol);
    setOrderSide(trade.side);
    setOrderQty(trade.quantity);
    setOrderType(OrderType.Market);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trading System</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage positions, execute orders, and rebalance to targets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRebalance}>
            <ArrowDownUp size={14} />
            Rebalance to Targets
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus size={14} />
            New Order
          </Button>
        </div>
      </div>

      {/* Positions */}
      <Card title="Positions">
        <DataTable data={trading.positions} columns={positionCols} searchable searchPlaceholder="Search positions..." />
      </Card>

      {/* Recommended Trades */}
      <Card
        title="Recommended Trades"
        actions={
          trading.recommendedTrades.length > 0 ? (
            <span className="text-xs text-text-muted">Click a row to create order</span>
          ) : undefined
        }
      >
        {trading.recommendedTrades.length === 0 ? (
          <EmptyState
            message="No recommended trades. Run 'Rebalance to Targets' to generate trades from allocation."
            action={{ label: 'Rebalance', onClick: handleRebalance }}
          />
        ) : (
          <div>
            <DataTable data={trading.recommendedTrades} columns={tradeCols} />
            <div className="mt-3 flex flex-wrap gap-2">
              {trading.recommendedTrades.map((t) => (
                <Button key={t.symbol} variant="secondary" size="sm" onClick={() => openTicketForTrade(t)}>
                  {t.side} {t.symbol}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Orders Blotter */}
      <Card title="Orders Blotter">
        {trading.orders.length === 0 ? (
          <EmptyState message="No orders yet" />
        ) : (
          <DataTable data={trading.orders} columns={orderCols} searchable searchPlaceholder="Search orders..." />
        )}
      </Card>

      {/* Order Ticket Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Order Ticket">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Symbol</label>
            <input
              type="text"
              value={orderSymbol}
              onChange={(e) => setOrderSymbol(e.target.value)}
              placeholder="e.g. AAPL"
              className="w-full bg-surface-3 border border-border-custom rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Side</label>
            <Select
              value={orderSide}
              onChange={(e) => setOrderSide(e.target.value as OrderSide)}
              options={[
                { value: OrderSide.Buy, label: 'Buy' },
                { value: OrderSide.Sell, label: 'Sell' },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Quantity</label>
            <input
              type="number"
              value={orderQty}
              onChange={(e) => setOrderQty(+e.target.value)}
              className="w-full bg-surface-3 border border-border-custom rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Type</label>
            <Select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              options={[
                { value: OrderType.Market, label: 'Market (MKT)' },
                { value: OrderType.Limit, label: 'Limit (LMT)' },
              ]}
              className="w-full"
            />
          </div>
          {orderType === OrderType.Limit && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Limit Price</label>
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(+e.target.value)}
                className="w-full bg-surface-3 border border-border-custom rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          )}
          <Button onClick={handleSubmitOrder} className="w-full mt-4" disabled={!orderSymbol || orderQty <= 0}>
            Submit Order
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
