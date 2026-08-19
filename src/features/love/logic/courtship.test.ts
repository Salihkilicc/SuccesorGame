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
    tiersOpenTo, reachAbove, courtshipFor, TIER_UNLOCK,
    REPUTATION_FLOOR, REFUSAL_COOLDOWN_QUARTERS,
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
