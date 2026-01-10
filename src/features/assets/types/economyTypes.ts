export interface IncomeSource {
    id: string;
    label: string;
    amount: number;
    type: 'SALARY' | 'DIVIDEND' | 'REAL_ESTATE' | 'OTHER';
}

export interface ExpenseCategory {
    id: string;
    label: string;
    amount: number;
    type: 'LIFESTYLE' | 'RELATIONSHIP' | 'HOUSING' | 'EDUCATION' | 'LOAN' | 'TAX';
}

export interface FinancialReport {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;

    // Market/Investment Impact
    portfolioValue: number;
    portfolioReturn: number; // Profit/Loss this month

    incomeBreakdown: IncomeSource[];
    expenseBreakdown: ExpenseCategory[];
}
