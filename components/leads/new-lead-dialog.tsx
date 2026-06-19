'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createLead } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';

interface NewLeadDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function NewLeadDialog({ children, open, onOpenChange }: NewLeadDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState<'referral' | 'instagram' | 'cold_dm' | 'website' | 'other'>('other');
    const [status, setStatus] = useState<'new' | 'contacted' | 'qualified' | 'lost'>('new');
    const [projectValue, setProjectValue] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');

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
            // Reset form
            setName('');
            setCompany('');
            setPhone('');
            setEmail('');
            setDescription('');
            setSource('other');
            setStatus('new');
            setProjectValue('');
            setFollowUpDate('');
        }
    };

    const handleSaveLead = async () => {
        if (!name) {
            toast({
                title: 'Missing fields',
                description: 'Contact Name is required.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            await createLead({
                name,
                company: company || null,
                phone: phone || null,
                email: email || null,
                description: description || null,
                source,
                status,
                converted: false,
                project_value: parseFloat(projectValue) || 0,
                follow_up_date: followUpDate || null,
            });

            toast({
                title: 'Lead Created',
                description: `Lead for "${name}" has been registered successfully.`,
            });

            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error creating lead',
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
            <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6 rounded-xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                        Track a potential business relationship or opportunity.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lead-name">Contact Name *</Label>
                            <Input id="lead-name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lead-company">Business / Company</Label>
                            <Input id="lead-company" placeholder="Acme Services" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lead-phone">Contact Number</Label>
                            <Input id="lead-phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lead-email">Email Address</Label>
                            <Input id="lead-email" type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Lead Source</Label>
                            <Select value={source} onValueChange={(val: any) => setSource(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="cold_dm">Cold DM</SelectItem>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Initial Status</Label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lead-value">Estimated Value (₹)</Label>
                            <Input id="lead-value" type="number" placeholder="50000" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lead-follow-up">Follow Up Reminder Date</Label>
                            <Input id="lead-follow-up" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="lead-desc">Description / Notes</Label>
                        <Textarea id="lead-desc" placeholder="Details about their requirement, tech stack, timeline..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSaveLead} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Lead'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
