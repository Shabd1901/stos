'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Client } from '@/lib/api/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, Users } from 'lucide-react';
import { formatIST } from '@/lib/utils';

interface ClientsTableProps {
  clients: (Client & { projectsCount: number })[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const toggleClient = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredClients = clients.filter((client) => {
    if (statusFilter && client.status !== statusFilter) return false;
    return true;
  });

  if (clients.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="No Clients found"
          description="It looks like you don't have any clients added yet."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={filteredClients.length > 0 && selectedClients.length === filteredClients.length}
                    onChange={(e) =>
                      setSelectedClients(e.target.checked ? filteredClients.map((c) => c.id) : [])
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No clients match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {client.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.industry}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {client.projectsCount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatIST(client.joined_date, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
