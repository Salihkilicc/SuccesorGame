import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { ShoppingItem, OwnedAsset } from '../types';
import { decayed, portfolioUpkeepQuarterly } from '../../../core/luxury/upkeep';
import { marketValueOf } from '../../../core/luxury/valuation';

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
    appliedLuxuryBuff: number;
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

    // ------------------------------------------------------------------
    //  TIME PASSING
    // ------------------------------------------------------------------
    //  What the collection costs to keep for one quarter, and what happens
    //  to it when a quarter goes by. `paid` is whether the player could
    //  cover the bill: an unpaid quarter costs nothing and rots four times
    //  faster, which is what makes the upkeep line worth reading.
    //
    //  See core/luxury/upkeep.ts. The store owns WHAT IS OWNED; the rates
    //  and the curves are pure and live there.
    // ------------------------------------------------------------------
    /** The whole collection's bill for one quarter. */
    upkeepQuarterly: () => number;
    /** Age the collection. Returns nothing; read `ownedItems` after. */
    quarterlyTick: (quarters: number, paid: boolean) => void;

    // Luxury System
    setAppliedLuxuryBuff: (amount: number) => void;

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
    appliedLuxuryBuff: 0,
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
                        // Game quarters, not `purchaseDate`, which is
                        // `Date.now()` and would age a collection while the
                        // app was closed. See types.OwnedAsset.
                        quartersOwned: 0,
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
                    const fixed = { ...newOwned[index], condition };
                    // The value follows the condition, here as well as in the
                    // tick. It did not before: `marketValue` was written once
                    // at purchase and never again, and the portfolio hook
                    // recomputed its own copy on the way to the screen. Two
                    // answers to one question, which is this project's oldest
                    // habit. See core/luxury/valuation.marketValueOf.
                    fixed.marketValue = Math.floor(marketValueOf(fixed));
                    newOwned[index] = fixed;
                    return { ...state, ownedItems: newOwned };
                }),

            // ========================================================================
            // TIME PASSING
            // ========================================================================

            upkeepQuarterly: () => portfolioUpkeepQuarterly(get().ownedItems),

            quarterlyTick: (quarters, paid) =>
                set((state) => {
                    const q = Number.isFinite(quarters) ? Math.max(0, quarters) : 0;
                    if (q === 0 || state.ownedItems.length === 0) return state;

                    return {
                        ...state,
                        ownedItems: state.ownedItems.map((asset) => {
                            const condition = decayed(asset.condition, asset.category, q, paid);
                            // TWO FORCES, and they pull in different
                            // directions on different things. Condition is
                            // what it has been through and the player controls
                            // it; the drift is what the market thinks and they
                            // control it only by choosing what to buy. A
                            // neglected classic can still be worth more than
                            // it cost. See core/luxury/valuation.ts.
                            const quartersOwned = (asset.quartersOwned ?? 0) + q;
                            return {
                                ...asset,
                                condition,
                                quartersOwned,
                                marketValue: Math.floor(
                                    marketValueOf({ ...asset, condition, quartersOwned }),
                                ),
                            };
                        }),
                    };
                }),

            // ========================================================================
            // LUXURY SYSTEM
            // ========================================================================

            setAppliedLuxuryBuff: (amount) => set({ appliedLuxuryBuff: amount }),

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
                appliedLuxuryBuff: state.appliedLuxuryBuff,
            }),
        },
    ),
);

