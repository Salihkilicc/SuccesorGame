// src/core/market/rippleWiring.test.ts
//
// ============================================================================
//  DOES BUYING A COMPANY ACTUALLY SUMMON ANYBODY
// ============================================================================
//
//  ripple.test.ts proves the arithmetic and the writing. This proves the two
//  ends are joined: that a real acquisition raises the flag, and that the two
//  answers reach the deal rather than stopping at a sink function.
//
//  The failure being guarded against is the one this codebase produces over
//  and over - correct code with nothing calling it. A raid that never reaches
//  `subsidiaries` would be the worst version of it, because the player would
//  read the letter, choose to absorb the damage, and silently take none.
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
import { defenceCost, RIVAL_REALIZATION, VULTURE_REALIZATION } from './ripple';

const fresh = () => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: 500_000_000_000,
        companyValue: 500_000_000_000,
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useCorporateFinanceStore.setState({ subsidiaries: [] } as any);
};

const buy = (id: string, name: string, marketCap: number, risk: any = 'Low') =>
    useCorporateFinanceStore.getState().executeAcquisition({
        target: { id, name, marketCap, risk, category: 'Technology' },
        hostile: false,
        financing: 'cash',
    } as any);

describe('buying one of the six is noticed', () => {
    it('the acquisition raises the flag the letter waits on', () => {
        fresh();
        const result = buy('ind_voltmotors', 'VoltMotors', 9_800_000_000);
        expect(result.success).toBe(true);
        expect(useStoryStore.getState().flags.boughtVoltmotors).toBe(true);
    });

    it('and buying anything else raises nothing', () => {
        fresh();
        buy('tech_micro', 'Microhard', 5_000_000_000);
        const flags = useStoryStore.getState().flags;
        expect(Object.keys(flags).filter(f => f.startsWith('bought'))).toEqual([]);
    });

    it('the mapping is data, so a seventh company would be a line rather than a branch', () => {
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        buy('tech_planora', 'Planora', 640_000_000, 'High');
        const flags = useStoryStore.getState().flags;
        expect(flags.boughtSkynet).toBe(true);
        expect(flags.boughtPlanora).toBe(true);
    });
});

describe('the two answers reach the deal', () => {
    it('absorbing writes the damage onto that deal and no other', () => {
        fresh();
        buy('ind_voltmotors', 'VoltMotors', 9_800_000_000);
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');

        gameSink().raid('ind_voltmotors');

        // ASSERTED ON `sub.deal`, which is where the quarterly model reads
        // from. The first version of this test asserted on the subsidiary
        // wrapper and passed while the sink wrote to the wrong object - a
        // field perfectly stored and read by nothing, which is this
        // codebase's signature bug and which I reproduced inside the test
        // written to catch it.
        const deals = useCorporateFinanceStore.getState().subsidiaries as any[];
        const volt = deals.find(d => d.id === 'ind_voltmotors');
        const sky = deals.find(d => d.id === 'tech_skynet');
        expect(volt.deal.synergyRealization).toBe(RIVAL_REALIZATION);
        // The other company you own is untouched. A share or brand penalty
        // would have hit both, which is the wrong shape.
        expect(sky.deal.synergyRealization).toBeUndefined();
    });

    it('and the fund does less damage than the rival, from the data rather than the scene', () => {
        fresh();
        buy('tech_skynet', 'SkyNet AI', 44_000_000_000, 'Extreme');
        gameSink().raid('tech_skynet');
        const sky = (useCorporateFinanceStore.getState().subsidiaries as any[])
            .find(d => d.id === 'tech_skynet');
        expect(sky.deal.synergyRealization).toBe(VULTURE_REALIZATION);
    });

    it('two raids on one deal cannot stack their way to zero', () => {
        fresh();
        buy('ind_voltmotors', 'VoltMotors', 9_800_000_000);
        gameSink().raid('ind_voltmotors');
        gameSink().raid('ind_voltmotors');
        const volt = (useCorporateFinanceStore.getState().subsidiaries as any[])
            .find(d => d.id === 'ind_voltmotors');
        expect(volt.deal.synergyRealization).toBe(RIVAL_REALIZATION);
    });

    it('a raid on a company you do not own does nothing rather than crashing', () => {
        fresh();
        expect(() => gameSink().raid('ind_voltmotors')).not.toThrow();
    });

    it('paying charges the company, priced off what the target earns', () => {
        fresh();
        buy('ind_voltmotors', 'VoltMotors', 9_800_000_000);
        const sub = (useCorporateFinanceStore.getState().subsidiaries as any[])
            .find(d => d.id === 'ind_voltmotors');
        const before = useStatsStore.getState().companyCapital ?? 0;

        gameSink().retention('ind_voltmotors');

        const spent = before - (useStatsStore.getState().companyCapital ?? 0);
        expect(spent).toBeCloseTo(defenceCost(sub.deal.targetAnnualEbit), 0);
        expect(spent).toBeGreaterThan(0);
    });

    it('and paying leaves the synergy alone, which is what was bought', () => {
        fresh();
        buy('ind_voltmotors', 'VoltMotors', 9_800_000_000);
        gameSink().retention('ind_voltmotors');
        const volt = (useCorporateFinanceStore.getState().subsidiaries as any[])
            .find(d => d.id === 'ind_voltmotors');
        expect(volt.deal.synergyRealization).toBeUndefined();
    });
});
