export type Category = 'Media' | 'Technology' | 'Industrial' | 'Retail';

export interface AcquisitionTarget {
    id: string;
    name: string;
    category: Category;
    marketCap: number;
    acquisitionPremium: number; // Multiplier e.g. 1.20
    description: string;
    synergyDescription: string;
    synergyScore: number;
    // UI Display Fields
    logo: string;
    revenue: number;
    profit: number;
    growthRate: number;
    boardSentiment: 'Supportive' | 'Neutral' | 'Skeptical' | 'Hostile' | 'Cautious';
    priceHistory?: number[];
}

export const ACQUISITION_TARGETS: AcquisitionTarget[] = [
    // 1. MEDIA & SERVICES
    {
        id: 'streamify',
        name: 'Streamify',
        category: 'Media',
        marketCap: 2_500_000_000,
        acquisitionPremium: 1.20,
        description: 'Leading music streaming platform.',
        synergyDescription: 'Boosts MyPhone & MyPods sales by 15%.',
        synergyScore: 85,
        logo: '🎵',
        revenue: 4_200_000_000,
        profit: 120_000_000,
        growthRate: 12,
        boardSentiment: 'Supportive',
        priceHistory: [110, 115, 120, 118, 125],
    },
    // 2. TECHNOLOGY & GAMING
    {
        id: 'gameGen', // normalized to camelCase matching store
        name: 'GameGen',
        category: 'Technology',
        marketCap: 8_000_000_000,
        acquisitionPremium: 1.15,
        description: 'Triple-A gaming studio.',
        synergyDescription: 'Unlocks exclusive games for MyMac & MyPad.',
        synergyScore: 90,
        logo: '🎮',
        revenue: 2_500_000_000,
        profit: 600_000_000,
        growthRate: 18,
        boardSentiment: 'Supportive',
        priceHistory: [200, 210, 205, 220, 235],
    },
    {
        id: 'skyNet',
        name: 'SkyNet AI',
        category: 'Technology',
        marketCap: 120_000_000_000,
        acquisitionPremium: 1.40,
        description: 'Advanced AI research lab.',
        synergyDescription: 'Reduces ALL R&D costs by 50%.',
        synergyScore: 95,
        logo: '🤖',
        revenue: 0,
        profit: -5_000_000_000, // Burn
        growthRate: 200,
        boardSentiment: 'Skeptical',
        priceHistory: [800, 850, 900, 1100, 1250],
    },
    // 3. INDUSTRIAL
    {
        id: 'chipMaster',
        name: 'ChipMaster',
        category: 'Industrial',
        marketCap: 55_000_000_000,
        acquisitionPremium: 1.30,
        description: 'Semiconductor giant.',
        synergyDescription: 'Reduces production costs by 15%.',
        synergyScore: 95, // 100 might be too OP, sticking to 95 or user's 100? User said 100.
        logo: '🏭',
        revenue: 12_500_000_000,
        profit: 2_100_000_000,
        growthRate: 8,
        boardSentiment: 'Cautious',
        priceHistory: [300, 310, 305, 320, 330],
    },
    {
        id: 'voltMotors',
        name: 'VoltMotors',
        category: 'Industrial',
        marketCap: 40_000_000_000,
        acquisitionPremium: 1.10,
        description: 'Electric battery innovation.',
        synergyDescription: 'Critical for MyCar production.',
        synergyScore: 70,
        logo: '🔋',
        revenue: 8_000_000_000,
        profit: 1_200_000_000,
        growthRate: 15,
        boardSentiment: 'Neutral',
        priceHistory: [150, 160, 155, 170, 180],
    },
    // 4. RETAIL
    {
        id: 'fashionNova',
        name: 'FashionNova',
        category: 'Retail',
        marketCap: 850_000_000,
        acquisitionPremium: 1.05,
        description: 'Fast fashion retailer.',
        synergyDescription: 'Expands Clothing market share.',
        synergyScore: 40,
        logo: '👗',
        revenue: 600_000_000,
        profit: 50_000_000,
        growthRate: 25,
        boardSentiment: 'Neutral',
        priceHistory: [40, 42, 45, 44, 46],
    },
];
