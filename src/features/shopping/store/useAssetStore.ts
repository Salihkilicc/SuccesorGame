import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';

// ============================================================================
// TYPES
// ============================================================================

export type OwnedItem = {
    itemId: string;        // Item ID from ITEMS data
    purchaseDate: number;  // timestamp
    condition: number;     // 0-100, starts at 100 (mint condition)
};

export type CartItem = {
    id: string;
    name: string;
    price: number;
    type: string;
    brand?: string;
    category: string;
    website: string;
    brandColor: string;
    specs: string[];
    description: string;
    location?: string;
};

// ============================================================================
// STATE & ACTIONS
// ============================================================================

type AssetState = {
    ownedItems: OwnedItem[];
    cart: CartItem[];
};

type AssetActions = {
    // Cart Management
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;

    // Purchase & Ownership
    purchaseCart: () => void;
    isOwned: (id: string) => boolean;

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

            /**
             * Add an item to the shopping cart
             */
            addToCart: (item) =>
                set((state) => {
                    // Prevent duplicates
                    const exists = state.cart.some((cartItem) => cartItem.id === item.id);
                    if (exists) {
                        console.warn(`Item ${item.id} is already in cart`);
                        return state;
                    }

                    return {
                        ...state,
                        cart: [...state.cart, item],
                    };
                }),

            /**
             * Remove an item from the cart
             */
            removeFromCart: (itemId) =>
                set((state) => ({
                    ...state,
                    cart: state.cart.filter((item) => item.id !== itemId),
                })),

            /**
             * Clear all items from the cart
             */
            clearCart: () =>
                set((state) => ({
                    ...state,
                    cart: [],
                })),

            // ========================================================================
            // PURCHASE & OWNERSHIP
            // ========================================================================

            /**
             * Purchase all items in the cart
             * Moves items from cart to ownedItems with purchase timestamp
             */
            purchaseCart: () =>
                set((state) => {
                    const purchaseDate = Date.now();

                    // Convert cart items to owned items with full metadata
                    const newOwnedItems = state.cart.map((item) => ({
                        itemId: item.id,
                        purchaseDate,
                        condition: 100, // Mint condition
                    }));

                    console.log('[AssetStore] Purchased items:', newOwnedItems.map(i => i.itemId));

                    return {
                        ...state,
                        ownedItems: [...state.ownedItems, ...newOwnedItems],
                        cart: [], // Clear cart after purchase
                    };
                }),

            /**
             * Check if an item is owned
             */
            isOwned: (id) => {
                const state = get();
                return state.ownedItems.some((item) => item.itemId === id);
            },

            // ========================================================================
            // UTILITY
            // ========================================================================

            /**
             * Reset store to initial state
             */
            reset: () => set(() => ({ ...initialState })),
        }),
        {
            name: 'succesor_assets_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                ownedItems: state.ownedItems,
                cart: state.cart,
            }),
        },
    ),
);
