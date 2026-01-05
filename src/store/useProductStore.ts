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
    // R&D Upgrade Actions
    upgradeProductQuality: (productId: string, currentRP: number, deductRP: (amount: number) => void) => { success: boolean; message: string };
    optimizeProductionLine: (productId: string, currentRP: number, deductRP: (amount: number) => void) => { success: boolean; message: string };
    randomizeProductName: (productId: string) => void;
    unlockProduct: (productId: string, currentRP: number, currentCash: number, deductRP: (amount: number) => void, deductCash: (amount: number) => void) => { success: boolean; message: string; stockBoost?: number };
    reset: () => void;
}

export const initialProductState: ProductState = {
    products: [
        {
            id: 'smart_phone',
            name: 'Smart Phone',
            icon: '📱',
            description: 'Essential for modern life.',
            status: 'active',
            category: 'Consumer', // Type cast if needed, but 'Consumer' is valid
            // Requirements
            rndCost: 0,
            complexity: 50,
            unlockCashCost: 0,

            // Market Data
            marketDemand: 80,
            competition: 'High',
            baseProductionCost: 250,
            unitCost: 250,
            suggestedPrice: 600,

            // Active Config
            sellingPrice: 600,
            productionLevel: 50, // Started at 50%
            marketingSpendPerUnit: 0,
            inventory: 0,
            revenue: 0,

            // Levels
            costLevel: 0,
            priceLevel: 0,
            qualityLevel: 1,
            processLevel: 1
        },
        {
            id: 'pro_laptop',
            name: 'Pro Laptop',
            icon: '💻',
            description: 'High margin tool for professionals.',
            status: 'active',
            category: 'Consumer',

            // Requirements
            rndCost: 0,
            complexity: 90,
            unlockCashCost: 0,

            // Market Data
            marketDemand: 60,
            competition: 'Medium',
            baseProductionCost: 550,
            unitCost: 550,
            suggestedPrice: 1200,

            // Active Config
            sellingPrice: 1200,
            productionLevel: 0, // Stopped initially
            marketingSpendPerUnit: 0,
            inventory: 0,
            revenue: 0,


            // Levels
            costLevel: 0,
            priceLevel: 0,
            qualityLevel: 1,
            processLevel: 1
        }
    ] as any[], // Cast to avoid strict type checking on partials if necessary
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
            // R&D Upgrade Actions - NEW SYSTEM
            upgradeProductQuality: (productId, currentRP, deductRP) => {
                let result = { success: false, message: '' };

                set((state) => {
                    const product = state.products.find(p => p.id === productId);
                    if (!product) {
                        result = { success: false, message: 'Product not found' };
                        return state;
                    }

                    const currentLevel = product.qualityLevel || 1;
                    const complexity = product.complexity || 50;

                    // Formula: complexity * 100 * (1.5 ^ level)
                    const rpCost = Math.floor(complexity * 100 * Math.pow(1.5, currentLevel));

                    if (currentRP < rpCost) {
                        result = { success: false, message: `Need ${rpCost.toLocaleString()} RP` };
                        return state;
                    }

                    // Deduct RP
                    deductRP(rpCost);

                    // Apply Effect: +3% Price
                    const currentPrice = product.sellingPrice || product.suggestedPrice;
                    const newPrice = Math.floor(currentPrice * 1.03);

                    result = { success: true, message: `Quality Improved! Price increased to $${newPrice}` };

                    return {
                        products: state.products.map(p => {
                            if (p.id !== productId) return p;
                            return {
                                ...p,
                                qualityLevel: currentLevel + 1,
                                sellingPrice: newPrice,
                                suggestedPrice: newPrice // Update suggested too so demand logic holds
                            };
                        })
                    };
                });

                return result;
            },

            optimizeProductionLine: (productId, currentRP, deductRP) => {
                let result = { success: false, message: '' };

                set((state) => {
                    const product = state.products.find(p => p.id === productId);
                    if (!product) {
                        result = { success: false, message: 'Product not found' };
                        return state;
                    }

                    const currentLevel = product.processLevel || 1;
                    const complexity = product.complexity || 50;

                    // Formula: complexity * 100 * (1.5 ^ level)
                    const rpCost = Math.floor(complexity * 100 * Math.pow(1.5, currentLevel));

                    if (currentRP < rpCost) {
                        result = { success: false, message: `Need ${rpCost.toLocaleString()} RP` };
                        return state;
                    }

                    // Limit Check: Cannot go below 40% of Base Cost
                    // Use unitCost if set, else baseProductionCost
                    const currentCost = product.unitCost ?? product.baseProductionCost;
                    const minCost = Math.floor(product.baseProductionCost * 0.40);

                    if (currentCost <= minCost) {
                        result = { success: false, message: 'Max efficiency reached (40% limit).' };
                        return state;
                    }

                    // Deduct RP
                    deductRP(rpCost);

                    // Apply Effect: -2% Cost
                    let newCost = Math.floor(currentCost * 0.98);
                    if (newCost < minCost) newCost = minCost;

                    result = { success: true, message: `Process Optimized! Cost reduced to $${newCost}` };

                    return {
                        products: state.products.map(p => {
                            if (p.id !== productId) return p;
                            return {
                                ...p,
                                processLevel: currentLevel + 1,
                                unitCost: newCost
                            };
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
                    // AUTO-CREATE PRODUCT
                    products: [...state.products, {
                        id: product.id, // Tech ID as Product ID
                        name: product.name,
                        description: `Produced from ${product.name} technology.`,
                        category: product.category as any,
                        status: 'active',

                        // Financials
                        sellingPrice: product.baseSellingPrice,
                        suggestedPrice: product.baseSellingPrice,
                        baseProductionCost: product.baseUnitCost,
                        unitCost: product.baseUnitCost,

                        // Logic Props
                        productionLevel: 0, // Stopped
                        marketDemand: 100,
                        marketingSpendPerUnit: 0,
                        inventory: 0,

                        // Levels
                        level: 1,
                        costLevel: 0,
                        priceLevel: 0,
                        qualityLevel: 1,
                        processLevel: 1,


                        // Misc
                        icon: '📦',
                        rndCost: product.unlockRPCost,
                        complexity: product.complexity,
                        unlockCashCost: product.unlockCashCost,
                        competition: 'Medium',
                    }]
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
