import { StatCard } from '@/components/ui/stat-card';
import { Briefcase, CheckSquare, Zap } from 'lucide-react';

interface ProjectsSummaryProps {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

export function ProjectsSummary({
  totalProjects,
  activeProjects,
  completedProjects,
}: ProjectsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Projects"
        value={totalProjects}
        subtitle="All projects"
        icon={<Briefcase className="h-6 w-6" />}
      />
      <StatCard
        title="Active"
        value={activeProjects}
        subtitle="Currently running"
        icon={<Zap className="h-6 w-6" />}
      />
      <StatCard
        title="Completed"
        value={completedProjects}
        subtitle="Finished projects"
        icon={<CheckSquare className="h-6 w-6" />}
      />
    </div>
  );
}
