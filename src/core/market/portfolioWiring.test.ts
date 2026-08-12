// src/core/market/portfolioWiring.test.ts
//
// ============================================================================
//  DOES THE MONEY ACTUALLY ARRIVE, AND AT THE RIGHT NUMBER
// ============================================================================
//
//  The one that matters: a `divest` effect that credited the ORDINARY price
//  while the letter said fifty-five per cent would be a scene that lies to the
//  player about the thing it exists to be about, and nothing would fail.
//
//  It also checks that the story can see what the player holds. `owns` reads
//  useCorporateFinanceStore.subsidiaries, and if that wiring were missing every
//  one of the three letters would simply never arrive - a whole prompt's work
//  silently switched off, which is this repository's favourite failure.
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
import { useCorporateFinanceStore } from '../../features/finance/stores/useCorporateFinanceStore';
import { gameSink } from '../story/gameSink';
import { readWorld } from '../story/world';
import { quoteDivestiture, DIVESTITURE_DISCOUNT } from './mergers';
import { testAll } from '../story/conditions';
import {
    portfolioVultureEvent, VULTURE_MULTIPLE, PEAR_MULTIPLE, SQUEEZE_THRESHOLD,
} from '../../data/events/portfolio';

const fresh = (capital = 500_000_000_000) => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: capital, companyValue: 500_000_000_000,
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useCorporateFinanceStore.setState({ subsidiaries: [] } as any);
};

const buy = (id: string, name: string, marketCap: number, risk: any = 'Low') =>
    useCorporateFinanceStore.getState().executeAcquisition({
        target: { id, name, marketCap, risk, category: 'Technology' },
        hostile: false, financing: 'cash',
    } as any);

describe('the story can see what the player holds', () => {
    it('an acquisition appears in the world the conditions read', () => {
        fresh();
        expect(readWorld().subsidiaries).toEqual([]);
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        expect(readWorld().subsidiaries).toContain('tech_skynet');
    });

    it('and a sale removes it, so the letter stops arriving', () => {
        // The whole reason `owns` is a condition and not a flag.
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        useCorporateFinanceStore.getState().sellSubsidiary('tech_skynet');
        expect(readWorld().subsidiaries).not.toContain('tech_skynet');
    });

    it('so the squeeze reaches a short company holding it, and nobody else', () => {
        // End to end, through the real stores rather than a hand-built world.
        // RICH FIRST, THEN BROKE. The first version of this test started the
        // company at the squeeze threshold and then tried to buy a $44bn
        // company, which of course failed - so `subsidiaries` was empty and
        // the letter was correctly unreachable for a reason that had nothing
        // to do with what was being tested.
        fresh();
        useStoryStore.getState().raise('fatherDead');
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        useStatsStore.setState({ companyCapital: SQUEEZE_THRESHOLD - 1 } as any);
        expect(testAll(portfolioVultureEvent.when, readWorld())).toBe(true);

        useStatsStore.setState({ companyCapital: SQUEEZE_THRESHOLD * 100 } as any);
        expect(testAll(portfolioVultureEvent.when, readWorld())).toBe(false);
    });
});

describe('the money that arrives is the money the letter promised', () => {
    it('the fund pays its number, not the market number', () => {
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        const sub = (useCorporateFinanceStore.getState().subsidiaries as any[])[0];
        const quote = quoteDivestiture(sub.deal);
        const before = useStatsStore.getState().companyCapital ?? 0;

        gameSink().divest('tech_skynet', VULTURE_MULTIPLE);

        const got = (useStatsStore.getState().companyCapital ?? 0) - before;
        expect(got).toBeCloseTo(quote.currentFairValue * VULTURE_MULTIPLE, 0);
        // And it really is worse than simply selling it, which is the point.
        expect(got).toBeLessThan(quote.proceeds);
    });

    it('and Pear pays more than a market sale would, which is also the point', () => {
        fresh();
        buy('tech_streamify', 'Streamify', 1_240_000_000, 'Medium');
        const sub = (useCorporateFinanceStore.getState().subsidiaries as any[])[0];
        const quote = quoteDivestiture(sub.deal);
        const before = useStatsStore.getState().companyCapital ?? 0;

        gameSink().divest('tech_streamify', PEAR_MULTIPLE);

        const got = (useStatsStore.getState().companyCapital ?? 0) - before;
        expect(got).toBeGreaterThan(quote.proceeds);
        expect(got).toBeCloseTo(quote.currentFairValue * PEAR_MULTIPLE, 0);
    });

    it('an ordinary sale is unchanged, so every existing caller still works', () => {
        // The multiple is optional and omitting it must mean exactly what it
        // meant before this prompt: fair value less the divestiture discount.
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        const sub = (useCorporateFinanceStore.getState().subsidiaries as any[])[0];
        const quote = quoteDivestiture(sub.deal);
        const before = useStatsStore.getState().companyCapital ?? 0;

        useCorporateFinanceStore.getState().sellSubsidiary('tech_skynet');

        const got = (useStatsStore.getState().companyCapital ?? 0) - before;
        expect(got).toBeCloseTo(quote.proceeds, 0);
        expect(got).toBeCloseTo(quote.currentFairValue * (1 - DIVESTITURE_DISCOUNT), 0);
    });

    it('and the company leaves the portfolio either way', () => {
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        gameSink().divest('tech_skynet', VULTURE_MULTIPLE);
        expect(useCorporateFinanceStore.getState().subsidiaries).toHaveLength(0);
    });

    it('selling something you do not own does nothing rather than crashing', () => {
        fresh();
        expect(() => gameSink().divest('tech_skynet', VULTURE_MULTIPLE)).not.toThrow();
        expect(useStatsStore.getState().companyCapital).toBe(500_000_000_000);
    });
});
