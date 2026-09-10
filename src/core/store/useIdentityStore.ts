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
    /**
     * WHO IS IN THE CHAIR, when it is no longer the person who started.
     *
     * Undefined for the founder, and a child's id after a succession. It is
     * what lets the profile header show the heir you watched grow up rather
     * than reusing the founder's portrait for a different person, and
     * `planSuccession` was already computing it - `plan.ceo.id` - and
     * throwing it away here.
     *
     * OPTIONAL by migration decision, the same as `gender` on a partner:
     * every save written before this field has none, and the founder legitimately
     * has none either. Absent means the founder, which is the right answer
     * for both.
     */
    ceoId?: string;
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
    /**
     * Whether this player has watched the opening act end.
     *
     * ------------------------------------------------------------------
     *  AND WHY IT IS NOT `tutorialCompleted`
     * ------------------------------------------------------------------
     *  The "play the first year again, or skip it" question was gated on
     *  `tutorialCompleted`, and that flag turns true only when EVERY lock in
     *  TUTORIAL_SEQUENCE is cleared. Two of the six need the player to open
     *  the research page; three only engage while the father is alive; one of
     *  those also needs morale to fall below a threshold inside that same
     *  window.
     *
     *  So a run where the team stayed happy, or where research was never
     *  opened, could never complete the tutorial - and the player was never
     *  offered the skip, forever, on every new game. Reported as the feature
     *  having disappeared, and it had.
     *
     *  This is a single beat instead of a conjunction of six. The opening act
     *  is over when the father is dead; that is what the act is built around
     *  and what the rest of the game gates on. A flag that needs several
     *  things to all happen is the same bug wearing a different name.
     * ------------------------------------------------------------------
     */
    openingSeen: boolean;
    /**
     * How many runs this player has started, ever.
     *
     * ------------------------------------------------------------------
     *  BECAUSE THE QUESTION IS ABOUT RESTARTING, NOT ABOUT REMEMBERING
     * ------------------------------------------------------------------
     *  The skip question was gated first on `tutorialCompleted`, then on
     *  `openingSeen`, and both times it stayed shut for the people who wanted
     *  it. Each was an INFERENCE - a chain of story bookkeeping standing in
     *  for a plain fact - and each chain had a link that could be missing.
     *
     *  The fact the question actually needs is the one it was asked for:
     *  "yeniden baslayinca". Is this a restart? That has no chain. It is a
     *  counter, incremented in one place, persisted outside the wipe like the
     *  player's name and their endings.
     *
     *  `openingSeen` stays, because it answers a narrower question honestly -
     *  whether the act has been watched - and because a first run that got
     *  past the funeral and then chose New Game should be offered the skip
     *  too. Either is enough.
     * ------------------------------------------------------------------
     */
    runsStarted: number;
    /**
     * Which endings this person has reached, across every run.
     *
     * Here for the same reason `tutorialCompleted` is: it is a fact about the
     * PLAYER, not about a company. A run is wiped by a new game and what you
     * have seen is not, and the closing screen's "2 of 3 endings found" would
     * mean nothing if it reset every time it was shown.
     *
     * Ids from data/story/endings.ts. Stored as an array rather than a Set
     * because this is persisted as JSON, and de-duplicated on write.
     */
    endingsSeen: string[];
    /**
     * The name the PLAYER chose, as opposed to the one they are wearing.
     *
     * A succession overwrites `firstName` with the heir's, which is correct
     * while that run is going: the home screen, the letters and the honorific
     * all have to say Elena. But the identity store is the one thing a new
     * game does not wipe, so without this the next run opens as Elena too, and
     * the player is never asked, because `created` is still true.
     *
     * So `firstName` is who you are PLAYING and this is who you ARE. A new
     * game puts it back.
     */
    ownFirstName: string;
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
    markOpeningSeen: () => void;
    /** Called by startNewGame, once, before anything is torn down. */
    countRunStarted: () => void;
    /**
     * Ask the player who they are again.
     *
     * -----------------------------------------------------------------------
     *  WHY THIS IS ONE FIELD AND NOT A WIPE
     * -----------------------------------------------------------------------
     *  Asked for as "we cannot change our gender or our name; a button under
     *  New Game that changes your character, and the company name too, so it
     *  is like starting from scratch".
     *
     *  RootNavigator already decides what to ask from DATA rather than from a
     *  flag: no identity means ask everything, identity but no company means
     *  ask the company only. So this does not need a new screen, a new route
     *  or a new mode. Setting `created` back to false is the whole feature;
     *  the full form appears by itself and writes the same fields it wrote on
     *  the first launch.
     *
     *  WHAT IT DELIBERATELY KEEPS: `runsStarted`, `openingSeen`,
     *  `endingsSeen` and `tutorialCompleted`. Those are facts about the
     *  PERSON HOLDING THE PHONE, not about the character. Somebody who has
     *  read four endings has still read them after choosing a new name, and
     *  being offered the tutorial again because you changed your name would
     *  be the feature punishing you for using it.
     *
     *  `ownFirstName` is left too, and is overwritten by `setIdentity` a
     *  moment later. Clearing it here would leave a window where the game
     *  knows nobody at all.
     */
    forgetIdentity: () => void;
    /**
     * Records that the player reached this ending. Idempotent.
     *
     * Called from the closing overlay rather than from `endGame`, so that an
     * ending which is written but never rendered - the game store's write
     * happens inside a tick the player may not have finished watching - does
     * not count as seen. What this collection means is "I have READ this
     * one", which is why it is safe to show a total next to it.
     */
    markEndingSeen: (id: string) => void;
};

