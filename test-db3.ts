import { supabase } from './lib/supabase';

async function test() {
    console.log("Testing getProjects join...");
    const { data: list, error: listErr } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .limit(1);

    console.log("List error:", listErr);
    console.log("List data:", list);

    if (list && list.length > 0) {
        console.log("Testing getProjectById join...");
        const id = list[0].id;
        const { data: single, error: singleErr } = await supabase
            .from('projects')
            .select('*, clients(*)')
            .eq('id', id)
            .single();

        console.log("Single error:", singleErr);
        console.log("Single data:", !!single);
    } else {
        console.log("No projects found to test single.");

        console.log("Testing a raw single without ID constraint just to see if syntax passes...");
        const { data: raw, error: rawErr } = await supabase
            .from('projects')
            .select('*, clients(*)')
            .limit(1);
        console.log("Raw syntax error:", rawErr);
    }
}
test();
