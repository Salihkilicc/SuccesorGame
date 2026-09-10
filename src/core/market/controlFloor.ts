// src/core/market/controlFloor.ts
//
// ============================================================================
//  THE FLOOR UNDER THE CHAIR
// ============================================================================
//
//  Asked for as: if my holding falls below ten per cent the game should end,
//  otherwise a lot of sharp practice becomes possible.
//
//  He is right about the sharp practice. Nothing in the game required the
//  player to hold ANY of it. A player could dilute themselves to two per cent
//  raising money they never had to repay, sell every share they owned into a
//  price they had just moved, and keep running the company from a chair the
//  register no longer entitled them to sit in. The board can vote them out,
//  but that needs three conditions to line up; falling to two per cent needs
//  only a spreadsheet.
//
//  ---------------------------------------------------------------------------
//  ONE QUARTER OF WARNING, AND IT IS NOT A KINDNESS
//  ---------------------------------------------------------------------------
//  An immediate ending is the obvious rule and it is the wrong one here,
//  because the player can cross this line WITHOUT ACTING: a dilution the board
//  forced, a rights issue they could not fund, a treasury buyback that moved
//  the denominator. Ending a run on the same tick as an event the player did
//  not choose reads as the game cheating.
//
//  So the quarter it happens, the board writes. The quarter after, if the
//  holding is still under the floor, the run ends. One quarter is enough to
//  buy back in, and it is not enough to forget about.
//
//  It is also the shape the rest of this engine already uses: insolvency has
//  `quartersInsolvent` and a grace, and the manipulation file has a ledger and
//  a verdict. Same idea, same counter, same reset.
//
//  PURE. No stores and no clock: a percentage and a count in, a verdict out.
// ============================================================================

/**
 * The least of your own company you may hold and still run it.
 *
 * Ten per cent, and the number is the player's own. Worth saying out loud
 * that this is a GAME rule rather than a law: no statute makes a chief
 * executive hold stock. What it stands in for is everything a real board and
 * a real market would do to somebody running a company they had sold, which
 * this game models with one number because one number can be read off a
 * screen.
 */
export const CONTROL_FLOOR_PERCENT = 10;

/**
 * How many quarters under the floor are survivable.
 *
 * One. The quarter it happens is the warning; the next one is the answer.
 */
export const CONTROL_GRACE_QUARTERS = 1;

export type ControlStatus =
    /** At or above the floor. Nothing to say. */
    | 'held'
    /** Under it, and this is the quarter the board writes. */
    | 'warned'
    /** Under it for longer than the grace. The run ends. */
    | 'lost';

export type ControlReview = {
    status: ControlStatus;
    /** The counter to write back, including this quarter. */
    quartersBelow: number;
    /** True only on the quarter the warning should be sent, so it goes once. */
    shouldWarn: boolean;
};

/**
 * Where the player stands, and what to do about it.
 *
 * `quartersBelow` is the count BEFORE this quarter, and the returned one
 * includes it. Passing the previous value back in is the whole of the state;
 * there is nothing else to keep.
 *
 * Total. A missing percentage reads as zero, which is under the floor and is
 * the safe direction: a run whose ownership cannot be read is a run whose
 * ownership is not evidence of anything.
 */
export const reviewControl = (
    ownershipPercent: number,
    quartersBelow: number,
): ControlReview => {
    const pct = Number.isFinite(ownershipPercent) ? ownershipPercent : 0;
    const before = Number.isFinite(quartersBelow) ? Math.max(0, Math.floor(quartersBelow)) : 0;

    if (pct >= CONTROL_FLOOR_PERCENT) {
        // BACK ABOVE IT RESETS THE COUNT, and that is the point of the grace.
        // A player who buys their way back has not used up anything.
        return { status: 'held', quartersBelow: 0, shouldWarn: false };
    }

    const now = before + 1;
    if (now > CONTROL_GRACE_QUARTERS) {
        return { status: 'lost', quartersBelow: now, shouldWarn: false };
    }
    return {
        status: 'warned',
        quartersBelow: now,
        // Only on the first quarter under, so a player who sits at nine per
        // cent does not receive the same letter twice.
        shouldWarn: before === 0,
        };
};

/**
 * What the board sends the quarter it happens.
 *
 * Here rather than in the tick so the wording is next to the rule it
 * describes, and so the numbers in the letter come from the same constants
 * the rule is enforced with.
 */
export const controlWarningLetter = (ownershipPercent: number) => ({
    subject: 'Your holding',
    body:
        `The register shows you at ${ownershipPercent.toFixed(1)} per cent this morning, `
        + `which is below the ${CONTROL_FLOOR_PERCENT} per cent this board has always treated as the floor `
        + `for the chair.\n\n`
        + `We are not calling a vote. We are telling you that if the next register reads the same way, `
        + `there will be nothing to vote about: a chief executive who owns less of the company than the `
        + `people writing to him is an employee, and employees do not sit here.\n\n`
        + `You have a quarter.`,
});
