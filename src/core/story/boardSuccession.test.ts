// src/core/story/boardSuccession.test.ts
//
// ============================================================================
//  THE BOARD HAS CHILDREN TOO
// ============================================================================
//
//  When the founder died the player became their own child and the siblings
//  arrived on the register. Everybody else stayed exactly as they were - Elena
//  Vance, Victor K. and Sarah Jen in the same chairs with the same names and
//  the same grudges, for as long as the dynasty lasted.
//
//  The rules that matter here are the ones about what must NOT happen, because
//  a generational turnover has two obvious ways to go wrong and both of them
//  destroy the game rather than annoying somebody:
//
//      the seats multiply   -> the board doubles every generation and the
//                              player is outvoted by cousins
//      the shares drift     -> the cap table stops adding up and every
//                              ownership percentage in the game is wrong
// ============================================================================

import {
    succeedBoard,
    heirNameFor,
    surnameOf,
    SUCCESSOR_TRUST,
    SUCCESSOR_FIRST_NAMES,
    type SucceedableMember,
} from './boardSuccession';

const board = (): SucceedableMember[] => [
    {
        id: 'npc-elena-vance', name: 'Elena Vance', shareCount: 1_400_000,
        trait: 'Conservative', trust: 65, relationship: 70, isHostile: false,
        origin: 'Founder', motivation: 'legacy', petIssue: 'debt',
        gestureCount: 4, fatigue: { dividend: 3 },
    },
    {
        id: 'npc-victor-k', name: 'Victor K.', shareCount: 1_100_000,
        trait: 'Snake', trust: 40, isHostile: false,
        origin: 'Investor', motivation: 'control',
    },
    {
        id: 'brother', name: 'Julian Hale', shareCount: 1_500_000,
        trait: 'Snake', trust: 60, isHostile: true,
        origin: 'Founder', motivation: 'vindication', petIssue: 'dividend',
    },
];

describe('a generation of directors', () => {
    it('leaves exactly as many seats as it found', () => {
        // "Bolunmesin ikiye uce." The founder's ESTATE splits, which is how
        // the siblings arrive; a director's holding does not, or the board
        // doubles every generation.
        expect(succeedBoard(board(), 2)).toHaveLength(board().length);
    });

    it('and every share stays on the seat it was on', () => {
        const before = board();
        const after = succeedBoard(before, 2);
        expect(after.map(m => m.shareCount)).toEqual(before.map(m => m.shareCount));
        // And the total, said separately, because that is the number every
        // ownership percentage in the game divides by.
        const sum = (xs: SucceedableMember[]) => xs.reduce((a, b) => a + b.shareCount, 0);
        expect(sum(after)).toBe(sum(before));
    });

    it('and nobody who had left comes back', () => {
        // "Eger yoksa gelmesin." A director voted out is already absent from
        // the array; this must not resurrect them, and must not invent a seat.
        const twoLeft = board().slice(0, 2);
        const after = succeedBoard(twoLeft, 2);
        expect(after).toHaveLength(2);
        expect(after.some(m => m.id.startsWith('brother'))).toBe(false);
    });

    it('and an empty board stays empty', () => {
        expect(succeedBoard([], 2)).toEqual([]);
    });
});

describe('who is sitting there afterwards', () => {
    it('is somebody new, with the family name kept', () => {
        const after = succeedBoard(board(), 2);
        expect(after[0].name).not.toBe('Elena Vance');
        expect(after[0].name.endsWith('Vance')).toBe(true);
        expect(after[2].name.endsWith('Hale')).toBe(true);
    });

    it('and an initial counts as a surname, because it is what they are called', () => {
        expect(surnameOf('Victor K.')).toBe('K.');
        expect(succeedBoard(board(), 2)[1].name.endsWith('K.')).toBe(true);
    });

    it('and a one word name survives rather than being emptied', () => {
        expect(surnameOf('Marcus')).toBe('Marcus');
        expect(surnameOf('')).toBe('');
    });

    it('and the same seat gives the same heir every time it is asked', () => {
        // Deterministic on purpose: reloading a save must not rename the
        // board, and a test should be able to assert a name.
        expect(succeedBoard(board(), 2).map(m => m.name))
            .toEqual(succeedBoard(board(), 2).map(m => m.name));
    });

    it('and a different generation gives a different name', () => {
        const g2 = succeedBoard(board(), 2)[0].name;
        const g3 = succeedBoard(board(), 3)[0].name;
        expect(g2).not.toBe(g3);
    });

    it('and two seats do not collide on the same given name by construction', () => {
        // Not a guarantee for every pool size, so this is about the seat id
        // being part of the draw rather than the generation alone.
        const names = succeedBoard(board(), 2).map(m => m.name.split(' ')[0]);
        expect(new Set(names).size).toBeGreaterThan(1);
        for (const n of names) expect(SUCCESSOR_FIRST_NAMES).toContain(n);
    });

    it('and gets an id of their own, so nothing finds them by mistake', () => {
        const after = succeedBoard(board(), 2);
        for (const m of after) expect(m.id).toContain('::g2');
        expect(after.map(m => m.id)).not.toEqual(board().map(m => m.id));
    });
});

describe('what the child inherits', () => {
    it('the trait, so a difficult family stays difficult', () => {
        const after = succeedBoard(board(), 2);
        expect(after.map(m => m.trait)).toEqual(board().map(m => m.trait));
    });

    it('and the origin, and what the family cares about', () => {
        const after = succeedBoard(board(), 2);
        expect(after.map(m => m.origin)).toEqual(board().map(m => m.origin));
        expect(after[0].motivation).toBe('legacy');
        expect(after[0].petIssue).toBe('debt');
    });

    it('but NOT the relationship you had with their parent', () => {
        // Trust and relationship are a history with a person who is gone.
        const after = succeedBoard(board(), 2);
        for (const m of after) {
            expect(m.trust).toBe(SUCCESSOR_TRUST);
            expect(m.relationship).toBe(50);
        }
    });

    it('and not the gestures you paid for, nor the fatigue you built up', () => {
        const after = succeedBoard(board(), 2);
        expect(after[0].gestureCount).toBe(0);
        expect(after[0].fatigue).toEqual({});
    });

    it('and not their parent\'s hostility', () => {
        // The brother was hostile. His child has no opinion of you yet, and
        // arriving already at war would make the whole reset meaningless.
        expect(board()[2].isHostile).toBe(true);
        expect(succeedBoard(board(), 2)[2].isHostile).toBe(false);
    });

    it('and neutral means the same thing for a Snake as for anyone else', () => {
        // loyaltyOf INVERTS trust for a Snake, so 50 is the one value that
        // reads as neutral in both directions. Any other number would hand
        // the Snake families a permanent advantage or a permanent handicap.
        expect(SUCCESSOR_TRUST).toBe(50);
    });
});

describe('the wiring', () => {
    it('runs inside the succession, before the siblings are added', () => {
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(path.join(__dirname, 'runSuccession.ts'), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');

        expect(src).toMatch(/succeedBoard\(st\.members \?\? \[\], \(family\.generation \?\? 1\) \+ 1\)/);
        // Before the siblings, so the new arrivals are not themselves aged a
        // generation the moment they sit down.
        const succeedAt = src.indexOf('succeedBoard(');
        const siblingsAt = src.indexOf('plan.siblings.map');
        expect(succeedAt).toBeGreaterThan(-1);
        expect(siblingsAt).toBeGreaterThan(succeedAt);
    });
});
