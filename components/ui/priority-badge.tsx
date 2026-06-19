import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const priorityStyles = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        priorityStyles[priority]
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
