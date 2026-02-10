// 6 Volatile Charts Ending UP (Green) - Realistic market volatility with upward trend
export const GREEN_CHARTS = [
    // Volatile recovery pattern
    [100, 95, 102, 98, 105, 100, 108, 103, 110, 106, 115, 108, 118, 112, 125],
    // Sharp dips with strong recovery
    [80, 75, 82, 78, 88, 85, 92, 88, 98, 95, 105, 100, 110, 108, 120],
    // Gradual climb with corrections
    [50, 52, 48, 55, 53, 58, 55, 62, 60, 68, 65, 72, 70, 78, 85],
    // Sideways then breakout
    [60, 62, 58, 61, 59, 63, 60, 65, 68, 72, 70, 78, 75, 82, 90],
    // V-shaped recovery
    [120, 110, 100, 95, 90, 95, 105, 110, 115, 118, 125, 122, 130, 128, 140],
    // Steady climb with minor pullbacks
    [40, 42, 41, 45, 44, 48, 47, 52, 50, 56, 55, 62, 60, 68, 75]
];

// 6 Volatile Charts Ending DOWN (Red) - Realistic market volatility with downward trend
export const RED_CHARTS = [
    // Failed rally pattern
    [100, 105, 98, 102, 95, 100, 92, 96, 88, 92, 85, 88, 80, 82, 75],
    // Breakdown after resistance
    [120, 118, 122, 115, 118, 110, 112, 105, 108, 100, 102, 95, 98, 90, 85],
    // Gradual decline with bounces
    [80, 78, 82, 75, 78, 72, 75, 68, 70, 65, 68, 60, 62, 58, 50],
    // Sharp selloff pattern
    [100, 98, 95, 92, 88, 90, 85, 82, 78, 75, 72, 70, 65, 62, 55],
    // Distribution phase
    [90, 92, 88, 90, 85, 87, 82, 84, 78, 80, 75, 76, 70, 72, 65],
    // Slow bleed with dead cat bounces
    [70, 68, 72, 66, 68, 62, 65, 58, 60, 55, 57, 50, 52, 48, 42]
];

/**
 * Returns a consistent chart dataset for a given stock symbol, current quarter, and trend.
 * @param symbol Stock Symbol or ID to seed randomness
 * @param isPositive Whether the stock is trending up (green) or down (red)
 * @param quarter Current quarter (0-3 usually, or just an incrementing number)
 */
export const getFakeChartData = (symbol: string, isPositive: boolean, quarter: number) => {
    // Simple hash function to get a deterministic index
    let hash = 0;
    const combinedKey = `${symbol}-${quarter}`; // Change key every quarter

    for (let i = 0; i < combinedKey.length; i++) {
        hash = ((hash << 5) - hash) + combinedKey.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % 6; // 0 to 5

    return isPositive ? GREEN_CHARTS[index] : RED_CHARTS[index];
};
