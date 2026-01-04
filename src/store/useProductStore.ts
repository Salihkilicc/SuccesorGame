import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { Product } from '../data/types';
import { UnlockableProduct, UNLOCKABLE_PRODUCTS } from '../features/products/data/unlockableProductsData';

export interface SalesContext {
    morale: number;
    techLevels: { hardware: number; software: number; future: number };
    acquisitions: string[];
}

interface ProductState {
    products: Product[];
    unlockableProducts: UnlockableProduct[];
}

interface ProductActions {
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    retireProduct: (id: string) => void;
    processMonthlySales: (context: SalesContext) => void;
    // R&D Upgrade Actions
    upgradeProductCost: (productId: string, currentRP: number, deductRP: (amount: number) => void) => { success: boolean; message: string };
    upgradeProductPrice: (productId: string, currentRP: number, deductRP: (amount: number) => void) => { success: boolean; message: string };
    randomizeProductName: (productId: string) => void;
    unlockProduct: (productId: string, currentRP: number, currentCash: number, deductRP: (amount: number) => void, deductCash: (amount: number) => void) => { success: boolean; message: string; stockBoost?: number };
    reset: () => void;
}

export const initialProductState: ProductState = {
    products: [],
    unlockableProducts: UNLOCKABLE_PRODUCTS,
};

