// src/core/story/castNow.test.ts
//
// ============================================================================
//  BY THE FIFTH HALE, ARTHUR VANCE WOULD HAVE BEEN A HUNDRED AND FORTY
// ============================================================================
//
//  The board already turned over: `succeedBoard` gives every director a new
//  name, a new face and a new age each generation. Nothing else did. The
//  three executives, the friend and the four rival heads were written once in
//  data/story/cast.ts and sat there forever, so a dynasty five generations
//  deep was still being written to by the founder's chief financial officer -
//  a man whose own tone line says he "has outlived four CEOs", which stopped
//  being a joke somewhere around generation three.
//
//  ---------------------------------------------------------------------------
//  WHAT IS BEING TESTED IS MOSTLY THAT NOTHING ELSE MOVED
//  ---------------------------------------------------------------------------
//  Generation one has to be byte for byte the game it was: those people have
//  portraits drawn for them, the scenes are written for them, and a founder's
//  run that changed is a regression however good the new names are.
// ============================================================================

import { CAST } from '../../data/story/cast';
import {
    CAST_GENERATIONS,
    GENERATIONS_WRITTEN,
} from '../../data/story/castGenerations';
import { castNow, nameNow, rosterIndexFor } from './castNow';

const SEATS = Object.keys(CAST_GENERATIONS);

describe('generation one is exactly the game it always was', () => {
    it('every seat holds the person the cast file names', () => {
        for (const id of SEATS) {
            expect({ id, name: nameNow(id, 1) }).toEqual({ id, name: CAST[id].name });
        }
    });

    it('and the object handed back is the cast entry itself, untouched', () => {
        // ------------------------------------------------------------------
        //  IDENTITY, NOT EQUALITY
        // ------------------------------------------------------------------
        //  Rebuilding it would work and would also quietly add `gender` and
        //  `age`, which is how the founder's chief financial officer would
        //  stop finding his own photograph and start taking a pool face.
        // ------------------------------------------------------------------
        for (const id of SEATS) {
            expect(castNow(id, 1)).toBe(CAST[id]);
            expect(castNow(id, 1)!.gender).toBeUndefined();
        }
    });

    it('and a roster that disagreed with the cast file would be caught here', () => {
        for (const id of SEATS) {
            expect({ id, first: CAST_GENERATIONS[id][0].name })
                .toEqual({ id, first: CAST[id].name });
        }
    });
});

describe('and every generation after gets somebody else', () => {
    it('nobody holds a seat twice in the five that are written', () => {
        for (const id of SEATS) {
            const held = Array.from({ length: GENERATIONS_WRITTEN }, (_, i) => nameNow(id, i + 1));
            expect({ id, unique: new Set(held).size }).toEqual({ id, unique: GENERATIONS_WRITTEN });
        }
    });

    it('and nobody holds two different seats', () => {
        // A name appearing as both the chief financial officer and the friend
        // is one person living two lives, which reads as a bug rather than a
        // coincidence.
        const everyone = SEATS.flatMap(id => CAST_GENERATIONS[id].map(h => h.name));
        expect(new Set(everyone).size).toBe(everyone.length);
    });

    it('and each of them carries enough to be drawn', () => {
        // No portrait exists for anybody after generation one and none ever
        // can, so they take a pool face and the pool needs both.
        for (const id of SEATS) {
            for (let g = 2; g <= GENERATIONS_WRITTEN; g++) {
                const who = castNow(id, g)!;
                expect({ id, g, gender: who.gender === 'male' || who.gender === 'female' })
                    .toEqual({ id, g, gender: true });
                expect({ id, g, aged: (who.age ?? 0) > 25 }).toEqual({ id, g, aged: true });
            }
        }
    });

    it('and keeps the seat, which is what the scenes are written for', () => {
        // The role and the tone never move. A chief financial officer who
        // stopped giving the board position first would need every one of
        // his scenes rewritten.
        for (const id of SEATS) {
            for (let g = 1; g <= 8; g++) {
                const who = castNow(id, g)!;
                expect({ id, g, role: who.role }).toEqual({ id, g, role: CAST[id].role });
                expect({ id, g, tone: who.tone }).toEqual({ id, g, tone: CAST[id].tone });
                expect({ id, g, ch: who.channels }).toEqual({ id, g, ch: CAST[id].channels });
            }
        }
    });
});

describe('and the sixth generation comes round rather than going blank', () => {
    it('it loops, and never back to the founder', () => {
        // ------------------------------------------------------------------
        //  WHY NOT BACK TO ONE
        // ------------------------------------------------------------------
        //  Bringing the founder's own chief financial officer back would read
        //  as the bug this file fixes rather than as a nice touch, and he has
        //  a photograph on disk that the sixth generation would then wear.
        // ------------------------------------------------------------------
        for (let g = GENERATIONS_WRITTEN + 1; g <= GENERATIONS_WRITTEN + 12; g++) {
            expect({ g, i: rosterIndexFor(g) > 0 }).toEqual({ g, i: true });
            for (const id of SEATS) {
                expect({ g, id, name: nameNow(id, g) })
                    .not.toEqual({ g, id, name: CAST[id].name });
            }
        }
    });

    it('and it never runs off the end of the table', () => {
        for (let g = 1; g <= 200; g++) {
            const i = rosterIndexFor(g);
            expect({ g, inRange: i >= 0 && i < GENERATIONS_WRITTEN }).toEqual({ g, inRange: true });
        }
    });

    it('and a nonsense generation still answers with somebody', () => {
        // Saves written before `generation` existed, and a rehydrate that
        // hands back undefined. The last screen of a run is no place to throw.
        for (const g of [0, -3, NaN, undefined as never, 1.7]) {
            expect(nameNow('cfo', g)).toBeTruthy();
        }
    });
});

describe('and the people who do not change are left alone', () => {
    it('the institutions and the placeholders have no roster', () => {
        for (const id of ['vulture', 'unknown', 'regulator', 'fbi', 'hacker', 'heir']) {
            expect({ id, rostered: id in CAST_GENERATIONS }).toEqual({ id, rostered: false });
            expect({ id, name: nameNow(id, 4) }).toEqual({ id, name: CAST[id].name });
        }
    });

    it('and so are the father and the brother, who belong to the first game', () => {
        // The father dies in the script and the brother is the founding
        // sibling. A later generation's siblings are real generated children
        // and `succeedBoard` already seats them.
        for (const id of ['father', 'brother']) {
            expect({ id, rostered: id in CAST_GENERATIONS }).toEqual({ id, rostered: false });
            expect(castNow(id, 5)).toBe(CAST[id]);
        }
    });

    it('and an id that is not in the cast at all comes back empty', () => {
        expect(castNow('nobody', 3)).toBeUndefined();
        expect(nameNow('nobody', 3)).toBe('nobody');
    });
});
