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
            bannerColor: '#FF8A8A',
            emoji: '⌚',
        },
        {
            id: 'shop_avant_garde',
            name: 'Cabinet Noir',
            url: 'www.cabinetnoir.watch',
            category: 'WATCH',
            description: 'Engineering insanity.',
            bannerColor: '#FF8A8A',
            emoji: '🎨',
        },
        {
            id: 'shop_legacy_time',
            name: 'Legacy Time',
            url: 'www.legacytime.auction',
            category: 'WATCH',
            description: 'History for sale.',
            bannerColor: '#FF8A8A',
            emoji: '🏆',
        },
        {
            id: 'shop_geneva_atelier',
            name: 'Geneva Atelier',
            url: 'www.genevaatelier.ch',
            category: 'WATCH',
            description: 'Bespoke brilliance.',
            bannerColor: '#05A8F6',
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
            name: 'Beaulieu & Fils Grand Sonnerie',
            price: 3000000, // Retail price, market is 30M+
            type: 'grand_complication',
            brand: 'Beaulieu & Fils',
            category: 'WATCH',
            specs: ['20 Complications', 'Reversible', 'Hand Engraved', 'Legendary'],
            description: 'The most complicated Beaulieu & Fils wristwatch ever made.',
        },
        {
            id: 'wat_chr_002',
            shopId: 'shop_chronos_swiss',
            name: 'Beaulieu & Fils Argonaut 5719 Robin Blue',
            price: 2500000, // Auction price level
            type: 'sports_watch',
            brand: 'Beaulieu & Fils',
            category: 'WATCH',
            specs: ['Robin Blue', 'Double Signed', 'Limited 170', 'Hype King'],
            description: 'The most famous dial in modern watch collecting. Instant status.',
        },
        {
            id: 'wat_chr_003',
            shopId: 'shop_chronos_swiss',
            name: 'Roche Royale Concept',
            price: 450000,
            type: 'concept_watch',
            brand: 'Roche Royale',
            category: 'WATCH',
            specs: ['Flying Tourbillon', 'Panther Dial', 'Titanium', 'Comic Collab'],
            description: 'Futuristic haute horlogerie meets pop culture.',
        },
        {
            id: 'wat_chr_004',
            shopId: 'shop_chronos_swiss',
            name: 'Valmont Constant Les Artisans',
            price: 1500000,
            type: 'bespoke',
            brand: 'Valmont Constant',
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
            name: 'Jasper & Co. Billionaire',
            price: 20000000,
            type: 'jewelry_watch',
            brand: 'Jasper & Co.',
            category: 'WATCH',
            specs: ['260ct Emerald Cut', 'Skeleton Tourbillon', '18k White Gold', 'Champion Owned'],
            description: 'Not just a name. Ensure everyone knows your net worth from across the room.',
        },
        {
            id: 'wat_avg_002',
            shopId: 'shop_avant_garde',
            name: 'Rion Meridien RM 58-02 Sapphire',
            price: 2500000,
            type: 'tourbillon',
            brand: 'Rion Meridien',
            category: 'WATCH',
            specs: ['Full Sapphire Case', 'Cable Suspended', 'Transparency', 'Unbreakable'],
            description: 'A movement suspended in space inside a case machined from pure sapphire.',
        },
        {
            id: 'wat_avg_003',
            shopId: 'shop_avant_garde',
            name: 'Vaurien W16 Tourbillon Blue Sapphire',
            price: 1500000,
            type: 'automotive_watch',
            brand: 'Jasper & Co.',
            category: 'WATCH',
            specs: ['Sapphire Case', 'Working W16', 'Piston Movement', 'Hypercar'],
            description: 'A tiny, working W16 engine on your wrist encased in blue sapphire.',
        },
        {
            id: 'wat_avg_004',
            shopId: 'shop_avant_garde',
            name: 'Rion Meridien RM 90 Grin',
            price: 3500000,
            type: 'tourbillon',
            brand: 'Rion Meridien',
            category: 'WATCH',
            specs: ['Micro Sculpture', 'Tourbillon', 'Playful', 'Producer Owned'],
            description: 'Whimsical luxury. A masterclass in micro-sculpture and mechanics.',
        },

        // ========================================================================
        // LEGACY TIME - Auction Grade
        // ========================================================================
        {
            id: 'wat_leg_001',
            shopId: 'shop_legacy_time',
            name: 'The Screen Idol Speedway',
            price: 17800000,
            type: 'vintage_icon',
            brand: 'Regulus',
            category: 'WATCH',
            specs: ['The Idol\'s Own', 'Exotic Dial', 'Engraved Gift', 'Holy Grail'],
            description: 'The actual watch worn by the screen idol who raced it. The most expensive Regulus ever sold.',
        },
        {
            id: 'wat_leg_002',
            shopId: 'shop_legacy_time',
            name: 'Beaulieu & Fils Ref. 1520 Steel',
            price: 11000000,
            type: 'vintage_comp',
            brand: 'Beaulieu & Fils',
            category: 'WATCH',
            specs: ['Stainless Steel', 'Perpetual Calendar', 'Chronograph', '1 of 4'],
            description: 'Steel is far more valuable than gold when it comes to vintage Beaulieu.',
        },
        {
            id: 'wat_leg_003',
            shopId: 'shop_legacy_time',
            name: 'Regulus "The Last Emperor" 6062',
            price: 5060000,
            type: 'vintage_complex',
            brand: 'Regulus',
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
            name: 'Gravelle Diamonds Mirage',
            price: 55000000,
            type: 'jewelry_piece',
            brand: 'Gravelle',
            category: 'WATCH',
            specs: ['110ct Colored Diamonds', 'Quartz', 'Rainbow', 'World\'s Most Expensive'],
            description: 'The most valuable watch in the world. A sculptural masterpiece of rare diamonds.',
        },
        {
            id: 'wat_gen_002',
            shopId: 'shop_geneva_atelier',
            name: 'Charbonnel 201-Carat',
            price: 25000000,
            type: 'jewelry_piece',
            brand: 'Charbonnel',
            category: 'WATCH',
            specs: ['201 Carats', 'Heart Specific', 'Spring Loaded', 'Blinding'],
            description: 'Three heart shaped diamonds reveal the watch dial. Contains 874 diamonds total.',
        },
    ],
};
