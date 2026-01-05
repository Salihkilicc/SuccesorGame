import { useCallback } from 'react';
import { useStatsStore } from '../../store/useStatsStore';
import { useGameStore } from '../../store/useGameStore';

export const FACTORY_COST = 50_000;
export const FACTORY_CAPACITY = 1000;
export const AUTO_HIRE_PER_FACTORY = 300;

export const COMPANY_EVENTS = [
    { id: 'pizza', name: 'Pizza Party', cost: 20, morale: 2 },
    { id: 'movie', name: 'Movie Night', cost: 30, morale: 3 },
    { id: 'bowling', name: 'Bowling Tournament', cost: 50, morale: 5 },
    { id: 'picnic', name: 'Picnic', cost: 60, morale: 6 },
    { id: 'karting', name: 'Karting', cost: 100, morale: 10 },
    { id: 'paintball', name: 'Paintball', cost: 120, morale: 12 },
    { id: 'escape', name: 'Escape Room', cost: 150, morale: 14 },
    { id: 'dinner', name: 'Fancy Dinner', cost: 200, morale: 18 },
    { id: 'spa', name: 'Spa Day', cost: 300, morale: 20 },
    { id: 'seminar', name: 'Leadership Seminar', cost: 500, morale: 15 }, // Less morale per dollar but professional
    { id: 'kayaking', name: 'Kayaking', cost: 600, morale: 22 },
    { id: 'skydiving', name: 'Skydiving', cost: 1000, morale: 25 },
    { id: 'yacht', name: 'Yacht Party', cost: 2500, morale: 35 }, // Cap morale boost reasonable
    { id: 'galactic', name: 'Galactic Tour (Virtual)', cost: 5000, morale: 50 },
];

export const useCompanyManagement = () => {
    const {
        factoryCount,
        employeeCount,
        employeeMorale,
        salaryTier,
        companyExpensesMonthly,
        companyCapital,
        companyRevenueMonthly,
        update,
        setField,
        setSalaryTier
    } = useStatsStore();

    const {
        employeeMorale: gameMorale,
        salaryPolicy,
        eventsHostedThisQuarter,
        lastQuarterProfit,
        bonusDistributedThisQuarter,
        organizeEvent: gameOrganizeEvent,
        distributeBonus: gameDistributeBonus,
        setSalaryPolicy: gameSetSalaryPolicy
    } = useGameStore();

    const updateFactories = useCallback((delta: number) => {
        const nextCount = Math.max(0, factoryCount + delta);
        if (nextCount === factoryCount) return;

        // Auto-hire/fire
        const workforceDelta = delta * AUTO_HIRE_PER_FACTORY;
        let nextEmployees = employeeCount + workforceDelta;

        // Ensure employees don't drop below minimum for *remaining* factories in a complex edge case
        // though auto-calc mostly handles it. 
        // Logic: 1 Factory needs 300 min. 
        const minRequired = nextCount * 300;
        if (nextEmployees < minRequired) nextEmployees = minRequired;

        // Expense update handling
        // Each factory adds $50k monthly expense
        const expenseChange = delta * 50_000;
        const nextExpenses = Math.max(0, companyExpensesMonthly + expenseChange);

        // Instability check could go here (tracking changes per month)
        // For now, simple implementation
        if (delta > 3 || delta < -3) {
            // Large shift penalty
            update({ employeeMorale: Math.max(0, employeeMorale - 5) });
        }

        update({
            factoryCount: nextCount,
            employeeCount: nextEmployees,
            productionCapacity: nextCount * FACTORY_CAPACITY,
            companyExpensesMonthly: nextExpenses
        });

    }, [factoryCount, employeeCount, companyExpensesMonthly, employeeMorale, update]);

    const updateEmployees = useCallback((delta: number) => {
        const nextCount = employeeCount + delta;
        const minRequired = factoryCount * 300;

        if (nextCount < minRequired) {
            // Reject or clamp? 
            // Requirement says "Never drop below", so we clamp or simple return false to indicate fail
            // But for buttons check, we usually disable them.
            // Here we just ensure logic safety.
            return;
        }

        update({ employeeCount: nextCount });
    }, [employeeCount, factoryCount, update]);

    const organizeEvent = useCallback((cost: number, boost: number) => {
        gameOrganizeEvent(cost, boost);
        return true;
    }, [gameOrganizeEvent]);

    const distributeBonus = useCallback((percentage: number) => {
        // Mapping percentage to simply calling declaration?
        // Store logic is fixed to 5% atm.
        gameDistributeBonus();
    }, [gameDistributeBonus]);

    const changeSalaryTier = useCallback((tier: 'low' | 'average' | 'above_average') => {
        // Map old tiers to new policy
        let policy: 'low' | 'avg' | 'high' = 'avg';
        if (tier === 'low') policy = 'low';
        if (tier === 'above_average') policy = 'high';

        gameSetSalaryPolicy(policy);
    }, [gameSetSalaryPolicy]);

    return {
        factoryCount,
        employeeCount,
        employeeMorale: gameMorale,
        salaryTier: salaryPolicy === 'high' ? 'above_average' : (salaryPolicy === 'low' ? 'low' : 'average'),
        eventsHostedThisQuarter,
        updateFactories,
        updateEmployees,
        organizeEvent,
        distributeBonus,
        changeSalaryTier,
        companyCapital,
        lastQuarterProfit,
        bonusDistributedThisQuarter
    };
};
