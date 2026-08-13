// src/data/story/fatherQ1.test.ts
//
// ============================================================================
//  THE FIRST THING ANYBODY SAYS
// ============================================================================
//
//  The audit already proves the graph is walkable. What it cannot prove is
//  that the scene ARRIVES - and an opening that nobody schedules is the exact
//  shape of failure this codebase keeps producing: correct, validated,
//  reachable by nothing.
//
//  There is also a rule this scene has to obey that no validator knows about.
//  The father is teaching, and the player has to be able to be rude to him
//  without losing the lesson. Every path has to reach the same instruction and
//  the same follow-up, or scepticism costs the player the tutorial - which
//  would be the game quietly punishing exactly the reading it wants to keep
//  open.
// ============================================================================

import { fatherQ1 } from './fatherQ1';
import { fatherQ1Invoice } from './fatherQ1Invoice';
import { CONVERSATIONS, OPENING_CONVERSATIONS } from './index';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';

const known = new Set(CONVERSATIONS.map(c => c.id));
const nodeOf = (c: typeof fatherQ1, id: string) => c.nodes.find(n => n.id === id)!;

/** Every path from the start, as lists of node ids. Terminates on cycles. */
const walk = (c: typeof fatherQ1): string[][] => {
    const out: string[][] = [];
    const step = (id: string, seen: string[]) => {
        if (seen.includes(id)) { out.push(seen); return; }
        const path = [...seen, id];
        const node = nodeOf(c, id);
        const next = (node.choices ?? []).filter(ch => ch.next);
        if (next.length === 0) { out.push(path); return; }
        next.forEach(ch => step(ch.next!, path));
    };
    step(c.start, []);
    return out;
};

describe('it is in the game at all', () => {
    it('both halves are registered', () => {
        expect(known.has(fatherQ1.id)).toBe(true);
        expect(known.has(fatherQ1Invoice.id)).toBe(true);
    });

    it('and the first one is queued at the start, because nothing else would', () => {
        expect(OPENING_CONVERSATIONS).toContain(fatherQ1.id);
    });

    it('passes the same validator every other scene passes', () => {
        expect(validate(fatherQ1, CAST, known)).toEqual([]);
        expect(validate(fatherQ1Invoice, CAST, known)).toEqual([]);
    });
});

describe('being rude to him costs you nothing you need', () => {
    it('every path reaches the closing card', () => {
        // If one branch could end early, a player who pushed back would lose
        // the instruction - and the scene's whole job is that pushing back is
        // a legitimate reading.
        for (const path of walk(fatherQ1)) {
            expect(path[path.length - 1]).toBe('close');
        }
    });

    it('and every answer at the end brings him back next quarter', () => {
        const close = nodeOf(fatherQ1, 'close');
        expect(close.choices!.length).toBeGreaterThan(0);
        for (const choice of close.choices!) {
            const schedules = (choice.effects ?? []).filter(e => e.kind === 'schedule');
            expect(schedules).toHaveLength(1);
            expect((schedules[0] as any).conversation).toBe(fatherQ1Invoice.id);
        }
    });

    it('the follow-up is urgent, so a dice roll cannot take its slot', () => {
        for (const choice of nodeOf(fatherQ1, 'close').choices!) {
            const s = (choice.effects ?? []).find(e => e.kind === 'schedule') as any;
            expect(s.urgent).toBe(true);
        }
    });
});

describe('he teaches the mechanics that actually exist', () => {
    const all = (c: typeof fatherQ1) => c.nodes.map(n => n.text).join(' ').toLowerCase();

    it('units rather than percentages - the real production target', () => {
        // core/market/production.ts resolveTargetUnits takes absolute units.
        expect(all(fatherQ1)).toContain('percentage');
        expect(all(fatherQ1)).toContain('units');
    });

    it('one shared floor, cut back in proportion - the real allocation', () => {
        expect(all(fatherQ1)).toContain('proportion');
    });

    it('cost is charged on what you build, not what you sell', () => {
        // The single most expensive misunderstanding available in this game,
        // and the invoice scene is where it gets said out loud.
        expect(all(fatherQ1Invoice)).toContain('everything that leaves the line');
    });
});

describe('the crack he does not notice', () => {
    it('he gives two different years for the same theft', () => {
        // Deliberate, and nothing in the dialogue points at it. A man who is
        // right about everything is a mentor; a man who is right about
        // everything except the year is a man remembering. The player is
        // meant to be the one who spots it, so it is pinned here rather than
        // explained on screen.
        const text = fatherQ1Invoice.nodes.map(n => n.text).join(' ').toLowerCase();
        expect(text).toContain('oh-nine');
        expect(text).toContain('two thousand and eleven');
    });

    it('and pressing him on it is an available answer', () => {
        const node = nodeOf(fatherQ1Invoice, 'sixYears');
        expect(node.choices!.some(c => c.next === 'corrected')).toBe(true);
    });

    it('which does not gate the lesson behind noticing', () => {
        // Every route still arrives at what to look for in the invoice.
        for (const path of walk(fatherQ1Invoice)) {
            expect(path).toContain('lookingFor');
        }
    });
});

describe('it does NOT repeat the lock that dims the screen', () => {
    // ------------------------------------------------------------------
    //  THE SPLIT, AND IT USED TO BE THE OPPOSITE ASSERTION
    // ------------------------------------------------------------------
    //  This test used to require that he say "Products" too, so that the
    //  message and the overlay agreed. They agreed by saying the same thing,
    //  and the player read one instruction twice - once on a card with his
    //  name on it and once in a conversation with him.
    //
    //  The division now is: the CARD says what to do, and he says why it
    //  ever mattered to him. Nothing is lost - a player who reads only the
    //  card still knows where to go - and what he says stops being a manual
    //  the player has already been handed.
    // ------------------------------------------------------------------
    const spoken = () => fatherQ1.nodes.map(n => n.text).join(' ');

    it('leaves the where to the overlay', () => {
        const q1 = TUTORIAL_SEQUENCE.find(l => l.id === 'q1-marketing')!;
        expect(q1.highlight).toBe('products');
        // He never sends them to a screen by name. That is the card's job
        // and it is doing it three centimetres away.
        expect(spoken()).not.toMatch(/go to Products|open Products/i);
    });

    it('and does not restate the card word for word', () => {
        const q1 = TUTORIAL_SEQUENCE.find(l => l.id === 'q1-marketing')!;
        // The card asks the player to open the phone and put money behind
        // it. He may still be about production - he is standing in front of
        // a line he thinks is running cold - but no imperative belongs to
        // both of them.
        expect(spoken()).not.toContain(q1.instruction);
        expect(spoken()).not.toMatch(/\bSet a target\b/);
        expect(spoken()).not.toMatch(/put money behind it/i);
    });

    it('what he says instead is about him', () => {
        // The replacement is not silence. Each removed directive left a gap
        // and something of his life went into it - his wife on the factory
        // floor on Saturdays, the year he stopped saying the honest thing.
        expect(spoken()).toContain('Saturdays');
        expect(spoken()).toContain('I do not recommend the trade');
    });
});
