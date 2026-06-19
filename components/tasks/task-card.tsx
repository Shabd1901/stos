import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { formatIST } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AgencyUser } from '@/lib/auth';

interface TaskCardProps {
  task: any;
}

export function TaskCard({ task }: TaskCardProps) {
  const [assignee, setAssignee] = useState<AgencyUser | null>(null);

  useEffect(() => {
    if (task.assignee_id) {
      supabase.from('agency_users').select('name').eq('id', task.assignee_id).single().then(({ data }) => {
        if (data) setAssignee(data as AgencyUser);
      });
    } else {
      setAssignee(null);
    }
  }, [task.assignee_id]);

  return (
    <Card className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Title */}
        <h3 className="font-medium text-foreground text-sm">{task.title}</h3>

        {/* Priority */}
        <PriorityBadge priority={task.priority as any} />

        {/* Description */}
        {
          task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )
        }

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          {task.due_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto bg-muted/50 px-2 py-1 rounded-md">
              <Calendar className="h-3.5 w-3.5 opacity-70" />
              <span>{formatIST(task.due_date, 'MMM dd')}</span>
            </div>
          )}

          <div className="flex -space-x-2 ml-auto shrink-0">
            {/* If task has assignee, grab initials based on name */}
            {assignee ? (
              <div
                className="h-7 w-7 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary"
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            ) : task.assigned_to ? (
              <div
                className="h-7 w-7 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary"
                title={task.assigned_to}
              >
                {task.assigned_to.charAt(0).toUpperCase()}
              </div>
            ) : null}
          </div>
        </div>

        {/* Project name */}
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {task.projects?.name || 'No Project'}
        </div>
      </div >
    </Card >
  );
}
