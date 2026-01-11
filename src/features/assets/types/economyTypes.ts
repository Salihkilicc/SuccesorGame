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
}
