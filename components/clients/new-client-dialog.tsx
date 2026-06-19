'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewClientDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function NewClientDialog({ children, open, onOpenChange }: NewClientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
        if (!newOpen) {
            // Reset form on close
            setName('');
            setCompany('');
            setEmail('');
        }
    };

    const handleSaveClient = async () => {
        if (!name || !company || !email) {
            toast({
                title: 'Missing fields',
                description: 'Please fill in all the required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from('clients').insert([
                {
                    name,
                    company,
                    email,
                    status: 'active',
                    joined_date: new Date().toISOString(),
                    last_contact_date: new Date().toISOString(),
                }
            ]);

            if (error) throw error;

            toast({
                title: 'Client Created',
                description: `${name} has been added as a client successfully.`,
            });

            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error creating client',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                        Create a new client profile for your agency.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Client Name</Label>
                        <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSaveClient} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Client'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
