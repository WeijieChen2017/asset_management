import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { FactorExposure } from '../../types/portfolio';
import { useChartColors } from '../../hooks/useChartColors';

interface Props {
  data: FactorExposure[];
}

export function ExposureChart({ data }: Props) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="factor" tick={{ fill: c.tick, fontSize: 11 }} />
        <YAxis tick={{ fill: c.tick, fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: c.tooltipText }} />
        <ReferenceLine y={0} stroke={c.tick} />
        <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.exposure >= 0 ? '#3b82f6' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
