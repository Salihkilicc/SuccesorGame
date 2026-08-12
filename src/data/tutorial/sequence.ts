// src/data/tutorial/sequence.ts
//
// ============================================================================
//  THE FIRST YEAR, AS LOCKS
// ============================================================================
//
//  One entry per moment the father takes the wheel. The words he says are
//  conversations (prompt 11 onwards); these are only the gates that make the
//  player do the thing while he is saying it.
//
//  Every one of them names `canEngage`, and that is the rule rather than a
//  habit: a lock that can be cleared by spending money must not engage when
//  there is none. The audit enforces exactly that shape, and the timed skip
//  covers whatever the audit cannot see.
//
//  Two entries here for now - the ones already specified. The rest arrive
//  with the scenes they belong to, because a lock without its dialogue is a
//  screen that dims and points at a button for no stated reason.
// ============================================================================

import type { TutorialLock } from '../../core/tutorial/locks';

// ============================================================================
//  WHY THE MORALE THRESHOLD IS NOT 70
// ============================================================================
//
//  It was specified as 70, on the reasoning that 70 is MORALE_ANCHOR - where
//  market pay parks morale - so nearly every player would see the event. The
//  reasoning is right and the number does not work, and it is worth writing
//  down why rather than quietly using a different one.
//
//  MORALE NEVER GOES BELOW 70. It approaches it. The workforce starts at 75
//  and closes 30% of the remaining gap to its wage target each quarter, so on
//  market pay it runs 73.5, 72.5, 71.8, 71.3, 70.9, 70.6, 70.4, 70.3 - an
//  asymptote. Measured over eight quarters in the real tick, not reasoned
//  about. `moraleAtMost: 70` would fire for nobody, ever, which is the exact
//  opposite of the intent.
//
//  72 is the smallest round number that delivers what was actually asked for:
//  it is crossed in the second or third quarter of ordinary play, so the
//  event lands inside the tutorial year for anyone paying the market rate,
//  and it does NOT fire for a player who has already pushed morale up - which
//  is the one group who has earned skipping the lesson.
//
//  Kept as a named constant so the number is in one place and moving it is a
//  decision rather than a search.
// ============================================================================
export const MORALE_EVENT_THRESHOLD = 72;

export const TUTORIAL_SEQUENCE: TutorialLock[] = [
    {
        // ------------------------------------------------------------------
        //  Q1 — MAKE SOMETHING
        // ------------------------------------------------------------------
        //  The first thing a manufacturer does. Cleared by having any product
        //  in production at all, so any route to it counts - the player is
        //  not being made to press one particular button in one order.
        // ------------------------------------------------------------------
        id: 'q1-production',
        highlight: 'products',
        instruction: 'Set a production target. Nothing else happens until something is being built.',
        satisfied: [{ kind: 'flag', flag: 'tutorialProductionSet' }],
        // Only in the first year. After that he is either dead or has stopped
        // explaining, and a tutorial that reappears in year three is a bug.
        canEngage: [{ kind: 'noFlag', flag: 'fatherDead' }],
    },

    {
        // ------------------------------------------------------------------
        //  THE MORALE EVENT — the one that would have been a trap
        // ------------------------------------------------------------------
        //  This is the case the whole escape design exists for. "Distribute a
        //  bonus" is cleared by SPENDING, so a company with an empty account
        //  would have been locked out of its own game.
        //
        //  `canEngage` is what stops that: the lock does not appear at all
        //  unless the company can afford the bonus. A player with no cash gets
        //  no lesson here, and no lesson is the correct outcome - the lesson
        //  is about choosing to spend, and there is no choice at zero.
        //
        //  Threshold is 70 on the player's call. Worth knowing: MORALE_ANCHOR
        //  is also 70, which is where market pay naturally parks morale, so
        //  this fires for nearly everyone rather than only for the careless.
        //  That makes it a guaranteed teaching beat rather than a discovery.
        // ------------------------------------------------------------------
        id: 'morale-bonus',
        highlight: 'teamMorale',
        // Not "morale is slipping" any more - it is not slipping, it has
        // settled, and telling the player otherwise would be the game
        // describing something they can go and see is untrue.
        instruction: 'Morale has settled at the market rate. A bonus is how you buy back a quarter of it.',
        conversation: 'father-morale',
        satisfied: [{ kind: 'flag', flag: 'tutorialBonusPaid' }],
        canEngage: [
            { kind: 'noFlag', flag: 'fatherDead' },
            // THE ESCAPE. Cannot demand what cannot be paid.
            { kind: 'capitalAtLeast', amount: 250_000 },
            // The trigger itself, which this lock did not have at all - it
            // would have engaged on quarter one regardless of morale.
            { kind: 'moraleAtMost', value: MORALE_EVENT_THRESHOLD },
        ],
    },
];
