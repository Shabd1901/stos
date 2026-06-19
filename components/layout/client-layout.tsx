'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset>
                <Header />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
