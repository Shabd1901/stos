-- ========================================================
-- TRUNCATE ALL TABLES & INSERT SINGLE CREDENTIALED USER
-- Run this in the Supabase SQL Editor to reset all data.
-- ========================================================

-- 1. Ensure password_hash column exists on agency_users
ALTER TABLE public.agency_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Truncate all tables (Cascade handles foreign key relationships)
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

-- 3. Insert only the single user Shabdansh Prajapati (ID & Username: Shabd1908)
-- Password 'Shabd@198380' is stored securely as SHA-256: f352d9ca1f9cf81955b45bfe9f67af781b117ff5d4a559cb152bfe396e34132b
INSERT INTO public.agency_users (id, name, email, password_hash, role) 
VALUES ('Shabd1908', 'Shabdansh Prajapati', 'Shabd1908', 'f352d9ca1f9cf81955b45bfe9f67af781b117ff5d4a559cb152bfe396e34132b', 'admin')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
