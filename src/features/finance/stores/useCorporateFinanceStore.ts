import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { useEquityStore } from './useEquityStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

/**
 * CORPORATE FINANCE STORE
 * Manages Debt, Credit Score, Leverage, and Subsidiaries
 * Implements the Subsidiary System with Probability Growth Logic
 */

// 1. Setup MMKV Storage
export const storage = new MMKV({ id: 'subsidiary-storage' });

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

// 2. Define Interfaces
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
    marketing: number;
    rnd: number;
    production: number;
    workforce: number;
    // Constraint: Sum <= 10
}

export interface Subsidiary {
    id: string;
    name: string;
    sector: string;
    valuation: number;
    acquiredAt: number;
    strategy: SubsidiaryStrategy;
    lastChangePercent: number; // For UI display (e.g. +12.5%)
    history: number[];
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
    acquireCompany: (company: any, price: number) => void;
    sellSubsidiary: (id: string) => void;
    updateSubsidiaryStrategy: (id: string, newStrategy: SubsidiaryStrategy) => void;
    evaluateSubsidiaries: () => void;

    // Capital Injection
    injectCapital: (amount: number) => { success: boolean; msg: string };

    reset: () => void;

    // Negotiated Sale
    attemptToSellCompany: (id: string, askingPrice: number) => { success: boolean; msg?: string; price?: number };
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

            // --- CREDIT SCORE & LOAN LOGIC (PRESERVED) ---

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

            getInterestRate: () => {
                const { creditScore } = get();
                if (creditScore >= 800) return 0.03; // 3%
                if (creditScore >= 700) return 0.05; // 5%
                if (creditScore >= 600) return 0.08; // 8%
                if (creditScore >= 500) return 0.12; // 12%
                return 0.15; // 15%
            },

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

                const newLoan: Loan = {
                    id: `LOAN_${Date.now()}`,
                    principal: amount,
                    interestRate: baseRate,
                    monthlyPayment: monthlyPayment,
                    remaining: amount,
                    type: loanType,
                    originationDate: Date.now()
                };

                addCashFn(amount);

                set({
                    loans: [...loans, newLoan],
                    totalDebt: newDebt
                });

                refreshCreditScore(valuation, 0);

                if (leverage > RISK_THRESHOLD) {
                    useEquityStore.setState({ marketMultiplier: 0.9 });
                }

