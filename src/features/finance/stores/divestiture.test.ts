// src/features/finance/stores/divestiture.test.ts
//
// ============================================================================
//  WHAT YOU LEAVE BEHIND WHEN YOU SELL
// ============================================================================
//
//  Selling a subsidiary touches four systems and three of them used to be
//  wrong in ways nothing would have reported:
//
//    the market - the company drifted back to its shipped price
//    the board  - the founder kept his seat forever
//    the wire   - nobody heard about it
//    the cash   - this one was fine
//
//  None of those throw. None fail a type check. The only symptom of the first
//  is that a company you doubled can be bought back cheap eight quarters
//  later, and the only symptom of the second is that your board slowly fills
//  with directors of companies you no longer own.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useCorporateFinanceStore } from './useCorporateFinanceStore';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useNewsStore } from '../../../core/store/useNewsStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { INITIAL_MARKET_ITEMS } from '../../assets/data/marketData';
import { directorFromAcquisition } from '../../../core/market/governance';
import { FOUNDER_BY_COMPANY } from '../../../data/market/founders';
import { estimateTargetEbit } from '../../../core/market/mergers';

const listed = (id: string) => INITIAL_MARKET_ITEMS.find((x: any) => x.id === id) as any;

/**
 * The market rolls dice - trend switches, per-quarter noise. Left alone, a
 * claim about where a price ends up is a claim about luck, and the drift test
 * below quietly became one.
 */
const seeded = (seed: number) => {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
};
const realRandom = Math.random;
afterAll(() => { Math.random = realRandom; });

/** A subsidiary that has been run for a while and is now worth double. */
const grownSubsidiary = (id: string, multiple: number) => {
    const base = listed(id);
    return {
        id,
        name: base.name,
        sector: base.category,
        valuation: base.marketCap * multiple,
        acquiredAt: base.marketCap,
        strategy: { marketing: 3, rnd: 3, production: 3, workforce: 2 },
        lastChangePercent: 0,
        history: [],
        deal: {
            id, name: base.name,
            price: base.marketCap, fairValue: base.marketCap, premium: 0,
            targetAnnualEbit: estimateTargetEbit(base.marketCap, 'Medium'),
            quartersSinceClose: 8, goodwill: 0, impaired: false, hostile: false,
        },
    } as any;
};

beforeEach(() => {
    useMarketStore.getState().reset();
    useNewsStore.getState().reset();
    useStatsStore.setState({ companyCapital: 10_000_000, companyName: 'Harness Industries' } as any);
    useShareholderStore.setState({ members: [], totalShares: 10_000_000 } as any);
    useCorporateFinanceStore.setState({ subsidiaries: [], loans: [] } as any);
});

describe('the company you sell is the company you built', () => {
    const ID = 'ind_air';

    it('goes back on the market at your exit value, not its shipped price', () => {
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 2)] } as any);
        useCorporateFinanceStore.getState().sellSubsidiary(ID);

        const shipped = listed(ID).price;
        expect(useMarketStore.getState().marketPrices[ID]).toBeCloseTo(shipped * 2, 5);
    });

    it('and STAYS there, because the anchor moved with it', () => {
        // ------------------------------------------------------------------
        //  THE BUG THIS EXISTS FOR
        // ------------------------------------------------------------------
        //  Writing the live price alone lasted about a quarter. Mean reversion
        //  pulls every price towards an ANCHOR, and the anchor was the value
        //  in marketData.ts. The company you doubled drifted back down to its
        //  original listing and could be bought back cheaper than you sold it.
        //
        //  THIS TEST WAS WRONG FIRST TIME. It asserted loose bounds against an
        //  unseeded market and passed with the fix deliberately removed - the
        //  broken run landed at 34.58 against a floor of 35, close enough that
        //  the trend rolls decided the result. A test that passes on the code
        //  it was written to catch is worse than none.
        //
        //  Seeded, so the market's dice are the same in both worlds, and the
        //  claim is now a boundary rather than a band: the company you sold at
        //  50 is worth AT LEAST 50 six years later. With the anchor it reaches
        //  62; without it, 41 - on its way back to the 25 it shipped at.
        // ------------------------------------------------------------------
        Math.random = seeded(20260811);
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 2)] } as any);
        useCorporateFinanceStore.getState().sellSubsidiary(ID);

        const exit = useMarketStore.getState().marketPrices[ID];
        for (let q = 0; q < 24; q++) useMarketStore.getState().simulateQuarter();
        const after = useMarketStore.getState().marketPrices[ID];

        expect(after).toBeGreaterThanOrEqual(exit);
        // And nowhere near the price it was written with.
        expect(after).toBeGreaterThan(listed(ID).price * 2);
    });

    it('survives an app restart', () => {
        // The second thing dragging it back, and the crueller one: the
        // rehydrate clamp pulled anything above 3x its anchor down on LAUNCH.
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 4)] } as any);
        useCorporateFinanceStore.getState().sellSubsidiary(ID);
        const exit = useMarketStore.getState().marketPrices[ID];

        // What onRehydrateStorage does to the persisted state on load.
        const anchor = useMarketStore.getState().valueAnchors[ID];
        expect(anchor).toBeCloseTo(exit, 5);
        expect(exit).toBeLessThanOrEqual(anchor * 3);
    });

    it('is announced', () => {
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 2)] } as any);
        useCorporateFinanceStore.getState().sellSubsidiary(ID);

        const items = useNewsStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].headline).toContain(listed(ID).name);
        expect(items[0].kind).toBe('deal');
    });

    it('pays you', () => {
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 2)] } as any);
        const before = useStatsStore.getState().companyCapital;
        useCorporateFinanceStore.getState().sellSubsidiary(ID);
        expect(useStatsStore.getState().companyCapital).toBeGreaterThan(before);
    });
});

