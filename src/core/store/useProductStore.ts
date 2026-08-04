import { create } from 'zustand';
import { t } from '../../core/i18n';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { UnlockableProduct, UNLOCKABLE_PRODUCTS } from '../../features/products/data/unlockableProductsData';
import { formatMoney, formatNumber } from '../../core/utils';
import { productUpgradeRP } from '../market/production';

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
    /**
     * Urunu tamamen HATTAN CIKARIR.
     *
     * `status: 'retired'` yalnizca uretimi durduruyordu; urun listede
     * kaliyor ve tekrar acilamiyordu. Bu, "pazari kucuk olan urunu
     * birakip sonra tekrar denemek" gibi tamamen makul bir hamleyi
     * imkansiz kiliyordu.
     *
     * Artik urun listeden silinir ve teknoloji YENIDEN KILITLENIR —
     * yani tekrar acmak icin RP ve nakit odemen gerekir. Vazgecmenin
     * bir bedeli var, ama kapi kapanmiyor.
     */
    discontinueProduct: (productId: string) => { success: boolean; message: string };
    reset: () => void;
}

export const initialProductState: ProductState = {
    products: [
        {
            id: 'smart_phone',
            name: t('product.smartPhone'),
            icon: '📱',
            description: t('product.essentialForModernLife'),
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
            marketingBudget: 0,
            inventory: 0,
            revenue: 0,

            // Levels
            costLevel: 0,
            priceLevel: 0,
            qualityLevel: 1,
            processLevel: 1
        },
        // Oyun TEK aktif urunle baslar: Smart Phone.
        // Eskiden 'pro_laptop' da aktif basliyordu; o urun oyundan tamamen
        // kaldirildi (bkz. features/products/data/unlockableProductsData.ts).
        // Ikinci urun artik Tech Tree'den Ar-Ge ile acilir.
    ] as any[], // Cast to avoid strict type checking on partials if necessary
    unlockableProducts: UNLOCKABLE_PRODUCTS,
};

export const useProductStore = create<ProductState & ProductActions>()(
    persist(
        (set, get) => ({
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
                        result = { success: false, message: t('product.productNotFound') };
                        return state;
                    }

                    const currentLevel = product.qualityLevel || 1;
                    const complexity = product.complexity || 50;

                    // TEK KAYNAK: ekran da bunu kullaniyor (production.ts).
                    const rpCost = productUpgradeRP(complexity, currentLevel);

                    if (currentRP < rpCost) {
                        result = { success: false, message: t('product.needV1Rp', { v1: formatNumber(rpCost) }) };
                        return state;
                    }

                    // Deduct RP
                    deductRP(rpCost);

                    // Apply Effect: +3% Price
                    const currentPrice = product.sellingPrice || product.suggestedPrice;
                    const newPrice = Math.floor(currentPrice * 1.03);

                    result = { success: true, message: t('product.qualityImprovedPriceIncreasedTo', { v1: newPrice }) };

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
                        result = { success: false, message: t('product.productNotFound') };
                        return state;
                    }

                    const currentLevel = product.processLevel || 1;
                    const complexity = product.complexity || 50;

                    // TEK KAYNAK: ekran da bunu kullaniyor (production.ts).
                    const rpCost = productUpgradeRP(complexity, currentLevel);

                    if (currentRP < rpCost) {
                        result = { success: false, message: t('product.needV1Rp', { v1: formatNumber(rpCost) }) };
                        return state;
                    }

                    // Limit Check: Cannot go below 40% of Base Cost
                    // Use unitCost if set, else baseProductionCost
                    const currentCost = product.unitCost ?? product.baseProductionCost;
                    const minCost = Math.floor(product.baseProductionCost * 0.40);

                    if (currentCost <= minCost) {
                        result = { success: false, message: t('product.maxEfficiencyReached40Limit') };
                        return state;
                    }

                    // Deduct RP
                    deductRP(rpCost);

                    // Apply Effect: -2% Cost
                    let newCost = Math.floor(currentCost * 0.98);
                    if (newCost < minCost) newCost = minCost;

                    result = { success: true, message: t('product.processOptimizedCostReducedTo', { v1: newCost }) };

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
                const { getRandomProductName } = require('../../features/products/data/productsData');

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

            discontinueProduct: (productId: string) => {
                const state = get();
                const product = state.products.find((p: any) => p.id === productId);
                if (!product) return { success: false, message: t('product.productNotFound2') };

                const leftoverStock = product.inventory || 0;

                set(current => ({
                    // Urunu listeden cikar
                    products: current.products.filter((p: any) => p.id !== productId),
                    // Teknolojiyi yeniden kilitle: tekrar acmak bedel ister
                    unlockableProducts: current.unlockableProducts.map((p: any) =>
                        p.id === productId ? { ...p, isUnlocked: false } : p
                    ),
                }));

                return {
                    success: true,
                    message: leftoverStock > 0
                        ? `${product.name} discontinued. ${leftoverStock.toLocaleString()} units written off.`
                        : `${product.name} discontinued.`,
                };
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
                    return { success: false, message: t('product.buRNZatenA') };
                }

                // Check RP requirement
                if (currentRP < product.unlockRPCost) {
                    return {
                        success: false,
                        message: t('product.yetersizArGePuanGereken', { v1: formatNumber(product.unlockRPCost) })
                    };
                }

                // Check Cash requirement
                if (currentCash < product.unlockCashCost) {
                    return {
                        success: false,
                        message: t('product.yetersizSermayeGerekenV1', { v1: formatMoney(product.unlockCashCost) })
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
                        description: t('product.producedFromV1Technology', { v1: product.name }),
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
                        marketingBudget: 0,
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
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                products: state.products,
                // HATA DUZELTMESI: bu satir yoktu.
                // Sonuc: actigin teknolojiler diske yazilmiyordu. Uygulamayi
                // kapatip acinca Tech Tree hepsini yeniden KILITLI gosteriyordu
                // (urun products dizisinde kaldigi icin oynanabiliyordu ama
                // agac yalan soyluyordu, ve ayni teknolojiye tekrar RP
                // odenebiliyordu).
                unlockableProducts: state.unlockableProducts,
            }),

            // ------------------------------------------------------------------
            //  PAZARLAMA TASIMASI — BIR KEZ, BURADA
            // ------------------------------------------------------------------
            //  HATA: tasima ProductModals icinde, MODAL HER ACILDIGINDA
            //  yapiliyordu:
            //      butce = eskiBirimTutari x O ANKI uretim hedefi
            //
            //  Uretim hedefi her ceyrek buyudugu icin ayni urunun butcesi
            //  her acilista biraz DAHA BUYUK cikiyor, kaydedince de
            //  kaliciasiyordu. Oyuncu "pazarlama degeri kendiliginden
            //  birkac tik artiyor" diye gordu — dogru gormus.
            //
            //  Artik tasima yalnizca yuklemede bir kez yapilir ve eski alan
            //  sifirlanir, yani ikinci kez calisamaz.
            // ------------------------------------------------------------------
            onRehydrateStorage: () => (state) => {
                if (!state || !Array.isArray(state.products)) return;
                state.products = state.products.map((p: any) => {
                    if (typeof p.marketingBudget === 'number') {
                        return p.marketingSpendPerUnit ? { ...p, marketingSpendPerUnit: 0 } : p;
                    }
                    const legacyPerUnit = p.marketingSpendPerUnit || 0;
                    const units = p.productionUnits ?? 0;
                    return {
                        ...p,
                        marketingBudget: Math.round(legacyPerUnit * units),
                        marketingSpendPerUnit: 0,
                    };
                });
            },
        }
    )
);
