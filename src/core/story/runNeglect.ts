// src/core/story/runNeglect.ts
//
// ============================================================================
//  THE THIRD FILE IN THE SPLIT: THE ONE THAT TOUCHES THE GAME
// ============================================================================
//
//  neglect.ts decides who was ignored (pure). data/story/neglect.ts holds what
//  each of them says (data). This sends the message and moves the dial, and it
//  is the only part that needs a running app.
//
//  Called once a quarter from the tick, AFTER the inbox drains. The ordering is
//  not decoration: `runInbox` delivers this quarter's scenes, and a scene that
//  arrives this morning has not been ignored. Chasing before the drain would
//  have people complaining about silence in the same tick that they broke it.
// ============================================================================

import { useMessageStore } from '../store/useMessageStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import { useStoryStore } from '../store/useStoryStore';
import { CAST } from '../../data/story/cast';
import { castNow } from './castNow';
import { CONVERSATIONS } from '../../data/story';
import { emailOf } from './cast';
import { NEGLECT_LINES } from '../../data/story/neglect';
import { whoWasIgnored, NEGLECT_STEP, type Neglectable } from './neglect';

/**
 * Has this conversation actually been answered?
 *
 * `finish()` records a null node and nothing else does, so a null is the one
 * reliable "the player got to the end of it" mark in the game. A missing entry
 * means never opened; a non-null node means opened and walked away from.
 *
 * NOT `seenScenes`, which is written by `deliver` the moment a beat is QUEUED.
 * That list means "we sent this once" and using it here would have found
 * nobody: every delivered letter is in it by definition.
 */
const answered = (conversationId?: string): boolean => {
    if (!conversationId) return true;   // a plain letter asks nothing
    const progress = useStoryStore.getState().sceneProgress?.[conversationId];
    return !!progress && progress.nodeId === null;
};

/**
 * Everybody who is owed a reply, from BOTH channels.
 *
 * ---------------------------------------------------------------------------
 *  AND THE MAIL WAS NOT BEING LOOKED AT
 * ---------------------------------------------------------------------------
 *  This swept `useMessageStore` only, and thirty three of the game's seventy
 *  four conversations arrive by mail - every letter from Pear, the fund, the
 *  Bureau and the regulator among them. So the people whose silence means the
 *  most were the ones outside the sweep.
 *
 *  Folded onto ONE entry per person rather than one per letter, because the
 *  chase is a message from a human being and nobody writes to you twice in a
 *  morning to complain about the same silence.
 */
const owedAReply = (): Neglectable[] => {
    const byCast = new Map<string, Neglectable>();

    for (const thread of useMessageStore.getState().threads ?? []) {
        byCast.set(thread.id, {
            ...thread,
            unanswered: !answered(thread.conversationId),
        } as Neglectable);
    }

    try {
        for (const mail of useMailStore.getState().inbox ?? []) {
            // Who sent it. The conversation knows for a scene; for everything
            // else - including the chase letter this function's caller sends -
            // the address is the only link back to the cast.
            const viaScene = mail.conversationId
                ? CONVERSATIONS.find(c => c.id === mail.conversationId)?.from
                : undefined;
            const who = viaScene ?? Object.keys(CAST).find(
                id => !!emailOf(CAST[id]) && emailOf(CAST[id]) === mail.fromEmail,
            );
            if (!who) continue;

            // EVERY letter from them counts for the CLOCK, including the last
            // chase, which is what stops a mail-only character complaining
            // every quarter forever. Message threads get this for free because
            // the chase lands in the thread; mail needed it saying out loud.
            const isUnanswered = !!mail.conversationId && !answered(mail.conversationId);

            const existing = byCast.get(who);
            if (existing) {
                existing.messages = [
                    ...existing.messages,
                    { from: 'them', atMonth: mail.atMonth },
                ];
                if (isUnanswered) existing.unanswered = true;
            } else {
                byCast.set(who, {
                    id: who,
                    unread: mail.isRead ? 0 : 1,
                    messages: [{ from: 'them', atMonth: mail.atMonth }],
                    unanswered: isUnanswered,
                });
            }
        }
    } catch { /* mail store not ready */ }

    // ------------------------------------------------------------------
    //  IN ORDER, BECAUSE THE RULE READS THE LAST ONE
    // ------------------------------------------------------------------
    //  `whoWasIgnored` measures the silence from the NEWEST thing they sent,
    //  and it finds it by taking the last element - which is correct for a
    //  message thread, where messages are appended as they arrive.
    //
    //  The inbox is the other way round: `receiveMail` puts the newest letter
    //  at the top so it is the first thing the player sees. Folded in as they
    //  came, Pear's chase letter went in BEFORE the letter it was chasing, so
    //  the rule measured from the old one and he complained again every
    //  quarter for the rest of the run.
    // ------------------------------------------------------------------
    for (const entry of byCast.values()) {
        entry.messages = [...entry.messages].sort((a, b) => a.atMonth - b.atMonth);
    }

    return Array.from(byCast.values());
};

/**
 * Let everybody who has been ignored for a quarter say so.
 *
 * Returns the ids it chased, so the tick's test can assert on them without
 * reading three stores.
 */
export const runNeglect = (): string[] => {
    const month = useGameStore.getState().currentMonth;
    const store = useMessageStore.getState();

    const ignored = whoWasIgnored(owedAReply(), month)
        // Only the people who have something written for it. A thread from
        // somebody with no line stays unread and costs nothing, which is the
        // correct outcome: a mechanic that fires without any writing behind it
        // is a notification, and this exists precisely because a notification
        // was the wrong answer.
        .filter(id => !!NEGLECT_LINES[id]);

    for (const id of ignored) {
        const line = NEGLECT_LINES[id];
        // The person in that seat now. The address lookup above stays on the
        // raw table on purpose: an email is a property of the SEAT and does
        // not change when the holder does. a.vance@hale.co outlives Vance.
        const who = castNow(id);
        if (!who) continue;

        // ------------------------------------------------------------------
        //  THROUGH THE DOOR THEY ACTUALLY USE
        // ------------------------------------------------------------------
        //  Mail is DISTANCE and messages are PROXIMITY, and four of the people
        //  who can be ignored are mail only by design. Pear's cast entry puts
        //  it best: "he does not have your number and has never wanted it. If
        //  he ever texts you, something has broken in him, which is a scene
        //  worth saving for." A chase that arrives as a text would spend that
        //  scene on a reminder.
        // ------------------------------------------------------------------
        // The letter first. If anything below throws, the player has still
        // been told - a silent dial move would be exactly the hidden counter
        // this design exists to avoid.
        if (who.channels === 'mail') {
            useMailStore.getState().receiveMail({
                fromId: who.id,
                fromName: who.name,
                fromEmail: emailOf(who) ?? '',
                subject: line.subject ?? 'Following up',
                body: line.text,
                atMonth: month,
                category: 'Primary',
            });
        } else {
            store.sendFromCharacter(
                { id: who.id, name: who.name, role: who.role },
                line.text,
                month,
            );
            store.markChased(id, month);
        }

        if (line.dial) {
            useStoryStore.getState().nudge(
                line.dial,
                line.direction === 'up' ? NEGLECT_STEP : -NEGLECT_STEP,
            );
        }
    }

    if (__DEV__ && ignored.length) {
        console.log(`[story] chased for silence: ${ignored.join(', ')}`);
    }
    return ignored;
};
