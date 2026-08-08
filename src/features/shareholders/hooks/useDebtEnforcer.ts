import { useShareholderStore } from '../stores/useShareholderStore';

/**
 * ============================================================================
 *  SHARK LOAN ENFORCEMENT
 * ============================================================================
 *
 *  Marcus lends without a credit check and takes shares, not money, when the
 *  date passes. That was the design. In practice none of it happened, for
 *  three separate reasons that each hid the next:
 *
 *  1) THE HOOK WAS CALLED BY NOTHING. `checkDeadlines` existed, was correct in
 *     outline, and no file imported it. The loan paid out and was never
 *     collected - free money with a menacing description.
 *
 *  2) IT READ FIELDS THAT DO NOT EXIST. It was written against an older
 *     percentage-based API (`playerShares`, `seizedShares`,
 *     `playerSharesRemaining`) while the store moved to absolute share COUNTS
 *     (`playerShareCount`, `seizedShareCount`, `playerShareCountRemaining`).
 *     Four of the project's baseline type errors lived here.
 *
 *  3) THE GAME-OVER TEST COMPARED A COUNT TO A PERCENTAGE. `remaining < 50.0`
 *     was meant as "below 50% ownership", but remaining is a share count in
 *     the millions, so it was false always. Losing control could not trigger
 *     even if the seizure ran. It is a ratio against totalShares now.
 *
 *  And a fourth, in the modal rather than here: the deadline was set from
 *  `currentMonth`, which wraps back to 1 every year. A loan due in twelve
 *  months got a deadline of 17 on a counter that never exceeds 12, so the due
 *  date could not arrive. Deadlines are absolute months now - see
 *  `absoluteMonth` below, which is monotonic because `age` ticks over exactly
 *  when the month wraps.
 * ============================================================================
 */

export interface DebtDefaultEvent {
    triggered: boolean;
    lenderName: string;
    seizedShareCount: number;
    loanAmount: number;
    playerShareCountRemaining: number;
    /** Ownership after the seizure, as a percentage - for the report screen. */
    ownershipAfter: number;
    /** True if the seizure cost the player majority control. */
    isGameOver: boolean;
}

/**
 * A month counter that never resets. `currentMonth` is 1-12 and wraps; `age`
 * increments on exactly that wrap, so this is strictly increasing.
 */
export const absoluteMonth = (age: number, currentMonth: number): number =>
    age * 12 + currentMonth;

/**
 * Seize collateral on every overdue loan.
 *
 * A plain function, not a hook, because the caller is the quarter tick inside
 * the game store - React hooks cannot be called from there. That mismatch is
 * part of why this was never wired up in the first place.
 */
export const enforceSharkDeadlines = (
    currentAbsoluteMonth: number,
    stockPrice: number,
): DebtDefaultEvent[] => {
    const { sharkLoans, seizeCollateral, totalShares } = useShareholderStore.getState();

    const overdue = (sharkLoans || []).filter(
        (loan) => loan.isActive && loan.deadlineTurn <= currentAbsoluteMonth,
    );
    if (overdue.length === 0) return [];

    const events: DebtDefaultEvent[] = [];

    for (const loan of overdue) {
        const seizure = seizeCollateral(loan.id, stockPrice);
        if (!seizure) continue;

        const ownershipAfter = totalShares > 0
            ? (seizure.playerShareCountRemaining / totalShares) * 100
            : 0;

        events.push({
            triggered: true,
            lenderName: seizure.lenderName,
            seizedShareCount: seizure.seizedShareCount,
            loanAmount: seizure.loanAmount,
            playerShareCountRemaining: seizure.playerShareCountRemaining,
            ownershipAfter,
            isGameOver: ownershipAfter < 50,
        });
    }

    return events;
};

/** Loans coming due, for the warning shown before the date arrives. */
export const upcomingSharkDeadlines = (currentAbsoluteMonth: number, withinMonths = 6) => {
    const { sharkLoans } = useShareholderStore.getState();
    return (sharkLoans || [])
        .filter((loan) => loan.isActive)
        .map((loan) => ({
            loanId: loan.id,
            lenderId: loan.lenderId,
            amount: loan.amount,
            deadlineTurn: loan.deadlineTurn,
            monthsRemaining: loan.deadlineTurn - currentAbsoluteMonth,
        }))
        .filter((l) => l.monthsRemaining > 0 && l.monthsRemaining <= withinMonths);
};

export const totalSharkDebt = (): number => {
    const { sharkLoans } = useShareholderStore.getState();
    return (sharkLoans || [])
        .filter((loan) => loan.isActive)
        .reduce((total, loan) => total + loan.amount, 0);
};

/** Thin reactive wrapper, for screens that need to re-render on a change. */
export const useDebtEnforcer = () => {
    const sharkLoans = useShareholderStore((s) => s.sharkLoans);
    return {
        sharkLoans,
        enforceSharkDeadlines,
        upcomingSharkDeadlines,
        totalSharkDebt,
        hasActiveLoans: () => (sharkLoans || []).some((loan) => loan.isActive),
    };
};
