export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    industry: string | null;
    status: 'active' | 'inactive' | 'pending';
    joined_date: string;
    last_contact_date: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    name: string;
    client_id: string;
    status: 'planning' | 'active' | 'on-hold' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    end_date?: string;
    deadline?: string;
    progress: number;
    description?: string;
    budget?: number;
    spent: number;
    is_archived: boolean;
    health_status: 'healthy' | 'at-risk' | 'critical';
    project_type: 'website' | 'e-commerce' | 'webpage' | 'web-app' | 'other';
    maintenance_enabled?: boolean;
    start_date?: string;
    created_at?: string;
    updated_at?: string;
    clients?: { name: string };
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in-progress' | 'in-review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigned_to: string | null;
    due_date: string | null;
    project_id: string;
    created_at: string;
    updated_at: string;
    // Included relations occasionally
    projects?: Project;
}

export interface ProjectPayment {
    id: string;
    project_id: string;
    amount: number;
    description: string | null;
    status: 'pending' | 'paid' | 'overdue' | 'collections';
    due_date: string | null;
    paid_date: string | null;
    created_at: string;
    logged_by?: string;
    agency_users?: { name: string };
}

export interface HostingContract {
    id: string;
    project_id: string;
    start_date: string;
    duration_months: number;
    cost: number;
    auto_renew: boolean;
    managed_by: 'us' | 'client';
    created_at: string;
    updated_at: string;
}

export interface AgencyExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    created_at: string;
    logged_by?: string;
    agency_users?: { name: string };
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'renewal' | 'payment' | 'project' | 'system';
    related_id: string | null;
    is_read: boolean;
    idempotency_key?: string;
    created_at: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    phone: string | null;
    description: string | null;
    source: 'referral' | 'instagram' | 'cold_dm' | 'website' | 'other';
    status: 'new' | 'contacted' | 'qualified' | 'lost';
    converted: boolean;
    project_value: number;
    follow_up_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: string;
    user_name: string;
    action: string;
    entity: string;
    entity_id: string | null;
    timestamp: string;
}

export interface CronRun {
    id: string;
    executed_at: string;
    status: 'success' | 'failed';
    notifications_created: number;
    escalations_triggered: number;
    error_message: string | null;
}

export interface SystemError {
    id: string;
    context: string;
    error_message: string;
    metadata: any;
    timestamp: string;
}
