// src/features/love/logic/strain.test.ts
//
// ============================================================================
//  JEALOUSY AND CRAZY, WITHOUT A DIE
// ============================================================================
//
//  The last two PartnerStats fields that decided nothing, and the two hardest
//  to add honestly. The obvious version is a percentage: roll every quarter and
//  at `jealousy / 100` somebody has a scene about it.
//
//  That is the shape this project has spent weeks removing. A relationship that
//  deteriorates because a hidden number came up is not a relationship, it is
//  weather with a name on it, and there is nothing in it for the player to
//  learn.
//
//  So it is built on three things the player actually did, all of them already
//  on the quarter: the overtime switch, the casino streak, and whether their
//  thread went unanswered. `jealousy` does not decide WHETHER anything happens.
//  It decides how much the same behaviour costs.
// ============================================================================

import {
    strainFor, sensitivity, hasLeft, leavesLoudly,
    STRAIN_OVERTIME, STRAIN_IGNORED, MIN_SENSITIVITY, LOUD_DEPARTURE_CRAZY,
} from './strain';
import { STRAIN_LINES, VOICE_FOR_PERSONALITY, DEPARTURE_LINES } from '../data/strainLines';
import { PERSONALITY_TRAITS } from '../data/personalitiesData';
import type { PartnerProfile } from '../../../data/relationshipTypes';

const partner = (over: { jealousy?: number; crazy?: number; love?: number } = {}): PartnerProfile => ({
    id: 'p', name: 'Test Partner', photo: null,
    love: over.love ?? 70, relationYears: 1, isMarried: false, hasPrenup: false,
    stats: {
        ethnicity: 'Mixed', age: 30, occupation: 'x', looks: 60, style: 'Business',
        socialClass: 'MiddleClass', familyWealth: 0, intelligence: 60,
        jealousy: over.jealousy ?? 50, crazy: over.crazy ?? 0, libido: 50,
        reputationBuff: 0, financialAidChance: 0, networkPower: 0,
    },
});

const QUIET = { overtime: false, casinoStreak: 0, ignored: false };

describe('a quarter where the player was present', () => {
    it('costs nothing at all', () => {
        // The assertion that stops this becoming a countdown. A relationship
        // that only ever falls is not a relationship either.
        expect(strainFor(partner(), QUIET)).toEqual({ loveChange: 0, reason: null });
    });

    it('and there is nothing to say about it', () => {
        expect(strainFor(partner({ jealousy: 100 }), QUIET).reason).toBeNull();
    });
});

describe('what the player did', () => {
    it('overtime costs, because the plant running late means you did', () => {
        const s = strainFor(partner({ jealousy: 100 }), { ...QUIET, overtime: true });
        expect(s.loveChange).toBe(-STRAIN_OVERTIME);
        expect(s.reason).toBe('overtime');
    });

    it('and one night at the tables is a night out', () => {
        // A habit is what gets mentioned. One quarter is not a habit.
        expect(strainFor(partner({ jealousy: 100 }), { ...QUIET, casinoStreak: 1 }).loveChange)
            .toBe(0);
        expect(strainFor(partner({ jealousy: 100 }), { ...QUIET, casinoStreak: 2 }).loveChange)
            .toBeLessThan(0);
    });

    it('while silence is the most expensive of the three', () => {
        // It is also the one the player can fix by opening an app, which is
        // why it is allowed to cost the most.
        expect(STRAIN_IGNORED).toBeGreaterThan(STRAIN_OVERTIME);
        expect(strainFor(partner({ jealousy: 100 }), { ...QUIET, ignored: true }).reason)
            .toBe('ignored');
    });

    it('and the worst single thing is what they name', () => {
        // ONE reason, not a list. A partner who recites three grievances is a
        // changelog; a partner who names the one that hurt is a person.
        const s = strainFor(partner({ jealousy: 100 }), {
            overtime: true, casinoStreak: 3, ignored: true,
        });
        expect(s.reason).toBe('ignored');
        expect(s.loveChange).toBeLessThan(-STRAIN_IGNORED);
    });
});

describe('jealousy decides how much, not whether', () => {
    it('so the same quarter costs more to somebody who counts', () => {
        const conduct = { ...QUIET, overtime: true };
        const easy = strainFor(partner({ jealousy: 15 }), conduct).loveChange;
        const hard = strainFor(partner({ jealousy: 95 }), conduct).loveChange;
        expect(hard).toBeLessThan(easy);
    });

    it('and the easiest-going partner still notices eventually', () => {
        // Without a floor, "she does not mind" becomes "she is not
        // implemented" - and a mechanic that rounds to nothing is a mechanic
        // the player will report as broken.
        expect(sensitivity(partner({ jealousy: 0 }))).toBe(MIN_SENSITIVITY);
        expect(strainFor(partner({ jealousy: 0 }), { ...QUIET, ignored: true }).loveChange)
            .toBeLessThan(0);
    });
});

describe('crazy does nothing until they leave', () => {
    it('which is the honest reading of the field', () => {
        // It is not a personality tax. It is what happens when somebody is
        // hurt and has nothing left to lose.
        const conduct = { ...QUIET, overtime: true };
        expect(strainFor(partner({ jealousy: 50, crazy: 0 }), conduct).loveChange)
            .toBe(strainFor(partner({ jealousy: 50, crazy: 100 }), conduct).loveChange);
    });

    it('and then it decides how loudly', () => {
        expect(leavesLoudly(partner({ crazy: LOUD_DEPARTURE_CRAZY }))).toBe(true);
        expect(leavesLoudly(partner({ crazy: LOUD_DEPARTURE_CRAZY - 1 }))).toBe(false);
    });

    it('while leaving is a line, not a quantity', () => {
        expect(hasLeft(partner({ love: 1 }))).toBe(false);
        expect(hasLeft(partner({ love: 0 }))).toBe(true);
        expect(hasLeft(null)).toBe(false);
    });
});

describe('what they say', () => {
    it('always names the thing the player actually did', () => {
        // The whole reason strain is built on conduct rather than on a die:
        // the player reads the message, remembers throwing the switch, and
        // connects the two without being told.
        expect(STRAIN_LINES.measured.overtime).toMatch(/plant|late/i);
        expect(STRAIN_LINES.counting.casino).toMatch(/casino|tables/i);
        expect(STRAIN_LINES.sharp.ignored).toMatch(/answer/i);
    });

    it('and never says the mechanic out loud', () => {
        for (const voice of Object.values(STRAIN_LINES)) {
            for (const line of Object.values(voice)) {
                expect(line.toLowerCase()).not.toContain('jealous');
                expect(line.toLowerCase()).not.toContain('relationship level');
            }
        }
    });

    it('and every personality has a voice, or it falls back rather than going quiet', () => {
        // Silence would make the strain invisible, and invisible is the fault
        // this whole feature is fixing.
        for (const p of PERSONALITY_TRAITS) {
            expect(VOICE_FOR_PERSONALITY[p.id]).toBeDefined();
        }
    });

    it('and the quiet departure is the one without a threat in it', () => {
        expect(DEPARTURE_LINES.quiet).not.toMatch(/ring|say|tell/i);
        expect(DEPARTURE_LINES.loud).toMatch(/ring|say/i);
    });

    it('and no dash got into any of it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        const all = [
            ...Object.values(STRAIN_LINES).flatMap(v => Object.values(v)),
            ...Object.values(DEPARTURE_LINES),
        ];
        expect(all.filter(l => DASH.test(l))).toEqual([]);
    });
});
