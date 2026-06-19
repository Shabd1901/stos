import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatIST } from '@/lib/utils';

interface UpcomingDeadlinesProps {
  projects: any[];
}

export function UpcomingDeadlines({ projects }: UpcomingDeadlinesProps) {
  // Get upcoming projects sorted by deadline
  const upcoming = projects
    .filter((p) => p.status !== 'completed' && p.deadline)
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )
    .slice(0, 5);

  return (
    <Card>
      <div className="border-b border-border p-6">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium text-foreground">
                  {project.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {project.clients?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatIST(project.deadline, 'MMM dd, yyyy')}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
