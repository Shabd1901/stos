'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { AgencyUser } from '@/lib/auth';

interface AuthContextType {
    user: AgencyUser | null;
}

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({
    children,
    user
}: {
    children: ReactNode;
    user: AgencyUser | null;
}) {
    return (
        <AuthContext.Provider value={{ user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
