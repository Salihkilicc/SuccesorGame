export type RegionCode = 'USA' | 'EUROPE' | 'ASIA' | 'AFRICA';

export interface Venue {
    id: string;
    name: string;
    region: RegionCode;
    location: string;
    entryFee: number;
    tier: 1 | 2 | 3 | 4 | 5;
    themeColor: string;
    emoji: string;
    vibeText: string;
}

export const VENUES: Venue[] = [
    // 🇺🇸 USA (Local) - 10 Venues
    {
        id: 'omnia_vegas',
        name: 'Omnia',
        region: 'USA',
        location: 'Las Vegas',
        entryFee: 1000,
        tier: 5,
        themeColor: '#FFD700', // Gold
        emoji: '🎰',
        vibeText: 'The kinetic chandelier pulsated above, syncing with the beat of the strip.',
    },
    {
        id: 'hakkasan_vegas',
        name: 'Hakkasan',
        region: 'USA',
        location: 'Las Vegas',
        entryFee: 100,
        tier: 5,
        themeColor: '#003366', // Dark Blue
        emoji: '🏯',
        vibeText: 'Massive temple of EDM with world-class DJs.',
    },
    {
        id: 'xs_vegas',
        name: 'XS',
        region: 'USA',
        location: 'Las Vegas',
        entryFee: 120,
        tier: 5,
        themeColor: '#FFD700', // Gold
        emoji: '💎',
        vibeText: 'Swimming in gold by the pool under the stars.',
    },
    {
        id: 'liv_miami',
        name: 'LIV',
        region: 'USA',
        location: 'Miami',
        entryFee: 800,
        tier: 5,
        themeColor: '#00FFFF', // Cyan/Neon Blue
        emoji: '🌴',
        vibeText: 'Confetti rained down as the bass shook the palm trees outside.',
    },
    {
        id: 'space_miami',
        name: 'Club Space',
        region: 'USA',
        location: 'Miami',
        entryFee: 60,
        tier: 4,
        themeColor: '#FF69B4', // Hot Pink
        emoji: '👽',
        vibeText: 'The sunrise on the terrace hit different after 10 hours of techno.',
    },
    {
        id: 'e11even_miami',
        name: 'E11EVEN',
        region: 'USA',
        location: 'Miami',
        entryFee: 600,
        tier: 4,
        themeColor: '#FF69B4', // Hot Pink
        emoji: '💃',
        vibeText: 'The party never stopped, blurring the lines between night and day.',
    },
    {
        id: 'the_box_nyc',
        name: 'The Box',
        region: 'USA',
        location: 'New York City',
        entryFee: 1500,
        tier: 4,
        themeColor: '#FF0000', // Red
        emoji: '🎭',
        vibeText: 'A shocking cabaret performance left the crowd speechless and wanting more.',
    },
    {
        id: 'marquee_nyc',
        name: 'Marquee',
        region: 'USA',
        location: 'New York City',
        entryFee: 80,
        tier: 4,
        themeColor: '#800080', // Purple
        emoji: '🍸',
        vibeText: 'A classic high-energy fashion week afterparty vibe.',
    },
    {
        id: '1oak_la',
        name: '1 OAK',
        region: 'USA',
        location: 'Los Angeles',
        entryFee: 500,
        tier: 4,
        themeColor: '#FFFFFF', // White/Silver
        emoji: '🎬',
        vibeText: 'Flashes from paparazzi tailored the entrance for a star-studded night.',
    },
    {
        id: 'tao_chicago',
        name: 'TAO',
        region: 'USA',
        location: 'Chicago',
        entryFee: 70,
        tier: 4,
        themeColor: '#B22222', // Firebrick
        emoji: '🏮',
        vibeText: 'Dimly lit, mysterious, and absolutely packed with energy.',
    },

    // 🇪🇺 EUROPE - 10 Venues
    {
        id: 'berghain_berlin',
        name: 'Berghain',
        region: 'EUROPE',
        location: 'Berlin',
        entryFee: 250,
        tier: 3,
        themeColor: '#333333', // Dark Grey
        emoji: '⛓️',
        vibeText: 'The industrial techno beat consumed you completely in the concrete halls.',
    },
    {
        id: 'watergate_berlin',
        name: 'Watergate',
        region: 'EUROPE',
        location: 'Berlin',
        entryFee: 30,
        tier: 3,
        themeColor: '#000000', // Black
        emoji: '💡',
        vibeText: 'Watching the sunrise over the Spree river from the LED floor.',
    },
    {
        id: 'tresor_berlin',
        name: 'Tresor',
        region: 'EUROPE',
        location: 'Berlin',
        entryFee: 25,
        tier: 3,
        themeColor: '#8B4513', // Saddle Brown (Rust)
        emoji: '🏭',
        vibeText: 'Hard industrial techno in an abandoned power plant vault.',
    },
    {
        id: 'ushuaia_ibiza',
        name: 'Ushuaïa',
        region: 'EUROPE',
        location: 'Ibiza',
        entryFee: 1200,
        tier: 5,
        themeColor: '#FF5733', // Sunset Orange
        emoji: '🌅',
        vibeText: 'Dancing by the pool while the sun went down was strictly magical.',
    },
    {
        id: 'pacha_ibiza',
        name: 'Pacha',
        region: 'EUROPE',
        location: 'Ibiza',
        entryFee: 90,
        tier: 4,
        themeColor: '#DC143C', // Crimson
        emoji: '🍒',
        vibeText: 'The legendary cherries and house music history.',
    },
    {
        id: 'amnesia_ibiza',
        name: 'Amnesia',
        region: 'EUROPE',
        location: 'Ibiza',
        entryFee: 100,
        tier: 5,
        themeColor: '#32CD32', // Lime Green
        emoji: '🌫️',
        vibeText: 'Lost in the CO2 cannons and lasers until dawn.',
    },
    {
        id: 'fabric_london',
        name: 'Fabric',
        region: 'EUROPE',
        location: 'London',
        entryFee: 400,
        tier: 4,
        themeColor: '#800080', // Purple
        emoji: '🇬🇧',
        vibeText: 'The legendary sound system rattled your very bones.',
    },
    {
        id: 'ministry_london',
        name: 'Ministry of Sound',
        region: 'EUROPE',
        location: 'London',
        entryFee: 40,
        tier: 3,
        themeColor: '#C0C0C0', // Silver
        emoji: '🔊',
        vibeText: 'The sound system literally shook your bones.',
    },
    {
        id: 'larc_paris',
        name: 'L\'Arc',
        region: 'EUROPE',
        location: 'Paris',
        entryFee: 900,
        tier: 5,
        themeColor: '#C0C0C0', // Silver
        emoji: '🗼',
        vibeText: 'Champagne flowed endlessly with a view of the Arc de Triomphe.',
    },
    {
        id: 'opium_barcelona',
        name: 'Opium',
        region: 'EUROPE',
        location: 'Barcelona',
        entryFee: 50,
        tier: 4,
        themeColor: '#1E90FF', // Dodger Blue
        emoji: '🌊',
        vibeText: 'Dancing right on the beach with the Mediterranean breeze.',
    },

    // 🌏 ASIA - 10 Venues
    {
        id: '1oak_tokyo',
        name: '1 OAK Tokyo',
        region: 'ASIA',
        location: 'Tokyo',
        entryFee: 700,
        tier: 5,
        themeColor: '#9D00FF', // Neon Purple
        emoji: '🏯',
        vibeText: 'The neon lights and bass drops created a cyberpunk trance.',
    },
    {
        id: 'womb_tokyo',
        name: 'Womb',
        region: 'ASIA',
        location: 'Tokyo',
        entryFee: 40,
        tier: 4,
        themeColor: '#696969', // Dim Gray
        emoji: '🥁',
        vibeText: 'The bass from the massive speaker stack controlled your heartbeat.',
    },
    {
        id: 'atom_tokyo',
        name: 'Atom',
        region: 'ASIA',
        location: 'Tokyo',
        entryFee: 25,
        tier: 3,
        themeColor: '#FF4500', // Orange Red
        emoji: '⚛️',
        vibeText: 'Young, chaotic, and incredibly fun Shibuya energy.',
    },
    {
        id: 'celavi_singapore',
        name: 'Ce La Vi',
        region: 'ASIA',
        location: 'Singapore',
        entryFee: 1000,
        tier: 5,
        themeColor: '#FF4500', // Orange Red
        emoji: '🏙️',
        vibeText: 'Sky-high views of the marina made every toast feel infinite.',
    },
    {
        id: 'zouk_singapore',
        name: 'Zouk',
        region: 'ASIA',
        location: 'Singapore',
        entryFee: 50,
        tier: 4,
        themeColor: '#00FF00', // Lime
        emoji: '💿',
        vibeText: 'A futuristic wonderland of sound and light.',
    },
    {
        id: 'octagon_seoul',
        name: 'Octagon',
        region: 'ASIA',
        location: 'Seoul',
        entryFee: 600,
        tier: 4,
        themeColor: '#0000FF', // Blue
        emoji: '🇰🇷',
        vibeText: 'Electronic beats and K-pop visuals merged into a sensory overload.',
    },
    {
        id: 'chroma_seoul',
        name: 'Club Chroma',
        region: 'ASIA',
        location: 'Seoul',
        entryFee: 55,
        tier: 4,
        themeColor: '#FFFFFF', // White
        emoji: '⚪',
        vibeText: 'Minimalist design meeting maximalist energy.',
    },
    {
        id: 'dragon_hongkong',
        name: 'Dragon-i',
        region: 'ASIA',
        location: 'Hong Kong',
        entryFee: 150,
        tier: 5,
        themeColor: '#FF0000', // Red
        emoji: '🐉',
        vibeText: 'Rubbing shoulders with celebrities in the ultimate VIP lounge.',
    },
    {
        id: 'myst_shanghai',
        name: 'Myst',
        region: 'ASIA',
        location: 'Shanghai',
        entryFee: 60,
        tier: 4,
        themeColor: '#0000FF', // Blue
        emoji: '🌃',
        vibeText: 'Neon lights and luxury in the heart of the city.',
    },
    {
        id: 'illuzion_phuket',
        name: 'Illuzion',
        region: 'ASIA',
        location: 'Phuket',
        entryFee: 30,
        tier: 3,
        themeColor: '#DAA520', // Goldenrod
        emoji: '🐘',
        vibeText: 'Massive stage shows and acrobats flying over the crowd.',
    },

    // 🌍 AFRICA - 10 Venues
    {
        id: 'taboo_johannesburg',
        name: 'Taboo',
        region: 'AFRICA',
        location: 'Johannesburg',
        entryFee: 300,
        tier: 4,
        themeColor: '#DAA520', // Goldenrod
        emoji: '🦁',
        vibeText: 'Afrobeats and luxury combined for an unforgettable rhythm.',
    },
    {
        id: 'kong_johannesburg',
        name: 'Kong',
        region: 'AFRICA',
        location: 'Johannesburg',
        entryFee: 350,
        tier: 4,
        themeColor: '#8B4513', // Saddle Brown
        emoji: '💎',
        vibeText: 'A lavish setting where diamonds and beats sparkled in unison.',
    },
    {
        id: 'quilox_lagos',
        name: 'Quilox',
        region: 'AFRICA',
        location: 'Lagos',
        entryFee: 100,
        tier: 5,
        themeColor: '#FFD700', // Gold
        emoji: '👑',
        vibeText: 'Pure luxury and Afrobeats royalty.',
    },
    {
        id: 'cubana_lagos',
        name: 'Cubana',
        region: 'AFRICA',
        location: 'Lagos',
        entryFee: 70,
        tier: 4,
        themeColor: '#FF8C00', // Dark Orange
        emoji: '🦁',
        vibeText: 'The energy of the crowd was unmatched anywhere else.',
    },
    {
        id: 'madison_capetown',
        name: 'Madison Avenue',
        region: 'AFRICA',
        location: 'Cape Town',
        entryFee: 30,
        tier: 3,
        themeColor: '#FF1493', // Deep Pink
        emoji: '👠',
        vibeText: 'Glamorous décor and commercial hits all night.',
    },
    {
        id: 'coco_capetown',
        name: 'Coco',
        region: 'AFRICA',
        location: 'Cape Town',
        entryFee: 90,
        tier: 5,
        themeColor: '#000000', // Black
        emoji: '🍾',
        vibeText: 'High-end bottles and high-end fashion.',
    },
    {
        id: 'skybar_accra',
        name: 'SkyBar',
        region: 'AFRICA',
        location: 'Accra',
        entryFee: 80,
        tier: 5,
        themeColor: '#87CEEB', // Sky Blue
        emoji: '🌤️',
        vibeText: 'Partying above the city skyline with an incredible view.',
    },
    {
        id: 'alchemist_nairobi',
        name: 'The Alchemist',
        region: 'AFRICA',
        location: 'Nairobi',
        entryFee: 20,
        tier: 3,
        themeColor: '#228B22', // Forest Green
        emoji: '🌿',
        vibeText: 'An artistic, open-air creative hub turned wild party.',
    },
    {
        id: 'bclub_nairobi',
        name: 'B-Club',
        region: 'AFRICA',
        location: 'Nairobi',
        entryFee: 50,
        tier: 4,
        themeColor: '#B22222', // Firebrick
        emoji: '🌹',
        vibeText: 'Velvet ropes and exclusive vibes.',
    },
    {
        id: 'kiza_nairobi',
        name: 'Kiza',
        region: 'AFRICA',
        location: 'Nairobi',
        entryFee: 35,
        tier: 3,
        themeColor: '#4B0082', // Indigo
        emoji: '🎷',
        vibeText: 'The true spirit of Pan-African music and dance.',
    },
];

