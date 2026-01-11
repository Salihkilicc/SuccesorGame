import { FinancialReport } from '../types/economyTypes';

export const calculateQuarterlyFinances = (userState: any): FinancialReport => {

    // 1. Calculate Income
    const salaryQuarterly = 45000; // Fixed for now
    // TODO: Add Dividends logic here later

    const totalIncome = salaryQuarterly;

    // 2. Calculate Expenses
    const housingCost = 20000;
    const lifestyleCost = 10000;

    let partnerQuarterlyCost = 0;
    if (userState.partner && userState.partner.finances) {
        // Assume monthlyCost is stored, convert to Quarterly (x3)
        partnerQuarterlyCost = (userState.partner.finances.monthlyCost || 0) * 3;
    }

    const totalExpenses = housingCost + lifestyleCost + partnerQuarterlyCost;

    // 3. Generate Report
    return {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        incomeBreakdown: [
            { id: 'salary', label: 'Salary (Quarterly)', amount: salaryQuarterly, type: 'income' }
        ],
        expenseBreakdown: [
            { id: 'housing', label: 'Housing & Rent', amount: housingCost, type: 'expense' },
            { id: 'lifestyle', label: 'Personal/Lifestyle', amount: lifestyleCost, type: 'expense' },
            ...(partnerQuarterlyCost > 0 ? [{
                id: 'partner',
                label: 'Partner Upkeep (3 Months)',
                amount: partnerQuarterlyCost,
                type: 'expense' as const
            }] : [])
        ]
    };
};
