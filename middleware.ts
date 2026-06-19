import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-key-stwebworks-2026';

/**
 * UTF-8 Safe Base64 Decoding for Edge Middleware
 */
function decodeBase64(str: string): string {
    return decodeURIComponent(escape(atob(str)));
}

/**
 * Checks session token validity in Edge middleware using Web Crypto APIs.
 */
async function verifySessionToken(token: string): Promise<boolean> {
    try {
        const [payloadBase64, signature] = token.split('.');
        if (!payloadBase64 || !signature) return false;
        
        const payloadStr = decodeBase64(payloadBase64);
        
        const encoder = new TextEncoder();
        const keyData = encoder.encode(AUTH_SECRET);
        const messageData = encoder.encode(payloadStr);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        
        // Convert hex signature back to bytes array
        const signatureBytes = new Uint8Array(
            signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        const isValid = await crypto.subtle.verify(
            'HMAC',
            cryptoKey,
            signatureBytes,
            messageData
        );
        
        if (!isValid) return false;
        
        const payload = JSON.parse(payloadStr);
        if (payload.exp < Date.now()) return false; // Expired
        
        return true;
    } catch (e) {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip static assets, login page, and authentication APIs
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') || 
        pathname === '/login' ||
        pathname === '/favicon.ico' ||
        pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js)$/)
    ) {
        return NextResponse.next();
    }

    // 2. Read session cookie
    const token = request.cookies.get('session_user')?.value;

    // 3. Redirect to login if token is missing or invalid
    if (!token || !(await verifySessionToken(token))) {
        const loginUrl = new URL('/login', request.url);
        // Save the destination page to redirect back after successful login
        if (pathname !== '/' && pathname !== '') {
            loginUrl.searchParams.set('redirect', pathname);
        }
        
        const response = NextResponse.redirect(loginUrl);
        if (token) {
            response.cookies.delete('session_user');
        }
        return response;
    }

    return NextResponse.next();
}

export const config = {
    // Intercept all routes except static assets
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
