// Product R&D Upgrade Logic

export const MAX_UPGRADE_LEVEL = 10;

// Cost Optimization Upgrade
export const COST_OPTIMIZATION = {
    BASE_RP_COST: 500,
    SCALING_FACTOR: 1.7,
    COST_REDUCTION_PER_LEVEL: 2, // $2 reduction per level
};

// Feature Enhancement Upgrade
export const FEATURE_ENHANCEMENT = {
    BASE_RP_COST: 1000,
    SCALING_FACTOR: 1.7,
};

/**
 * Calculate RP cost for next upgrade level
 * Rounds to nearest 100 to avoid fractional RP costs
 */
export const calculateUpgradeRPCost = (baseRP: number, currentLevel: number): number => {
    if (currentLevel >= MAX_UPGRADE_LEVEL) return 0;

    const rawCost = baseRP * Math.pow(COST_OPTIMIZATION.SCALING_FACTOR, currentLevel);
    // Round to nearest 100
    return Math.round(rawCost / 100) * 100;
};

/**
 * Calculate total cost reduction from cost optimization levels
 */
export const calculateTotalCostReduction = (costLevel: number): number => {
    return costLevel * COST_OPTIMIZATION.COST_REDUCTION_PER_LEVEL;
};

/**
 * Calculate total price increase from feature enhancement levels
 * Formula: Sum of (level + 2) for each level
 * Level 1: +2, Level 2: +3, Level 3: +4, etc.
 */
export const calculateTotalPriceIncrease = (priceLevel: number): number => {
    let total = 0;
    for (let i = 1; i <= priceLevel; i++) {
        total += (i + 2);
    }
    return total;
};

/**
 * Get the price increase for the next level
 */
export const getNextPriceIncrease = (currentLevel: number): number => {
    if (currentLevel >= MAX_UPGRADE_LEVEL) return 0;
    return currentLevel + 3; // Next level is currentLevel + 1, so (currentLevel + 1) + 2
};

/**
 * Calculate effective production cost after upgrades
 */
export const getEffectiveProductionCost = (baseProductionCost: number, costLevel: number): number => {
    const reduction = calculateTotalCostReduction(costLevel);
    return Math.max(1, baseProductionCost - reduction); // Minimum $1
};

/**
 * Calculate effective selling price after upgrades
 */
export const getEffectiveSellingPrice = (baseSuggestedPrice: number, priceLevel: number): number => {
    const increase = calculateTotalPriceIncrease(priceLevel);
    return baseSuggestedPrice + increase;
};
