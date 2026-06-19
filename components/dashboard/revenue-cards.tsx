import { StatCard } from '@/components/ui/stat-card';
import { IndianRupee, TrendingUp, Zap, Target } from 'lucide-react';

interface RevenueCardsProps {
  totalRevenue: number;
  mrr: number;
  growth: number;
  pipeline: number;
}

export function RevenueCards({
  totalRevenue,
  mrr,
  growth,
  pipeline,
}: RevenueCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={`₹${(totalRevenue / 1000).toFixed(1)}k`}
        subtitle="All-time revenue"
        icon={<IndianRupee className="h-6 w-6" />}
      />
      <StatCard
        title="Monthly Recurring"
        value={`₹${(mrr / 1000).toFixed(1)}k`}
        subtitle="Average MRR"
        icon={<Zap className="h-6 w-6" />}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Growth"
        value={`${growth}%`}
        subtitle="Year-over-year growth"
        icon={<TrendingUp className="h-6 w-6" />}
        trend={{ value: growth, isPositive: true }}
      />
      <StatCard
        title="Pipeline"
        value={`₹${(pipeline / 1000).toFixed(1)}k`}
        subtitle="Upcoming projects"
        icon={<Target className="h-6 w-6" />}
        trend={{ value: 15, isPositive: true }}
      />
    </div>
  );
}
