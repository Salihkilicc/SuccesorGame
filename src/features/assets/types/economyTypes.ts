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
    /**
     * What the luxury collection costs this quarter, on its own line.
     *
     * Carried out of the report as well as folded into `totalExpenses`,
     * because the quarter tick has to be able to UNDO it: a player who cannot
     * cover the bill does not pay it, and the collection deteriorates instead.
     * A figure that only exists inside a total cannot be backed out.
     */
    luxuryUpkeep: number;
    educationMultiplier?: number; // Cumulative education salary multiplier (e.g., 1.62 = 62% boost)
    educationBonus?: string; // Formatted bonus string (e.g., "+62%")
}
