export interface BreakdownItem {
    id: string;
    label: string;
    amount: number; // Quarterly amount
    type: 'income' | 'expense' | 'asset';
}

export interface FinancialReport {
    totalIncome: number;
    totalExpenses: number;
    netFlow: number; // Income - Expenses
    incomeBreakdown: BreakdownItem[];
    expenseBreakdown: BreakdownItem[];
    assetsBreakdown: BreakdownItem[];
    educationMultiplier?: number; // Cumulative education salary multiplier (e.g., 1.62 = 62% boost)
    educationBonus?: string; // Formatted bonus string (e.g., "+62%")
}
