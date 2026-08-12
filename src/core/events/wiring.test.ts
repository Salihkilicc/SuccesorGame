// src/core/events/wiring.test.ts
//
// ============================================================================
//  DOES ANY OF IT ACTUALLY REACH THE PLAYER
// ============================================================================
//
//  engine.test.ts proves the roll is correct. This proves it is CONNECTED,
//  which is a different claim and the one this codebase keeps failing: the
//  buffs the engine never read, applyCorporateShock written and never called,
//  the news effect that logged to the console, evaluateSubsidiaries defined
//  and never invoked. Every one of those was correct code nothing ran.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useGameStore, initialGameState } from '../store/useGameStore';
import { useStatsStore, initialStatsState } from '../store/useStatsStore';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useNewsStore } from '../store/useNewsStore';
import { useMessageStore } from '../store/useMessageStore';
import { gameSink } from '../story/gameSink';
import { runEvents } from './runQuarter';
import { EVENTS } from '../../data/events';
import { readWorld } from '../story/world';
import { testAll } from '../story/conditions';
import { useLaboratoryStore } from '../store/useLaboratoryStore';
import { cooLineShortEvent } from '../../data/events/plantFloor';

const seeded = (seed: number) => {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
const realRandom = Math.random;
afterEach(() => { Math.random = realRandom; });

/** A company old enough and large enough for every event to be possible. */
const grownCompany = () => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyName: 'Harness Industries',
        companyCapital: 500_000_000,
        brandValue: 40,
        brandByCategory: { Consumer: 40, 'Deep Tech': 40 },
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useNewsStore.getState().reset();
    useMessageStore.getState().reset();
};

describe('a company-wide reputation hit survives the night', () => {
    it('lands in the categories, where the tick reads it from', () => {
        // THE BUG, MEASURED. `brand` wrote stats.brandValue directly and the
        // tick DERIVES that field from brandByCategory every quarter. A -25
        // scandal showed 40 -> 15 and the next tick recomputed it back to
        // 33.4 from categories the scandal never touched. Nothing failed; it
        // simply did not survive the night.
        grownCompany();
        gameSink().brand(-25);

        const s = useStatsStore.getState();
        expect(s.brandValue).toBeCloseTo(15, 5);
        // Both categories took a slice, and the heavier market took more.
        expect(s.brandByCategory!['Deep Tech']).toBeLessThan(s.brandByCategory!.Consumer);
    });

    it('and the hit to the corporate figure is exactly the amount asked for', () => {
        // The normaliser in applyCorporateShock. Spreading proportionally
        // without it lands a -25 as roughly -19, and the error grows with the
        // number of categories - so the bug would arrive as the player
        // expanded, which is the worst time to start doubting the numbers.
        grownCompany();
        const before = useStatsStore.getState().brandValue;
        gameSink().brand(-25);
        expect(before - useStatsStore.getState().brandValue).toBeCloseTo(25, 5);
    });

    it('works upwards too', () => {
        grownCompany();
        gameSink().brand(10);
        expect(useStatsStore.getState().brandValue).toBeCloseTo(50, 5);
    });

    it('a scene before the first quarter closes is not silently dropped', () => {
        // No categories exist yet. Spreading over nothing would lose it.
        grownCompany();
        useStatsStore.setState({ brandByCategory: {}, brandValue: 30 } as any);
        gameSink().brand(-10);
        expect(useStatsStore.getState().brandValue).toBe(20);
    });
});

