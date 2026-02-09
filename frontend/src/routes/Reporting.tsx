import { usePortfolio } from '../store/portfolio';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/Badge';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { WeightsBarChart } from '../components/charts/WeightsBarChart';
import { ExposureChart } from '../components/charts/ExposureChart';
import { DataTable } from '../components/tables/DataTable';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { Attribution } from '../types/portfolio';
import type { ColumnDef } from '@tanstack/react-table';

const attrCols: ColumnDef<Attribution, unknown>[] = [
  { accessorKey: 'group', header: 'Sector', cell: ({ getValue }) => <span className="text-text-secondary">{getValue() as string}</span> },
  { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  {
    accessorKey: 'contribution',
    header: 'Contribution',
    cell: ({ getValue }) => {
      const v = getValue() as number;
      return (
        <span className={`tabular-nums font-medium ${v >= 0 ? 'text-accent-green' : 'text-accent-danger'}`}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}%
        </span>
      );
    },
  },
];

export default function Reporting() {
  const { state } = usePortfolio();
  const { reporting } = state;
  const { kpis } = reporting;

  const sectorData = reporting.sectorExposures.map((s) => ({ name: s.name, weight: s.weight }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Reporting & Analysis</h2>
        <p className="text-sm text-text-secondary mt-1">
          Performance metrics, attribution, and risk exposure analysis
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="YTD Return" value={`${kpis.ytdReturn.toFixed(2)}%`} change={kpis.ytdReturn} />
        <KpiCard label="Annualized Vol" value={`${kpis.annualizedVol.toFixed(1)}%`} />
        <KpiCard label="Sharpe Ratio" value={kpis.sharpe.toFixed(2)} />
        <KpiCard label="Max Drawdown" value={`${kpis.maxDrawdown.toFixed(1)}%`} />
      </div>

      {/* Performance Chart */}
      <Card title="Portfolio vs Benchmark">
        <PerformanceChart data={reporting.performanceSeries} />
      </Card>

      {/* Drawdown Chart */}
      <Card title="Drawdown">
        <DrawdownChart data={reporting.drawdownSeries} />
      </Card>

      {/* Attribution Table */}
      <Card title="Return Attribution">
        <DataTable data={reporting.attribution} columns={attrCols} searchable searchPlaceholder="Search by name or sector..." />
      </Card>

      {/* Exposure Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sector Exposure">
          <WeightsBarChart data={sectorData} color="#8b5cf6" />
        </Card>
        <Card title="Factor Exposure">
          <ExposureChart data={reporting.factorExposures} />
        </Card>
      </div>

      {/* Feedback Signals */}
      {reporting.feedbackSignals.length > 0 && (
        <Card title="Feedback Signals">
          <div className="space-y-3">
            {reporting.feedbackSignals.map((signal, i) => {
              const icons = { info: Info, warning: AlertTriangle, danger: ShieldAlert };
              const colors = { info: 'border-accent-blue/30 bg-accent-blue/5', warning: 'border-accent-warning/30 bg-accent-warning/5', danger: 'border-accent-danger/30 bg-accent-danger/5' };
              const iconColors = { info: 'text-accent-blue', warning: 'text-accent-warning', danger: 'text-accent-danger' };
              const Icon = icons[signal.type];
              return (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${colors[signal.type]}`}>
                  <Icon size={18} className={`shrink-0 mt-0.5 ${iconColors[signal.type]}`} />
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{signal.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {signal.suggestedRiskTarget !== undefined && (
                        <Badge variant="info">Suggested risk: {signal.suggestedRiskTarget}%</Badge>
                      )}
                      {signal.flags?.map((f) => (
                        <Badge key={f} variant="default">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
