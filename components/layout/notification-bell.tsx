'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Server, DollarSign, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/lib/api/types';
import Link from 'next/link';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Server update
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        // Server update
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'renewal': return <Server className="h-4 w-4 text-orange-500" />;
            case 'payment': return <DollarSign className="h-4 w-4 text-red-500" />;
            case 'project': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 data-[state=open]:bg-muted">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-lg border-border">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-3 p-4 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50 ${!notification.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                >
                                    <div className={`mt-0.5 flex shrink-0 h-8 w-8 items-center justify-center rounded-full ${!notification.is_read ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm leading-tight ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/80 pt-1">
                                            {new Date(notification.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2">
                                            {notification.link_url && (
                                                <Link href={notification.link_url} onClick={() => setOpen(false)}>
                                                    <Button variant="secondary" size="sm" className="h-6 text-xs px-2">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            )}
                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Mark read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs mt-1 opacity-70">No new notifications.</p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
