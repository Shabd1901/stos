'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createAgencyExpense } from '@/lib/api';
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

interface NewExpenseDialogProps {
    children?: React.ReactNode;
}

export function NewExpenseDialog({ children }: NewExpenseDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('software');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setDescription('');
            setCategory('software');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
        }
    };

    const handleCreateExpense = async () => {
        if (!description || !amount || !date) {
            toast({
                title: 'Missing fields',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            await createAgencyExpense({
                description,
                category,
                amount: parseFloat(amount) || 0,
                date,
                logged_by: user?.id || null
            });

            toast({
                title: 'Expense Added',
                description: 'The expense has been recorded successfully.',
            });

            setIsOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error adding expense',
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
            <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Record New Expense</DialogTitle>
                    <DialogDescription>
                        Track agency outflows and overhead costs.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="exp-desc">Description</Label>
                        <Input id="exp-desc" placeholder="E.g., Vercel Pro Plan" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="software">Software & Subscriptions</SelectItem>
                                <SelectItem value="hosting">Hosting & Domains</SelectItem>
                                <SelectItem value="marketing">Marketing & Ads</SelectItem>
                                <SelectItem value="contractors">Contractors & Freelancers</SelectItem>
                                <SelectItem value="office">Office & Equipment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="exp-amount">Amount (₹)</Label>
                        <Input id="exp-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="exp-date">Date</Label>
                        <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleCreateExpense} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Expense'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
