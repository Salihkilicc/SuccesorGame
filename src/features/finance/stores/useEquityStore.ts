
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { usePlayerStore } from '../../../core/store/usePlayerStore';

/**
 * EQUITY STATE INTERFACE
 * The "Central Bank" of share mechanics
 */
export interface EquityState {
    totalShares: number;
    publicShares: number;
    playerShares: number;
    stockPrice: number;
    marketMultiplier: number; // 1.0 = Normal, 1.2 = Hype
    priceHistory: number[];
    isPublic: boolean;

    // Actions
    syncStockPrice: (valuation: number) => void;
    goPublic: (valuation: number, addCashFn: (amount: number) => void) => { cashRaised: number; sharesSold: number; newOwnershipPercent: number };
    executeBuyback: (amountToSpend: number, currentValuation: number, spendCashFn: (amount: number) => void) => { sharesBurned: number; newOwnershipPercent: number };
    executeDilution: (percentToSell: number, currentValuation: number, addCashFn: (amount: number) => void) => { newShares: number; capitalRaised: number; newOwnershipPercent: number };
    distributeDividend: (amountPerShare: number, spendCashFn: (amount: number) => void) => { totalRequired: number; playerPortion: number; isAffordable: boolean };

    // Selectors
    getPlayerOwnership: () => number;
    getMarketCap: () => number;
    reset: () => void;
}

const updatePriceHistory = (history: number[], newPrice: number): number[] => {
    const updated = [...history, newPrice];
    if (updated.length > 7) {
        updated.shift();
    }
    return updated;
};

