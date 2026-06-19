'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, ShieldCheck, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please enter both your username and password.');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Successfully logged in
            // Redirect to the originally requested page, or home
            const redirectTo = searchParams.get('redirect') || '/';
            router.push(redirectTo);
            router.refresh();

        } catch (err: any) {
            setError(err.message || 'Invalid username or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="w-full max-w-md p-2">
            <Card className="border border-border/60 shadow-xl backdrop-blur-md bg-card/65 select-none relative overflow-hidden rounded-2xl">
                {/* Decorative top accent lines */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-emerald-500" />

                <CardHeader className="space-y-2 text-center pt-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">S&T Web Works</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                        Enter your credentials to unlock the Control Tower
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 rounded-lg py-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold uppercase tracking-wider">Access Denied</AlertTitle>
                            <AlertDescription className="text-xs leading-relaxed mt-0.5">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Username / Email
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="pl-9 bg-muted/20"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 bg-muted/20"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-2 pb-8 flex flex-col gap-2">
                    <Button
                        type="submit"
                        className="w-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-transform h-10 rounded-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Decrypting Session...' : 'Access Dashboard'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
