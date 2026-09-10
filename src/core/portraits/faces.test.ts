// src/core/portraits/faces.test.ts
//
// ============================================================================
//  THE PICKER, MEASURED
// ============================================================================
//
//  Three things have to hold, and none of them is obvious from reading the
//  code:
//
//    1. the same person is the same face forever, across reloads,
//    2. the face matches the age that is printed beside it,
//    3. a screen does not show one face twice.
//
//  The third is the one that needs numbers rather than an assertion: with
//  eight faces in a bucket and four people picking independently, a repeat is
//  the USUAL case, not an edge. That is measured here rather than claimed.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    BAND_MID_FROM, BAND_OLD_FROM, BAND_TEEN_FROM, BAND_YOUNG_FROM,
    bandForAge, faceFor, faceHash, facesFor,
    poolSize, type Person,
} from './faces';
import { PORTRAITS } from './registry';

/** Which pool file a source is, for readable failures. */
const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

describe('the pool is the size the batch built', () => {
    // ------------------------------------------------------------------
    //  THE TWO BANDS PARTNERS COME FROM CARRY MORE THAN THE THIRD
    // ------------------------------------------------------------------
    //  This used to say eight everywhere, and eight was chosen to stop a
    //  repeat ON A SCREEN. It never stopped a repeat ACROSS A RUN, and those
    //  are different problems: a director is looked at once a generation,
    //  where a partner is met, refused, met again, and their face is the top
    //  of the whole card. A player dating through one dynasty saw each of
    //  the eight several times.
    //
    //  So the two bands `generatePartner` draws from went to eighteen and
    //  the old band stayed at eight - nobody over fifty is ever offered as a
    //  date, since the generator runs 18 to 45, so that band serves
    //  directors and elders alone.
    //
    //  Forty new files. Stated per band rather than as one number, because
    //  one number is what let the difference between these three bands stay
    //  invisible for as long as it did.
    // ------------------------------------------------------------------
    const EXPECTED: Record<'young' | 'mid' | 'old', number> = {
        young: 18,
        mid: 18,
        old: 8,
    };

    it('three adult bands, two genders, and the partner bands are the deep ones', () => {
        for (const band of ['young', 'mid', 'old'] as const) {
            for (const female of [true, false]) {
                expect(poolSize(band, female)).toBe(EXPECTED[band]);
            }
        }
    });

    it('and the count on disk agrees with what the prompt tool would build', () => {
        // The tool and the registry are two halves of one fact: tools/
        // portrait_prompts.py declares the ids and the registry is built from
        // what was actually drawn. Half a batch leaves them disagreeing, and
        // the symptom is a missing face rather than an error.
        const tool = fs.readFileSync(
            path.join(__dirname, '..', '..', '..', 'tools', 'portrait_prompts.py'),
            'utf8',
        );
        const block = tool.slice(tool.indexOf('FACE_BAND_COUNTS = {'));
        for (const band of ['young', 'mid'] as const) {
            expect(block).toMatch(new RegExp(`'${band}':\\s*${EXPECTED[band]},`));
        }
    });

    it('and ten heirs of each, which nothing read until now', () => {
        expect(poolSize('teen', true)).toBe(10);
        expect(poolSize('teen', false)).toBe(10);
    });

    it('and nothing at all under thirteen, deliberately', () => {
        // No child was ever drawn. The nearest face is a seventeen year old,
        // and a teenager beside the number 8 is worse than initials, which
        // say nothing rather than something false.
        expect(poolSize('child', true)).toBe(0);
        expect(poolSize('child', false)).toBe(0);
    });
});

