import { getLeads } from '@/lib/api';
import { LeadsList } from '@/components/leads/leads-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await getLeads().catch(() => []);
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Business Leads</h1>
          <p className="mt-2 text-muted-foreground">
            Track potential businesses, deal values, and upcoming follow-ups.
          </p>
        </div>
        <NewLeadDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </NewLeadDialog>
      </div>

      {/* Leads board list */}
      <LeadsList leads={leads} />
    </div>
  );
}
