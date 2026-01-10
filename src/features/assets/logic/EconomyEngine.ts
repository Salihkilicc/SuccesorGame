
import { useUserStore } from '../../../core/store/useUserStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

export const calculateMonthlyFinances = (userState: any, marketState: any, statsState: any) => {
    // 1. Income
    // Fallback to statsState.monthlyIncome because userState.job might not exist or be typed
    const salary = statsState?.monthlyIncome || userState.job?.salary || 0;

    // Simplification: Business Profit calculated via simple iteration if available, or placeholder
    // If statsState has subsidiaryStates, use it
    let businessProfit = 0;
    if (statsState?.subsidiaryStates) {
        Object.values(statsState.subsidiaryStates).forEach((sub: any) => {
            if (!sub.isLossMaking && sub.currentProfit > 0) {
                businessProfit += sub.currentProfit;
            }
        });
    }

    // 2. Portfolio (Stocks/Crypto)
    let portfolioValue = 0;
    let dividendIncome = 0;

    if (marketState?.holdings) {
        marketState.holdings.forEach((holding: any) => {
            const val = holding.estimatedValue || 0;
            portfolioValue += val;

            // 0.5% Yield for Stocks
            if (holding.type === 'stock') {
                dividendIncome += val * 0.005;
            }
        });
    }

    // 3. Expenses
    let partnerCost = 0;
    if (userState.partner) {
        // Handle both simple and deep profile structures
        if (userState.partner.finances?.monthlyCost) {
            partnerCost = userState.partner.finances.monthlyCost;
        } else if (typeof userState.partner.monthlyCost === 'number') {
            partnerCost = userState.partner.monthlyCost;
        }
    }

    // Hardcoded logic from prompt + robustness
    const housingCost = 1500;
    const tax = Math.floor(salary * 0.2);

    // Lifestyle Cost (Placeholder from previous logic, or simplified)
    // Prompt didn't ask for lifestyle, but it's good to keep if we have data. 
    // We'll stick to strictly what was requested + criticals.

    const totalIncome = salary + businessProfit + dividendIncome;
    // Note: 'tax' is usually deducted from Gross, but here treating as expense category
    const totalExpenses = partnerCost + housingCost + tax;

    return {
        netIncome: totalIncome - totalExpenses,
        totalIncome,
        totalExpenses,
        portfolioValue,
        breakdown: {
            income: [
                { label: 'Job Salary', value: salary },
                ...(dividendIncome > 0 ? [{ label: 'Dividends', value: dividendIncome }] : []),
                ...(businessProfit > 0 ? [{ label: 'Business Profit', value: businessProfit }] : [])
            ],
            expenses: [
                { label: 'Tax (20%)', value: tax },
                { label: 'Housing', value: housingCost },
                ...(partnerCost > 0 ? [{ label: 'Partner Upkeep', value: partnerCost }] : [])
            ]
        }
    };
};
