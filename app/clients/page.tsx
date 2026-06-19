import { getClients } from '@/lib/api';
import { ClientsTable } from '@/components/clients/clients-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewClientDialog } from '@/components/clients/new-client-dialog';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your client relationships and details
          </p>
        </div>
        <NewClientDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </NewClientDialog>
      </div>


      {/* Clients table */}
      <ClientsTable clients={clients} />
    </div>
  );
}