export const useProductStore = create<ProductState & ProductActions>()(
    persist(
        (set) => ({
            ...initialProductState,
            setProducts: (products) => set({ products }),
            addProduct: (product) =>
                set((state) => ({
                    products: [...state.products, product],
                })),
            updateProduct: (id, updates) =>
                set((state) => ({
                    products: state.products.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                })),
            retireProduct: (id) =>
                set((state) => ({
                    products: state.products.map((p) =>
                        p.id === id ? { ...p, status: 'retired' } : p
                    ),
                })),
            processMonthlySales: (context) =>
                set((state) => ({
                    products: state.products.map((product) => {
                        if (product.status !== 'active') return product;

                        // New Logic based on requested fields
                        // product.productionLevel (0-100) -> Acts as supply limiter
                        // product.marketDemand (0-100) -> Acts as Max Demand
                        // product.competition (Low/Medium/High) -> Acts as sales dampener
                        // product.sellingPrice vs product.suggestedPrice -> Price elasticity

                        const {
                            productionLevel = 0,
                            marketDemand,
                            sellingPrice = 0,
                            suggestedPrice,
                            competition
                        } = product;

                        // 1. Calculate Effective Demand
                        // Price Factor: If selling > suggested, demand drops. If lower, demand rises.
                        // Elasticity: +/- 10% price = -/+ 15% demand
                        const priceRatio = sellingPrice / suggestedPrice;
                        let priceDemandModifier = 1.0;
                        if (priceRatio > 1) {
                            // Higher price -> Lower demand ( steeper drop)
                            priceDemandModifier = Math.max(0.1, 1 - (priceRatio - 1) * 2);
                        } else {
                            // Lower price -> Higher demand (diminishing returns)
                            priceDemandModifier = Math.min(2.0, 1 + (1 - priceRatio) * 1.5);
                        }

                        // Competition Factor
                        let competitionFactor = 1.0;
                        if (competition === 'High') competitionFactor = 0.6;
                        if (competition === 'Medium') competitionFactor = 0.8;
                        if (competition === 'Low') competitionFactor = 1.0;

                        // Tech/Morale Bonuses (Context)
                        const moraleBonus = context.morale > 80 ? 1.1 : (context.morale < 40 ? 0.8 : 1.0);

                        const effectiveDemand = marketDemand * priceDemandModifier * competitionFactor * moraleBonus;

                        // 2. Calculate Sales Volume
                        // We scale the 0-100 numbers to "Units Sold" to make revenue meaningful.
                        // Let's say 1 Point = 100 Units base.
                        const UNIT_MULTIPLIER = 1000;

                        const maxDemandUnits = effectiveDemand * UNIT_MULTIPLIER;
                        const suppliedUnits = (productionLevel / 100) * (marketDemand * 1.2 * UNIT_MULTIPLIER);
                        // Note: productionLevel is % of "Max Capacity". What is max capacity?
                        // Let's assume Max Capacity is implicitly slightly higher than base market demand to allow growth.

                        const unitsSold = Math.floor(Math.min(maxDemandUnits, suppliedUnits));

                        // 3. Calculate Revenue
                        const revenue = unitsSold * sellingPrice;

                        return { ...product, revenue };
                    })
                })),

            // R&D Upgrade Actions
            upgradeProductCost: (productId, currentRP, deductRP) => {
                const { calculateUpgradeRPCost, MAX_UPGRADE_LEVEL, COST_OPTIMIZATION } = require('../features/products/logic/productUpgrades');

                let result = { success: false, message: '' };

                set((state) => {
                    const product = state.products.find(p => p.id === productId);
                    if (!product) {
                        result = { success: false, message: 'Product not found' };
                        return state;
                    }

                    const currentLevel = product.costLevel || 0;
                    if (currentLevel >= MAX_UPGRADE_LEVEL) {
                        result = { success: false, message: 'Already at maximum level' };
                        return state;
                    }

                    const rpCost = calculateUpgradeRPCost(COST_OPTIMIZATION.BASE_RP_COST, currentLevel);
                    if (currentRP < rpCost) {
                        result = { success: false, message: `Insufficient RP. Need ${rpCost.toLocaleString()} RP` };
                        return state;
                    }

                    // Deduct RP and upgrade
                    deductRP(rpCost);
                    result = { success: true, message: `Production optimized! Cost reduced by $2` };

                    return {
                        products: state.products.map(p => {
                            if (p.id !== productId) return p;
                            const currentCost = p.unitCost ?? p.baseProductionCost;
                            return { ...p, costLevel: currentLevel + 1, unitCost: Math.max(1, currentCost - 2) };
                        })
                    };
                });

                return result;
            },

            upgradeProductPrice: (productId, currentRP, deductRP) => {
                const { calculateUpgradeRPCost, MAX_UPGRADE_LEVEL, FEATURE_ENHANCEMENT, getNextPriceIncrease } = require('../features/products/logic/productUpgrades');

                let result = { success: false, message: '' };

                set((state) => {
                    const product = state.products.find(p => p.id === productId);
                    if (!product) {
                        result = { success: false, message: 'Product not found' };
                        return state;
                    }

                    const currentLevel = product.priceLevel || 0;
                    if (currentLevel >= MAX_UPGRADE_LEVEL) {
                        result = { success: false, message: 'Already at maximum level' };
                        return state;
                    }

                    const rpCost = calculateUpgradeRPCost(FEATURE_ENHANCEMENT.BASE_RP_COST, currentLevel);
                    if (currentRP < rpCost) {
                        result = { success: false, message: `Insufficient RP. Need ${rpCost.toLocaleString()} RP` };
                        return state;
                    }

                    const priceIncrease = getNextPriceIncrease(currentLevel);

                    // Deduct RP and upgrade
                    deductRP(rpCost);
                    result = { success: true, message: `Features enhanced! Price increased by $${priceIncrease}` };

                    return {
                        products: state.products.map(p => {
                            if (p.id !== productId) return p;
                            const currentPrice = p.sellingPrice || p.suggestedPrice;
                            const increaseAmount = currentLevel + 2;
                            return { ...p, priceLevel: currentLevel + 1, sellingPrice: currentPrice + increaseAmount };
                        })
                    };
                });

                return result;
            },

            randomizeProductName: (productId) => {
                const { getRandomProductName } = require('../features/products/data/productsData');

                set((state) => ({
                    products: state.products.map(p => {
                        if (p.id === productId) {
                            const newName = getRandomProductName(p.category);
                            return { ...p, name: newName };
                        }
                        return p;
                    })
                }));
            },

            unlockProduct: (productId, currentRP, currentCash, deductRP, deductCash) => {
                let foundProduct: UnlockableProduct | undefined;

                set((state) => {
                    foundProduct = state.unlockableProducts.find((p: UnlockableProduct) => p.id === productId);
                    return state; // No change yet, just finding
                });

                const product = foundProduct;

                if (!product) {
                    return { success: false, message: 'Ürün bulunamadı.' };
                }

                if (product.isUnlocked) {
                    return { success: false, message: 'Bu ürün zaten açılmış.' };
                }

                // Check RP requirement
                if (currentRP < product.unlockRPCost) {
                    return {
                        success: false,
                        message: `Yetersiz Ar-Ge Puanı. Gereken: ${product.unlockRPCost.toLocaleString()} RP`
                    };
                }

                // Check Cash requirement
                if (currentCash < product.unlockCashCost) {
                    return {
                        success: false,
                        message: `Yetersiz Sermaye. Gereken: $${product.unlockCashCost.toLocaleString()}`
                    };
                }

                // Deduct costs
                deductRP(product.unlockRPCost);
                deductCash(product.unlockCashCost);

                // Unlock product
                set((state) => ({
                    unlockableProducts: state.unlockableProducts.map((p) =>
                        p.id === productId ? { ...p, isUnlocked: true } : p
                    ),
                }));

                return {
                    success: true,
                    message: `${product.name} başarıyla açıldı!`,
                    stockBoost: product.stockBoost
                };
            },

            reset: () => set(() => ({ ...initialProductState })),
        }),
        {
            name: 'succesor_products_v3', // Bump version for new schema
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                products: state.products,
            }),
        }
    )
);
