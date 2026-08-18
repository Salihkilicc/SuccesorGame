// src/core/store/useStoryStore.ts
//
// ============================================================================
//  WHERE THE STORY'S MEMORY LIVES
// ============================================================================
//
//  Dials, flags, and nothing else. Deliberately small: this store is read by
//  every conversation in the game, so anything that gets added here is a cost
//  paid forever.
//
//  IT IS WIPED BY A NEW GAME, unlike useIdentityStore. Your name outlives a
//  run; your brother's opinion of you does not. A new company means the same
//  person walking into the same room and finding out whether it goes
//  differently this time.
//
//  Nothing here knows what a conversation is. The store holds state; the
//  vocabularies in core/story/effects.ts and conditions.ts are the only things
//  allowed to move it. That separation is what stops a scene reaching in and
//  setting a dial to whatever it feels like.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../../storage/persist';
import {
    INITIAL_DIALS,
    clampDial,
    type Dial,
    type Dials,
    type StoryFlag,
} from '../story/state';
import { nextPriority, type Pending } from '../story/inbox';
import { emptyHistory, type EventHistory } from '../events/types';
import { emptyLockState, type LockState } from '../tutorial/locks';

import type { Effect } from '../story/effects';

/**
 * One line of a scene as the player read it.
 *
 * The TEXT rather than a key, because it was resolved through the dictionary
 * when the card arrived and the player may have changed language since. What
 * they read is what they should find when they come back.
 */
export type Said = { from: 'them' | 'player'; text: string; effects?: Effect[] };

/** Where a scene was left, and everything said up to that point. */
export type SceneProgress = {
    /** The card on screen. `null` when the scene has been played out. */
    nodeId: string | null;
    history: Said[];
};

export type StoryState = {
    dials: Dials;
    /** Set membership, stored as a map because JSON has no Set. */
    flags: Partial<Record<StoryFlag, true>>;
    /**
     * Conversations waiting to arrive.
     *
     * Persisted, because a reply promised for next quarter has to survive the
     * app being closed - otherwise the one mechanic that makes a big company
     * feel big is also the one that quietly forgets.
     */
    pending: Pending[];
    /**
     * Which teaching locks are done with. Per RUN, because the first year
     * happens again in a new company - the memory of having seen it is a
     * different thing and lives on the player (useIdentityStore).
     */
    locks: LockState;
    /**
     * When each random event last fired.
     *
     * Persisted with the rest of the story, because a cooldown that resets on
     * app launch is not a cooldown - the same event would arrive every time
     * the player came back to the game, which is precisely when they would
     * notice the repetition.
     */
    eventHistory: EventHistory;
    /**
     * Conversation ids that have already been put in front of the player once.
     *
     * A list rather than a StoryFlag per scene: flags are a closed union and
     * naming irreversible FACTS, and "scene 14 has been shown" is neither
     * interesting enough to be a fact nor something the union should grow by
     * one for every scene written.
     *
     * Distinct from `pending`, which is drained - by the time a scene has been
     * delivered there is nothing left in the queue to say it ever happened.
     */
    seenScenes: string[];
    /**
     * The ending that has been reached, if any. An id from data/story/endings.
     *
     * Persisted: a player who closes the app on the last screen should not
     * come back to a running company they no longer own.
     */
    ending: string | null;
    /**
     * WHERE THE PLAYER GOT TO IN A SCENE THEY HAVE NOT FINISHED.
     *
     * The runner held its position in component state, so backing out of a
     * conversation halfway - the back arrow, the tab bar, the home gesture -
     * threw it away and re-opening started the scene from its first card.
     *
     * That is not merely annoying. The runner applies effects as answers are
     * picked, so the half a scene the player had already played was applied
     * again: dials nudged twice, money moved twice, a `schedule` firing a
     * second copy of whatever it queued. The story quietly diverged from
     * itself in the middle of a save.
     *
     * Keyed by CONVERSATION id, not by thread or mail id, because the scene
     * is the thing with a position in it - and the same id is what both
     * channels look it up by.
     *
     * `nodeId: null` means finished. That is worth storing rather than
     * deleting: a letter stays in the inbox after it has been answered, and
     * re-opening it should show what was said, not an empty scene or a
     * replay.
     */
    sceneProgress: Record<string, SceneProgress>;
    _hasHydrated: boolean;
};

