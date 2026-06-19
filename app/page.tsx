import {
  getProjects,
  getTasks,
  getAllPayments,
  getAllHostingContracts,
  getClients,
  getActivityLogs,
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toZonedTime } from 'date-fns-tz';
import Link from 'next/link';
import {
  FolderOpen,
  CreditCard,
  AlertCircle,
  Server,
  CalendarCheck,
  IndianRupee,
  Clock,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateTotalRevenue } from '@/lib/finance-calculations';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [
    projects,
    tasks,
    payments,
    hosting,
    clients,
    activityLogs
  ] = await Promise.all([
    getProjects().catch(() => []),
    getTasks().catch(() => []),
    getAllPayments().catch(() => []),
    getAllHostingContracts().catch(() => []),
    getClients().catch(() => []),
    getActivityLogs(10).catch(() => [])
  ]);

  const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');
  const in30Days = new Date(nowIST.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in48Hours = new Date(nowIST.getTime() + 48 * 60 * 60 * 1000);
  const in3Days = new Date(nowIST.getTime() + 3 * 24 * 60 * 60 * 1000);

  // --- Maintenance Notifications Check ---
  // Background check for approaching maintenance anniversaries
  let approachingMaintenance: { project: any, dueAmount: number, daysUntilNextAnniversary: number, year: number }[] = [];

  projects.filter(p => p.maintenance_enabled && p.status !== 'completed' && p.status !== 'archived').forEach((p) => {
    const startDateString = p.start_date || p.created_at;
    const startDate = startDateString ? new Date(startDateString) : new Date();

    // Check how many full years have elapsed or are about to elapse
    const diffTime = in3Days.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const maintenanceYearsToBill = Math.floor(diffDays / 365);

    if (maintenanceYearsToBill > 0) {
      const maintenanceExpectedTotal = maintenanceYearsToBill * 450;

      const isMaintenance = (pm: any) => pm.description?.toLowerCase().includes('maintenance') || pm.description?.toLowerCase().includes('annual');
      const maintenancePayments = payments.filter(pm => pm.project_id === p.id && pm.status === 'paid' && isMaintenance(pm));
      const maintenanceReceived = maintenancePayments.reduce((sum, pm) => sum + Number(pm.amount), 0);

      const dueAmount = maintenanceExpectedTotal - maintenanceReceived;

      // If dueAmount > 0
      const daysSinceStart = Math.ceil((nowIST.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      let daysUntilNextAnniversary = 365 - (daysSinceStart % 365);

      // Edge case if it's already past the anniversary exactly
      if (daysUntilNextAnniversary === 365 && daysSinceStart > 0) {
        daysUntilNextAnniversary = 0;
      }

      if (dueAmount > 0) {
        // Collect for UI display if within 30 days
        if (daysUntilNextAnniversary <= 30) {
          approachingMaintenance.push({
            project: p,
            dueAmount,
            daysUntilNextAnniversary,
            year: maintenanceYearsToBill
          });
        }

        // Generate background notification if exactly within 3 days
        if (daysUntilNextAnniversary <= 3) {
          // Check if a notification already exists for this exact amount and project to prevent spamming
          const notifTitle = `Maintenance Due: ${p.name}`;

          // This is a fire-and-forget background check, we don't await blocking the render
          supabase.from('notifications').select('id').eq('title', notifTitle).eq('type', 'payment').eq('is_read', false).single().then(({ data }) => {
            if (!data) {
              supabase.from('notifications').insert([{
                title: notifTitle,
                message: `Year ${maintenanceYearsToBill} maintenance fee of ₹${dueAmount} is due in ${daysUntilNextAnniversary} days for ${p.name}.`,
                type: 'payment',
                priority: 'high',
                link_url: `/projects/${p.id}`,
              }]).then(() => { });
            }
          });
        }
      }
    }
  });

  // --- KPIs ---
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

  // Pending payments (Projects where spent is less than target budget)
  let pendingPaymentsCount = 0;
  let totalOutstandingAmount = 0;

  projects.forEach(p => {
    let projectExpected = Number(p.budget || 0);

    const isMaintenance = (pm: any) => pm.description?.toLowerCase().includes('maintenance') || pm.description?.toLowerCase().includes('annual');
    const projectPayments = payments.filter(pm => pm.project_id === p.id && pm.status === 'paid' && !isMaintenance(pm));
    const dynamicSpent = projectPayments.reduce((sum, pm) => sum + Number(pm.amount), 0);

    const outstanding = Math.max(0, projectExpected - dynamicSpent);
    if (outstanding > 0 && p.status !== 'completed' && p.status !== 'on-hold') {
      pendingPaymentsCount++;
      totalOutstandingAmount += outstanding;
    }
  });

  const overduePaymentsInfo = payments.filter(p => p.status === 'overdue' || p.status === 'collections');
  const overduePaymentsCount = overduePaymentsInfo.length;

  const hostingRenewals = hosting.filter(h => {
    if (!h.start_date) return false;
    const start = new Date(h.start_date);
    const renewal = new Date(start.setMonth(start.getMonth() + h.duration_months));
    return renewal >= nowIST && renewal <= in30Days;
  });

  const tasksDueToday = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    const due = new Date(t.due_date);
    return due.getDate() === nowIST.getDate() &&
      due.getMonth() === nowIST.getMonth() &&
      due.getFullYear() === nowIST.getFullYear();
  });

  // --- Attention Panel ---
  const tasksNext48Hrs = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    const due = new Date(t.due_date);
    return due > nowIST && due <= in48Hours;
  });

  const pendingApprovals = projects.filter(p => p.status === 'planning');

  // --- Financial Snapshot ---
  const currentMonth = nowIST.getMonth();
  const currentYear = nowIST.getFullYear();

  const thisMonthCollected = payments
    .filter(p => {
      if (p.status !== 'paid' || !p.paid_date) return false;
      const pDate = new Date(p.paid_date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // We could define an arbitrary goal, let's say ₹50,000 as per prompt suggestion or calculate dynamically.
  const monthlyTarget = 50000;
  const progressPercent = Math.min(100, (thisMonthCollected / monthlyTarget) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground">Control Tower</h1>
        <p className="text-muted-foreground">What needs your attention right now.</p>
      </div>

      {/* 1. Top Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FolderOpen className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Active Projects</span>
          </div>
          <p className="text-2xl font-bold">{activeProjects.length}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Pending PMTs</span>
          </div>
          <p className="text-2xl font-bold text-amber-500">{pendingPaymentsCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium uppercase tracking-wider">Overdue PMTs</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{overduePaymentsCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Server className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Hosting (30d)</span>
          </div>
          <p className="text-2xl font-bold">{hostingRenewals.length}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Tasks Today</span>
          </div>
          <p className="text-2xl font-bold">{tasksDueToday.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Attention Panel & Financials */}
        <div className="space-y-6 lg:col-span-1">

          {/* 2. Attention Panel */}
          <Card className="p-5 flex flex-col border-destructive/20 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              Attention Required
            </h3>

            <div className="space-y-4">
              {overduePaymentsInfo.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-500">Payments Overdue ({overduePaymentsInfo.length})</p>
                    <p className="text-xs text-muted-foreground">Immediate follow-up required</p>
                  </div>
                </div>
              )}

              {hostingRenewals.filter(h => h.managed_by === 'us').length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Server className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-500">Hosting Expiring Soon</p>
                    <p className="text-xs text-muted-foreground">{hostingRenewals.filter(h => h.managed_by === 'us').length} domains/servers need renewal</p>
                  </div>
                </div>
              )}

              {tasksNext48Hrs.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-500">Tasks Due in 48h</p>
                    <p className="text-xs text-muted-foreground">{tasksNext48Hrs.length} critical deliverables pending</p>
                  </div>
                </div>
              )}

              {pendingApprovals.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Pending Approvals</p>
                    <p className="text-xs text-muted-foreground">{pendingApprovals.length} projects in planning stage</p>
                  </div>
                </div>
              )}

              {approachingMaintenance.length > 0 && approachingMaintenance.sort((a, b) => a.daysUntilNextAnniversary - b.daysUntilNextAnniversary).map(m => (
                <div key={`maint-${m.project.id}`} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <Link href={`/projects/${m.project.id}`} className="hover:underline">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">Maint Due: {m.project.name}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">₹{m.dueAmount} due in {m.daysUntilNextAnniversary} days</p>
                  </div>
                </div>
              ))}

              {overduePaymentsInfo.length === 0 && hostingRenewals.length === 0 && tasksNext48Hrs.length === 0 && pendingApprovals.length === 0 && approachingMaintenance.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">You are all caught up. Calm skies ahead.</p>
                </div>
              )}
            </div>
          </Card>

          {/* 4. Financial Snapshot */}
          <Card className="p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Financials</h3>

            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">₹{thisMonthCollected.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Collected so far</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Progress</span>
                  <span>₹{thisMonthCollected.toLocaleString()} / ₹{monthlyTarget.toLocaleString()} Target</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </Card>

          {/* 5. Recent Activity Feed */}
          <Card className="p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Activity Feed
            </h3>
            <div className="space-y-4">
              {activityLogs.length > 0 ? activityLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-foreground leading-snug">
                      <span className="font-semibold">{log.user_name}</span> {log.action} <span className="font-medium text-muted-foreground">{log.entity}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Projects Snapshot */}
        <div className="lg:col-span-2">
          {/* 3. Active Projects Snapshot */}
          <Card className="p-5 shadow-sm h-full max-h-[800px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Projects Snapshot</h3>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
              {activeProjects.length > 0 ? activeProjects.map((project) => {
                const clientName = project.clients?.name || 'Unknown Client';
                const hasHosting = hosting.some(h => h.project_id === project.id);
                const isUsHosting = hosting.some(h => h.project_id === project.id && h.managed_by === 'us');

                let paymentStatus = 'Pending';
                let projectExpected = Number(project.budget || 0);

                const isMaintenance = (pm: any) => pm.description?.toLowerCase().includes('maintenance') || pm.description?.toLowerCase().includes('annual');
                const pPayments = payments.filter(pm => pm.project_id === project.id && pm.status === 'paid' && !isMaintenance(pm));
                const spent = pPayments.reduce((sum, pm) => sum + Number(pm.amount), 0);

                if (projectExpected === 0) paymentStatus = 'N/A';
                else if (spent >= projectExpected) paymentStatus = 'Paid';
                else if (spent > 0) paymentStatus = 'Partial';

                const deadlineStr = project.deadline ? new Date(project.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Set Date';

                return (
                  <Link href={`/projects/${project.id}`} key={project.id} className="block transition-transform hover:-translate-y-0.5">
                    <div className="border border-border/60 rounded-xl p-4 bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-3 mb-1">
                          <h4 className="font-bold text-base">{project.name}</h4>
                          <span className="text-xs text-muted-foreground">{clientName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={project.status === 'planning' ? 'outline' : 'default'} className="uppercase text-[10px] tracking-wider font-semibold">
                            {project.status === 'planning' ? 'Planning' : 'Dev'}
                          </Badge>
                          {hasHosting && (
                            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              Hosting: {isUsHosting ? 'Us' : 'Client'}
                            </Badge>
                          )}
                          <Badge variant="secondary" className={`uppercase text-[10px] tracking-wider font-semibold ${paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            paymentStatus === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}>
                            PMT: {paymentStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Next Milestone</span>
                        <span className="font-semibold text-sm">{deadlineStr}</span>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No active projects</p>
                  <p className="text-sm text-muted-foreground mt-1">Add a project to see it on the dashboard</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