                return {
                    success: true,
                    message: `Loan approved! $${amount.toLocaleString()} at ${baseRate}% APR`
                };
            },

            repayLoan: (id, amount, spendCashFn) => {
                const { loans, totalDebt } = get();
                const loan = loans.find(l => l.id === id);
                if (!loan) {
                    return { success: false, message: 'Loan not found' };
                }

                const actualPayment = Math.min(amount, loan.remaining);
                spendCashFn(actualPayment);

                const updatedRemaining = loan.remaining - actualPayment;

                if (updatedRemaining <= 0) {
                    set({
                        loans: loans.filter(l => l.id !== id),
                        totalDebt: totalDebt - loan.remaining
                    });
                    return {
                        success: true,
                        message: `Loan fully repaid! Credit score boosted.`
                    };
                } else {
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

            payMonthlyInterests: (spendCashFn) => {
                const { loans } = get();
                const totalPayment = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

                if (totalPayment > 0) {
                    spendCashFn(totalPayment);
                }
                return { totalPayment, success: true };
            },

            getBorrowingCapacity: (valuation) => {
                const { totalDebt } = get();
                const maxDebt = valuation * MAX_LEVERAGE;
                return Math.max(0, maxDebt - totalDebt);
            },

            getCurrentLeverage: (valuation) => {
                const { totalDebt } = get();
                if (valuation === 0) return 0;
                return (totalDebt / valuation) * 100;
            },

            getMonthlyInterestTotal: () => {
                const { loans } = get();
                return loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
            },

            // --- SUBSIDIARY SYSTEM (NEW LOGIC) ---

            acquireCompany: (company, price) => {
                const { companyCapital, setCompanyCapital } = useStatsStore.getState();

                if (companyCapital < price) {
                    console.warn('[FinanceStore] Insufficient capital to acquire company');
                    return;
                }

                setCompanyCapital(companyCapital - price);

                const newSubsidiary: Subsidiary = {
                    id: company.id || company.symbol || `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: company.name || 'Unknown Subsidiary',
                    sector: company.sector || company.category || 'Conglomerate',
                    valuation: price,
                    acquiredAt: price,
                    strategy: { marketing: 2, rnd: 3, production: 3, workforce: 2 }, // Default Strategy
                    lastChangePercent: 0,
                    history: []
                };

                set((state) => ({
                    subsidiaries: [...state.subsidiaries, newSubsidiary]
                }));
            },

            sellSubsidiary: (id) => {
                const { subsidiaries } = get();
                const subsidiary = subsidiaries.find(s => s.id === id);

                if (!subsidiary) {
                    console.warn('[FinanceStore] Subsidiary not found for sale');
                    return;
                }

                const { companyCapital, setCompanyCapital } = useStatsStore.getState();
                setCompanyCapital(companyCapital + subsidiary.valuation);

                set((state) => ({
                    subsidiaries: state.subsidiaries.filter(s => s.id !== id)
                }));
            },

            updateSubsidiaryStrategy: (id, newStrategy) => {
                const sum = newStrategy.marketing + newStrategy.rnd + newStrategy.production + newStrategy.workforce;
                if (sum > 10) {
                    console.warn('[FinanceStore] Strategy sum exceeds 10');
                    return;
                }

                set((state) => ({
                    subsidiaries: state.subsidiaries.map(s =>
                        s.id === id ? { ...s, strategy: newStrategy } : s
                    )
                }));
            },

            evaluateSubsidiaries: () => {
                const { subsidiaries } = get();

                const updatedSubsidiaries = subsidiaries.map(sub => {
                    const { strategy, sector } = sub;

                    // 1. Determine Strategy Quality
                    // Good Criteria
                    const isTechGood = sector === 'Technology' && strategy.rnd >= 4;
                    const isIndGood = sector === 'Industrial' && strategy.production >= 4;
                    const isRetailGood = sector === 'Retail' && strategy.marketing >= 4;
                    const isFinGood = sector === 'Finance' && strategy.marketing >= 3 && strategy.rnd >= 3;

                    const meetsGoodCriteria = isTechGood || isIndGood || isRetailGood || isFinGood;

                    // Bad Override
                    const isWorkforceBad = strategy.workforce < 2;

                    // Final Decision
                    const isGoodStrategy = meetsGoodCriteria && !isWorkforceBad;

                    // 2. Probability Logic
                    const roll = Math.random() * 100;
                    let changePercent = 0;

                    if (isGoodStrategy) {
                        if (roll < 5) {
                            // 0-5 (5%): Super Growth (+15% to +20%)
                            changePercent = (Math.random() * 0.05) + 0.15;
                        } else if (roll < 65) {
                            // 5-65 (60%): Steady Growth (+1% to +6%)
                            changePercent = (Math.random() * 0.05) + 0.01;
                        } else {
                            // 65-100 (35%): Minor Drop (0% to -4%)
                            // Assuming 0 to -4 means change is between -0.04 and 0.
                            changePercent = -(Math.random() * 0.04);
                        }
                    } else {
                        // BAD STRATEGY (or not good)
                        if (roll < 8) {
                            // 0-8 (8%): Crash (-15% to -20%)
                            changePercent = -((Math.random() * 0.05) + 0.15);
                        } else if (roll < 60) {
                            // 8-60 (52%): Decline (0% to -6%)
                            changePercent = -(Math.random() * 0.06);
                        } else {
                            // 60-100 (40%): Stagnation (0% to -2%)
                            changePercent = -(Math.random() * 0.02);
                        }
                    }

                    // 3. Update Subsidiary
                    const newValuation = sub.valuation * (1 + changePercent);
                    const newHistory = [changePercent * 100, ...sub.history].slice(0, 4);

                    return {
                        ...sub,
                        valuation: newValuation,
                        lastChangePercent: changePercent * 100, // Stored as percentage number (e.g. 12.5 for 12.5%)
                        history: newHistory
                    };
                });

                set({ subsidiaries: updatedSubsidiaries });
            },

            attemptToSellCompany: (id, askingPrice) => {
                const state = get();
                const company = state.subsidiaries.find((s) => s.id === id);

                if (!company) return { success: false, msg: "Company not found." };

                // 1. Calculate Markup
                const markup = (askingPrice - company.valuation) / company.valuation;

                // 2. Probability: Base 80%, -2% for every 1% markup
                let successChance = 0.80 - (markup * 2.0);

                // Clamp Chance (0 to 1)
                if (successChance < 0) successChance = 0;
                if (successChance > 1) successChance = 1;

                console.log(`Sell Attempt: Ask $${askingPrice}, Chance ${(successChance * 100).toFixed(1)}%`);

                // 3. Roll Dice
                if (Math.random() <= successChance) {
                    // SUCCESS
                    const { companyCapital, setCompanyCapital } = useStatsStore.getState();
                    setCompanyCapital(companyCapital + askingPrice);

                    set((state) => ({
                        subsidiaries: state.subsidiaries.filter((s) => s.id !== id),
                    }));
                    return { success: true, price: askingPrice, msg: "Sold!" };
                } else {
                    // FAIL: -5% Valuation Penalty
                    const newVal = Math.floor(company.valuation * 0.95);
                    set((state) => ({
                        subsidiaries: state.subsidiaries.map((s) =>
                            s.id === id ? { ...s, valuation: newVal } : s
                        )
                    }));
                    return { success: false, msg: "Buyers rejected. Valuation dropped 5%." };
                }
            },

            // --- CAPITAL INJECTION ---

            injectCapital: (amount) => {
                const { money, subtractMoney, companyCapital, setCompanyCapital } = useStatsStore.getState();

                if (money < amount) {
                    return { success: false, msg: 'Insufficient personal funds.' };
                }

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
            name: 'subsidiary-storage',
            storage: createJSONStorage(() => zustandStorage)
        }
    )
);
