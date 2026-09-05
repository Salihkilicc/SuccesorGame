// src/core/store/threadMigration.test.ts
//
// ============================================================================
//  A SAVE THAT WAS WRITTEN BEFORE THE ID WAS RIGHT
// ============================================================================
//
//  The seed thread carried Dana Whitfield under 'ops-lead'. She is the chief
//  operating officer - cast.ts, id 'coo' - so a save that had both held two
//  threads from the same woman, and the one under the wrong id could not find
//  her portrait.
//
//  Correcting the seed fixed new games and did nothing for anybody already
//  playing. It came straight back as her still having no face.
//
//  A thread id is not just a key here. It is what the portrait lookup reads,
//  so a stale one leaves a person quietly faceless for the rest of that save.
// ============================================================================

import { migrateThreads } from './useMessageStore';
import { portraitForPerson } from '../portraits';

const thread = (over: Record<string, unknown>) => ({
    id: 'x', name: 'Someone', role: 'Role', initials: 'S',
    messages: [], unread: 0,
    ...over,
} as never);

const msg = (id: string, atMonth: number) =>
    ({ id, from: 'them' as const, text: id, atMonth });

describe('an old thread id is brought up to date', () => {
    it('ops-lead becomes coo, which is who she is', () => {
        const out = migrateThreads([
            thread({ id: 'ops-lead', name: 'Dana Whitfield', messages: [msg('a', 1)] }),
        ]);
        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('coo');
        expect(out[0].messages).toHaveLength(1);
    });

    it('and that is what makes her face reachable at all', () => {
        // The point of the migration, rather than tidiness.
        const before = migrateThreads([]);
        expect(before).toEqual([]);
        expect(portraitForPerson('ops-lead', 'Dana Whitfield')).toBeNull();
        expect(portraitForPerson('coo', 'Dana Whitfield')).not.toBeNull();
    });

    it('and a save holding BOTH ends up with one of her', () => {
        // The duplicate is the case this exists for: the seed under the old
        // id, plus a real one opened by the story engine.
        const out = migrateThreads([
            thread({ id: 'coo', name: 'Dana Whitfield', unread: 2, messages: [msg('new', 9)] }),
            thread({ id: 'ops-lead', name: 'Dana Whitfield', unread: 1, messages: [msg('old', 1)] }),
        ]);
        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('coo');
        // Both halves were really sent, so neither is thrown away, and they
        // come out in the order they happened rather than the order the two
        // threads were merged.
        expect(out[0].messages.map(m => m.id)).toEqual(['old', 'new']);
        expect(out[0].unread).toBe(3);
    });

    it('and an unplayed conversation survives the merge', () => {
        // A scene nobody has read is the one thing in a thread that cannot be
        // recovered if it is dropped.
        const out = migrateThreads([
            thread({ id: 'ops-lead', conversationId: 'scene-7' }),
            thread({ id: 'coo' }),
        ]);
        expect(out[0].conversationId).toBe('scene-7');
    });

    it('and every other thread is left exactly alone', () => {
        const others = [
            thread({ id: 'cfo', name: 'Arthur Vance' }),
            thread({ id: 'father', name: 'Your Father' }),
            thread({ id: 'courtship-9', name: 'Mira Sen' }),
        ];
        const out = migrateThreads(others);
        expect(out.map(t => t.id)).toEqual(['cfo', 'father', 'courtship-9']);
        expect(out[0]).toBe(others[0]);
    });

    it('and a save with nothing in it does not throw', () => {
        expect(migrateThreads(undefined)).toEqual([]);
        expect(migrateThreads(null as never)).toEqual([]);
        expect(migrateThreads([])).toEqual([]);
    });
});
