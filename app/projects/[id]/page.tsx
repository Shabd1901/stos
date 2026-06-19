import { getProjectById, getHostingContractsByProjectId, getTasksByProjectId, getPaymentsByProjectId } from '@/lib/api';
import { calculateProjectHealthScore } from '@/lib/project-health';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  ArrowLeft,
  Target,
  Server,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { calculateRenewalDate, formatIST } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RenewHostingDialog } from '@/components/projects/renew-hosting-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { ProjectTasksList } from '@/components/tasks/project-tasks-list';
import { ProjectPaymentsList } from '@/components/payments/project-payments-list';
import { ProjectFinancialsCard } from '@/components/projects/project-financials-card';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project = null;
  let hostingContracts: any[] = [];
  let tasks: any[] = [];
  let payments: any[] = [];

  let fetchError = null;

  try {
    project = await getProjectById(id);
    hostingContracts = await getHostingContractsByProjectId(id);
    tasks = await getTasksByProjectId(id);
    payments = await getPaymentsByProjectId(id);
  } catch (err: any) {
    fetchError = err;
    console.error("Project Fetch Error:", err);
  }

  if (!project) {
    return (
      <div className="space-y-8">
        <Link href="/projects">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Project not found</p>
          {fetchError && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-sm mx-auto max-w-xl text-left font-mono">
              Error Details: {JSON.stringify(fetchError, null, 2)}
            </div>
          )}
          {!fetchError && (
            <p className="text-sm text-muted-foreground">The project may have been archived or deleted.</p>
          )}
        </div>
      </div>
    );
  }

  const budgetUsedPercent = project.budget ? (project.spent / project.budget) * 100 : 0;
  const client: any = project.clients || null;

  // Grab the first active hosting contract or dummy if none
  const activeHosting = hostingContracts[0];

  let hostingStatus = 'Active';
  let hostingStatusColor = 'bg-green-500';
  let renewalDateStr = '';

  if (activeHosting?.start_date && activeHosting?.duration_months) {
    const renewalDate = calculateRenewalDate(activeHosting.start_date, activeHosting.duration_months);
    renewalDateStr = formatIST(renewalDate.toISOString(), 'MMM dd, yyyy');
    const now = new Date();
    const diffDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      hostingStatus = 'Expired';
      hostingStatusColor = 'bg-red-500';
    } else if (diffDays === 0) {
      hostingStatus = 'Due';
      hostingStatusColor = 'bg-red-500';
    } else if (diffDays <= 15) {
      hostingStatus = 'Renewal Soon';
      hostingStatusColor = 'bg-orange-500';
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>

              {/* Health Score Badge */}
              <div className="flex items-center gap-2">
                {project && (
                  <div className={`flex items-center justify-center font-bold text-sm px-2 py-1 rounded-md border ${calculateProjectHealthScore(project as any, tasks as any, payments as any, hostingContracts as any) > 80
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : calculateProjectHealthScore(project as any, tasks as any, payments as any, hostingContracts as any) > 60
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                    Health: {calculateProjectHealthScore(project as any, tasks as any, payments as any, hostingContracts as any)}/100
                  </div>
                )}
              </div>

              {project.health_status === 'at-risk' && (
                <span className="flex items-center gap-1 text-xs uppercase font-bold px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4" />
                  At Risk
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground flex items-center gap-2">
              <span>Client: {project.clients?.name || 'Unknown'}</span>
              <span>•</span>
              <span className="capitalize">{project.project_type || 'Website'}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={project.status as any} />
          <PriorityBadge priority={project.priority as any} />
          <EditProjectDialog project={project}>
            <Button variant="outline">Edit Settings</Button>
          </EditProjectDialog>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Description
          </h2>
          <p className="text-muted-foreground">{project.description}</p>
        </Card>
      )}

      {/* Client Details Card */}
      {client && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Client Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {client.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">{client.name}</h4>
                <p className="text-xs text-muted-foreground">{client.company || 'Independent'}</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{client.phone}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href={`/clients/${client.id}`}>
                <Button variant="outline" size="sm" className="w-full">View Client Profile</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Project content */}
      <div className="grid gap-8 grid-cols-1 xl:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-foreground font-medium">
                {(project as any).start_date ? formatIST((project as any).start_date, 'MMMM dd, yyyy') : 'No start date'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="text-foreground font-medium">
                {project.deadline ? formatIST(project.deadline, 'MMMM dd, yyyy') : 'No deadline'}
              </p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground mb-2">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{project.progress || 0}%</span>
              </div>
            </div>
          </div>
        </Card>

        <ProjectFinancialsCard project={project as any} initialPayments={payments} />
      </div>

      {/* Hosting Information */}
      {activeHosting && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
            <Server className="h-5 w-5" />
            Hosting Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Managed By</p>
              <p className="text-foreground font-medium capitalize">
                {activeHosting.managed_by === 'us' ? 'Us (Agency)' : activeHosting.managed_by || 'N/A'}
              </p>
            </div>
            {activeHosting.managed_by === 'us' && activeHosting.start_date && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-foreground font-medium">
                    {formatIST(activeHosting.start_date, 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration & Cost</p>
                  <p className="text-foreground font-medium">
                    {activeHosting.duration_months} Months / ${activeHosting.cost}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-foreground font-medium">
                      {String(renewalDateStr)}
                    </p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-white ${String(hostingStatusColor)}`}>
                      {String(hostingStatus)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          {activeHosting.managed_by === 'us' && activeHosting.status === 'active' && (
            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <form action={async () => {
                'use server';
                await supabase.from('hosting_contracts').update({ status: 'cancelled' }).eq('id', activeHosting.id);
                revalidatePath(`/projects/${id}`);
              }}>
                <Button type="submit" variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">Cancel Hosting</Button>
              </form>
              <RenewHostingDialog contract={activeHosting}>
                <Button size="sm">Confirm Renewal</Button>
              </RenewHostingDialog>
            </div>
          )}
        </Card>
      )
      }

      {/* Linked Tasks */}
      <ProjectTasksList projectId={id} initialTasks={tasks} />

      {/* Payment Log */}
      <ProjectPaymentsList projectId={id} initialPayments={payments} />
    </div >
  );
}
