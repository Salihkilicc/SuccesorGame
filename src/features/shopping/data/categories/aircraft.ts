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
            bannerColor: '#9B59B6',
            emoji: '✈️',
        },
        {
            id: 'shop_mach1_defense',
            name: 'Mach 1 Defense',
            url: 'www.mach1defense.mil',
            category: 'AIRCRAFT',
            description: 'Supersonic superiority.',
            bannerColor: '#34495E',
            emoji: '🚀',
        },
        {
            id: 'shop_cloud9_copters',
            name: 'Cloud 9 Copters',
            url: 'www.cloud9copters.com',
            category: 'AIRCRAFT',
            description: 'Vertical luxury.',
            bannerColor: '#16A085',
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
            name: 'The Flying Palace (A380 Custom)',
            price: 650000000,
            type: 'jumbo_jet',
            brand: 'Airbus',
            category: 'AIRCRAFT',
            specs: ['Double Decker', 'Gold Plated', 'Flying Spa', 'Concert Hall'],
            description: 'A private Airbus A380 refitted for a prince. The largest private jet on Earth.',
        },
        {
            id: 'air_eli_002',
            shopId: 'shop_elitas_travel',
            name: 'Boeing Business Jet 747-8',
            price: 450000000,
            type: 'jumbo_jet',
            brand: 'Boeing',
            category: 'AIRCRAFT',
            specs: ['Queen of Skies', 'Master Suite', 'Dining for 14', 'Aeroloft'],
            description: 'The iconic 747 configured for private use. 4,800 sq ft of cabin space.',
        },
        {
            id: 'air_eli_003',
            shopId: 'shop_elitas_travel',
            name: 'Bombardier Global 8000',
            price: 85000000,
            type: 'private_jet',
            brand: 'Bombardier',
            category: 'AIRCRAFT',
            specs: ['8000nm Range', 'Mach 0.94', 'Zero Gravity Seats', 'Flagship'],
            description: 'The fastest and longest-range business jet. London to Perth non-stop.',
        },
        {
            id: 'air_eli_004',
            shopId: 'shop_elitas_travel',
            name: 'Gulfstream G700',
            price: 78000000,
            type: 'private_jet',
            brand: 'Gulfstream',
            category: 'AIRCRAFT',
            specs: ['5 Living Areas', 'Circadian Lighting', 'Whisper Quiet', 'Speed Record'],
            description: 'The pinnacle of American business aviation. Unmatched comfort and speed.',
        },

        // ========================================================================
        // MACH 1 DEFENSE - Military Grade
        // ========================================================================
        {
            id: 'air_m1d_001',
            shopId: 'shop_mach1_defense',
            name: 'F-22 Raptor (Demilitarized)',
            price: 350000000,
            type: 'stealth_fighter',
            brand: 'Lockheed Martin',
            category: 'AIRCRAFT',
            specs: ['Stealth', 'Supercruise', 'Vector Thrust', 'Air Superiority'],
            description: 'The most advanced fighter jet ever made. Weapons systems disabled, adrenaline intact.',
        },
        {
            id: 'air_m1d_002',
            shopId: 'shop_mach1_defense',
            name: 'Black Hawk Chopper',
            price: 30000000,
            type: 'military_heli',
            brand: 'Sikorsky',
            category: 'AIRCRAFT',
            specs: ['Armored', 'Twin Engine', 'Special Ops', 'Rugged'],
            description: 'The legendary UH-60. Civilian conversion with military-grade durability.',
        },
        {
            id: 'air_m1d_003',
            shopId: 'shop_mach1_defense',
            name: 'MiG-29 Fulcrum',
            price: 25000000,
            type: 'fighter_jet',
            brand: 'Mikoyan',
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
            name: 'Sikorsky S-92 VIP',
            price: 32000000,
            type: 'heavy_heli',
            brand: 'Sikorsky',
            category: 'AIRCRAFT',
            specs: ['Marine One Spec', 'Stand-up Cabin', 'Shower', 'Anti-Vibration'],
            description: 'The chosen transport of heads of state. The S-Class of the skies.',
        },
        {
            id: 'air_c9c_002',
            shopId: 'shop_cloud9_copters',
            name: 'Airbus ACH160',
            price: 18000000,
            type: 'luxury_heli',
            brand: 'Airbus',
            category: 'AIRCRAFT',
            specs: ['Blue Edge Blades', 'Silent Flight', 'Panoramic', 'Style'],
            description: 'The most technologically advanced helicopter. Ultra-quiet operations.',
        },
    ],
};
