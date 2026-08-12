// src/features/finance/stores/useEquityStore.test.ts
//
// ============================================================================
//  THE CAP TABLE HAS ONE OWNER
// ============================================================================
//
//  WHAT WAS HERE BEFORE. Seven exported functions named `testInitialState`,
//  `testDilution` and so on - each a list of console.logs with the expected
//  value written beside it in a comment, under a header saying "run these in a
//  debug console". Nobody ever did. And because the filename ends in .test.ts,
//  jest picked it up, found no test in it, and failed - so `npm test` had been
//  red for months for a reason that was not a bug. Two files failing for
//  uninteresting reasons is how the other twelve stopped meaning anything.
//
//  I tried to convert them faithfully and could not, which turned out to be
//  the interesting part: EVERY ONE OF THEIR EXPECTATIONS IS NOW WRONG ON
//  PURPOSE. They assert `totalShares: 1,000,000` and `getPlayerOwnership():
//  100`, because they were written when this store kept its OWN cap table and
//  believed the player owned all of the company - while useShareholderStore
//  said 10,000,000 shares and 65%, and the price differed by a factor of ten
//  depending on which one you asked. That was the biggest numeric bug in the
//  game and it has been fixed; the store is now a thin layer over the
//  shareholder cap table.
//
//  So the old file was a frozen description of a world that no longer exists,
//  kept green by never being run. These test what is actually there.
//
//  ONE BUG IN THE ORIGINALS, worth recording: they called `getState()` once
//  and then read fields off that snapshot after mutating the store. Actions
//  are stable, state is not - every "after" line would have printed the
//  "before" value. They would have lied even if someone had run them.
// ============================================================================

import { useEquityStore } from './useEquityStore';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

/** Always the live state - see the note above. */
const s = () => useEquityStore.getState();

const CAP = 10_000_000;
const PLAYER = 3_500_000;   // 35%, the founder's real stake

beforeEach(() => {
    useShareholderStore.setState({
        totalShares: CAP,
        playerShareCount: PLAYER,
        members: [],
    } as any);
    useStatsStore.setState({ companySharePrice: 0, money: 0, companyCapital: 50_000_000 } as any);
    useEquityStore.getState().reset();
    useEquityStore.getState().refresh();
});

describe('where the share count comes from', () => {
    it('the shareholder store, not a second copy of it', () => {
        // The bug this store was rewritten to kill: it used to answer 100%.
        expect(s().totalShares).toBe(CAP);
        expect(s().playerShares).toBe(PLAYER);
        expect(s().getPlayerOwnership()).toBeCloseTo(35, 1);
    });

    it('and follows the board when it changes', () => {
        useShareholderStore.setState({ totalShares: 12_000_000 } as any);
        s().refresh();
        expect(s().totalShares).toBe(12_000_000);
        expect(s().getPlayerOwnership()).toBeCloseTo(29.17, 1);
    });
});

describe('the share price follows the valuation', () => {
    it('divides it by the shares actually outstanding', () => {
        s().syncStockPrice(50_000_000);
        // 50M over 10M shares. The old store divided by its own 1M and got $50.
        expect(s().stockPrice).toBeCloseTo(5, 2);
    });

    it('keeps twelve of them and no more', () => {
        // The fossil said seven. It is twelve, and twelve is what the code
        // has always done - the old file simply described a different store.
        for (let i = 1; i <= 20; i++) s().syncStockPrice(i * 10_000_000);
        expect(s().priceHistory).toHaveLength(12);
    });
});

