import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';
import { HoldingItem, MarketItem, StockItem, BondItem, FundItem, CryptoAsset } from '../../components/Market/marketTypes';

// Type Guards to safely access unique properties of union members
function isCrypto(item: MarketItem): item is CryptoAsset {
    return 'volatility' in item;
}
function isBond(item: MarketItem): item is BondItem {
    return 'issuerType' in item;
}
function isFund(item: MarketItem): item is FundItem {
    return 'expenseRatio' in item;
}
function isStock(item: MarketItem): item is StockItem {
    return 'acquisitionCost' in item;
}

interface PriceHistoryEntry {
    quarter: number;
    price: number;
}

interface MarketState {
    holdings: HoldingItem[];
    marketPrices: Record<string, number>; // Dynamic price map: { [itemId]: currentPrice }
    marketTrend: 'BULL' | 'BEAR' | 'FLAT';
    priceHistory: Record<string, PriceHistoryEntry[]>; // { [itemId]: [{quarter, price}] }
    currentQuarter: number;
    // Actions
    buyAsset: (symbol: string, price: number, quantity: number, type: 'stock' | 'crypto' | 'bond' | 'fund') => void;
    sellAsset: (symbol: string, quantity: number, currentPrice: number) => void;
    reset: () => void;
    liquidatePortfolio: () => number;
    acquireCompany: (id: string) => boolean;
    updatePrices: () => void; // Quarter/Day End Update
    initializePrices: () => void;
    simulateQuarter: () => void; // NEW: Sophisticated quarterly simulation
}

export const initialMarketState = {
    holdings: [],
    marketPrices: {},
    marketTrend: 'FLAT' as const,
    priceHistory: {},
    currentQuarter: 0,
};

