// src/core/store/useLuxoNetStore.ts
//
// ============================================================================
//  LUXONET — EXCLUSIVE LUXURY MARKETPLACE STORE
// ============================================================================
//
//  Manages ultra-high-net-worth acquisitions: hypercars, megamansions,
//  intercontinental private jets, superyachts, and haute horlogerie.
//  Owned luxury assets grant social and corporate prestige, player buffs,
//  and require annual/quarterly maintenance.
//
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { usePlayerStore } from './usePlayerStore';

// ============================================================================
//  TYPES
// ============================================================================

export type LuxuryAssetCategory =
    | 'Hypercar'
    | 'Supercar'
    | 'Yacht'
    | 'PrivateJet'
    | 'Helicopter'
    | 'RealEstate'
    | 'Mansion'
    | 'PrivateIsland'
    | 'FineArt'
    | 'HauteHorlogerie'
    | 'Jewelry'
    | 'Collectible';

export type LuxuryRarity =
    | 'Exclusive'
    | 'Rare'
    | 'UltraRare'
    | 'OneOfAKind'
    | 'Legendary';

export interface LuxuryBuffs {
    socialReputation?: number;     // High Society reputation boost
    businessReputation?: number;   // Corporate influence
    happinessBoost?: number;       // Core happiness buff
    stressReduction?: number;      // Stress alleviation
    statusTitle?: string;          // Exclusive title unlocked
}

export interface LuxuryAsset {
    id: string;                    // Catalog ID
    name: string;
    brand: string;
    category: LuxuryAssetCategory;
    rarity: LuxuryRarity;
    price: number;
    description: string;
    prestigeScore: number;         // Global prestige score contribution
    annualMaintenanceCost: number; // Annual upkeep
    appreciationRatePerYear: number; // e.g., 0.06 = +6%/yr, -0.03 = -3%/yr
    image?: string;
    buffs: LuxuryBuffs;
    stock: number;                 // -1 for unlimited, or specific stock for 1-of-1 items
    isAvailable: boolean;
}

export interface OwnedLuxuryAsset {
    instanceId: string;            // Unique identifier for this exact physical asset
    assetId: string;               // Refers to catalog item id
    name: string;
    brand: string;
    category: LuxuryAssetCategory;
    rarity: LuxuryRarity;
    purchasePrice: number;
    currentMarketValue: number;
    purchasedAtYear: number;
    purchasedAtQuarter: number;
    condition: number;             // 0-100%
    prestigeScore: number;
    annualMaintenanceCost: number;
    appreciationRatePerYear: number;
    customNickname?: string;
    buffs: LuxuryBuffs;
}

export interface PurchaseResult {
    success: boolean;
    error?: string;
    asset?: OwnedLuxuryAsset;
}

export interface SaleResult {
    success: boolean;
    error?: string;
    saleValue?: number;
}

export interface ServiceResult {
    success: boolean;
    error?: string;
    cost?: number;
}

export interface LuxoNetState {
    catalog: LuxuryAsset[];
    ownedAssets: OwnedLuxuryAsset[];
    membershipTier: 'Black' | 'Obsidian' | 'Sovereign';
    _hasHydrated: boolean;
}

export interface LuxoNetActions {
    setHasHydrated: (v: boolean) => void;

    // --- Marketplace Transactions ---
    buyAsset: (assetId: string, currentYear?: number, currentQuarter?: number) => PurchaseResult;
    sellAsset: (instanceId: string) => SaleResult;
    serviceAsset: (instanceId: string) => ServiceResult;

    // --- Asset Customization & Management ---
    renameAsset: (instanceId: string, newNickname: string) => void;

    // --- Financial & Market Ticks ---
    quarterlyTick: (quartersPassed?: number) => {
        totalMaintenanceCost: number;
        portfolioNetValueChange: number;
    };

    // --- Queries / Computed Helpers ---
    isAssetOwned: (assetId: string) => boolean;
    getTotalPrestige: () => number;
    getTotalPortfolioValue: () => number;
    getTotalAnnualMaintenance: () => number;

