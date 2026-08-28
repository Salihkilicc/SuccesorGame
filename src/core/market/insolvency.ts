// src/core/market/insolvency.ts
//
// ============================================================================
//  ONE BAD QUARTER USED TO BE THE WHOLE GAME
// ============================================================================
//
//  Asked as "is it hard to come back when you are heading for the wall?" It
//  was not hard, it was impossible: `companyCapital < 0` for a single quarter
//  ended the run. No overdraft, no grace, no emergency financing, and no
//  warning that the quarter you were about to close would be the last one.
//
//  Measured. A tier three company with $0.3M in the bank, cutting costs:
//
//      q1  +$0.41M
//      q2  +$0.62M
//      q4  -$0.84M   <- game over
//
//  With the ending suppressed and the same company allowed to carry on:
//
//      q8  +$0.75M   q12 +$1.74M   q20 +$4.75M   q48 +$23.69M
//
//  Four quarters after the wall it was solvent again, and twelve years later
//  it was worth twenty three million. The near death and the comeback is a
//  whole shape of play the game could not contain.
//
//  WORSE, IT RAN BACKWARDS. From the identical starting position, the player
//  who CUT COSTS died at q4 and the player who kept spending finished at
//  $32.67M. Cutting marketing lowers brand, brand lowers demand, and demand
//  is the revenue. Nothing on any screen said so, so the intuitive move was
//  the fatal one.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS IS NOT
//  ---------------------------------------------------------------------------
//  It is not an overdraft: no money is lent, no interest is charged, and the
//  capital really is negative for as long as it is negative. It is a grace
//  period on the ENDING - the quarters a real company spends in the hands of
//  its creditors before the doors are actually shut.
//
//  The counter resets the moment capital is positive again, deliberately. A
//  company that claws its way back to zero has done the thing being asked of
//  it, and starting the clock again from where it left off would make the
//  second crisis unsurvivable for no reason anybody could name.
// ============================================================================

/**
 * How many quarters you may sit below zero before the run ends.
 *
 * Four, measured rather than picked: the tier three case above was negative
 * at q4 and positive again by q8, so anything under three would still have
 * killed it. Four is the shortest number that leaves room for the recovery
 * that was actually there, and it is short enough that the player can feel
 * the clock.
 */
export const INSOLVENCY_GRACE_QUARTERS = 4;

/**
 * The counter, one quarter on.
 *
 * @param previous  how many consecutive quarters were already negative
 * @param capital   the capital at the END of the quarter being closed
 */
export const advanceInsolvency = (previous: number | undefined, capital: number): number => {
    if (!(capital < 0)) return 0;
    return Math.max(0, previous || 0) + 1;
};

/**
 * Is the run over?
 *
 * Strictly greater, so the grace really is four whole quarters: the fourth
 * negative quarter is survivable and the fifth is not.
 */
export const isInsolvencyTerminal = (quartersNegative: number | undefined): boolean =>
    Math.max(0, quartersNegative || 0) > INSOLVENCY_GRACE_QUARTERS;

/**
 * Quarters left before the doors shut. Zero means this is the last one.
 *
 * For the screen. A clock the player cannot see is the same as no clock, and
 * the whole complaint was that the ending arrived without warning.
 */
export const insolvencyQuartersLeft = (quartersNegative: number | undefined): number =>
    Math.max(0, INSOLVENCY_GRACE_QUARTERS - Math.max(0, quartersNegative || 0));
