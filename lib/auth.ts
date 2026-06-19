// Auth module - login system removed, returning dummy user

export interface AgencyUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export async function getSessionUser(): Promise<AgencyUser | null> {
    // Return a dummy admin user to bypass login completely
    return {
        id: 'Shabd1901',
        email: 'Shabd1901',
        name: 'Shabdansh Prajapati',
        role: 'admin'
    };
}
