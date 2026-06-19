-- ========================================================
-- TRUNCATE ALL TABLES & INSERT SINGLE USER
-- Run this in the Supabase SQL Editor to reset all data.
-- ========================================================

-- 1. Truncate all tables (Cascade handles foreign key relationships)
TRUNCATE TABLE 
    public.system_errors, 
    public.cron_runs, 
    public.activity_logs, 
    public.leads, 
    public.notifications, 
    public.agency_expenses, 
    public.project_payments, 
    public.hosting_contracts, 
    public.tasks, 
    public.projects, 
    public.clients, 
    public.agency_users 
    CASCADE;

-- 2. Insert only the single user Shabdansh Prajapati
-- Note: 'Shabd@198380' is noted here for references. Since the application currently uses mock/direct auth bypass, we assign ID & email as 'Shabd1901'.
INSERT INTO public.agency_users (id, name, email, role) 
VALUES ('Shabd1901', 'Shabdansh Prajapati', 'Shabd1901', 'admin')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;
