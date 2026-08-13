// src/core/store/useMessageStore.ts
//
// ============================================================================
//  MESSAGES — where the story gets told
// ============================================================================
//
//  The game states everything in numbers. A quarter closes, a figure moves,
//  and the player infers what happened. That works for the engine and not at
//  all for the parts that are supposed to be about people: a director who
//  distrusts you, a rival who noticed your price cut, a head of production
//  who has been carrying an understaffed line for three quarters.
//
//  This is the surface for that, and it is deliberately a MESSAGING app
//  rather than a news feed: a feed announces, a thread implies someone chose
//  to write to you.
//
//  ---------------------------------------------------------------------------
//  WHAT IS HERE AND WHAT IS NOT
//  ---------------------------------------------------------------------------
//  Here: threads, messages, unread counts, and sending a reply. Seeded with
//  one real conversation so the screen has something true to render.
//
//  NOT here: any connection to the quarter tick. Nothing in the engine writes
//  a message yet, and pretending otherwise by faking reactions would be worse
//  than an obviously empty inbox - it is the exact failure this project keeps
//  hitting, a system that looks wired and is not. `sendFromCharacter` is the
//  door the engine will come through; when it does, adding story is writing
//  data rather than building a screen.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../../storage/persist';

export type MessageSender = 'player' | 'them';

export type Message = {
    id: string;
    from: MessageSender;
    text: string;
    /** Absolute game month, so the thread can be dated in game time. */
    atMonth: number;
};

export type Thread = {
    id: string;
    /** Who is writing. */
    name: string;
    /** Their relationship to you - "Head of Production", "Board". */
    role: string;
    /** Two letters for the avatar. Derived once, stored, so it cannot drift. */
    initials: string;
    messages: Message[];
    /** Messages from them that the player has not opened. */
    unread: number;
    /**
     * A branching conversation instead of a plain thread.
     *
     * Optional on purpose: every thread that exists today has none and keeps
     * behaving exactly as it did. A thread with one opens in the runner.
     */
    conversationId?: string;
};

export type MessageState = {
    threads: Thread[];
    _hasHydrated: boolean;
};

type MessageStore = MessageState & {
    setHasHydrated: (v: boolean) => void;
    /** Mark a thread read. Called when it is opened, not when it is listed. */
    markRead: (threadId: string) => void;
    /**
     * The conversation on this thread has been played to the end.
     *
     * Nothing did this, and a thread holds exactly ONE conversation id, so
     * two things went wrong at once:
     *
     *   - Opening the thread again replayed the whole scene, and the runner
     *     applies effects as answers are picked. Dials moved twice. Money
     *     moved twice. A `schedule` fired twice.
     *   - The only thing that ever changed the id was the NEXT conversation
     *     from the same person overwriting it, so a scene the player had not
     *     got round to was deleted by the one behind it.
     *
     * Clearing it on finish fixes the first and makes the second detectable:
     * a thread that still carries an id is a scene nobody has answered, and
     * `deliver` now holds the next one back rather than writing over it.
     */
    clearConversation: (threadId: string) => void;
    /**
     * The player's reply.
     *
     * @orphan-ok-symbol sendFromPlayer
     *
     * DELIBERATELY UNCALLED as of the commit that closed the composer. The
     * messages screen had a working text box: you could tell your Head of
     * Production you were hiring fifty people, watch the bubble appear, and
     * nothing in the game would read it. Not the staffing number, not her
     * dial, not the scene that fires when the line is short.
     *
     * Kept, not removed, because the door is right - if replies ever become
     * real, a parsed intent or a quick-reply strip arrives through here.
     */
    sendFromPlayer: (threadId: string, text: string, atMonth: number) => void;
    /**
     * THE ENGINE'S DOOR. A character writes to the player; the thread is
     * created if this is the first time they have.
     */
    sendFromCharacter: (
        who: { id: string; name: string; role: string },
        text: string,
        atMonth: number,
    ) => void;
    reset: () => void;
};

const initials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/**
 * The seed.
 *
 * One thread, from the person whose job the player most often makes
 * impossible. It is written so that it reads as true whatever the save looks
 * like - no figures in it, because a hardcoded figure that disagrees with the
 * player's actual quarter is worse than no message.
 */
const seedThreads = (): Thread[] => [
    {
        id: 'ops-lead',
        name: 'Dana Whitfield',
        role: 'Head of Production',
        initials: 'DW',
        unread: 1,
        messages: [
            {
                id: 'ops-1',
                from: 'them',
                text: 'Congratulations on the launch. I mean that.',
                atMonth: 1,
            },
            {
                id: 'ops-2',
                from: 'them',
                text: 'Second thing, less pleasant: the line runs on the crew you give it, not on the target you set. If those two disagree, the target loses. I would rather you heard that from me than from a quarterly report.',
                atMonth: 1,
            },
        ],
    },
];

export const initialMessageState: MessageState = {
    threads: seedThreads(),
    _hasHydrated: false,
};

export const useMessageStore = create<MessageStore>()(
    persist(
        (set) => ({
            ...initialMessageState,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            clearConversation: (threadId) =>
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId ? { ...t, conversationId: undefined } : t),
                })),

            markRead: (threadId) =>
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId ? { ...t, unread: 0 } : t),
                })),

            sendFromPlayer: (threadId, text, atMonth) =>
                set(state => ({
                    threads: state.threads.map(t =>
                        t.id === threadId
                            ? {
                                ...t,
                                messages: [
                                    ...t.messages,
                                    { id: `${threadId}-${t.messages.length + 1}`, from: 'player', text, atMonth },
                                ],
                            }
                            : t),
                })),

            sendFromCharacter: (who, text, atMonth) =>
                set(state => {
                    const existing = state.threads.find(t => t.id === who.id);
                    const message: Message = {
                        id: `${who.id}-${(existing?.messages.length ?? 0) + 1}`,
                        from: 'them',
                        text,
                        atMonth,
                    };
                    if (!existing) {
                        return {
                            threads: [
                                {
                                    id: who.id,
                                    name: who.name,
                                    role: who.role,
                                    initials: initials(who.name),
                                    messages: [message],
                                    unread: 1,
                                },
                                ...state.threads,
                            ],
                        };
                    }
                    // Newest thread first: a reply moves its thread to the top,
                    // which is what every messaging app does and what makes an
                    // unread count findable.
                    const others = state.threads.filter(t => t.id !== who.id);
                    return {
                        threads: [
                            { ...existing, messages: [...existing.messages, message], unread: existing.unread + 1 },
                            ...others,
                        ],
                    };
                }),

            reset: () => set({ ...initialMessageState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_messages_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({ threads: state.threads }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

/** Total unread across every thread - the badge on the home screen icon. */
export const unreadCount = (threads: Thread[]): number =>
    threads.reduce((n, t) => n + t.unread, 0);
