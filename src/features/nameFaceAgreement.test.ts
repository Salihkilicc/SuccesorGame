// src/features/nameFaceAgreement.test.ts
//
// ============================================================================
//  THE NAME, THE GENDER AND THE PHOTOGRAPH ARE ONE PERSON
// ============================================================================
//
//  Reported as "pokerde veya date de bakinca foto erkek isim kiz gibi
//  ornekler var". Audited every surface that prints a name beside a face,
//  because there are three places the three facts can disagree and each one
//  fails differently:
//
//    1. THE NAME AGAINST THE GENDER FIELD. This is what was broken: the
//       dating pool rolled a gender with a coin and then took the name off a
//       list with no men on it. Fixed in love/data/nameData.ts.
//
//    2. THE GENDER FIELD AGAINST THE FACE. Every surface passes `female:` to
//       faceFor, and the pool file name carries f or m, so the two can be
//       compared directly. That is most of this file.
//
//    3. THE NAME AGAINST THE DRAWN PORTRAIT, for the 214 people who have a
//       photograph of their own. Not checkable from code - the answer is in
//       the picture - so it was done by eye, twice, off contact sheets of all
//       214 and all 68 pool faces. Every one agreed. What IS checkable is
//       that the roster and the FEMALE list in tools/portrait_prompts.py
//       still cover each other, which is what would break if somebody added
//       a name to the game and not to the prompt script: the new woman would
//       come back drawn as a man. That is the last test here.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { NAME_DATABASE } from './love/data/nameData';
import { NAMES_FEMALE, NAMES_MALE, generateCandidate } from './life/components/hookupData';
import { SUCCESSOR_NAMES, succeedBoard } from '../core/story/boardSuccession';
import { faceFor } from '../core/portraits/faces';
import { PORTRAITS } from '../core/portraits/registry';
import { generatePartner } from './love/logic/partnerGenerator';
import { useIdentityStore } from '../core/store/useIdentityStore';
import type { Ethnicity } from '../data/relationshipTypes';

/** Which file a face came out of, so the f or m in its name can be read. */
const fileOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? '';

/**
 * What a first name says about a person.
 *
 * Built from the lists the game itself draws from, rather than from a
 * general-purpose gender dictionary. That is the point: a name the game
 * hands out is one the game has already committed to a gender for, so any
 * disagreement is between two of its own tables and is a real bug rather
 * than a judgement call about whether Andrea is Italian.
 */
const ORACLE = new Map<string, 'male' | 'female'>();
for (const e of Object.keys(NAME_DATABASE) as Ethnicity[]) {
    for (const n of NAME_DATABASE[e].first) ORACLE.set(n, 'female');
    for (const n of NAME_DATABASE[e].firstMale) ORACLE.set(n, 'male');
}
for (const n of NAMES_FEMALE) ORACLE.set(n, 'female');
for (const n of NAMES_MALE) ORACLE.set(n, 'male');
for (const s of SUCCESSOR_NAMES) ORACLE.set(s.first, s.gender);

/** What the FILE says, or '' when the face is somebody's own portrait. */
const faceGender = (file: string): '' | 'male' | 'female' => {
    const m = /^(?:face_(?:young|mid|old)|heir)_([fm])_/.exec(file);
    return m ? (m[1] === 'f' ? 'female' : 'male') : '';
};

/** Everybody whose name and face can both be read, and who disagrees. */
const disagreements = (people: { name: string; face: unknown }[]) => {
    let checked = 0;
    const wrong: string[] = [];
    for (const p of people) {
        const face = faceGender(fileOf(p.face));
        const said = ORACLE.get(p.name.split(' ')[0]);
        if (!face || !said) continue;
        checked++;
        if (face !== said) wrong.push(`${p.name} reads ${said}, was given ${fileOf(p.face)}`);
    }
    return { checked, wrong: [...new Set(wrong)] };
};

