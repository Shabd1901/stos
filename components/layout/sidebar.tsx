'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  BarChart3,
  FileText,
  Settings,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Finance', href: '/finance', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <ShadcnSidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border h-16 px-4 flex items-center justify-center pt-5">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            S
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            S&T Web Works
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 gap-2">
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    'transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/60 overflow-hidden whitespace-nowrap transition-all group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 h-8 flex flex-col justify-center">
          <p className="font-semibold">S&T Web Works</p>
        </div>
        {/* Placeholder for when icon is collapsed so there's some footer mass space */}
        <div className="h-8 flex items-center justify-center sr-only group-data-[collapsible=icon]:not-sr-only">
          <div className="h-4 w-4 rounded-full bg-sidebar-border/50" />
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
