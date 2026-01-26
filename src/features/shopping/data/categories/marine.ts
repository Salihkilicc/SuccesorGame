import { Shop, ShoppingItem } from '../../types';

// ============================================================================
// MARINE - OCEANS OF MONEY
// ============================================================================

export const marineData: { shops: Shop[], items: ShoppingItem[] } = {
    shops: [
        {
            id: 'shop_poseidon_yards',
            name: 'Poseidon Yards',
            url: 'www.poseidonyards.com',
            category: 'MARINE',
            description: 'Megayachts for the 0.001%.',
            bannerColor: '#3498DB',
            emoji: '⛵',
        },
        {
            id: 'shop_deep_blue_systems',
            name: 'Deep Blue Systems',
            url: 'www.deepblue.tech',
            category: 'MARINE',
            description: 'Conquer the abyss.',
            bannerColor: '#1F618D',
            emoji: '🌊',
        },
        {
            id: 'shop_horizon_cruisers',
            name: 'Horizon Cruisers',
            url: 'www.horizoncruise.luxury',
            category: 'MARINE',
            description: 'Own the fleet.',
            bannerColor: '#5DADE2',
            emoji: '🚢',
        },
    ],

    items: [
        // ========================================================================
        // POSEIDON YARDS - Megayachts
        // ========================================================================
        {
            id: 'mar_pos_001',
            shopId: 'shop_poseidon_yards',
            name: 'The Gigayacht',
            price: 1500000000,
            type: 'gigayacht',
            brand: 'Poseidon Custom',
            category: 'MARINE',
            specs: ['200m+ Length', 'Missile Defense', 'Mini-Sub Dock', '3 Helipads'],
            description: 'A floating city. Larger than most naval destroyers. The ultimate status symbol.',
        },
        {
            id: 'mar_pos_002',
            shopId: 'shop_poseidon_yards',
            name: 'The Sovereign',
            price: 600000000,
            type: 'megayacht',
            brand: 'Lürssen',
            category: 'MARINE',
            specs: ['160m Length', 'IMAX Cinema', 'Beach Club', 'Snow Room'],
            description: 'Built for royalty. Features an internal waterfall and cryogenic spa.',
        },
        {
            id: 'mar_pos_003',
            shopId: 'shop_poseidon_yards',
            name: 'Project X',
            price: 250000000,
            type: 'superyacht',
            brand: 'Feadship',
            category: 'MARINE',
            specs: ['100m Length', 'Glass Bottom Pool', 'Hybrid Propulsion', 'Art Gallery'],
            description: 'A masterpiece of modern design. The glass bottom pool sits above the atrium.',
        },
        {
            id: 'mar_pos_004',
            shopId: 'shop_poseidon_yards',
            name: 'Sailing Yacht A',
            price: 490000000,
            type: 'sailing_yacht',
            brand: 'Nobiskrug',
            category: 'MARINE',
            specs: ['143m Length', 'Tallest Masts', 'Underwater Obs', 'Bomb Proof'],
            description: 'The world\'s largest sailing yacht. Futuristic design by Philippe Starck.',
        },

        // ========================================================================
        // HORIZON CRUISERS - Commercial
        // ========================================================================
        {
            id: 'mar_hor_001',
            shopId: 'shop_horizon_cruisers',
            name: 'Global Cruise Ship',
            price: 1200000000,
            type: 'cruise_ship',
            brand: 'Royal Caribbean',
            category: 'MARINE',
            specs: ['5000 Passengers', '20 Decks', 'Water Park', 'Floating Resort'],
            description: 'Why rent a cabin when you can own the whole ship? A revenue generating machine.',
        },
        {
            id: 'mar_hor_002',
            shopId: 'shop_horizon_cruisers',
            name: 'Luxury Liner Class',
            price: 900000000,
            type: 'ocean_liner',
            brand: 'Cunard Style',
            category: 'MARINE',
            specs: ['Transatlantic', 'Reinforced Hull', 'Ballroom', 'Casino'],
            description: 'A modern classic ocean liner. Built for speed and luxury across the Atlantic.',
        },
        {
            id: 'mar_hor_003',
            shopId: 'shop_horizon_cruisers',
            name: 'The World Residence',
            price: 850000000,
            type: 'residential_ship',
            brand: 'Horizon',
            category: 'MARINE',
            specs: ['165 Apartments', 'Continual Voyage', 'Private Community', 'Floating Tax Haven'],
            description: 'A private residential ship that continuously circumnavigates the globe.',
        },

        // ========================================================================
        // DEEP BLUE SYSTEMS - Submarines
        // ========================================================================
        {
            id: 'mar_dbs_001',
            shopId: 'shop_deep_blue_systems',
            name: 'Military Grade Sub',
            price: 250000000,
            type: 'attack_sub',
            brand: 'Deep Blue',
            category: 'MARINE',
            specs: ['Demilitarized', 'Nuclear Powered', 'Unlimited Range', 'Sonar Stealth'],
            description: 'A decommissioned attack submarine refitted for private luxury exploration.',
        },
        {
            id: 'mar_dbs_002',
            shopId: 'shop_deep_blue_systems',
            name: 'Triton 36000/2',
            price: 45000000,
            type: 'ds_sub',
            brand: 'Triton',
            category: 'MARINE',
            specs: ['Full Ocean Depth', 'Titanium Hull', 'Challenger Deep', 'Research Grade'],
            description: 'The only private submersible capable of diving to the deepest point on Earth.',
        },
        {
            id: 'mar_dbs_003',
            shopId: 'shop_deep_blue_systems',
            name: 'Migaloo M5',
            price: 2000000000,
            type: 'submersible_yacht',
            brand: 'Migaloo',
            category: 'MARINE',
            specs: ['Submersible Yacht', 'Helipad', 'Pool', 'Underwater Views'],
            description: 'A megayacht that dives. The ultimate privacy machine.',
        },
    ],
};
