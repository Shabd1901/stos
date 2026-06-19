'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { Switch } from '@/components/ui/switch';

interface NewProjectDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function NewProjectDialog({ children, open, onOpenChange }: NewProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [clientDialogOpen, setClientDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [budget, setBudget] = useState('');
    const [projectType, setProjectType] = useState<string>('website');
    const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        const { data, error } = await supabase.from('clients').select('id, name').order('name');
        if (!error && data) {
            setClients(data);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
        if (!newOpen) {
            // Reset form
            setName('');
            setClientId('');
            setBudget('');
            setProjectType('website');
            setMaintenanceEnabled(false);
        }
    };

    const handleSaveProject = async () => {
        if (!name || !clientId) {
            toast({
                title: 'Missing fields',
                description: 'Please provide a project name and select a client.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('projects').insert([{
                name,
                client_id: clientId,
                project_type: projectType,
                budget: parseFloat(budget) || 0,
                status: 'planning',
                priority: 'medium',
                progress: 0,
                spent: 0,
                maintenance_enabled: maintenanceEnabled,
                start_date: new Date().toISOString()
            }]);

            if (error) throw error;

            toast({
                title: 'Project Created',
                description: 'The new project has been created successfully.',
            });

            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error creating project',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                {children && <DialogTrigger asChild>{children}</DialogTrigger>}
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>
                            Set up a new project and assign it to a client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                                id="project-name"
                                placeholder="Website Redesign"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Client</Label>
                            {clients.length > 0 ? (
                                <Select value={clientId} onValueChange={setClientId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground flex items-center justify-between">
                                    <span>No clients found.</span>
                                    <Button variant="outline" size="sm" onClick={() => setClientDialogOpen(true)}>
                                        Create Client
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="budget">Quotation (₹)</Label>
                            <Input
                                id="budget"
                                type="number"
                                placeholder="5000"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3 mt-2">
                            <div className="space-y-0.5">
                                <Label>Annual Maintenance</Label>
                                <p className="text-xs text-muted-foreground">Charge ₹450/year from start date</p>
                            </div>
                            <Switch
                                checked={maintenanceEnabled}
                                onCheckedChange={setMaintenanceEnabled}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSaveProject} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Project'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <NewClientDialog
                open={clientDialogOpen}
                onOpenChange={(open) => {
                    setClientDialogOpen(open);
                    if (!open) fetchClients(); // Refetch clients when dialog closes in case a new one was added
                }}
            />
        </>
    );
}
