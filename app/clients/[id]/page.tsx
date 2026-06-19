import { getClientById, getProjectsByClientId } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Building2, ArrowLeft, ChevronRight } from 'lucide-react';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client = null;
  let clientProjects: any[] = [];

  try {
    client = await getClientById(id);
    clientProjects = await getProjectsByClientId(id);
  } catch (err) {
    // Console error or Handle gracefully
  }

  if (!client) {
    return (
      <div className="space-y-8">
        <Link href="/clients">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
            <p className="mt-1 text-muted-foreground">{client.company || 'No Company'}</p>
          </div>
        </div>
        <EditClientDialog client={client}>
          <Button variant="outline">Edit Profile</Button>
        </EditClientDialog>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="text-foreground">{client.industry || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{client.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-foreground">{client.phone || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-2">
                <StatusBadge status={client.status as any} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {clientProjects.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {clientProjects.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects */}
      {clientProjects.length > 0 && (
        <Card>
          <div className="border-b border-border p-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-foreground">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status as any} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${Number(project.budget).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
