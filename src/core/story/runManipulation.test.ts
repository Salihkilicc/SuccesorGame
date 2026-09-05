// src/core/story/runManipulation.test.ts
//
// ============================================================================
//  THE WHOLE ARC, THROUGH THE REAL STORES
// ============================================================================
//
//  The rule is tested next door. This is the half that can be correct and
//  still do nothing, which is the failure this codebase produces more than any
//  other: a number computed every quarter that no screen and no decision ever
//  reads.
//
//  So these drive the actual stores over the actual arc - crash, buy,
//  recover - and check that the run really ends.
// ============================================================================

import { useStoryStore } from '../store/useStoryStore';
import { useStatsStore } from '../store/useStatsStore';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';
import { runManipulationWatch, boardLoyalty, NO_BOARD_LOYALTY, applyVerdict } from './runManipulation';
import { INVESTIGATION_WINDOW, judge } from './manipulation';
import { ENDINGS } from '../../data/story/endings';

const REF = 170;

/** One quarter of the watch, with everything the tick would pass it. */
const quarter = (over: Partial<Parameters<typeof runManipulationWatch>[0]>) =>
    runManipulationWatch({
        quarter: 10,
        priceAtBuy: 3.4,
        referenceAtBuy: REF,
        priceNow: 3.4,
        ownershipBefore: 35,
        ownershipAfter: 35,
        personalWealth: 5_000_000,
        ...over,
    });

beforeEach(() => {
    useStoryStore.getState().reset();
    useShareholderStore.getState().initializeGame(true);
});

describe('a quarter that is not worth remembering', () => {
    it('leaves the ledger empty', () => {
        quarter({});
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(0);
    });

    it('and so does buying at a fair price', () => {
        quarter({ priceAtBuy: REF, priceNow: REF, ownershipAfter: 100 });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(0);
    });
});

describe('the arc', () => {
    it('buying the floor is written down and nothing happens yet', () => {
        // The purchase was legal on the day, and at this moment there is
        // genuinely no way to tell it from courage.
        quarter({ ownershipAfter: 100 });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(1);
        expect(useStoryStore.getState().manipulationVerdict).toBeNull();
        expect(useStoryStore.getState().ending).toBeNull();
    });

    it('and a company that stays broken is never charged for it', () => {
        // THE HONEST PLAYER, run for the whole window through the real store.
        quarter({ ownershipAfter: 100 });
        for (let q = 11; q <= 10 + INVESTIGATION_WINDOW + 2; q++) {
            quarter({ quarter: q, priceNow: 3.4, ownershipBefore: 100, ownershipAfter: 100 });
        }
        expect(useStoryStore.getState().manipulationVerdict).toBeNull();
        expect(useStoryStore.getState().ending).toBeNull();
    });

    it('and the ledger is emptied once the entries are too old to prove anything', () => {
        // Otherwise a forty year run carries every suspicious quarter it ever
        // had, in a save file, forever.
        quarter({ ownershipAfter: 100 });
        quarter({ quarter: 11 + INVESTIGATION_WINDOW, priceNow: 3.4, ownershipBefore: 100, ownershipAfter: 100 });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(0);
    });

    it('but a company that comes back ends the run', () => {
        // THE EXPLOIT, end to end.
        quarter({ ownershipAfter: 100 });
        const verdict = quarter({
            quarter: 14, priceNow: REF, ownershipBefore: 100, ownershipAfter: 100,
        });
        expect(verdict?.verdict).toBe('prison');
        expect(useStoryStore.getState().ending).toBe('convictedOfManipulation');
    });

    it('and the ending it names is one that exists', () => {
        quarter({ ownershipAfter: 100 });
        quarter({ quarter: 14, priceNow: REF, ownershipBefore: 100, ownershipAfter: 100 });
        expect(ENDINGS[useStoryStore.getState().ending!]).toBeDefined();
    });

    it('and it is only ever brought once', () => {
        quarter({ ownershipAfter: 100 });
        const first = quarter({ quarter: 14, priceNow: REF, ownershipBefore: 100, ownershipAfter: 100 });
        const second = quarter({ quarter: 15, priceNow: REF, ownershipBefore: 100, ownershipAfter: 100 });
        expect(first).not.toBeNull();
        expect(second).toBeNull();
    });

    it('and a run that has already ended is not investigated', () => {
        useStoryStore.getState().endGame('wentBankrupt');
        quarter({ ownershipAfter: 100 });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(0);
        expect(useStoryStore.getState().ending).toBe('wentBankrupt');
    });
});

