import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { Product } from '../data/types';

export interface SalesContext {
    morale: number;
    techLevels: { hardware: number; software: number; future: number };
    acquisitions: string[];
}

interface ProductState {
    products: Product[];
}

interface ProductActions {
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    retireProduct: (id: string) => void;
    processMonthlySales: (context: SalesContext) => void;
    reset: () => void;
}

export const initialProductState: ProductState = {
    products: [],
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
