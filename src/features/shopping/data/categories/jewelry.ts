import { Shop, ShoppingItem } from '../../types';

// ============================================================================
// JEWELRY - Rare Gems & Wedding Rings
// ============================================================================

export const jewelryData: { shops: Shop[], items: ShoppingItem[] } = {
    shops: [
        {
            id: 'shop_gem_vault',
            name: 'The Gem Vault',
            url: 'www.gemvault.museum',
            category: 'JEWELRY',
            description: 'Museum grade stones.',
            bannerColor: '#9B59B6',
            emoji: '💎',
        },
        {
            id: 'shop_aurum_co',
            name: 'Aurum & Co.',
            url: 'www.aurum.luxury',
            category: 'JEWELRY',
            description: 'Heavy metal.',
            bannerColor: '#F39C12',
            emoji: '👑',
        },
        {
            id: 'shop_imperial_crown',
            name: 'Imperial Crown',
            url: 'www.imperial.royal',
            category: 'JEWELRY',
            description: 'Fit for a queen.',
            bannerColor: '#8E44AD',
            emoji: '🤴',
        },
        {
            id: 'shop_vow_eternity',
            name: 'Vow & Eternity',
            url: 'www.voweternity.love',
            category: 'JEWELRY',
            description: 'Begin your legacy.',
            bannerColor: '#E74C3C',
            emoji: '💍',
        },
        {
            id: 'shop_ice_district',
            name: 'Ice District',
            url: 'www.ice.vip',
            category: 'JEWELRY',
            description: 'Frozen in time.',
            bannerColor: '#3498DB',
            emoji: '❄️',
        }
    ],

    items: [
        // ========================================================================
        // THE GEM VAULT - Rare Stones
        // ========================================================================
        {
            id: 'jew_gem_001',
            shopId: 'shop_gem_vault',
            name: 'The Pink Star Diamond',
            price: 71000000,
            type: 'loose_diamond',
            brand: 'Nature',
            category: 'JEWELRY',
            specs: ['59.60 Carats', 'Fancy Vivid Pink', 'Internally Flawless', 'Record Breaker'],
            description: 'The most valuable gemstone ever sold at auction. A pink miracle.',
        },
        {
            id: 'jew_gem_002',
            shopId: 'shop_gem_vault',
            name: 'The Oppenheimer Blue',
            price: 57500000,
            type: 'loose_diamond',
            brand: 'Nature',
            category: 'JEWELRY',
            specs: ['14.62 Carats', 'Fancy Vivid Blue', 'Emerald Cut', 'Legendary'],
            description: 'The largest Fancy Vivid Blue diamond ever to appear at auction.',
        },
        {
            id: 'jew_gem_003',
            shopId: 'shop_gem_vault',
            name: 'Hope Diamond Replica',
            price: 25000000,
            type: 'necklace',
            brand: 'Harry Winston',
            category: 'JEWELRY',
            specs: ['45.52 Carats', 'Deep Blue', 'Cursed?', 'Museum Quality'],
            description: 'A perfect recreation of the legendary cursed diamond using distinct blue diamonds.',
        },
        {
            id: 'jew_gem_004',
            shopId: 'shop_gem_vault',
            name: 'The Orange',
            price: 36000000,
            type: 'loose_diamond',
            brand: 'Nature',
            category: 'JEWELRY',
            specs: ['14.82 Carats', 'Fancy Vivid Orange', 'Pear Shape', 'Fire'],
            description: 'The largest Fancy Vivid Orange diamond in existence.',
        },

        // ========================================================================
        // VOW & ETERNITY - Wedding Rings (Accessible)
        // ========================================================================
        {
            id: 'jew_vow_001',
            shopId: 'shop_vow_eternity',
            name: 'Classic Solitaire',
            price: 20000,
            type: 'engagement_ring',
            brand: 'Vow & Eternity',
            category: 'JEWELRY',
            specs: ['1.5 Carat', 'Round Brilliant', 'Platinum Band', 'Timeless'],
            description: 'The standard for expressing eternal love. Simple, elegant, perfect.',
        },
        {
            id: 'jew_vow_002',
            shopId: 'shop_vow_eternity',
            name: 'The Royal Halo',
            price: 45000,
            type: 'engagement_ring',
            brand: 'Vow & Eternity',
            category: 'JEWELRY',
            specs: ['2.0 Carat Center', 'Pavé Halo', 'White Gold', 'Sparkling'],
            description: 'A brilliant center stone surrounded by a halo of light.',
        },
        {
            id: 'jew_vow_003',
            shopId: 'shop_vow_eternity',
            name: 'Princess Cut Promise',
            price: 85000,
            type: 'engagement_ring',
            brand: 'Vow & Eternity',
            category: 'JEWELRY',
            specs: ['3.0 Carat', 'Princess Cut', 'Channel Set', 'Modern'],
            description: 'Sharp lines and brilliant fire for the modern royalty.',
        },
        {
            id: 'jew_vow_004',
            shopId: 'shop_vow_eternity',
            name: 'Celebrity Emerald Cut',
            price: 500000,
            type: 'engagement_ring',
            brand: 'Vow & Eternity',
            category: 'JEWELRY',
            specs: ['8.0 Carat', 'Emerald Cut', 'Flawless', 'Statement'],
            description: 'The distinct cut preferred by Hollywood icons. Massive and clear.',
        },
        {
            id: 'jew_vow_005',
            shopId: 'shop_vow_eternity',
            name: 'Vintage Estate Ring',
            price: 150000,
            type: 'engagement_ring',
            brand: 'Cartier Vintage',
            category: 'JEWELRY',
            specs: ['Art Deco', 'Old Mine Cut', 'Sapphire Accents', '1920s'],
            description: 'A piece of history for a love that will last forever.',
        },

        // ========================================================================
        // IMPERIAL CROWN - Tiaras
        // ========================================================================
        {
            id: 'jew_imp_001',
            shopId: 'shop_imperial_crown',
            name: 'The Spencer Tiara Replica',
            price: 5000000,
            type: 'tiara',
            brand: 'Imperial Crown',
            category: 'JEWELRY',
            specs: ['Diamonds', 'Silver', 'Scrollwork', 'Princess'],
            description: 'Wear the same design that defined a royal wedding.',
        },
        {
            id: 'jew_imp_002',
            shopId: 'shop_imperial_crown',
            name: 'Emerald Kokoshnik',
            price: 12000000,
            type: 'tiara',
            brand: 'Boucheron',
            category: 'JEWELRY',
            specs: ['Emeralds', 'Platinum', 'Russian Style', 'Grand'],
            description: 'A massive wall of emeralds and diamonds in the Russian imperial style.',
        },

        // ========================================================================
        // AURUM & CO - High Gold
        // ========================================================================
        {
            id: 'jew_aur_001',
            shopId: 'shop_aurum_co',
            name: 'Solid Gold Shirt',
            price: 250000,
            type: 'apparel',
            brand: 'Aurum',
            category: 'JEWELRY',
            specs: ['24k Woven Gold', '3kg Weight', 'Velvet Lined', 'Impact'],
            description: 'Why wear fabric when you can wear bullion? Literally a shirt made of gold.',
        },
        {
            id: 'jew_aur_002',
            shopId: 'shop_aurum_co',
            name: 'Panthère Necklace',
            price: 450000,
            type: 'necklace',
            brand: 'Cartier',
            category: 'JEWELRY',
            specs: ['Onyx', 'Emeralds', 'Diamonds', 'Iconic'],
            description: 'The stalking panther motif, draped in diamonds and gold.',
        },
    ],
};
