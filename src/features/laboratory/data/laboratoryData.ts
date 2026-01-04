// Laboratory facility tiers and researcher economics

export interface FacilityTier {
    tier: number;
    name: string;
    icon: string;
    capacity: number;
    upgradeCost: {
        cash: number;
        rp: number;
    } | null; // null for tier 1 (default)
    description: string;
}

export const FACILITY_TIERS: FacilityTier[] = [
    {
        tier: 1,
        name: 'Corporate Annex',
        icon: '🏢',
        capacity: 500,
        upgradeCost: null,
        description: 'Basic research facility for early-stage innovation',
    },
    {
        tier: 2,
        name: 'Innovation Plaza',
        icon: '🏛️',
        capacity: 2500,
        upgradeCost: {
            cash: 50_000_000, // $50M
            rp: 5_000,
        },
        description: 'Expanded campus with modern laboratories',
    },
    {
        tier: 3,
        name: 'Advanced Tech Center',
        icon: '🏗️',
        capacity: 8000,
        upgradeCost: {
            cash: 250_000_000, // $250M
            rp: 100_000,
        },
        description: 'State-of-the-art research complex',
    },
    {
        tier: 4,
        name: 'Future Campus',
        icon: '🌆',
        capacity: 15000,
        upgradeCost: {
            cash: 10_000_000_000, // $10B
            rp: 320_000,
        },
        description: 'Cutting-edge innovation hub',
    },
    {
        tier: 5,
        name: 'Global Silicon HQ',
        icon: '🏙️',
        capacity: 36000,
        upgradeCost: {
            cash: 25_000_000_000, // $25B
            rp: 1_000_000,
        },
        description: 'World-class research headquarters',
    },
];

// Researcher economics
export const RESEARCHER_ECONOMICS = {
    SALARY_PER_QUARTER: 500_000, // $500K per researcher per quarter
    RP_OUTPUT_PER_QUARTER: 10, // 10 RP per researcher per quarter
    HIRE_INCREMENT: 100, // Hire/fire in batches of 100
};

// Helper functions
export const getFacilityByTier = (tier: number): FacilityTier | undefined => {
    return FACILITY_TIERS.find(f => f.tier === tier);
};

export const getNextTier = (currentTier: number): FacilityTier | null => {
    return FACILITY_TIERS.find(f => f.tier === currentTier + 1) || null;
};

export const calculateQuarterlyCost = (researcherCount: number): number => {
    return researcherCount * RESEARCHER_ECONOMICS.SALARY_PER_QUARTER;
};

export const calculateQuarterlyRP = (researcherCount: number): number => {
    return researcherCount * RESEARCHER_ECONOMICS.RP_OUTPUT_PER_QUARTER;
};
