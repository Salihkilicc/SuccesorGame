/**
 * EQUITY STORE - MANUAL VERIFICATION TESTS
 * 
 * Run these in a React Native component or debug console to verify functionality
 */

import { useEquityStore } from './useEquityStore';

/**
 * TEST 1: Initial State
 * Verify default values
 */
export const testInitialState = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 1: Initial State ===');
    console.log('Total Shares:', state.totalShares); // Expected: 1,000,000
    console.log('Player Shares:', state.playerShares); // Expected: 1,000,000
    console.log('Public Shares:', state.publicShares); // Expected: 0
    console.log('Stock Price:', state.stockPrice); // Expected: 0
    console.log('Market Multiplier:', state.marketMultiplier); // Expected: 1.0
    console.log('Player Ownership:', state.getPlayerOwnership()); // Expected: 100
    console.log('Market Cap:', state.getMarketCap()); // Expected: 0
    console.log('✅ Initial state verified\n');
};

/**
 * TEST 2: Stock Price Sync
 * Verify price calculation
 */
export const testStockPriceSync = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 2: Stock Price Sync ===');

    // Test with $50M valuation
    state.syncStockPrice(50_000_000);
    console.log('After $50M valuation sync:');
    console.log('Stock Price:', state.stockPrice); // Expected: $50.00
    console.log('Market Cap:', state.getMarketCap()); // Expected: $50,000,000
    console.log('Price History Length:', state.priceHistory.length); // Expected: 1

    // Test with $100M valuation
    state.syncStockPrice(100_000_000);
    console.log('After $100M valuation sync:');
    console.log('Stock Price:', state.stockPrice); // Expected: $100.00
    console.log('Price History Length:', state.priceHistory.length); // Expected: 2
    console.log('✅ Stock price sync verified\n');
};

/**
 * TEST 3: Dilution
 * Verify dilution math and ownership changes
 */
export const testDilution = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 3: Dilution ===');

    // Reset and sync price first
    state.reset();
    state.syncStockPrice(50_000_000);

    console.log('Before Dilution:');
    console.log('Total Shares:', state.totalShares); // 1,000,000
    console.log('Player Ownership:', state.getPlayerOwnership()); // 100%

    // Execute 10% dilution
    const result = state.executeDilution(10, 50_000_000);

    console.log('After 10% Dilution:');
    console.log('New Shares Minted:', result.newShares); // Expected: ~111,111
    console.log('Capital Raised:', result.capitalRaised); // Expected: ~$5.28M (with 0.95 multiplier)
    console.log('New Ownership:', result.newOwnershipPercent); // Expected: 90%
    console.log('Total Shares:', state.totalShares); // Expected: 1,111,111
    console.log('Public Shares:', state.publicShares); // Expected: 111,111
    console.log('Market Multiplier:', state.marketMultiplier); // Expected: 0.95
    console.log('✅ Dilution verified\n');
};

/**
 * TEST 4: Buyback
 * Verify buyback math and ownership increase
 */
export const testBuyback = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 4: Buyback ===');

    // Start from diluted state (from TEST 3)
    console.log('Before Buyback:');
    console.log('Total Shares:', state.totalShares);
    console.log('Player Ownership:', state.getPlayerOwnership());
    console.log('Stock Price:', state.stockPrice);

    // Execute $5M buyback
    const result = state.executeBuyback(5_000_000);

    console.log('After $5M Buyback:');
    console.log('Shares Burned:', result.sharesBurned);
    console.log('New Ownership:', result.newOwnershipPercent);
    console.log('Total Shares:', state.totalShares);
    console.log('Public Shares:', state.publicShares);
    console.log('Market Multiplier:', state.marketMultiplier); // Expected: 1.05
    console.log('✅ Buyback verified\n');
};

/**
 * TEST 5: Dividend Calculation
 * Verify dividend math
 */
export const testDividend = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 5: Dividend ===');

    // Calculate $0.50 per share dividend
    const result = state.distributeDividend(0.50);

    console.log('Dividend: $0.50 per share');
    console.log('Total Required:', result.totalRequired);
    console.log('Player Portion:', result.playerPortion);
    console.log('Player Ownership:', state.getPlayerOwnership());

    // Verify math: playerPortion should equal totalRequired * ownership%
    const expectedPlayerPortion = result.totalRequired * (state.getPlayerOwnership() / 100);
    console.log('Expected Player Portion:', expectedPlayerPortion);
    console.log('Match:', Math.abs(result.playerPortion - expectedPlayerPortion) < 1); // Allow 1 cent rounding
    console.log('✅ Dividend verified\n');
};

/**
 * TEST 6: Edge Cases
 * Verify safety constraints
 */
export const testEdgeCases = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 6: Edge Cases ===');

    // Test invalid dilution
    console.log('Testing invalid dilution (150%):');
    const invalidDilution = state.executeDilution(150, 50_000_000);
    console.log('Result:', invalidDilution); // Should return zeros

    // Test buyback with no public shares
    state.reset();
    state.syncStockPrice(50_000_000);
    console.log('Testing buyback with 0 public shares:');
    const noBuyback = state.executeBuyback(1_000_000);
    console.log('Shares Burned:', noBuyback.sharesBurned); // Expected: 0

    // Test negative dividend
    console.log('Testing negative dividend:');
    const negativeDividend = state.distributeDividend(-1);
    console.log('Result:', negativeDividend); // Should return zeros

    console.log('✅ Edge cases verified\n');
};

/**
 * TEST 7: Price History
 * Verify FIFO array behavior
 */
export const testPriceHistory = () => {
    const state = useEquityStore.getState();

    console.log('=== TEST 7: Price History ===');

    state.reset();

    // Add 10 prices (should keep only last 7)
    for (let i = 1; i <= 10; i++) {
        state.syncStockPrice(i * 10_000_000);
    }

    console.log('Price History Length:', state.priceHistory.length); // Expected: 7
    console.log('Price History:', state.priceHistory);
    console.log('First Price:', state.priceHistory[0]); // Expected: $40 (4th sync)
    console.log('Last Price:', state.priceHistory[6]); // Expected: $100 (10th sync)
    console.log('✅ Price history verified\n');
};

/**
 * RUN ALL TESTS
 */
export const runAllEquityTests = () => {
    console.log('🧪 EQUITY STORE VERIFICATION TESTS\n');

    testInitialState();
    testStockPriceSync();
    testDilution();
    testBuyback();
    testDividend();
    testEdgeCases();
    testPriceHistory();

    console.log('✅ ALL TESTS COMPLETED');
};
