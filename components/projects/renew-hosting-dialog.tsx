'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { calculateRenewalDate } from '@/lib/utils';
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

interface RenewHostingDialogProps {
    children?: React.ReactNode;
    contract: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function RenewHostingDialog({ children, contract, open, onOpenChange }: RenewHostingDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    // Default duration and cost from previous
    const [duration, setDuration] = useState(contract?.duration_months?.toString() || '12');
    const [cost, setCost] = useState(contract?.cost?.toString() || '0');

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) setInternalOpen(newOpen);
        if (onOpenChange) onOpenChange(newOpen);
    };

    const handleConfirmRenewal = async () => {
        if (!duration || !cost || isNaN(Number(cost))) {
            toast({ title: 'Invalid', description: 'Enter valid duration and cost.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Calculate new start date based on previous end date safely
            let newStartDate = new Date().toISOString().split('T')[0];
            if (contract.start_date && contract.duration_months) {
                const oldEnd = calculateRenewalDate(contract.start_date, contract.duration_months);
                // If old end is in the past, maybe use today. Or just strictly string them:
                newStartDate = oldEnd.toISOString().split('T')[0];
            }

            // 2. Mark old contract as completed
            const { error: completeErr } = await supabase
                .from('hosting_contracts')
                .update({ status: 'completed' })
                .eq('id', contract.id);

            if (completeErr) throw completeErr;

            // 3. Insert new contract
            const { error: insertErr } = await supabase
                .from('hosting_contracts')
                .insert([{
                    project_id: contract.project_id,
                    start_date: newStartDate,
                    duration_months: Number(duration),
                    cost: Number(cost),
                    auto_renew: contract.auto_renew,
                    managed_by: contract.managed_by,
                    status: 'active'
                }]);

            if (insertErr) throw insertErr;

            // 4. Log the activity
            await supabase.from('activity_logs').insert([{
                user_name: 'Admin',
                action: 'Renewed Hosting Contract',
                entity: 'Hosting',
                entity_id: contract.id
            }]);

            toast({ title: 'Hosting Renewed', description: 'A new active contract has been appended to history.' });
            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            await supabase.from('system_errors').insert([{ context: 'renew_hosting', error_message: error.message, metadata: contract }]);
            toast({ title: 'Error', description: error.message || 'Failed to renew hosting.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Hosting Renewal</DialogTitle>
                    <DialogDescription>
                        This will mark the current term as "Completed" and append a new active billing cycle to the history.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>New Term Duration (Months)</Label>
                        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label>New Term Cost (₹)</Label>
                        <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} disabled={isLoading} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleConfirmRenewal} disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Confirm Renewal'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