describe('the defence comes from the real board', () => {
    it('and it reads LOYALTY rather than trust', () => {
        // The distinction governance.ts already had to make: a Snake enjoying
        // your downfall has high trust and would otherwise have counted as a
        // character witness for you.
        const src = require('fs').readFileSync(__dirname + '/runManipulation.ts', 'utf8');
        expect(src).toMatch(/loyaltyOf\(m as any\)/);
        expect(src).not.toMatch(/sum \+ m\.trust/);
    });

    it('and an empty board is neutral rather than hostile', () => {
        // ------------------------------------------------------------------
        //  THIS ASSERTED 0, WHICH IS WHAT MADE OWNING THE COMPANY A CRIME
        // ------------------------------------------------------------------
        //  Zero on this scale is every director in the room testifying
        //  AGAINST you. But the player with no board is the one who bought
        //  them all out, which the game offers as a way to win.
        //
        //  Reported as being barred while holding a hundred per cent having
        //  done nothing illegal. Measured on one purchase at 35% of
        //  reference with the price recovering: an ordinary board gave a
        //  fine and no board gave barred, for the identical act.
        //
        //  The test agreed with the code rather than with the game, which is
        //  why it survived.
        // ------------------------------------------------------------------
        useShareholderStore.setState({ members: [] });
        expect(boardLoyalty()).toBe(NO_BOARD_LOYALTY);
        expect(NO_BOARD_LOYALTY).toBeGreaterThan(0);
        expect(NO_BOARD_LOYALTY).toBeLessThan(100);
    });

    it('and the opening board gives a real number', () => {
        const l = boardLoyalty();
        expect(l).toBeGreaterThan(0);
        expect(l).toBeLessThanOrEqual(100);
    });
});

describe('what each verdict costs', () => {
    it('a fine comes out of the player pocket and the run continues', () => {
        useStatsStore.getState().update({ money: 1_000_000_000 });
        const j = judge(
            [{ quarter: 10, referenceAtBuy: REF, priceAtBuy: 3.4, gained: 65 }],
            { boardLoyalty: 90, personalWealth: 1_000_000_000 },
        );
        expect(j.verdict).toBe('fine');
        expect(applyVerdict(j)).toBeNull();
        expect(useStatsStore.getState().money).toBe(1_000_000_000 - j.fine);
    });

    it('and a fine never drives the player below zero', () => {
        useStatsStore.getState().update({ money: 10 });
        applyVerdict({
            verdict: 'fine', margin: 0.1, caseStrength: 0.5, defenceStrength: 0.4,
            fine: 999_999_999,
        });
        expect(useStatsStore.getState().money).toBe(0);
    });

    it('and being barred hands the company on rather than ending the dynasty', () => {
        expect(applyVerdict({
            verdict: 'barred', margin: 0.3, caseStrength: 0.7, defenceStrength: 0.4, fine: 0,
        })).toBe('barredForManipulation');
    });

    it('and prison ends the run', () => {
        expect(applyVerdict({
            verdict: 'prison', margin: 0.8, caseStrength: 0.98, defenceStrength: 0.17, fine: 0,
        })).toBe('convictedOfManipulation');
    });
});

describe('and the tick actually calls it', () => {
    it('which is the difference between a rule and a rule nobody runs', () => {
        const src = require('fs').readFileSync(
            __dirname + '/../store/useGameStore.ts', 'utf8');
        // ANCHORED TO THE START OF THE STATEMENT. My first version matched
        // `runManipulationWatch({` anywhere, so the probe - prefixing the call
        // with `false &&` to disable it entirely - left this test green.
        expect(src).toMatch(/^\s*runManipulationWatch\(\{$/m);
        expect(src).toMatch(/import \{ runManipulationWatch \} from '\.\.\/story\/runManipulation'/);
        // The price the buying HAPPENED at, not the one the quarter closes on.
        expect(src).toMatch(/priceAtBuy: prevPrice/);
        expect(src).toMatch(/priceNow: newSharePrice/);
    });

    it('and the ledger survives a save, or the whole mechanic is a session long', () => {
        const src = require('fs').readFileSync(
            __dirname + '/../store/useStoryStore.ts', 'utf8');
        expect(src).toMatch(/manipulationLedger: state\.manipulationLedger/);
        expect(src).toMatch(/manipulationVerdict: state\.manipulationVerdict/);
        // And a save written before any of this existed does not crash on the
        // first tick after the update.
        expect(src).toMatch(/manipulationLedger: p\.manipulationLedger \?\? \[\]/);
    });

    it('and a new game is not on trial for the last one', () => {
        const src = require('fs').readFileSync(
            __dirname + '/../store/useStoryStore.ts', 'utf8');
        const reset = src.slice(src.indexOf('reset: () => set({'));
        expect(reset).toMatch(/manipulationLedger: \[\]/);
        expect(reset).toMatch(/manipulationVerdict: null/);
    });
});
