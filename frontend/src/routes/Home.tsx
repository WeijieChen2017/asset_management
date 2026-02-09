import { usePortfolio } from '../store/portfolio';
import { Card } from '../components/ui/Card';
import { PieChart, Repeat, BarChart3, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export default function Home() {
  const { state } = usePortfolio();
  const { allocation, trading, reporting } = state;

  const openOrders = trading.orders.filter((o) => o.status === 'Working' || o.status === 'PartiallyFilled').length;
  const lastFill = trading.orders.find((o) => o.filledAt);

  const statusCards = [
    {
      title: 'Asset Allocation',
      icon: PieChart,
      color: 'text-accent-blue',
      link: '/allocation',
      items: [
        { label: 'Last run', value: allocation.lastRunAt ? new Date(allocation.lastRunAt).toLocaleString() : 'Never' },
        { label: 'Targets', value: `${Object.keys(allocation.targetWeights).length} positions` },
        { label: 'Scheme', value: allocation.objective },
      ],
    },
    {
      title: 'Trading',
      icon: Repeat,
      color: 'text-accent-green',
      link: '/trading',
      items: [
        { label: 'Open orders', value: String(openOrders) },
        { label: 'Last fill', value: lastFill?.filledAt ? new Date(lastFill.filledAt).toLocaleString() : 'None' },
        { label: 'Positions', value: String(trading.positions.length) },
      ],
    },
    {
      title: 'Risk',
      icon: Activity,
      color: 'text-accent-warning',
      link: '/reporting',
      items: [
        { label: 'Annualized Vol', value: `${reporting.kpis.annualizedVol.toFixed(1)}%` },
        { label: 'Tracking Error', value: `${reporting.kpis.trackingError.toFixed(1)}%` },
        { label: 'Max Drawdown', value: `${reporting.kpis.maxDrawdown.toFixed(1)}%` },
      ],
    },
    {
      title: 'Performance',
      icon: BarChart3,
      color: 'text-accent-violet',
      link: '/reporting',
      items: [
        { label: 'YTD Return', value: `${reporting.kpis.ytdReturn.toFixed(2)}%` },
        { label: 'Sharpe Ratio', value: reporting.kpis.sharpe.toFixed(2) },
        { label: 'Info Ratio', value: reporting.kpis.informationRatio.toFixed(2) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Portfolio Dashboard</h2>
        <p className="text-sm text-text-secondary mt-1">
          {state.portfolio.name} — AUM {fmt$(state.portfolio.totalAum)}
        </p>
      </div>

      {/* Platform Loop Diagram */}
      <Card title="Platform Flow">
        <div className="flex items-center justify-center gap-4 py-6">
          {[
            { num: '1', label: 'Allocation', sub: 'Optimize weights', color: 'bg-accent-blue' },
            { num: '2', label: 'Trading', sub: 'Execute orders', color: 'bg-accent-green' },
            { num: '3', label: 'Reporting', sub: 'Analyze & feedback', color: 'bg-accent-violet' },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center text-white text-lg font-bold`}>
                  {step.num}
                </div>
                <p className="text-sm font-bold text-text-primary mt-2">{step.label}</p>
                <p className="text-xs text-text-secondary">{step.sub}</p>
              </div>
              {i < 2 && <ArrowRight size={24} className="text-text-muted mt-[-20px]" />}
            </div>
          ))}
          <div className="flex items-center gap-4">
            <ArrowRight size={24} className="text-text-muted mt-[-20px] rotate-[135deg]" />
            <span className="text-xs text-text-muted mt-[-20px]">Feedback loop</span>
          </div>
        </div>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.link} className="block group">
              <div className="bg-surface-2 border border-border-custom rounded-xl p-5 hover:border-accent-blue/40 transition-colors h-full">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon size={20} className={card.color} />
                  <h3 className="text-base font-bold text-text-primary">{card.title}</h3>
                </div>
                <div className="space-y-2.5">
                  {card.items.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
