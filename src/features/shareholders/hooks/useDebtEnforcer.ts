import { useShareholderStore } from '../stores/useShareholderStore';

/**
 * Debt Enforcer Hook
 * Automatically triggers equity seizure when shark loan deadlines pass.
 * This creates unavoidable consequences for unpaid predatory loans.
 */

export interface DebtDefaultEvent {
    triggered: boolean;
    lenderName: string;
    seizedShares: number;
    loanAmount: number;
    playerSharesRemaining: number;
    isGameOver: boolean; // True if player lost majority control
}

export const useDebtEnforcer = () => {
    const { sharkLoans, seizeCollateral, playerShares } = useShareholderStore();

    /**
     * Check all active shark loans for deadline violations.
     * Automatically seize collateral for overdue loans.
     * 
     * @param currentTurn - The current game turn/month
     * @param stockPrice - Current stock price for seizure calculation
     * @returns Array of default events (empty if no defaults)
     */
    const checkDeadlines = (currentTurn: number, stockPrice: number): DebtDefaultEvent[] => {
        const defaultEvents: DebtDefaultEvent[] = [];

        // Find all active loans past their deadline
        const overdueLoans = sharkLoans.filter(
            (loan) => loan.isActive && loan.deadlineTurn <= currentTurn
        );

        if (overdueLoans.length === 0) {
            return defaultEvents; // No defaults
        }

        console.log(`[Debt Enforcer] Found ${overdueLoans.length} overdue loan(s). Triggering seizures...`);

        // Process each overdue loan
        overdueLoans.forEach((loan) => {
            const seizureResult = seizeCollateral(loan.id, stockPrice);

            if (seizureResult) {
                // Check if player lost majority control (< 50%)
                const isGameOver = seizureResult.playerSharesRemaining < 50.0;

                const event: DebtDefaultEvent = {
                    triggered: true,
                    lenderName: seizureResult.lenderName,
                    seizedShares: seizureResult.seizedShares,
                    loanAmount: seizureResult.loanAmount,
                    playerSharesRemaining: seizureResult.playerSharesRemaining,
                    isGameOver,
                };

                defaultEvents.push(event);

                console.log(`[Debt Enforcer] DEFAULT TRIGGERED:`, {
                    lender: event.lenderName,
                    seized: `${event.seizedShares.toFixed(1)}%`,
                    remaining: `${event.playerSharesRemaining.toFixed(1)}%`,
                    gameOver: event.isGameOver,
                });
            }
        });

        return defaultEvents;
    };

    /**
     * Get summary of upcoming deadlines for UI warnings.
     * 
     * @param currentTurn - The current game turn/month
     * @returns Array of loans due within 3 turns
     */
    const getUpcomingDeadlines = (currentTurn: number) => {
        return sharkLoans
            .filter((loan) => loan.isActive)
            .filter((loan) => {
                const turnsRemaining = loan.deadlineTurn - currentTurn;
                return turnsRemaining > 0 && turnsRemaining <= 3;
            })
            .map((loan) => ({
                loanId: loan.id,
                lenderId: loan.lenderId,
                amount: loan.amount,
                deadlineTurn: loan.deadlineTurn,
                turnsRemaining: loan.deadlineTurn - currentTurn,
            }));
    };

    /**
     * Check if player has any active shark loans.
     */
    const hasActiveLoans = () => {
        return sharkLoans.some((loan) => loan.isActive);
    };

    /**
     * Get total debt from all active shark loans.
     */
    const getTotalSharkDebt = () => {
        return sharkLoans
            .filter((loan) => loan.isActive)
            .reduce((total, loan) => total + loan.amount, 0);
    };

    return {
        checkDeadlines,
        getUpcomingDeadlines,
        hasActiveLoans,
        getTotalSharkDebt,
    };
};
