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
    reset: () => void;
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
                    products: state.products.filter((p) => p.id !== id),
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
