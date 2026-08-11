// src/core/story/graph.test.ts
//
// The validator is the thing standing between this story and spaghetti, so it
// is worth more scepticism than the code it checks. A validator that reports
// clean on a broken graph is worse than none - it converts "I should look at
// this" into "the machine says it is fine".

import { validate, validateAll, type Conversation } from './graph';
import { cfoDividend } from '../../data/story/cfoDividend';
import { CONVERSATIONS } from '../../data/story';

const base = (nodes: Conversation['nodes'], start = 'a'): Conversation => ({
    id: 'test',
    channel: 'message',
    from: { id: 'x', name: 'X', role: 'Y' },
    start,
    nodes,
});

const kinds = (c: Conversation) => validate(c).map(p => p.kind).sort();

describe('validate', () => {
    it('passes a graph with nothing wrong with it', () => {
        expect(validate(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: 'on', next: 'b' }, { text: 'out' }] },
            { id: 'b', speaker: 'x', text: 'b' },
        ]))).toEqual([]);
    });

    it('catches a link to a card that does not exist', () => {
        expect(kinds(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: 'go', next: 'ghost' }] },
        ]))).toEqual(['broken-link']);
    });

    it('catches a card nothing leads to', () => {
        expect(kinds(base([
            { id: 'a', speaker: 'x', text: 'a' },
            { id: 'lost', speaker: 'x', text: 'written, never seen' },
        ]))).toEqual(['unreachable']);
    });

    it('catches a card where every answer is gated', () => {
        expect(kinds(base([
            {
                id: 'a', speaker: 'x', text: 'a', choices: [
                    { text: 'rich', when: [{ kind: 'cashAtLeast', amount: 1 }] },
                    { text: 'flagged', when: [{ kind: 'flag', flag: 'fatherDead' }] },
                ],
            },
        ]))).toEqual(['all-choices-gated']);
    });

    it('allows a gated answer as long as one is unconditional', () => {
        expect(validate(base([
            {
                id: 'a', speaker: 'x', text: 'a', choices: [
                    { text: 'rich', when: [{ kind: 'cashAtLeast', amount: 1 }] },
                    { text: 'always here' },
                ],
            },
        ]))).toEqual([]);
    });

    it('does NOT treat a card with no answers as a trap', () => {
        // They had the last word. This is how most scenes should end, and
        // flagging it would make the check something people switch off.
        expect(validate(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: 'ok', next: 'b' }] },
            { id: 'b', speaker: 'x', text: 'the last word' },
        ]))).toEqual([]);
    });

    it('holds the two-answer limit', () => {
        expect(kinds(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: '1' }, { text: '2' }, { text: '3' }] },
        ]))).toEqual(['too-many-choices']);
    });

    it('catches a start that is not a card, and stops rather than piling on', () => {
        // Without the early return this also reports every node as unreachable,
        // which buries the one problem that actually matters.
        expect(kinds(base([{ id: 'a', speaker: 'x', text: 'a' }], 'nowhere')))
            .toEqual(['missing-start']);
    });

    it('catches two cards sharing an id, because a link would be ambiguous', () => {
        expect(kinds(base([
            { id: 'a', speaker: 'x', text: 'one', choices: [{ text: 'go', next: 'a' }] },
            { id: 'a', speaker: 'x', text: 'two' },
        ]))).toContain('duplicate-node');
    });

    it('follows links through several cards rather than one hop', () => {
        // A naive reachability check that only looks at the start node would
        // call c and d unreachable here.
        expect(validate(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: '>', next: 'b' }] },
            { id: 'b', speaker: 'x', text: 'b', choices: [{ text: '>', next: 'c' }] },
            { id: 'c', speaker: 'x', text: 'c', choices: [{ text: '>', next: 'd' }] },
            { id: 'd', speaker: 'x', text: 'd' },
        ]))).toEqual([]);
    });

    it('does not loop forever on a conversation that points back at itself', () => {
        expect(validate(base([
            { id: 'a', speaker: 'x', text: 'a', choices: [{ text: 'round', next: 'b' }] },
            { id: 'b', speaker: 'x', text: 'b', choices: [{ text: 'again', next: 'a' }, { text: 'out' }] },
        ]))).toEqual([]);
    });
});

describe('validateAll', () => {
    it('catches two conversations sharing an id', () => {
        const one = base([{ id: 'a', speaker: 'x', text: 'a' }]);
        expect(validateAll([one, { ...one }]).map(p => p.kind)).toContain('duplicate-node');
    });
});

describe('the story as it actually ships', () => {
    it('every registered conversation is valid', () => {
        expect(validateAll(CONVERSATIONS)).toEqual([]);
    });

    it('the CFO scene reaches both of its endings', () => {
        // Not a graph property - a writing one. A branch that exists but
        // cannot be arrived at is the failure this whole file is about.
        const reachable = new Set<string>();
        const walk = (id: string) => {
            if (reachable.has(id)) return;
            reachable.add(id);
            const n = cfoDividend.nodes.find(x => x.id === id);
            (n?.choices ?? []).forEach(c => c.next && walk(c.next));
        };
        walk(cfoDividend.start);
        expect(reachable.has('paid')).toBe(true);
        expect(reachable.has('refused')).toBe(true);
        expect(reachable.has('dismissed')).toBe(true);
    });
});
