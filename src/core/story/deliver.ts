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
import { drain, QUIET_QUARTER_CHANCE, type Pending } from './inbox';
import { testAll, firstFailing } from './conditions';
import { readWorld, currentQuarter } from './world';
import { activeLock } from '../tutorial/locks';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { OPENING_ACT } from '../../data/story/openingAct';

/**
 * How a sender is named on a letter.
 *
 * A person gets their affiliation; an organisation is already its own
 * affiliation and would read as "Halberd Partners (Halberd Partners)".
 */
export const senderLabel = (from: { name: string; role: string }): string => {
    // ------------------------------------------------------------------
    //  THE COMMA IS THE CONVENTION
    // ------------------------------------------------------------------
    //  Roles in data/story/cast.ts are written one of two ways, and the
    //  difference is already meaningful:
    //
    //      "CEO, Pear"                 a title AT a company
    //      "Chief Financial Officer"   a title, in your company
    //
    //  Only the first kind tells the player something the name does not, so
    //  only the first kind is appended. Your own CFO stays "Arthur Vance" -
    //  you know where he works - and your father stays "Your Father" rather
    //  than becoming "Your Father - Founder", which would be the label
    //  explaining a relationship to the person inside it.
    //
    //  Inferred from the writing rather than from a new field, because a
    //  fifteenth field nobody has to fill in is a fifteenth field somebody
    //  will forget.
    // ------------------------------------------------------------------
    return (from.role.includes(',') || from.role.startsWith('Head of') || from.role.startsWith('Chair'))
        ? `${from.name} - ${from.role}`
        : from.name;
};

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
            // ------------------------------------------------------------------
            //  THE ORGANISATION, NOT JUST THE PERSON
            // ------------------------------------------------------------------
            //  A row in the inbox shows a name and a subject. Pear's approach
            //  arrives from "Nathan Vogel" with the subject "HALE / condolence
            //  + preliminary approach - ref 4471-C", and the word Pear appears
            //  nowhere on it - which is exactly the letter's character and
            //  exactly why it gets scrolled past.
            //
            //  The letter I spent three commits believing was undelivered was
            //  sitting at the top of the inbox the whole time, unrecognisable.
            //  The engine was right and the label was useless.
            //
            //  `role` already carries the affiliation for everyone who has
            //  one - "CEO, Pear", "Chief Financial Officer" - so the sender
            //  line says who AND where. It costs nothing and it is the one
            //  thing a player needs before they decide whether to open it.
            // ------------------------------------------------------------------
            fromName: senderLabel(from),
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
    if (story.flags.openingQueued || story.flags.fatherDead) return;
    if (OPENING_CONVERSATIONS.some(id => story.seenScenes.includes(id))) return;

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

    for (const beat of STORY_BEATS) {
        const id = beat.conversation;
        const story = useStoryStore.getState();
        // ------------------------------------------------------------------
        //  AND IN DEVELOPMENT IT SAYS WHY NOT
        // ------------------------------------------------------------------
        //  A beat that does not arrive is silent in every direction: no
        //  error, nothing in the inbox, and the only way to find out which
        //  of its conditions is shut is to read the data file and guess.
        //
        //  Four days went into a letter that turned out to be arriving
        //  correctly the whole time, and then into a save whose flags had
        //  already closed the gate. Both would have been one line of log.
        // ------------------------------------------------------------------
        const explain = (why: string) => {
            if (__DEV__) console.log(`[story] beat "${id}" not queued: ${why}`);
        };

        if (story.seenScenes.includes(id)) { explain('already delivered once'); continue; }
        if (story.pending.some(p => p.conversationId === id)) { explain('already in the queue'); continue; }

        const c = conversationById(id);
        if (!c) { explain('no conversation with that id'); continue; }
        const shut = firstFailing(c.when, world);
        if (shut) {
            explain(`gate ${JSON.stringify(shut)} (quarter ${world.quarter})`);
            continue;
        }

        // ------------------------------------------------------------------
        //  AND SOME OF THEM ARE NOT ON A CALENDAR AT ALL
        // ------------------------------------------------------------------
        //  A beat is queued the first quarter its `when` holds, which for the
        //  spine is exactly right - the father dies when he dies - and for
        //  everybody else means the second playthrough is the first one
        //  again, in the same order.
        //
        //  A `chance` re-rolls every quarter the gate is open, so an optional
        //  arc arrives somewhere in a window rather than on a date. It is
        //  never lost: nothing here marks the beat seen unless it queues.
        // ------------------------------------------------------------------
        if (beat.chance !== undefined && Math.random() >= beat.chance) {
            explain(`chance ${beat.chance} did not come up this quarter`);
            continue;
        }

        useStoryStore.getState().schedule({
            conversationId: id,
            dueQuarter: now,
            queuedAtQuarter: now,
            // Only the spine bypasses the allowance. Everything else queues,
            // which is what turns a set of scenes into a sequence.
            urgent: beat.urgent,
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
export const runInbox = (
    /**
     * Force the quarter quiet or noisy, instead of rolling for it.
     *
     * A SEAM FOR TESTS, and it exists because everything else about delivery
     * in this file is deterministic on purpose - the whole story system was
     * built against a shelved modal that decided outcomes with `Math.random()`
     * behind a spinner. One die was added here deliberately; a test that has
     * to pass half the time is not a test, so the die can be held.
     *
     * The game never passes it.
     */
    forceQuiet?: boolean,
): void => {
    const story = useStoryStore.getState();
    const quarter = currentQuarter();
    const world = readWorld();

    // ------------------------------------------------------------------
    //  SOME QUARTERS NOBODY WRITES
    // ------------------------------------------------------------------
    //  Rolled ONCE per drain rather than per item, so a quiet quarter is
    //  quiet rather than being quiet for the scenes that happened to be
    //  checked after the coin turned. See QUIET_QUARTER_CHANCE.
    //
    //  A held item keeps its due quarter and is retried next time, so the
    //  cost of a tails is one quarter of waiting. The one thing this can
    //  interact badly with is `expiresAfter`, and nothing that expires is a
    //  message: the expiring things in this game are letters.
    // ------------------------------------------------------------------
    const quiet = forceQuiet ?? (Math.random() < QUIET_QUARTER_CHANCE);

    const canDeliver = (p: Pending): boolean => {
        const c = conversationById(p.conversationId);
        // A queued conversation that no longer exists - a scene renamed or
        // removed between versions - is dropped rather than retried forever.
        if (!c) return false;
        const isOpeningOrUrgent = p.urgent || OPENING_ACT.includes(p.conversationId as any);
        if (quiet && !isOpeningOrUrgent && c.channel === 'message') return false;
        return testAll(c.when, world);
    };

    // The sender, so two conversations from the same person cannot land in one
    // quarter and overwrite each other on the thread. See inbox.ts.
    const senderOf = (p: Pending): string | undefined =>
        conversationById(p.conversationId)?.from;

    // ------------------------------------------------------------------
    //  A THREAD WITH AN UNANSWERED SCENE ON IT IS BUSY
    // ------------------------------------------------------------------
    //  inbox.ts holds back a second conversation from the same person in the
    //  same QUARTER, and that was only half of it. A thread holds exactly one
    //  conversation id, so the scene the player has not got round to is
    //  deleted by the next one from that person however many quarters later
    //  it arrives - silently, with no error and nothing in the inbox to say a
    //  scene ever existed.
    //
    //  Which is where the second act went. The father's death lands on the
    //  CFO's thread, and PEAR'S LETTER IS SCHEDULED BY AN EFFECT INSIDE IT -
    //  so a player who had not opened that thread had not answered the CFO,
    //  and nothing was ever scheduled. The next beat from the CFO would then
    //  have overwritten the death itself, taking the whole act with it.
    //
    //  Busy means "has an id". Playing a conversation clears it - see
    //  clearConversation - so this holds the queue rather than blocking it.
    // ------------------------------------------------------------------
    const busyThreads = new Set(
        useMessageStore.getState().threads
            .filter(t => !!t.conversationId)
            .map(t => t.id),
    );
    const threadIsBusy = (p: Pending): boolean => {
        const c = conversationById(p.conversationId);
        if (!c || c.channel !== 'message') return false;
        return busyThreads.has(c.from);
    };

    const { deliver: due, keep, expired } =
        drain(story.pending, quarter, canDeliver, undefined, senderOf);

    // ------------------------------------------------------------------
    //  ONE COPY PER DRAIN
    // ------------------------------------------------------------------
    //  Two pending entries for the same conversation used to produce two
    //  letters, identical, one above the other. Nothing guarded it: the beat
    //  queue and the lock path each check before QUEUING, and neither can
    //  see what the other put in.
    //
    //  It is deduped here rather than at the queue because here is the only
    //  place that knows what is actually about to be sent. Within one drain
    //  only - a repeatable event delivering the same scene again in a later
    //  quarter is a different thing and still works.
    // ------------------------------------------------------------------
    const sent = new Set<string>();
    const held: Pending[] = [];
    due.forEach(p => {
        if (sent.has(p.conversationId)) return;
        // Its thread still has a scene nobody has answered. Wait rather than
        // write over it.
        if (threadIsBusy(p)) { held.push(p); return; }
        sent.add(p.conversationId);
        deliver(p.conversationId);
        const c = conversationById(p.conversationId);
        if (c?.channel === 'message') busyThreads.add(c.from);
    });
    story.setPending([...keep, ...held]);

    if (__DEV__ && expired.length) {
        // Quiet in a shipped build, loud while writing: a scene that expired
        // is a scene the player never saw, and that is usually a gate that
        // was wrong rather than a story beat that was skipped.
        // eslint-disable-next-line no-console
        console.log('[story] expired without ever being deliverable:',
            expired.map(p => p.conversationId).join(', '));
    }
};
