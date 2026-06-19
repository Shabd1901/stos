import { NextResponse } from 'next/server';
import { addPaymentAndUpdateProjectSafely } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // body may now include logged_by string
        await addPaymentAndUpdateProjectSafely(body, 'Admin');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Payment Error API:', error);
        // Log System Error
        await supabase.from('system_errors').insert([{
            context: 'api_payment_add',
            error_message: error.message || String(error),
            metadata: { timestamp: new Date().toISOString() }
        }]);
        return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
    }
}
