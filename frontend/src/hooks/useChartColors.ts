import { useTheme } from '../store/theme';

export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    grid: isDark ? '#2a2e3a' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#1a1d27' : '#ffffff',
    tooltipBorder: isDark ? '#2a2e3a' : '#e2e8f0',
    tooltipText: isDark ? '#f1f5f9' : '#0f172a',
  };
}
