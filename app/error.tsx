'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // We could log this to an external service or our system_errors table here
    }, [error]);

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
                <p className="text-muted-foreground max-w-[500px] mx-auto">
                    We're sorry, but an unexpected error occurred. The technical team has been notified.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Button onClick={() => reset()} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </Button>
                <Link href="/">
                    <Button variant="outline" className="gap-2">
                        <Home className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