export const REGIONAL_NAMES: Record<RegionCode, { male: string[], female: string[] }> = {
    USA: {
        male: ['Michael', 'Chris', 'David', 'James', 'Robert', 'John', 'William', 'Daniel'],
        female: ['Jessica', 'Ashley', 'Sarah', 'Emily', 'Jennifer', 'Amanda', 'Megan', 'Lauren']
    },
    EUROPE: {
        male: ['Lucas', 'Matteo', 'Gabriel', 'Leo', 'Hugo', 'Arthur', 'Louis', 'Adam'],
        female: ['Sofia', 'Emma', 'Camille', 'Anna', 'Elena', 'Chloe', 'Lea', 'Mia']
    },
    ASIA: {
        male: ['Kenji', 'Wei', 'Hiro', 'Jin', 'Liu', 'Jun', 'Takumi', 'Min-Jun'],
        female: ['Sakura', 'Mei', 'Yuna', 'Min-Ji', 'Hana', 'Yui', 'Li', 'Ai']
    },
    AFRICA: {
        male: ['Kwame', 'Malik', 'Jabari', 'Kofi', 'Tariq', 'Amari', 'Zayn', 'Idris'],
        female: ['Amara', 'Zuri', 'Nia', 'Asha', 'Fatima', 'Imani', 'Zara', 'Nala']
    }
};
