// src/features/love/logic/psychometrics.test.ts
//
// ============================================================================
//  A PARTNER THE PLAYER MEETS USED TO ARRIVE BLANK
// ============================================================================
//
//  `PartnerStats` has fifteen fields and `generatePartner` produced none of
//  them. It returned the second partner type - four stats, no psychometrics -
//  and an adapter downstream invented the rest with `Math.random()`, ignoring
//  the personality entirely.
//
//  So the label on the card predicted nothing. A Loyal Confidante and a High
//  Maintenance came out of the same distribution, and the symptom would have
//  been "the relationship system does not seem to do anything" rather than
//  anything that looks like a bug.
//
//  These tests are mostly about that: the numbers have to follow the words.
// ============================================================================

import { fingerprintFor, CLASS_FOR_TIER, FINGERPRINTED_PERSONALITIES } from './psychometrics';
import { PERSONALITY_TRAITS } from '../data/personalitiesData';
import { JOBS_DATABASE } from '../data/jobsData';
import { generatePartner } from './partnerGenerator';
import type { PersonalityTrait, SocialTier } from '../../../data/relationshipTypes';

const trait = (id: string): PersonalityTrait =>
    PERSONALITY_TRAITS.find(p => p.id === id)!;

/** No jitter, so a fingerprint can be compared against another one. */
const flat = () => 0.5;

describe('the numbers follow the words', () => {
    it('a Corporate Shark has a network and a Loyal Confidante does not need one', () => {
        const shark = fingerprintFor('CORPORATE_ELITE', trait('corporate_shark'), flat);
        const loyal = fingerprintFor('CORPORATE_ELITE', trait('supportive'), flat);
        expect(shark.networkPower).toBeGreaterThan(loyal.networkPower);
    });

    it('and High Maintenance is dangerous where Loyal Confidante is not', () => {
        // The two ends of the same axis, and the pair the whole system is for.
        const digger = fingerprintFor('HIGH_SOCIETY', trait('gold_digger'), flat);
        const loyal = fingerprintFor('HIGH_SOCIETY', trait('supportive'), flat);
        expect(digger.crazy).toBeGreaterThan(loyal.crazy + 40);
        expect(digger.jealousy).toBeGreaterThan(loyal.jealousy + 40);
    });

    it('and nothing comes back from the expensive one', () => {
        expect(fingerprintFor('HIGH_SOCIETY', trait('gold_digger'), flat).financialAidChance)
            .toBe(0);
        expect(fingerprintFor('HIGH_SOCIETY', trait('philanthropist'), flat).financialAidChance)
            .toBeGreaterThan(40);
    });

    it('while old money is where the family wealth is', () => {
        const old = fingerprintFor('HIGH_SOCIETY', trait('sophisticated'), flat);
        const student = fingerprintFor('STUDENT_LIFE', trait('sophisticated'), flat);
        expect(old.familyWealth).toBeGreaterThan(student.familyWealth);
    });
});

describe('being seen with them', () => {
    it('costs you, in one tier and only one', () => {
        // The trade the criminal tier exists to offer: a real network, and a
        // reputation that goes the wrong way. It is the only negative in the
        // set, which is why `reputationBuff` is clamped to a band rather than
        // to 0-100.
        const underground = fingerprintFor('UNDERGROUND', trait('supportive'), flat);
        expect(underground.reputationBuff).toBeLessThan(0);
        expect(underground.networkPower).toBeGreaterThan(40);
        expect(underground.socialClass).toBe('CriminalElite');
    });

    it('and the philanthropist is the other end of it', () => {
        expect(fingerprintFor('HIGH_SOCIETY', trait('philanthropist'), flat).reputationBuff)
            .toBeGreaterThan(20);
    });
});

