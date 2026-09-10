// src/core/story/seatFaces.test.ts
//
// ============================================================================
//  THE SECOND AND FOURTH CHIEF FINANCIAL OFFICER WERE THE SAME PHOTOGRAPH
// ============================================================================
//
//  The roster gives eight seats five holders each. They have no portraits on
//  disk, so they take one from the anonymous pool - and the pool picks by
//  hashing an id, and the id being handed to it was the THREAD's. Which is
//  the seat. Which every holder of that seat shares.
//
//  MEASURED, before anything changed. Thirteen collisions across the eight:
//
//      cfo      Ingrid Sollberg  and Mariela Fontana   face_old_f_02
//      coo      Tomasz Wieczorek and Gerhard Muhl      face_old_m_01
//      cto      Sun-woo Baek     and Yohannes Girmay   face_mid_m_08
//      ... and ten more
//
//  Two different people, one face, one seat, two generations apart. Which is
//  the exact thing the generational roster was written to stop.
//
//  So every holder gets an id of their own - `cfo_g2` - and it does two jobs:
//  the pool hashes it, so two holders cannot land on one face; and it is the
//  filename a DRAWN portrait goes under, so the thirty two stop being pool
//  faces the moment the art exists.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    CAST_GENERATIONS,
    GENERATIONS_WRITTEN,
    seatPortraitId,
} from '../../data/story/castGenerations';
import { castNow } from './castNow';
import { seatFace, poolFace } from '../portraits/faces';
import { PORTRAITS } from '../portraits/registry';

const fileOf = (src: unknown) =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? '';

const SEATS = Object.keys(CAST_GENERATIONS);

const faceOf = (seat: string, g: number) => {
    const who = castNow(seat, g)!;
    return fileOf(seatFace({
        id: seat,
        name: who.name,
        female: who.gender === 'female',
        age: who.age,
        portraitId: who.portraitId,
    }));
};