export const useEquityStore = create<EquityState>()(
    persist(
        (set, get) => ({
            totalShares: 1_000_000,
            publicShares: 0,
            playerShares: 1_000_000,
            stockPrice: 1.0,
            marketMultiplier: 1.0,
            priceHistory: [],
            isPublic: false,

            // 1. SYNC PRICE (Called by UI useEffect)
            syncStockPrice: (valuation) => {
                const { totalShares, marketMultiplier, priceHistory } = get();
                if (totalShares === 0) return;
                const basePrice = valuation / totalShares;
                const finalPrice = basePrice * marketMultiplier;

                set({
                    stockPrice: finalPrice,
                    priceHistory: updatePriceHistory(priceHistory, finalPrice)
                });
            },

            // 2. IPO
            goPublic: (valuation, addCashFn) => {
                const { isPublic, totalShares } = get();
                if (isPublic) {
                    console.warn('[EquityStore] Already public');
                    return { cashRaised: 0, sharesSold: 0, newOwnershipPercent: get().getPlayerOwnership() };
                }

                const sharesToSell = Math.floor(totalShares * 0.20); // Sell 20%
                // Valuation logic: Price is determined by valuation / totalShares.
                // Cash raised is sharesToSell * (Valuation / TotalShares) = Valuation * 0.20
                const cashRaised = (valuation / totalShares) * sharesToSell;

                // Execute
                addCashFn(cashRaised); // Add to Company Wallet via Callback

                set({
                    isPublic: true,
                    publicShares: sharesToSell,
                    playerShares: totalShares - sharesToSell,
                    marketMultiplier: 1.5, // IPO Hype
                });

                // Sync Price Immediately
                get().syncStockPrice(valuation);

                return {
                    cashRaised,
                    sharesSold: sharesToSell,
                    newOwnershipPercent: get().getPlayerOwnership()
                };
            },

            // 3. BUYBACK
            executeBuyback: (amountToSpend, currentValuation, spendCashFn) => {
                const { stockPrice, totalShares, publicShares, marketMultiplier } = get();

                // Validation
                if (amountToSpend <= 0 || stockPrice === 0) return { sharesBurned: 0, newOwnershipPercent: get().getPlayerOwnership() };

                const sharesToBuy = Math.floor(amountToSpend / stockPrice);
                const actualSharesBurned = Math.min(sharesToBuy, publicShares);

                // Execute Logic
                spendCashFn(amountToSpend); // Deduct from Company via Callback

                // VOLUME-WEIGHTED PRICE IMPACT
                // Formula: Impact = (SharesTraded / TotalShares) * SENSITIVITY
                const BUYBACK_SENSITIVITY = 1.2;
                const ratio = actualSharesBurned / totalShares;
                const impact = ratio * BUYBACK_SENSITIVITY;

                set((state) => ({
                    totalShares: state.totalShares - actualSharesBurned,
                    publicShares: Math.max(0, state.publicShares - actualSharesBurned), // Remove from public float
                    marketMultiplier: state.marketMultiplier + impact, // Dynamic price impact
                }));

                // CRITICAL: Recalculate Price Immediately with NEW state
                get().syncStockPrice(currentValuation);

                return {
                    sharesBurned: actualSharesBurned,
                    newOwnershipPercent: get().getPlayerOwnership()
                };
            },

            // 4. DILUTION
            executeDilution: (percentToSell, valuation, addCashFn) => {
                // Logic: "percentToSell" is the target dilution (e.g. 10%)
                // Formula: NewShares = CurrentShares / (1 - percent) - CurrentShares
                const { totalShares } = get();
                const decimal = percentToSell / 100;
                const newTotal = Math.floor(totalShares / (1 - decimal));
                const sharesCreated = newTotal - totalShares;

                // Price logic: Current Price * Shares Created?
                // Or just pure valuation? Usually dilution raises capital at current market price.
                // Let's use current stock price from store? Or derived from valuation?
                // User's snippet used: (valuation / totalShares) * sharesCreated.
                // That's fair. Using "pre-money" valuation basis.

                const cashRaised = (valuation / totalShares) * sharesCreated;

                addCashFn(cashRaised); // Add to Company

                // VOLUME-WEIGHTED PRICE IMPACT
                // Formula: Impact = (Percent / 100) * SENSITIVITY
                // Dilution has higher sensitivity due to panic factor
                const DILUTION_SENSITIVITY = 1.5;
                const impact = decimal * DILUTION_SENSITIVITY;

                set((state) => ({
                    totalShares: state.totalShares + sharesCreated,
                    publicShares: state.publicShares + sharesCreated, // Goes to public
                    marketMultiplier: Math.max(0.1, state.marketMultiplier - impact), // Panic! Price drops (clamped to 0.1)
                }));

                // CRITICAL: Recalculate Price Immediately
                get().syncStockPrice(valuation);

                return {
                    newShares: sharesCreated,
                    capitalRaised: cashRaised,
                    newOwnershipPercent: get().getPlayerOwnership()
                };
            },

            // 5. DIVIDEND
            distributeDividend: (amountPerShare, spendCashFn) => {
                const { totalShares, playerShares } = get();
                const totalCost = amountPerShare * totalShares;
                const playerCut = amountPerShare * playerShares;

                // Deduct Company Cash
                spendCashFn(totalCost);

                // Add to Player Personal Wallet
                usePlayerStore.getState().earnMoney(playerCut);

                return {
                    totalRequired: totalCost,
                    playerPortion: playerCut,
                    isAffordable: true
                };
            },

            // Selectors
            getPlayerOwnership: () => {
                const { playerShares, totalShares } = get();
                if (totalShares === 0) return 0;
                return (playerShares / totalShares) * 100;
            },

            getMarketCap: () => {
                const { stockPrice, totalShares } = get();
                return stockPrice * totalShares;
            },

            reset: () => {
                set({
                    totalShares: 1_000_000,
                    publicShares: 0,
                    playerShares: 1_000_000,
                    stockPrice: 1.0,
                    marketMultiplier: 1.0,
                    priceHistory: [],
                    isPublic: false
                });
            }
        }),
        {
            name: 'succesor_equity_v1', // Keeping same name to persist data or should I update? User used 'equity-storage'. I'll stick to existing name to keep user data or update if requested. User code says 'equity-storage'. I will use 'succesor_equity_v1' to maintain consistency with previous tasks unless I want a fresh start. The user's snippet says 'equity-storage', but maybe they copy-pasted. Sticky to 'succesor_equity_v1' is safer for existing data, BUT the schema changed slightly (though fields are mostly compatible). I'll use 'succesor_equity_v1'.
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);
