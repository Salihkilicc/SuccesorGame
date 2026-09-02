// ============================================================================
// LUXENET - BILLIONAIRE'S SHOPPING REGISTRY
// ============================================================================

import { Shop, ShoppingItem } from '../types';
import { realEstateData } from './categories/realEstate';
import { vehiclesData } from './categories/vehicles';
import { marineData } from './categories/marine';
import { aircraftData } from './categories/aircraft';
import { watchesData } from './categories/watches';
import { jewelryData } from './categories/jewelry';
import { spaceData } from './categories/space';

// ============================================================================
// AGGREGATE ALL SHOPS (25+ Distinct Brands)
// ============================================================================

export const SHOPS: Shop[] = [
    // Real Estate (6 shops)
    ...realEstateData.shops,

    // Vehicles (6 shops)
    ...vehiclesData.shops,

    // Marine (3 shops)
    ...marineData.shops,

    // Aircraft (3 shops)
    ...aircraftData.shops,

    // Watches (4 shops - Luxury Only)
    ...watchesData.shops,

    // Jewelry (5 shops)
    ...jewelryData.shops,

    // Space (2 shops). The top of the market. See categories/space.ts.
    ...spaceData.shops,
];

// ============================================================================
// AGGREGATE ALL ITEMS (The Inventory)
// ============================================================================

export const ITEMS: ShoppingItem[] = [
    // Real Estate
    ...realEstateData.items,

    // Vehicles
    ...vehiclesData.items,

    // Marine
    ...marineData.items,

    // Aircraft
    ...aircraftData.items,

    // Watches
    ...watchesData.items,

    // Jewelry
    ...jewelryData.items,

    // Space
    ...spaceData.items,
];

// ============================================================================
//  CATALOG TOTAL & PRESTIGE SCORING
// ============================================================================
//
//  THE SPACE DEPARTMENT BROKE THIS AND NOTHING NOTICED.
//
//  It used to be a straight share of the catalogue:
//
//      score = (ownedValue / TOTAL_CATALOG_VALUE) * 100
//
//  which is fine while every item is within an order of magnitude of every
//  other. Then the top of the market arrived and the catalogue went from
//  $34B to $2.02 TRILLION, with one item - the Ark - worth 48.5% of it on its
//  own. The scale is now a single object.
//
//  MEASURED on the linear formula, after:
//
//      a $1B collection      0.0
//      a $10B collection     0.5     <- a Tycoon, told they are a 0.5
//      a $50B collection     2.5
//      everything but space  13.1
//
//  So the number on the profile banner became useless across the entire range
//  a real player occupies, and it did so silently: prestige had no test, and
//  adding data to a catalogue is not the sort of change anybody re-checks a
//  display formula after.
//
//  ---------------------------------------------------------------------------
//  LOGARITHMIC, WHICH THIS GAME ALREADY DECIDED ONCE
//  ---------------------------------------------------------------------------
//  core/story/standing.wealthPrestige had the identical problem and solved it,
//  and its comment is the argument: "each factor of ten is worth the same,
//  which is also how people talk about money - the step from ten million to a
//  hundred feels like the step from a hundred million to a billion, and it is
//  not the same number of dollars."
//
//  The same shape here, between a floor and the catalogue's own total. Which
//  also makes it STABLE AGAINST GROWTH: adding another trillion dollar item
//  moves a ten billion dollar collection's score by about two points, where
//  the linear version halved it.
// ============================================================================

export const TOTAL_CATALOG_VALUE = ITEMS.reduce((sum, item) => sum + (item.price || 0), 0);

/**
 * Below this you own a ring, and a ring is not a collection.
 *
 * The floor of the scale rather than a special case: everything under it
 * scores zero, which is what "you have not started" should look like.
 */
export const PRESTIGE_FLOOR = 1_000_000;

/**
 * Where a collection sits, nought to a hundred.
 *
 * Logarithmic between `PRESTIGE_FLOOR` and the whole catalogue. See the note
 * above for why, and for what the linear version did the day space landed.
 */
export const calculatePrestigeScore = (ownedValue: number): number => {
    const owned = Number.isFinite(ownedValue) ? ownedValue : 0;
    if (owned <= PRESTIGE_FLOOR) return 0;
    if (TOTAL_CATALOG_VALUE <= PRESTIGE_FLOOR) return 0;
    if (owned >= TOTAL_CATALOG_VALUE) return 100;

    const span = Math.log10(TOTAL_CATALOG_VALUE) - Math.log10(PRESTIGE_FLOOR);
    const climbed = Math.log10(owned) - Math.log10(PRESTIGE_FLOOR);
    const raw = 100 * (climbed / span);
    return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
};

export const formatPrestigeScore = (ownedValue: number): string => {
    return calculatePrestigeScore(ownedValue).toFixed(1);
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Transform SHOPS into the old SHOP_DATA format if needed by legacy components
export const SHOP_DATA = SHOPS.map(shop => ({
    id: shop.id,
    name: shop.name,
    category: shop.category,
    items: ITEMS.filter(item => item.shopId === shop.id),
}));

// ============================================================================
// VALIDATION & INTEGRITY CHECK
// ============================================================================

export const validateLuxeNetData = () => {
    const shopIds = new Set(SHOPS.map(s => s.id));
    const orphanedItems = ITEMS.filter(item => !shopIds.has(item.shopId));

    if (orphanedItems.length > 0) {
        console.warn('⚠️ LUXENET ALERT: Found orphaned items (no matching shop):', orphanedItems.map(i => i.name));
    }

    // Check for duplicate IDs
    const itemIds = new Set();
    const duplicates: string[] = [];
    ITEMS.forEach(item => {
        if (itemIds.has(item.id)) duplicates.push(item.id);
        itemIds.add(item.id);
    });

    if (duplicates.length > 0) {
        console.warn('⚠️ LUXENET ALERT: Found duplicate Item IDs:', duplicates);
    }

    return {
        totalShops: SHOPS.length,
        totalItems: ITEMS.length,
        inventoryValue: ITEMS.reduce((acc, item) => acc + item.price, 0),
        categories: {
            REAL_ESTATE: SHOPS.filter(s => s.category === 'REAL_ESTATE').length,
            VEHICLE: SHOPS.filter(s => s.category === 'VEHICLE').length,
            MARINE: SHOPS.filter(s => s.category === 'MARINE').length,
            AIRCRAFT: SHOPS.filter(s => s.category === 'AIRCRAFT').length,
            WATCH: SHOPS.filter(s => s.category === 'WATCH').length,
            JEWELRY: SHOPS.filter(s => s.category === 'JEWELRY').length,
            SPACE: SHOPS.filter(s => s.category === 'SPACE').length,
        },
    };
};

if (__DEV__) {
    const stats = validateLuxeNetData();
    console.log('💎 LuxeNet Billionaire Market Loaded:', stats);
    console.log(`💰 Total Inventory Value: $${(stats.inventoryValue / 1000000000).toFixed(2)} Billion`);
}
