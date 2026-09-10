// src/core/story/generationFaces.test.ts
//
// ============================================================================
//  DOES ANY OF THIS STILL WORK THREE GENERATIONS IN
// ============================================================================
//
//  Asked as a check rather than a change: does a female player get the female
//  portrait, do the heirs really vary, and do the board's faces change when
//  the board does. Measured rather than reasoned about, and one of the three
//  was broken.
//
//  THE BOARD WENT BLANK. Four portraits in the first generation and NONE in
//  the second, third or fourth. A successor correctly misses their ancestor's
//  file - they are a different person with a different first name - and the
//  pool could not lend them a face because BoardMember carried no gender, and
//  the pool refuses to guess one.
//
//  This file is the measurement, kept.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    SUCCESSOR_FIRST_NAMES, SUCCESSOR_NAMES,
    heirGenderFor, heirNameFor, succeedBoard,
} from './boardSuccession';
import { portraitFor, portraitForPerson } from '../portraits';
import { faceFor, facesFor, bandForAge } from '../portraits/faces';
import { PORTRAITS } from '../portraits/registry';

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? 'NONE';

/** What a board screen shows for this director: their own file, or a lent one. */
const faceOf = (m: {
    id: string; name: string; gender?: 'male' | 'female'; age?: number;
}): string => nameOf(
    portraitForPerson(m.id, m.name) ?? faceFor({
        id: m.id,
        name: m.name,
        female: m.gender === undefined ? undefined : m.gender === 'female',
        age: m.age,
    }),
);

const FOUNDING = [
    { id: 'npc-marcus-wolf', name: "Marcus 'The Wolf'", shareCount: 1_000_000, trait: 'Shark', trust: 50, isHostile: false, origin: 'DebtShark' },
    { id: 'npc-elena-vance', name: 'Elena Vance', shareCount: 1_400_000, trait: 'Visionary', trust: 50, isHostile: false, origin: 'VC' },
    { id: 'npc-victor-k', name: 'Victor K.', shareCount: 1_100_000, trait: 'Bureaucrat', trust: 50, isHostile: false, origin: 'VC' },
    { id: 'npc-sarah-jen', name: 'Sarah Jen', shareCount: 900_000, trait: 'Technocrat', trust: 50, isHostile: false, origin: 'VC' },
] as never[];

describe('the player is drawn the way they were chosen', () => {
    it('two files, one each, and they are different pictures', () => {
        expect(portraitFor('player_male')).not.toBeNull();
        expect(portraitFor('player_female')).not.toBeNull();
        expect(portraitFor('player_female')).not.toBe(portraitFor('player_male'));
    });
});

