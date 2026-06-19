import { StatCard } from '@/components/ui/stat-card';
import { CheckCircle, ListTodo, Clock } from 'lucide-react';

interface TasksSummaryProps {
  totalTasks: number;
  tasksInProgress: number;
  tasksCompleted: number;
}

export function TasksSummary({
  totalTasks,
  tasksInProgress,
  tasksCompleted,
}: TasksSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Tasks"
        value={totalTasks}
        subtitle="Active tasks in system"
        icon={<ListTodo className="h-6 w-6" />}
      />
      <StatCard
        title="In Progress"
        value={tasksInProgress}
        subtitle="Tasks being worked on"
        icon={<Clock className="h-6 w-6" />}
      />
      <StatCard
        title="Completed"
        value={tasksCompleted}
        subtitle="Tasks finished"
        icon={<CheckCircle className="h-6 w-6" />}
      />
    </div>
  );
}
