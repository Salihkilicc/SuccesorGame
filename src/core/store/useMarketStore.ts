// @orphan-ok-symbol updatePrices - superseded by simulateQuarter(), which the engine calls each quarter
// @orphan-ok-symbol updateStockPrice - superseded by simulateQuarter()
import { create } from 'zustand';
import { shareValuationMultiplier } from '../market/competitors';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';
import { HoldingItem, MarketItem, StockItem, BondItem, FundItem, CryptoAsset } from '../../components/Market/marketTypes';
import { zustandStorage } from '../../storage/persist';

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

/**
 * Bir rakibin baslangic pazar payi. `productMarkets.ts` tek kaynak;
 * burada yalnizca okunur.
 */
/**
 * Baseline shares, built once and reused.
 *
 * This used to require('../market/productMarkets') and scan every market's
 * competitor list on EVERY call, and simulateQuarter calls it once per listed
 * item - 68 requires and 68 nested scans per quarter, for data that never
 * changes. Now it is a lookup table built on first use.
 */
let baselineShareCache: Record<string, number> | null = null;

const baselineShareFor = (stockId: string): number => {
    if (!baselineShareCache) {
        const { PRODUCT_MARKETS } = require('../market/productMarkets');
        const map: Record<string, number> = {};
        for (const m of PRODUCT_MARKETS) {
            for (const c of (m.competitors || [])) map[c.stockId] = c.share;
        }
        baselineShareCache = map;
    }
    return baselineShareCache[stockId] ?? 0;
};

interface MarketState {
    holdings: HoldingItem[];
    marketPrices: Record<string, number>; // Dynamic price map: { [itemId]: currentPrice }
    marketTrend: 'BULL' | 'BEAR' | 'FLAT';
    priceHistory: Record<string, PriceHistoryEntry[]>; // { [itemId]: [{quarter, price}] }
    currentQuarter: number;
    /**
     * Rakiplerin CANLI pazar paylari (stockId -> yuzde).
     * Bos ise `productMarkets.ts` icindeki baslangic paylari gecerlidir.
     * Bkz. core/market/competitors.ts
     */
    competitorShares: Record<string, number>;
    // Actions
    buyAsset: (symbol: string, price: number, quantity: number, type: 'stock' | 'crypto' | 'bond' | 'fund') => void;
    sellAsset: (symbol: string, quantity: number, currentPrice: number) => void;
    reset: () => void;
    liquidatePortfolio: () => number;
    acquireCompany: (id: string) => boolean;
    updatePrices: () => void; // Quarter/Day End Update
    initializePrices: () => void;
    simulateQuarter: () => void; // NEW: Sophisticated quarterly simulation
    updateStockPrice: (id: string, newPrice: number) => void;
}

export const initialMarketState = {
    holdings: [],
    competitorShares: {} as Record<string, number>,
    marketPrices: {},
    marketTrend: 'FLAT' as const,
    priceHistory: {},
    currentQuarter: 0,
};

