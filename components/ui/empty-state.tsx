import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionButton?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    actionButton,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4 text-muted-foreground">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                {description}
            </p>
            {actionButton ? actionButton : actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
