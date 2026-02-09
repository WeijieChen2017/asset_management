import { NavLink } from 'react-router-dom';
import { BarChart3, Home, PieChart, Repeat, Layers } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/allocation', label: 'Allocation', icon: PieChart },
  { to: '/trading', label: 'Trading', icon: Repeat },
  { to: '/reporting', label: 'Reporting', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-surface-2 border-r border-border-custom h-screen flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-custom">
        <Layers size={22} className="text-accent-blue" />
        <span className="text-base font-bold text-text-primary">AssetPro</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border-custom text-xs text-text-muted">
        v1.0.0 Demo
      </div>
    </aside>
  );
}
