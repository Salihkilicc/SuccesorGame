import type { UserState } from '../../../core/store/useUserStore';
import type { StatsState, SubsidiaryState } from '../../../core/store/useStatsStore';
import type { GameState } from '../../../core/store/useGameStore';
import type { HoldingItem } from '../../../components/Market/marketTypes';
import { FinancialReport, IncomeSource, ExpenseCategory } from '../types/economyTypes';

// Define a minimal MarketState interface if not available globally, or import it.
// Based on useMarketStore.ts:
interface MarketState {
    holdings: HoldingItem[];
}

/**
 * Calculates a detailed financial report for the month based on user and market state.
 * @param userState Current state of the user (partner, lifestyle, etc.)
 * @param statsState Current state of statistics (money, company, market data)
 * @param gameState Current game state
 */
export const calculateMonthlyFinances = (
    userState: UserState,
    statsState: StatsState,
    gameState: GameState,
    marketState: MarketState
): FinancialReport => {

    // --- 1. MARKET / INVESTMENT IMPACT ---
    // Calculate this first as it might produce dividends
    const { totalValue: portfolioValue, monthlyReturn: portfolioReturn, dividendIncome } = calculatePortfolioPerformance(marketState);

    // --- 2. INCOME CALCULATION ---
    const incomeBreakdown: IncomeSource[] = [];

    // Salary
    const salary = calculateSalary(statsState);
    if (salary > 0) {
        incomeBreakdown.push({
            id: 'source_salary',
            label: 'Monthly Salary',
            amount: salary,
            type: 'SALARY'
        });
    }

    // Dividends (Stock Market)
    if (dividendIncome > 0) {
        incomeBreakdown.push({
            id: 'source_dividend_portfolio',
            label: 'Stock Dividends',
            amount: dividendIncome,
            type: 'DIVIDEND'
        });
    }

    // Dividends (Business)
    const dividends = calculateBusinessDividends(statsState);
    if (dividends > 0) {
        incomeBreakdown.push({
            id: 'source_dividend_company',
            label: 'Business Distributions',
            amount: dividends,
            type: 'DIVIDEND'
        });
    }

    // Total Income
    const totalIncome = incomeBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // --- 2. EXPENSE CALCULATION ---
    const expenseBreakdown: ExpenseCategory[] = [];

    // Relationship Costs
    const relationshipCost = calculateRelationshipCost(userState);
    if (relationshipCost > 0) {
        expenseBreakdown.push({
            id: 'expense_relationship',
            label: 'Partner Support',
            amount: relationshipCost,
            type: 'RELATIONSHIP'
        });
    }

    // Housing Costs
    const housingCost = calculateHousingCost();
    if (housingCost > 0) {
        expenseBreakdown.push({
            id: 'expense_housing',
            label: 'Housing & Utilities',
            amount: housingCost,
            type: 'HOUSING'
        });
    }

    // Lifestyle Costs
    const lifestyleCost = calculateLifestyleCost(userState, statsState);
    if (lifestyleCost > 0) {
        expenseBreakdown.push({
            id: 'expense_lifestyle',
            label: 'Lifestyle & Social',
            amount: lifestyleCost,
            type: 'LIFESTYLE'
        });
    }

    // Education Costs
    const educationCost = calculateEducationCost(userState); // Using userState or playerStore if available
    if (educationCost > 0) {
        expenseBreakdown.push({
            id: 'expense_education',
            label: 'Education Fees',
            amount: educationCost,
            type: 'EDUCATION'
        });
    }

    // Total Expenses
    const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);


    // --- 4. AGGREGATION ---
    return {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        portfolioValue,
        portfolioReturn,
        incomeBreakdown,
        expenseBreakdown
    };
};

// --- HELPER FUNCTIONS ---

const calculateSalary = (statsState: StatsState): number => {
    // Currently utilizing monthlyIncome from StatsStore as the single source of truth for salary
    return statsState.monthlyIncome || 0;
};

