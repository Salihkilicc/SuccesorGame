/**
 * BLACK MARKET DATA - MASSIVE CATALOG
 * 
 * Comprehensive illegal items catalog with tier-based Street Rep system.
 * Tiers are auto-assigned based on price ranges.
 */

// --- TYPES ---

export type BlackMarketCategory = 'art' | 'antique' | 'jewelry' | 'weapon' | 'substance';

export type ReputationTier = 1 | 2 | 3 | 4;

export interface BlackMarketItem {
    id: string;
    name: string;
    price: number;
    type: BlackMarketCategory;
    description: string;
    tier: ReputationTier;
    streetRepGain: number;
    isDrug?: boolean;
}

// --- TIER SYSTEM ---

/**
 * Tier Assignment based on Price:
 * - Tier 1: $0 - $100k → +0.2 Street Rep
 * - Tier 2: $100k - $10M → +0.5 Street Rep
 * - Tier 3: $10M - $100M → +0.7 Street Rep
 * - Tier 4: $100M+ → +1.0 Street Rep + High Society +5
 */
const calculateTier = (price: number): { tier: ReputationTier; streetRepGain: number } => {
    if (price >= 100_000_000) return { tier: 4, streetRepGain: 1.0 };
    if (price >= 10_000_000) return { tier: 3, streetRepGain: 0.7 };
    if (price >= 100_000) return { tier: 2, streetRepGain: 0.5 };
    return { tier: 1, streetRepGain: 0.2 };
};

// --- HELPER: Convert raw item to BlackMarketItem ---
const createItem = (
    id: string,
    name: string,
    price: number,
    type: BlackMarketCategory,
    description: string,
    isDrug: boolean = false
): BlackMarketItem => {
    const { tier, streetRepGain } = calculateTier(price);
    return {
        id,
        name,
        price,
        type,
        description,
        tier,
        streetRepGain: isDrug ? streetRepGain * 0.5 : streetRepGain, // Drugs give 50% rep
        isDrug
    };
};

