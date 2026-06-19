'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectPayment } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProjectFinancialsCardProps {
    project: Project;
    initialPayments: ProjectPayment[];
}

export function ProjectFinancialsCard({ project, initialPayments }: ProjectFinancialsCardProps) {
    const [payments, setPayments] = useState<ProjectPayment[]>(initialPayments);

    useEffect(() => {
        const channel = supabase
            .channel(`public:project_payments:project_id=eq.${project.id}:financials`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'project_payments',
                filter: `project_id=eq.${project.id}`
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
    }, [project.id]);

    const budget = Number(project.budget || 0);

    const [maintenanceFees, setMaintenanceFees] = useState(0);

    useEffect(() => {
        if (project.maintenance_enabled) {
            const startDateString = project.start_date || project.created_at;
            const startDate = startDateString ? new Date(startDateString) : new Date();
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const maintenanceYears = Math.max(1, Math.floor(diffDays / 365) + 1);
            setMaintenanceFees(maintenanceYears * 450);
        }
    }, [project.maintenance_enabled, project.start_date, project.created_at]);

    const totalExpected = budget;

    // Dynamically calculate spent from payments, separating maintenance automatically if tagged
    const isMaintenance = (p: ProjectPayment) => p.description?.toLowerCase().includes('maintenance') || p.description?.toLowerCase().includes('annual');

    const projectPayments = payments.filter(p => p.status === 'paid' && !isMaintenance(p));
    const maintenancePayments = payments.filter(p => p.status === 'paid' && isMaintenance(p));

    const dynamicSpent = projectPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const maintenanceReceived = maintenancePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const isOverpaid = dynamicSpent > totalExpected;
    const budgetUsedPercent = totalExpected > 0 ? (dynamicSpent / totalExpected) * 100 : 0;
    const displayPercent = Math.min(budgetUsedPercent, 100);

    return (
        <Card className="p-6">
            <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financials
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Project Quotation</p>
                        <p className="text-foreground font-medium">
                            ₹{budget.toLocaleString()}
                        </p>
                    </div>
                    {project.maintenance_enabled && (
                        <div className="text-right">
                            <p className="text-sm text-amber-600 dark:text-amber-500 font-medium tracking-tight">Maintenance Due</p>
                            <p className="text-foreground font-bold">
                                ₹{Math.max(0, maintenanceFees - maintenanceReceived).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Tot: ₹{maintenanceFees.toLocaleString()} | Paid: ₹{maintenanceReceived.toLocaleString()}</p>
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Project Received (excl. Maintenance)</p>
                    <p className={`font-medium text-lg ${isOverpaid ? 'text-green-500' : 'text-foreground'}`}>
                        ₹{dynamicSpent.toLocaleString()}
                    </p>
                </div>
                <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground mb-2">Completion vs Budget</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isOverpaid ? 'bg-green-500' : budgetUsedPercent > 90
                                    ? 'bg-green-500'
                                    : budgetUsedPercent > 75
                                        ? 'bg-amber-500'
                                        : 'bg-primary'
                                    }`}
                                style={{ width: `${displayPercent}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold">
                            {budgetUsedPercent.toFixed(0)}%
                        </span>
                    </div>
                    {isOverpaid ? (
                        <p className="mt-2 text-xs font-medium text-green-500">
                            Overpaid by ₹{(dynamicSpent - totalExpected).toLocaleString()}
                        </p>
                    ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                            ₹{(totalExpected - dynamicSpent).toLocaleString()} remaining on core project
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
