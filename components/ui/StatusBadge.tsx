import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'green' | 'yellow' | 'red';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const colors = {
    green: 'bg-success/20 text-success border-success/50',
    yellow: 'bg-warning/20 text-warning border-warning/50',
    red: 'bg-error/20 text-error border-error/50',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const dotColors = {
    green: 'bg-success',
    yellow: 'bg-warning',
    red: 'bg-error',
  };

  if (label) {
    return (
      <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium', colors[status])}>
        <span className={cn('rounded-full', sizes[size], dotColors[status])} />
        {label}
      </span>
    );
  }

  return (
    <span className={cn('inline-block rounded-full', sizes[size], dotColors[status])} />
  );
}
