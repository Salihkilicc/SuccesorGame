import { Shop, ShoppingItem } from '../../types';

// ============================================================================
// WATCHES - WRISTS OF GOLD (Min $150k)
// ============================================================================

export const watchesData: { shops: Shop[], items: ShoppingItem[] } = {
    shops: [
        {
            id: 'shop_chronos_swiss',
            name: 'Chronos Swiss',
            url: 'www.chronos.swiss',
            category: 'WATCH',
            description: 'Heritage and investment.',
            bannerColor: '#F1C40F',
            emoji: '⌚',
        },
        {
            id: 'shop_avant_garde',
            name: 'Avant Garde',
            url: 'www.avantgarde.luxury',
            category: 'WATCH',
            description: 'Engineering insanity.',
            bannerColor: '#E74C3C',
            emoji: '🎨',
        },
        {
            id: 'shop_legacy_time',
            name: 'Legacy Time',
            url: 'www.legacytime.auction',
            category: 'WATCH',
            description: 'History for sale.',
            bannerColor: '#D4AF37',
            emoji: '🏆',
        },
        {
            id: 'shop_geneva_atelier',
            name: 'Geneva Atelier',
            url: 'www.genevaatelier.ch',
            category: 'WATCH',
            description: 'Bespoke brilliance.',
            bannerColor: '#9B59B6',
            emoji: '💎',
        },
        // Removed low-end shops to maintain exclusivity
    ],

    items: [
        // ========================================================================
        // CHRONOS SWISS - Holy Trinity
        // ========================================================================
        {
            id: 'wat_chr_001',
            shopId: 'shop_chronos_swiss',
            name: 'Patek Philippe Grandmaster Chime',
            price: 3000000, // Retail price, market is 30M+
            type: 'grand_complication',
            brand: 'Patek Philippe',
            category: 'WATCH',
            specs: ['20 Complications', 'Reversible', 'Hand Engraved', 'Legendary'],
            description: 'The most complicated Patek Philippe wristwatch ever made.',
        },
        {
            id: 'wat_chr_002',
            shopId: 'shop_chronos_swiss',
            name: 'Patek Philippe Nautilus 5711 Tiffany',
            price: 2500000, // Auction price level
            type: 'sports_watch',
            brand: 'Patek Philippe',
            category: 'WATCH',
            specs: ['Tiffany Blue', 'Double Signed', 'Limited 170', 'Hype King'],
            description: 'The most famous dial in modern watch collecting. Instant status.',
        },
        {
            id: 'wat_chr_003',
            shopId: 'shop_chronos_swiss',
            name: 'Audemars Piguet Royal Oak Concept',
            price: 450000,
            type: 'concept_watch',
            brand: 'Audemars Piguet',
            category: 'WATCH',
            specs: ['Flying Tourbillon', 'Black Panther', 'Titanium', 'Marvel Collab'],
            description: 'Futuristic haute horlogerie meets pop culture.',
        },
        {
            id: 'wat_chr_004',
            shopId: 'shop_chronos_swiss',
            name: 'Vacheron Constantin Les Cabinotiers',
            price: 1500000,
            type: 'bespoke',
            brand: 'Vacheron Constantin',
            category: 'WATCH',
            specs: ['Unique Piece', 'Grande Sonnerie', 'Symphonia', 'Art'],
            description: 'A unique piece created by the oldest watchmaker in continuous luxury.',
        },

        // ========================================================================
        // AVANT GARDE - Tech Luxury
        // ========================================================================
        {
            id: 'wat_avg_001',
            shopId: 'shop_avant_garde',
            name: 'Jacob & Co. Billionaire',
            price: 20000000,
            type: 'jewelry_watch',
            brand: 'Jacob & Co.',
            category: 'WATCH',
            specs: ['260ct Emerald Cut', 'Skeleton Tourbillon', '18k White Gold', 'Floyd Owned'],
            description: 'Not just a name. Ensure everyone knows your net worth from across the room.',
        },
        {
            id: 'wat_avg_002',
            shopId: 'shop_avant_garde',
            name: 'Richard Mille RM 56-02 Sapphire',
            price: 2500000,
            type: 'tourbillon',
            brand: 'Richard Mille',
            category: 'WATCH',
            specs: ['Full Sapphire Case', 'Cable Suspended', 'Transparency', 'Unbreakable'],
            description: 'A movement suspended in space inside a case machined from pure sapphire.',
        },
        {
            id: 'wat_avg_003',
            shopId: 'shop_avant_garde',
            name: 'Bugatti Chiron Tourbillon Blue Sapphire',
            price: 1500000,
            type: 'automotive_watch',
            brand: 'Jacob & Co.',
            category: 'WATCH',
            specs: ['Sapphire Case', 'Working W16', 'Piston Movement', 'Hypercar'],
            description: 'A tiny, working W16 engine on your wrist encased in blue sapphire.',
        },
        {
            id: 'wat_avg_004',
            shopId: 'shop_avant_garde',
            name: 'Richard Mille RM 88 Smiley',
            price: 3500000,
            type: 'tourbillon',
            brand: 'Richard Mille',
            category: 'WATCH',
            specs: ['Micro Sculpture', 'Tourbillon', 'Playful', 'Pharrell'],
            description: 'Whimsical luxury. A masterclass in micro-sculpture and mechanics.',
        },

        // ========================================================================
        // LEGACY TIME - Auction Grade
        // ========================================================================
        {
            id: 'wat_leg_001',
            shopId: 'shop_legacy_time',
            name: 'Paul Newman Daytona',
            price: 17800000,
            type: 'vintage_icon',
            brand: 'Rolex',
            category: 'WATCH',
            specs: ['Paul Newman\'s Own', 'Exotic Dial', 'Gift from Joanne', 'Holy Grail'],
            description: 'The actual watch worn by Paul Newman. The most expensive Rolex ever sold.',
        },
        {
            id: 'wat_leg_002',
            shopId: 'shop_legacy_time',
            name: 'Patek Philippe Ref. 1518 Steel',
            price: 11000000,
            type: 'vintage_comp',
            brand: 'Patek Philippe',
            category: 'WATCH',
            specs: ['Stainless Steel', 'Perpetual Calendar', 'Chronograph', '1 of 4'],
            description: 'Steel is far more valuable than gold when it comes to vintage Patek.',
        },
        {
            id: 'wat_leg_003',
            shopId: 'shop_legacy_time',
            name: 'Rolex "Bao Dai" 6062',
            price: 5060000,
            type: 'vintage_complex',
            brand: 'Rolex',
            category: 'WATCH',
            specs: ['Emperor Owned', 'Black Dial', 'Diamond Markers', 'Unique'],
            description: 'Belonged to the last Emperor of Vietnam. A unique piece of history.',
        },

        // ========================================================================
        // GENEVA ATELIER - Bespoke
        // ========================================================================
        {
            id: 'wat_gen_001',
            shopId: 'shop_geneva_atelier',
            name: 'Graff Diamonds Hallucination',
            price: 55000000,
            type: 'jewelry_piece',
            brand: 'Graff',
            category: 'WATCH',
            specs: ['110ct Colored Diamonds', 'Quartz', 'Rainbow', 'World\'s Most Expensive'],
            description: 'The most valuable watch in the world. A sculptural masterpiece of rare diamonds.',
        },
        {
            id: 'wat_gen_002',
            shopId: 'shop_geneva_atelier',
            name: 'Chopard 201-Carat',
            price: 25000000,
            type: 'jewelry_piece',
            brand: 'Chopard',
            category: 'WATCH',
            specs: ['201 Carats', 'Heart Specific', 'Spring Loaded', 'Blinding'],
            description: 'Three heart shaped diamonds reveal the watch dial. Contains 874 diamonds total.',
        },
    ],
};
