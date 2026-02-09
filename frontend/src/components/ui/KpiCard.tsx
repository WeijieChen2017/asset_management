import { TrendingDown, TrendingUp } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  suffix?: string;
}

export function KpiCard({ label, value, change, suffix }: KpiCardProps) {
  return (
    <div className="bg-surface-2 border border-border-custom rounded-xl p-5">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-text-primary">
        {value}
        {suffix && <span className="text-sm font-normal text-text-secondary ml-1">{suffix}</span>}
      </p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${change >= 0 ? 'text-accent-green' : 'text-accent-danger'}`}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
