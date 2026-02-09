import { Inbox } from 'lucide-react';
import { Button } from './Button';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      {icon || <Inbox size={40} strokeWidth={1.5} />}
      <p className="mt-3 text-sm">{message}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
