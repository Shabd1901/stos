'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Users, Bell, Palette, Settings2, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings2 className="h-8 w-8 text-primary" />
          Workspace Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your agency workspace, team members, and application appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* System Settings section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">System Preferences</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  System Timezone
                </label>
                <div className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground font-medium flex items-center justify-between">
                  <span>Indian Standard Time (IST)</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md">Fixed</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  All dates, deadlines, and logs across the workspace are locked to IST.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Interface Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {mounted && (
                    <>
                      <button
                        onClick={() => setTheme('light')}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${theme === 'light'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${theme === 'dark'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${theme === 'system'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        System
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Notifications section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="space-y-0.5">
                  <span className="text-foreground font-medium text-sm">Task Reminders</span>
                  <p className="text-xs text-muted-foreground">Get notified about upcoming tasks</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="space-y-0.5">
                  <span className="text-foreground font-medium text-sm">Project Updates</span>
                  <p className="text-xs text-muted-foreground">Alerts when project status changes</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <span className="text-foreground font-medium text-sm">Deadline Alerts</span>
                  <p className="text-xs text-muted-foreground">Warnings for overdue milestones</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Team section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
              </div>
              <Button variant="outline" size="sm" disabled>Invite Member</Button>
            </div>

            <div className="space-y-4">
              {/* Team Member 1 */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    SP
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Shabdansh Prajapati</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-muted-foreground">Active</span>
              </div>

              {/* Team Member 2 */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
                    TJ
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tanish Jain</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded font-medium text-muted-foreground">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
