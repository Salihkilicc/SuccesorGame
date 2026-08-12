// src/core/market/sponsorshipWiring.test.ts
//
// ============================================================================
//  DOES THE LETTER ARRIVE, DOES THE BILL LAND, AND DOES THE DROUGHT BITE
// ============================================================================
//
//  Three ends to join, and the middle one is the dangerous one: a sponsorship
//  that adds brand and never charges is a brand shop, and a player would sign
//  the largest thing on the list and never think about it again.
//
//  The casino half is here too, because the counter is only worth having if
//  the tick closes it - a streak that never advances is a field nothing reads,
//  which is this codebase's oldest failure and the reason the casino has had
//  no consequences for its entire existence.
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
import { useMailStore } from '../store/useMailStore';
import { useSponsorshipStore } from '../store/useSponsorshipStore';
import { useCasinoRiskStore } from '../store/useCasinoRiskStore';
import { readWorld } from '../story/world';
import { postSponsorOffer, OFFER_EVERY_QUARTERS } from './postSponsorOffer';
import { offerById, DROUGHT_GRACE_QUARTERS, TIER_MINIMUM_VALUE } from './sponsorship';

const fresh = (companyValue = 1_000_000) => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStatsStore.setState({
        ...initialStatsState, _hasHydrated: true,
        companyCapital: 500_000_000, companyValue,
        brandValue: 50, brandByCategory: { Consumer: 50 },
    } as any);
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
    useMailStore.getState().reset();
    useSponsorshipStore.getState().reset();
    useCasinoRiskStore.getState().reset();
};

describe('the letter arrives', () => {
    it('a company with its name on nothing is asked, every third quarter', () => {
        fresh();
        expect(postSponsorOffer(OFFER_EVERY_QUARTERS)).toBeDefined();
        expect(useMailStore.getState().inbox[0].sponsorOfferId).toBeTruthy();
    });

    it('and is not asked in between', () => {
        fresh();
        expect(postSponsorOffer(OFFER_EVERY_QUARTERS + 1)).toBeUndefined();
    });

    it('a company that has already signed something is not asked at all', () => {
        // Which keeps the letter from becoming furniture, and means the
        // drought counter and the letter are one mechanic seen from two sides.
        fresh();
        useSponsorshipStore.getState().sign('spon-l-1');
        expect(postSponsorOffer(OFFER_EVERY_QUARTERS)).toBeUndefined();
    });

    it('and the same offer is never sent twice', () => {
        fresh();
        const seen = new Set<string>();
        for (let q = 1; q <= 40; q++) {
            const offer = postSponsorOffer(q * OFFER_EVERY_QUARTERS);
            if (!offer) continue;
            expect(seen.has(offer.id)).toBe(false);
            seen.add(offer.id);
        }
        expect(seen.size).toBe(10);   // a small company: its own tier only
    });

    it('and the letter says what it costs, in the letter', () => {
        fresh();
        const offer = postSponsorOffer(OFFER_EVERY_QUARTERS)!;
        const body = useMailStore.getState().inbox[0].body;
        expect(body).toContain(offer.pitch);
        expect(body).toContain('TERMS:');
        expect(body).toContain(`${offer.quarters} quarters`);
    });

    it('and after a long drought whoever is asking mentions it, once', () => {
        fresh();
        useSponsorshipStore.setState({ quartersWithout: DROUGHT_GRACE_QUARTERS + 4 } as any);
        postSponsorOffer(OFFER_EVERY_QUARTERS);
        expect(useMailStore.getState().inbox[0].body)
            .toContain('your name is currently on nothing at all');
    });
});

