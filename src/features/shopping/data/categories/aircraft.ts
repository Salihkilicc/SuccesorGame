import { Shop, ShoppingItem } from '../../types';

// ============================================================================
// AIRCRAFT - SKY HIGH SPENDING
// ============================================================================

export const aircraftData: { shops: Shop[], items: ShoppingItem[] } = {
    shops: [
        {
            id: 'shop_elitas_travel',
            name: 'Elitas Travel',
            url: 'www.elitas.aero',
            category: 'AIRCRAFT',
            description: 'Your palace in the clouds.',
            bannerColor: '#05A8F6',
            emoji: '✈️',
        },
        {
            id: 'shop_mach1_defense',
            name: 'Mach 1 Defense',
            url: 'www.mach1defense.mil',
            category: 'AIRCRAFT',
            description: 'Supersonic superiority.',
            bannerColor: '#535B5F',
            emoji: '🚀',
        },
        {
            id: 'shop_cloud9_copters',
            name: 'Cloud 9 Copters',
            url: 'www.cloud9copters.com',
            category: 'AIRCRAFT',
            description: 'Vertical luxury.',
            bannerColor: '#CFD0D2',
            emoji: '🚁',
        },
    ],

    items: [
        // ========================================================================
        // ELITAS TRAVEL - Jets
        // ========================================================================
        {
            id: 'air_eli_001',
            shopId: 'shop_elitas_travel',
            name: 'The Flying Palace (S900 Custom)',
            price: 650000000,
            type: 'jumbo_jet',
            brand: 'Continental Aerospace',
            category: 'AIRCRAFT',
            specs: ['Double Decker', 'Gold Plated', 'Flying Spa', 'Concert Hall'],
            description: 'A private Continental S900 refitted for a prince. The largest private jet on Earth.',
        },
        {
            id: 'air_eli_002',
            shopId: 'shop_elitas_travel',
            name: 'Meridian Business Jet 800-8',
            price: 450000000,
            type: 'jumbo_jet',
            brand: 'Meridian Aero',
            category: 'AIRCRAFT',
            specs: ['Queen of the Skies', 'Master Suite', 'Dining for 14', 'Upper Loft'],
            description: 'The iconic 800 configured for private use. 4,800 sq ft of cabin space.',
        },
        {
            id: 'air_eli_003',
            shopId: 'shop_elitas_travel',
            name: 'Northwind Global 8000',
            price: 85000000,
            type: 'private_jet',
            brand: 'Northwind',
            category: 'AIRCRAFT',
            specs: ['8000nm Range', 'Mach 0.94', 'Zero Gravity Seats', 'Flagship'],
            description: 'The fastest and longest-range business jet. London to Perth non-stop.',
        },
        {
            id: 'air_eli_004',
            shopId: 'shop_elitas_travel',
            name: 'Silverstream S700',
            price: 78000000,
            type: 'private_jet',
            brand: 'Silverstream',
            category: 'AIRCRAFT',
            specs: ['5 Living Areas', 'Circadian Lighting', 'Whisper Quiet', 'Speed Record'],
            description: 'The pinnacle of American business aviation. Unmatched comfort and speed.',
        },
        {
            id: 'air_eli_005',
            shopId: 'shop_elitas_travel',
            name: 'The Standing Fleet',
            price: 2100000000,
            type: 'fleet',
            brand: 'Elitas Travel',
            category: 'AIRCRAFT',
            specs: ['Nine Airframes', 'Crewed Always', 'Four Continents', 'Never Grounded'],
            description: 'Nine aircraft on four continents, fuelled and crewed, so that one is always an hour away.',
        },

        // ========================================================================
        // MACH 1 DEFENSE - Military Grade
        // ========================================================================
        {
            id: 'air_m1d_001',
            shopId: 'shop_mach1_defense',
            name: 'FX-9 Talon (Demilitarized)',
            price: 350000000,
            type: 'stealth_fighter',
            brand: 'Ironhead Defense',
            category: 'AIRCRAFT',
            specs: ['Stealth', 'Supercruise', 'Vector Thrust', 'Air Superiority'],
            description: 'The most advanced fighter jet ever made. Weapons systems disabled, adrenaline intact.',
        },
        {
            id: 'air_m1d_002',
            shopId: 'shop_mach1_defense',
            name: 'Nightjar Chopper',
            price: 30000000,
            type: 'military_heli',
            brand: 'Halcyon Rotors',
            category: 'AIRCRAFT',
            specs: ['Armored', 'Twin Engine', 'Special Ops', 'Rugged'],
            description: 'The legendary NH-60. Civilian conversion with military-grade durability.',
        },
        {
            id: 'air_m1d_003',
            shopId: 'shop_mach1_defense',
            name: 'Volkov V-29 Fulcrum',
            price: 25000000,
            type: 'fighter_jet',
            brand: 'Volkov',
            category: 'AIRCRAFT',
            specs: ['Mach 2.25', 'High G-Force', 'Cobra Maneuver', 'Cold War Icon'],
            description: 'Soviet air superiority. Capable of vertical takeoffs and intense aerobatics.',
        },

        // ========================================================================
        // CLOUD 9 COPTERS - Luxury Heli
        // ========================================================================
        {
            id: 'air_c9c_001',
            shopId: 'shop_cloud9_copters',
            name: 'Halcyon H-92 VIP',
            price: 32000000,
            type: 'heavy_heli',
            brand: 'Halcyon Rotors',
            category: 'AIRCRAFT',
            specs: ['Head of State Spec', 'Stand-up Cabin', 'Shower', 'Anti-Vibration'],
            description: 'The chosen transport of heads of state. The state limousine of the skies.',
        },
        {
            id: 'air_c9c_002',
            shopId: 'shop_cloud9_copters',
            name: 'Continental CH-160',
            price: 18000000,
            type: 'luxury_heli',
            brand: 'Continental Aerospace',
            category: 'AIRCRAFT',
            specs: ['Blue Edge Blades', 'Silent Flight', 'Panoramic', 'Style'],
            description: 'The most technologically advanced helicopter. Ultra-quiet operations.',
        },
    ],
};
