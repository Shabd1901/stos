import { Project, ProjectPayment, Lead } from './api/types';
import { toZonedTime } from 'date-fns-tz';

export function calculateTotalRevenue(payments: ProjectPayment[]): number {
    return payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
}

export function calculateRevenueThisMonth(payments: ProjectPayment[]): number {
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');
    const currentMonth = nowIST.getMonth();
    const currentYear = nowIST.getFullYear();

    return payments
        .filter(p => {
            if (p.status !== 'paid' || !p.paid_date) return false;
            const pDate = toZonedTime(new Date(p.paid_date), 'Asia/Kolkata');
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
}

export function calculatePendingPayments(projects: Project[]): number {
    // Alternatively, we could sum the 'pending' / 'overdue' rows from project_payments
    // But conceptually pending = budget - spent.
    return projects.reduce((sum, p) => sum + Math.max(0, Number(p.budget) - Number(p.spent)), 0);
}

export function calculateClientLTV(projects: Project[], payments: ProjectPayment[], hostingRecurring: number): {
    totalProjects: number;
    totalRevenue: number;
    hostingRecurring: number;
} {
    const totalRevenue = calculateTotalRevenue(payments);
    return {
        totalProjects: projects.length,
        totalRevenue,
        hostingRecurring
    };
}

export function calculateConversionStats(leads: Lead[]): {
    conversionRate: number;
    averageProjectValue: number;
    topSource: string;
} {
    if (leads.length === 0) return { conversionRate: 0, averageProjectValue: 0, topSource: 'N/A' };

    const convertedLeads = leads.filter(l => l.converted);
    const conversionRate = (convertedLeads.length / leads.length) * 100;

    const totalProjectValue = leads.reduce((sum, l) => sum + Number(l.project_value || 0), 0);
    const averageProjectValue = leads.length > 0 ? totalProjectValue / leads.length : 0;

    // Top Source Calculation
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
        if (l.converted) {
            sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
        }
    });

    let topSource = 'N/A';
    let maxConversions = 0;
    for (const [source, count] of Object.entries(sourceCounts)) {
        if (count > maxConversions) {
            maxConversions = count;
            topSource = source;
        }
    }

    return {
        conversionRate,
        averageProjectValue,
        topSource: topSource.charAt(0).toUpperCase() + topSource.slice(1).replace('_', ' ')
    };
}
