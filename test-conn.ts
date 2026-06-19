import fs from 'fs';
import path from 'path';

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
            }
        });
        console.log("Loaded environment variables from .env.local");
    } else {
        console.log(".env.local file not found at:", envPath);
    }
} catch (e) {
    console.error("Failed to parse .env.local:", e);
}

// Dynamically import supabase after env loading
async function testConnection() {
    const { supabase } = await import('./lib/supabase');
    
    console.log("Testing Supabase connection...");
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set");
    console.log("Supabase Anon Key length:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);
    
    try {
        const { data, error } = await supabase
            .from('agency_users')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error("\n--- Database Query Error Details ---");
            console.error("Message:", error.message);
            console.error("Details:", error.details);
            console.error("Hint:", error.hint);
            console.error("Code:", error.code);
            console.error("------------------------------------\n");
        } else {
            console.log("\nSuccess! Connection is working. Data found in agency_users:", data);
        }
    } catch (e: any) {
        console.error("Exception thrown during connection:", e.message || e);
    }
}

testConnection();
