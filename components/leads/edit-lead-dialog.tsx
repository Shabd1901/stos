'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { updateLead, deleteLead } from '@/lib/api';
import { Lead } from '@/lib/api/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

interface EditLeadDialogProps {
    children?: React.ReactNode;
    lead: Lead;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditLeadDialog({ children, lead, open, onOpenChange }: EditLeadDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form fields
    const [name, setName] = useState(lead.name);
    const [company, setCompany] = useState(lead.company || '');
    const [phone, setPhone] = useState(lead.phone || '');
    const [email, setEmail] = useState(lead.email || '');
    const [description, setDescription] = useState(lead.description || '');
    const [source, setSource] = useState<'referral' | 'instagram' | 'cold_dm' | 'website' | 'other'>(lead.source);
    const [status, setStatus] = useState<'new' | 'contacted' | 'qualified' | 'lost'>(lead.status);
    const [projectValue, setProjectValue] = useState(lead.project_value.toString());
    const [followUpDate, setFollowUpDate] = useState(lead.follow_up_date || '');
    const [converted, setConverted] = useState(lead.converted);

    const { toast } = useToast();
    const router = useRouter();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    useEffect(() => {
        if (isOpen) {
            setName(lead.name);
            setCompany(lead.company || '');
            setPhone(lead.phone || '');
            setEmail(lead.email || '');
            setDescription(lead.description || '');
            setSource(lead.source);
            setStatus(lead.status);
            setProjectValue(lead.project_value.toString());
            setFollowUpDate(lead.follow_up_date || '');
            setConverted(lead.converted);
        }
    }, [isOpen, lead]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
    };

    const handleUpdateLead = async () => {
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
            await updateLead(lead.id, {
                name,
                company: company || null,
                phone: phone || null,
                email: email || null,
                description: description || null,
                source,
                status: converted ? 'qualified' : status,
                converted,
                project_value: parseFloat(projectValue) || 0,
                follow_up_date: followUpDate || null,
            });

            toast({
                title: 'Lead Updated',
                description: `Details for "${name}" have been updated successfully.`,
            });

            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error updating lead',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLead = async () => {
        if (!confirm(`Are you sure you want to delete lead "${lead.name}"? This cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        try {
            await deleteLead(lead.id);
            toast({
                title: 'Lead Deleted',
                description: `Lead "${lead.name}" has been removed.`,
            });
            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error deleting lead',
                description: error.message || 'Failed to delete lead.',
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
                    <DialogTitle>Edit Lead Details</DialogTitle>
                    <DialogDescription>
                        Update lead status, follow-up logs, or details.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-lead-name">Contact Name *</Label>
                            <Input id="edit-lead-name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-lead-company">Business / Company</Label>
                            <Input id="edit-lead-company" placeholder="Acme Services" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-lead-phone">Contact Number</Label>
                            <Input id="edit-lead-phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-lead-email">Email Address</Label>
                            <Input id="edit-lead-email" type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                            <Label>Lead Status</Label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)} disabled={converted}>
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
                            <Label htmlFor="edit-lead-value">Estimated Value (₹)</Label>
                            <Input id="edit-lead-value" type="number" placeholder="50000" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-lead-follow-up">Follow Up Reminder Date</Label>
                            <Input id="edit-lead-follow-up" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-lead-desc">Description / Notes</Label>
                        <Textarea id="edit-lead-desc" placeholder="Notes about requirement..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                        <Checkbox 
                            id="edit-lead-converted" 
                            checked={converted} 
                            onCheckedChange={(checked: boolean) => setConverted(checked)} 
                        />
                        <Label 
                            htmlFor="edit-lead-converted"
                            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        >
                            🎉 Converted to Active Project / Client
                        </Label>
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between">
                    <Button variant="destructive" size="icon" onClick={handleDeleteLead} disabled={isLoading} title="Delete Lead">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleUpdateLead} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
