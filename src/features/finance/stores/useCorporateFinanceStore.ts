import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { useEquityStore } from './useEquityStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

/**
 * CORPORATE FINANCE STORE
 * Premium Private Banking System
 * Manages Debt, Credit Score, and Leverage
 */

// MMKV Storage Implementation
const storage = new MMKV();

const zustandStorage: StateStorage = {
    setItem: (name, value) => {
        return storage.set(name, value);
    },
    getItem: (name) => {
        const value = storage.getString(name);
        return value ?? null;
    },
    removeItem: (name) => {
        return storage.delete(name);
    },
};

export interface Loan {
    id: string;
    principal: number;
    interestRate: number;
    monthlyPayment: number;
    remaining: number;
    type: 'Bank' | 'Bonds' | 'Shark';
    originationDate: number;
}

export interface SubsidiaryStrategy {
    marketing: number; // 0-10
    rnd: number;       // 0-10
    production: number;// 0-10
    workforce: number; // 0-10
    // Constraint: Sum of these must be exactly 10 (or max 10).
}

export interface Subsidiary {
    id: string;
    name: string;
    sector: string;
    acquiredAtValuation: number;
    currentValuation: number;
    strategy: SubsidiaryStrategy;
    history: number[]; // Last 4 quarters % change
}

export interface CorporateFinanceState {
    loans: Loan[];
    creditScore: number;
    totalDebt: number;
    subsidiaries: Subsidiary[];

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

    // Subsidiary Actions
    acquireCompany: (stock: any, price: number) => void;
    sellSubsidiary: (id: string) => void;
    updateSubsidiaryStrategy: (id: string, newStrategy: SubsidiaryStrategy) => void;
    evaluateSubsidiaries: (marketEvents: string[]) => void;

    // Capital Injection
    // Capital Injection
    injectCapital: (amount: number) => { success: boolean; msg: string };

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
            subsidiaries: [],

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

            // 9. ACQUIRE COMPANY
            acquireCompany: (stock, price) => {
                // Access Company Capital from StatsStore
                const { companyCapital, setCompanyCapital } = useStatsStore.getState();

                // Validate Capital
                if (companyCapital < price) {
                    console.warn('[FinanceStore] Insufficient capital to acquire company');
                    return;
                }

                // Deduct Capital
                setCompanyCapital(companyCapital - price);

                // Create Subsidiary Object
                const newSubsidiary: Subsidiary = {
                    id: stock.id || stock.symbol || `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: stock.name || 'Unknown Subsidiary',
                    sector: stock.sector || 'Conglomerate',
                    acquiredAtValuation: price,
                    currentValuation: price,
                    strategy: { marketing: 2, rnd: 2, production: 3, workforce: 3 },
                    history: []
                };

                // Add to State
                set((state) => ({
                    subsidiaries: [...state.subsidiaries, newSubsidiary]
                }));
            },

            // 10. SELL SUBSIDIARY
            sellSubsidiary: (id) => {
                const { subsidiaries } = get();
                const subsidiary = subsidiaries.find(s => s.id === id);

                if (!subsidiary) {
                    console.warn('[FinanceStore] Subsidiary not found for sale');
                    return;
                }

                // Add Current Valuation to Company Capital
                const { companyCapital, setCompanyCapital } = useStatsStore.getState();
                setCompanyCapital(companyCapital + subsidiary.currentValuation);

                // Remove from State
                set((state) => ({
                    subsidiaries: state.subsidiaries.filter(s => s.id !== id)
                }));
            },

            // 11. UPDATE STRATEGY
            updateSubsidiaryStrategy: (id, newStrategy) => {
                // Validate Strategy Sum (Must be <= 10)
                const sum = newStrategy.marketing + newStrategy.rnd + newStrategy.production + newStrategy.workforce;

                if (sum > 10) {
                    // In strict mode we might reject, but user req says "Constraint: Sum... must be exactly 10 (or max 10)"
                    // We allow updating if it respects max 10.
                    console.warn('[FinanceStore] Strategy sum exceeds 10');
                    return;
                }

                set((state) => ({
                    subsidiaries: state.subsidiaries.map(s =>
                        s.id === id ? { ...s, strategy: newStrategy } : s
                    )
                }));
            },

            // 12. EVALUATE SUBSIDIARIES (Simulation Engine)
            evaluateSubsidiaries: (marketEvents) => {
                const { subsidiaries } = get();
                // We need to access MarketStore to update public stock prices based on our private performance
                // Using require to avoid circular dependency issues if any, ensuring loose coupling
                const marketStore = require('../../../core/store/useMarketStore').useMarketStore.getState();

                const updatedSubsidiaries = subsidiaries.map(sub => {
                    const { strategy, sector } = sub;

                    // 1. Base Change: -2% to +2%
                    let changePercent = (Math.random() * 0.04) - 0.02;

                    // 2. Strategy vs Events Logic

                    // Tech Boom
                    if (marketEvents.some(e => e.includes('Tech')) && sector === 'Technology' && strategy.rnd > 4) {
                        changePercent += 0.10; // +10%
                    }

                    // Recession Defense (Aggressive Marketing)
                    if (marketEvents.some(e => e.includes('Recession')) && strategy.marketing > 5) {
                        changePercent += 0.05; // +5%
                    }

                    // Labor Issues (Low Workforce Score)
                    if (strategy.workforce < 2) {
                        changePercent -= 0.05; // -5% Penalty
                    }

                    // Inefficiency (High Production, Low Marketing - Supply > Demand)
                    if (strategy.production > 5 && strategy.marketing < 3) {
                        changePercent -= 0.05; // -5% Penalty
                    }

                    // 3. Apply Result
                    const newValuation = sub.currentValuation * (1 + changePercent);

                    // History Update (Keep last 4)
                    const newHistory = [changePercent, ...sub.history].slice(0, 4);

                    // 4. Sync Public Market Price
                    // We calculate the implied price change and push it to MarketStore
                    // Implied Stock Price = OldStockPrice * (1 + changePercent)
                    const currentMarketPrice = marketStore.marketPrices[sub.id];
                    if (currentMarketPrice) {
                        const newStockPrice = currentMarketPrice * (1 + changePercent);
                        marketStore.updateStockPrice(sub.id, newStockPrice);
                    }

                    return {
                        ...sub,
                        currentValuation: newValuation,
                        history: newHistory
                    };
                });

                set({ subsidiaries: updatedSubsidiaries });
            },

            // 13. CAPITAL INJECTION
            injectCapital: (amount) => {
                const { money, subtractMoney, companyCapital, setCompanyCapital } = useStatsStore.getState();

                if (money < amount) {
                    return { success: false, msg: 'Insufficient personal funds.' };
                }

                // Execute Transfer
                subtractMoney(amount);
                setCompanyCapital(companyCapital + amount);

                return {
                    success: true,
                    msg: `Injected $${(amount / 1_000_000).toFixed(1)}M into company.`
                };
            },

            reset: () => {
                set({
                    loans: [],
                    creditScore: 750,
                    totalDebt: 0,
                    subsidiaries: []
                });
            }
        }),
        {
            name: 'succesor_corporate_finance_v1',
            storage: createJSONStorage(() => zustandStorage)
        }
    )
);
