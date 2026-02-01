import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';

/**
 * EQUITY STATE INTERFACE
 * The "Central Bank" of share mechanics
 */
export interface EquityState {
    totalShares: number; // Total shares in existence
    playerShares: number; // Shares owned by player
    publicShares: number; // Shares owned by public/investors
    stockPrice: number; // Current trading price per share
    marketMultiplier: number; // Hype factor (1.0 = neutral, >1 = bullish, <1 = bearish)
    priceHistory: number[]; // Last 7 days of prices for charts
    isPublic: boolean; // Whether company has gone public via IPO
}

/**
 * DILUTION RESULT
 * Returned when executing a dilution
 */
export interface DilutionResult {
    newShares: number;
    capitalRaised: number;
    newOwnershipPercent: number;
}

/**
 * BUYBACK RESULT
 * Returned when executing a buyback
 */
export interface BuybackResult {
    sharesBurned: number;
    newOwnershipPercent: number;
}

/**
 * DIVIDEND RESULT
 * Returned when calculating dividend distribution
 */
export interface DividendResult {
    totalRequired: number;
    playerPortion: number;
    isAffordable: boolean;
}

/**
 * IPO RESULT
 * Returned when going public
 */
export interface IPOResult {
    cashRaised: number;
    sharesSold: number;
    newOwnershipPercent: number;
}

/**
 * EQUITY STORE TYPE
 * Combines state with actions
 */
type EquityStore = EquityState & {
    // Core Actions
    syncStockPrice: (companyValuation: number) => void;
    executeDilution: (percentToSell: number, currentValuation: number) => DilutionResult;
    executeBuyback: (amountToSpend: number) => BuybackResult;
    distributeDividend: (amountPerShare: number) => DividendResult;
    goPublic: (companyValuation: number) => IPOResult;

    // Helper Selectors
    getPlayerOwnership: () => number;
    getMarketCap: () => number;

    // Utility
    reset: () => void;
};

/**
 * INITIAL STATE
 * Player starts with 100% ownership (1M shares)
 */
export const initialEquityState: EquityState = {
    totalShares: 1_000_000,
    playerShares: 1_000_000,
    publicShares: 0,
    stockPrice: 0,
    marketMultiplier: 1.0,
    priceHistory: [],
    isPublic: false,
};

/**
 * HELPER: Clamp Market Multiplier
 * Ensures multiplier stays within realistic bounds
 */
const clampMultiplier = (value: number): number => {
    return Math.max(0.1, Math.min(5.0, value));
};

/**
 * HELPER: Update Price History
 * Maintains FIFO array of last 7 prices
 */
const updatePriceHistory = (history: number[], newPrice: number): number[] => {
    const updated = [...history, newPrice];
    if (updated.length > 7) {
        updated.shift(); // Remove oldest
    }
    return updated;
};

/**
 * EQUITY STORE
 * The Central Bank of the game's share mechanics
 */
