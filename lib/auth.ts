import { cookies } from 'next/headers';

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-key-stwebworks-2026';

export interface AgencyUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

/**
 * UTF-8 Safe Base64 Encoding
 */
export function encodeBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

/**
 * UTF-8 Safe Base64 Decoding
 */
export function decodeBase64(str: string): string {
    return decodeURIComponent(escape(atob(str)));
}

/**
 * Computes a secure SHA-256 hash of a password string using Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Creates a signed token string containing the user session context.
 */
export async function signSession(user: { id: string, name: string, email: string, role: string }): Promise<string> {
    const payload = JSON.stringify({ 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days validity
    });
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(AUTH_SECRET);
    const messageData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageData
    );
    
    const signature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
        
    return `${encodeBase64(payload)}.${signature}`;
}

/**
 * Verifies a signed session token and returns the user context if valid.
 */
export async function verifySession(token: string): Promise<AgencyUser | null> {
    try {
        const [payloadBase64, signature] = token.split('.');
        if (!payloadBase64 || !signature) return null;
        
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
        
        // Convert hex signature back to array buffer
        const signatureBytes = new Uint8Array(
            signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        const isValid = await crypto.subtle.verify(
            'HMAC',
            cryptoKey,
            signatureBytes,
            messageData
        );
        
        if (!isValid) return null;
        
        const payload = JSON.parse(payloadStr);
        if (payload.exp < Date.now()) return null; // expired token
        
        return {
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role
        };
    } catch (e) {
        return null;
    }
}

/**
 * Server action / component helper to get the current authenticated user session.
 */
export async function getSessionUser(): Promise<AgencyUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session_user')?.value;
        if (!token) return null;
        return verifySession(token);
    } catch (e) {
        return null;
    }
}
