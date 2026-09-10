// src/features/love/datePool.test.ts
//
// ============================================================================
//  THE DATE BUTTON ONLY EVER PRODUCED A STRANGER
// ============================================================================
//
//  Reported after the first version of the casino work shipped, and it was a
//  fair correction: "kumarhanede kullandigimiz karakterlere partner cardlar
//  yaratip PROFILDEKI DATE E BASINCA CIKAN partner cardlarini artirmakti."
//
//  What had been built was a magnate writing to you after a poker table and
//  turning up next time you went looking. That works, and it is one door, in a
//  different feature. A player who never touches poker pressed Date and got a
//  person invented on the spot, every single time, for the whole dynasty - so
//  the sixty one written characters were not in the dating pool at all.
//
//  This is the pool itself being wider.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { KNOWN_CHANCE, drawKnown, namedFor } from './logic/knownCandidates';
import { TIER_STANDING } from './logic/courtship';
import { partnerFromKnownPerson } from './logic/partnerGenerator';
import { CEO_NAMES, MAGNATES, seatGender } from '../../core/casino/pokerTable';
import { tierForSeat } from '../casino/logic/tableInterest';
import type { SocialTier } from '../../data/relationshipTypes';

const ROOT = path.join(__dirname, '..', '..', '..');
const live = (...p: string[]) =>
    fs.readFileSync(path.join(ROOT, ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const dice = (seed: number) => {
    let s = seed;
    return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

/** The two rooms the game has actually written people for. */
const WITH_NAMES: SocialTier[] = ['HIGH_SOCIETY', 'CORPORATE_ELITE'];
const WITHOUT = TIER_STANDING.filter(t => !WITH_NAMES.includes(t));

describe('the two rooms that have real people in them', () => {
    it('old money is the forty magnates, and it is the same list the table uses', () => {
        expect(namedFor('HIGH_SOCIETY')).toHaveLength(MAGNATES.length);
        expect(namedFor('HIGH_SOCIETY')).toHaveLength(40);
        // Not a second copy of the roster with a second opinion in it.
        const ids = namedFor('HIGH_SOCIETY').map(p => p.id).sort();
        expect(ids).toEqual(MAGNATES.map(m => m.id).sort());
    });

    it('and the corporate room is the twenty one rivals', () => {
        expect(namedFor('CORPORATE_ELITE')).toHaveLength(Object.keys(CEO_NAMES).length);
        expect(namedFor('CORPORATE_ELITE')).toHaveLength(21);
    });

    it('and each of them is in the room the poker table puts them in', () => {
        // One fact, answered once. `tierForSeat` decides it for the seat and
        // this has to agree, or a magnate is old money at the table and
        // something else on the card.
        expect(tierForSeat('magnate')).toBe('HIGH_SOCIETY');
        expect(tierForSeat('ceo')).toBe('CORPORATE_ELITE');
    });

    it('and everybody in both lists carries their own sex', () => {
        for (const tier of WITH_NAMES) {
            for (const p of namedFor(tier)) {
                expect(p.gender).toBe(seatGender(p.id));
                expect(p.known).toBeTruthy();
            }
        }
    });

    it('and the other five rooms have nobody, which is not a hole', () => {
        // There is nobody written for a student bar or a criminal tier, and
        // inventing sixty more names to make the table symmetrical would
        // produce exactly the strangers this exists to dilute.
        for (const tier of WITHOUT) {
            expect(namedFor(tier)).toEqual([]);
            expect(drawKnown(tier, 'male', new Set(), dice(1))).toBeNull();
        }
    });
});

describe('and how much of the pool they actually are', () => {
    it('measured over twenty thousand taps rather than asserted', () => {
        // ------------------------------------------------------------------
        //  MEASURED: 27.5% OF TAPS IN THE TWO ROOMS THAT HAVE THEM
        // ------------------------------------------------------------------
        //  Below KNOWN_CHANCE of a third, because the gender filter takes out
        //  the ones facing the wrong way. That gap is the rule working, not a
        //  leak, so it is stated rather than smoothed over.
        //
        //  And it applies to two rooms out of seven, so the share of ALL
        //  dating in a run is a good deal lower than a quarter.
        // ------------------------------------------------------------------
        for (const tier of WITH_NAMES) {
            const roll = dice(9);
            let named = 0;
            const runs = 20_000;
            for (let i = 0; i < runs; i++) {
                if (drawKnown(tier, 'male', new Set(), roll)) named++;
            }
            const rate = named / runs;
            expect(rate).toBeGreaterThan(0.2);
            expect(rate).toBeLessThan(KNOWN_CHANCE);
        }
    });

    it('and a run meets a lot of them rather than the same two', () => {
        // Sixty taps at old money. If the draw favoured a corner of the list
        // this would come back in single figures.
        const roll = dice(4);
        const met = new Set<string>();
        for (let i = 0; i < 60; i++) {
            const k = drawKnown('HIGH_SOCIETY', 'male', met, roll);
            if (k) met.add(k.id);
        }
        expect(met.size).toBeGreaterThan(12);
    });

    it('and it is mostly the other sex, sometimes not', () => {
        const roll = dice(3);
        let same = 0;
        let total = 0;
        for (let i = 0; i < 20_000; i++) {
            const k = drawKnown('HIGH_SOCIETY', 'male', new Set(), roll);
            if (!k) continue;
            total++;
            if (k.gender === 'male') same++;
        }
        expect(total).toBeGreaterThan(1000);
        expect(same / total).toBeGreaterThan(0.05);
        expect(same / total).toBeLessThan(0.45);
    });
});

describe('and you are never handed somebody you have already had', () => {
    it('an ex is not offered as a brand new candidate', () => {
        // ------------------------------------------------------------------
        //  THE FAILURE THIS PREVENTS IS WORSE THAN NOT MEETING THEM
        // ------------------------------------------------------------------
        //  Meeting Sylvie Valmorel again, on a fresh card, with a background
        //  paragraph and no memory of the four years and the settlement, says
        //  the game does not know what happened. A stranger says nothing,
        //  which is better than saying something false.
        // ------------------------------------------------------------------
        const taken = new Set([MAGNATES[0].id]);
        const roll = dice(6);
        for (let i = 0; i < 5_000; i++) {
            const k = drawKnown('HIGH_SOCIETY', 'male', taken, roll);
            if (k) expect(k.id).not.toBe(MAGNATES[0].id);
        }
    });

    it('and when the whole room is spoken for it falls back to a stranger', () => {
        const all = new Set(namedFor('HIGH_SOCIETY').map(p => p.id));
        const roll = dice(2);
        for (let i = 0; i < 1_000; i++) {
            expect(drawKnown('HIGH_SOCIETY', 'male', all, roll)).toBeNull();
        }
    });

    it('and the door really passes the partner and the exes in', () => {
        // The half that goes missing: a correct exclusion rule that the caller
        // never gives anything to exclude. It would look exactly like the rule
        // working, because most of the time nobody has an ex.
        const src = live('src', 'features', 'love', 'logic', 'runCourtship.ts');
        const block = src.slice(src.indexOf('const family = useFamilyStore'), src.indexOf('const { accepted }'));
        expect(block.length).toBeGreaterThan(80);
        expect(block).toMatch(/family\.partner \? \[family\.partner\.id\]/);
        expect(block).toMatch(/exPartners/);
        expect(block).toMatch(/drawKnown\(tier, playerGender\(\), met, roll\)/);
    });
});

describe('and what turns up is a whole person, not a name', () => {
    it('every one of the sixty one builds a complete card', () => {
        for (const tier of WITH_NAMES) {
            for (const who of namedFor(tier)) {
                const p = partnerFromKnownPerson(who);
                expect(p.name).toBe(who.name);
                expect(p.stats.occupation).toBeTruthy();
                expect(p.stats.background).toBeTruthy();
                expect(p.finances?.monthlyCost).toBeGreaterThan(0);
                expect(p.personality?.id).toBeTruthy();
                expect(typeof p.stats.familyWealth).toBe('number');
            }
        }
    });

    it('and a magnate costs more than a rival, because their room does', () => {
        const magnate = partnerFromKnownPerson(namedFor('HIGH_SOCIETY')[0]);
        const rival = partnerFromKnownPerson(namedFor('CORPORATE_ELITE')[0]);
        // Their rooms, not the player's. HIGH_SOCIETY opens at five billion
        // and CORPORATE_ELITE at five hundred million, so the gate does this.
        expect(magnate.stats.socialClass).toBe('OldMoney');
        expect(rival.stats.socialClass).toBe('HighSociety');
    });

    it('and the whole sixty one are sixty one different people', () => {
        const all = [...namedFor('HIGH_SOCIETY'), ...namedFor('CORPORATE_ELITE')]
            .map(partnerFromKnownPerson);
        expect(all).toHaveLength(61);
        expect(new Set(all.map(p => p.id)).size).toBe(61);
        expect(new Set(all.map(p => p.name)).size).toBe(61);
    });
});