export const initialIdentityState: IdentityState = {
    firstName: '',
    lastName: '',
    gender: 'male',
    // Undefined, not a string: the founder has no separate id, they are the
    // player. See the note on the field.
    ceoId: undefined,
    created: false,
    tutorialCompleted: false,
    openingSeen: false,
    runsStarted: 0,
    endingsSeen: [],
    ownFirstName: '',
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
                    // Recorded at the same moment and from the same answer, so
                    // the two cannot be given different values by accident.
                    ownFirstName: tidy(firstName),
                    lastName: tidy(lastName),
                    gender,
                    // A new identity is a new founder, so any chair holder
                    // left over from a previous run is cleared. Without this
                    // a second playthrough would open showing the last run's
                    // heir in the header.
                    ceoId: undefined,
                    created: true,
                });
                return { ok: true };
            },
            markTutorialCompleted: () => set({ tutorialCompleted: true }),
            markOpeningSeen: () => set({ openingSeen: true }),
            countRunStarted: () => set(state => ({ runsStarted: (state.runsStarted || 0) + 1 })),
            // One field. See the note on the type above for what it keeps and
            // why the navigator needs nothing else to show the full form.
            forgetIdentity: () => set({ created: false }),
            markEndingSeen: (id) => set(state => (
                state.endingsSeen.includes(id)
                    ? state
                    : { endingsSeen: [...state.endingsSeen, id] }
            )),
        }),
        {
            name: 'succesor_identity_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                firstName: state.firstName,
                lastName: state.lastName,
                gender: state.gender,
                ceoId: state.ceoId,
                created: state.created,
                tutorialCompleted: state.tutorialCompleted,
                // Persisted, and NOT reset by newGame - this store is not in
                // its reset list on purpose. What you have watched outlives a
                // run, the same way your own name does.
                openingSeen: state.openingSeen,
                runsStarted: state.runsStarted,
                endingsSeen: state.endingsSeen,
                ownFirstName: state.ownFirstName,
            }),
            onRehydrateStorage: () => (state) => {
                // A save written before this field existed rehydrates without
                // it, and `endingsSeen.includes` on undefined throws on the
                // last screen of the game. zustand's persist MERGES, so the
                // initial [] does not survive a partial rehydrate.
                if (state && !Array.isArray(state.endingsSeen)) state.endingsSeen = [];
                // Saves written before a succession existed have no record of
                // the player's own name, and the one they are wearing is the
                // only one there has ever been.
                if (state && !state.ownFirstName) state.ownFirstName = state.firstName;

                // ------------------------------------------------------------
                //  A PLAYER WHO EXISTED BEFORE THE COUNTER DID
                // ------------------------------------------------------------
                //  `runsStarted` is incremented by startNewGame, so it can only
                //  count runs begun after it was written. For everybody already
                //  playing it rehydrates as undefined, which reads as zero,
                //  which reads as "first run" - and the skip question stayed
                //  shut for exactly the people who had been asking for it.
                //
                //  That is the same shape as the two gates before it: a fact
                //  inferred from bookkeeping that did not exist yet. The
                //  difference is that this one has an honest answer at
                //  rehydrate time. A save with an IDENTITY in it belongs to
                //  somebody who has been playing; `created` is written when
                //  they named themselves, and it survives every new game.
                //
                //  So they are credited with the run they have already had.
                //  One, not more: the counter is not a history, it only has to
                //  answer whether this is a restart.
                // ------------------------------------------------------------
                if (state && state.created && typeof state.runsStarted !== 'number') {
                    state.runsStarted = 1;
                }
                if (state && typeof state.runsStarted !== 'number') state.runsStarted = 0;

                state?.setHasHydrated(true);
            },
        },
    ),
);

/** Re-exported so callers validating a company name have one import. */
export { checkCompany };
