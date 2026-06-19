'use client';

import { useState } from 'react'; import Link from 'next/link';
import { Project } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, FolderOpen, AlertTriangle } from 'lucide-react';
import { formatIST } from '@/lib/utils';

interface ProjectsTableProps {
  projects: any[]; // Since we select *, clients(name)
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FolderOpen}
          title="No Projects found"
          description="You haven't created any projects yet."
        />
      </Card>
    );
  }

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filteredProjects = projects.filter((project) => {
    if (statusFilter && project.status !== statusFilter) return false;
    if (priorityFilter && project.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No projects match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {project.name}
                        {project.health_status === 'at-risk' && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.clients?.name || 'Unknown Client'}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-muted/50 text-muted-foreground tracking-wider">
                        {project.project_type || 'Website'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={project.priority as any} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.deadline ? formatIST(project.deadline, 'MMM dd, yyyy') : 'No deadline'}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
