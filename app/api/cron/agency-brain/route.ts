import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check if API is secured
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key'; // Use env var in production

export async function GET(request: Request) {
    // 1. Authenticate Request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = {
            renewals: 0,
            paymentsEscalated: 0,
            projectsAtRisk: 0,
            leadsFollowUp: 0,
        };

        // A. RENEWAL REMINDER SYSTEM
        // Hosting renewals within 7 days
        const { data: hostingContracts } = await supabase
            .from('hosting_contracts')
            .select('id, project_id, start_date, duration_months')
            .eq('auto_renew', true);

        if (hostingContracts) {
            const now = new Date();
            for (const contract of hostingContracts) {
                if (!contract.start_date || !contract.duration_months) continue;

                // Calculate end date based on start_date + duration_months
                const startDate = new Date(contract.start_date);
                const renewalDate = new Date(startDate.setMonth(startDate.getMonth() + contract.duration_months));

                // Difference in days
                const diffDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // If renewal is within exactly 7 days, trigger a notification (or <= 7 days, let's say exactly 7 or 3 or 1 to avoid spam)
                // For demonstration, let's alert if it's strictly between 0 and 7 days
                if (diffDays >= 0 && diffDays <= 7) {
                    const currentYearMonth = `${now.getFullYear()}-${now.getMonth()}`;
                    const idempotencyKey = `renewal_${contract.id}_${currentYearMonth}`;

                    const { data: existingNotif } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('idempotency_key', idempotencyKey)
                        .maybeSingle();

                    if (!existingNotif) {
                        try {
                            await supabase.from('notifications').insert([{
                                title: 'Hosting Renewal Upcoming',
                                message: `A hosting contract (ID: ${contract.id.slice(0, 8)}) is due for renewal in ${diffDays} days.`,
                                type: 'renewal',
                                related_id: contract.id,
                                idempotency_key: idempotencyKey
                            }]);
                            results.renewals++;
                        } catch (e) {
                            // Ignored if duplicate key
                        }
                    }
                }
            }
        }

        // B. PAYMENT DUE AUTOMATION
        // Project payment pending > 7 days past due
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

        const { data: overduePayments } = await supabase
            .from('project_payments')
            .select('id, project_id, amount')
            .in('status', ['pending', 'overdue'])
            .lt('due_date', sevenDaysAgoISO);

        if (overduePayments && overduePayments.length > 0) {
            for (const payment of overduePayments) {
                const idempotencyKey = `payment_collection_${payment.id}`;

                // Check idempotency first
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('idempotency_key', idempotencyKey)
                    .maybeSingle();

                if (!existingNotif) {
                    // Mark as collections
                    await supabase
                        .from('project_payments')
                        .update({ status: 'collections' })
                        .eq('id', payment.id);

                    // Insert notification
                    try {
                        await supabase.from('notifications').insert([{
                            title: 'Payment Escalated to Collections',
                            message: `Payment of ₹${payment.amount} is >7 days overdue and has been escalated to Collections.`,
                            type: 'payment',
                            related_id: payment.id,
                            idempotency_key: idempotencyKey
                        }]);
                        results.paymentsEscalated++;
                    } catch (e) {
                        // Ignore duplicate
                    }
                }
            }
        }

        // C. DEADLINE ESCALATION LOGIC
        // Task overdue > 3 days -> Project "At Risk"
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoISO = threeDaysAgo.toISOString().split('T')[0];

        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('id, project_id, title')
            .in('status', ['todo', 'in-progress', 'in-review'])
            .lt('due_date', threeDaysAgoISO);

        if (overdueTasks && overdueTasks.length > 0) {
            // Get unique projects
            const atRiskProjectIds = Array.from(new Set(overdueTasks.map(t => t.project_id)));

            for (const projectId of atRiskProjectIds) {
                // Check current health of project
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('health_status, name')
                    .eq('id', projectId)
                    .single();

                if (projectData && projectData.health_status !== 'at-risk') {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const idempotencyKey = `project_risk_${projectId}_${todayStr}`;

                    const { data: existingNotif } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('idempotency_key', idempotencyKey)
                        .maybeSingle();

                    if (!existingNotif) {
                        // Mark as at-risk
                        await supabase
                            .from('projects')
                            .update({ health_status: 'at-risk' })
                            .eq('id', projectId);

                        try {
                            // Insert notification
                            await supabase.from('notifications').insert([{
                                title: 'Project At Risk',
                                message: `Project "${projectData.name}" has tasks >3 days overdue and has been flagged as At Risk.`,
                                type: 'project',
                                related_id: projectId,
                                idempotency_key: idempotencyKey
                            }]);
                            results.projectsAtRisk++;
                        } catch (e) {
                            // ignore duplicate
                        }
                    }
                }
            }
        }

        // D. LEAD FOLLOW-UP REMINDER AUTOMATION
        // Active leads with a follow-up date due today or in the past
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: dueLeads } = await supabase
            .from('leads')
            .select('id, name, company, follow_up_date')
            .eq('converted', false)
            .neq('status', 'lost')
            .lte('follow_up_date', todayStr);

        if (dueLeads && dueLeads.length > 0) {
            for (const lead of dueLeads) {
                const idempotencyKey = `lead_followup_${lead.id}_${todayStr}`;

                // Check idempotency first
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('idempotency_key', idempotencyKey)
                    .maybeSingle();

                if (!existingNotif) {
                    try {
                        // Insert notification
                        await supabase.from('notifications').insert([{
                            title: 'Lead Follow-up Due',
                            message: `Follow-up with "${lead.name}"${lead.company ? ` (${lead.company})` : ''} is due.`,
                            type: 'system',
                            related_id: lead.id,
                            idempotency_key: idempotencyKey
                        }]);
                        results.leadsFollowUp++;
                    } catch (e) {
                        // ignore duplicate
                    }
                }
            }
        }

        // Log the successful run
        await supabase.from('cron_runs').insert([{
            status: 'success',
            notifications_created: results.renewals + results.paymentsEscalated + results.projectsAtRisk + results.leadsFollowUp,
            escalations_triggered: results.paymentsEscalated + results.projectsAtRisk + results.leadsFollowUp,
            error_message: null
        }]);

        return NextResponse.json({
            success: true,
            message: 'Agency Brain automated jobs executed successfully.',
            results
        });

    } catch (error: any) {

        // Try to log the failure
        try {
            await supabase.from('system_errors').insert([{
                context: 'cron_agency_brain',
                error_message: error.message || 'Unknown Cron error',
                metadata: { timestamp: new Date().toISOString() }
            }]);

            await supabase.from('cron_runs').insert([{
                status: 'failed',
                notifications_created: 0,
                escalations_triggered: 0,
                error_message: error.message || 'Unknown Cron error'
            }]);
        } catch (e) {
            // Error logging failed silently
        }

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
