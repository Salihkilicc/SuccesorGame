// @survives-new-game who you are is not part of a run. The company is wiped
// and rebuilt; the person starting it is the same person, and the player said
// so: the name is asked once and edited from Profile afterwards.
//
// src/core/store/useIdentityStore.ts
//
// ============================================================================
//  THE PLAYER, AS OPPOSED TO THE SAVE
// ============================================================================
//
//  Every other persisted store in this project is game state and is deleted
//  when a new game starts. This one is deliberately NOT in PERSIST_KEYS, and
//  that is the whole reason it exists as its own store rather than three more
//  fields on useUserStore.
//
//  Keeping it in useUserStore would have meant either losing the name on every
//  new game, or carving an exception into the wipe - and an exception inside a
//  wipe is precisely the shape of bug newGame.ts was written to end. A
//  separate key cannot be half-cleared.
//
//  `created` is what the app checks to decide whether to ask. It is not
//  derivable from the names being non-empty, because a returning player who
//  clears their name in Profile should not be sent back through onboarding.
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../../storage/persist';
import { checkCompany, checkName, tidy, type Gender } from '../identity';

export type IdentityState = {
    firstName: string;
    lastName: string;
    gender: Gender;
    /** Has the player been through onboarding at least once? */
    created: boolean;
    /**
     * Has the first year been finished once, on any run?
     *
     * Here rather than in the story store because it is a fact about the
     * PERSON, not the company: someone who has been taught does not need
     * teaching again in their second company. It is what puts a "skip the
     * tutorial" offer on the second playthrough and not the first.
     */
    tutorialCompleted: boolean;
    _hasHydrated: boolean;
};

type IdentityStore = IdentityState & {
    setHasHydrated: (v: boolean) => void;
    /**
     * Write the identity. Validates again here rather than trusting the
     * screen: the screen is one caller, and the rules should not be
     * enforceable only by the path that happens to be wired up today.
     */
    setIdentity: (v: { firstName: string; lastName: string; gender: Gender }) =>
        { ok: true } | { ok: false; reason: string };
    /** Called when the last lock clears. Never unset. */
    markTutorialCompleted: () => void;
};

export const initialIdentityState: IdentityState = {
    firstName: '',
    lastName: '',
    gender: 'male',
    created: false,
    tutorialCompleted: false,
    _hasHydrated: false,
};

export const useIdentityStore = create<IdentityStore>()(
    persist(
        (set) => ({
            ...initialIdentityState,
            setHasHydrated: (v) => set({ _hasHydrated: v }),
            setIdentity: ({ firstName, lastName, gender }) => {
                const first = checkName(firstName, 'A first name');
                if (!first.ok) return first;
                const last = checkName(lastName, 'A last name');
                if (!last.ok) return last;

                set({
                    firstName: tidy(firstName),
                    lastName: tidy(lastName),
                    gender,
                    created: true,
                });
                return { ok: true };
            },
            markTutorialCompleted: () => set({ tutorialCompleted: true }),
        }),
        {
            name: 'succesor_identity_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                firstName: state.firstName,
                lastName: state.lastName,
                gender: state.gender,
                created: state.created,
                tutorialCompleted: state.tutorialCompleted,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

/** Re-exported so callers validating a company name have one import. */
export { checkCompany };
