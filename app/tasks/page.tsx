import { getTasks } from '@/lib/api';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  let tasks: any[] = [];
  try {
    tasks = await getTasks();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  }
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your team's tasks with Kanban board
          </p>
        </div>
        <NewTaskDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </NewTaskDialog>
      </div>


      {/* Kanban board */}
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
