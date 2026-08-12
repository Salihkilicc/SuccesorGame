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
import { conversationById, OPENING_CONVERSATIONS, STORY_BEATS } from '../../data/story';
import { emailOf } from './cast';
import { drain, type Pending } from './inbox';
import { testAll } from './conditions';
import { readWorld, currentQuarter } from './world';
import { activeLock } from '../tutorial/locks';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';

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
 * Put the opening scene in the queue.
 *
 * Called once, when the company is named - that is the moment the game
 * actually begins, and the father should already be waiting when the player
 * reaches the home screen for the first time.
 *
 * Idempotent via a flag rather than by inspecting the queue: the queue gets
 * drained, so by the second quarter there would be nothing left to tell us it
 * had ever been there, and re-entering onboarding would seed it again.
 */
export const seedOpening = (): void => {
    const story = useStoryStore.getState();
    if (story.flags.openingQueued) return;

    const now = currentQuarter();
    OPENING_CONVERSATIONS.forEach(id => {
        useStoryStore.getState().schedule({
            conversationId: id,
            dueQuarter: now,
            queuedAtQuarter: now,
            // The first thing anybody says. It does not wait behind anything.
            urgent: true,
        });
    });
    useStoryStore.getState().raise('openingQueued');

    // Delivered immediately rather than at the next tick. The father is
    // telling the player to go and set a production target BEFORE the quarter
    // advances; arriving after it would be advice about a quarter that is
    // already over.
    runInbox();
};

/**
 * Queue any story beat whose moment has arrived.
 *
 * The scene's own `when` is the trigger, so there is no second place to state
 * it and the condition that fires a beat cannot drift from the condition that
 * lets it be delivered. Once each, guarded by `seenScenes`.
 */
export const runStoryBeats = (): void => {
    const world = readWorld();
    const now = currentQuarter();

    for (const id of STORY_BEATS) {
        const story = useStoryStore.getState();
        if (story.seenScenes.includes(id)) continue;
        if (story.pending.some(p => p.conversationId === id)) continue;

        const c = conversationById(id);
        if (!c || !testAll(c.when, world)) continue;

        useStoryStore.getState().schedule({
            conversationId: id,
            dueQuarter: now,
            queuedAtQuarter: now,
            // The spine does not wait behind a recall notice.
            urgent: true,
        });
        useStoryStore.getState().markSceneSeen(id);
    }
};

/**
 * Queue the scene belonging to whichever lock is now live.
 *
 * The overlay dims the screen and lights one control; the conversation says
 * why. Before this they were unrelated - the lock had an `instruction` string
 * and nothing anywhere explained it, so the teaching layer sounded like a
 * tooltip rather than a person.
 *
 * Called each quarter. Idempotent per lock: the conversation is queued once,
 * recorded in the same flag set as everything else.
 */
export const runTutorialScenes = (): void => {
    const world = readWorld();
    const story = useStoryStore.getState();
    const lock = activeLock(TUTORIAL_SEQUENCE, story.locks, world);
    if (!lock?.conversation) return;

    const already = story.pending.some(p => p.conversationId === lock.conversation)
        || story.seenScenes.includes(lock.conversation);
    if (already) return;

    const now = currentQuarter();
    useStoryStore.getState().schedule({
        conversationId: lock.conversation,
        dueQuarter: now,
        queuedAtQuarter: now,
        // The lock is already on screen. Its explanation does not queue behind
        // a random event, or the player stares at a dimmed screen being told
        // to do something by nobody.
        urgent: true,
    });
    useStoryStore.getState().markSceneSeen(lock.conversation);
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
