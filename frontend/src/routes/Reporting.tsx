import { useState } from 'react';
import { usePortfolio } from '../store/portfolio';
import { mlModelMap, type MLModelId } from '../data/mlModels';
import { Card } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { WeightsBarChart } from '../components/charts/WeightsBarChart';
import { ExposureChart } from '../components/charts/ExposureChart';
import { DataTable } from '../components/tables/DataTable';
import { useToast } from '../components/ui/Toast';
import { MLModelDrawer } from '../components/MLModelDrawer';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { Attribution } from '../types/portfolio';
import type { ColumnDef } from '@tanstack/react-table';

const REPORTING_MODELS: MLModelId[] = ['ML_31', 'ML_32'];

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
  const { state, dispatch } = usePortfolio();
  const { toast } = useToast();
  const { reporting } = state;
  const { kpis } = reporting;
  const [activeModelId, setActiveModelId] = useState<MLModelId | null>(null);
  const activeModel = activeModelId ? mlModelMap[activeModelId] : null;

  const sectorData = reporting.sectorExposures.map((s) => ({ name: s.name, weight: s.weight }));

  const handleRunMock = (modelId: MLModelId) => {
    const model = mlModelMap[modelId];
    dispatch({ type: 'RUN_ML_MODEL', payload: { modelId, output: model.mockOutput } });
    toast(`${model.name} completed (confidence: ${model.confidence.toFixed(2)})`, 'success');
    setActiveModelId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Reporting & Analysis</h2>
          <p className="text-sm text-text-secondary mt-1">
            Performance metrics, attribution, and risk exposure analysis
          </p>
        </div>
        <div className="flex gap-2">
          {REPORTING_MODELS.map((modelId) => (
            <Button key={modelId} variant="secondary" onClick={() => setActiveModelId(modelId)}>
              Run {mlModelMap[modelId].name}
            </Button>
          ))}
        </div>
      </div>

      <Card title="ML Actions">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setActiveModelId('ML_31')}>
            Run {mlModelMap.ML_31.name}
          </Button>
          <Button variant="secondary" onClick={() => setActiveModelId('ML_32')}>
            Run {mlModelMap.ML_32.name}
          </Button>
        </div>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="YTD Return" value={`${kpis.ytdReturn.toFixed(2)}%`} change={kpis.ytdReturn} />
        <KpiCard label="Annualized Vol" value={`${kpis.annualizedVol.toFixed(1)}%`} />
        <KpiCard label="Sharpe Ratio" value={kpis.sharpe.toFixed(2)} />
        <KpiCard label="Max Drawdown" value={`${kpis.maxDrawdown.toFixed(1)}%`} />
      </div>

      {reporting.expectedSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Expected Return" value={`${(reporting.expectedSummary.expectedReturn * 100).toFixed(2)}%`} />
          <KpiCard label="Expected Vol" value={`${(reporting.expectedSummary.expectedVol * 100).toFixed(2)}%`} />
          <KpiCard label="Expected Tracking Error" value={`${(reporting.expectedSummary.expectedTrackingError * 100).toFixed(2)}%`} />
        </div>
      )}

      {reporting.execution && (
        <Card title="Execution Metrics (Execution Evaluator)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border-custom p-4 bg-surface-3/60">
              <p className="text-xs text-text-muted">Implementation Shortfall</p>
              <p className="text-lg font-semibold text-text-primary">{reporting.execution.executionMetrics.implementationShortfallBps.toFixed(1)} bps</p>
            </div>
            <div className="rounded-lg border border-border-custom p-4 bg-surface-3/60">
              <p className="text-xs text-text-muted">Slippage</p>
              <p className="text-lg font-semibold text-text-primary">{reporting.execution.executionMetrics.slippageBps.toFixed(1)} bps</p>
            </div>
            <div className="rounded-lg border border-border-custom p-4 bg-surface-3/60">
              <p className="text-xs text-text-muted">Spread Cost</p>
              <p className="text-lg font-semibold text-text-primary">{reporting.execution.executionMetrics.spreadCostBps.toFixed(1)} bps</p>
            </div>
          </div>
          {reporting.execution.orderScores.length > 0 && (
            <div className="mt-4 space-y-2">
              {reporting.execution.orderScores.map((score) => (
                <div key={score.orderId} className="text-sm text-text-secondary">
                  <span className="font-mono text-xs text-text-primary">{score.orderId}</span>: quality {(score.qualityScore * 100).toFixed(0)}% ({score.notes.join(', ')})
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {reporting.allocationExplainability && (
        <Card title="Allocation Explainability (Allocation Explainer)">
          <div className="space-y-3">
            {reporting.allocationExplainability.explanations.map((explanation, idx) => (
              <div key={`${explanation.type}-${idx}`} className="rounded-lg border border-border-custom p-3 bg-surface-3/60">
                <p className="text-sm text-text-primary font-semibold">{explanation.type}</p>
                <p className="text-sm text-text-secondary mt-1">{explanation.message}</p>
              </div>
            ))}
            {reporting.allocationExplainability.targetVsBenchmark.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Target vs Benchmark</p>
                <div className="space-y-1">
                  {reporting.allocationExplainability.targetVsBenchmark.map((item) => (
                    <p key={item.symbol} className="text-xs text-text-secondary">
                      {item.symbol}: target {(item.targetWeight * 100).toFixed(2)}%, benchmark {(item.benchmarkWeight * 100).toFixed(2)}%, active {(item.activeWeight * 100).toFixed(2)}%
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

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

      <MLModelDrawer
        open={activeModelId !== null}
        model={activeModel}
        inputPayload={activeModel ? activeModel.buildInput(state) : null}
        onClose={() => setActiveModelId(null)}
        onRunMock={(model) => handleRunMock(model.id)}
      />
    </div>
  );
}