describe('the board keeps its faces down the generations', () => {
    it('the founders have their own portraits', () => {
        const faces = FOUNDING.map(faceOf);
        expect(faces).toEqual([
            'npc-marcus-wolf', 'npc-elena-vance', 'npc-victor-k', 'npc-sarah-jen',
        ]);
    });

    it('and every generation after them has four faces, not zero', () => {
        // The measurement that started this. Before the fix: 4, 0, 0, 0.
        let board = FOUNDING;
        for (let g = 2; g <= 6; g++) {
            board = succeedBoard(board, g);
            const faces = board.map(faceOf);
            expect(faces).toHaveLength(4);
            expect(faces.filter(f => f === 'NONE')).toEqual([]);
        }
    });

    it('and no two directors on one board wear the same one', () => {
        // ------------------------------------------------------------------
        //  THIS WAS PASSING ON LUCK, AND WIDENING THE POOL SAID SO
        // ------------------------------------------------------------------
        //  It asked `faceFor` once per director, which is what BoardRoomModal
        //  did, and `faceFor` answers one person at a time - it cannot know
        //  that the director above already took that face. With eight faces
        //  in a bucket and four directors, a collision is roughly a coin
        //  flip; these four ids happened not to collide, so the test was
        //  green and the guarantee did not exist.
        //
        //  Adding forty portraits reshuffled which ids land where, and
        //  generation two came back with THREE faces on a board of four. Not
        //  a regression from the portraits: the portraits uncovered it.
        //
        //  `facesFor` is the function that actually guarantees this, and
        //  BoardRoomModal calls it now. So does this, because a test of a
        //  screen has to ask the screen's question.
        // ------------------------------------------------------------------
        let board = FOUNDING;
        for (let g = 2; g <= 6; g++) {
            board = succeedBoard(board, g);
            const drawn = facesFor(board.map((m: any) => ({
                id: m.id,
                name: m.name,
                female: m.gender === undefined ? undefined : m.gender === 'female',
                age: m.age,
            })));
            const faces = [...drawn.values()].map(nameOf);
            expect(faces).toHaveLength(4);
            expect(faces.filter(f => f === 'NONE')).toEqual([]);
            expect(new Set(faces).size).toBe(4);
        }
    });

    it('and the board screen is the one that asks for the whole list at once', () => {
        // The wiring half. A screen that goes back to asking one at a time
        // loses the guarantee above silently, and the symptom is two
        // directors in one photograph rather than an error.
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', 'components', 'MyCompany', 'Shares', 'BoardRoomModal.tsx'),
            'utf8',
        );
        expect(src).toMatch(/facesFor\(members\.map/);
        expect(src).toMatch(/boardFaces\.get\(m\.id\)/);
        expect(src).not.toMatch(/source=\{faceFor\(/);
    });

    it('and the face changes when the person does', () => {
        // A generation that inherited the previous one's faces would say the
        // heir and the ancestor are the same man.
        const g2 = succeedBoard(FOUNDING, 2);
        const g3 = succeedBoard(g2, 3);
        expect(g2.map(faceOf)).not.toEqual(FOUNDING.map(faceOf));
        expect(g3.map(faceOf)).not.toEqual(g2.map(faceOf));
    });

    it('and Helena is never handed a man', () => {
        // ------------------------------------------------------------------
        //  THE FIRST VERSION OF THIS CHECKED THE WRONG TWO THINGS
        // ------------------------------------------------------------------
        //  It compared the face against the member's OWN gender field, which
        //  is internally consistent whatever that field says. Probed by
        //  forcing heirGenderFor to return 'male' for everybody: all twelve
        //  tests stayed green while every Helena, Nadia and Tessa on the
        //  board wore a man's face.
        //
        //  The thing that has to hold is that the face matches the NAME the
        //  player reads. So the first name is looked up in the pool and the
        //  face is checked against THAT.
        // ------------------------------------------------------------------
        const genderOfName = (first: string) =>
            SUCCESSOR_NAMES.find(n => n.first === first)?.gender;

        let board = FOUNDING;
        for (let g = 2; g <= 8; g++) {
            board = succeedBoard(board, g);
            for (const m of board as unknown as { name: string }[]) {
                const byName = genderOfName(m.name.split(' ')[0]);
                expect(byName).toBeDefined();
                expect(faceOf(m as never)).toContain(byName === 'female' ? '_f_' : '_m_');
            }
        }
    });

    it('and the gender comes from the same draw as the name', () => {
        // One index, one truth. Two lists would disagree the first time
        // either was edited.
        for (const seat of FOUNDING as unknown as { id: string; name: string }[]) {
            for (let g = 2; g <= 10; g++) {
                const first = heirNameFor(seat as never, g).split(' ')[0];
                const idx = SUCCESSOR_FIRST_NAMES.indexOf(first);
                expect(idx).toBeGreaterThanOrEqual(0);
                expect(heirGenderFor(seat as never, g)).toMatch(/^(male|female)$/);
            }
        }
    });

    it('and a reload does not reshuffle the board', () => {
        // Deterministic on the id and the generation, like the names.
        expect(succeedBoard(FOUNDING, 4).map(faceOf))
            .toEqual(succeedBoard(FOUNDING, 4).map(faceOf));
    });

    it('and directors read as adults, never as teenagers', () => {
        let board = FOUNDING;
        for (let g = 2; g <= 8; g++) {
            board = succeedBoard(board, g);
            for (const m of board as unknown as { age: number }[]) {
                expect(bandForAge(m.age)).toMatch(/^(mid|old)$/);
            }
        }
    });

    it('and the board is not all one age', () => {
        // A board where every inherited seat looks forty is duller than one
        // with some grey in it, which is the only reason an age is carried.
        let board = FOUNDING;
        const bands = new Set<string>();
        for (let g = 2; g <= 6; g++) {
            board = succeedBoard(board, g);
            for (const m of board as unknown as { age: number }[]) {
                bands.add(bandForAge(m.age));
            }
        }
        expect(bands.size).toBeGreaterThan(1);
    });
});

describe('the heirs vary, which is what the pool is for', () => {
    it('five siblings of one band and gender are five different faces', () => {
        // Unrelated ids: ones differing in a trailing digit cannot collide
        // and would prove nothing.
        const ids = ['qz7', 'm4k', 'vv2', 'p9x', 'ha3'];
        for (const [age, want] of [[15, /^heir_/], [25, /^face_young_/], [45, /^face_mid_/]] as const) {
            for (const female of [true, false]) {
                const faces = ids.map(id => nameOf(faceFor({ id, female, age })));
                for (const f of faces) expect(f).toMatch(want);
                // Four or five distinct out of five. Eight in a bucket means
                // a repeat is normal when drawn independently - which is why
                // the family list draws the whole screen at once instead.
                expect(new Set(faces).size).toBeGreaterThanOrEqual(4);
            }
        }
    });

    it('and a teenage heir is drawn from the heir pool, not the adult one', () => {
        expect(nameOf(faceFor({ id: 'kid', female: true, age: 16 }))).toMatch(/^heir_f_/);
        expect(nameOf(faceFor({ id: 'kid', female: false, age: 16 }))).toMatch(/^heir_m_/);
    });
});
