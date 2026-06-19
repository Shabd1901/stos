'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, Plus, UserPlus, FolderPlus, CheckSquare, CreditCard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { NewPaymentDialog } from '@/components/payments/new-payment-dialog';
import { NotificationBell } from '@/components/layout/notification-bell';
// Removed auth imports

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues by only rendering theme toggle after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Breadcrumb logic
  const getBreadcrumbs = () => {
    if (pathname === '/') return [{ name: 'Dashboard', href: '/' }];

    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', href: '/' }];

    parts.forEach((part, index) => {
      const href = '/' + parts.slice(0, index + 1).join('/');
      const name = part.charAt(0).toUpperCase() + part.slice(1);
      breadcrumbs.push({ name, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const [clientOpen, setClientOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Removed handleLogout

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left Section: Trigger & Breadcrumbs */}
        <div className="flex items-center gap-2 md:gap-4 text-sm">
          <SidebarTrigger />
          <div className="hidden sm:flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          <NotificationBell />

          {/* Quick Add Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2 h-9 bg-primary/10 text-primary hover:bg-primary/20 border-0 px-2 sm:px-3">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground uppercase tracking-wider">Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md" onClick={() => setClientOpen(true)}>
                <div className="flex items-center justify-center bg-blue-500/10 text-blue-500 h-8 w-8 rounded-md">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Client</span>
                  <span className="text-xs text-muted-foreground">Add a new client profile</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md" onClick={() => setProjectOpen(true)}>
                <div className="flex items-center justify-center bg-indigo-500/10 text-indigo-500 h-8 w-8 rounded-md">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Project</span>
                  <span className="text-xs text-muted-foreground">Start a new project</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md" onClick={() => setTaskOpen(true)}>
                <div className="flex items-center justify-center bg-emerald-500/10 text-emerald-500 h-8 w-8 rounded-md">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Task</span>
                  <span className="text-xs text-muted-foreground">Assign a new task</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md" onClick={() => setPaymentOpen(true)}>
                <div className="flex items-center justify-center bg-amber-500/10 text-amber-500 h-8 w-8 rounded-md">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Payment</span>
                  <span className="text-xs text-muted-foreground">Record a transaction</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Removed User Profile & Logout Dropdown */}
        </div>
      </div>

      <NewClientDialog open={clientOpen} onOpenChange={setClientOpen} />
      <NewProjectDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <NewTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <NewPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </header>
  );
}