export const useMarketStore = create<MarketState>()(
    persist(
        (set, get) => ({
            holdings: [],
            marketPrices: {},
            marketTrend: 'FLAT' as const,
            priceHistory: {},
            currentQuarter: 0,

            initializePrices: () => {
                const { marketPrices } = get();
                if (Object.keys(marketPrices).length === 0) {
                    const initialPrices: Record<string, number> = {};
                    INITIAL_MARKET_ITEMS.forEach(item => {
                        // Some items (Bonds) might not have 'price', use faceValue if check fails?
                        // But defined interfaces: Stock/Fund/Crypto have price. Bond has faceValue.
                        // We need to handle this.
                        let p = 0;
                        if ('price' in item) {
                            p = item.price;
                        } else if ('faceValue' in item) {
                            p = item.faceValue;
                        }

                        if (p > 0) initialPrices[item.id] = p;
                    });
                    set({ marketPrices: initialPrices });
                }
            },

            updatePrices: () => {
                const { marketPrices } = get();
                const newPrices = { ...marketPrices };

                // Initialize if empty (Safety check)
                if (Object.keys(newPrices).length === 0) {
                    INITIAL_MARKET_ITEMS.forEach(item => {
                        let p = 0;
                        if ('price' in item) p = item.price;
                        else if ('faceValue' in item) p = item.faceValue;
                        if (p > 0) newPrices[item.id] = p;
                    });
                }

                INITIAL_MARKET_ITEMS.forEach(item => {
                    // Get current price or default base
                    let currentPrice = newPrices[item.id];
                    if (currentPrice === undefined) {
                        if ('price' in item) currentPrice = item.price;
                        else if ('faceValue' in item) currentPrice = item.faceValue;
                        else currentPrice = 100;
                    }

                    let changePercent = 0;

                    // Volatility Logic
                    if (isCrypto(item)) {
                        // High Volatility: +/- 20%
                        changePercent = (Math.random() * 0.4) - 0.2;
                    } else if (isBond(item)) {
                        // Bonds: Stable +/- 1%
                        changePercent = (Math.random() * 0.02) - 0.01;
                    } else if (isFund(item)) {
                        // Funds: Stable +/- 2%
                        changePercent = (Math.random() * 0.04) - 0.02;
                    } else {
                        // Stocks: Normal +/- 5%
                        changePercent = (Math.random() * 0.10) - 0.05;
                    }

                    // Apply change
                    let nextPrice = currentPrice * (1 + changePercent);
                    if (nextPrice < 0.01) nextPrice = 0.01;

                    newPrices[item.id] = nextPrice;
                });

                set({ marketPrices: newPrices });
                console.log('[MarketStore] Prices Updated');
            },

            buyAsset: (symbol, price, quantity, type) => {
                const { spendMoney } = require('./useStatsStore').useStatsStore.getState();
                const totalCost = quantity * price;

                // 1. Transaction (Money Check)
                const canAfford = spendMoney(totalCost);
                if (!canAfford) {
                    console.warn(`[MarketStore] Insufficient funds: Need $${totalCost}, but user is broke.`);
                    return;
                }

                // 2. Find the actual item ID from INITIAL_MARKET_ITEMS
                const marketItem = INITIAL_MARKET_ITEMS.find(item => {
                    if ('symbol' in item) {
                        return (item as any).symbol === symbol;
                    }
                    return false;
                });

                if (!marketItem) {
                    console.warn(`[MarketStore] Item with symbol ${symbol} not found in market data`);
                    return;
                }

                const itemId = marketItem.id;
                const { holdings } = get();
                const existingIndex = holdings.findIndex((h) => h.id === itemId);

                if (existingIndex !== -1) {
                    // Update existing holding (Weighted Average)
                    const current = holdings[existingIndex];
                    const totalCostBasis = (current.quantity * current.averageCost) + (quantity * price);
                    const newQuantity = current.quantity + quantity;
                    const newAverage = totalCostBasis / newQuantity;

                    const updatedHoldings = [...holdings];
                    updatedHoldings[existingIndex] = {
                        ...current,
                        quantity: newQuantity,
                        averageCost: newAverage,
                    };

                    set({ holdings: updatedHoldings });
                    console.log(`[MarketStore] Updated ${symbol}: ${newQuantity.toFixed(2)} units @ $${newAverage.toFixed(2)} avg.`);
                } else {
                    // Add new holding
                    const newItem: HoldingItem = {
                        id: itemId, // Use the actual item ID from market data
                        symbol,
                        quantity,
                        averageCost: price,
                        type,
                    };
                    set({ holdings: [...holdings, newItem] });
                    console.log(`[MarketStore] Bought New: ${quantity} ${symbol} @ $${price}`);
                }
            },

            sellAsset: (symbol, quantity, currentPrice) => {
                const { holdings } = get();
                const existingIndex = holdings.findIndex((h) => h.symbol === symbol);
                if (existingIndex === -1) return;

                const current = holdings[existingIndex];

                // 1. Validate Quantity
                if (current.quantity < quantity) {
                    console.warn(`[MarketStore] Attempted to sell ${quantity} ${symbol}, but only have ${current.quantity}`);
                    return;
                }

                // 2. Add Revenue
                const revenue = quantity * currentPrice;
                const { earnMoney } = require('./useStatsStore').useStatsStore.getState();
                earnMoney(revenue);

                // 3. Update Holdings
                const updatedHoldings = [...holdings];

                // Determine remaining quantity
                const remainingQty = current.quantity - quantity;

                if (remainingQty <= 0.0001) { // Float tolerance
                    // Sold everything - filter by id instead of symbol
                    set({ holdings: holdings.filter(h => h.id !== current.id) });
                    console.log(`[MarketStore] Sold ALL ${symbol}. Revenue: $${revenue.toFixed(2)}`);
                } else {
                    // Reduce quantity
                    updatedHoldings[existingIndex] = {
                        ...current,
                        quantity: remainingQty,
                    };
                    set({ holdings: updatedHoldings });
                    console.log(`[MarketStore] Sold ${quantity} ${symbol}. Remaining: ${remainingQty.toFixed(2)}`);
                }
            },

            reset: () => set({ holdings: [], marketPrices: {} }),

            liquidatePortfolio: () => {
                const state = get();
                const { marketPrices } = state;
                let totalValue = 0;

                // Use LIVE market prices instead of averageCost
                state.holdings.forEach(holding => {
                    const livePrice = marketPrices[holding.id] || holding.averageCost;
                    totalValue += holding.quantity * livePrice;
                });

                if (totalValue > 0) {
                    const { earnMoney } = require('./useStatsStore').useStatsStore.getState();
                    earnMoney(totalValue);
                    set({ holdings: [] });
                }
                return totalValue;
            },

            acquireCompany: (id) => {
                const item = INITIAL_MARKET_ITEMS.find((i) => i.id === id);
                if (!item) {
                    console.warn(`[MarketStore] Company ${id} not found.`);
                    return false;
                }

                // Only Stocks can be acquired as companies
                if (!isStock(item)) {
                    console.warn(`[MarketStore] Item ${id} is not acquirable company.`);
                    return false;
                }

                const statsStore = require('./useStatsStore').useStatsStore.getState();
                const canAfford = statsStore.spendMoney(item.acquisitionCost);

                if (!canAfford) {
                    return false;
                }

                // Add to User Store
                const userStore = require('./useUserStore').useUserStore.getState();
                userStore.addSubsidiary({
                    id: item.id,
                    name: item.name,
                    symbol: item.symbol,
                    category: item.category,
                    acquisitionBuff: item.acquisitionBuff,
                });

                // Remove existing shares
                const { holdings } = get();
                // Check if symbol exists (stocks have symbol)
                if (item.symbol) {
                    const holdingIndex = holdings.findIndex((h) => h.symbol === item.symbol);
                    if (holdingIndex !== -1) {
                        const h = holdings[holdingIndex];
                        const liquidationValue = h.quantity * item.price;
                        statsStore.earnMoney(liquidationValue);

                        const newHoldings = holdings.filter((h) => h.symbol !== item.symbol);
                        set({ holdings: newHoldings });
                        console.log(`[MarketStore] Liquidated ${h.quantity} shares of ${item.symbol} upon acquisition.`);
                    }
                }

                console.log(`[MarketStore] Acquired ${item.name} for $${item.acquisitionCost.toLocaleString()}`);
                return true;
            },

            simulateQuarter: () => {
                const state = get();
                let { marketTrend, marketPrices, priceHistory, currentQuarter } = state;

                // Step 1: Determine Trend (20% chance to switch each quarter)
                if (Math.random() < 0.20) {
                    const trends: Array<'BULL' | 'BEAR' | 'FLAT'> = ['BULL', 'BEAR', 'FLAT'];
                    const currentIndex = trends.indexOf(marketTrend);
                    // Pick a different trend
                    const otherTrends = trends.filter((_, i) => i !== currentIndex);
                    marketTrend = otherTrends[Math.floor(Math.random() * otherTrends.length)];
                    console.log(`[MarketStore] 📊 Market Trend Changed: ${marketTrend}`);
                }

                // Helper: Calculate volatility multiplier based on asset type and market cap
                const getVolatilityMultiplier = (item: MarketItem): number => {
                    // Crypto: Extreme volatility
                    if (isCrypto(item)) return 4.0;

                    // Bonds: Very stable
                    if (isBond(item)) return 0.1;

                    // Stocks and Funds: Based on market cap
                    const marketCap = (item as any).marketCap;
                    if (marketCap) {
                        if (marketCap > 200_000_000_000) return 0.5; // Mega Cap (>$200B) - Very stable
                        if (marketCap < 1_000_000_000) return 2.5; // Small Cap (<$1B) - Very volatile
                        if (marketCap < 10_000_000_000) return 2.0; // Small-Mid Cap
                        return 1.2; // Mid-Large Cap
                    }

                    // Default for funds without market cap
                    if (isFund(item)) return 0.8;

                    return 1.2; // Default
                };

                // Step 2: Initialize prices if empty
                const newPrices = { ...marketPrices };
                const newHistory = { ...priceHistory };

                if (Object.keys(newPrices).length === 0) {
                    INITIAL_MARKET_ITEMS.forEach(item => {
                        let p = 0;
                        if ('price' in item) p = item.price;
                        else if ('faceValue' in item) p = item.faceValue;
                        if (p > 0) newPrices[item.id] = p;
                    });
                }

                // Step 3 & 4: Loop through all items and update prices
                INITIAL_MARKET_ITEMS.forEach(item => {
                    // Get current price
                    let currentPrice = newPrices[item.id];
                    if (currentPrice === undefined) {
                        if ('price' in item) currentPrice = item.price;
                        else if ('faceValue' in item) currentPrice = item.faceValue;
                        else currentPrice = 100;
                    }

                    // Calculate base change based on market trend
                    let baseChange = 0;
                    if (marketTrend === 'BULL') baseChange = 0.05; // +5%
                    else if (marketTrend === 'BEAR') baseChange = -0.05; // -5%
                    else baseChange = 0; // FLAT: 0%

                    // Get volatility multiplier
                    const volatilityMultiplier = getVolatilityMultiplier(item);

                    // Apply volatility to base change
                    let trendAdjustedChange = baseChange * volatilityMultiplier;

                    // Add random noise (-2% to +2% base, scaled by volatility)
                    const randomNoise = (Math.random() * 0.04 - 0.02) * volatilityMultiplier;

                    // Total change percentage
                    const totalChangePercent = trendAdjustedChange + randomNoise;

                    // Calculate new price
                    let newPrice = currentPrice * (1 + totalChangePercent);

                    // Floor protection (prevent prices from going too low)
                    if (isCrypto(item) && newPrice < 0.0001) newPrice = 0.0001;
                    else if (newPrice < 0.01) newPrice = 0.01;

                    // Update price
                    newPrices[item.id] = newPrice;

                    // Update history (keep max 12 entries for charts)
                    if (!newHistory[item.id]) {
                        newHistory[item.id] = [];
                    }

                    newHistory[item.id].push({
                        quarter: currentQuarter + 1,
                        price: newPrice
                    });

                    // Trim history to last 12 entries
                    if (newHistory[item.id].length > 12) {
                        newHistory[item.id] = newHistory[item.id].slice(-12);
                    }
                });

                // Increment quarter counter
                const nextQuarter = currentQuarter + 1;

                // Update state
                set({
                    marketPrices: newPrices,
                    marketTrend,
                    priceHistory: newHistory,
                    currentQuarter: nextQuarter
                });

                console.log(`[MarketStore] 📈 Quarter ${nextQuarter} Simulated | Trend: ${marketTrend}`);
            },
        }),
        {
            name: 'succesor_market_v6',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                holdings: state.holdings,
                marketPrices: state.marketPrices,
                marketTrend: state.marketTrend,
                priceHistory: state.priceHistory,
                currentQuarter: state.currentQuarter
            }),
        }
    )
);
