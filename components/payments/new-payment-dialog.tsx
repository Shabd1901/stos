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
import { useAuth } from '@/components/auth-provider';

interface NewPaymentDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultProjectId?: string;
    existingPayment?: any;
}

export function NewPaymentDialog({ children, open, onOpenChange, defaultProjectId, existingPayment }: NewPaymentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);

    const [projectId, setProjectId] = useState(defaultProjectId || '');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [paidDate, setPaidDate] = useState('');
    const [status, setStatus] = useState('paid');

    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const isEditMode = !!existingPayment;
    const isLocked = false; // Allowing editing of all fields including paid ones.

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            if (isEditMode) {
                setProjectId(existingPayment.project_id);
                setAmount(existingPayment.amount.toString());
                setDescription(existingPayment.description || '');
                setDueDate(existingPayment.due_date ? existingPayment.due_date.split('T')[0] : '');
                setPaidDate(existingPayment.paid_date ? existingPayment.paid_date.split('T')[0] : '');
                setStatus(existingPayment.status);
            }
        }
    }, [isOpen, isEditMode, existingPayment]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase.from('projects').select('id, name').eq('is_archived', false).order('name');
            if (!error && data) {
                setProjects(data);
            }
        } catch (e) {
            // ignore
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) setInternalOpen(newOpen);
        if (onOpenChange) onOpenChange(newOpen);
        if (!newOpen && !isEditMode) {
            setProjectId(defaultProjectId || '');
            setAmount('');
            setDescription('');
            setDueDate('');
            setPaidDate('');
            setStatus('paid');
        }
    };

    const handleSave = async () => {
        if (!projectId || !amount || isNaN(Number(amount))) {
            toast({ title: 'Invalid inputs', description: 'Please select a project and enter a valid amount.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            if (isEditMode) {
                const { error } = await supabase.from('project_payments').update({
                    amount: Number(amount),
                    description,
                    status,
                    due_date: dueDate || null,
                    paid_date: paidDate || (status === 'paid' ? new Date().toISOString().split('T')[0] : null)
                }).eq('id', existingPayment.id);

                if (error) throw error;
            } else {
                // Creation
                // We're wrapping this in a safe API to do the transaction/logging, but wait, the API was already updated previously or we just insert directly.
                // Looking at the code: it posts to /api/payments/add
                const payload = {
                    project_id: projectId,
                    amount: Number(amount),
                    description,
                    status,
                    due_date: dueDate || null,
                    paid_date: paidDate || (status === 'paid' ? new Date().toISOString().split('T')[0] : null),
                    logged_by: user?.id || null
                };

                const res = await fetch('/api/payments/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to create payment');
            }

            toast({ title: isEditMode ? 'Payment Updated' : 'Payment Added', description: 'Transaction processed successfully.' });
            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {

            // Log to system errors
            await supabase.from('system_errors').insert([{
                context: 'upsert_payment',
                error_message: error.message,
                metadata: { projectId, amount }
            }]);

            toast({ title: 'Error', description: error.message || 'Failed to save payment.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReversePayment = async () => {
        if (!isLocked) return;
        setIsLoading(true);
        try {
            // Reversing means: creating a negative payment or marking this as reversed?
            // "Require 'reverse payment' action instead. Financial history must not be casually editable."
            // We'll create a new payment line that negates it.

            // Use RPC or simply insert negative row:
            const { error: insertError } = await supabase.from('project_payments').insert([{
                project_id: existingPayment.project_id,
                amount: -Math.abs(Number(existingPayment.amount)),
                description: `Reversal for Payment #${existingPayment.id.slice(0, 6)}`,
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
                logged_by: user?.id || null
            }]);
            if (insertError) throw insertError;

            // Mark old one as "reversed"? The user simply says "prevent editing amount. require 'reverse payment' action"
            // We'll also update the original description to indicate it was reversed.
            await supabase.from('project_payments').update({
                description: `${existingPayment.description} (REVERSED)`
            }).eq('id', existingPayment.id);

            toast({ title: 'Payment Reversed', description: 'A negative transaction has been recorded.' });
            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            await supabase.from('system_errors').insert([{ context: 'reverse_payment', error_message: error.message, metadata: existingPayment }]);
            toast({ title: 'Error', description: error.message || 'Failed to reverse payment.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Payment Details' : 'Add New Payment'}</DialogTitle>
                    <DialogDescription>
                        Record or edit a project installment or transaction. Note: Reversing a payment will add a negative transaction.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Project</Label>
                        <Select value={projectId} onValueChange={setProjectId} disabled={isEditMode}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Amount (₹)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLocked} placeholder="5000" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLocked} placeholder="Milestone 1 Deposit" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isLocked} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Paid Date</Label>
                        <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} disabled={isLocked} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={isLocked}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="collections">Collections</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 justify-between w-full">
                    {isEditMode && existingPayment?.status === 'paid' ? (
                        <Button variant="destructive" onClick={handleReversePayment} disabled={isLoading}>
                            Reverse Payment
                        </Button>
                    ) : (
                        <div className="hidden sm:block"></div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Payment'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
