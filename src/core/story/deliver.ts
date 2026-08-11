// src/core/story/deliver.ts
//
// ============================================================================
//  TURNING A DUE CONVERSATION INTO SOMETHING IN AN INBOX
// ============================================================================
//
//  The queue decides WHEN. This decides WHERE, and it is short because the
//  channel rule already did the thinking: a conversation knows which app it
//  belongs to, the cast says whether that person may use it, and the audit
//  refused to ship the combination if they disagreed.
//
//  So delivery is: look up the sender, create the row, attach the
//  conversation id. The screens already know that a row carrying one opens in
//  the runner rather than as plain text.
//
//  ---------------------------------------------------------------------------
//  THE TICK CALLS THIS, AND NOTHING ELSE DOES
//  ---------------------------------------------------------------------------
//  A scene cannot deliver directly - it schedules, and the queue decides. That
//  is what stops the allowance being an honour system: there is one door and
//  it counts.
// ============================================================================

import { useMessageStore } from '../store/useMessageStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import { useStoryStore } from '../store/useStoryStore';
import { CAST } from '../../data/story/cast';
import { conversationById } from '../../data/story';
import { emailOf } from './cast';
import { drain, type Pending } from './inbox';
import { testAll } from './conditions';
import { readWorld, currentQuarter } from './world';

/** Put one conversation in front of the player. */
export const deliver = (conversationId: string): boolean => {
    const c = conversationById(conversationId);
    if (!c) return false;
    const from = CAST[c.from];
    if (!from) return false;

    const atMonth = useGameStore.getState().currentMonth;
    const opening = c.nodes.find(n => n.id === c.start);

    if (c.channel === 'mail') {
        useMailStore.getState().receiveMail({
            fromName: from.name,
            fromEmail: emailOf(from) ?? '',
            subject: c.subject ?? '(no subject)',
            // The opening card doubles as the preview. A separate summary
            // field would be a second copy of the same words, and the two
            // would drift the first time anybody edited one of them.
            body: opening?.text ?? '',
            atMonth,
            category: 'Primary',
            conversationId: c.id,
        });
        return true;
    }

    const store = useMessageStore.getState();
    store.sendFromCharacter(
        { id: from.id, name: from.name, role: from.role },
        opening?.text ?? '',
        atMonth,
    );
    // sendFromCharacter creates or reuses the thread; attaching the
    // conversation afterwards is what turns it from a plain thread into a
    // playable one.
    useMessageStore.setState(s => ({
        threads: s.threads.map(t =>
            t.id === from.id ? { ...t, conversationId: c.id } : t),
    }));
    return true;
};

/**
 * Run the queue for the quarter that has just started.
 *
 * Called once per tick. Everything it decides comes from `drain`, which is
 * pure and tested; this only performs the result.
 */
export const runInbox = (): void => {
    const story = useStoryStore.getState();
    const quarter = currentQuarter();
    const world = readWorld();

    const canDeliver = (p: Pending): boolean => {
        const c = conversationById(p.conversationId);
        // A queued conversation that no longer exists - a scene renamed or
        // removed between versions - is dropped rather than retried forever.
        if (!c) return false;
        return testAll(c.when, world);
    };

    const { deliver: due, keep, expired } = drain(story.pending, quarter, canDeliver);

    due.forEach(p => deliver(p.conversationId));
    story.setPending(keep);

    if (__DEV__ && expired.length) {
        // Quiet in a shipped build, loud while writing: a scene that expired
        // is a scene the player never saw, and that is usually a gate that
        // was wrong rather than a story beat that was skipped.
        // eslint-disable-next-line no-console
        console.log('[story] expired without ever being deliverable:',
            expired.map(p => p.conversationId).join(', '));
    }
};