type StoryStore = StoryState & {
    setHasHydrated: (v: boolean) => void;

    /**
     * Move a dial by a delta, clamped to 0-100.
     *
     * A delta rather than an absolute value, and that is not a detail: three
     * scenes that each nudge hostility up should compound. Setting absolutes
     * means the last scene to run silently erases the first two.
     */
    nudge: (dial: Dial, delta: number) => void;

    /** Facts only go one way. There is no `clearFlag` on purpose. */
    raise: (flag: StoryFlag) => void;
    has: (flag: StoryFlag) => boolean;

    /**
     * Queue a conversation for a later quarter.
     *
     * Priority is assigned here rather than by the caller, from the order
     * things were scheduled. That is what makes a wave arrive in the order it
     * was written instead of whatever order the effects happened to run in.
     */
    schedule: (item: {
        conversationId: string;
        dueQuarter: number;
        urgent?: boolean;
        expiresAfter?: number;
        queuedAtQuarter: number;
    }) => void;
    /** Replace the queue. The tick calls this with what drain kept. */
    setPending: (pending: Pending[]) => void;

    /** Record which events fired this quarter. See core/events/runQuarter.ts */
    setEventHistory: (history: EventHistory) => void;

    /** Remember that a scene has been shown, so it is not shown twice. */
    markSceneSeen: (conversationId: string) => void;

    /** Stop the game. See data/story/endings.ts for the ids. */
    endGame: (endingId: string) => void;

    /**
     * Write down where the player is in a scene. Called on every answer, so
     * the position on disk is never more than one card behind the screen.
     */
    saveScene: (conversationId: string, progress: SceneProgress) => void;
    /**
     * Forget a scene's position.
     *
     * For a scene whose transcript has been moved somewhere permanent - a
     * message thread keeps what was said as ordinary messages - so the saved
     * copy would be a second one.
     */
    clearScene: (conversationId: string) => void;

    /** A lock cleared by doing the thing. */
    completeLock: (id: string) => void;
    /** A lock the player walked away from. Recorded apart, so it is visible. */
    skipLock: (id: string) => void;
    /** Turn the whole thing off. */
    disableTutorial: () => void;

    reset: () => void;
};

export const initialStoryState: StoryState = {
    dials: { ...INITIAL_DIALS },
    flags: {},
    pending: [],
    locks: emptyLockState(),
    eventHistory: emptyHistory(),
    seenScenes: [],
    ending: null,
    sceneProgress: {},
    _hasHydrated: false,
};

export const useStoryStore = create<StoryStore>()(
    persist(
        (set, get) => ({
            ...initialStoryState,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            nudge: (dial, delta) =>
                set(state => ({
                    dials: { ...state.dials, [dial]: clampDial(state.dials[dial] + delta) },
                })),

            raise: (flag) =>
                set(state => (state.flags[flag] ? state : { flags: { ...state.flags, [flag]: true } })),

            has: (flag) => !!get().flags[flag],

            schedule: (item) =>
                set(state => ({
                    pending: [
                        ...state.pending,
                        {
                            ...item,
                            id: `${item.conversationId}@${item.dueQuarter}#${state.pending.length}`,
                            priority: nextPriority(state.pending, item.dueQuarter),
                        },
                    ],
                })),

            setPending: (pending) => set({ pending }),

            setEventHistory: (eventHistory) => set({ eventHistory }),

            endGame: (endingId) => set({ ending: endingId }),

            saveScene: (conversationId, progress) =>
                set(state => ({
                    sceneProgress: { ...state.sceneProgress, [conversationId]: progress },
                })),

            clearScene: (conversationId) =>
                set(state => {
                    if (!state.sceneProgress[conversationId]) return state;
                    const next = { ...state.sceneProgress };
                    delete next[conversationId];
                    return { sceneProgress: next };
                }),

            markSceneSeen: (id) =>
                set(state => (state.seenScenes.includes(id) ? state : {
                    seenScenes: [...state.seenScenes, id],
                })),

            completeLock: (id) =>
                set(state => (state.locks.completed.includes(id) ? state : {
                    locks: { ...state.locks, completed: [...state.locks.completed, id] },
                })),

            skipLock: (id) =>
                set(state => (state.locks.skipped.includes(id) ? state : {
                    locks: { ...state.locks, skipped: [...state.locks.skipped, id] },
                })),

            disableTutorial: () => set(state => ({ locks: { ...state.locks, disabled: true } })),

            reset: () => set({
                dials: { ...INITIAL_DIALS },
                flags: {},
                pending: [],
                locks: emptyLockState(),
                // Otherwise the second run starts with every event on cooldown
                // from the first, and a new company would have a quiet decade.
                eventHistory: emptyHistory(),
                seenScenes: [],
                ending: null,
                // A new company plays the same scenes again from the top.
                sceneProgress: {},
                _hasHydrated: true,
            }),
        }),
        {
            name: 'succesor_story_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                dials: state.dials, flags: state.flags, pending: state.pending,
                locks: state.locks, eventHistory: state.eventHistory,
                seenScenes: state.seenScenes, ending: state.ending,
                sceneProgress: state.sceneProgress,
            }),
            /**
             * A save made before a dial existed has no value for it, and
             * `undefined + 5` is NaN - which would spread silently through
             * every comparison that reads it. Fill the gaps on the way in.
             */
            merge: (persisted, current) => {
                const p = (persisted ?? {}) as Partial<StoryState>;
                return {
                    ...current,
                    ...p,
                    dials: { ...INITIAL_DIALS, ...(p.dials ?? {}) },
                    flags: { ...(p.flags ?? {}) },
                    // Saves written before scenes remembered their position.
                    sceneProgress: { ...(p.sceneProgress ?? {}) },
                    pending: p.pending ?? [],
                    locks: p.locks ?? emptyLockState(),
                    // Saves made before events existed have no history. An
                    // undefined here would make `history.lastFired[id]` throw
                    // on the first tick after an update.
                    eventHistory: p.eventHistory ?? emptyHistory(),
                    seenScenes: p.seenScenes ?? [],
                    ending: p.ending ?? null,
                };
            },
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
