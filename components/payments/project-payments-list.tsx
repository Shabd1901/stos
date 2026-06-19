'use client';

import { useState, useEffect } from 'react';
import { ProjectPayment } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, DollarSign } from 'lucide-react';
import { formatIST } from '@/lib/utils';
import { NewPaymentDialog } from '@/components/payments/new-payment-dialog';
import { supabase } from '@/lib/supabase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ProjectPaymentsListProps {
    projectId: string;
    initialPayments: ProjectPayment[];
}

export function ProjectPaymentsList({ projectId, initialPayments }: ProjectPaymentsListProps) {
    const [payments, setPayments] = useState<ProjectPayment[]>(initialPayments);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<ProjectPayment | undefined>();

    useEffect(() => {
        // Subscribe to changes on the project_payments table for this specific project
        const channel = supabase
            .channel(`public:project_payments:project_id=eq.${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'project_payments',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                const newPayment = payload.new as ProjectPayment;
                const oldPayment = payload.old as ProjectPayment;

                if (payload.eventType === 'INSERT') {
                    setPayments((prev) => [...prev, newPayment]);
                } else if (payload.eventType === 'UPDATE') {
                    setPayments((prev) => prev.map((p) => p.id === newPayment.id ? newPayment : p));
                } else if (payload.eventType === 'DELETE') {
                    setPayments((prev) => prev.filter((p) => p.id !== oldPayment.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const sortedPayments = [...payments].sort((a, b) => {
        // Sort by paid_date if available, then due_date, then created_at
        const dateA = a.paid_date || a.due_date || a.created_at;
        const dateB = b.paid_date || b.due_date || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const handleEditPayment = (payment: ProjectPayment) => {
        setSelectedPayment(payment);
        setIsPaymentDialogOpen(true);
    };

    const handleAddPayment = () => {
        setSelectedPayment(undefined);
        setIsPaymentDialogOpen(true);
    };

    return (
        <Card className="mt-8">
            <div className="border-b border-border p-4 sm:p-6 flex justify-between items-center bg-card rounded-t-xl">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Payment Log
                </h2>
                <Button onClick={handleAddPayment} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                </Button>
            </div>

            <div className="p-0 sm:p-0 overflow-x-auto">
                {sortedPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed m-6 rounded-lg border-border">
                        No payments recorded yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Paid Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.description || 'Milestone Payment'}</TableCell>
                                    <TableCell>₹{Number(payment.amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                                            payment.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                                                'bg-gray-500/10 text-gray-500'
                                            }`}>
                                            {payment.status.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell>{payment.due_date ? formatIST(payment.due_date, 'MMM dd, yyyy') : '-'}</TableCell>
                                    <TableCell>{payment.paid_date ? formatIST(payment.paid_date, 'MMM dd, yyyy') : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => handleEditPayment(payment)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <NewPaymentDialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                defaultProjectId={projectId}
                existingPayment={selectedPayment}
            />
        </Card >
    );
}