// --- ARTS (50 items) ---
const RAW_ARTS = [
    { id: 'art_1', name: 'Mona Lisa (Stolen)', price: 850000000, description: 'The smile is more mysterious up close.' },
    { id: 'art_2', name: 'Starry Night (Original)', price: 120000000, description: 'Swirling energy trapped on canvas.' },
    { id: 'art_3', name: 'The Scream (1893)', price: 200000000, description: 'You can hear it if you listen closely.' },
    { id: 'art_4', name: 'Girl with a Pearl Earring', price: 150000000, description: 'Her eyes follow you everywhere.' },
    { id: 'art_5', name: 'Salvator Mundi', price: 450000000, description: 'The lost masterpiece of the master.' },
    { id: 'art_6', name: 'Guernica (Fragment)', price: 300000000, description: 'A piece of history\'s suffering.' },
    { id: 'art_7', name: 'The Last Supper (Sketch)', price: 180000000, description: 'Da Vinci\'s original concept.' },
    { id: 'art_8', name: 'Creation of Adam (Cutout)', price: 600000000, description: 'The touch of god, literally.' },
    { id: 'art_9', name: 'The Night Watch', price: 500000000, description: 'Shadows that seem to move.' },
    { id: 'art_10', name: 'Venus de Milo (Arms)', price: 100000000, description: 'The missing pieces.' },
    { id: 'art_11', name: 'The Birth of Venus', price: 400000000, description: 'Pure beauty emerging from the sea.' },
    { id: 'art_12', name: 'Las Meninas', price: 350000000, description: 'A painting within a painting.' },
    { id: 'art_13', name: 'School of Athens', price: 550000000, description: 'Wisdom of the ages captured.' },
    { id: 'art_14', name: 'The Kiss (Klimt)', price: 250000000, description: 'Golden embrace.' },
    { id: 'art_15', name: 'American Gothic', price: 80000000, description: 'Stoic and unsettling.' },
    { id: 'art_16', name: 'Whistler\'s Mother', price: 70000000, description: 'The ultimate symbol of motherhood.' },
    { id: 'art_17', name: 'The Persistence of Memory', price: 160000000, description: 'Time melts away here.' },
    { id: 'art_18', name: 'Portrait of Dr. Gachet', price: 140000000, description: 'Melancholy in blue.' },
    { id: 'art_19', name: 'Bal du moulin de la Galette', price: 130000000, description: 'Joy of life in Paris.' },
    { id: 'art_20', name: 'No. 5, 1948', price: 190000000, description: 'Chaos or genius?' },
    { id: 'art_21', name: 'Woman III', price: 170000000, description: 'Abstract expressionist power.' },
    { id: 'art_22', name: 'Le Rêve', price: 210000000, description: 'A dream of vibrant colors.' },
    { id: 'art_23', name: 'Adele Bloch-Bauer I', price: 220000000, description: 'The woman in gold.' },
    { id: 'art_24', name: 'Interchange', price: 300000000, description: 'Abstract landscape.' },
    { id: 'art_25', name: 'Card Players', price: 280000000, description: 'Tension over a game.' },
    { id: 'art_26', name: 'Nafea Faa Ipoipo', price: 260000000, description: 'Exotic beauty.' },
    { id: 'art_27', name: 'Number 17A', price: 240000000, description: 'Pollock\'s rhythmic drips.' },
    { id: 'art_28', name: 'Wasserschlangen II', price: 185000000, description: 'Serpentine grace.' },
    { id: 'art_29', name: 'No. 6 (Violet, Green and Red)', price: 186000000, description: 'Rothko\'s emotional blocks.' },
    { id: 'art_30', name: 'Pendant Portraits', price: 180000000, description: 'Rembrandt\'s wedding pair.' },
    { id: 'art_31', name: 'Les Femmes d\'Alger', price: 179000000, description: 'Picasso\'s harem.' },
    { id: 'art_32', name: 'Nu couché', price: 175000000, description: 'Modigliani\'s masterpiece.' },
    { id: 'art_33', name: 'Masterpiece', price: 165000000, description: 'Pop art irony.' },
    { id: 'art_34', name: 'Three Studies of Lucian Freud', price: 145000000, description: 'Distorted reality.' },
    { id: 'art_35', name: 'Twelve Landscape Screens', price: 140000000, description: 'Eastern horizons.' },
    { id: 'art_36', name: 'Garçon à la pipe', price: 135000000, description: 'Young Picasso.' },
    { id: 'art_37', name: 'Otahi', price: 125000000, description: 'Tahitian solitude.' },
    { id: 'art_38', name: 'Dora Maar au Chat', price: 115000000, description: 'Picasso\'s muse.' },
    { id: 'art_39', name: 'Irises', price: 110000000, description: 'Van Gogh\'s garden.' },
    { id: 'art_40', name: 'Eight Elvises', price: 105000000, description: 'Warhol\'s king.' },
    { id: 'art_41', name: 'Anna\'s Light', price: 100000000, description: 'Abstract brilliance.' },
    { id: 'art_42', name: 'Silver Car Crash', price: 95000000, description: 'Grim reality.' },
    { id: 'art_43', name: 'Nurse', price: 90000000, description: 'Lichtenstein classic.' },
    { id: 'art_44', name: 'Portrait of an Artist', price: 90000000, description: 'Poolside reflection.' },
    { id: 'art_45', name: 'Chop Suey', price: 85000000, description: 'Hopper\'s diner.' },
    { id: 'art_46', name: 'False Start', price: 84000000, description: 'Color explosion.' },
    { id: 'art_47', name: 'Black Fire I', price: 82000000, description: 'Monochrome power.' },
    { id: 'art_48', name: 'Orange, Red, Yellow', price: 81000000, description: 'Warmth on canvas.' },
    { id: 'art_49', name: 'White Center', price: 78000000, description: 'Rothko\'s balance.' },
    { id: 'art_50', name: 'Green Car Crash', price: 75000000, description: 'Warhol\'s tragedy.' }
];

export const BLACK_MARKET_ARTS: BlackMarketItem[] = RAW_ARTS.map(item =>
    createItem(item.id, item.name, item.price, 'art', item.description)
);

