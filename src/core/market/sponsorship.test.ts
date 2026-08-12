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

describe('thirty offers, ten a tier', () => {
    it('and exactly ten in each, so no tier is the thin one', () => {
        expect(SPONSOR_OFFERS).toHaveLength(30);
        for (const tier of TIERS) {
            expect({ tier, n: offersInTier(tier).length }).toEqual({ tier, n: 10 });
        }
    });

    it('every id is unique, or the seen list would silently skip one', () => {
        expect(new Set(SPONSOR_OFFERS.map(o => o.id)).size).toBe(30);
    });

    it('and every one of them is a different thing to put a name on', () => {
        // Thirty names and thirty pitches. Two offers that read the same are
        // twenty-nine offers with a bug.
        expect(new Set(SPONSOR_OFFERS.map(o => o.name)).size).toBe(30);
        expect(new Set(SPONSOR_OFFERS.map(o => o.pitch)).size).toBe(30);
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

describe('the well empties rather than looping', () => {
    it('nothing is ever offered twice', () => {
        const seen: string[] = [];
        let offer = nextOffer(TIER_MINIMUM_VALUE.global, seen);
        while (offer) {
            expect(seen).not.toContain(offer.id);
            seen.push(offer.id);
            offer = nextOffer(TIER_MINIMUM_VALUE.global, seen);
        }
        // Every offer in the game, exactly once.
        expect(seen).toHaveLength(30);
        expect(new Set(seen).size).toBe(30);
    });

    it('and it runs dry rather than repeating, which is honest', () => {
        const all = SPONSOR_OFFERS.map(o => o.id);
        expect(nextOffer(TIER_MINIMUM_VALUE.global, all)).toBeUndefined();
    });

    it('a small company only exhausts its own tier', () => {
        const localIds = offersInTier('local').map(o => o.id);
        expect(nextOffer(0, localIds)).toBeUndefined();
        // ...and the same company, once it is worth something, has twenty more.
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
