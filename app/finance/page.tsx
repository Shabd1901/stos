import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatIST } from '@/lib/utils';
import { Server, DollarSign, Wallet, Activity, AlertTriangle, TrendingUp, CheckCircle, Plus } from 'lucide-react';
import { getProjects, getAllHostingContracts, getAgencyExpenses, getAllPayments } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { NewExpenseDialog } from '@/components/finance/new-expense-dialog';
import { NewPaymentDialog } from '@/components/payments/new-payment-dialog';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [projects, hostingContracts, expenses, payments] = await Promise.all([
    getProjects().catch(() => []),
    getAllHostingContracts().catch(() => []),
    getAgencyExpenses().catch(() => []),
    getAllPayments().catch(() => [])
  ]);

  // Calculate Gross Revenue: Total budget of all active projects
  const grossRevenue = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  
  // Calculate Cash Collected: Total amount of all "paid" payments
  const cashCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Calculate Accounts Receivable: The total remaining balance owed across all projects
  // Calculated as: Gross Revenue (Total Entitled) - Cash Collected
  const accountsReceivable = grossRevenue - cashCollected;

  // Calculate Total Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Calculate Net Profit: Gross Revenue - Expenses
  const netProfit = grossRevenue - totalExpenses;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance</h1>
          <p className="mt-2 text-muted-foreground">
            Track project payments, hosting renewals, and agency expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewExpenseDialog>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </NewExpenseDialog>
          <NewPaymentDialog>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </NewPaymentDialog>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross Revenue"
          value={`₹${grossRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-8 text-green-500" />}
        />
        <StatCard
          title="Cash Collected"
          value={`₹${cashCollected.toLocaleString()}`}
          icon={<CheckCircle className="h-6 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Accounts Receivable"
          value={`₹${accountsReceivable.toLocaleString()}`}
          icon={<AlertTriangle className="h-6 w-8 text-amber-500" />}
        />
        <StatCard
          title="Net Profit"
          value={`₹${netProfit.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-8 text-primary" />}
        />
      </div>

      {/* Section 1 - Project Payments */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border p-6">
          <DollarSign className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-foreground">Project Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const projectPayments = payments.filter((p) => p.project_id === project.id && p.status === 'paid');
                const actualReceived = projectPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const pending = Math.max(0, Number(project.budget || 0) - actualReceived);

                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-foreground">
                      {project.clients?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.name}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ₹{Number(project.budget || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ₹{actualReceived.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-amber-600 font-medium">
                      ₹{pending.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Outstanding Payments section */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border p-6 border-l-4 border-l-amber-500 rounded-l-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground">Outstanding Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments
                .filter((p) => p.status === 'pending' || p.status === 'overdue')
                .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
                .map((payment) => {
                  const project = projects.find(p => p.id === payment.project_id);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium text-foreground">
                        {payment.due_date ? formatIST(payment.due_date, 'MMM dd, yyyy') : 'N/A'}
                        {payment.status === 'overdue' && (
                          <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 uppercase tracking-wider">
                            Overdue
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project?.clients?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {project?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.description || 'Project Payment'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-600">
                        ₹{Number(payment.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {payments.filter((p) => p.status === 'pending' || p.status === 'overdue').length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-500/50 mb-2" />
                      <p>All clear! No outstanding payments.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Section 1.5 - Recent Payments Log */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border p-6">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 10).map((payment) => {
                const project = projects.find(p => p.id === payment.project_id);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">
                      {formatIST(payment.paid_date || payment.due_date || payment.created_at, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {project?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.description || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payment.agency_users?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${payment.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        payment.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      ₹{Number(payment.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No payment logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Section 2 - Hosting Renewals Table */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border p-6">
          <Server className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-foreground">Hosting Renewals</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Hosting Cost</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostingContracts.map((contract) => {
                const project = projects.find(p => p.id === contract.project_id);
                if (!project) return null;

                const startDate = new Date(contract.start_date);
                const renewalDate = new Date(startDate.setMonth(startDate.getMonth() + Number(contract.duration_months)));

                const now = new Date();
                const diffDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                let hostingStatus = 'Active';
                let statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                const cStatus = (contract as any).status;
                if (cStatus === 'completed') {
                  hostingStatus = 'Completed';
                  statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                } else if (cStatus === 'cancelled') {
                  hostingStatus = 'Cancelled';
                  statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                } else if (diffDays < 0) {
                  hostingStatus = 'Expired';
                  statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                } else if (diffDays === 0) {
                  hostingStatus = 'Due';
                  statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                } else if (diffDays <= 15) {
                  hostingStatus = 'Renewal Soon';
                  statusClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                }

                return (
                  <TableRow key={contract.id} className={(contract as any).status !== 'active' ? 'opacity-60' : ''}>
                    <TableCell className="font-medium text-foreground">
                      {project.clients?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.name}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ${contract.cost?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatIST(renewalDate.toISOString(), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {(contract as any).status !== 'active' ? '—' : (diffDays < 0 ? '—' : diffDays)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        {hostingStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {hostingContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hosting projects managed by the agency.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Section 3 - Expenses */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border p-6">
          <Wallet className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-foreground">Agency Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">
                    {formatIST(expense.date, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {expense.description}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {expense.agency_users?.name || '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    -${expense.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No expenses recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
