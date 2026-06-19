'use client';

import { AppNotification } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Bell, DollarSign, Server, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface DashboardNotificationsProps {
    initialNotifications: AppNotification[];
}

export function DashboardNotifications({ initialNotifications }: DashboardNotificationsProps) {
    const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

    if (notifications.length === 0) return null;

    const handleDismiss = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        // Server update
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'renewal': return <Server className="h-5 w-5 text-orange-500" />;
            case 'payment': return <DollarSign className="h-5 w-5 text-red-500" />;
            case 'project': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBannerColor = (type: string) => {
        switch (type) {
            case 'renewal': return 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400';
            case 'payment': return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400';
            case 'project': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400';
            default: return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400';
        }
    };

    return (
        <div className="space-y-3 mb-8">
            {notifications.map(notif => (
                <Card key={notif.id} className={`p-4 border ${getBannerColor(notif.type)} flex items-start gap-4 shadow-sm`}>
                    <div className="mt-0.5">
                        {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{notif.title}</h4>
                        <p className="text-sm opacity-90 mt-1">{notif.message}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={() => handleDismiss(notif.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </Card>
            ))}
        </div>
    );
}
