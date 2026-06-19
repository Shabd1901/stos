import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: projects, error: projectsErr } = await supabase.from('projects').select('*').limit(3);

        const { data: testArchived, error: archivedErr } = await supabase.from('projects').select('*').eq('is_archived', false).limit(1);

        return NextResponse.json({
            projects,
            projectsErr,
            testArchived,
            archivedErr
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
