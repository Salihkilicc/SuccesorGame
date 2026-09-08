// src/features/love/datingPool.test.ts
//
// ============================================================================
//  HALF THE POOL WAS A MAN CALLED PHILIPPA, AND THE ROOM STOPPED AT FIVE BILLION
// ============================================================================
//
//  Three faults, all measured before anything was touched.
//
//  1. GENDER WAS A COIN THAT CONSULTED NOBODY. `Math.random() > 0.5`. Over
//     four hundred candidates: 208 male, 192 female, whoever was playing.
//
//  2. AND THE NAME DID NOT FOLLOW IT. Every one of those 208 men was named
//     off `first`, and `first` is 260 female names. Scanned by hand, the
//     number of recognisably male names in the whole database was ZERO:
//
//         male  Philippa Hanover      (Formula 1 Team Principal)
//         male  Victoria Brown        (Royal Philanthropy Ambassador)
//         male  Aaliyah Jackson       (MIT Quantum Physics Fellow)
//         male  Anastasia Vinogradova (Old-Money Dynasty Heiress)
//
//     Invisible while everybody was a monogram. The portraits made it loud.
//
//  3. AND THE LADDER ENDED TOO EARLY. HIGH_SOCIETY opened at five billion and
//     was the top, so a dynasty worth two trillion met exactly the people it
//     met on the day it crossed five billion, for the rest of the run.
// ============================================================================

import { NAME_DATABASE, namesFor } from './data/nameData';
import { JOBS_DATABASE } from './data/jobsData';
import {
    SAME_GENDER_CHANCE,
    generatePartner,
    partnerGenderFor,
    titleOf,
} from './logic/partnerGenerator';
import { TIER_STANDING, TIER_UNLOCK, tiersOpenTo } from './logic/courtship';
import { CLASS_FOR_TIER } from './logic/psychometrics';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import type { Ethnicity, SocialTier } from '../../data/relationshipTypes';

const ETHNICITIES = Object.keys(NAME_DATABASE) as Ethnicity[];

/** Draw many, with the player set one way. */
const pool = (playerGender: 'male' | 'female', n = 600) => {
    useIdentityStore.setState({ gender: playerGender } as never);
    return Array.from({ length: n }, () => generatePartner());
};

describe('the person who turns up leans the other way, mostly', () => {
    afterEach(() => useIdentityStore.setState({ gender: 'male' } as never));

    it('a woman playing meets mostly men', () => {
        const men = pool('female').filter(p => p.gender === 'male').length;
        // 80 per cent, and the band is wide enough that 600 draws cannot
        // fail it by luck: three sigma on n=600 at p=0.8 is about 29.
        expect(men).toBeGreaterThan(600 * 0.72);
        expect(men).toBeLessThan(600 * 0.88);
    });

    it('and a man playing meets mostly women, but not only', () => {
        const drawn = pool('male');
        const men = drawn.filter(p => p.gender === 'male').length;
        expect(men).toBeGreaterThan(600 * 0.12);
        expect(men).toBeLessThan(600 * 0.28);
    });

    it('and it is a lean rather than a rule, at the stated odds', () => {
        // "hepsi degil" - the request was explicitly not all of them.
        expect(SAME_GENDER_CHANCE).toBeGreaterThan(0);
        expect(SAME_GENDER_CHANCE).toBeLessThan(0.5);
        expect(partnerGenderFor('female', 0)).toBe('female');
        expect(partnerGenderFor('female', 0.99)).toBe('male');
        expect(partnerGenderFor('male', 0)).toBe('male');
        expect(partnerGenderFor('male', 0.99)).toBe('female');
    });

    it('and a save with no gender on it still gets both, not a crash', () => {
        expect(partnerGenderFor(undefined, 0.9)).toBe('female');
        expect(partnerGenderFor(undefined, 0.1)).toBe('male');
        expect(partnerGenderFor('other' as never, 0.9)).toBe('female');
    });
});

