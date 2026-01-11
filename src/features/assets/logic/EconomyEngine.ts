import { FinancialReport, BreakdownItem } from '../types/economyTypes';

export const calculateQuarterlyFinances = (
    userState: any,
    marketState: any,
    statsState: any
): FinancialReport => {

    // 1. Calculate Income
    const salaryQuarterly = 45000; // Fixed for now
    let dividendIncome = 0;

    // Calculate Dividends & Portfolio Value
    let portfolioValue = 0;
    if (marketState && marketState.holdings) {
        marketState.holdings.forEach((h: any) => {
            // Use averageCost as fallback if current price isn't available in this context
            // ideally marketState should have current prices or we'd pass a price map
            const val = h.quantity * h.averageCost;
            portfolioValue += val;

            if (h.type === 'stock') {
                // Simple 0.5% quarterly dividend for stocks
                dividendIncome += val * 0.005;
            }
        });
    }

    // Business Profit (Placeholder)
    const businessProfit = 0;

    const totalIncome = salaryQuarterly + dividendIncome + businessProfit;

    // 2. Calculate Expenses
    const housingCost = 20000;
    const lifestyleCost = 10000;
    const tax = totalIncome * 0.20; // 20% Tax

    let partnerQuarterlyCost = 0;
    if (userState.partner && userState.partner.finances) {
        // Assume monthlyCost is stored, convert to Quarterly (x3)
        partnerQuarterlyCost = (userState.partner.finances.monthlyCost || 0) * 3;
    }

    const totalExpenses = housingCost + lifestyleCost + partnerQuarterlyCost + tax;

    // 3. Prepare Assets Breakdown
    const cash = statsState?.money || 0;
    const properties = statsState?.propertiesValue || 0;
    const vehicles = statsState?.vehiclesValue || 0;
    const valuables = statsState?.belongingsValue || 0;

    const assetsBreakdown: BreakdownItem[] = [
        { id: 'cash', label: 'Cash (Liquid)', amount: cash, type: 'asset' as const },
        { id: 'investments', label: 'Investments', amount: portfolioValue, type: 'asset' as const },
        { id: 'properties', label: 'Properties', amount: properties, type: 'asset' as const },
        { id: 'vehicles', label: 'Vehicles', amount: vehicles, type: 'asset' as const },
        { id: 'valuables', label: 'Valuables', amount: valuables, type: 'asset' as const }
    ].filter(item => item.amount > 0);

    // 4. Generate Report
    return {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        // We can add portfolioValue here if needed by UI directly, currently it's in breakdown
        incomeBreakdown: [
            { id: 'salary', label: 'Job Salary', amount: salaryQuarterly, type: 'income' },
            ...(dividendIncome > 0 ? [{ id: 'dividends', label: 'Dividends', amount: dividendIncome, type: 'income' as const }] : []),
            ...(businessProfit > 0 ? [{ id: 'business', label: 'Business Profit', amount: businessProfit, type: 'income' as const }] : [])
        ],
        expenseBreakdown: [
            { id: 'tax', label: 'Tax (20%)', amount: tax, type: 'expense' },
            { id: 'housing', label: 'Housing & Rent', amount: housingCost, type: 'expense' },
            { id: 'lifestyle', label: 'Personal/Lifestyle', amount: lifestyleCost, type: 'expense' },
            ...(partnerQuarterlyCost > 0 ? [{
                id: 'partner',
                label: 'Partner Upkeep',
                amount: partnerQuarterlyCost,
                type: 'expense' as const
            }] : [])
        ],
        assetsBreakdown
    };
};