// --- ANTIQUES (50 items) ---
const RAW_ANTIQUES = [
    { id: 'ant_1', name: 'Tutankhamun\'s Dagger', price: 250000000, description: 'Forged from a meteorite.' },
    { id: 'ant_2', name: 'The Rosetta Stone', price: 450000000, description: 'The key to history.' },
    { id: 'ant_3', name: 'Ming Dynasty Vase', price: 50000000, description: 'Fragile perfection.' },
    { id: 'ant_4', name: 'Excalibur Sword (Fake?)', price: 80000000, description: 'Legendary blade, or a replica?' },
    { id: 'ant_5', name: 'Pandora\'s Box', price: 500000000, description: 'Don\'t open it.' },
    { id: 'ant_6', name: 'Dead Sea Scrolls', price: 150000000, description: 'Ancient wisdom.' },
    { id: 'ant_7', name: 'The Ark of the Covenant', price: 400000000, description: 'Radiates power.' },
    { id: 'ant_8', name: 'Terracotta Warrior', price: 30000000, description: 'A silent guardian.' },
    { id: 'ant_9', name: 'The Holy Grail', price: 500000000, description: 'Eternal life?' },
    { id: 'ant_10', name: 'Bust of Nefertiti', price: 350000000, description: 'Timeless beauty.' },
    { id: 'ant_11', name: 'The Golden Fleece', price: 120000000, description: 'Mythical wool.' },
    { id: 'ant_12', name: 'Moai Head (Stolen)', price: 75000000, description: 'Heavy history.' },
    { id: 'ant_13', name: 'Code of Hammurabi', price: 200000000, description: 'The first laws.' },
    { id: 'ant_14', name: 'Crystal Skull', price: 60000000, description: 'Alien origin?' },
    { id: 'ant_15', name: 'Spear of Destiny', price: 180000000, description: 'Pierced the divine.' },
    { id: 'ant_16', name: 'Antikythera Mechanism', price: 90000000, description: 'Ancient computer.' },
    { id: 'ant_17', name: 'Standard of Ur', price: 55000000, description: 'Sumerian war and peace.' },
    { id: 'ant_18', name: 'Mask of Agamemnon', price: 70000000, description: 'Golden death mask.' },
    { id: 'ant_19', name: 'Venus of Willendorf', price: 25000000, description: 'Fertility symbol.' },
    { id: 'ant_20', name: 'Elgin Marbles (Set)', price: 320000000, description: 'Controversial stones.' },
    { id: 'ant_21', name: 'Book of Kells', price: 85000000, description: 'Illuminated manuscript.' },
    { id: 'ant_22', name: 'Gutenberg Bible', price: 95000000, description: 'First print.' },
    { id: 'ant_23', name: 'Magna Carta (Original)', price: 380000000, description: 'Foundation of liberty.' },
    { id: 'ant_24', name: 'Shroud of Turin', price: 280000000, description: 'Holy relic.' },
    { id: 'ant_25', name: 'Cyrus Cylinder', price: 65000000, description: 'Human rights charter.' },
    { id: 'ant_26', name: 'Necronomicon (Cursed)', price: 66600000, description: 'Do not read aloud.' },
    { id: 'ant_27', name: 'Voynich Manuscript', price: 45000000, description: 'Undecipherable.' },
    { id: 'ant_28', name: 'Sword of Goujian', price: 110000000, description: 'Untarnished after millennia.' },
    { id: 'ant_29', name: 'Piri Reis Map', price: 72000000, description: 'Antarctica without ice?' },
    { id: 'ant_30', name: 'Nebra Sky Disc', price: 58000000, description: 'Bronze age cosmos.' },
    { id: 'ant_31', name: 'Lycurgus Cup', price: 42000000, description: 'Nanotech glass.' },
    { id: 'ant_32', name: 'Iron Pillar of Delhi (Chunk)', price: 22000000, description: 'Rust-free mystery.' },
    { id: 'ant_33', name: 'Baghdad Battery', price: 15000000, description: 'Ancient electricity.' },
    { id: 'ant_34', name: 'Sarcophagus of Alexandar', price: 160000000, description: 'For the conqueror.' },
    { id: 'ant_35', name: 'Bust of Caesar', price: 48000000, description: 'Veni, vidi, vici.' },
    { id: 'ant_36', name: 'Law of the Twelve Tables', price: 40000000, description: 'Roman law.' },
    { id: 'ant_37', name: 'Discobolus (Original)', price: 88000000, description: 'Perfect athlete.' },
    { id: 'ant_38', name: 'Winged Victory of Samothrace', price: 220000000, description: 'Triumphant wings.' },
    { id: 'ant_39', name: 'Laocoön and His Sons', price: 140000000, description: 'Agony in stone.' },
    { id: 'ant_40', name: 'Ishtar Gate Fragment', price: 35000000, description: 'Blue glazed brick.' },
    { id: 'ant_41', name: 'Tablet of Gilgamesh', price: 130000000, description: 'The first epic.' },
    { id: 'ant_42', name: 'Hammurabi\'s Code Stele', price: 190000000, description: 'Eye for an eye.' },
    { id: 'ant_43', name: 'Philosopher\'s Stone', price: 500000000, description: 'Source of alchemy.' },
    { id: 'ant_44', name: 'Imhotep\'s Medical Scroll', price: 52000000, description: 'First medicine.' },
    { id: 'ant_45', name: 'Archimedes\' Screw', price: 28000000, description: 'Ancient tech.' },
    { id: 'ant_46', name: 'Hero\'s Steam Engine', price: 33000000, description: 'Steam power.' },
    { id: 'ant_47', name: 'Zhang Heng\'s Seismoscope', price: 44000000, description: 'Dragon and toad.' },
    { id: 'ant_48', name: 'Dendera Light Bulb', price: 29000000, description: 'Ancient light?' },
    { id: 'ant_49', name: 'Phaistos Disc', price: 31000000, description: 'Minoan mystery.' },
    { id: 'ant_50', name: 'Olmec Colossal Head', price: 62000000, description: 'Giant stone face.' }
];

