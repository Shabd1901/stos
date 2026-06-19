import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' }, 
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Query the database for the user with matching credentials
        const { data: user, error } = await supabase
            .from('agency_users')
            .select('*')
            .or(`id.eq.${username},email.eq.${username}`)
            .eq('password_hash', hashedPassword)
            .maybeSingle();

        if (error) {
            console.error('Login DB Error:', error);
            return NextResponse.json(
                { success: false, error: 'Database connection failed' }, 
                { status: 500 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' }, 
                { status: 401 }
            );
        }

        // Create the HMAC-signed session token
        const token = await signSession({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        const response = NextResponse.json({ success: true });
        
        // Save session in HttpOnly cookie
        response.cookies.set('session_user', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
        });

        return response;

    } catch (error: any) {
        console.error('Login Endpoint Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}
