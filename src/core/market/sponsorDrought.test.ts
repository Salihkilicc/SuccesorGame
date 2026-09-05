// src/core/market/sponsorDrought.test.ts
//
// ============================================================================
//  THE POST THAT STOPPED COMING
// ============================================================================
//
//  Reported as sponsors drying up late on - "15 quarter gelmedi". Measured
//  before anything was changed:
//
//    thirty offers in the whole game, ten a tier
//    one letter every three quarters
//    every offer removed from the pool the moment it was seen
//
//  So ninety quarters of post and then silence, for a dynasty that runs far
//  longer. And worse in the middle than at the end: a company worth a billion
//  has local and national open and global shut, so once it has been written to
//  twenty times it hears NOTHING until it reaches four billion - while the
//  drought penalty starts at twelve quarters and climbs to fifteen points of
//  brand. The game made the silence and then charged for it.
// ============================================================================

import {
    DROUGHT_GRACE_QUARTERS,
    SPONSOR_OFFERS,
    TIERS,
    TIER_MINIMUM_VALUE,
    droughtPenalty,
    nextOffer,
    offersInTier,
    totalContractValue,
} from './sponsorship';

/** What the store does to `seen` when a letter goes out. */
const markSeen = (seen: string[], id: string) =>
    [...seen.filter(x => x !== id), id];

describe('the pool comes round again rather than running out', () => {
    it('a company that has seen everything is still written to', () => {
        const everything = SPONSOR_OFFERS.map(o => o.id);
        expect(nextOffer(60_000_000_000, everything)).toBeDefined();
    });

    it('and the gap between tiers is not silence', () => {
        // The measured trap. A billion dollar company with local and national
        // exhausted and global still shut used to get nothing at all.
        const seen = [...offersInTier('local'), ...offersInTier('national')]
            .map(o => o.id);
        expect(nextOffer(1_000_000_000, seen)).toBeDefined();
    });

    it('and it does not send the same letter twice running', () => {
        let seen: string[] = [];
        const got: string[] = [];
        for (let i = 0; i < 40; i++) {
            const o = nextOffer(60_000_000_000, seen)!;
            expect(o).toBeDefined();
            got.push(o.id);
            seen = markSeen(seen, o.id);
        }
        for (let i = 1; i < got.length; i++) expect(got[i]).not.toBe(got[i - 1]);
    });

    it('and when it does come round, it is the one seen longest ago', () => {
        // ------------------------------------------------------------------
        //  EVERYTHING SEEN, OR THIS TESTS THE WRONG BRANCH
        // ------------------------------------------------------------------
        //  Written first with only the era ids marked, and it failed by
        //  returning spon-g-1 - correctly, because global was still unseen and
        //  unseen always comes before recycling. The recycle only happens when
        //  there is nothing new left anywhere, so that is the state to set up.
        // ------------------------------------------------------------------
        const era = offersInTier('era').map(o => o.id);
        // Everything, with the era tier at the FRONT: seen longest ago.
        let seen = [...era, ...SPONSOR_OFFERS.map(o => o.id).filter(id => !era.includes(id))];

        const first = nextOffer(60_000_000_000, seen)!;
        expect(first.id).toBe(era[0]);

        seen = markSeen(seen, first.id);
        const second = nextOffer(60_000_000_000, seen)!;
        expect(second.id).not.toBe(first.id);
        expect(second.id).toBe(era[1]);
    });

    it('and a company still gets the best tier it has earned', () => {
        // Recycling must not start offering a village pool to a giant.
        const seen = SPONSOR_OFFERS.map(o => o.id);
        expect(nextOffer(60_000_000_000, seen)!.tier).toBe('era');
        expect(nextOffer(500_000_000, seen)!.tier).toBe('national');
        expect(nextOffer(1_000, seen)!.tier).toBe('local');
    });

    it('and a company below every floor is still told nothing', () => {
        // There is no tier under local, so there is genuinely nobody to write.
        expect(TIER_MINIMUM_VALUE.local).toBe(0);
    });
});

describe('and there is something to write about past four billion', () => {
    it('a tier above global exists, and it opens far higher', () => {
        expect(TIERS).toContain('era');
        expect(TIER_MINIMUM_VALUE.era).toBeGreaterThan(TIER_MINIMUM_VALUE.global * 5);
    });

    it('and the money is an order of magnitude above it', () => {
        const biggestGlobal = Math.max(...offersInTier('global').map(totalContractValue));
        const smallestEra = Math.min(...offersInTier('era').map(totalContractValue));
        expect(smallestEra).toBeGreaterThan(biggestGlobal * 3);
    });

    it('and the term is a generation, not a season', () => {
        // Six years. Signed by one chief executive and inherited by the next,
        // which is the whole reason the tier is called what it is.
        for (const o of offersInTier('era')) expect(o.quarters).toBe(24);
        for (const o of offersInTier('local')) expect(o.quarters).toBe(4);
    });

    it('and every tier still holds ten', () => {
        for (const tier of TIERS) {
            expect({ tier, n: offersInTier(tier).length }).toEqual({ tier, n: 10 });
        }
    });
});

describe('and the drought penalty still means something', () => {
    it('it does not bite inside the grace period', () => {
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS, 100)).toBe(0);
    });

    it('but it does after, which is why the silence had to end', () => {
        // These are the numbers a player was paying for a drought the game
        // gave them: fifteen points of brand for having been offered
        // everything once.
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS + 3, 100)).toBeGreaterThan(0);
        expect(droughtPenalty(40, 100)).toBeGreaterThan(10);
    });
});
