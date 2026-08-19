// src/core/story/runMortality.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE GAME
// ============================================================================
//
//  mortality.ts is the curve and the rule. This is the quarter.
//
//  ---------------------------------------------------------------------------
//  IT ENDS THE GAME THROUGH THE STORY STORE, LIKE EVERYTHING ELSE
//  ---------------------------------------------------------------------------
//  Not through a status on the tick's result. `EconomyResult.status` carries
//  the two outcomes the SIMULATION produces - capital went negative, the board
//  voted - and death is not one of those: it does not come out of the quarter's
//  arithmetic and it has nothing to do with how the company did.
//
//  Writing it to `useStoryStore.ending` also means it survives a reload, which
//  matters more here than anywhere. A player who closes the app on this screen
//  must not reopen it alive.
//
//  ---------------------------------------------------------------------------
//  WHICH ENDING, AND THE SEAM THAT IS COMING
//  ---------------------------------------------------------------------------
//  Two, and the difference is whether anybody is old enough to take over.
//
//  `diedInOffice` is NOT a placeholder for the succession. The plan is that
//  the closing screen grows a "carry on as the heir" button next to New Game,
//  and this ending is what sits behind it either way: it is written to be read
//  by somebody about to continue AND by somebody who would rather stop. The
//  run ending here is the honest state of the game today, and the day the
//  button exists, not one word of this file's output changes.
// ============================================================================

import { useGameStore } from '../store/useGameStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStoryStore } from '../store/useStoryStore';
import { diesThisQuarter, successorFor, type Candidate } from './mortality';

export type MortalityOutcome = {
    died: boolean;
    /** Who would take over. Null when nobody is of age. */
    successor: Candidate | null;
    /** The id written to the story store, when one was. */
    ending: string | null;
};

const ALIVE: MortalityOutcome = { died: false, successor: null, ending: null };

/**
 * One quarter of being mortal.
 *
 * Returns what it did rather than writing and staying silent, so the tick's
 * test can assert on it without reading two stores. `roll` is injected only by
 * tests; the game passes nothing.
 */
export const runMortality = (roll?: () => number): MortalityOutcome => {
    // ------------------------------------------------------------------
    //  A GAME THAT IS ALREADY OVER DOES NOT ALSO END
    // ------------------------------------------------------------------
    //  Bankruptcy and the board removal are decided in the same tick as
    //  this. Without the guard, a player whose capital went negative in
    //  the quarter they were due to die would have the death overwrite the
    //  bankruptcy notice, and the last thing they read would be about the
    //  wrong event entirely.
    // ------------------------------------------------------------------
    const story = useStoryStore.getState();
    if (story.ending) return ALIVE;

    const age = useGameStore.getState().age ?? 0;
    if (!diesThisQuarter(age, roll ?? Math.random)) return ALIVE;

    const family = useFamilyStore.getState();
    const children: Candidate[] = (family.children ?? [])
        .map((c: any) => ({ id: c.id, age: c.age ?? 0 }));

    const successor = successorFor(children, family.designatedSuccessorId ?? null);
    const ending = successor ? 'diedInOffice' : 'diedWithoutAnHeir';

    story.endGame(ending);
    if (__DEV__) {
        console.log(`[mortality] died at ${age}, successor: ${successor?.id ?? 'nobody'}`);
    }

    return { died: true, successor, ending };
};
