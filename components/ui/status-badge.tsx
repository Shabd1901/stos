import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  completed: 'success',
  done: 'success',
  planning: 'info',
  'in-progress': 'info',
  'in-review': 'warning',
  'on-hold': 'warning',
  pending: 'warning',
  inactive: 'error',
  collections: 'error',
};

export function StatusBadge({
  status,
  variant = 'default',
}: StatusBadgeProps) {
  const displayVariant = statusVariantMap[status.toLowerCase()] || variant;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        variantStyles[displayVariant]
      )}
    >
      {status}
    </span>
  );
}