export const BLACK_MARKET_ANTIQUES: BlackMarketItem[] = RAW_ANTIQUES.map(item =>
    createItem(item.id, item.name, item.price, 'antique', item.description)
);

// --- JEWELRY (50 items) ---
const RAW_JEWELRY = [
    { id: 'jew_1', name: 'Napoleon\'s Crown Laurel', price: 60000000, description: 'Worn by the Emperor.' },
    { id: 'jew_2', name: 'The Hope Diamond', price: 250000000, description: 'Cursed blue beauty.' },
    { id: 'jew_3', name: 'Pink Star Diamond', price: 71000000, description: 'Flawless pink.' },
    { id: 'jew_4', name: 'Peacock Brooch', price: 100000000, description: 'A dazzling display.' },
    { id: 'jew_5', name: 'Koh-i-Noor Diamond', price: 300000000, description: 'Mountain of Light.' },
    { id: 'jew_6', name: 'Cullinan Diamond', price: 400000000, description: 'Star of Africa.' },
    { id: 'jew_7', name: 'Orloff Diamond', price: 90000000, description: 'Russian imperial power.' },
    { id: 'jew_8', name: 'Regent Diamond', price: 120000000, description: 'French crown jewel.' },
    { id: 'jew_9', name: 'Sancy Diamond', price: 50000000, description: 'Pale yellow history.' },
    { id: 'jew_10', name: 'Taylor-Burton Diamond', price: 40000000, description: 'Hollywood royalty.' },
    { id: 'jew_11', name: 'Dresden Green Diamond', price: 110000000, description: 'Naturally green.' },
    { id: 'jew_12', name: 'Black Orlov', price: 35000000, description: 'Eye of Brahma.' },
    { id: 'jew_13', name: 'Tiffany Yellow Diamond', price: 65000000, description: 'Bird on a rock.' },
    { id: 'jew_14', name: 'Moussaieff Red', price: 28000000, description: 'Rarest of them all.' },
    { id: 'jew_15', name: 'Blue Moon of Josephine', price: 48000000, description: 'Gift of love.' },
    { id: 'jew_16', name: 'Graff Pink', price: 46000000, description: 'Intense pink.' },
    { id: 'jew_17', name: 'Princie Diamond', price: 39000000, description: 'Golconda mine.' },
    { id: 'jew_18', name: 'The Orange', price: 35000000, description: 'Fiery vivid.' },
    { id: 'jew_19', name: 'Winston Blue', price: 23000000, description: 'Teardrop perfection.' },
    { id: 'jew_20', name: 'Perfect Pink', price: 23000000, description: 'No secondary color.' },
    { id: 'jew_21', name: 'Wittelsbach-Graff', price: 80000000, description: 'Recut controversy.' },
    { id: 'jew_22', name: 'Archduke Joseph', price: 21000000, description: 'Habsburg legacy.' },
    { id: 'jew_23', name: 'Heart of Eternity', price: 16000000, description: 'Vivid blue.' },
    { id: 'jew_24', name: 'Allnatt Diamond', price: 15000000, description: 'Flower brooch.' },
    { id: 'jew_25', name: 'Golden Jubilee', price: 12000000, description: 'Golden brown.' },
    { id: 'jew_26', name: 'Centenary Diamond', price: 100000000, description: 'Heart shaped purity.' },
    { id: 'jew_27', name: 'Millennium Star', price: 150000000, description: 'Flawless pear.' },
    { id: 'jew_28', name: 'Incomparable Diamond', price: 55000000, description: 'Deep brownish yellow.' },
    { id: 'jew_29', name: 'Spirit of de Grisogono', price: 45000000, description: 'Black diamond.' },
    { id: 'jew_30', name: 'Jubilee Diamond', price: 30000000, description: 'Cushion cut.' },
    { id: 'jew_31', name: 'De Beers Centenary', price: 90000000, description: 'Grade D color.' },
    { id: 'jew_32', name: 'Nizam of Hyderabad Necklace', price: 160000000, description: 'Queen\'s favorite.' },
    { id: 'jew_33', name: 'Hutton-Mdivani Jadeite', price: 27000000, description: 'Imperial green.' },
    { id: 'jew_34', name: 'La Peregrina Pearl', price: 12000000, description: 'Liz Taylor\'s pearl.' },
    { id: 'jew_35', name: 'Marie Antoinette\'s Pearl', price: 36000000, description: 'Royal tragedy.' },
    { id: 'jew_36', name: 'Baroda Pearl Necklace', price: 7000000, description: 'Maharaja\'s treasure.' },
    { id: 'jew_37', name: 'Cowdray Pearls', price: 5000000, description: 'Grey lustre.' },
    { id: 'jew_38', name: 'Blue Belle of Asia', price: 17000000, description: 'Sapphire centerpiece.' },
    { id: 'jew_39', name: 'Rockefeller Sapphire', price: 30000000, description: 'Rectangular step cut.' },
    { id: 'jew_40', name: 'Stuart Sapphire', price: 25000000, description: 'Royal crown back.' },
    { id: 'jew_41', name: 'Logan Sapphire', price: 18000000, description: 'Table cut.' },
    { id: 'jew_42', name: 'Star of India', price: 14000000, description: 'Golf ball size.' },
    { id: 'jew_43', name: 'Midnight Star', price: 10000000, description: 'Star sapphire.' },
    { id: 'jew_44', name: 'Carmen Lúcia Ruby', price: 20000000, description: 'Burmese red.' },
    { id: 'jew_45', name: 'Graff Ruby', price: 8000000, description: 'Pigeon blood.' },
    { id: 'jew_46', name: 'Sunrise Ruby', price: 30000000, description: 'Cartier ring.' },
    { id: 'jew_47', name: 'DeLong Star Ruby', price: 5000000, description: 'Stolen and returned.' },
    { id: 'jew_48', name: 'Neelam Senj', price: 50000000, description: 'Cursed blue.' },
    { id: 'jew_49', name: 'Rosser Reeves Ruby', price: 22000000, description: 'Star pattern.' },
    { id: 'jew_50', name: 'Black Prince\'s Ruby', price: 60000000, description: 'Actually spinel.' }
];