describe('and the name matches the person wearing it', () => {
    it('every ethnicity has as many men as women to draw from', () => {
        for (const e of ETHNICITIES) {
            expect({ e, n: NAME_DATABASE[e].firstMale.length }).toEqual({ e, n: 20 });
            expect({ e, n: NAME_DATABASE[e].first.length }).toEqual({ e, n: 20 });
        }
    });

    it('and the two lists do not overlap, or the fix would be cosmetic', () => {
        // ------------------------------------------------------------------
        //  THE CHECK THAT WOULD HAVE CAUGHT THIS THE FIRST TIME
        // ------------------------------------------------------------------
        //  A `firstMale` that quietly repeated the female list would pass
        //  every other test in this file and change nothing on the card.
        // ------------------------------------------------------------------
        for (const e of ETHNICITIES) {
            const feminine = new Set(NAME_DATABASE[e].first);
            const shared = NAME_DATABASE[e].firstMale.filter(n => feminine.has(n));
            expect({ e, shared }).toEqual({ e, shared: [] });
        }
    });

    it('and no man drawn is called by a woman name', () => {
        const female = new Set(ETHNICITIES.flatMap(e => NAME_DATABASE[e].first));
        const men = pool('female', 400).filter(p => p.gender === 'male');
        // A floor, not a measurement of the split - that is two tests up.
        expect(men.length).toBeGreaterThan(120);
        const wrong = men
            .map(p => p.name.split(' ')[0])
            .filter(first => female.has(first));
        expect(wrong).toEqual([]);
    });

    it('and no woman drawn is called by a man name', () => {
        const male = new Set(ETHNICITIES.flatMap(e => NAME_DATABASE[e].firstMale));
        const women = pool('male', 400).filter(p => p.gender === 'female');
        expect(women.length).toBeGreaterThan(120);
        const wrong = women
            .map(p => p.name.split(' ')[0])
            .filter(first => male.has(first));
        expect(wrong).toEqual([]);
    });

    it('and the Slavic surname is inflected rather than left feminine', () => {
        // Dmitri Vinogradova is not a name. The list was written entirely in
        // the feminine except for the one entry that was not.
        expect(namesFor('Slavic', 'male').last).toContain('Vinogradov');
        expect(namesFor('Slavic', 'male').last).toContain('Smirnov');
        expect(namesFor('Slavic', 'female').last).toContain('Vinogradova');
        expect(namesFor('Slavic', 'female').last).toContain('Smirnova');
    });

    it('and nothing else is inflected, which would break the other twelve', () => {
        for (const e of ETHNICITIES) {
            if (e === 'Slavic') continue;
            expect(namesFor(e, 'male').last).toEqual(NAME_DATABASE[e].last);
            expect(namesFor(e, 'female').last).toEqual(NAME_DATABASE[e].last);
        }
    });
});

describe('and a job whose name has a gender in it uses the right one', () => {
    it('a man is not introduced as an Heiress', () => {
        const heiress = JOBS_DATABASE.find(j => j.id === 'dynasty_heiress')!;
        expect(titleOf(heiress, 'male')).toBe('Old-Money Dynasty Heir');
        expect(titleOf(heiress, 'female')).toBe('Old-Money Dynasty Heiress');
        // And a caller that knows nothing still gets a title.
        expect(titleOf(heiress)).toBe(heiress.title);
    });

    it('and no candidate ever carries the wrong one', () => {
        const wrong = [...pool('female', 300), ...pool('male', 300)].filter(p => {
            const o = p.stats.occupation;
            return (p.gender === 'male' && /Heiress|Queen/.test(o))
                || (p.gender === 'female' && /\bHeir\b|\bKing\b/.test(o));
        });
        expect(wrong.map(p => `${p.gender} ${p.stats.occupation}`)).toEqual([]);
    });
});

describe('and the room keeps going past five billion', () => {
    it('there is a tier above old money', () => {
        expect(TIER_STANDING[TIER_STANDING.length - 1]).toBe('GLOBAL_ELITE');
        expect(TIER_UNLOCK.GLOBAL_ELITE).toBeGreaterThan(TIER_UNLOCK.HIGH_SOCIETY * 10);
    });

    it('and a trillion dollar dynasty is shown it', () => {
        // The measured ceiling: five billion and two trillion met the same
        // ten people, because HIGH_SOCIETY was the last entry in the list.
        expect(tiersOpenTo(2e12).slice(-1)[0]).toBe('GLOBAL_ELITE');
        expect(tiersOpenTo(1e10).slice(-1)[0]).toBe('HIGH_SOCIETY');
    });

    it('and the room is really populated, not just declared', () => {
        // A tier with no jobs in it would make `generatePartner` fall back to
        // the whole database and quietly hand back a barista.
        const jobs = JOBS_DATABASE.filter(j => j.tier === 'GLOBAL_ELITE');
        expect(jobs.length).toBeGreaterThanOrEqual(10);
        for (let i = 0; i < 60; i++) {
            expect(generatePartner('GLOBAL_ELITE').job?.tier).toBe('GLOBAL_ELITE');
        }
    });

    it('and it makes the best social class in the game reachable at last', () => {
        // `Royalty` was declared from the start and no tier produced one.
        expect(CLASS_FOR_TIER.GLOBAL_ELITE).toBe('Royalty');
        expect(generatePartner('GLOBAL_ELITE').stats.socialClass).toBe('Royalty');
    });

    it('and every table that is keyed by tier has an entry for it', () => {
        // A missing key is `undefined` at runtime and a partner with no cost,
        // no style and no family wealth. The type checker catches the Records;
        // this catches the ones written as switches and object literals.
        const p = generatePartner('GLOBAL_ELITE');
        expect(p.finances?.monthlyCost).toBeGreaterThan(0);
        expect(p.stats.style).toBeTruthy();
        expect(p.stats.familyWealth).toBeGreaterThan(80);
        expect(p.job?.buffValue).toBeGreaterThan(0);
    });

    it('and it is the only tier added, so nothing below it moved', () => {
        const below: SocialTier[] = [
            'UNDERGROUND', 'STUDENT_LIFE', 'BLUE_COLLAR',
            'ARTISTIC', 'CORPORATE_ELITE', 'HIGH_SOCIETY',
        ];
        expect(TIER_STANDING).toEqual([...below, 'GLOBAL_ELITE']);
    });
});
