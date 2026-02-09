import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PerformancePoint } from '../../types/portfolio';
import { useChartColors } from '../../hooks/useChartColors';

interface Props {
  data: PerformancePoint[];
}

export function PerformanceChart({ data }: Props) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="date" tick={{ fill: c.tick, fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fill: c.tick, fontSize: 12 }} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: c.tooltipText }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} name="Portfolio" />
        <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" strokeWidth={2} dot={false} name="Benchmark" strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
