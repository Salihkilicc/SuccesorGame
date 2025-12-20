import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { HoldingItem, BondItem, CryptoAsset, StockItem } from '../components/Market/marketTypes';

type MarketState = {
    holdings: HoldingItem[];
};

type MarketActions = {
    buyAsset: (item: HoldingItem) => void;
    sellAsset: (id: string, amount?: number) => void;
    reset: () => void;
    // Selectors/Helpers could be here or just derived in components
};

export const initialMarketState: MarketState = {
    holdings: [],
};

const capSlowdown = (marketCap: number) => {
    if (marketCap >= 400) return 0.35;
    if (marketCap >= 250) return 0.45;
    if (marketCap >= 150) return 0.6;
    if (marketCap >= 80) return 0.75;
    if (marketCap >= 30) return 0.9;
    return 1;
};

const adjustedChange = (baseChange: number, marketCap: number) =>
    baseChange * capSlowdown(marketCap);

export const useMarketStore = create<MarketState & MarketActions>()(
    persist(
        (set, get) => ({
            ...initialMarketState,
            buyAsset: (item) =>
                set((state) => ({
                    holdings: [...state.holdings, item],
                })),
            sellAsset: (id, amount) =>
                set((state) => {
                    // If amount is not provided or equals total, remove item.
                    // Otherwise reduce amount. Implementation depends on if we aggregate same assets or keep distinct lots.
                    // For now, based on MarketScreen logic, it seems we append new items.
                    // A simple filter for removal if we want to "sell all" by ID:
                    return {
                        holdings: state.holdings.filter((h) => h.id !== id),
                    };
                }),
            reset: () => set(() => ({ ...initialMarketState })),
        }),
        {
            name: 'succesor_market_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                holdings: state.holdings,
            }),
        }
    )
);
