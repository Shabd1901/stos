import { HostingContract } from './api/types';
import { toZonedTime } from 'date-fns-tz';

export function getHostingRecurringForecast(contracts: HostingContract[]): number {
    // Calculates yearly recurring forecast assuming all active contracts pay their total yearly equivalent.
    // E.g., if duration is 1 month and cost is 1000, yearly equivalent is 12000.
    return contracts
        .filter(c => c.auto_renew && c.managed_by === 'us')
        .reduce((sum, contract) => {
            const cost = Number(contract.cost);
            const months = Number(contract.duration_months);
            if (months === 0) return sum;

            // Normalize to yearly recurring
            const yearlyValue = (cost / months) * 12;
            return sum + yearlyValue;
        }, 0);
}

export function getHostingRenewalsThisMonth(contracts: HostingContract[]): number {
    const nowIST = toZonedTime(new Date(), 'Asia/Kolkata');
    const currentMonth = nowIST.getMonth();
    const currentYear = nowIST.getFullYear();

    return contracts.filter((c) => {
        if (!c.start_date || !c.duration_months) return false;

        const startDate = new Date(c.start_date);
        const renewalDate = new Date(startDate.setMonth(startDate.getMonth() + Number(c.duration_months)));

        const renewIST = toZonedTime(renewalDate, 'Asia/Kolkata');
        return renewIST.getMonth() === currentMonth && renewIST.getFullYear() === currentYear;
    }).length;
}