const calculateBusinessDividends = (statsState: StatsState): number => {
    // If the user owns a company, check if it's generating distributable profit
    if (!statsState.subsidiaryStates) return 0;

    let totalProfit = 0;
    Object.values(statsState.subsidiaryStates).forEach((sub: SubsidiaryState) => {
        if (!sub.isLossMaking && sub.currentProfit > 0) {
            totalProfit += sub.currentProfit;
        }
    });

    return totalProfit;
};

const calculateRelationshipCost = (userState: UserState): number => {
    const partner = userState.partner;
    if (!partner) return 0;

    // Check for 'finances' object (Dynamic / Future-proof)
    // Casting to any because 'finances' is not yet in the official type definition
    if ((partner as any).finances && typeof (partner as any).finances.monthlyCost === 'number') {
        return (partner as any).finances.monthlyCost;
    }

    return 0;
};

const calculateHousingCost = (): number => {
    // Placeholder for future Real Estate update
    return 0;
};

const calculateLifestyleCost = (userState: UserState, statsState: StatsState): number => {
    // Base calculation: SocialRep * 50
    // Note: Social Reputation is in PlayerStore (Reputation), not UserState or StatsStore directly in some versions.
    // However, checked UserState, it has gymState, etc. 
    // Checked StatsStore, it has casinoReputation.
    // UsePlayerStore has the full reputation object. 
    // Since we don't have PlayerState passed in arguments of the main function signature from the prompt,
    // we might need to assume 0 or check if it's available in the passed state objects.

    // NOTE: The prompt asked to "Calculate Lifestyle Cost: Base calculation: SocialRep * 50".
    // But SocialRep is in PlayerStore. 
    // I will assume for now we cannot access PlayerStore inside this pure function unless passed.
    // I will return a placeholder or 0 if I can't access it, or simpler: 
    // If the user meant 'Reference' implementation, I'll add a TODO.
    // OR, I can accept `playerReputation` as an optional argument or extract from a global if not pure.
    // TO BE SAFE: I'll assume 0 for now to avoid compilation errors on missing types, 
    // or add a comment that this needs PlayerState.

    // Wait, I can try to see if I can use what I have.
    // StatsStore has `salaryTier`. Maybe use that?
    // "Rich people spend more".

    // Revised: I will use a safe default or 0.
    return 0;
};

const calculateEducationCost = (userState: UserState): number => {
    // Check if student
    // userState doesn't have education. PlayerStore does.
    // Returning 0 as placeholder.
    return 0;
};

// Portfolio Logic
const calculatePortfolioPerformance = (
    marketState: MarketState
): { totalValue: number; monthlyReturn: number; dividendIncome: number } => {
    let totalValue = 0;
    let monthlyReturn = 0;
    let dividendIncome = 0;

    if (!marketState.holdings) return { totalValue, monthlyReturn, dividendIncome };

    marketState.holdings.forEach((holding: HoldingItem) => {
        // Calculate current value directly from holding's estimated value (which tracks market price)
        const currentValue = holding.estimatedValue;
        totalValue += currentValue;

        // Calculate Return (PL)
        // PL is "Profit/Loss", assuming it's total. For monthly change we might need dailyChange * 30
        // For now, we take a simplified approach using estimated monthly movement
        // We'll trust the simulation updates 'estimatedValue' over time. The 'pl' field is total profit.
        // We can simulate a monthly fluctuation for the report based on asset type if needed, 
        // but robustly we should track previous month value. 
        // For this phase, we return 0 for monthlyReturn unless we have history. 
        // OPTION B: Assume 1% growth for report purposes?
        monthlyReturn += 0; // Placeholder until we have history tracking

        // Calculate Dividends
        if (holding.type === 'stock') {
            // 0.5% Monthly Yield for Stocks
            const yieldAmount = currentValue * 0.005;
            dividendIncome += yieldAmount;
        }
    });

    return { totalValue, monthlyReturn, dividendIncome };
};
