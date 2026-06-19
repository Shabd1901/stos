import { supabase } from '@/lib/supabase';
import type {
    Client,
    Project,
    Task,
    ProjectPayment,
    HostingContract,
    AgencyExpense,
    AppNotification,
    Lead,
    ActivityLog
} from './types';

// Clients
export async function getClients() {
    const { data, error } = await supabase
        .from('clients')
        .select('*, projects(count)')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map((c: any) => ({
        ...c,
        projectsCount: c.projects?.[0]?.count || 0
    })) as (Client & { projectsCount: number })[];
}

export async function getClientById(id: string) {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_archived', false)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Client;
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'joined_date' | 'last_contact_date'>) {
    const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
    if (error) throw error;
    return data as Client;
}

export async function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'joined_date'>>) {
    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Client;
}

// Projects
export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
    if (error) throw error;
    // Map clients.name to clientName to be compatible with UI if needed, or use as is
    return data;
}

export async function getProjectsByClientId(clientId: string) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Project[];
}

export async function getProjectById(id: string) {
    const { data, error } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .eq('is_archived', false)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Project & { clients: Client };
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
    if (error) throw error;
    return data as Project;
}

export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client_id'>>) {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Project;
}

// Tasks
export async function getTasks() {
    const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Convert to plain JSON to avoid Next.js 15 Server Component ReadableStream serialization errors
    return JSON.parse(JSON.stringify(data));
}

export async function getTasksByProjectId(projectId: string) {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
    if (error) throw error;
    return data as Task;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id'>>) {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Task;
}

// Hosting Contracts
export async function getHostingContractsByProjectId(projectId: string) {
    const { data, error } = await supabase
        .from('hosting_contracts')
        .select('*')
        .eq('project_id', projectId);
    if (error) throw error;
    return data as HostingContract[];
}

export async function getAllHostingContracts() {
    const { data, error } = await supabase
        .from('hosting_contracts')
        .select('*');
    if (error) throw error;
    return data as HostingContract[];
}

// Project Payments
export async function getPaymentsByProjectId(projectId: string) {
    const { data, error } = await supabase
        .from('project_payments')
        .select('*')
        .eq('is_archived', false)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
    if (error) throw error;
    return data as ProjectPayment[];
}

export async function getAllPayments() {
    const { data, error } = await supabase
        .from('project_payments')
        .select('*, agency_users(name)')
        .eq('is_archived', false)
        .order('due_date', { ascending: true });
    if (error) throw error;
    return data as ProjectPayment[];
}

// Notifications
export async function getUnreadNotifications() {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as AppNotification[];
}

// Leads
export async function getLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Lead[];
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
    if (error) throw error;
    return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Lead;
}

export async function deleteLead(id: string) {
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// Activity Logs
export async function getActivityLogs(limit: number = 20) {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data as ActivityLog[];
}

// Transactions / RPC
export async function addPaymentAndUpdateProjectSafely(
    payment: Omit<ProjectPayment, 'id' | 'created_at'>,
    userName: string
) {
    // Attempt to insert payment directly to ensure it works even if RPC is not defined
    const { error: paymentError } = await supabase.from('project_payments').insert([{
        project_id: payment.project_id,
        amount: payment.amount,
        description: payment.description,
        status: payment.status,
        due_date: payment.due_date,
        paid_date: payment.paid_date || (payment.status === 'paid' ? new Date().toISOString().split('T')[0] : null)
    }]);

    if (paymentError) throw paymentError;

    // Update project spent amount if status is paid
    if (payment.status === 'paid') {
        const { data: project } = await supabase.from('projects')
            .select('spent')
            .eq('id', payment.project_id)
            .single();

        if (project) {
            await supabase.from('projects')
                .update({ spent: (project.spent || 0) + Number(payment.amount) })
                .eq('id', payment.project_id);
        }
    }
}

// Expenses
export async function getAgencyExpenses() {
    const { data, error } = await supabase
        .from('agency_expenses')
        .select('*, agency_users(name)')
        .order('date', { ascending: false });
    if (error) throw error;
    return data as AgencyExpense[];
}

export async function createAgencyExpense(expense: Omit<AgencyExpense, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('agency_expenses')
        .insert([{
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            logged_by: expense.logged_by || null
        }])
        .select()
        .single();
    if (error) throw error;
    return data as AgencyExpense;
}

// Archiving (Soft Deletes)
export async function archiveClient(id: string) {
    const { error } = await supabase
        .from('clients')
        .update({ is_archived: true })
        .eq('id', id);
    if (error) throw error;
}

export async function archiveProject(id: string) {
    const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', id);
    if (error) throw error;
}
