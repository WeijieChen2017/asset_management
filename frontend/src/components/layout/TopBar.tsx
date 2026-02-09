import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { usePortfolio } from '../../store/portfolio';
import { useTheme } from '../../store/theme';
import { RefreshCw, Sun, Moon } from 'lucide-react';

export function TopBar() {
  const { state } = usePortfolio();
  const { portfolio, demoMode, lastUpdated } = state;
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 shrink-0 bg-surface-2 border-b border-border-custom flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold text-text-primary">{portfolio.name}</h1>
        <span className="text-xs text-text-secondary font-medium">Benchmark: {portfolio.benchmark}</span>
        {demoMode && <Badge variant="warning">DEMO</Badge>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-secondary">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-surface-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Button variant="secondary" size="sm">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
