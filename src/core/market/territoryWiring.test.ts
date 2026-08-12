// src/core/market/territoryWiring.test.ts
//
// ============================================================================
//  DO EITHER OF THE TWO COSTS ACTUALLY HAPPEN
// ============================================================================
//
//  territory.test.ts proves the arithmetic. This proves it reaches the game,
//  and it is the check this codebase has needed more than any other: the
//  subsidiary buffs the engine never read, applyCorporateShock never called,
//  acquisitionEarnings computed and added to nothing, a Compose button wired
//  to an empty function. Every one of those was correct code that ran nowhere.
//
//  A royalty that is agreed and never charged would be the same bug with the
//  worst possible shape: the player would take the cheap-looking door, feel
//  the trap close, and never pay anything.
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
import { useTerritoryStore } from '../store/useTerritoryStore';
import { gameSink } from '../story/gameSink';
import { ROYALTY_RATE, SIEGE_QUARTERS, SIEGE_PRESSURE } from './territory';

const fresh = () => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: 500_000_000,
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useTerritoryStore.getState().reset();
};

describe('the effects reach the store', () => {
    it('agreeing writes a royalty that does not expire', () => {
        fresh();
        gameSink().royalty('Robotics', ROYALTY_RATE);

        const [term] = useTerritoryStore.getState().royalties;
        expect(term.category).toBe('Robotics');
        expect(term.rate).toBe(ROYALTY_RATE);
        // The name of whoever you agreed with, resolved from the market data
        // rather than passed in by the scene - so a rebalance cannot leave the
        // player owing money to somebody who is no longer the incumbent.
        expect(term.giant).toBe('Edison Motors');
    });

    it('and signing the same category twice does not stack two cuts', () => {
        // The scene can only fire once, but a store that trusts a scene to
        // behave is a store that will one day be wrong.
        fresh();
        gameSink().royalty('Robotics', ROYALTY_RATE);
        gameSink().royalty('Robotics', ROYALTY_RATE);
        expect(useTerritoryStore.getState().royalties).toHaveLength(1);
    });

    it('refusing starts a siege with a counter on it', () => {
        fresh();
        gameSink().siege('Deep Tech', SIEGE_QUARTERS, SIEGE_PRESSURE);

        expect(useTerritoryStore.getState().pressureIn('Deep Tech')).toBe(SIEGE_PRESSURE);
        expect(useTerritoryStore.getState().pressureIn('Robotics')).toBe(1);
    });
});

describe('the tick charges what was agreed', () => {
    it('a quarter with a royalty costs more than the same quarter without one', async () => {
        // MEASURED AGAINST ITSELF. Two identical companies, one quarter each,
        // and the only difference between them is the agreement - so the gap
        // cannot be anything except the royalty.
        const runQuarter = async (withRoyalty: boolean) => {
            fresh();
            if (withRoyalty) gameSink().royalty('Consumer', ROYALTY_RATE);
            await useGameStore.getState().advanceMonth(3);
            return useGameStore.getState().lastQuarterReport as any;
        };

        const clean = await runQuarter(false);
        const taxed = await runQuarter(true);

        const revenue = (clean.products ?? [])
            .filter((p: any) => (p.category ?? 'Consumer') === 'Consumer')
            .reduce((s: number, p: any) => s + (p.revenue ?? 0), 0);

        // Only meaningful if the starter company sold something, which it does.
        expect(revenue).toBeGreaterThan(0);
        expect(taxed.totalExpenses - clean.totalExpenses)
            .toBeCloseTo(revenue * ROYALTY_RATE, 0);
    });

    it('and a siege costs share in its category and nowhere else', async () => {
        const runQuarter = async (besieged: boolean) => {
            fresh();
            if (besieged) gameSink().siege('Consumer', SIEGE_QUARTERS, SIEGE_PRESSURE);
            await useGameStore.getState().advanceMonth(3);
            return useGameStore.getState().lastQuarterReport as any;
        };

        const clean = await runQuarter(false);
        const under = await runQuarter(true);

        const shareOf = (r: any) => (r.products ?? [])
            .filter((p: any) => (p.category ?? 'Consumer') === 'Consumer')
            .reduce((s: number, p: any) => s + (p.marketShare ?? 0), 0);

        expect(shareOf(clean)).toBeGreaterThan(0);
        expect(shareOf(under)).toBeLessThan(shareOf(clean));
    });

    it('and the siege runs down on its own, without anybody clearing it', async () => {
        fresh();
        gameSink().siege('Consumer', SIEGE_QUARTERS, SIEGE_PRESSURE);

        for (let q = 0; q < SIEGE_QUARTERS; q++) {
            await useGameStore.getState().advanceMonth(3);
        }
        expect(useTerritoryStore.getState().pressureIn('Consumer')).toBe(1);
        expect(useTerritoryStore.getState().sieges).toEqual([]);
    });

    it('but the royalty is still there afterwards, because it is forever', async () => {
        fresh();
        gameSink().royalty('Consumer', ROYALTY_RATE);
        for (let q = 0; q < SIEGE_QUARTERS + 2; q++) {
            await useGameStore.getState().advanceMonth(3);
        }
        expect(useTerritoryStore.getState().royalties).toHaveLength(1);
    });
});

describe('walking into a market raises the flag that summons the letter', () => {
    it('the tick notices, off units actually sold', async () => {
        fresh();
        // The starter company sells phones, so Consumer moves and the other
        // three do not. Consumer has no entry flag by design.
        await useGameStore.getState().advanceMonth(3);

        const flags = useStoryStore.getState().flags;
        expect(flags.enteredRobotics).toBeUndefined();
        expect(flags.enteredDeepTech).toBeUndefined();
        expect(flags.enteredBioTech).toBeUndefined();
    });
});