    // --- Utility ---
    reset: () => void;
}

export type LuxoNetStore = LuxoNetState & LuxoNetActions;

// ============================================================================
//  CATALOG INITIAL PLACEHOLDER ITEMS (2-3+ Curated Ultra-Luxury Items)
// ============================================================================

const generateInstanceId = (): string =>
    `lux_inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const initialLuxuryCatalog: LuxuryAsset[] = [
    {
        id: 'lux_car_chiron_300',
        name: 'Bugatti Chiron Super Sport 300+',
        brand: 'Bugatti',
        category: 'Hypercar',
        rarity: 'Legendary',
        price: 3900000, // $3.9M
        description:
            'The 304.77 mph record-breaking hypercar. 1,600 PS quad-turbo W16 engine with exposed matte carbon fiber body and Jet Orange aerodynamic stripes.',
        prestigeScore: 180,
        annualMaintenanceCost: 85000,
        appreciationRatePerYear: -0.02, // Depreciates slightly before stabilizing
        buffs: {
            socialReputation: 15,
            businessReputation: 10,
            happinessBoost: 25,
            statusTitle: 'Hypercar Connoisseur',
        },
        stock: 2,
        isAvailable: true,
    },
    {
        id: 'lux_re_belair_crown',
        name: 'The Bel-Air Crown Mega-Mansion',
        brand: 'Crown Estates Luxury',
        category: 'Mansion',
        rarity: 'UltraRare',
        price: 48500000, // $48.5M
        description:
            'A 38,000 sq ft architectural triumph nestled in Bel-Air. Includes two infinity edge pools, helipad, private bowling alley, and 30-vehicle climate gallery.',
        prestigeScore: 450,
        annualMaintenanceCost: 420000,
        appreciationRatePerYear: 0.05, // Appreciates +5% annually
        buffs: {
            socialReputation: 35,
            businessReputation: 25,
            happinessBoost: 40,
            stressReduction: 20,
            statusTitle: 'Estate Sovereign',
        },
        stock: 1,
        isAvailable: true,
    },
    {
        id: 'lux_jet_g700_flagship',
        name: 'Gulfstream G700 Flagship Jet',
        brand: 'Gulfstream Aerospace',
        category: 'PrivateJet',
        rarity: 'Legendary',
        price: 78000000, // $78M
        description:
            'The pinnacle of global private aviation. Mach 0.925 maximum speed, 7,500 nautical mile range, master bedroom with en-suite standing shower and ultra-quiet circadian lighting cabin.',
        prestigeScore: 650,
        annualMaintenanceCost: 1400000,
        appreciationRatePerYear: -0.04, // Aviation depreciation
        buffs: {
            socialReputation: 50,
            businessReputation: 45,
            happinessBoost: 35,
            stressReduction: 30,
            statusTitle: 'High-Altitude Monarch',
        },
        stock: 1,
        isAvailable: true,
    },
    {
        id: 'lux_watch_grandmaster_chime',
        name: 'Patek Philippe Grandmaster Chime 6300G',
        brand: 'Patek Philippe',
        category: 'HauteHorlogerie',
        rarity: 'OneOfAKind',
        price: 4200000, // $4.2M
        description:
            'The most complicated wristwatch ever crafted by Patek Philippe. Reversible double-face white gold case with 20 complications, 5 chiming modes, and hand-guilloched hobnail pattern.',
        prestigeScore: 220,
        annualMaintenanceCost: 12000,
        appreciationRatePerYear: 0.08, // Rare collector timepiece appreciates +8% annually
        buffs: {
            socialReputation: 20,
            businessReputation: 18,
            happinessBoost: 20,
            statusTitle: 'Horology Patron',
        },
        stock: 1,
        isAvailable: true,
    },
];

export const initialLuxoNetState: LuxoNetState = {
    catalog: initialLuxuryCatalog,
    ownedAssets: [],
    membershipTier: 'Black',
    _hasHydrated: false,
};

// ============================================================================
//  STORE CREATION
// ============================================================================

export const useLuxoNetStore = create<LuxoNetStore>()(
    persist(
        (set, get) => ({
            ...initialLuxoNetState,

            setHasHydrated: (v) => set({ _hasHydrated: v }),

            // --- Marketplace Transactions ---
            buyAsset: (assetId, currentYear = 2026, currentQuarter = 1): PurchaseResult => {
                const state = get();
                const catalogItem = state.catalog.find((item) => item.id === assetId);

                if (!catalogItem) {
                    return { success: false, error: 'Item not found in LuxoNet catalog.' };
                }

                if (!catalogItem.isAvailable || catalogItem.stock === 0) {
                    return { success: false, error: 'Item is currently out of stock or unavailable.' };
                }

                // Check and spend player personal funds
                const playerStore = usePlayerStore.getState();
                const currentMoney = playerStore.core.money;

                if (currentMoney < catalogItem.price) {
                    return {
                        success: false,
                        error: `Insufficient funds. Required: $${catalogItem.price.toLocaleString()}, Available: $${currentMoney.toLocaleString()}.`,
                    };
                }

                // Deduct cash from player
                const spent = playerStore.spendMoney(catalogItem.price);
                if (!spent) {
                    return { success: false, error: 'Transaction failed during funds withdrawal.' };
                }

                // Apply immediate buffs to player
                if (catalogItem.buffs.socialReputation) {
                    playerStore.updateReputation(
                        'social',
                        playerStore.reputation.social + catalogItem.buffs.socialReputation,
                    );
                }
                if (catalogItem.buffs.businessReputation) {
                    playerStore.updateReputation(
                        'business',
                        playerStore.reputation.business + catalogItem.buffs.businessReputation,
                    );
                }
                if (catalogItem.buffs.happinessBoost) {
                    playerStore.updateCore(
                        'happiness',
                        playerStore.core.happiness + catalogItem.buffs.happinessBoost,
                    );
                }

                // Instantiate new owned luxury asset
                const newOwnedAsset: OwnedLuxuryAsset = {
                    instanceId: generateInstanceId(),
                    assetId: catalogItem.id,
                    name: catalogItem.name,
                    brand: catalogItem.brand,
                    category: catalogItem.category,
                    rarity: catalogItem.rarity,
                    purchasePrice: catalogItem.price,
                    currentMarketValue: catalogItem.price,
                    purchasedAtYear: currentYear,
                    purchasedAtQuarter: currentQuarter,
                    condition: 100,
                    prestigeScore: catalogItem.prestigeScore,
                    annualMaintenanceCost: catalogItem.annualMaintenanceCost,
                    appreciationRatePerYear: catalogItem.appreciationRatePerYear,
                    buffs: catalogItem.buffs,
                };

                // Update catalog stock & owned assets array
                set((prev) => ({
                    ownedAssets: [...prev.ownedAssets, newOwnedAsset],
                    catalog: prev.catalog.map((item) =>
                        item.id === assetId && item.stock > 0
                            ? {
                                  ...item,
                                  stock: item.stock - 1,
                                  isAvailable: item.stock - 1 > 0,
                              }
                            : item,
                    ),
                }));

                return { success: true, asset: newOwnedAsset };
            },

            sellAsset: (instanceId): SaleResult => {
                const state = get();
                const targetAsset = state.ownedAssets.find((a) => a.instanceId === instanceId);

                if (!targetAsset) {
                    return { success: false, error: 'Asset not found in player portfolio.' };
                }

                // Calculate sale value factored by current condition (e.g. 100% condition = 100% market value)
                const conditionFactor = Math.max(0.4, targetAsset.condition / 100);
                const grossSaleValue = Math.round(targetAsset.currentMarketValue * conditionFactor);

                // Deposit funds into player's personal wallet
                const playerStore = usePlayerStore.getState();
                playerStore.earnMoney(grossSaleValue);

                // Remove from owned assets & restore catalog stock if applicable
                set((prev) => ({
                    ownedAssets: prev.ownedAssets.filter((a) => a.instanceId !== instanceId),
                    catalog: prev.catalog.map((item) =>
                        item.id === targetAsset.assetId && item.stock >= 0
                            ? { ...item, stock: item.stock + 1, isAvailable: true }
                            : item,
                    ),
                }));

                return { success: true, saleValue: grossSaleValue };
            },

            serviceAsset: (instanceId): ServiceResult => {
                const state = get();
                const targetAsset = state.ownedAssets.find((a) => a.instanceId === instanceId);

                if (!targetAsset) {
                    return { success: false, error: 'Asset not found.' };
                }

                if (targetAsset.condition >= 100) {
                    return { success: false, error: 'Asset is already in pristine condition.' };
                }

                const missingCondition = 100 - targetAsset.condition;
                // Service fee is proportional to annual maintenance cost and damage
                const serviceCost = Math.round(
                    (targetAsset.annualMaintenanceCost * 0.25) * (missingCondition / 100),
                );

                const playerStore = usePlayerStore.getState();
                if (playerStore.core.money < serviceCost) {
                    return {
                        success: false,
                        error: `Insufficient funds for servicing. Requires $${serviceCost.toLocaleString()}.`,
                    };
                }

                playerStore.spendMoney(serviceCost);

                set((prev) => ({
                    ownedAssets: prev.ownedAssets.map((asset) =>
                        asset.instanceId === instanceId
                            ? { ...asset, condition: 100 }
                            : asset,
                    ),
                }));

                return { success: true, cost: serviceCost };
            },

            renameAsset: (instanceId, newNickname) =>
                set((prev) => ({
                    ownedAssets: prev.ownedAssets.map((asset) =>
                        asset.instanceId === instanceId
                            ? { ...asset, customNickname: newNickname.trim() }
                            : asset,
                    ),
                })),

            quarterlyTick: (quartersPassed = 1) => {
                const state = get();
                let totalMaintenanceCost = 0;
                let portfolioNetValueChange = 0;

                const updatedAssets = state.ownedAssets.map((asset) => {
                    const quarterlyUpkeep = Math.round((asset.annualMaintenanceCost / 4) * quartersPassed);
                    totalMaintenanceCost += quarterlyUpkeep;

                    // Condition wear: Vehicles wear faster than Real Estate or Watches
                    const wearPerQuarter =
                        asset.category === 'Hypercar' || asset.category === 'Supercar'
                            ? 1.5
                            : asset.category === 'PrivateJet' || asset.category === 'Yacht'
                            ? 1.0
                            : 0.2;
                    const newCondition = Math.max(
                        20,
                        asset.condition - wearPerQuarter * quartersPassed,
                    );

                    // Market value appreciation/depreciation calculation
                    const quarterlyAppreciationRate =
                        (asset.appreciationRatePerYear / 4) * quartersPassed;
                    const newValue = Math.round(
                        asset.currentMarketValue * (1 + quarterlyAppreciationRate),
                    );
                    portfolioNetValueChange += newValue - asset.currentMarketValue;

                    return {
                        ...asset,
                        condition: newCondition,
                        currentMarketValue: newValue,
                    };
                });

                set({ ownedAssets: updatedAssets });

                return {
                    totalMaintenanceCost,
                    portfolioNetValueChange,
                };
            },

            // --- Queries / Computed Helpers ---
            isAssetOwned: (assetId) => {
                const state = get();
                return state.ownedAssets.some((asset) => asset.assetId === assetId);
            },

            getTotalPrestige: () => {
                const state = get();
                return state.ownedAssets.reduce((sum, asset) => sum + asset.prestigeScore, 0);
            },

            getTotalPortfolioValue: () => {
                const state = get();
                return state.ownedAssets.reduce((sum, asset) => sum + asset.currentMarketValue, 0);
            },

            getTotalAnnualMaintenance: () => {
                const state = get();
                return state.ownedAssets.reduce(
                    (sum, asset) => sum + asset.annualMaintenanceCost,
                    0,
                );
            },

            // --- Utility ---
            reset: () => set({ ...initialLuxoNetState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_luxonet_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                ownedAssets: state.ownedAssets,
                membershipTier: state.membershipTier,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
