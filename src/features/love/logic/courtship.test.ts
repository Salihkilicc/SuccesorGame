// src/features/love/logic/courtship.test.ts
//
// ============================================================================
//  A SLOT MACHINE WITH FACES ON IT
// ============================================================================
//
//  `generatePartner` takes a `forcedTier` and the encounter system passed
//  nothing. So the tier was uniform random: a bankrupt chief executive met
//  dynasty heiresses at exactly the same rate as a billionaire, and pressing
//  the button was a pull rather than a decision.
//
//  TWO NUMBERS, DOING TWO DIFFERENT JOBS, and the split is the whole design:
//
//    COMPANY VALUE decides WHO SHOWS UP. Money opens rooms.
//    PUBLIC REPUTATION decides WHETHER THEY SAY YES.
//
//  What that buys is a story neither could tell alone: a RICH, DISGRACED chief
//  executive meets heiresses and is refused by all of them. One "prestige"
//  score makes the two things the player can build redundant with each other.
// ============================================================================

import {
    tiersOpenTo, reachAbove, courtshipFor, TIER_UNLOCK, TIER_STANDING,
    REPUTATION_FLOOR, REFUSAL_COOLDOWN_QUARTERS, LOOKS_RESISTANCE,
    REPUTATION_WEIGHT,
} from './courtship';
import { generatePartner } from './partnerGenerator';
import type { PartnerProfile } from '../../../data/relationshipTypes';

const candidate = (over: { looks?: number; familyWealth?: number } = {}): PartnerProfile => ({
    id: 'c', name: 'Candidate', photo: null,
    love: 30, relationYears: 0, isMarried: false, hasPrenup: false,
    stats: {
        ethnicity: 'Mixed', age: 30, occupation: 'x',
        looks: over.looks ?? 50, style: 'Business',
        socialClass: 'MiddleClass', familyWealth: over.familyWealth ?? 0,
        intelligence: 60, jealousy: 40, crazy: 20, libido: 50,
        reputationBuff: 0, financialAidChance: 0, networkPower: 0,
    },
});

describe('money opens rooms', () => {
    it('and a new company is in the cheap ones', () => {
        // companyValue starts at four and a half million.
        const open = tiersOpenTo(4_500_000);
        expect(open).toContain('STUDENT_LIFE');
        expect(open).toContain('BLUE_COLLAR');
        expect(open).not.toContain('HIGH_SOCIETY');
        expect(open).not.toContain('CORPORATE_ELITE');
    });

    it('and the list is ordered by STANDING, which is not the same as price', () => {
        // ------------------------------------------------------------------
        //  THE BUG THIS ORDER EXISTS TO FIX
        // ------------------------------------------------------------------
        //  `runCourtship` takes the best open room with
        //  `open[open.length - 1]`. That used to be the last key of an object
        //  literal rather than the most prestigious tier, and the three
        //  zero-cost tiers happened to be typed STUDENT_LIFE, BLUE_COLLAR,
        //  UNDERGROUND.
        //
        //  So every player under fifty million was introduced to CRIMINALS,
        //  every single time, because of the order three keys were written in.
        // ------------------------------------------------------------------
        const open = tiersOpenTo(4_500_000);
        expect(open[open.length - 1]).toBe('BLUE_COLLAR');
        expect(open[open.length - 1]).not.toBe('UNDERGROUND');
    });

    it('and UNDERGROUND is the fallback rather than the default', () => {
        // It is the room that is always open, which is exactly why it must
        // never be the one the player is taken to first: it is the one that
        // costs reputation to be seen in.
        expect(TIER_STANDING[0]).toBe('UNDERGROUND');
    });

    it('while the best room always comes last, at every size', () => {
        expect(tiersOpenTo(1e8).slice(-1)[0]).toBe('ARTISTIC');
        expect(tiersOpenTo(1e9).slice(-1)[0]).toBe('CORPORATE_ELITE');
        expect(tiersOpenTo(1e11).slice(-1)[0]).toBe('HIGH_SOCIETY');
    });

    it('while a large one is in all of them', () => {
        expect(tiersOpenTo(10_000_000_000)).toHaveLength(
            Object.keys(TIER_UNLOCK).length,
        );
    });

    it('and one room does not care what you are worth', () => {
        // Open from the first quarter, deliberately - which is exactly what
        // makes it the tier with the reputation penalty attached. The room
        // that is always open is the one it costs to be seen in.
        expect(tiersOpenTo(0)).toContain('UNDERGROUND');
        expect(TIER_UNLOCK.UNDERGROUND).toBe(0);
    });

    it('and crossing a threshold is not a light switch', () => {
        // You get into the room a quarter after you can afford it, and are
        // told no for a while longer.
        expect(reachAbove('HIGH_SOCIETY', TIER_UNLOCK.HIGH_SOCIETY)).toBeGreaterThan(0);
        expect(reachAbove('HIGH_SOCIETY', TIER_UNLOCK.HIGH_SOCIETY * 4)).toBe(0);
    });
});

