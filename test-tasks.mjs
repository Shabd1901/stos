import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTasks() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, projects(name)')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Success! Data:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

testTasks();
