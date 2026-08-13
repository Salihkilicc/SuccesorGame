// src/data/story/openingAct.test.ts
//
// ============================================================================
//  THE LIST HAS TO STAY TRUE, AND A LIST CANNOT KEEP ITSELF TRUE
// ============================================================================
//
//  OPENING_ACT is hand-written on purpose - see the note in openingAct.ts - and
//  the cost of that choice is exactly this file. A beat added to the first year
//  and not added to the list would arrive in a run the player asked to skip,
//  and the failure is quiet: one scene turns up, from a man who is supposed to
//  have died before the game started.
// ============================================================================

import { CONVERSATIONS } from './index';
import { OPENING_ACT, SKIPPED_ACT_FLAGS } from './openingAct';

const byId = (id: string) => CONVERSATIONS.find(c => c.id === id);

describe('the opening act', () => {
    it('names only scenes that exist', () => {
        expect(OPENING_ACT.filter(id => !byId(id))).toEqual([]);
    });

    it('and names each of them once', () => {
        expect(new Set(OPENING_ACT).size).toBe(OPENING_ACT.length);
    });

    it('covers every scene the father is in', () => {
        // He is the act. A beat of his outside the list is a beat that
        // survives being skipped.
        const his = CONVERSATIONS.filter(c => c.from === 'father').map(c => c.id);
        expect(his.filter(id => !OPENING_ACT.includes(id))).toEqual([]);
        expect(his.length).toBeGreaterThan(3);
    });

    it('and every condolence, public branch included', () => {
        const wave = CONVERSATIONS
            .filter(c => c.id.startsWith('condolence-')).map(c => c.id);
        expect(wave.filter(id => !OPENING_ACT.includes(id))).toEqual([]);
        expect(wave.length).toBeGreaterThan(6);
    });

    it('and the two beats that carry the act between them', () => {
        expect(OPENING_ACT).toContain('father-death');
        expect(OPENING_ACT).toContain('pear-offer');
    });

    it('while leaving the rest of the game alone', () => {
        // A skipped act must not take the whole story with it. If this ever
        // catches more than a fraction of the script, the list has grown into
        // something else.
        expect(OPENING_ACT.length).toBeLessThan(CONVERSATIONS.length / 3);
    });
});

describe('what a skipped act leaves behind', () => {
    it('only the death, because only the death is not a decision', () => {
        // `refusedPear` and `refusedPearPublicly` are consequences of a choice
        // the player did not make. Raising them would put them in a world
        // where people refer to something they never said.
        expect([...SKIPPED_ACT_FLAGS]).toEqual(['fatherDead']);
    });

    it('and that flag is one the story actually reads', () => {
        // A flag nobody tests is a flag that does nothing, and this one is
        // load-bearing for every gate written after the first year.
        const uses = JSON.stringify(CONVERSATIONS).split('"fatherDead"').length - 1;
        expect(uses).toBeGreaterThan(2);
    });
});
