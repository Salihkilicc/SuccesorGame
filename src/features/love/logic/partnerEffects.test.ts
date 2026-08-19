// src/features/love/logic/partnerEffects.test.ts
//
// ============================================================================
//  THREE FIELDS THAT NOW DECIDE SOMETHING
// ============================================================================
//
//  Before this, four of the fifteen PartnerStats fields did anything: `looks`
//  and `style` are drawn, `intelligence` decides whether somebody signs a
//  prenup, and `monthlyCost` is charged. The other eleven were labels on a
//  card, and the card was the whole mechanic.
//
//  These are the three that plug into machinery the game already has. Jealousy
//  and crazy are event triggers and an event needs a scene written for it - a
//  mechanic with no writing behind it is the thing this project keeps having
//  to undo.
// ============================================================================

import {
    networkRelief,
    reputationDrift,
    aidOffer,
    MAX_NETWORK_RELIEF,
    REPUTATION_RATE,
    AID_CASH_FLOOR,
} from './partnerEffects';
import { resistance, SECOND_APPROACH_PENALTY } from '../../../core/market/negotiation';
import type { PartnerProfile } from '../../../data/relationshipTypes';

const partner = (stats: Partial<PartnerProfile['stats']>): PartnerProfile => ({
    id: 'p', name: 'Test Partner', photo: null,
    love: 70, relationYears: 1, isMarried: false, hasPrenup: false,
    stats: {
        ethnicity: 'Mixed', age: 30, occupation: 'x', looks: 60, style: 'Business',
        socialClass: 'MiddleClass', familyWealth: 0, intelligence: 60,
        jealousy: 0, crazy: 0, libido: 0,
        reputationBuff: 0, financialAidChance: 0, networkPower: 0,
        ...stats,
    },
});

describe('somebody at your table knows somebody at theirs', () => {
    it('makes a board easier to write to', () => {
        const base = {
            targetMarketCap: 1e9, acquirerValuation: 5e9, risk: 'Medium' as const,
            subject: 'purchase' as const, personalityShift: 0, priorRefusals: 0,
        };
        const cold = resistance(base);
        const warm = resistance({ ...base, networkRelief: MAX_NETWORK_RELIEF });
        expect(warm).toBeLessThan(cold);
    });

    it('and scales with how connected they are', () => {
        expect(networkRelief(partner({ networkPower: 100 }))).toBeCloseTo(MAX_NETWORK_RELIEF, 6);
        expect(networkRelief(partner({ networkPower: 50 }))).toBeCloseTo(MAX_NETWORK_RELIEF / 2, 6);
        expect(networkRelief(partner({ networkPower: 0 }))).toBe(0);
        expect(networkRelief(null)).toBe(0);
    });

    it('but never beats what the player actually did', () => {
        // The best-connected partner in the game is worth two thirds of ONE
        // signed partnership. Who you married should not beat what you did,
        // and a relationship that outweighs a negotiation is a relationship
        // system replacing the game rather than adding to it.
        expect(MAX_NETWORK_RELIEF).toBeLessThan(SECOND_APPROACH_PENALTY);
    });

    it('and resistance never goes negative on the strength of a marriage', () => {
        // The function floors at zero already; this pins that the new term
        // cannot be the thing that pushes it under.
        const r = resistance({
            targetMarketCap: 1, acquirerValuation: 1e12, risk: 'Low',
            subject: 'purchase', personalityShift: -1, priorRefusals: -1,
            networkRelief: MAX_NETWORK_RELIEF,
        });
        expect(r).toBeGreaterThanOrEqual(0);
    });
});

describe('being seen with them', () => {
    it('moves public standing, slowly', () => {
        // A tenth per quarter. It is a drift, not an event: the player should
        // notice it over a year rather than in a tick.
        expect(reputationDrift(partner({ reputationBuff: 30 }))).toBeCloseTo(3, 6);
        expect(REPUTATION_RATE).toBe(0.1);
    });

    it('and it goes the wrong way for some people', () => {
        // The only stat in the set allowed to be negative, and the trade the
        // criminal tier exists to offer.
        expect(reputationDrift(partner({ reputationBuff: -22 }))).toBeLessThan(0);
    });

    it('while nobody is neutral by accident', () => {
        expect(reputationDrift(partner({ reputationBuff: 0 }))).toBe(0);
        expect(reputationDrift(null)).toBe(0);
    });
});

describe('the offer of help', () => {
    const rich = partner({ financialAidChance: 100, familyWealth: 90 });

    it('is an OFFER and not a transfer', () => {
        // The whole design of it. Money appearing because a hidden percentage
        // came up is the shape this project has spent weeks removing from
        // other systems: the player cannot connect a number to a cause they
        // never saw. So this returns something to say, and the caller says it.
        const offer = aidOffer(rich, 0, () => 0);
        expect(offer).not.toBeNull();
        expect(offer!.amount).toBeGreaterThan(0);
        expect(offer!.from).toBe('Test Partner');
    });

    it('and only when the player is actually short', () => {
        // Somebody comfortable does not get handed money by their partner.
        expect(aidOffer(rich, AID_CASH_FLOOR, () => 0)).toBeNull();
        expect(aidOffer(rich, AID_CASH_FLOOR - 1, () => 0)).not.toBeNull();
    });

    it('and only from somebody who would', () => {
        expect(aidOffer(partner({ financialAidChance: 0, familyWealth: 90 }), 0, () => 0))
            .toBeNull();
    });

    it('and only from somebody who can', () => {
        // A partner from nothing who would give you everything still has
        // nothing to give. `familyWealth`, not love.
        expect(aidOffer(partner({ financialAidChance: 100, familyWealth: 0 }), 0, () => 0))
            .toBeNull();
    });

    it('and the chance is a chance, not a certainty', () => {
        const half = partner({ financialAidChance: 50, familyWealth: 90 });
        expect(aidOffer(half, 0, () => 0.2)).not.toBeNull();
        expect(aidOffer(half, 0, () => 0.8)).toBeNull();
    });

    it('while a player with no partner is never offered anything', () => {
        expect(aidOffer(null, 0, () => 0)).toBeNull();
    });
});
