// src/features/love/logic/runHeirs.test.ts
//
// ============================================================================
//  AND THE HALF THAT PUTS IT ON THE PHONE
// ============================================================================
//  heirs.test.ts proves the rule. This mounts it against the real stores. The
//  interesting part is the two guards: a thread holds exactly ONE conversation
//  id, and a family that writes every quarter is a family nobody wants.
// ============================================================================

import { runHeirs, HEIR_COOLDOWN_QUARTERS } from './runHeirs';
import { useFamilyStore, initialFamilyState } from '../../../core/store/useFamilyStore';
import { useMessageStore, initialMessageState } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { HEIR_CONVERSATIONS } from '../../../data/story/heirs';

const kid = (id: string, over: any = {}) => ({
    id, name: `${id.toUpperCase()} Hale`, gender: 'Male' as const,
    age: 18, birthYear: 2008, birthQuarter: 1,
    educationLevel: 'University' as const, role: 'Student' as const,
    relationshipWithPlayer: 70, isSuccessorCandidate: false, traits: [], allowance: 0,
    stats: {
        intellect: 70, charm: 70, businessAcumen: 70,
        loyalty: 50, ambition: 90, health: 90, creativity: 70,
    },
    ...over,
});

const family = (children: any[], heir: string | null = null) => {
    useMessageStore.setState({ ...initialMessageState, threads: [] });
    useFamilyStore.setState({
        ...initialFamilyState, _hasHydrated: true,
        children, designatedSuccessorId: heir,
    });
    useGameStore.setState({ currentMonth: 60 } as never);
};

const thread = (id: string) =>
    useMessageStore.getState().threads.find(t => t.id === id);

describe('a child writing', () => {
    it('arrives on their own thread, under their own name', () => {
        // One thread per child, so two of them arguing at you over a year
        // reads as two people rather than one queue.
        family([kid('a')]);
        const r = runHeirs();
        expect(r.spoke).toBe('a');
        expect(thread('a')?.name).toBe('A Hale');
    });

    it('and it is a playable scene, not a notice', () => {
        // The whole reason these are Conversations: the player answers and it
        // ends. The runner takes it from here.
        family([kid('a')]);
        runHeirs();
        expect(thread('a')?.conversationId).toBe(HEIR_CONVERSATIONS.alone.id);
    });

    it('and the scene matches the family they are in', () => {
        family([kid('a'), kid('b')], 'b');
        runHeirs();
        expect(thread('a')?.conversationId).toBe(HEIR_CONVERSATIONS.passedOver.id);
    });

    it('while a family of small children says nothing', () => {
        family([kid('a', { age: 9 }), kid('b', { age: 4 })]);
        expect(runHeirs().spoke).toBeNull();
        expect(useMessageStore.getState().threads).toHaveLength(0);
    });

    it('and a player with no children is untouched', () => {
        family([]);
        expect(runHeirs().spoke).toBeNull();
    });
});

describe('the two guards', () => {
    it('a child with a scene still open does not start another', () => {
        // A thread holds exactly ONE conversation id, so a second would
        // overwrite the first - the bug that ate the second act of the story
        // once already. See the note in core/story/deliver.ts.
        family([kid('a')]);
        runHeirs();
        expect(runHeirs().spoke).toBeNull();
        expect(thread('a')!.messages).toHaveLength(1);
    });

    it('and NOBODY in the house writes again for a year', () => {
        // ------------------------------------------------------------------
        //  FAMILY-WIDE, NOT PER CHILD
        // ------------------------------------------------------------------
        //  Per child sounded fairer and was worse: three teenagers on their
        //  own four-quarter timers is a letter every quarter, from whichever
        //  one is angriest, for ever. The succession happens over twenty
        //  years; it should feel like being reminded once a year.
        // ------------------------------------------------------------------
        family([kid('a')]);
        runHeirs();
        useMessageStore.getState().clearConversation('a');

        useGameStore.setState({ currentMonth: 60 + 3 } as never);
        expect(runHeirs().spoke).toBeNull();

        useGameStore.setState({ currentMonth: 60 + HEIR_COOLDOWN_QUARTERS * 3 } as never);
        expect(runHeirs().spoke).toBe('a');
    });

    it('so a sibling cannot jump in the same quarter either', () => {
        // The version this replaces let the quiet one speak the moment the
        // loud one finished, which is the same flood wearing two names.
        family([kid('a'), kid('b')], null);
        const first = runHeirs();
        expect(first.spoke).not.toBeNull();
        useMessageStore.getState().clearConversation(first.spoke!);
        expect(runHeirs().spoke).toBeNull();
    });

    it('while a whole year later somebody does, and it need not be the same one', () => {
        family([
            kid('a', { stats: { ...kid('a').stats, ambition: 90 } }),
            kid('b', { stats: { ...kid('b').stats, ambition: 90 } }),
        ], null);
        const heard = new Set<string>();
        for (let year = 0; year < 40; year++) {
            useGameStore.setState({ currentMonth: 60 + year * HEIR_COOLDOWN_QUARTERS * 3 } as never);
            const r = runHeirs();
            if (r.spoke) {
                heard.add(r.spoke);
                useMessageStore.getState().clearConversation(r.spoke);
            }
        }
        expect(heard.size).toBe(2);
    });
});
