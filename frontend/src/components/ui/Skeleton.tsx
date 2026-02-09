export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-3 rounded-lg ${className}`} />;
}
