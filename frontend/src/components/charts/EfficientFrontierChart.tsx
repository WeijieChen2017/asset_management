import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { FrontierPoint } from '../../types/portfolio';
import { useChartColors } from '../../hooks/useChartColors';

interface Props {
  data: FrontierPoint[];
  currentRisk?: number;
}

export function EfficientFrontierChart({ data, currentRisk }: Props) {
  const c = useChartColors();
  const current = data.find((d) => d.label === 'Current') ?? (currentRisk ? data.find((d) => Math.abs(d.risk - currentRisk) < 0.5) : undefined);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="risk" name="Risk (%)" unit="%" tick={{ fill: c.tick, fontSize: 12 }} label={{ value: 'Risk (%)', position: 'bottom', fill: c.tick, fontSize: 12 }} />
        <YAxis dataKey="return" name="Return (%)" unit="%" tick={{ fill: c.tick, fontSize: 12 }} label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fill: c.tick, fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: c.tooltipText }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
        />
        <Scatter data={data} fill="#3b82f6" line={{ stroke: '#3b82f6', strokeWidth: 2 }} lineType="fitting" />
        {current && (
          <ReferenceDot x={current.risk} y={current.return} r={8} fill="#10b981" stroke="#10b981" strokeWidth={2} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
