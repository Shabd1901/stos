'use client';

import { useState } from 'react';
import { Lead } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EditLeadDialog } from './edit-lead-dialog';
import { 
    Phone, 
    Mail, 
    Calendar, 
    MessageSquare, 
    Search, 
    DollarSign, 
    CheckCircle, 
    AlertTriangle,
    Target,
    Filter
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface LeadsListProps {
    leads: Lead[];
}

export function LeadsList({ leads }: LeadsListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('active'); // active, new, contacted, qualified, lost, converted, all
    const [sortBy, setSortBy] = useState<'created_at' | 'value' | 'follow_up'>('created_at');

    // Calculate metrics
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.converted).length;
    const lostLeads = leads.filter(l => l.status === 'lost' && !l.converted).length;
    const activeLeads = leads.filter(l => !l.converted && l.status !== 'lost');
    
    const activePipelineValue = activeLeads.reduce((sum, l) => sum + Number(l.project_value || 0), 0);
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const dueFollowUps = leads.filter(l => 
        !l.converted && 
        l.status !== 'lost' && 
        l.follow_up_date && 
        l.follow_up_date <= todayStr
    ).length;

    // Filter & Sort Logic
    const filteredLeads = leads.filter(lead => {
        // Search term filter
        const matchSearch = 
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.description && lead.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchSearch) return false;

        // Status filter
        if (statusFilter === 'active') {
            return !lead.converted && lead.status !== 'lost';
        } else if (statusFilter === 'new') {
            return lead.status === 'new' && !lead.converted;
        } else if (statusFilter === 'contacted') {
            return lead.status === 'contacted' && !lead.converted;
        } else if (statusFilter === 'qualified') {
            return lead.status === 'qualified' && !lead.converted;
        } else if (statusFilter === 'lost') {
            return lead.status === 'lost' && !lead.converted;
        } else if (statusFilter === 'converted') {
            return lead.converted;
        }
        
        return true; // 'all'
    });

    const sortedLeads = [...filteredLeads].sort((a, b) => {
        if (sortBy === 'value') {
            return Number(b.project_value || 0) - Number(a.project_value || 0);
        } else if (sortBy === 'follow_up') {
            if (!a.follow_up_date) return 1;
            if (!b.follow_up_date) return -1;
            return new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime();
        } else {
            // created_at
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
    });

    const getStatusBadge = (lead: Lead) => {
        if (lead.converted) {
            return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase text-[10px] tracking-wider font-bold">Converted</Badge>;
        }
        switch (lead.status) {
            case 'new':
                return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 uppercase text-[10px] tracking-wider font-bold">New</Badge>;
            case 'contacted':
                return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase text-[10px] tracking-wider font-bold">Contacted</Badge>;
            case 'qualified':
                return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 uppercase text-[10px] tracking-wider font-bold">Qualified</Badge>;
            case 'lost':
                return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20 uppercase text-[10px] tracking-wider font-bold">Lost</Badge>;
            default:
                return null;
        }
    };

    const getSourceBadge = (source: string) => {
        const style = "text-[10px] uppercase tracking-wider font-semibold bg-secondary/50 text-secondary-foreground";
        return <Badge className={style}>{source.replace('_', ' ')}</Badge>;
    };

    const isFollowUpDue = (dateStr: string | null) => {
        if (!dateStr) return false;
        return dateStr <= todayStr;
    };

    return (
        <div className="space-y-6">
            {/* Lead Stats Strip */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Pipeline"
                    value={`${activeLeads.length} Leads`}
                    icon={<Target className="h-6 w-8 text-primary" />}
                />
                <StatCard
                    title="Pipeline Value"
                    value={`₹${activePipelineValue.toLocaleString()}`}
                    icon={<DollarSign className="h-6 w-8 text-emerald-500" />}
                />
                <StatCard
                    title="Due Follow-ups"
                    value={`${dueFollowUps} Actionable`}
                    icon={<AlertTriangle className={`h-6 w-8 ${dueFollowUps > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />}
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    icon={<CheckCircle className="h-6 w-8 text-green-500" />}
                />
            </div>

            {/* Filter Strip */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contact, company, notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-muted/30"
                    />
                </div>

                {/* Filter and Sorting Tabs */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="active">Active Pipeline</option>
                        <option value="new">New Leads</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                        <option value="all">All Leads (History)</option>
                    </select>

                    <select
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="created_at">Order By: Date Created</option>
                        <option value="value">Order By: Project Value</option>
                        <option value="follow_up">Order By: Follow-up Date</option>
                    </select>
                </div>
            </div>

            {/* Leads Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {sortedLeads.map((lead) => {
                    const followUpDue = !lead.converted && lead.status !== 'lost' && isFollowUpDue(lead.follow_up_date);
                    
                    return (
                        <Card 
                            key={lead.id} 
                            className={`p-5 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden bg-card ${
                                followUpDue ? 'border-amber-500/40 ring-1 ring-amber-500/10' : 'border-border/60'
                            }`}
                        >
                            {/* Follow up due warning banner */}
                            {followUpDue && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                            )}

                            <div>
                                {/* Header: Business Name & Status */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight text-foreground">
                                            {lead.company || lead.name}
                                        </h3>
                                        {lead.company && (
                                            <p className="text-xs text-muted-foreground mt-0.5">Contact: {lead.name}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {getStatusBadge(lead)}
                                    </div>
                                </div>

                                {/* Body Details */}
                                <div className="space-y-2 mt-4 text-sm">
                                    {lead.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                            <Phone className="h-3.5 w-3.5" />
                                            <a href={`tel:${lead.phone}`} className="hover:underline text-xs">
                                                {lead.phone}
                                            </a>
                                        </div>
                                    )}
                                    {lead.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                            <Mail className="h-3.5 w-3.5" />
                                            <a href={`mailto:${lead.email}`} className="hover:underline text-xs truncate max-w-[200px]">
                                                {lead.email}
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* Follow up Date status display */}
                                    {lead.follow_up_date && !lead.converted && lead.status !== 'lost' && (
                                        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border w-fit ${
                                            followUpDue 
                                                ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                                : 'bg-muted/50 text-muted-foreground border-border/40'
                                        }`}>
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-xs font-semibold">
                                                Follow up: {new Date(lead.follow_up_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {followUpDue && " (Due Now)"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {lead.description && (
                                        <div className="flex gap-2 bg-muted/40 p-3 rounded-lg border border-border/30 mt-3">
                                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                                {lead.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer: Project Value, Source Tag, Edit Button */}
                            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-5">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Deal Value</span>
                                    <p className="text-base font-bold text-foreground">
                                        ₹{Number(lead.project_value || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getSourceBadge(lead.source)}
                                    <EditLeadDialog lead={lead}>
                                        <Button size="sm" variant="outline" className="h-8 text-xs">
                                            Manage
                                        </Button>
                                    </EditLeadDialog>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {sortedLeads.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-card">
                        <Target className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="font-semibold text-muted-foreground">No leads found</p>
                        <p className="text-xs text-muted-foreground mt-1">Adjust filters or create a new lead to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
