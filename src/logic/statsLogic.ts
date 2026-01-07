// src/logic/statsLogic.ts

/**
 * Calculates the impact of an action on stress based on current health.
 * Lower health means higher stress susceptibility.
 * 
 * @param health Current health (0-100)
 * @param baseStress Base stress cost of the action
 * @param multiplier Optional multiplier for external factors (default 1)
 * @returns Calculated stress increase
 */
export const calculateStressImpact = (health: number, baseStress: number, multiplier: number = 1): number => {
    const healthFactor = Math.max(0.5, health / 100); // 0.5 (at 0 hp) to 1.0 (at 100 hp)
    // Inverse relationship: Lower health factor -> Higher stress
    // If Health is 100, factor is 1. Impact = base.
    // If Health is 50, factor is 0.5. Impact = base * (1 + (1-0.5)) = base * 1.5

    const healthPenalty = 1 + (1 - healthFactor);
    return Math.floor(baseStress * healthPenalty * multiplier);
};

/**
 * Calculates the success chance of an action.
 * 
 * @param luck Current luck (0-100+)
 * @param attribute Relevant attribute value (0-100)
 * @param difficulty Difficulty check (0-100)
 * @returns boolean success
 */
export const calculateSuccessChance = (luck: number, attribute: number, difficulty: number): boolean => {
    // Base chance from attribute vs difficulty
    const baseChance = 50 + (attribute - difficulty); // e.g. 50 + (80 - 60) = 70%

    // Luck Impact (Luck 50 is neutral, >50 is bonus)
    const luckBonus = (luck - 50) * 0.5; // Luck 80 -> +15%

    const finalChance = Math.min(95, Math.max(5, baseChance + luckBonus));
    const roll = Math.random() * 100;

    return roll <= finalChance;
};

/**
 * Calculates Risk vs Reward outcome for illegal/risky activities.
 * 
 * @param riskAppetite Player's risk appetite (0-100)
 * @param streetRep Street reputation (0-100) to mitigate risk
 * @param baseRisk Base risk of the activity (0-100)
 * @returns Object containing success boolean and reward multiplier
 */
export const calculateRiskReward = (riskAppetite: number, streetRep: number, baseRisk: number) => {
    // Higher risk appetite might push for riskier moves but doesn't inherently make you safer.
    // Street rep reduces effective risk.

    const effectiveRisk = Math.max(5, baseRisk - (streetRep * 0.4));

    // Risk Appetite Bonus: High risk appetite increases reward multiplier
    const rewardMultiplier = 1 + (riskAppetite / 100);

    const roll = Math.random() * 100;
    const isSuccess = roll > effectiveRisk;

    return {
        success: isSuccess,
        rewardMultiplier: isSuccess ? rewardMultiplier : 0,
        riskLevel: effectiveRisk
    };
};

/**
 * Calculates charm effect for social interactions.
 * 
 * @param charm Charm attribute
 * @param looks Looks attribute
 * @param socialRep Social Reputation
 * @returns Power level of the interaction (0-100 scale usually)
 */
export const calculateCharmEffect = (charm: number, looks: number, socialRep: number): number => {
    // Weighted average
    // Charm: 50%, Looks: 30%, Social Rep: 20%
    const power = (charm * 0.5) + (looks * 0.3) + (socialRep * 0.2);
    return Math.min(100, power);
};

/**
 * Calculates business growth rate per quarter.
 * 
 * @param intellect Player's intellect (0-100)
 * @param ambition Player's ambition (0-100)
 * @param businessRep Business Reputation (0-100)
 * @returns Growth multiplier (e.g., 1.05 for 5% growth)
 */
export const calculateBusinessGrowth = (intellect: number, ambition: number, businessRep: number): number => {
    // Formula: Base(1.0) + (Intellect * 0.005) + (Ambition * 0.005) + (BusinessRep * 0.002)
    const growth = 1.0 + (intellect * 0.005) + (ambition * 0.005) + (businessRep * 0.002);
    return growth;
};

/**
 * Calculates shopping discount percentage.
 * 
 * @param charm Charm attribute (0-100)
 * @param socialRep Social Reputation (0-100)
 * @returns Discount percentage (0-100, e.g. 10 for 10% off)
 */
export const calculateShoppingDiscount = (charm: number, socialRep: number): number => {
    let discount = 0;

    if (charm > 50) discount = 5;
    if (charm > 80) discount = 10;

    if (socialRep > 50) discount += 5;

    return discount;
};

/**
 * Calculates decay for player attributes.
 * Rule: 5% chance for each stat to drop by 15 points.
 * 
 * @param currentAttributes Current player attributes
 * @returns Object with decay values (negative numbers or 0)
 */
export const calculateStatDecay = (currentAttributes: { intellect: number; charm: number; looks: number; strength: number }) => {
    const decay = {
        intellect: 0,
        charm: 0,
        looks: 0,
        strength: 0
    };

    // Roll for each stat (5% chance)
    if (Math.random() < 0.05) decay.intellect = -15;
    if (Math.random() < 0.05) decay.charm = -15;
    if (Math.random() < 0.05) decay.looks = -15;
    if (Math.random() < 0.05) decay.strength = -15;

    return decay;
};
