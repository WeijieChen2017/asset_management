import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartColors } from '../../hooks/useChartColors';

interface Props {
  data: { name: string; weight: number }[];
  color?: string;
}

export function WeightsBarChart({ data, color = '#3b82f6' }: Props) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: c.tick, fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fill: c.tick, fontSize: 11 }} width={50} />
        <Tooltip
          contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: c.tooltipText }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
        />
        <Bar dataKey="weight" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
