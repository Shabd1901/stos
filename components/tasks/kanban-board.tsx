'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { TaskCard } from './task-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AgencyUser } from '@/lib/auth';

interface KanbanBoardProps {
  tasks: any[];
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-900' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-950' },
  { id: 'in-review', title: 'In Review', color: 'bg-yellow-100 dark:bg-yellow-950' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-950' },
];

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [users, setUsers] = useState<AgencyUser[]>([]);

  useEffect(() => {
    supabase.from('agency_users').select('id, name, email, role').order('name').then(({ data }) => {
      if (data) setUsers(data as AgencyUser[]);
    });
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (assigneeFilter && task.assignee_id !== assigneeFilter) return false;
    return true;
  });

  const groupedTasks = columns.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: filteredTasks.filter((task) => task.status === col.id),
    }),
    {} as Record<string, any[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All Assignees</option>
          {users.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col min-h-[600px]">
            {/* Column header */}
            <div className={`rounded-t-lg ${column.color} p-4 border border-border border-b-0`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-background text-xs font-semibold text-foreground">
                  {groupedTasks[column.id].length}
                </span>
              </div>
            </div>

            {/* Column content */}
            <div
              className={`flex-1 ${column.color} p-4 border border-border border-t-0 rounded-b-lg space-y-3 overflow-y-auto`}
            >
              {groupedTasks[column.id].length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <EmptyState
                    icon={ClipboardList}
                    title="No tasks"
                    description="No tasks in this column."
                  />
                </div>
              ) : (
                groupedTasks[column.id].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
