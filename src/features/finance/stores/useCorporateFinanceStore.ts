import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { useEquityStore } from './useEquityStore';

/**
 * CORPORATE FINANCE STORE
 * Premium Private Banking System
 * Manages Debt, Credit Score, and Leverage
 */

export interface Loan {
    id: string;
    principal: number;
    interestRate: number;
    monthlyPayment: number;
    remaining: number;
    type: 'Bank' | 'Bonds' | 'Shark';
    originationDate: number;
}

export interface CorporateFinanceState {
    loans: Loan[];
    creditScore: number;
    totalDebt: number;

    // Actions
    refreshCreditScore: (valuation: number, cash: number) => void;
    getInterestRate: () => number;
    takeLoan: (
        amount: number,
        valuation: number,
        loanType: 'Bank' | 'Bonds' | 'Shark',
        baseRate: number,
        addCashFn: (amount: number) => void
    ) => { success: boolean; message: string };
    repayLoan: (
        id: string,
        amount: number,
        spendCashFn: (amount: number) => void
    ) => { success: boolean; message: string };
    payMonthlyInterests: (spendCashFn: (amount: number) => void) => {
        totalPayment: number;
        success: boolean;
    };
    getBorrowingCapacity: (valuation: number) => number;
    getCurrentLeverage: (valuation: number) => number;
    getMonthlyInterestTotal: () => number;

    reset: () => void;
}

const MAX_LEVERAGE = 0.8; // 80% of Valuation
const RISK_THRESHOLD = 0.5; // 50% triggers market penalty

export const useCorporateFinanceStore = create<CorporateFinanceState>()(
    persist(
        (set, get) => ({
            loans: [],
            creditScore: 750,
            totalDebt: 0,

            // 1. CREDIT SCORE ALGORITHM
            refreshCreditScore: (valuation, cash) => {
                const { totalDebt } = get();

                // Base Score: 600
                let score = 600;

                // Valuation Bonus: +5 per $1M
                score += (valuation / 1_000_000) * 5;

                // Debt-to-Cash Penalty: -50 per ratio point
                if (cash > 0) {
                    const debtToCash = totalDebt / cash;
                    score -= debtToCash * 50;
                }

                // Clamp between 300-850
                score = Math.max(300, Math.min(850, score));

                set({ creditScore: Math.round(score) });
            },

            // 2. GET INTEREST RATE BASED ON SCORE
            getInterestRate: () => {
                const { creditScore } = get();

                if (creditScore >= 800) return 0.03; // 3%
                if (creditScore >= 700) return 0.05; // 5%
                if (creditScore >= 600) return 0.08; // 8%
                if (creditScore >= 500) return 0.12; // 12%
                return 0.15; // 15%
            },

            // 3. TAKE LOAN
            takeLoan: (amount, valuation, loanType, baseRate, addCashFn) => {
                const { totalDebt, loans, refreshCreditScore } = get();

                // Check Max Leverage (80% of Valuation)
                const newDebt = totalDebt + amount;
                const leverage = newDebt / valuation;

                if (leverage > MAX_LEVERAGE) {
                    return {
                        success: false,
                        message: `Leverage limit exceeded! Max debt: $${Math.floor(valuation * MAX_LEVERAGE).toLocaleString()}`
                    };
                }

                // Calculate Monthly Payment (Simple Interest, 12-month term)
                const annualRate = baseRate / 100;
                const monthlyRate = annualRate / 12;
                const term = 12; // 12 months
                const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
                    (Math.pow(1 + monthlyRate, term) - 1);

                // Create Loan Object
                const newLoan: Loan = {
                    id: `LOAN_${Date.now()}`,
                    principal: amount,
                    interestRate: baseRate,
                    monthlyPayment: monthlyPayment,
                    remaining: amount,
                    type: loanType,
                    originationDate: Date.now()
                };

                // Add Cash
                addCashFn(amount);

                // Update State
                set({
                    loans: [...loans, newLoan],
                    totalDebt: newDebt
                });

                // Recalculate Credit Score
                refreshCreditScore(valuation, 0); // Cash will be updated externally

                // RISK PENALTY: If leverage > 50%, apply market multiplier penalty
                if (leverage > RISK_THRESHOLD) {
                    useEquityStore.setState({ marketMultiplier: 0.9 });
                }

                return {
                    success: true,
                    message: `Loan approved! $${amount.toLocaleString()} at ${baseRate}% APR`
                };
            },

            // 4. REPAY LOAN
            repayLoan: (id, amount, spendCashFn) => {
                const { loans, totalDebt } = get();

                const loan = loans.find(l => l.id === id);
                if (!loan) {
                    return { success: false, message: 'Loan not found' };
                }

                const actualPayment = Math.min(amount, loan.remaining);

                // Spend Cash
                spendCashFn(actualPayment);

                // Update Loan
                const updatedRemaining = loan.remaining - actualPayment;

                if (updatedRemaining <= 0) {
                    // Loan fully repaid - remove it
                    set({
                        loans: loans.filter(l => l.id !== id),
                        totalDebt: totalDebt - loan.remaining
                    });

                    return {
                        success: true,
                        message: `Loan fully repaid! Credit score boosted.`
                    };
                } else {
                    // Partial repayment
                    set({
                        loans: loans.map(l =>
                            l.id === id ? { ...l, remaining: updatedRemaining } : l
                        ),
                        totalDebt: totalDebt - actualPayment
                    });

                    return {
                        success: true,
                        message: `Paid $${actualPayment.toLocaleString()}. Remaining: $${updatedRemaining.toLocaleString()}`
                    };
                }
            },

            // 5. PAY MONTHLY INTERESTS
            payMonthlyInterests: (spendCashFn) => {
                const { loans } = get();

                const totalPayment = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

                if (totalPayment > 0) {
                    spendCashFn(totalPayment);
                }

                return {
                    totalPayment,
                    success: true
                };
            },

            // 6. GET BORROWING CAPACITY
            getBorrowingCapacity: (valuation) => {
                const { totalDebt } = get();
                const maxDebt = valuation * MAX_LEVERAGE;
                return Math.max(0, maxDebt - totalDebt);
            },

            // 7. GET CURRENT LEVERAGE
            getCurrentLeverage: (valuation) => {
                const { totalDebt } = get();
                if (valuation === 0) return 0;
                return (totalDebt / valuation) * 100;
            },

            // 8. GET MONTHLY INTEREST TOTAL
            getMonthlyInterestTotal: () => {
                const { loans } = get();
                return loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
            },

            reset: () => {
                set({
                    loans: [],
                    creditScore: 750,
                    totalDebt: 0
                });
            }
        }),
        {
            name: 'succesor_corporate_finance_v1',
            storage: createJSONStorage(() => zustandStorage)
        }
    )
);