describe('reputation decides whether they say yes', () => {
    const world = (rep: number, value = 1e12) =>
        ({ publicReputation: rep, companyValue: value });

    it('so a respected player is accepted', () => {
        const r = courtshipFor(candidate({ looks: 40 }), world(90), 'CORPORATE_ELITE', () => 0.1);
        expect(r.accepted).toBe(true);
    });

    it('AND A RICH DISGRACED ONE IS NOT', () => {
        // The story neither number could tell alone, and the reason there are
        // two of them. All the money in the game, and no standing.
        const r = courtshipFor(candidate(), world(REPUTATION_FLOOR - 1), 'HIGH_SOCIETY', () => 0);
        expect(r.accepted).toBe(false);
        expect(r.chance).toBe(0);
    });

    it('and reaching above your station costs you', () => {
        const justArrived = courtshipFor(
            candidate(), { publicReputation: 70, companyValue: TIER_UNLOCK.HIGH_SOCIETY },
            'HIGH_SOCIETY', () => 1,
        );
        const established = courtshipFor(
            candidate(), { publicReputation: 70, companyValue: TIER_UNLOCK.HIGH_SOCIETY * 4 },
            'HIGH_SOCIETY', () => 1,
        );
        expect(justArrived.chance).toBeLessThan(established.chance);
    });

    it('while somebody who does not need your money is harder work', () => {
        const modest = courtshipFor(candidate({ familyWealth: 0 }), world(80), 'CORPORATE_ELITE', () => 1);
        const heiress = courtshipFor(candidate({ familyWealth: 95 }), world(80), 'CORPORATE_ELITE', () => 1);
        expect(heiress.chance).toBeLessThan(modest.chance);
    });

    it('and looks are the one cosmetic field allowed to decide anything', () => {
        // Because it is the one thing about them the player can see before
        // asking. Ethnicity and style stay cosmetic.
        const plain = courtshipFor(candidate({ looks: 20 }), world(80), 'ARTISTIC', () => 1);
        const striking = courtshipFor(candidate({ looks: 95 }), world(80), 'ARTISTIC', () => 1);
        expect(striking.chance).toBeLessThan(plain.chance);
    });
});

describe('how often anybody says yes', () => {
    // ------------------------------------------------------------------
    //  MEASURED, AND THE FIRST DRAFT WAS WRONG
    // ------------------------------------------------------------------
    //  It ran at 10 to 21 per cent across the whole game, so finding anybody
    //  took four or five taps. Worse, it got HARDER as the company grew - 13
    //  per cent at a hundred million, 10 at a billion - because `reachAbove`
    //  bit the moment a threshold was crossed. Growing the company made
    //  dating worse, which is backwards from the entire design.
    //
    //  The fault was that `looks` was the DOMINANT term: at 0.35 a striking
    //  candidate took 35 points off a reputation that starts at 50, so the
    //  number that is supposed to decide this was the second largest thing in
    //  the sum. It is a trim now.
    // ------------------------------------------------------------------
    const rate = (rep: number, value: number, looks = 70, wealth = 30) => {
        const c = candidate({ looks, familyWealth: wealth });
        return courtshipFor(c, { publicReputation: rep, companyValue: value },
            'BLUE_COLLAR', () => 1).chance;
    };

    it('is better than even for somebody unremarkable', () => {
        // Nobody in particular, at a starting company. Two taps, not five.
        expect(rate(50, 4_500_000)).toBeGreaterThan(50);
    });

    it('and reputation is the biggest term in it', () => {
        // Which is the whole point of having chosen that number for the job.
        const swing = rate(90, 4_500_000) - rate(20, 4_500_000);
        expect(swing).toBeGreaterThan(LOOKS_RESISTANCE * 100);
        expect(REPUTATION_WEIGHT).toBeGreaterThan(LOOKS_RESISTANCE * 3);
    });

    it('and growing the company never makes it worse for long', () => {
        // `reachAbove` still bites on the way through a door, but it is 15
        // rather than 25 and it clears entirely at three times the bar.
        expect(reachAbove('HIGH_SOCIETY', TIER_UNLOCK.HIGH_SOCIETY)).toBeLessThan(20);
    });

    it('while somebody disliked is still refused', () => {
        expect(rate(REPUTATION_FLOOR - 1, 4_500_000)).toBe(0);
    });
});

describe('the refusal', () => {
    it('shuts the room rather than the person', () => {
        // Candidates are generated fresh every time and their ids mean
        // nothing, so remembering an individual would remember nobody.
        expect(REFUSAL_COOLDOWN_QUARTERS).toBeGreaterThan(0);
    });

    it('and it costs enough that tapping again is not a re-roll', () => {
        // A refusal that costs nothing is a re-roll, and a player who can tap
        // again immediately will tap until it lands.
        expect(REFUSAL_COOLDOWN_QUARTERS).toBeGreaterThanOrEqual(2);
    });
});

describe('and the room decides who is generated', () => {
    it('so the tier finally reaches the person', () => {
        // The whole hole this file fills: `forcedTier` existed and nobody
        // passed it.
        for (let i = 0; i < 20; i++) {
            expect(generatePartner('STUDENT_LIFE').stats.socialClass).toBe('WorkingClass');
            expect(generatePartner('HIGH_SOCIETY').stats.socialClass).toBe('OldMoney');
        }
    });
});
