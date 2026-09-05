// src/core/market/sponsorship.test.ts
//
// ============================================================================
//  THIRTY OFFERS THAT DO NOT REPEAT, AND A DROUGHT THAT ACTUALLY BITES
// ============================================================================
//
//  Two things.
//
//  THE WELL EMPTIES RATHER THAN LOOPING. A campaign runs sixty quarters and a
//  letter arrives every three, so an offer pool that repeats becomes furniture
//  and the player stops reading it - which is the death of a mail-based
//  mechanic. Thirty, drawn without replacement, and the drawing is asserted
//  here rather than trusted.
//
//  THE DROUGHT IS A CEILING. Written that way from the start because of what
//  the conviction work measured: brand mean-reverts towards a target every
//  tick, so subtracting from the VALUE is pulled straight back out within two
//  or three quarters. A drain would have been invisible.
// ============================================================================

import {
    SPONSOR_OFFERS, TIERS, TIER_MINIMUM_VALUE, tiersOpenAt, offersInTier,
    nextOffer, offerById, droughtPenalty,
    DROUGHT_GRACE_QUARTERS, DROUGHT_PENALTY_CAP, DROUGHT_PENALTY_PER_QUARTER,
} from './sponsorship';

// ============================================================================
//  TEN A TIER, AND THE COUNT COMES FROM THE TIERS
// ============================================================================
//  These read 30 three times over. Adding the `era` tier - because a company
//  past forty billion had run out of anybody to write to it - broke all three
//  for the same reason, which is a number written down four times.
//
//  Derived now, so the next tier costs nothing here and the RULE is what is
//  asserted: ten in each, no thin one.
// ============================================================================
const PER_TIER = 10;
const TOTAL = TIERS.length * PER_TIER;

describe('ten offers a tier', () => {
    it('and exactly ten in each, so no tier is the thin one', () => {
        expect(SPONSOR_OFFERS).toHaveLength(TOTAL);
        for (const tier of TIERS) {
            expect({ tier, n: offersInTier(tier).length }).toEqual({ tier, n: PER_TIER });
        }
    });

    it('every id is unique, or the seen list would silently skip one', () => {
        expect(new Set(SPONSOR_OFFERS.map(o => o.id)).size).toBe(TOTAL);
    });

    it('and every one of them is a different thing to put a name on', () => {
        // Two offers that read the same are one offer with a bug.
        expect(new Set(SPONSOR_OFFERS.map(o => o.name)).size).toBe(TOTAL);
        expect(new Set(SPONSOR_OFFERS.map(o => o.pitch)).size).toBe(TOTAL);
    });

    it('the tiers climb in money, in brand and in commitment', () => {
        const avg = (t: typeof TIERS[number], k: 'quarterlyCost' | 'brandPerQuarter') =>
            offersInTier(t).reduce((s, o) => s + o[k], 0) / 10;

        expect(avg('national', 'quarterlyCost')).toBeGreaterThan(avg('local', 'quarterlyCost') * 3);
        expect(avg('global', 'quarterlyCost')).toBeGreaterThan(avg('national', 'quarterlyCost') * 3);
        expect(avg('global', 'brandPerQuarter')).toBeGreaterThan(avg('national', 'brandPerQuarter'));

        // And the TERM climbs too, which is the real decision inside the big
        // letters: a regional shirt is one season, a stadium is a decade.
        expect(offersInTier('local')[0].quarters).toBeLessThan(offersInTier('national')[0].quarters);
        expect(offersInTier('national')[0].quarters).toBeLessThan(offersInTier('global')[0].quarters);
    });
});

describe('the big ones are gated on what the company is worth', () => {
    it('a new company is only offered local things', () => {
        expect(tiersOpenAt(0)).toEqual(['local']);
        expect(nextOffer(0, [])!.tier).toBe('local');
    });

    it('and the gate is VALUE, not cash', () => {
        // A stadium is not offered to somebody who could afford it this
        // quarter; it is offered to somebody whose name is worth putting on a
        // stadium. The parameter is companyValue and there is no cash test.
        expect(TIER_MINIMUM_VALUE.global).toBeGreaterThan(TIER_MINIMUM_VALUE.national);
        expect(TIER_MINIMUM_VALUE.national).toBeGreaterThan(TIER_MINIMUM_VALUE.local);
        expect(tiersOpenAt(TIER_MINIMUM_VALUE.global)).toEqual(['local', 'national', 'global']);
    });

    it('and a large company is written to about the largest thing available', () => {
        // Not a village pool. Being offered one at four billion would read as
        // the game not knowing what the player had built.
        expect(nextOffer(TIER_MINIMUM_VALUE.global, [])!.tier).toBe('global');
        expect(nextOffer(TIER_MINIMUM_VALUE.national, [])!.tier).toBe('national');
    });
});

