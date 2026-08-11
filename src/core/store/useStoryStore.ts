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

export type StoryState = {
    dials: Dials;
    /** Set membership, stored as a map because JSON has no Set. */
    flags: Partial<Record<StoryFlag, true>>;
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

    reset: () => void;
};

export const initialStoryState: StoryState = {
    dials: { ...INITIAL_DIALS },
    flags: {},
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

            reset: () => set({
                dials: { ...INITIAL_DIALS },
                flags: {},
                _hasHydrated: true,
            }),
        }),
        {
            name: 'succesor_story_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({ dials: state.dials, flags: state.flags }),
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
                };
            },
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