describe('no two holders of a seat wear one face', () => {
    it('not in any of the eight', () => {
        const clashes: string[] = [];
        for (const seat of SEATS) {
            const seen = new Map<string, string>();
            for (let g = 2; g <= GENERATIONS_WRITTEN; g++) {
                const face = faceOf(seat, g);
                const who = castNow(seat, g)!.name;
                if (seen.has(face)) clashes.push(`${seat}: ${seen.get(face)} and ${who}`);
                seen.set(face, who);
            }
        }
        expect(clashes).toEqual([]);
    });

    it('and the old way really did collide, or this test proves nothing', () => {
        // ------------------------------------------------------------------
        //  THE CONTROL
        // ------------------------------------------------------------------
        //  Hashing the SEAT is what the code used to do. If that no longer
        //  produces a collision the fixture has drifted and the test above
        //  is passing for a reason nobody chose.
        // ------------------------------------------------------------------
        const bySeat = (seat: string, g: number) => {
            const who = castNow(seat, g)!;
            return fileOf(poolFace({
                id: seat, name: who.name,
                female: who.gender === 'female', age: who.age,
            }));
        };
        const collisions = SEATS.filter(seat => {
            const seen = new Set<string>();
            for (let g = 2; g <= GENERATIONS_WRITTEN; g++) {
                const f = bySeat(seat, g);
                if (seen.has(f)) return true;
                seen.add(f);
            }
            return false;
        });
        expect(collisions.length).toBeGreaterThan(4);
    });

    it('and every holder has an id nobody else has', () => {
        const ids = SEATS.flatMap(seat =>
            Array.from({ length: GENERATIONS_WRITTEN }, (_, i) => seatPortraitId(seat, i + 1)));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('and it is the seat and the generation, so a file can be named for it', () => {
        expect(seatPortraitId('cfo', 2)).toBe('cfo_g2');
        expect(seatPortraitId('swanson', 5)).toBe('swanson_g5');
        // A nonsense generation still produces a usable id rather than NaN.
        expect(seatPortraitId('cfo', 0)).toBe('cfo_g1');
        expect(seatPortraitId('cfo', undefined as never)).toBe('cfo_g1');
    });
});

describe('and a drawn portrait wins over the pool', () => {
    it('generation one already proves it: they have files and use them', () => {
        for (const seat of SEATS) {
            expect(castNow(seat, 1)!.portraitId).toBeUndefined();
            // No portraitId means the screens never call seatFace at all -
            // they pass undefined to Portrait, which looks the seat up.
            expect(castNow(seat, 1)!.gender).toBeUndefined();
        }
    });

    it('and seatFace prefers the drawn file when there is one', () => {
        // ------------------------------------------------------------------
        //  THE ART LANDED, AND THIS TEST CHANGED SIDES
        // ------------------------------------------------------------------
        //  It used to assert that cfo_g2 fell through to the pool, which was
        //  true only because nothing had been drawn for it yet. Thirty two
        //  seat portraits are on disk now, so the fallback is no longer the
        //  answer for these ids and asserting it would be a test agreeing
        //  with a folder that has moved on.
        //
        //  What is worth holding is the ORDER: an own file beats the pool.
        // ------------------------------------------------------------------
        const drawn = fileOf(seatFace({
            id: 'anything', name: 'Anything', female: true, age: 50,
            portraitId: 'cfo',
        }));
        expect(drawn).toBe('cfo');

        // And the second holder now has one of their own, keyed on the
        // portrait id rather than the seat. Not `cfo`, or the fourth Hale
        // would be looking at Arthur Vance again.
        const secondHolder = fileOf(seatFace({
            id: 'cfo', name: 'Ingrid Sollberg', female: true, age: 54,
            portraitId: 'cfo_g2',
        }));
        expect(secondHolder).toBe('cfo_g2');
    });

    it('and the pool is still there for a holder nobody has drawn', () => {
        // The fallback has to keep working: GENERATIONS_WRITTEN can grow, or
        // a seat can be added, faster than the art does. A missing file must
        // produce a face rather than a blank circle.
        const undrawn = fileOf(seatFace({
            id: 'cfo', name: 'Somebody Later', female: true, age: 54,
            portraitId: 'cfo_g99',
        }));
        expect(undrawn).toMatch(/^face_/);
    });
});

describe('and the tool can draw them', () => {
    const tool = (f: string) =>
        fs.readFileSync(path.join(__dirname, '..', '..', '..', 'tools', f), 'utf8');

    it('the prompt script reads the roster rather than a second copy of it', () => {
        const src = tool('portrait_prompts.py');
        expect(src).toContain('def read_generations');
        expect(src).toContain('castGenerations.ts');
    });

    it('and takes their sex from the data, not from the hand written list', () => {
        // ------------------------------------------------------------------
        //  A SECOND LIST IS A SECOND CHANCE TO BE WRONG
        // ------------------------------------------------------------------
        //  Everybody else in that file is sexed by a hand written FEMALE set,
        //  which is how a woman added to the game gets drawn as a man - the
        //  failure the poker roster had. These carry their own gender, so the
        //  two cannot disagree.
        // ------------------------------------------------------------------
        const src = tool('portrait_prompts.py');
        // Inside is_female itself, not merely somewhere in the file.
        const body = /def is_female[\s\S]*?\n\n\ndef /.exec(src)?.[0] ?? '';
        expect(body).toContain('read_generations()');
        expect(body).toContain('seats[cast_id][1]');
    });

    it('and the batch has a switch that names exactly the thirty two', () => {
        const src = tool('batch_portraits.py');
        expect(src).toContain("'--seats'");
        expect(src).toContain('PP.read_generations()');
    });

    it('and there are thirty two of them, which is what the switch is for', () => {
        const count = SEATS.length * (GENERATIONS_WRITTEN - 1);
        expect(count).toBe(32);
    });
});