describe('dilution', () => {
    it('mints shares, raises cash and costs you ownership', () => {
        s().syncStockPrice(50_000_000);
        const before = s().getPlayerOwnership();

        let raised = 0;
        const result = s().executeDilution(10, 50_000_000, (n) => { raised += n; });

        expect(result.newShares).toBeGreaterThan(0);
        expect(raised).toBeGreaterThan(0);
        expect(result.capitalRaised).toBeCloseTo(raised, 2);
        // The shares land on the CAP TABLE, which is the whole point.
        expect(useShareholderStore.getState().totalShares).toBeGreaterThan(CAP);
        s().refresh();
        expect(s().getPlayerOwnership()).toBeLessThan(before);
    });

    it('refuses an out-of-range request instead of quietly selling half', () => {
        // FOUND BY THIS TEST. The percentage was clamped to 0.5, so asking
        // for 150% sold FIFTY PERCENT of the company and reported success.
        // A slipped decimal on the dilution screen gave away half the cap
        // table, and the only sign was the ownership number afterwards.
        s().syncStockPrice(50_000_000);
        let raised = 0;
        const result = s().executeDilution(150, 50_000_000, (n) => { raised += n; });
        expect(result.newShares).toBe(0);
        expect(raised).toBe(0);
        expect(useShareholderStore.getState().totalShares).toBe(CAP);
    });

    it('and refuses nothing-at-all just as firmly', () => {
        s().syncStockPrice(50_000_000);
        expect(s().executeDilution(0, 50_000_000, () => { }).newShares).toBe(0);
        expect(s().executeDilution(-5, 50_000_000, () => { }).newShares).toBe(0);
    });

    it('still allows the largest legitimate placement', () => {
        s().syncStockPrice(50_000_000);
        expect(s().executeDilution(50, 50_000_000, () => { }).newShares).toBeGreaterThan(0);
    });

    it('the market reads an issue as a signal, and not a good one', () => {
        s().syncStockPrice(50_000_000);
        const before = s().marketMultiplier;
        s().executeDilution(10, 50_000_000, () => { });
        expect(s().marketMultiplier).toBeLessThan(before);
    });
});

describe('buyback', () => {
    it('spends cash, burns shares and hands ownership back', () => {
        s().syncStockPrice(50_000_000);
        // Sell some of the company first, so there is something to buy back.
        s().executeDilution(10, 50_000_000, () => { });
        s().refresh();
        const before = s().getPlayerOwnership();

        let spent = 0;
        const result = s().executeBuyback(2_000_000, 50_000_000, (n) => { spent += n; });

        expect(result.sharesBurned).toBeGreaterThan(0);
        expect(spent).toBeGreaterThan(0);
        s().refresh();
        expect(s().getPlayerOwnership()).toBeGreaterThan(before);
    });

    it('cannot buy back what was never sold', () => {
        // Founder holds 35%; the rest sits with named directors rather than
        // the public, so a fully-private company has nothing to repurchase.
        useShareholderStore.setState({
            totalShares: PLAYER, playerShareCount: PLAYER, members: [],
        } as any);
        s().refresh();
        s().syncStockPrice(50_000_000);
        expect(s().executeBuyback(1_000_000, 50_000_000, () => { }).sharesBurned).toBe(0);
    });
});

describe('dividend', () => {
    it('costs the whole company to pay you your third of it', () => {
        // The cap table's whole point, in one number: at 35% you spend a
        // pound to put thirty-five pence in your own pocket, before tax.
        s().syncStockPrice(50_000_000);
        const result = s().distributeDividend(0.10, () => { });

        expect(result.totalRequired).toBeGreaterThan(0);
        expect(result.playerGross).toBeLessThan(result.totalRequired);
        expect(result.playerGross / result.totalRequired).toBeCloseTo(0.35, 2);
        // And the taxman takes a cut of what reaches you.
        expect(result.playerPortion).toBeLessThanOrEqual(result.playerGross);
    });

    it('refuses a negative one, which used to be a money printer', () => {
        // FOUND BY THIS TEST. Nothing checked the sign: -1 per share gave a
        // totalCost of -10,000,000, and spending a negative number ADDS it.
        // The company paid itself ten million, in the one function whose
        // whole job is moving money out of the company.
        let moved = 0;
        const result = s().distributeDividend(-1, (n) => { moved += n; });
        expect(result.totalRequired).toBe(0);
        expect(moved).toBe(0);
    });

    it('and refuses a zero one, which was free sentiment', () => {
        const before = s().marketMultiplier;
        expect(s().distributeDividend(0, () => { }).totalRequired).toBe(0);
        expect(s().marketMultiplier).toBe(before);
    });
});
