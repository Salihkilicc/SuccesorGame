// src/core/market/casinoRisk.test.ts
//
// ============================================================================
//  THE COUNTER, AND THE TWO THINGS IT HAD TO GET RIGHT
// ============================================================================
//
//  The casino has been in this game since before any of the story and it has
//  never cost the chief executive anything except money. There was no counter
//  of any kind, so this file is mostly about the counter existing - and then
//  about the two decisions inside it.
//
//  A STREAK, NOT A TALLY. Counting visits would make the mechanic about volume
//  and a player who worked out that four was safe and five was not would be
//  playing a spreadsheet. One visit marks the quarter; the STREAK is scored.
//
//  ONE CLEAN QUARTER CLEARS IT. Merciful, and it is what turns the thirty per
//  cent into a tap the player controls rather than weather. A streak that
//  decayed slowly would be a debt, and a debt is not a decision.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useCasinoRiskStore, SCANDAL_STREAK } from '../store/useCasinoRiskStore';
import { casinoScandalEvent, SCANDAL_AT } from '../../data/events/casino';
import { testAll, type World } from '../story/conditions';
import { INITIAL_DIALS } from '../story/state';

const store = () => useCasinoRiskStore.getState();
const fresh = () => useCasinoRiskStore.getState().reset();

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 20,
    capital: 60_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

describe('the counter counts quarters, not visits', () => {
    it('one visit marks the quarter and a second changes nothing', () => {
        fresh();
        store().recordVisit();
        store().recordVisit();
        store().recordVisit();
        store().closeQuarter();
        expect(store().streak).toBe(1);
    });

    it('and a quarter with no visit clears the whole run', () => {
        fresh();
        for (let q = 0; q < 5; q++) { store().recordVisit(); store().closeQuarter(); }
        expect(store().streak).toBe(5);

        store().closeQuarter();      // one clean quarter
        expect(store().streak).toBe(0);
    });

    it('...and starting again starts from one, not from where it stopped', () => {
        fresh();
        for (let q = 0; q < 4; q++) { store().recordVisit(); store().closeQuarter(); }
        store().closeQuarter();
        store().recordVisit();
        store().closeQuarter();
        expect(store().streak).toBe(1);
    });

    it('advancing several months at once is still one quarter of attendance', () => {
        // The flag is all the evidence there is. Crediting three would let the
        // clock create a pattern that never happened.
        fresh();
        store().recordVisit();
        store().closeQuarter(3);
        expect(store().streak).toBe(1);
    });

    it('and the longest run is remembered even after the streak breaks', () => {
        fresh();
        for (let q = 0; q < 6; q++) { store().recordVisit(); store().closeQuarter(); }
        store().closeQuarter();
        expect(store().streak).toBe(0);
        expect(store().longestStreak).toBe(6);
    });
});

describe('three in a row is where it becomes printable', () => {
    it('the scene and the store agree on the number', () => {
        expect(SCANDAL_AT).toBe(SCANDAL_STREAK);
    });

    it('two quarters is not a pattern', () => {
        expect(testAll(casinoScandalEvent.when, world({ casinoStreak: 2 }))).toBe(false);
    });

    it('three is', () => {
        expect(testAll(casinoScandalEvent.when, world({ casinoStreak: 3 }))).toBe(true);
        expect(testAll(casinoScandalEvent.when, world({ casinoStreak: 9 }))).toBe(true);
    });

    it('and it is fifteen per cent, rolled again every quarter the streak survives', () => {
        expect(casinoScandalEvent.chance).toBeCloseTo(0.15, 6);
    });

    it('and once it has run it cannot run again', () => {
        expect(testAll(casinoScandalEvent.when,
            world({ casinoStreak: 9, flags: { fatherDead: true, casinoScandal: true } })))
            .toBe(false);
    });

    it('and the player who stops is out of range immediately', () => {
        // The mercy is the mechanic: the streak clears on one clean quarter,
        // and the gate reads the streak.
        fresh();
        for (let q = 0; q < 4; q++) { store().recordVisit(); store().closeQuarter(); }
        expect(testAll(casinoScandalEvent.when, world({ casinoStreak: store().streak })))
            .toBe(true);
        store().closeQuarter();
        expect(testAll(casinoScandalEvent.when, world({ casinoStreak: store().streak })))
            .toBe(false);
    });
});