describe('nobody is handed the other gender face', () => {
    afterEach(() => useIdentityStore.setState({ gender: 'male' } as never));

    it('not on the dating card', () => {
        useIdentityStore.setState({ gender: 'female' } as never);
        const { checked, wrong } = disagreements(
            Array.from({ length: 400 }, () => generatePartner()).map(p => ({
                name: p.name,
                face: faceFor({
                    id: p.id, name: p.name,
                    female: p.gender === 'female', age: p.stats.age,
                }),
            })),
        );
        // The count matters as much as the result: a sweep that checks
        // nothing passes just as loudly as one that checks everything.
        expect(checked).toBeGreaterThan(300);
        expect(wrong).toEqual([]);
    });

    it('not on the night out card', () => {
        const { checked, wrong } = disagreements(
            Array.from({ length: 400 }, () => generateCandidate()).map(c => ({
                name: c.name,
                face: faceFor({
                    id: c.id, name: c.name,
                    female: c.gender === 'female', age: c.age,
                }),
            })),
        );
        expect(checked).toBeGreaterThan(300);
        expect(wrong).toEqual([]);
    });

    it('and not in the board room, four generations down', () => {
        // The failure this one exists for: a seat keeps its surname and takes
        // a new first name, so Helena Vance can inherit Marcus Vance's chair.
        // Name and face both come off `successorNameFor`, and if they ever
        // stop doing so this is where it shows.
        let board = [
            { id: 'npc-elena-vance', name: 'Elena Vance', gender: 'female' as const, age: 54 },
            { id: 'npc-marcus-wolf', name: 'Marcus Wolf', gender: 'male' as const, age: 61 },
            { id: 'npc-sarah-jen', name: 'Sarah Jen', gender: 'female' as const, age: 47 },
            { id: 'npc-victor-k', name: 'Victor K.', gender: 'male' as const, age: 58 },
        ];
        const seen: { name: string; face: unknown }[] = [];
        for (let g = 2; g <= 5; g++) {
            board = succeedBoard(board as never, g) as never;
            for (const m of board) {
                seen.push({
                    name: m.name,
                    face: faceFor({
                        id: m.id, name: m.name,
                        female: m.gender === 'female', age: m.age,
                    }),
                });
            }
        }
        const { checked, wrong } = disagreements(seen);
        expect(checked).toBe(16);
        expect(wrong).toEqual([]);
    });
});

describe('and the drawing agrees with the name it was drawn for', () => {
    // ------------------------------------------------------------------
    //  THE ONE THING A TEST CANNOT LOOK AT
    // ------------------------------------------------------------------
    //  Whether a picture shows a woman is a question about pixels. All 214
    //  named portraits and all 68 pool faces were checked by eye off contact
    //  sheets and every one agreed with its name.
    //
    //  What a test CAN hold is the thing that would silently undo that: the
    //  prompt script decides who is drawn as a woman from a hand-written
    //  FEMALE list, and it reads the roster OUT of the app. So adding a
    //  woman to the game without adding her to that list gives her a man's
    //  portrait, quietly, the next time the art is regenerated.
    // ------------------------------------------------------------------
    const prompts = fs.readFileSync(
        path.join(__dirname, '..', '..', 'tools', 'portrait_prompts.py'), 'utf8');

    const FEMALE_IN_PROMPTS: Set<string> = (() => {
        const block = /FEMALE = \{([\s\S]*?)\n\}/.exec(prompts)?.[1] ?? '';
        return new Set([...block.matchAll(/'([^']+)'/g)].map(m => m[1]));
    })();

    it('the prompt script still has a female list, and it is not empty', () => {
        // If this regex ever stops matching, every test below passes for the
        // wrong reason. Checked first and on purpose.
        expect(FEMALE_IN_PROMPTS.size).toBeGreaterThan(90);
    });

    it('and every woman on it has a portrait on disk', () => {
        const files = new Set(Object.keys(PORTRAITS).map(k =>
            k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')));
        const missing = [...FEMALE_IN_PROMPTS].filter(n =>
            !files.has(n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')));
        expect(missing).toEqual([]);
    });

    it('and a generated partner who lands on one of those portraits is the right gender', () => {
        // Seven of the 10,160 name combinations the generator can produce
        // collide with a drawn cast member, and `portraitForPerson` hands
        // over that portrait rather than a pool face. Harmless while the
        // genders agree; a man's photograph under a woman's name if they
        // ever stop.
        const norm = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const files = new Set(Object.keys(PORTRAITS).map(norm));
        const collisions: string[] = [];
        for (const e of Object.keys(NAME_DATABASE) as Ethnicity[]) {
            const set = NAME_DATABASE[e];
            for (const [list, gender] of [
                [set.first, 'female'], [set.firstMale, 'male'],
            ] as [string[], 'male' | 'female'][]) {
                for (const f of list) {
                    for (const l of set.last) {
                        const full = `${f} ${l}`;
                        if (!files.has(norm(full))) continue;
                        const drawn = FEMALE_IN_PROMPTS.has(full) ? 'female' : 'male';
                        if (drawn !== gender) collisions.push(`${full}: ${gender} name, drawn ${drawn}`);
                    }
                }
            }
        }
        expect(collisions).toEqual([]);
    });
});
