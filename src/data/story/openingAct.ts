// src/data/story/openingAct.ts
//
// ============================================================================
//  THE FIRST YEAR, NAMED, SO IT CAN BE SKIPPED
// ============================================================================
//
//  The opening act is fixed: the father explains the company, teaches four
//  lessons, starts a sentence he does not finish, and dies. Pear writes a
//  fortnight later. Four people send condolences.
//
//  It is the best writing in the game and it is the same writing every time,
//  and this is a game somebody will finish more than once. A second run should
//  not open with a compulsory year of a man the player has already buried.
//
//  ---------------------------------------------------------------------------
//  WHY A LIST AND NOT A RULE
//  ---------------------------------------------------------------------------
//  The tempting version derives it: everything `from: 'father'`, plus anything
//  whose id starts with 'condolence-'. That would be correct today and would
//  quietly stop being correct the first time somebody writes an opening beat
//  from the CFO - and the failure is silent, because a skipped run would simply
//  receive one scene it should not have.
//
//  So it is written down, and `openingAct.test.ts` checks that every id here
//  resolves and that nothing gated on the first eight quarters has been left
//  out. The list is the statement; the test is what keeps it true.
// ============================================================================

/**
 * Every conversation that belongs to the opening act.
 *
 * Ordered as the player meets them, which is not load-bearing but makes the
 * list readable as the story rather than as a set.
 */
export const OPENING_ACT: readonly string[] = [
    // The father, quarter by quarter.
    'father-inheritance',
    'father-q1',
    'father-q1-invoice',
    'father-morale',
    'father-marketing',
    'father-q4',

    // The phone call.
    'father-death',

    // And what follows it.
    'pear-offer',
    'condolence-friend',
    'condolence-cfo-mail',
    'condolence-cfo-message',
    'condolence-brother',
    'condolence-board',
    'condolence-friend-public',
    'condolence-cfo-public',
    'condolence-brother-public',
    'condolence-board-public',
] as const;

/**
 * What is true about the world once the act has been skipped.
 *
 * ONLY THE FATHER'S DEATH. It is the one thing the rest of the game reads, and
 * it is not a decision - he dies whatever the player does.
 *
 * `refusedPear` and `refusedPearPublicly` are deliberately NOT raised. They are
 * consequences of a choice, and a player who skipped the act did not make it;
 * inventing an answer on their behalf would put them in a world where people
 * refer to something they never said. The public condolences simply do not
 * fire, which is the correct outcome for a run where the refusal never
 * happened.
 */
export const SKIPPED_ACT_FLAGS = ['fatherDead'] as const;