describe('the bill lands and the brand follows', () => {
    it('signing charges every quarter and credits every quarter', async () => {
        // MEASURED AGAINST ITSELF. The first version read the capital before
        // and after one tick and expected the difference to be the fee - but a
        // quarter also EARNS, so it was comparing the sponsorship against the
        // company's profit and got 96,250 for a 180,000 bill. Two identical
        // companies, one difference.
        const offer = offerById('spon-l-1')!;
        const run = async (sign: boolean) => {
            fresh();
            if (sign) useSponsorshipStore.getState().sign('spon-l-1');
            await useGameStore.getState().advanceMonth(3);
            return useStatsStore.getState().companyCapital ?? 0;
        };
        const without = await run(false);
        const withDeal = await run(true);

        // The charge is real. A sponsorship that adds brand and never bills is
        // a brand shop, and everybody would sign the largest thing on the list.
        expect(without - withDeal).toBeCloseTo(offer.quarterlyCost, 0);
        expect(useSponsorshipStore.getState().active!.quartersLeft).toBe(offer.quarters - 1);
    });

    it('and the brand it buys is real too, and scales with the tier', async () => {
        // ORDER MATTERS AND THE FIRST VERSION IGNORED IT. `fresh()` resets the
        // stores this feature owns, but a tick also sells inventory and moves
        // the product store, so the SECOND run of a pair starts from a warmer
        // company than the first. Measured: the two runs came out 0.075 apart
        // in the wrong direction, which read as the credit not landing at all.
        //
        // A discarded warm-up first, then the three measurements in a fixed
        // order, so every one of them starts from the same place.
        const run = async (offerId?: string) => {
            fresh();
            if (offerId) useSponsorshipStore.getState().sign(offerId);
            await useGameStore.getState().advanceMonth(3);
            return useStatsStore.getState().brandValue ?? 0;
        };
        await run();                                  // warm-up, discarded
        const none = await run();
        const local = await run('spon-l-1');
        const global = await run('spon-g-1');

        expect(local).toBeGreaterThan(none);
        // And the big one buys more of it, which is most of why it costs what
        // it costs.
        expect(global).toBeGreaterThan(local);
    }, 20_000);

    it('and it ends when the term does, without billing a quarter after', async () => {
        fresh();
        useSponsorshipStore.getState().sign('spon-l-1');
        const offer = offerById('spon-l-1')!;
        for (let q = 0; q < offer.quarters; q++) {
            await useGameStore.getState().advanceMonth(3);
        }
        expect(useSponsorshipStore.getState().active).toBeUndefined();

        const capitalBefore = useStatsStore.getState().companyCapital ?? 0;
        const { cost } = useSponsorshipStore.getState().advance();
        expect(cost).toBe(0);
        expect(useStatsStore.getState().companyCapital).toBe(capitalBefore);
    });

    it('a live deal means the story sees no drought at all', () => {
        fresh();
        useSponsorshipStore.setState({ quartersWithout: 30 } as any);
        expect(readWorld().quartersWithoutSponsor).toBe(30);
        useSponsorshipStore.getState().sign('spon-l-1');
        expect(readWorld().quartersWithoutSponsor).toBe(0);
    });

    it('and the drought penalty reaches the tick, isolated from the credit', async () => {
        // THE FIRST VERSION OF THIS TEST PROVED NOTHING. It compared a
        // sponsored company against a dry one over four years - but a
        // sponsored company is also being paid brand every quarter, so it
        // would have come out ahead with the drought penalty deleted
        // entirely. Probed exactly that way and it passed, which is how the
        // hole was found.
        //
        // NEITHER company has a deal here. The only difference is how long
        // they have been without one, so the credit cannot confound it and
        // the ceiling penalty is the only thing left.
        const run = async (quartersWithout: number) => {
            fresh(TIER_MINIMUM_VALUE.global);
            useSponsorshipStore.setState({ quartersWithout } as any);
            await useGameStore.getState().advanceMonth(3);
            return useStatsStore.getState().brandValue ?? 0;
        };
        await run(0);                        // warm-up, discarded
        const inGrace = await run(DROUGHT_GRACE_QUARTERS);
        const longDry = await run(DROUGHT_GRACE_QUARTERS + 20);

        expect(longDry).toBeLessThan(inGrace);
    }, 20_000);
});

describe('and the casino counter is actually closed by the tick', () => {
    it('a visit in a quarter becomes a streak of one after it turns', async () => {
        // The oldest failure in this repository, avoided: a counter nothing
        // advances is a field nothing reads.
        fresh();
        useCasinoRiskStore.getState().recordVisit();
        expect(useCasinoRiskStore.getState().streak).toBe(0);

        await useGameStore.getState().advanceMonth(3);
        expect(useCasinoRiskStore.getState().streak).toBe(1);
    });

    it('and three quarters running reach the story', async () => {
        fresh();
        for (let q = 0; q < 3; q++) {
            useCasinoRiskStore.getState().recordVisit();
            await useGameStore.getState().advanceMonth(3);
        }
        expect(readWorld().casinoStreak).toBe(3);
    });

    it('and a clean quarter clears it, through the real tick', async () => {
        fresh();
        for (let q = 0; q < 3; q++) {
            useCasinoRiskStore.getState().recordVisit();
            await useGameStore.getState().advanceMonth(3);
        }
        await useGameStore.getState().advanceMonth(3);
        expect(readWorld().casinoStreak).toBe(0);
    });
});