// ============================================================================
//  THE WELL WAS SUPPOSED TO EMPTY. IT SHOULD NOT HAVE.
// ============================================================================
//  This block asserted the opposite of what it now does, and the old header
//  argued for it: "the well runs dry rather than looping - and when it does,
//  that is honest too: there really are only so many things worth putting a
//  name on."
//
//  Measured, that reads differently. Thirty offers, one letter every three
//  quarters, each removed once seen: ninety quarters of post and then silence
//  for the rest of a dynasty. And worse in the middle than at the end - a
//  company worth a billion has local and national open and global shut, so
//  after twenty letters it hears nothing at all until it reaches four billion,
//  while the drought penalty starts at twelve quarters and climbs to fifteen
//  points of brand. The game made the silence and then charged for it.
//
//  Reported as sponsors not arriving for fifteen quarters late on. The pool
//  comes round now, oldest first - a contract ends and the rights return to
//  the market, which is also what happens. Full behaviour in
//  sponsorDrought.test.ts.
// ============================================================================
describe('the well comes round rather than emptying', () => {
    it('nothing is offered twice until everything has been offered once', () => {
        const seen: string[] = [];
        const all = SPONSOR_OFFERS.filter(o => o.tier !== 'era').length;
        for (let i = 0; i < all; i++) {
            const offer = nextOffer(TIER_MINIMUM_VALUE.global, seen)!;
            expect(offer).toBeDefined();
            expect(seen).not.toContain(offer.id);
            seen.push(offer.id);
        }
        expect(new Set(seen).size).toBe(all);
    });

    it('and then it comes round rather than going quiet', () => {
        const all = SPONSOR_OFFERS.map(o => o.id);
        expect(nextOffer(TIER_MINIMUM_VALUE.global, all)).toBeDefined();
    });

    it('a small company hears from its own tier again, not from a larger one', () => {
        const localIds = offersInTier('local').map(o => o.id);
        const again = nextOffer(0, localIds);
        expect(again).toBeDefined();
        expect(again!.tier).toBe('local');
        // ...and the same company, once it is worth something, has more.
        expect(nextOffer(TIER_MINIMUM_VALUE.national, localIds)!.tier).toBe('national');
    });

    it('and the draw is deterministic, so the same state gets the same letter', () => {
        // Same rule as the negotiation replies: no die anywhere the player
        // could re-roll, and the well empties in a stated order.
        const seen = ['spon-g-1'];
        expect(nextOffer(TIER_MINIMUM_VALUE.global, seen)!.id)
            .toBe(nextOffer(TIER_MINIMUM_VALUE.global, seen)!.id);
    });
});

describe('twelve quarters with the name on nothing', () => {
    it('nothing at all before the grace runs out', () => {
        for (let q = 0; q <= DROUGHT_GRACE_QUARTERS; q++) {
            expect({ q, penalty: droughtPenalty(q) }).toEqual({ q, penalty: 0 });
        }
    });

    it('and then it grows, a quarter at a time', () => {
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS + 1))
            .toBeCloseTo(DROUGHT_PENALTY_PER_QUARTER, 6);
        expect(droughtPenalty(DROUGHT_GRACE_QUARTERS + 5))
            .toBeCloseTo(DROUGHT_PENALTY_PER_QUARTER * 5, 6);
    });

    it('but it stops, because a slow game over is not a mechanic', () => {
        expect(droughtPenalty(500)).toBe(DROUGHT_PENALTY_CAP);
        expect(DROUGHT_PENALTY_CAP).toBeLessThan(40);
    });

    it('and a player who has never signed one is worse off than one who lapsed', () => {
        // Which is the whole point of the counter being quarters rather than
        // a boolean: twelve quarters late is a problem and forty is a bigger
        // one, up to the cap.
        expect(droughtPenalty(40)).toBeGreaterThan(droughtPenalty(16));
    });

    it('every offer resolves by id, so a signed deal can always be priced', () => {
        for (const o of SPONSOR_OFFERS) expect(offerById(o.id)).toBe(o);
        expect(offerById('nope')).toBeUndefined();
    });
});
