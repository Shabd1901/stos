import { Card } from '@/components/ui/card';
import {
    IndianRupee,
    TrendingUp,
    CreditCard,
    Server,
    FolderOpen,
    AlertCircle,
    CalendarCheck,
    AlertTriangle,
    Target,
    BarChart,
    PieChart,
    RefreshCw
} from 'lucide-react';

export interface IDashboardMetrics {
    totalRevenueAllTime: number;
    revenueThisMonth: number;
    pendingPayments: number;
    hostingRenewalsThisMonth: number;
    activeProjects: number;
    projectsNearDeadline: number;
    tasksDueThisWeek: number;
    overdueTasks: number;
    // Strategic Intelligence
    conversionRate: number;
    averageProjectValue: number;
    topSource: string;
    hostingRecurringForecast: number;
}

export function DashboardMetrics({ summary }: { summary: IDashboardMetrics }) {
    const metrics = [
        // Row 1
        {
            title: 'Total Revenue (All Time)',
            value: `₹${summary.totalRevenueAllTime.toLocaleString()}`,
            icon: IndianRupee,
            color: 'text-green-500',
        },
        {
            title: 'Revenue This Month',
            value: `₹${summary.revenueThisMonth.toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-blue-500',
        },
        {
            title: 'Pending Payments',
            value: `₹${summary.pendingPayments.toLocaleString()}`,
            icon: CreditCard,
            color: 'text-amber-500',
        },
        {
            title: 'Hosting Renewals This Month',
            value: summary.hostingRenewalsThisMonth.toString(),
            icon: Server,
            color: 'text-purple-500',
        },
        // Row 2
        {
            title: 'Active Projects',
            value: summary.activeProjects.toString(),
            icon: FolderOpen,
            color: 'text-indigo-500',
        },
        {
            title: 'Projects Near Deadline (< 5 days)',
            value: summary.projectsNearDeadline.toString(),
            icon: AlertCircle,
            color: 'text-orange-500',
        },
        {
            title: 'Tasks Due This Week',
            value: summary.tasksDueThisWeek.toString(),
            icon: CalendarCheck,
            color: 'text-teal-500',
        },
        {
            title: 'Overdue Tasks',
            value: summary.overdueTasks.toString(),
            icon: AlertTriangle,
            color: 'text-red-500',
        },
        // Row 3 - Strategic Intelligence
        {
            title: 'Lead Conversion Rate',
            value: `${summary.conversionRate.toFixed(1)}%`,
            icon: Target,
            color: 'text-pink-500',
        },
        {
            title: 'Average Project Value',
            value: `₹${Math.round(summary.averageProjectValue).toLocaleString()}`,
            icon: BarChart,
            color: 'text-cyan-500',
        },
        {
            title: 'Top Lead Source',
            value: summary.topSource,
            icon: PieChart,
            color: 'text-emerald-500',
        },
        {
            title: 'Predictable Hosting Rev',
            value: `₹${summary.hostingRecurringForecast.toLocaleString()}/yr`,
            icon: RefreshCw,
            color: 'text-violet-500',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
                <Card key={metric.title} className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`rounded-lg bg-background p-3 ${metric.color}`}>
                            <metric.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {metric.title}
                            </p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {metric.value}
                            </h3>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