describe('an event that fires reaches the player', () => {
    it('publishes its headline and queues its scene', () => {
        grownCompany();
        Math.random = () => 0;   // everything eligible wins

        runEvents();

        const news = useNewsStore.getState().items;
        expect(news).toHaveLength(1);
        expect(EVENTS.some(e => e.headline === news[0].headline)).toBe(true);

        const pending = useStoryStore.getState().pending;
        expect(pending).toHaveLength(1);
        expect(EVENTS.some(e => e.conversation.id === pending[0].conversationId)).toBe(true);
    });

    it('records the firing, so the cooldown is real', () => {
        grownCompany();
        Math.random = () => 0;

        runEvents();
        const firedId = Object.keys(useStoryStore.getState().eventHistory.lastFired)[0];
        expect(firedId).toBeDefined();
        const firedScene = EVENTS.find(e => e.id === firedId)!.conversation.id;

        // Rolled again in the same quarter. Another event may well fire - the
        // limit is per roll, not per quarter - but the one already spent must
        // not come back.
        runEvents();
        const times = useStoryStore.getState().pending
            .filter(p => p.conversationId === firedScene).length;
        expect(times).toBe(1);
    });

    it('does nothing at all to a company in its first year', () => {
        useGameStore.setState({ ...initialGameState, _hasHydrated: true });
        useStatsStore.setState({ ...initialStatsState, _hasHydrated: true } as any);
        useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
        useNewsStore.getState().reset();
        Math.random = () => 0;

        runEvents();

        expect(useNewsStore.getState().items).toEqual([]);
        expect(useStoryStore.getState().pending).toEqual([]);
    });
});

describe('the two numbers the COO and the CTO were given', () => {
    // ----------------------------------------------------------------------
    //  THE FAILURE THIS EXISTS FOR
    // ----------------------------------------------------------------------
    //  `staffing` is derived in readWorld from the last closed quarter's
    //  report. If those fields are not there, or not there yet, the divide
    //  falls back to 100 and the COO simply never speaks - a silent, total
    //  failure of an entire arc with no error anywhere. Exactly the shape of
    //  the buffs the engine never read and the news that logged to a console.
    //
    //  So this advances a REAL quarter with a deliberately under-crewed plant
    //  and reads the world the way a condition would.
    // ----------------------------------------------------------------------
    it('a plant running under crew is visible to the story', async () => {
        grownCompany();
        // Tier 4 needs 72. Give it 30 and freeze the target there, which is
        // what a player who upgraded and never reopened the staff screen has.
        useStatsStore.setState({
            facilityTier: 4, employeeCount: 30, targetHeadcount: 30, incomingHires: 0,
        } as any);

        await useGameStore.getState().advanceMonth(3);

        const w = readWorld();
        expect(w.staffing).toBeGreaterThan(0);
        expect(w.staffing).toBeLessThan(50);
        expect(testAll(cooLineShortEvent.when, { ...w, flags: { fatherDead: true } }))
            .toBe(true);
    });

    it('and a fully crewed one is not', async () => {
        grownCompany();
        useStatsStore.setState({
            facilityTier: 4, employeeCount: 90, targetHeadcount: 90, incomingHires: 0,
        } as any);

        await useGameStore.getState().advanceMonth(3);

        const w = readWorld();
        expect(w.staffing).toBeGreaterThanOrEqual(100);
        expect(testAll(cooLineShortEvent.when, { ...w, flags: { fatherDead: true } }))
            .toBe(false);
    });

    it('before any quarter has closed, nobody is short of anything', () => {
        // crewRequired is 0 in the blank report and 0/0 is NaN, which passes no
        // comparison and fails every one - so the arc would be dead on a fresh
        // save and would look like a design decision.
        grownCompany();
        expect(Number.isNaN(readWorld().staffing)).toBe(false);
        expect(readWorld().staffing).toBe(100);
    });

    it('and the lab count reaches the story from the store that owns it', () => {
        grownCompany();
        expect(readWorld().researchers).toBe(0);
        useLaboratoryStore.setState({ researcherCount: 15 } as any);
        expect(readWorld().researchers).toBe(15);
        useLaboratoryStore.setState({ researcherCount: 0 } as any);
    });
});

describe('the tick runs the roll', () => {
    it('a whole quarter can fire an event without anything being called by hand', async () => {
        // The claim that matters. Everything above calls runEvents directly;
        // this one only advances time, which is what the game does.
        grownCompany();
        Math.random = seeded(7);

        let sawNews = false;
        for (let q = 0; q < 12 && !sawNews; q++) {
            await useGameStore.getState().advanceMonth(3);
            sawNews = useNewsStore.getState().items.length > 0;
        }
        expect(sawNews).toBe(true);
    });
});