describe('the shape of the output', () => {
    const TIERS: SocialTier[] = ['HIGH_SOCIETY', 'CORPORATE_ELITE', 'ARTISTIC',
        'UNDERGROUND', 'BLUE_COLLAR', 'STUDENT_LIFE'];

    it('every personality has a fingerprint, or generation throws', () => {
        // The alternative is a partner with tier numbers and no character, and
        // no sign that anything went wrong - which is the failure this whole
        // file exists to end. So it is checked here rather than trusted.
        for (const p of PERSONALITY_TRAITS) {
            expect(FINGERPRINTED_PERSONALITIES).toContain(p.id);
        }
    });

    it('and a personality nobody wrote one for is loud about it', () => {
        expect(() => fingerprintFor('ARTISTIC', {
            id: 'invented', label: 'x', costMultiplier: 1, description: '',
        })).toThrow(/fingerprint/);
    });

    it('every tier maps to a social class', () => {
        for (const tier of TIERS) expect(CLASS_FOR_TIER[tier]).toBeDefined();
    });

    it('and every number lands inside its range, jitter included', () => {
        // Swept rather than sampled: the jitter is what can push a value out,
        // and a value out of range is a silent NaN three screens later.
        for (const tier of TIERS) {
            for (const p of PERSONALITY_TRAITS) {
                for (let i = 0; i < 20; i++) {
                    const f = fingerprintFor(tier, p);
                    expect(f.familyWealth).toBeGreaterThanOrEqual(0);
                    expect(f.familyWealth).toBeLessThanOrEqual(100);
                    expect(f.crazy).toBeGreaterThanOrEqual(0);
                    expect(f.networkPower).toBeLessThanOrEqual(100);
                    expect(f.reputationBuff).toBeGreaterThanOrEqual(-25);
                    expect(f.reputationBuff).toBeLessThanOrEqual(30);
                }
            }
        }
    });

    it('and two of the same person are not identical', () => {
        // Without jitter every Power Broker in the game is the same partner
        // with a different name, which is worse than random numbers.
        const a = fingerprintFor('CORPORATE_ELITE', trait('power_broker'));
        const b = fingerprintFor('CORPORATE_ELITE', trait('power_broker'));
        const different = (Object.keys(a) as (keyof typeof a)[])
            .filter(k => a[k] !== b[k]);
        expect(different.length).toBeGreaterThan(0);
    });
});

// ============================================================================
//  AND THE GENERATOR PRODUCES SOMETHING THAT CAN BE STORED
// ============================================================================
describe('a generated partner', () => {
    it('is a complete PartnerProfile', () => {
        // The one assertion this whole step is for. It used to be the second
        // partner type: `age` and `gender` at the top level, `relationshipLevel`
        // rather than `love`, `avatar` rather than `photo`, no psychometrics.
        for (let i = 0; i < 40; i++) {
            const p = generatePartner();
            expect(typeof p.love).toBe('number');
            expect(p.photo).toBeNull();
            expect(p.relationYears).toBe(0);
            expect(p.stats.age).toBeGreaterThan(17);
            expect(p.stats.occupation).toBeTruthy();
            expect(p.stats.socialClass).toBeTruthy();
            expect(typeof p.stats.networkPower).toBe('number');
            expect(typeof p.stats.jealousy).toBe('number');
        }
    });

    it('and it costs something, which is the field the engine reads', () => {
        const p = generatePartner('HIGH_SOCIETY');
        expect(p.finances?.monthlyCost).toBeGreaterThan(0);
    });

    it('and a forced tier is honoured all the way through to the class', () => {
        for (let i = 0; i < 20; i++) {
            const p = generatePartner('UNDERGROUND');
            expect(p.stats.socialClass).toBe(CLASS_FOR_TIER.UNDERGROUND);
        }
    });

    it('while its occupation is a real job rather than a made-up string', () => {
        const titles = new Set(JOBS_DATABASE.map(j => j.title));
        for (let i = 0; i < 20; i++) {
            expect(titles.has(generatePartner().stats.occupation)).toBe(true);
        }
    });
});
