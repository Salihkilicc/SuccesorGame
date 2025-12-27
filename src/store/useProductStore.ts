import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';

export interface Supplier {
    name: string;
    cost: number;
    quality: number; // 0-100
}

export interface Product {
    id: string;
    name: string;
    type: string;
    supplier: Supplier;
    production: {
        allocated: number;
        capacity: number;
        weight?: number; // Capacity units per item. Default 1.
    };
    pricing: {
        salePrice: number;
    };
    market: {
        demand: number; // 0-100
        competition: number; // 0-100
        researched: boolean;
    };
    revenue: number;
    status: 'active' | 'retired';
}

export const PRODUCT_TYPES = [
    'Electronics',
    'Clothing',
    'Food & Beverage',
    'Furniture',
    'Cosmetics',
    'Toys',
    'Sports Equipment',
    'Books & Media',
];

export const DEFAULT_SUPPLIERS: Record<string, Supplier[]> = {
    'Electronics': [
        { name: 'TechCorp', cost: 50, quality: 70 },
        { name: 'ElectroMax', cost: 45, quality: 65 },
        { name: 'CircuitPro', cost: 55, quality: 75 },
    ],
    'Clothing': [
        { name: 'FabricWorld', cost: 20, quality: 60 },
        { name: 'TextilePro', cost: 25, quality: 70 },
        { name: 'ClothCo', cost: 18, quality: 55 },
    ],
    'Food & Beverage': [
        { name: 'FreshFarms', cost: 15, quality: 65 },
        { name: 'GourmetSupply', cost: 20, quality: 75 },
        { name: 'BulkFoods', cost: 12, quality: 50 },
    ],
    'Furniture': [
        { name: 'WoodWorks', cost: 80, quality: 70 },
        { name: 'ModernDesign', cost: 100, quality: 80 },
        { name: 'BudgetFurniture', cost: 60, quality: 55 },
    ],
    'Cosmetics': [
        { name: 'BeautyLab', cost: 30, quality: 75 },
        { name: 'GlamourSupply', cost: 35, quality: 80 },
        { name: 'BasicBeauty', cost: 25, quality: 60 },
    ],
    'Toys': [
        { name: 'PlayFactory', cost: 25, quality: 65 },
        { name: 'FunToys', cost: 30, quality: 70 },
        { name: 'KidJoy', cost: 20, quality: 55 },
    ],
    'Sports Equipment': [
        { name: 'SportsPro', cost: 40, quality: 75 },
        { name: 'ActiveGear', cost: 45, quality: 80 },
        { name: 'FitSupply', cost: 35, quality: 65 },
    ],
    'Books & Media': [
        { name: 'PrintMasters', cost: 10, quality: 60 },
        { name: 'MediaCorp', cost: 15, quality: 70 },
        { name: 'BudgetBooks', cost: 8, quality: 50 },
    ],
};

interface ProductState {
    products: Product[];
}

interface ProductActions {
    addProduct: (product: Product) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    retireProduct: (id: string) => void;
    processMonthlySales: (context: SalesContext) => void;
    reset: () => void;
}

export interface SalesContext {
    morale: number;
    techLevels: { hardware: number; software: number; future: number };
    acquisitions: string[];
}

export const initialProductState: ProductState = {
    products: [],
};

export const useProductStore = create<ProductState & ProductActions>()(
    persist(
        (set) => ({
            ...initialProductState,
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

                        // Logic imported from useProductManagement
                        const { morale, techLevels, acquisitions } = context;
                        let production = product.production.allocated;

                        // Shipping issue event (20% if morale < 40)
                        // We could store events if we want, but for now just updating revenue
                        if (morale < 40 && Math.random() < 0.2) {
                            production = Math.floor(production * 0.9);
                        }

                        // Tech Bonus for Price Factor
                        const qualityBonus = product.supplier.quality / 100; // 0-1
                        const competitionPenalty = product.market.competition / 200; // 0-0.5
                        const optimalMultiplier = techLevels.software >= 3 ? 2.5 : 2.0;
                        const priceRatio = product.pricing.salePrice / (product.supplier.cost * optimalMultiplier);

                        const priceFactor = Math.max(0.1, qualityBonus - competitionPenalty - Math.abs(1 - priceRatio) * 0.3);

                        // Base Sales
                        let maxSales = product.market.demand * priceFactor;

                        // Acquisition Bonuses
                        if (Array.isArray(acquisitions)) {
                            if (acquisitions.includes('streamify') && (product.type === 'MyPhone' || product.type === 'MyPods')) {
                                maxSales *= 1.15;
                            }
                            if (acquisitions.includes('gameGen') && (product.type === 'MyMac' || product.type === 'MyPad')) {
                                maxSales *= 1.15;
                            }
                        }

                        const unitsSold = Math.floor(Math.min(production, maxSales));
                        const revenue = unitsSold * product.pricing.salePrice;

                        // Update product market data occasionally? (Competition/Demand shifts)
                        // For now, just update revenue
                        return { ...product, revenue };
                    })
                })),
            reset: () => set(() => ({ ...initialProductState })),
        }),
        {
            name: 'succesor_products_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                products: state.products,
            }),
        }
    )
);