export const BLACK_MARKET_JEWELRY: BlackMarketItem[] = RAW_JEWELRY.map(item =>
    createItem(item.id, item.name, item.price, 'jewelry', item.description)
);

// --- WEAPONS (10 items) ---
const RAW_WEAPONS = [
    { id: 'wpn_1', name: 'Golden AK-47', price: 50000, description: 'Saddam\'s favorite toy.' },
    { id: 'wpn_2', name: 'Silent Assassin Sniper', price: 250000, description: 'They never hear it coming.' },
    { id: 'wpn_3', name: 'Military Drone', price: 1500000, description: 'Death from above.' },
    { id: 'wpn_4', name: 'C4 Plastic Explosive', price: 10000, description: 'Shape it, stick it, boom.' },
    { id: 'wpn_5', name: 'Desert Eagle .50', price: 5000, description: 'Hand cannon.' },
    { id: 'wpn_6', name: 'RPG-7', price: 35000, description: 'Tank buster.' },
    { id: 'wpn_7', name: 'Minigun (Handheld)', price: 500000, description: 'Vegetation removal service.' },
    { id: 'wpn_8', name: 'Tactical Nuke (Briefcase)', price: 5000000, description: 'City eraser.' },
    { id: 'wpn_9', name: 'Katana of the Shogun', price: 100000, description: 'Cuts through steel.' },
    { id: 'wpn_10', name: 'Flame Thrower', price: 20000, description: 'Hot stuff.' }
];

