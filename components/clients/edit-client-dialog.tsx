'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Client } from '@/lib/api/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditClientDialogProps {
    children?: React.ReactNode;
    client: Client;
}

export function EditClientDialog({ children, client }: EditClientDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(client.name);
    const [company, setCompany] = useState(client.company || '');
    const [email, setEmail] = useState(client.email);
    const [phone, setPhone] = useState(client.phone || '');
    const [industry, setIndustry] = useState(client.industry || '');
    const [status, setStatus] = useState(client.status || 'active');

    const { toast } = useToast();
    const router = useRouter();

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset to current client values
            setName(client.name);
            setCompany(client.company || '');
            setEmail(client.email);
            setPhone(client.phone || '');
            setIndustry(client.industry || '');
            setStatus(client.status || 'active');
        }
    };

    const handleSaveClient = async () => {
        if (!name || !email) {
            toast({
                title: 'Missing fields',
                description: 'Please provide at least a name and email.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from('clients').update({
                name,
                company,
                email,
                phone,
                industry,
                status
            }).eq('id', client.id);

            if (error) throw error;

            toast({
                title: 'Profile Updated',
                description: `${name}'s profile has been updated successfully.`,
            });

            router.refresh();
            setIsOpen(false);
        } catch (error: any) {
            toast({
                title: 'Error updating client',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm('Are you sure you want to delete this client? This will also delete all associated projects and tasks.')) {
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('clients').delete().eq('id', client.id);
            if (error) throw error;

            toast({
                title: 'Client Deleted',
                description: 'The client and all associated records have been removed.',
            });

            setIsOpen(false);
            router.push('/clients');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error deleting client',
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
                    <DialogTitle>Edit Client Profile</DialogTitle>
                    <DialogDescription>
                        Update details and status for {client.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Client Name</Label>
                        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-company">Company</Label>
                        <Input id="edit-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-industry">Industry</Label>
                        <Input id="edit-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Select value={status} onValueChange={(val) => setStatus(val as typeof status)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex sm:justify-between items-center w-full">
                    <Button variant="destructive" size="icon" onClick={handleDeleteClient} disabled={isLoading} className="mr-auto" title="Delete Client">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSaveClient} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