export const useEquityStore = create<EquityStore>()(
    persist(
        (set, get) => ({
            ...initialEquityState,

            /**
             * SYNC STOCK PRICE
             * Recalculates stock price based on company valuation
             * Formula: (Valuation / Total Shares) * Market Multiplier
             */
            syncStockPrice: (companyValuation: number) => {
                const state = get();

                // Prevent division by zero
                if (state.totalShares === 0) {
                    console.warn('[EquityStore] Cannot sync price: totalShares is 0');
                    return;
                }

                // Calculate base price
                const basePrice = companyValuation / state.totalShares;

                // Apply market multiplier
                const finalPrice = basePrice * state.marketMultiplier;

                // Update state with new price and history
                set({
                    stockPrice: finalPrice,
                    priceHistory: updatePriceHistory(state.priceHistory, finalPrice),
                });

                console.log(
                    `[EquityStore] Stock Price Synced: $${finalPrice.toFixed(2)} ` +
                    `(Base: $${basePrice.toFixed(2)}, Multiplier: ${state.marketMultiplier.toFixed(2)}x)`
                );
            },

            /**
             * EXECUTE DILUTION
             * Issues new shares to raise capital
             * Formula: NewShares = (TotalShares * Percent) / (1 - Percent)
             * 
             * Example: 10% dilution with 1M shares
             * NewShares = (1,000,000 * 0.10) / (1 - 0.10) = 111,111 shares
             * New Total = 1,111,111 shares
             * Player ownership drops from 100% to 90%
             */
            executeDilution: (percentToSell: number, currentValuation: number) => {
                const state = get();

                // Validation
                if (percentToSell <= 0 || percentToSell >= 100) {
                    console.error('[EquityStore] Invalid dilution percentage:', percentToSell);
                    return {
                        newShares: 0,
                        capitalRaised: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                    };
                }

                // Calculate new shares to mint
                const percent = percentToSell / 100;
                const newShares = Math.floor((state.totalShares * percent) / (1 - percent));

                // Calculate capital raised (new shares * current price)
                const capitalRaised = newShares * state.stockPrice;

                // Update state
                const newTotalShares = state.totalShares + newShares;
                const newPublicShares = state.publicShares + newShares;
                const newMultiplier = clampMultiplier(0.95); // 5% penalty for dilution shock

                set({
                    totalShares: newTotalShares,
                    publicShares: newPublicShares,
                    marketMultiplier: newMultiplier,
                });

                // Sync price with new multiplier
                get().syncStockPrice(currentValuation);

                // Calculate new ownership
                const newOwnershipPercent = get().getPlayerOwnership();

                console.log(
                    `[EquityStore] Dilution Executed: ${percentToSell}% | ` +
                    `New Shares: ${newShares.toLocaleString()} | ` +
                    `Capital Raised: $${capitalRaised.toLocaleString()} | ` +
                    `Player Ownership: ${newOwnershipPercent.toFixed(2)}%`
                );

                return {
                    newShares,
                    capitalRaised,
                    newOwnershipPercent,
                };
            },

            /**
             * EXECUTE BUYBACK
             * Burns public shares to increase player ownership
             * Formula: SharesToBurn = AmountToSpend / StockPrice
             */
            executeBuyback: (amountToSpend: number) => {
                const state = get();

                // Validation
                if (amountToSpend <= 0) {
                    console.error('[EquityStore] Invalid buyback amount:', amountToSpend);
                    return {
                        sharesBurned: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                    };
                }

                if (state.stockPrice === 0) {
                    console.error('[EquityStore] Cannot execute buyback: stock price is 0');
                    return {
                        sharesBurned: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                    };
                }

                // Calculate shares to burn
                const sharesBurned = Math.floor(amountToSpend / state.stockPrice);

                // Ensure we don't burn more than public shares
                const actualSharesBurned = Math.min(sharesBurned, state.publicShares);

                // Update state
                const newTotalShares = Math.max(0, state.totalShares - actualSharesBurned);
                const newPublicShares = Math.max(0, state.publicShares - actualSharesBurned);
                const newMultiplier = clampMultiplier(1.05); // 5% boost for buyback hype

                set({
                    totalShares: newTotalShares,
                    publicShares: newPublicShares,
                    marketMultiplier: newMultiplier,
                });

                // Calculate new ownership
                const newOwnershipPercent = get().getPlayerOwnership();

                console.log(
                    `[EquityStore] Buyback Executed: $${amountToSpend.toLocaleString()} | ` +
                    `Shares Burned: ${actualSharesBurned.toLocaleString()} | ` +
                    `Player Ownership: ${newOwnershipPercent.toFixed(2)}%`
                );

                return {
                    sharesBurned: actualSharesBurned,
                    newOwnershipPercent,
                };
            },

            /**
             * DISTRIBUTE DIVIDEND
             * Calculates dividend amounts (does NOT deduct from capital)
             * Caller is responsible for verifying affordability and deducting funds
             */
            distributeDividend: (amountPerShare: number) => {
                const state = get();

                // Validation
                if (amountPerShare <= 0) {
                    console.error('[EquityStore] Invalid dividend amount per share:', amountPerShare);
                    return {
                        totalRequired: 0,
                        playerPortion: 0,
                        isAffordable: false,
                    };
                }

                // Calculate totals
                const totalRequired = amountPerShare * state.totalShares;
                const playerPortion = amountPerShare * state.playerShares;

                console.log(
                    `[EquityStore] Dividend Calculated: $${amountPerShare.toFixed(2)}/share | ` +
                    `Total Required: $${totalRequired.toLocaleString()} | ` +
                    `Player Portion: $${playerPortion.toLocaleString()}`
                );

                return {
                    totalRequired,
                    playerPortion,
                    isAffordable: true, // Caller must verify against company capital
                };
            },

            /**
             * GO PUBLIC (IPO)
             * Launches Initial Public Offering
             * - Sells 20% of shares to public
             * - Raises capital based on valuation
             * - Applies 1.5x IPO hype multiplier
             */
            goPublic: (companyValuation: number) => {
                const state = get();

                // Check if already public
                if (state.isPublic) {
                    console.warn('[EquityStore] Company is already public');
                    return {
                        cashRaised: 0,
                        sharesSold: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                    };
                }

                // Validation
                if (companyValuation <= 0) {
                    console.error('[EquityStore] Invalid valuation for IPO:', companyValuation);
                    return {
                        cashRaised: 0,
                        sharesSold: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                    };
                }

                // Calculate IPO details (20% initial float)
                const ipoPercent = 0.20;
                const sharesSold = Math.floor(state.totalShares * ipoPercent);
                const cashRaised = companyValuation * ipoPercent;

                // Update state
                const newPlayerShares = state.totalShares - sharesSold;
                const newPublicShares = sharesSold;
                const ipoHypeMultiplier = clampMultiplier(1.5); // 50% IPO hype boost

                set({
                    isPublic: true,
                    playerShares: newPlayerShares,
                    publicShares: newPublicShares,
                    marketMultiplier: ipoHypeMultiplier,
                });

                // Sync price with IPO hype
                get().syncStockPrice(companyValuation);

                // Calculate new ownership
                const newOwnershipPercent = get().getPlayerOwnership();

                console.log(
                    `[EquityStore] IPO Executed! | ` +
                    `Shares Sold: ${sharesSold.toLocaleString()} (20%) | ` +
                    `Cash Raised: $${cashRaised.toLocaleString()} | ` +
                    `Player Ownership: ${newOwnershipPercent.toFixed(2)}% | ` +
                    `IPO Hype Multiplier: ${ipoHypeMultiplier}x`
                );

                return {
                    cashRaised,
                    sharesSold,
                    newOwnershipPercent,
                };
            },

            /**
             * GET PLAYER OWNERSHIP
             * Returns player ownership percentage (0-100)
             */
            getPlayerOwnership: () => {
                const state = get();

                if (state.totalShares === 0) {
                    return 0;
                }

                const ownership = (state.playerShares / state.totalShares) * 100;
                return Math.max(0, Math.min(100, ownership)); // Clamp to 0-100
            },

            /**
             * GET MARKET CAP
             * Returns total market capitalization
             */
            getMarketCap: () => {
                const state = get();
                return state.stockPrice * state.totalShares;
            },

            /**
             * RESET
             * Restores initial state
             */
            reset: () => {
                set(initialEquityState);
                console.log('[EquityStore] Reset to initial state');
            },
        }),
        {
            name: 'succesor_equity_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                totalShares: state.totalShares,
                playerShares: state.playerShares,
                publicShares: state.publicShares,
                stockPrice: state.stockPrice,
                marketMultiplier: state.marketMultiplier,
                priceHistory: state.priceHistory,
                isPublic: state.isPublic,
            }),
        }
    )
);
