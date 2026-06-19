import { Project, Task, ProjectPayment, HostingContract } from './api/types';
import { toZonedTime } from 'date-fns-tz';

export function getActiveProjectsCount(projects: Project[]): number {
    return projects.filter(p => p.status === 'active' || p.status === 'planning').length;
}

export function getProjectsNearDeadline(projects: Project[]): number {
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');

    return projects.filter((p) => {
        if (p.status !== 'active' || !p.deadline) return false;
        const deadlineIST = toZonedTime(new Date(p.deadline), 'Asia/Kolkata');
        const diffTime = deadlineIST.getTime() - nowIST.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 5;
    }).length;
}

export function getTasksDueThisWeek(tasks: Task[]): number {
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');

    return tasks.filter((t) => {
        if (t.status === 'done' || !t.due_date) return false;
        const dueIST = toZonedTime(new Date(t.due_date), 'Asia/Kolkata');
        const diffTime = dueIST.getTime() - nowIST.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;
}

export function getOverdueTasksCount(tasks: Task[]): number {
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');

    return tasks.filter((t) => {
        if (t.status === 'done' || !t.due_date) return false;
        const dueIST = toZonedTime(new Date(t.due_date), 'Asia/Kolkata');
        // Overdue if in the past and not the same day
        return dueIST.getTime() < nowIST.getTime() && nowIST.getDate() !== dueIST.getDate();
    }).length;
}

export function calculateProjectProgress(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    return Math.round((completedTasks / tasks.length) * 100);
}

export function calculateProjectHealthScore(
    project: Project,
    tasks: Task[],
    payments: ProjectPayment[],
    hosting: HostingContract[]
): number {
    let score = 100;
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');
    const nowMST = nowIST.getTime(); // Just using raw JS timestamps for comparison

    // 1. Task Deductions (-5 per overdue task, max -25)
    let overdueTasks = 0;
    tasks.forEach(t => {
        if (t.status !== 'done' && t.due_date) {
            const due = new Date(t.due_date).getTime();
            if (due < nowMST) overdueTasks++;
        }
    });
    score -= Math.min(overdueTasks * 5, 25);

    // 2. Financial Deductions (-15 per overdue payment, max -30)
    let overduePayments = 0;
    payments.forEach(p => {
        if (p.status === 'overdue' || p.status === 'collections') {
            overduePayments++;
        } else if (p.status === 'pending' && p.due_date) {
            const due = new Date(p.due_date).getTime();
            if (due < nowMST) overduePayments++;
        }
    });
    score -= Math.min(overduePayments * 15, 30);

    // 3. Over Budget (-20)
    const budget = Number(project.budget || 0);
    if (project.spent > budget && budget > 0) {
        score -= 20;
    }

    // 4. Deadline Risk (-10)
    // If deadline is within 7 days and progress is less than 80%
    if (project.deadline && project.progress < 80) {
        const deadline = new Date(project.deadline).getTime();
        const diffDays = Math.ceil((deadline - nowMST) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
            score -= 10;
        }
    }

    // 5. Hosting Expired/Due (-15)
    // Checked via the first active hosting
    const activeHosting = hosting.find(h => (h as any).status === 'active' || true); // Assuming active by dates if status doesn't exist on HostingContract type
    if (activeHosting && activeHosting.start_date && activeHosting.duration_months) {
        const start = new Date(activeHosting.start_date);
        const renewalDate = new Date(start.setMonth(start.getMonth() + activeHosting.duration_months));
        const diffDays = Math.ceil((renewalDate.getTime() - nowMST) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            score -= 15;
        }
    }

    return Math.max(score, 0); // Never go below 0
}
