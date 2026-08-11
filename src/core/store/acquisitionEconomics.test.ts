// src/core/store/acquisitionEconomics.test.ts
//
// ============================================================================
//  AN ACQUISITION IS AN INVESTMENT, NOT A POWER-UP
// ============================================================================
//
//  Buying a company used to do two unrelated things at once. It bought you a
//  stream of earnings - which is what buying a company does - and it also
//  handed you a permanent multiplier on your own operations: research 15%
//  faster, unit costs 10% lower, marketing 15% louder. The second one had no
//  balance-sheet existence. It was a magic item.
//
//  That is now gone, and this file is what keeps it gone. It runs the REAL
//  quarterly tick twice over identical companies - one holding subsidiaries
//  carrying every buff type, one holding none - and asserts the two quarters
//  come out to the same numbers.
//
//  WHY A WHOLE-TICK TEST RATHER THAN THREE UNIT TESTS. The buff was read in
//  three places, and a unit test per read site would pass just as happily
//  after someone added a fourth. This asserts the property the design
//  actually wants: a subsidiary cannot reach the operating engine at all.
//
//  The financial side is asserted here too, and it has to be, because
//  "acquisitions do nothing" would pass the test above perfectly.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useGameStore, initialGameState } from './useGameStore';
import { useStatsStore, initialStatsState } from './useStatsStore';
import { useProductStore, initialProductState } from './useProductStore';
import { useLaboratoryStore } from './useLaboratoryStore';
import { useUserStore } from './useUserStore';
import { useCorporateFinanceStore } from '../../features/finance/stores/useCorporateFinanceStore';
import { estimateTargetEbit } from '../market/mergers';

// ----------------------------------------------------------------------------
//  DETERMINISM
// ----------------------------------------------------------------------------
//  The tick rolls dice in several places - scrap, subsidiary drift, morale
//  events. Two runs of a random quarter differ for reasons that have nothing
//  to do with the thing under test, so the generator is replaced with a fixed
//  sequence and reset before each run. Same seed, same rolls, and any
//  difference between the two runs is therefore caused by the portfolio.
// ----------------------------------------------------------------------------
const seeded = (seed: number) => {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
};

const BUFFED_SUBS = [
    { id: 'sub_rnd', name: 'Helix Research', category: 'Technology', acquisitionBuff: { type: 'R_AND_D_SPEED', value: 0.30, label: 'R&D Speed +30%' } },
    { id: 'sub_cost', name: 'Arden Components', category: 'Industrial', acquisitionBuff: { type: 'PRODUCTION_COST', value: 0.20, label: 'Cost -20%' } },
    { id: 'sub_mkt', name: 'Vane Media', category: 'Retail', acquisitionBuff: { type: 'MARKETING_BOOST', value: 0.25, label: 'Marketing +25%' } },
];

/**
 * Where the deals are in their life.
 *
 * Default 6: integration is finished (4 quarters) and synergy has fully
 * arrived (6), so the earnings line is the steady state rather than a number
 * still climbing. Below 4 an acquisition is legitimately loss-making, which
 * is correct behaviour and a bad place to assert "acquisitions pay".
 */
const MATURE_QUARTERS = 6;

/** Put both runs in front of the same company, differing only in what it owns. */
const seedWorld = (opts: { withSubsidiaries: boolean }) => {
    Math.random = seeded(20260811);

    useGameStore.setState({ ...initialGameState, _hasHydrated: true });
    useStatsStore.setState({
        ...initialStatsState,
        _hasHydrated: true,
        companyName: 'Harness Industries',
        companyCapital: 40_000_000,
        money: 1_000_000,
        // A real plant with a real crew: the cost buff has to have a COGS
        // worth reducing, or its absence proves nothing.
        facilityTier: 2,
        employeeCount: 120,
        targetHeadcount: 120,
        employeeMorale: 75,
        brandValue: 30,
    });
    useProductStore.setState({
        ...initialProductState,
        products: [{
            ...(initialProductState.products[0] as any),
            productionUnits: 20_000,
            marketingBudget: 2_000_000,
            revenue: 12_000_000,
        }],
    } as any);
    useLaboratoryStore.setState({ researcherCount: 4 } as any);

    // The buffs are read from useUserStore; the money is read from the
    // corporate finance store. They were two different lists for the same
    // acquisitions, which is its own small scandal - see the report.
    useUserStore.setState({
        subsidiaries: opts.withSubsidiaries ? (BUFFED_SUBS as any) : [],
    } as any);
    useCorporateFinanceStore.setState({
        subsidiaries: opts.withSubsidiaries
            ? BUFFED_SUBS.map(s => ({
                id: s.id,
                name: s.name,
                sector: s.category,
                valuation: 12_000_000,
                acquiredAt: 12_000_000,
                strategy: { marketing: 3, rnd: 4, production: 4, workforce: 3 },
                lastChangePercent: 0,
                history: [],
                deal: {
                    id: s.id,
                    name: s.name,
                    price: 12_000_000,
                    fairValue: 10_000_000,
                    premium: 2_000_000,
                    targetAnnualEbit: estimateTargetEbit(10_000_000, 'Medium'),
                    quartersSinceClose: MATURE_QUARTERS,
                    goodwill: 2_000_000,
                    impaired: false,
                    hostile: false,
                },
            })) as any
            : [],
        loans: [],
    } as any);
};

