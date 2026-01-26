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
];

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
        },
    };
};

if (__DEV__) {
    const stats = validateLuxeNetData();
    console.log('💎 LuxeNet Billionaire Market Loaded:', stats);
    console.log(`💰 Total Inventory Value: $${(stats.inventoryValue / 1000000000).toFixed(2)} Billion`);
}