describe('the seat leaves with the company', () => {
    const ID = 'ind_air';

    beforeEach(() => {
        useShareholderStore.setState({
            members: [
                { id: 'founder', name: 'You', shareCount: 3_500_000, trait: 'Loyalist', trust: 70, isHostile: false, origin: 'Founder' },
                { id: `DIR_${ID}_1`, name: 'Founder of Airbus-ish', shareCount: 200_000, trait: 'Conservative', trust: 60, isHostile: false, origin: 'Investor', acquiredWith: ID },
            ],
            totalShares: 10_200_000,
        } as any);
        useCorporateFinanceStore.setState({ subsidiaries: [grownSubsidiary(ID, 1)] } as any);
    });

    it('he is not on your board the quarter after you sell', () => {
        useCorporateFinanceStore.getState().sellSubsidiary(ID);
        const ids = useShareholderStore.getState().members.map(m => m.id);
        expect(ids).toEqual(['founder']);
    });

    it('and his shares are retired, undoing the dilution', () => {
        useCorporateFinanceStore.getState().sellSubsidiary(ID);
        expect(useShareholderStore.getState().totalShares).toBe(10_000_000);
    });

    it('nobody else is disturbed', () => {
        // The filter is on `acquiredWith`, not on the id prefix. Matching on
        // the id would have been tempting - it contains the company id - and
        // would have removed a director whose NAME happened to contain it.
        useCorporateFinanceStore.getState().sellSubsidiary(ID);
        expect(useShareholderStore.getState().members[0].shareCount).toBe(3_500_000);
    });
});

describe('the three who come with a name', () => {
    // Deal big enough to clear SEAT_MIN_DEAL_RATIO.
    const seat = (id: string, hostile: boolean) =>
        directorFromAcquisition('ignored', 50_000_000, 100_000_000, 10_000_000, 'Medium', hostile, id);

    it('seats the person the design asked for', () => {
        expect(seat('tech_skynet', false)!.trait).toBe('Visionary');
        expect(seat('ind_voltmotors', false)!.trait).toBe('Conservative');
        expect(seat('tech_streamify', false)!.trait).toBe('Shark');
    });

    it('uses his own name, not "Founder of X"', () => {
        expect(seat('tech_skynet', false)!.name).toBe(FOUNDER_BY_COMPANY.tech_skynet.name);
    });

    /**
     * The three who were TAKEN.
     *
     * Marco Alvarez is in FOUNDER_BY_COMPANY as well now, and he is
     * deliberately outside the claims below. Those three lost a company to a
     * hostile bid and sit at the table as standing threats. He is somebody who
     * offered you his company at eighty per cent and asked first - if you took
     * it over his head anyway he would be hurt rather than dangerous, and
     * seating him at 18 trust would make him a schemer, which is the one thing
     * that character is not.
     */
    const TAKEN = ['tech_skynet', 'ind_voltmotors', 'tech_streamify'];

    it('a hostile bid seats him anyway, and he is not pleased', () => {
        for (const id of TAKEN) {
            const friendly = seat(id, false)!;
            const taken = seat(id, true)!;
            expect(taken).not.toBeNull();
            expect(taken.trust).toBeLessThan(friendly.trust);
            expect(taken.resentful).toBe(true);
            // Low enough that the board reads him as a standing threat rather
            // than someone having a bad quarter.
            expect(taken.trust).toBeLessThan(25);
        }
    });

    it('and the friend is the exception, because he is not a schemer', () => {
        const taken = seat('tech_planora', true)!;
        // Still hurt - well below his friendly number - and still not hostile.
        expect(taken.trust).toBeLessThan(seat('tech_planora', false)!.trust);
        expect(taken.trust).toBeGreaterThan(25);
    });

    it('the man who did not want to sell is the sorest of the three', () => {
        // Characterisation held as a test because it is the kind of thing a
        // later balance pass silently flattens.
        const volt = FOUNDER_BY_COMPANY.ind_voltmotors.hostileTrust;
        expect(volt).toBeLessThan(FOUNDER_BY_COMPANY.tech_skynet.hostileTrust);
        expect(volt).toBeLessThan(FOUNDER_BY_COMPANY.tech_streamify.hostileTrust);
    });

    it('the Shark is the least warm even when he is smiling', () => {
        const shark = FOUNDER_BY_COMPANY.tech_streamify.trust;
        expect(shark).toBeLessThan(FOUNDER_BY_COMPANY.tech_skynet.trust);
        expect(shark).toBeLessThan(FOUNDER_BY_COMPANY.ind_voltmotors.trust);
    });

    it('a generic target still loses its management to a hostile bid', () => {
        expect(seat('ind_air', true)).toBeNull();
        expect(seat('ind_air', false)).not.toBeNull();
    });

    it('a token purchase buys nobody a seat, named or not', () => {
        // Otherwise buying the smallest of the three would be the cheapest
        // route to putting a Shark on your own board.
        const tiny = directorFromAcquisition(
            'ignored', 1_000_000, 100_000_000, 10_000_000, 'Medium', false, 'tech_streamify');
        expect(tiny).toBeNull();
    });

    it('all three are actually listed on the market', () => {
        // They were written into data/AcquisitionData.ts, whose data is
        // imported by nothing. For years they existed and could not be bought.
        for (const id of Object.keys(FOUNDER_BY_COMPANY)) {
            expect(listed(id)).toBeDefined();
        }
    });
});