describe('the band follows the age that will be printed', () => {
    it('at the boundaries, stated as numbers', () => {
        expect(bandForAge(0)).toBe('child');
        expect(bandForAge(BAND_TEEN_FROM - 1)).toBe('child');
        expect(bandForAge(BAND_TEEN_FROM)).toBe('teen');
        expect(bandForAge(BAND_YOUNG_FROM - 1)).toBe('teen');
        expect(bandForAge(BAND_YOUNG_FROM)).toBe('young');
        expect(bandForAge(BAND_MID_FROM - 1)).toBe('young');
        expect(bandForAge(BAND_MID_FROM)).toBe('mid');
        expect(bandForAge(BAND_OLD_FROM - 1)).toBe('mid');
        expect(bandForAge(BAND_OLD_FROM)).toBe('old');
        expect(bandForAge(81)).toBe('old');
    });

    it('and a child born in game gets no face until they are a teenager', () => {
        // Children start at 0, 3, 8 and 16 and gain a year every year, so a
        // family list spans infants and adults at the same time.
        for (let age = 0; age < BAND_TEEN_FROM; age++) {
            expect(faceFor({ id: `kid-${age}`, female: true, age })).toBeNull();
        }
        expect(faceFor({ id: 'kid-13', female: true, age: 13 })).not.toBeNull();
    });

    it('and a missing age does not throw or land at either extreme', () => {
        // 'mid' covers partners, directors and executives alike, so it is the
        // least wrong answer when there is nothing to go on. An 'old' default
        // would put a seventy year old face on every unknown.
        expect(bandForAge(undefined)).toBe('mid');
        expect(bandForAge(NaN)).toBe('mid');
        expect(bandForAge(null)).toBe('mid');
    });

    it('and the face a person gets is in their own band', () => {
        // The whole point: the number is printed next to the picture.
        for (let age = 13; age <= 80; age++) {
            for (const female of [true, false]) {
                const src = faceFor({ id: `p${age}${female}`, female, age });
                const g = female ? 'f' : 'm';
                const band = bandForAge(age);
                // The heirs were generated as their own job and are named
                // heir_f_07 rather than face_teen_f_07.
                expect(nameOf(src)).toMatch(
                    band === 'teen'
                        ? new RegExp(`^heir_${g}_`)
                        : new RegExp(`^face_${band}_${g}_`),
                );
            }
        }
    });
});

describe('a person keeps their face', () => {
    it('across calls, which is across reloads', () => {
        for (let i = 0; i < 200; i++) {
            const p: Person = { id: `partner-${i}`, female: i % 2 === 0, age: 20 + (i % 50) };
            expect(faceFor(p)).toBe(faceFor(p));
        }
    });

    it('and their own portrait always beats a lent one', () => {
        // A magnate who happens to be forty does not become a stranger
        // because a list asked for a face by band.
        const own = faceFor({ id: 'mg_kowalczyk', name: 'Zofia Kowalczyk', female: true, age: 40 });
        expect(nameOf(own)).toBe('zofia_kowalczyk');
    });

    it('and a successor gets a face of their own, not the ancestor one', () => {
        const ancestor = faceFor({ id: 'npc-elena-vance', name: 'Elena Vance' });
        const heir = faceFor({ id: 'npc-elena-vance::g2', name: 'Marcus Vance', female: false, age: 55 });
        expect(nameOf(ancestor)).toBe('npc-elena-vance');
        expect(nameOf(heir)).toMatch(/^face_old_m_/);
        expect(heir).not.toBe(ancestor);
    });

    it('and nothing is guessed when the gender is not known', () => {
        // A coin flip here is a long haired man under a woman's name, half
        // the time, on every generated person. Initials are better than that.
        expect(faceFor({ id: 'someone', age: 30 })).toBeNull();
    });

    it('and nonsense does not throw', () => {
        expect(() => faceFor({ id: '', female: true })).not.toThrow();
        expect(() => faceFor({ id: 'x', female: true, age: -5 })).not.toThrow();
        expect(() => facesFor([])).not.toThrow();
    });
});

describe('the pool is used evenly', () => {
    it('every face of a bucket appears, none of them twice as often', () => {
        // The reason faceHash is FNV-1a and not the seat colour hash: that one
        // folds into 0..359 first, and 360 does not divide evenly enough to
        // stay fair across bucket sizes. Now that `mid` is eighteen and `old`
        // is eight, that is not hypothetical: both are checked.
        for (const [age, band] of [[35, 'mid'], [60, 'old']] as const) {
            const n = poolSize(band, true);
            const draws = n * 1000;
            const counts = new Map<string, number>();
            for (let i = 0; i < draws; i++) {
                const src = faceFor({ id: `person-${band}-${i}`, female: true, age });
                const k = nameOf(src);
                counts.set(k, (counts.get(k) || 0) + 1);
            }
            expect(counts.size).toBe(n);
            const hits = [...counts.values()];
            // Even would be 1000 each. Allow real sampling noise, catch a hash
            // that quietly favours half the pool.
            expect(Math.min(...hits)).toBeGreaterThan(850);
            expect(Math.max(...hits)).toBeLessThan(1150);
        }
    });
});

