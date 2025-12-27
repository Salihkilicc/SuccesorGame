import { StockItem } from '../components/Market/marketTypes';
import { AcquisitionTarget, Category } from './AcquisitionData';

/**
 * Maps stock market sectors to M&A categories
 */
const SECTOR_TO_CATEGORY_MAP: Record<string, Category> = {
    'Technology': 'Technology',
    'Communication': 'Media',
    'Consumer': 'Retail',
    'Materials': 'Industrial',
    'Industrials': 'Industrial',
    'Energy': 'Industrial',
    'Healthcare': 'Technology', // Map to Tech for R&D synergies
    'Financial': 'Retail', // Map to Retail for market reach
};

/**
 * Sector-specific synergy configuration
 */
const SYNERGY_CONFIG: Record<Category, {
    description: string;
    scoreRange: [number, number];
    premium: number;
    boardSentiment: AcquisitionTarget['boardSentiment'];
}> = {
    'Technology': {
        description: 'Reduces R&D costs by 10-20%.',
        scoreRange: [85, 95],
        premium: 1.15,
        boardSentiment: 'Supportive',
    },
    'Media': {
        description: 'Boosts MyPhone & MyPods sales.',
        scoreRange: [70, 90],
        premium: 1.20,
        boardSentiment: 'Supportive',
    },
    'Industrial': {
        description: 'Reduces production costs significantly.',
        scoreRange: [90, 100],
        premium: 1.30,
        boardSentiment: 'Cautious',
    },
    'Retail': {
        description: 'Expands market reach.',
        scoreRange: [50, 70],
        premium: 1.10,
        boardSentiment: 'Neutral',
    },
};

/**
 * Generates a random integer between min and max (inclusive)
 */
const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a company logo emoji based on sector
 */
const getLogoForSector = (sector: string): string => {
    const logoMap: Record<string, string> = {
        'Technology': '💻',
        'Communication': '📡',
        'Consumer': '🛒',
        'Materials': '⚒️',
        'Industrials': '🏭',
        'Energy': '⚡',
        'Healthcare': '🏥',
        'Financial': '💰',
    };
    return logoMap[sector] || '🏢';
};

/**
 * Enriches stock market data with acquisition-specific fields
 */
export const enrichStockData = (stocks: StockItem[]): AcquisitionTarget[] => {
    return stocks.map(stock => {
        const category = SECTOR_TO_CATEGORY_MAP[stock.sector] || 'Technology';
        const config = SYNERGY_CONFIG[category];

        // Generate random synergy score within range
        const synergyScore = randomInt(config.scoreRange[0], config.scoreRange[1]);

        // Convert market cap from billions to actual value
        const marketCap = stock.marketCap * 1_000_000_000;

        // Estimate revenue and profit based on market cap (rough heuristics)
        const revenue = marketCap * 0.8; // ~80% of market cap
        const profitMargin = stock.risk === 'Low' ? 0.15 : stock.risk === 'Medium' ? 0.10 : 0.05;
        const profit = revenue * profitMargin;

        // Growth rate based on yearly change
        const growthRate = Math.max(0, Math.round(stock.yearlyChange));

        return {
            id: stock.id.toLowerCase(),
            name: stock.company,
            category,
            marketCap,
            acquisitionPremium: config.premium,
            description: `${stock.sector} company with ${stock.risk.toLowerCase()} risk profile.`,
            synergyDescription: config.description,
            synergyScore,
            logo: getLogoForSector(stock.sector),
            revenue,
            profit,
            growthRate,
            boardSentiment: config.boardSentiment,
            priceHistory: [], // Stock price history not directly mapped
        };
    });
};
