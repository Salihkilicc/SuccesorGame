// src/features/love/logic/runHeirs.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE GAME
// ============================================================================
//
//  heirs.ts decides who speaks and about what. data/story/heirs.ts is what they
//  say. This puts it on the phone.
//
//  ---------------------------------------------------------------------------
//  IT ATTACHES A CONVERSATION TO A THREAD, WHICH IS THE WHOLE TRICK
//  ---------------------------------------------------------------------------
//  `deliver` in core/story/deliver.ts does the same two steps - send the
//  opening card as a message, then set `conversationId` on the thread - but it
//  takes the sender's name from CAST, and a child's name comes from the player.
//
//  So this does those two steps itself with the real name. Everything after
//  that is the ordinary machinery: the runner plays it, the player answers,
//  `sceneProgress` remembers where they got to, the transcript files itself
//  into the thread and the id clears.
//
//  ONE THREAD PER CHILD, keyed by their id, so two of them arguing at you over
//  a year reads as two people rather than one queue.
// ============================================================================

import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useMessageStore } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { HEIR_CONVERSATIONS } from '../../../data/story/heirs';
import { heirTurnFor, type Heir } from './heirs';

/**
 * How long before the same child may write again.
 *
 * Four quarters. A family that files a grievance every three months is not a
 * family, and the succession is a thing that happens over twenty years - it
 * should feel like being reminded rather than being lobbied.
 */
export const HEIR_COOLDOWN_QUARTERS = 4;

/**
 * One quarter of the children having opinions.
 *
 * Returns what it did, so the tick's test can assert on it without reading two
 * stores.
 */
export const runHeirs = (): { spoke: string | null; scene: string | null } => {
    const family = useFamilyStore.getState();
    const children = family.children ?? [];
    if (children.length === 0) return { spoke: null, scene: null };

    const messages = useMessageStore.getState();
    const month = useGameStore.getState().currentMonth;

    // ------------------------------------------------------------------
    //  A CHILD WITH A SCENE STILL OPEN DOES NOT START ANOTHER
    // ------------------------------------------------------------------
    //  A thread holds exactly ONE conversation id, so sending a second would
    //  overwrite the first - which is the bug that ate the second act of the
    //  story once already. See the note in core/story/deliver.ts.
    // ------------------------------------------------------------------
    const busy = new Set(
        messages.threads.filter(t => !!t.conversationId).map(t => t.id),
    );

    const eligible: Heir[] = children
        .filter(c => !busy.has(c.id))
        .filter(c => {
            const last = messages.threads.find(t => t.id === c.id);
            const lastSaid = last?.messages[last.messages.length - 1]?.atMonth ?? -999;
            return month - lastSaid >= HEIR_COOLDOWN_QUARTERS * 3;
        })
        .map(c => ({
            id: c.id,
            name: c.name,
            age: c.age,
            ambition: c.stats?.ambition ?? 50,
            loyalty: c.stats?.loyalty ?? 50,
        }));

    const turn = heirTurnFor(eligible, family.designatedSuccessorId);
    if (!turn) return { spoke: null, scene: null };

    const conversation = HEIR_CONVERSATIONS[turn.scene];
    const opening = conversation.nodes.find(n => n.id === conversation.start);

    // The two steps `deliver` does, with the child's own name on the thread.
    messages.sendFromCharacter(
        { id: turn.speaker.id, name: turn.speaker.name, role: 'Your child' },
        opening?.text ?? '',
        month,
    );
    useMessageStore.setState(s => ({
        threads: s.threads.map(t =>
            t.id === turn.speaker.id ? { ...t, conversationId: conversation.id } : t),
    }));

    if (__DEV__) console.log(`[heirs] ${turn.speaker.name} wrote: ${turn.scene}`);
    return { spoke: turn.speaker.id, scene: turn.scene };
};