describe('a screen does not show one face twice', () => {
    it('and the problem is measured, not assumed', () => {
        // ------------------------------------------------------------------
        //  THE FIRST VERSION OF THIS TEST MEASURED THE LUCKY CASE
        // ------------------------------------------------------------------
        //  It built its four ids as r0s0, r0s1, r0s2, r0s3 and got ZERO
        //  collisions in 2000 runs, which made the machinery below look like
        //  it was solving a problem that did not exist.
        //
        //  It is not luck, it is arithmetic: FNV-1a ends with
        //  (h ^ lastChar) * 16777619, the prime is odd, so the bottom three
        //  bits are a bijection of the bottom three bits of the last
        //  character. Ids that differ only in a trailing digit CANNOT land on
        //  the same face. Measured separately, below.
        //
        //  Unrelated ids are the real case, and the rate depends on the size
        //  of the bucket, so it is measured per band against the closed form
        //  1 - n(n-1)(n-2)(n-3)/n^4 rather than against one remembered number.
        //
        //  ------------------------------------------------------------------
        //  AND WIDENING THE PARTNER BANDS IS VISIBLE RIGHT HERE
        //  ------------------------------------------------------------------
        //  Measured over 20,000 draws, before and after the pool went from
        //  eight to eighteen for young and mid:
        //
        //      old    n=8   0.5907   closed form 0.5898
        //      young  n=18  0.3004   closed form 0.3004
        //
        //  So on a screen of four, a repeat went from the usual outcome to
        //  under a third. That is the whole reason forty more faces were
        //  drawn, stated as a number instead of as a feeling.
        // ------------------------------------------------------------------
        for (const [band, age] of [['old', 60], ['young', 25]] as const) {
            const n = poolSize(band, false);
            const closed = 1 - (n * (n - 1) * (n - 2) * (n - 3)) / Math.pow(n, 4);
            let seed = 1;
            const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
            let collided = 0;
            const runs = 4000;
            for (let r = 0; r < runs; r++) {
                const seen = new Set<unknown>();
                let dup = false;
                for (let s = 0; s < 4; s++) {
                    const id = Math.floor(rnd() * 1e9).toString(36);
                    const src = faceFor({ id, female: false, age });
                    if (seen.has(src)) dup = true;
                    seen.add(src);
                }
                if (dup) collided++;
            }
            expect(collided / runs).toBeGreaterThan(closed - 0.04);
            expect(collided / runs).toBeLessThan(closed + 0.04);
        }
        // And the wide bands really are better than the narrow one, which is
        // the claim the forty portraits were drawn to make good on.
        expect(poolSize('young', false)).toBeGreaterThan(poolSize('old', false));
    });

    it('and ids that differ only in a trailing digit never do, in a bucket of eight', () => {
        // ------------------------------------------------------------------
        //  A PROPERTY THAT WAS LOST WHEN THE POOL GREW, ON PURPOSE
        // ------------------------------------------------------------------
        //  FNV-1a ends with (h ^ lastChar) * 16777619. The prime is odd, so
        //  the bottom three bits are a bijection of the bottom three bits of
        //  the last character: ids differing only in a trailing digit CANNOT
        //  collide mod 8. That was a free guarantee for numbered rosters.
        //
        //  It depends on the modulus being a power of two, and eighteen is
        //  not. MEASURED: at n=8, 0 of 2000 groups of four collide; at n=18,
        //  68 of 2000 do, which is 3.4%.
        //
        //  Kept anyway, and the reason is worth writing down rather than
        //  quietly picking sixteen to keep a tidy proof:
        //
        //    the property only ever mattered for `faceFor` called once per
        //    person, and every screen that draws several people calls
        //    `facesFor`, which removes collisions outright at any bucket size
        //    (the test below). The guarantee was a belt behind a brace.
        //
        //    and the brace got much better: 59% to 30% on four unrelated ids,
        //    which is the case that actually happens, since a partner's id is
        //    a random base36 string rather than a number.
        //
        //  So this now checks the band where it still holds, and the loss is
        //  recorded here rather than deleted.
        // ------------------------------------------------------------------
        expect(poolSize('old', true)).toBe(8);
        for (let g = 0; g < 500; g++) {
            const got = [0, 1, 2, 3].map(i =>
                faceFor({ id: `partner-${g * 4 + i}`, female: true, age: 60 }));
            expect(new Set(got).size).toBe(4);
        }
    });

    it('and facesFor removes it entirely, at every screen size up to the pool', () => {
        // ------------------------------------------------------------------
        //  THE IDS HERE HAVE TO BE UNRELATED, AND THE FIRST VERSION WERE NOT
        // ------------------------------------------------------------------
        //  Written first with ids n1r2i3, n1r2i4 - differing in a trailing
        //  digit, which by the bijection above can never collide. Probed by
        //  deleting the no-repeat walk from facesFor entirely: all eighteen
        //  tests stayed green. The test was watching a case the machinery is
        //  not needed for.
        //
        //  Same shape of mistake as the portrait fixtures drawn as flat
        //  ellipses with no outline, when it is the outline that stops a
        //  flood fill. A fixture that cannot fail proves nothing.
        // ------------------------------------------------------------------
        let seed = 7;
        const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
        for (let n = 1; n <= 8; n++) {
            for (let r = 0; r < 300; r++) {
                const people: Person[] = Array.from({ length: n }, () => ({
                    id: Math.floor(rnd() * 1e9).toString(36), female: true, age: 35,
                }));
                const got = [...facesFor(people).values()];
                expect(got).toHaveLength(n);
                expect(new Set(got).size).toBe(n);
            }
        }
    });

    it('and past the pool size it repeats rather than showing a blank', () => {
        // Nine people of one band and gender on one screen. A missing face in
        // a row of faces reads as an error; a repeat reads as a coincidence.
        // Unrelated ids again: nine numbered ones would spread across all
        // eight faces by themselves and prove nothing about the walk.
        let seed = 11;
        const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
        const people: Person[] = Array.from({ length: 9 }, () => ({
            id: Math.floor(rnd() * 1e9).toString(36), female: false, age: 60,
        }));
        const got = [...facesFor(people).values()];
        expect(got).toHaveLength(9);
        expect(got.every(v => v !== null)).toBe(true);
        expect(new Set(got).size).toBe(8);
    });

    it('and people in different bands never take each other faces', () => {
        const people: Person[] = [
            { id: 'a', female: true, age: 22 },
            { id: 'b', female: true, age: 40 },
            { id: 'c', female: true, age: 65 },
            { id: 'd', female: false, age: 22 },
        ];
        const got = facesFor(people);
        expect(nameOf(got.get('a'))).toMatch(/^face_young_f_/);
        expect(nameOf(got.get('b'))).toMatch(/^face_mid_f_/);
        expect(nameOf(got.get('c'))).toMatch(/^face_old_f_/);
        expect(nameOf(got.get('d'))).toMatch(/^face_young_m_/);
    });

    it('and two people who WOULD collide are separated', () => {
        // The direct question, on a pair chosen because they collide rather
        // than hoping a random pair does. Found here rather than written down
        // so it cannot go stale if the hash changes.
        // Against the LIVE bucket size rather than the literal 8 it was
        // written with. When `mid` went to eighteen this searched mod 8, found
        // a pair that agreed there, and then asserted they shared a face in a
        // bucket of eighteen, where they do not. The test was measuring a
        // pool that had stopped existing.
        const n = poolSize('mid', true);
        let a = '';
        let b = '';
        for (let i = 0; i < 5000 && !b; i++) {
            const id = `x${i}${i * 7}`;
            if (!a) { a = id; continue; }
            if (faceHash(id) % n === faceHash(a) % n) b = id;
        }
        expect(b).not.toBe('');
        const alone = [a, b].map(id => faceFor({ id, female: true, age: 40 }));
        expect(alone[0]).toBe(alone[1]);          // apart, they are the same face

        const together = [...facesFor([
            { id: a, female: true, age: 40 },
            { id: b, female: true, age: 40 },
        ]).values()];
        expect(together[0]).not.toBe(together[1]); // together, they are not
        expect(together[0]).toBe(alone[0]);        // and the first one keeps his
    });

    it('and a real portrait in the list is never displaced by the walk', () => {
        const people: Person[] = [
            { id: 'npc-elena-vance', name: 'Elena Vance' },
            { id: 'x1', female: true, age: 40 },
            { id: 'x2', female: true, age: 40 },
        ];
        const got = facesFor(people);
        expect(nameOf(got.get('npc-elena-vance'))).toBe('npc-elena-vance');
        expect(new Set([...got.values()]).size).toBe(3);
    });

    it('and the same list gives the same faces every time', () => {
        // A list that reshuffled on each render would make every screen
        // flicker through four different people.
        const people: Person[] = Array.from({ length: 5 }, (_, i) => ({
            id: `stable-${i}`, female: i % 2 === 0, age: 30 + i,
        }));
        const a = [...facesFor(people).values()];
        const b = [...facesFor(people).values()];
        expect(a).toEqual(b);
    });
});

describe('the hash', () => {
    it('is stable, wide, and not the seat colour hash', () => {
        expect(faceHash('elena')).toBe(faceHash('elena'));
        expect(faceHash('elena')).not.toBe(faceHash('elenb'));
        // Wider than 360, which is what the colour hash folds to.
        const vals = new Set<number>();
        for (let i = 0; i < 5000; i++) vals.add(faceHash(`id-${i}`));
        expect(vals.size).toBeGreaterThan(4900);
        expect(Math.max(...vals)).toBeGreaterThan(1e6);
    });
});
