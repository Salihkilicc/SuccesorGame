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

import {
    BAND_MID_FROM, BAND_OLD_FROM, bandForAge, faceFor, faceHash, facesFor,
    poolSize, type Person,
} from './faces';
import { PORTRAITS } from './registry';

/** Which pool file a source is, for readable failures. */
const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

describe('the pool is the size the batch built', () => {
    it('three bands, two genders, eight each', () => {
        for (const band of ['young', 'mid', 'old'] as const) {
            for (const female of [true, false]) {
                expect(poolSize(band, female)).toBe(8);
            }
        }
    });
});

describe('the band follows the age that will be printed', () => {
    it('at the boundaries, stated as numbers', () => {
        expect(bandForAge(18)).toBe('young');
        expect(bandForAge(BAND_MID_FROM - 1)).toBe('young');
        expect(bandForAge(BAND_MID_FROM)).toBe('mid');
        expect(bandForAge(BAND_OLD_FROM - 1)).toBe('mid');
        expect(bandForAge(BAND_OLD_FROM)).toBe('old');
        expect(bandForAge(81)).toBe('old');
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
        for (let age = 18; age <= 80; age++) {
            for (const female of [true, false]) {
                const src = faceFor({ id: `p${age}${female}`, female, age });
                expect(nameOf(src)).toMatch(
                    new RegExp(`^face_${bandForAge(age)}_${female ? 'f' : 'm'}_`),
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
    it('all eight faces of a bucket appear, none of them twice as often', () => {
        // The reason faceHash is FNV-1a and not the seat colour hash: that one
        // folds into 0..359 first, and 360 does not divide by 8 evenly enough
        // to stay fair once other bucket sizes are used.
        const counts = new Map<string, number>();
        for (let i = 0; i < 8000; i++) {
            const src = faceFor({ id: `person-${i}`, female: true, age: 35 });
            const k = nameOf(src);
            counts.set(k, (counts.get(k) || 0) + 1);
        }
        expect(counts.size).toBe(8);
        const hits = [...counts.values()];
        const lo = Math.min(...hits);
        const hi = Math.max(...hits);
        // Even would be 1000 each. Allow real sampling noise, catch a hash
        // that quietly favours half the pool.
        expect(lo).toBeGreaterThan(850);
        expect(hi).toBeLessThan(1150);
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
        //  Unrelated ids are the real case. Measured at 0.5907 over 20,000
        //  draws against a closed form of 1 - (8*7*6*5)/8^4 = 0.5898. So on a
        //  screen of four generated people, a repeat is the usual outcome,
        //  not an edge.
        // ------------------------------------------------------------------
        let seed = 1;
        const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
        let collided = 0;
        const runs = 4000;
        for (let r = 0; r < runs; r++) {
            const seen = new Set<unknown>();
            let dup = false;
            for (let s = 0; s < 4; s++) {
                const id = Math.floor(rnd() * 1e9).toString(36);
                const src = faceFor({ id, female: false, age: 35 });
                if (seen.has(src)) dup = true;
                seen.add(src);
            }
            if (dup) collided++;
        }
        expect(collided / runs).toBeGreaterThan(0.53);
        expect(collided / runs).toBeLessThan(0.65);
    });

    it('though ids that differ only in a trailing digit never do', () => {
        // The bijection described above, asserted so that a future change of
        // hash cannot quietly remove it. It is worth keeping: a great many
        // generated rosters are numbered rather than named, and those screens
        // are collision free before facesFor is even called.
        for (let g = 0; g < 500; g++) {
            const got = [0, 1, 2, 3].map(i =>
                faceFor({ id: `partner-${g * 4 + i}`, female: true, age: 25 }));
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
        let a = '';
        let b = '';
        for (let i = 0; i < 5000 && !b; i++) {
            const id = `x${i}${i * 7}`;
            if (!a) { a = id; continue; }
            if (faceHash(id) % 8 === faceHash(a) % 8) b = id;
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