export const useMarketStore = create<MarketState>()(
    persist(
        (set, get) => ({
            holdings: [],
            // Rakiplerin canli pazar paylari — bkz. core/market/competitors.ts
            competitorShares: {} as Record<string, number>,
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

            reset: () => set({ holdings: [], marketPrices: {}, competitorShares: {} }),

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

            /**
             * EMEKLIYE AYRILDI — cagirmayin.
             *
             * Bu yol KISISEL cuzdandan harciyordu (statsStore.spendMoney)
             * ve sonucu useUserStore.subsidiaries'e yaziyordu. Hicbir
             * ekrandan cagrilmiyordu ama duruyordu; birisi baglasa oyunun
             * butun devralma modelini atlayacakti.
             *
             * Tek kapi: useCorporateFinanceStore.executeAcquisition
             */
            acquireCompany: (id) => {
                console.warn(
                    `[MarketStore] acquireCompany is retired. Use ` +
                    `useCorporateFinanceStore.executeAcquisition instead. (id: ${id})`
                );
                return false;
            },

            simulateQuarter: () => {
                /** Temel degerin ceyreklik buyumesi. Yilda ~%4. */
                const ANCHOR_GROWTH = 0.01;
                /** Fiyatin her ceyrek cipaya dogru cekilme orani. */
                const REVERSION_STRENGTH = 0.15;

                const state = get();
                let { marketTrend, marketPrices, priceHistory, currentQuarter } = state;

                // ==========================================================
                //  PIYASA IKI CEYREKTE BIR HAREKET EDER
                // ==========================================================
                //  The player's complaint: by the time enough cash is saved to
                //  buy a target, the target has moved out of reach. Prices
                //  repriced every single quarter while the player's own
                //  earnings compound far more slowly, so the gap only widened.
                //
                //  Now the market updates on alternate quarters, and the value
                //  anchor compounds per UPDATE rather than per quarter - which
                //  halves its long-run growth from ~4%/yr to ~2%/yr. Over a
                //  55-year career that is the difference between targets
                //  drifting 8.9x away and 3x away.
                // ==========================================================
                const nextQ = currentQuarter + 1;
                if (nextQ % 2 !== 0) {
                    // Odd quarter: time passes, prices hold.
                    set({ currentQuarter: nextQ });
                    return;
                }
                /** How many times prices have actually moved. Drives the anchor. */
                const priceUpdates = Math.floor(nextQ / 2);

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

                    // Stocks and Funds: Based on market cap.
                    //
                    // ONCE KUCUK SIRKETLER 2,5 CARPAN ALIYORDU. Trend
                    // +%5 iken bu ceyrekte +%12,5, ustune +%5 gurultu:
                    // ceyrekte ~%17. Yilda ~%90 ve CAPASIZ. Oyuncu
                    // "satin alacagim sirketler surekli buyuyor, hic
                    //  yetisemiyorum" dedi — dogru gormus, bilesik
                    // faizle kaciyorlardi.
                    const marketCap = (item as any).marketCap;
                    if (marketCap) {
                        if (marketCap > 200_000_000_000) return 0.5;
                        if (marketCap < 1_000_000_000) return 1.5;
                        if (marketCap < 10_000_000_000) return 1.2;
                        return 0.9;
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

                    // Calculate base change based on market trend.
                    // Ceyreklik %5 yillik %20 demekti — kalici bir boga
                    // piyasasi. %2,5 ile yillik ~%10, gercekci ust sinir.
                    let baseChange = 0;
                    if (marketTrend === 'BULL') baseChange = 0.025;
                    else if (marketTrend === 'BEAR') baseChange = -0.025;
                    else baseChange = 0;

                    // Get volatility multiplier
                    const volatilityMultiplier = getVolatilityMultiplier(item);

                    // Apply volatility to base change
                    let trendAdjustedChange = baseChange * volatilityMultiplier;

                    // Add random noise (-2% to +2% base, scaled by volatility)
                    const randomNoise = (Math.random() * 0.04 - 0.02) * volatilityMultiplier;

                    // Total change percentage
                    const totalChangePercent = trendAdjustedChange + randomNoise;

                    // ==========================================================
                    //  TEMEL DEGERE DONUS (mean reversion)
                    // ==========================================================
                    //  Once fiyat CAPASIZ rastgele yuruyusteydi. Rastgele
                    //  yuruyusun tanimi geri donmemektir: bir kez yukari
                    //  saparsa orada kalir ve ustune yine sapar. Sekiz
                    //  ceyrek sonra 50M'lik sirket 300M oluyordu.
                    //
                    //  Gercek hisse fiyatlari da oynar ama bir TEMEL DEGERIN
                    //  etrafinda oynar. Cok yukselirse pahalidir, satis
                    //  gelir; cok duserse ucuzdur, alim gelir. Fiyati
                    //  kazanca bagli tutan sey budur.
                    //
                    //  Cipa yavas buyur (~ceyrekte %1 = yilda %4): ekonomi
                    //  buyur ama kacmaz. Oyuncunun karliligi ceyrekte bunun
                    //  cok ustunde artabilir — yani YETISEBILIR.
                    // ==========================================================
                    const basePrice = ('price' in item ? (item as any).price : 0) || currentPrice;
                    // ==========================================================
                    //  PAZAR PAYI DEGERLEMEYI SURUKLER
                    // ==========================================================
                    //  Bir sirketin degeri gelecekteki nakit akisidir; pazar
                    //  payi da onun en dogrudan gostergesi. Pay kaybeden
                    //  sirketin hissesi duser.
                    //
                    //  Once bu bag HIC YOKTU: pazarda dovdugun rakibin
                    //  hissesi yukselmeye devam edebiliyordu. Simdi rekabet
                    //  dongusu kapaniyor — bir rakibi ucuza kapatmanin yolu
                    //  once onu pazarda dovmekten geciyor.
                    // ==========================================================
                    const live = get().competitorShares[item.id];
                    const baseShare = baselineShareFor(item.id);
                    const shareMult =
                        live !== undefined && baseShare > 0
                            ? shareValuationMultiplier(live, baseShare)
                            : 1;
                    const anchor =
                        basePrice * Math.pow(1 + ANCHOR_GROWTH, priceUpdates) * shareMult;

                    let newPrice = currentPrice * (1 + totalChangePercent);
                    // Cipaya dogru cek. Tahvilde neredeyse tam, kriptoda hic.
                    const pull = isCrypto(item) ? 0 : isBond(item) ? 0.6 : REVERSION_STRENGTH;
                    newPrice += (anchor - newPrice) * pull;

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

            updateStockPrice: (id, newPrice) => {
                set((state) => ({
                    marketPrices: {
                        ...state.marketPrices,
                        [id]: newPrice
                    }
                }));
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
                currentQuarter: state.currentQuarter,
                // Rakiplerin kazandigi/kaybettigi pay KALICI olmali; yoksa
                // uygulama her acildiginda pazar baslangica doner ve
                // oyuncunun yillarca surdurdugu rekabet silinir.
                competitorShares: state.competitorShares,
            }),
            // ==============================================================
            //  ONE-TIME CLAMP FOR PRE-REVERSION SAVES
            // ==============================================================
            //  Before mean reversion existed, prices were an uncapped random
            //  walk and ran away by orders of magnitude - a $10M startup could
            //  read as a $120B acquisition target. Reversion pulls those back
            //  at 15% a quarter, but the player is trying to play NOW, and a
            //  target that is 12,000x its real worth makes the whole M&A route
            //  look broken for the next twenty-odd quarters.
            //
            //  On load, anything more than 3x its own value anchor is pulled
            //  back to the anchor. 3x leaves the normal volatility band alone:
            //  a healthy price sits within roughly +/-40% of its anchor, so
            //  nothing that is merely expensive gets touched.
            // ==============================================================
            onRehydrateStorage: () => (state) => {
                if (!state?.marketPrices) return;
                const updates = Math.floor((state.currentQuarter || 0) / 2);
                let clamped = 0;
                INITIAL_MARKET_ITEMS.forEach(item => {
                    const base = ('price' in item ? (item as any).price : 0) || 0;
                    if (!base) return;
                    const price = state.marketPrices[item.id];
                    if (!price) return;
                    const anchor = base * Math.pow(1.01, updates);
                    if (price > anchor * 3) {
                        state.marketPrices[item.id] = anchor;
                        clamped += 1;
                    }
                });
                if (clamped > 0) {
                    console.log(`[MarketStore] ${clamped} runaway price(s) pulled back to their anchor`);
                }
            },
        }
    )
);