const runQuarter = async (opts: { withSubsidiaries: boolean }) => {
    seedWorld(opts);
    await useGameStore.getState().advanceMonth(3);
    const r = useGameStore.getState().lastQuarterReport as any;
    const line = r?.products?.[0] ?? {};
    return {
        rpGenerated: r?.researchGained ?? 0,
        cogs: Math.round(r?.expenses?.cogs ?? 0),
        marketingSpend: Math.round(r?.expenses?.marketing ?? 0),
        unitsSold: line.sold ?? 0,
        marketShare: Number((line.marketShare ?? 0).toFixed(2)),
        revenue: Math.round(r?.revenue ?? 0),
        acquisitionEbit: Math.round(r?.acquisitionEbit ?? 0),
        netProfit: Math.round(r?.netProfit ?? 0),
        companyValue: Math.round(useStatsStore.getState().companyValue ?? 0),
    };
};

const realRandom = Math.random;
afterAll(() => { Math.random = realRandom; });

describe('a subsidiary cannot reach the operating engine', () => {
    let owned: Awaited<ReturnType<typeof runQuarter>>;
    let none: Awaited<ReturnType<typeof runQuarter>>;

    beforeAll(async () => {
        owned = await runQuarter({ withSubsidiaries: true });
        none = await runQuarter({ withSubsidiaries: false });

        // Printed because the point of the change is the SIZE of what the
        // buffs were silently doing, and a green tick does not show that.
        // eslint-disable-next-line no-console
        console.log('\n  line                  with 3 subsidiaries        with none\n' +
            (Object.keys(owned) as (keyof typeof owned)[])
                .map(k => `  ${String(k).padEnd(20)} ${String(owned[k]).padStart(18)} ${String(none[k]).padStart(16)}`)
                .join('\n') + '\n');
    });

    // ------------------------------------------------------------------
    //  THE THREE READ SITES, ONE ASSERTION EACH
    // ------------------------------------------------------------------
    it('research runs at the same speed whether or not you own a lab', () => {
        expect(owned.rpGenerated).toBe(none.rpGenerated);
    });

    it('a components maker does not make your own line cheaper', () => {
        expect(owned.cogs).toBe(none.cogs);
    });

    it('owning a media company does not make your marketing louder', () => {
        // Marketing reaches the market through attraction, so the tell is
        // share and units rather than the budget line - the spend was never
        // what changed, only how far it went.
        expect(owned.marketingSpend).toBe(none.marketingSpend);
        expect(owned.unitsSold).toBe(none.unitsSold);
        expect(owned.marketShare).toBe(none.marketShare);
    });
});

describe('but the investment case is real', () => {
    // Without this half, deleting the acquisition system entirely would pass
    // every test above.
    it('their earnings arrive as operating profit', async () => {
        const owned = await runQuarter({ withSubsidiaries: true });
        const none = await runQuarter({ withSubsidiaries: false });
        expect(owned.acquisitionEbit).toBeGreaterThan(0);
        expect(none.acquisitionEbit).toBe(0);
        expect(owned.netProfit).toBeGreaterThan(none.netProfit);
    });

    it('and what you own counts towards what you are worth', async () => {
        const owned = await runQuarter({ withSubsidiaries: true });
        const none = await runQuarter({ withSubsidiaries: false });
        expect(owned.companyValue).toBeGreaterThan(none.companyValue);
    });

    it('their profit reaches net profit, not just the report', async () => {
        // The failure this catches is specific and was real: the effect was
        // computed, printed in the report as "Acquisitions +$409,500", and
        // then never added to anything. The report said one thing and the
        // bank balance did another.
        const owned = await runQuarter({ withSubsidiaries: true });
        const none = await runQuarter({ withSubsidiaries: false });
        expect(owned.netProfit - none.netProfit).toBe(owned.acquisitionEbit);
    });

    it('a quarter advances every deal exactly once', async () => {
        // The hazard created by splitting read from advance. If the tick ever
        // calls the mutating half twice - or the reading half starts
        // mutating - deals age at double speed: integration ends early,
        // synergy arrives early, goodwill impairs a year ahead of schedule,
        // and the player is paid twice on the way through.
        await runQuarter({ withSubsidiaries: true });
        for (const s of useCorporateFinanceStore.getState().subsidiaries) {
            expect(s.deal?.quartersSinceClose).toBe(MATURE_QUARTERS + 1);
        }
    });
});
