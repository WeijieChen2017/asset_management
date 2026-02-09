import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet';
  children: ReactNode;
}

const variants = {
  default: 'bg-surface-3 text-text-secondary',
  success: 'bg-accent-green/15 text-accent-green',
  warning: 'bg-accent-warning/15 text-accent-warning',
  danger: 'bg-accent-danger/15 text-accent-danger',
  info: 'bg-accent-blue/15 text-accent-blue',
  violet: 'bg-accent-violet/15 text-accent-violet',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
