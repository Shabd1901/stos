import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase.from('clients').insert([
            {
                name: 'Test Client Endpoint',
                company: 'Test Company',
                email: 'endpoint@test.com',
                status: 'active',
            }
        ]).select();

        return NextResponse.json({
            success: !error,
            data,
            error
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