export const BLACK_MARKET_WEAPONS: BlackMarketItem[] = RAW_WEAPONS.map(item =>
    createItem(item.id, item.name, item.price, 'weapon', item.description)
);

// --- SUBSTANCES (5 items - Drugs) ---
const RAW_SUBSTANCES = [
    { id: 'sub_1', name: 'Pixie Dust', price: 500, description: 'Everything sparkles!' },
    { id: 'sub_2', name: 'Neon Cloud', price: 1200, description: 'Colors you\'ve never seen.' },
    { id: 'sub_3', name: 'Midnight Oil', price: 2500, description: 'Sleep is for the weak.' },
    { id: 'sub_4', name: 'Galaxy Powder', price: 3500, description: 'Visit the stars.' },
    { id: 'sub_5', name: 'Laughing Grass', price: 800, description: 'Everything is funny.' }
];

export const BLACK_MARKET_SUBSTANCES: BlackMarketItem[] = RAW_SUBSTANCES.map(item =>
    createItem(item.id, item.name, item.price, 'substance', item.description, true) // isDrug = true
);

// --- ALL ITEMS COMBINED ---
export const ALL_BLACK_MARKET_ITEMS: BlackMarketItem[] = [
    ...BLACK_MARKET_ARTS,
    ...BLACK_MARKET_ANTIQUES,
    ...BLACK_MARKET_JEWELRY,
    ...BLACK_MARKET_WEAPONS,
    ...BLACK_MARKET_SUBSTANCES
];

// --- HELPER FUNCTIONS ---

/**
 * Get items by category
 */
export const getItemsByCategory = (category: BlackMarketCategory): BlackMarketItem[] => {
    switch (category) {
        case 'art':
            return BLACK_MARKET_ARTS;
        case 'antique':
            return BLACK_MARKET_ANTIQUES;
        case 'jewelry':
            return BLACK_MARKET_JEWELRY;
        case 'weapon':
            return BLACK_MARKET_WEAPONS;
        case 'substance':
            return BLACK_MARKET_SUBSTANCES;
        default:
            return [];
    }
};

/**
 * Filter items by Street Rep (show only accessible tiers)
 * Logic: If Rep < 10, show Tier 1-2. If Rep < 30, show Tier 1-3. Else show all.
 */
export const filterByStreetRep = (items: BlackMarketItem[], streetRep: number): BlackMarketItem[] => {
    if (streetRep < 10) {
        return items.filter(item => item.tier <= 2);
    } else if (streetRep < 30) {
        return items.filter(item => item.tier <= 3);
    }
    return items; // Show all tiers
};

/**
 * Get ONE random item from filtered list
 */
export const getRandomDeal = (category: BlackMarketCategory, streetRep: number): BlackMarketItem | null => {
    const categoryItems = getItemsByCategory(category);
    const accessibleItems = filterByStreetRep(categoryItems, streetRep);

    if (accessibleItems.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * accessibleItems.length);
    return accessibleItems[randomIndex];
};
