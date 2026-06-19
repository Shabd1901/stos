import { supabase } from './lib/supabase';
import { createClient, createProject, getProjectById } from './lib/api/index';

async function test() {
    try {
        console.log("Mocking client...");
        const client = await createClient({
            name: 'Test Client',
            email: 'test@example.com',
            status: 'active',
            company: 'Test Co',
            industry: 'Tech',
            phone: '123'
        });
        console.log("Client created:", client.id);

        console.log("Mocking project...");
        const project = await createProject({
            name: 'Test Project',
            client_id: client.id,
            status: 'active',
            progress: 0,
            priority: 'low',
            budget: 100,
            spent: 0,
            description: 'Test'
        } as any);
        console.log("Project created:", project.id);

        console.log("Fetching project details via getProjectById...");
        const details = await getProjectById(project.id);
        console.log("Success! Details:", details.id);

        // Clean up
        await supabase.from('projects').delete().eq('id', project.id);
        await supabase.from('clients').delete().eq('id', client.id);
        console.log("Cleanup done.");

    } catch (e) {
        console.error("Test failed with error:", e);
    }
}
test();
