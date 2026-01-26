import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { ShoppingItem, OwnedAsset } from '../types';

// Simple UUID generator (JS only, no native dependencies)
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem extends ShoppingItem {
    location?: string;
}

// ============================================================================
// STATE & ACTIONS
// ============================================================================

type AssetState = {
    ownedItems: OwnedAsset[];
    cart: CartItem[];
};

type AssetActions = {
    // Cart Management
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;

    // Purchase & Ownership
    purchaseCart: () => void;
    isOwned: (catalogId: string) => boolean;
    removeOwnedItem: (instanceId: string) => void;
    repairOwnedItem: (instanceId: string, condition?: number) => void;

    // Utility
    reset: () => void;
};

type AssetStore = AssetState & AssetActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AssetState = {
    ownedItems: [],
    cart: [],
};

// ============================================================================
// STORE
// ============================================================================

export const useAssetStore = create<AssetStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========================================================================
            // CART MANAGEMENT
            // ========================================================================

            addToCart: (item) =>
                set((state) => {
                    const exists = state.cart.some((cartItem) => cartItem.id === item.id);
                    if (exists) {
                        console.warn(`Item ${item.id} is already in cart`);
                        return state;
                    }
                    return { ...state, cart: [...state.cart, item] };
                }),

            removeFromCart: (itemId) =>
                set((state) => ({
                    ...state,
                    cart: state.cart.filter((item) => item.id !== itemId),
                })),

            clearCart: () => set((state) => ({ ...state, cart: [] })),

            // ========================================================================
            // PURCHASE & OWNERSHIP
            // ========================================================================

            purchaseCart: () =>
                set((state) => {
                    const purchaseDate = Date.now();

                    // Create full OwnedAsset objects
                    const newAssets: OwnedAsset[] = state.cart.map((item) => ({
                        ...item,
                        instanceId: generateId(), // Unique ID for this specific asset instance
                        purchaseDate,
                        condition: 100,
                        marketValue: item.price, // Initial value = purchase price
                    }));

                    console.log('[AssetStore] Purchased assets:', newAssets.map(a => a.name));

                    return {
                        ...state,
                        ownedItems: [...state.ownedItems, ...newAssets],
                        cart: [],
                    };
                }),

            isOwned: (catalogId) => {
                const state = get();
                // Check if we own any asset with this catalog ID
                return state.ownedItems.some((asset) => asset.id === catalogId);
            },

            removeOwnedItem: (instanceId) =>
                set((state) => ({
                    ...state,
                    ownedItems: state.ownedItems.filter(i => i.instanceId !== instanceId),
                })),

            repairOwnedItem: (instanceId, condition = 100) =>
                set((state) => {
                    const index = state.ownedItems.findIndex(i => i.instanceId === instanceId);
                    if (index === -1) return state;

                    const newOwned = [...state.ownedItems];
                    newOwned[index] = { ...newOwned[index], condition };
                    return { ...state, ownedItems: newOwned };
                }),

            // ========================================================================
            // UTILITY
            // ========================================================================

            reset: () => set(() => ({ ...initialState })),
        }),
        {
            name: 'succesor_assets_v2', // Bumped version
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                ownedItems: state.ownedItems,
                cart: state.cart,
            }),
        },
    ),
);

