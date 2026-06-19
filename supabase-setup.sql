-- Enable uuid-ossp extension for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DROP TABLES IF THEY EXIST (Safe Reset)
-- ==========================================
DROP TABLE IF EXISTS system_errors CASCADE;
DROP TABLE IF EXISTS cron_runs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS agency_expenses CASCADE;
DROP TABLE IF EXISTS project_payments CASCADE;
DROP TABLE IF EXISTS hosting_contracts CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS agency_users CASCADE;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- Table: agency_users
CREATE TABLE public.agency_users (
    id TEXT PRIMARY KEY, -- Using TEXT to support both UUIDs and custom IDs (like 'dummy-admin-id')
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    industry TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on-hold', 'completed')) DEFAULT 'planning',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    end_date DATE,
    deadline DATE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    description TEXT,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'at-risk', 'critical')) DEFAULT 'healthy',
    project_type TEXT NOT NULL CHECK (project_type IN ('website', 'e-commerce', 'webpage', 'web-app', 'other')) DEFAULT 'other',
    maintenance_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: tasks
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'in-review', 'done')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    assignee_id TEXT REFERENCES public.agency_users(id) ON DELETE SET NULL,
    due_date DATE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: hosting_contracts
CREATE TABLE public.hosting_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    cost NUMERIC DEFAULT 0,
    auto_renew BOOLEAN DEFAULT FALSE NOT NULL,
    managed_by TEXT NOT NULL CHECK (managed_by IN ('us', 'client')) DEFAULT 'us',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: project_payments
CREATE TABLE public.project_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'collections')) DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    logged_by TEXT REFERENCES public.agency_users(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: agency_expenses
CREATE TABLE public.agency_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    logged_by TEXT REFERENCES public.agency_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('renewal', 'payment', 'project', 'system')) DEFAULT 'system',
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    phone TEXT,
    description TEXT,
    source TEXT NOT NULL CHECK (source IN ('referral', 'instagram', 'cold_dm', 'website', 'other')) DEFAULT 'other',
    status TEXT NOT NULL CHECK (status IN ('new', 'contacted', 'qualified', 'lost')) DEFAULT 'new',
    converted BOOLEAN DEFAULT FALSE NOT NULL,
    project_value NUMERIC DEFAULT 0,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: activity_logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: cron_runs
CREATE TABLE public.cron_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')) DEFAULT 'success',
    notifications_created INTEGER NOT NULL DEFAULT 0,
    escalations_triggered INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
);

-- Table: system_errors
CREATE TABLE public.system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context TEXT NOT NULL,
    error_message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. AUTO-UPDATE UPDATED_AT TRIGGERS
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Clients
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Projects
CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Tasks
CREATE TRIGGER trigger_update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Hosting Contracts
CREATE TRIGGER trigger_update_hosting_contracts_updated_at
    BEFORE UPDATE ON public.hosting_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Leads
CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- We enable RLS and define a permissive policy so that the application
-- can query and modify these tables out-of-the-box using the anonymous key.
-- (For a strict production setting, you would restrict policies based on auth.uid())

ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for each table
CREATE POLICY "Enable all access" ON public.agency_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.hosting_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.project_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.agency_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.cron_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON public.system_errors FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 5. SEED INITIAL DATA
-- ==========================================

-- Seed only the single requested admin user
INSERT INTO public.agency_users (id, name, email, role) VALUES
('Shabd1901', 'Shabdansh Prajapati', 'Shabd1901', 'admin')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;
