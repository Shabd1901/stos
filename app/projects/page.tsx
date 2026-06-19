import { getProjects } from '@/lib/api';
import { ProjectsTable } from '@/components/projects/projects-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
        <NewProjectDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </NewProjectDialog>
      </div>


      {/* Projects table */}
      <ProjectsTable projects={projects} />
    </div>
  );
}
