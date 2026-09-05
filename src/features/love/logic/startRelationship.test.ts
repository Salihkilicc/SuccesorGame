// src/features/love/logic/startRelationship.test.ts
//
// ============================================================================
//  WHAT IT COSTS TO LEAVE, AND WHO YOU LEAVE THEM FOR
// ============================================================================
//
//  Two ways into a relationship, one set of rules. The VIP encounter had
//  these forty lines inline and the swipe app had nothing at all - it set a
//  status flag and stored no partner, so a match evaporated the moment the
//  overlay closed.
//
//  Wiring the second one meant either sharing the rules or copying them. The
//  roll is passed IN rather than drawn here, which is the whole reason this
//  can be tested at all: the question "what happens at 49.9 and at 50.1" has
//  an answer, instead of a thousand runs and a hope.
// ============================================================================

import {
    CATCH_CHANCE_CALM, CATCH_CHANCE_JEALOUS, DIVORCE_SHARE,
    JEALOUS_ENOUGH_TO_NOTICE, cheatingOutcome, partnerFromCandidate,
} from './startRelationship';
import type { PartnerProfile } from '../../../data/relationshipTypes';
import type { HookupCandidate } from '../../life/components/hookupData';

const someone = (over: Record<string, unknown> = {}): PartnerProfile => ({
    id: 'p', name: 'Sophia Vance', photo: null, love: 60,
    relationYears: 2, isMarried: false, hasPrenup: false,
    stats: {
        ethnicity: 'RoyalEuropean', age: 30, occupation: 'Curator',
        looks: 70, style: 'Elegant', socialClass: 'HighSociety', familyWealth: 50,
        intelligence: 70, jealousy: 20, crazy: 20, libido: 50,
        reputationBuff: 0, financialAidChance: 0, networkPower: 0,
    },
    ...over,
} as PartnerProfile);

describe('leaving somebody', () => {
    it('costs nothing when there was nobody', () => {
        expect(cheatingOutcome(null, 1_000_000, 0)).toEqual({
            caught: false, settlement: 0, catchChance: 0,
        });
        expect(cheatingOutcome(undefined, 1_000_000, 99)).toEqual({
            caught: false, settlement: 0, catchChance: 0,
        });
    });

    it('is usually survivable with somebody who is not watching', () => {
        const calm = someone();
        expect(cheatingOutcome(calm, 100, 0).catchChance).toBe(CATCH_CHANCE_CALM);
        expect(cheatingOutcome(calm, 100, CATCH_CHANCE_CALM - 0.1).caught).toBe(true);
        expect(cheatingOutcome(calm, 100, CATCH_CHANCE_CALM).caught).toBe(false);
    });

    it('and a coin flip with somebody who is', () => {
        const jealous = someone({
            stats: { ...someone().stats, jealousy: JEALOUS_ENOUGH_TO_NOTICE + 1 },
        });
        expect(cheatingOutcome(jealous, 100, 0).catchChance).toBe(CATCH_CHANCE_JEALOUS);
        expect(cheatingOutcome(jealous, 100, CATCH_CHANCE_JEALOUS - 0.1).caught).toBe(true);
        expect(cheatingOutcome(jealous, 100, CATCH_CHANCE_JEALOUS).caught).toBe(false);
    });

    it('and exactly at the jealousy line they are still not watching', () => {
        // The threshold is "more than", not "at least". Stated because a
        // boundary nobody writes down is a boundary that moves.
        const onTheLine = someone({
            stats: { ...someone().stats, jealousy: JEALOUS_ENOUGH_TO_NOTICE },
        });
        expect(cheatingOutcome(onTheLine, 100, 0).catchChance).toBe(CATCH_CHANCE_CALM);
    });

    it('but a marriage always finds out', () => {
        // Not an oversight. The settlement is the entire point of the prenup
        // question asked at the altar, and a marriage you could cheat on with
        // a nine in ten chance of getting away with it makes that question
        // meaningless.
        const married = someone({ isMarried: true });
        expect(cheatingOutcome(married, 100, 99.99).caught).toBe(true);
        expect(cheatingOutcome(married, 100, 0).catchChance).toBe(100);
    });
});

describe('and what it costs', () => {
    it('nothing at all, unmarried, however jealous they are', () => {
        const jealous = someone({ stats: { ...someone().stats, jealousy: 99 } });
        expect(cheatingOutcome(jealous, 5_000_000, 0).settlement).toBe(0);
    });

    it('nothing with a prenup, which is what the prenup is for', () => {
        const protectedOne = someone({ isMarried: true, hasPrenup: true });
        expect(cheatingOutcome(protectedOne, 5_000_000, 0).settlement).toBe(0);
    });

    it('and half of everything without one', () => {
        const exposed = someone({ isMarried: true, hasPrenup: false });
        expect(cheatingOutcome(exposed, 5_000_000, 0).settlement)
            .toBe(5_000_000 * DIVORCE_SHARE);
    });

    it('and never a negative settlement out of a negative balance', () => {
        // Being in debt should not pay you to get divorced.
        const exposed = someone({ isMarried: true });
        expect(cheatingOutcome(exposed, -2_000_000, 0).settlement).toBe(0);
    });
});

describe('a swipe card becomes somebody the game can hold', () => {
    const card = (over: Record<string, unknown> = {}): HookupCandidate => ({
        id: 'hk-1', name: 'Nadia Sol', age: 31, job: 'Curator', bio: 'x',
        difficulty: 40, gender: 'female', imageColor: '#434B50',
        distance: 4, interests: ['art'],
        ...over,
    } as HookupCandidate);

    it('keeping the identity that was on the card', () => {
        // The age above all: it is printed beside their face on three screens
        // now, and a converted partner who quietly became 27 would put a
        // wrong number under a right picture.
        const p = partnerFromCandidate(card());
        expect(p.id).toBe('hk-1');
        expect(p.name).toBe('Nadia Sol');
        expect(p.gender).toBe('female');
        expect(p.stats.age).toBe(31);
        expect(p.stats.occupation).toBe('Curator');
    });

    it('and arriving with the psychometrics filled in, not empty', () => {
        // A HookupCandidate has nine fields and a PartnerProfile needs
        // twenty. Inventing the difference here is what an earlier adapter
        // did, with Math.random, ignoring the personality entirely - the
        // shelved note at the top of useEncounterSystem is the post mortem.
        const p = partnerFromCandidate(card());
        for (const k of ['jealousy', 'crazy', 'libido', 'intelligence', 'looks'] as const) {
            expect(typeof p.stats[k]).toBe('number');
            expect(Number.isFinite(p.stats[k])).toBe(true);
        }
        expect(p.personality).toBeDefined();
        expect(p.finances?.monthlyCost).toBeGreaterThanOrEqual(0);
    });

    it('and single, unmarried, at the beginning of something', () => {
        const p = partnerFromCandidate(card());
        expect(p.isMarried).toBe(false);
        expect(p.hasPrenup).toBe(false);
        expect(p.relationYears).toBe(0);
    });

    it('and an easier match starts warmer than a harder one', () => {
        const easy = partnerFromCandidate(card({ id: 'a', difficulty: 10 }));
        const hard = partnerFromCandidate(card({ id: 'b', difficulty: 90 }));
        expect(easy.love).toBeGreaterThan(hard.love);
        for (const p of [easy, hard]) {
            expect(p.love).toBeGreaterThanOrEqual(35);
            expect(p.love).toBeLessThanOrEqual(70);
        }
    });
});
