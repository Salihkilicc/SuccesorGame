// src/core/story/manipulationNotice.ts
//
// ============================================================================
//  THE VERDICT ARRIVED AND THE PLAYER HAD NEVER BEEN TOLD ANYTHING
// ============================================================================
//
//  Reported in as many words: barred from the chair, nothing illegal knowingly
//  done, no idea why. That report had two causes and only one of them was the
//  false positive fixed earlier.
//
//  The other is this. `runManipulation` writes a suspicious purchase into a
//  ledger and says NOTHING. The entry sits there for up to sixteen quarters -
//  FOUR YEARS of play - and then a verdict lands out of a clear sky. The
//  system was working exactly as designed and was, from the seat, indis-
//  tinguishable from the game breaking.
//
//  ---------------------------------------------------------------------------
//  A PROSECUTION IS NOT A SURPRISE, IT IS A SEQUENCE
// ---------------------------------------------------------------------------
//  Nobody is charged without first being asked for their records. So:
//
//    OPENED    the first entry lands. A letter: we note the trading, retain
//              your records. No accusation, no number, no threat.
//    HARDENED  the file is now strong enough to bring. A second letter: it is
//              a formal enquiry and you may wish to instruct counsel.
//    VERDICT   as it always was.
//
//  Each step is announced ONCE. A letter every quarter for four years is
//  wallpaper, which is the failure the quarterly report was just cured of.
//
//  ---------------------------------------------------------------------------
//  AND THE INNOCENT ARE NEVER WRITTEN TO
//  ---------------------------------------------------------------------------
//  The step is driven off the LEDGER, which only ever holds purchases already
//  judged suspicious by `recordSuspicion` - deep discount, real gain, and not
//  a treasury buyback. A player who buys their own stock on the way up, or
//  takes the company through the door the game offers, has an empty ledger and
//  hears nothing for forty years.
//
//  PURE. No stores and no mail. See runManipulation.ts for the half that
//  posts them.
// ============================================================================

import { CASE_MINIMUM, caseStrength, type SuspiciousBuy } from './manipulation';

/** How far the file has got, as the player would be told. */
export type NoticeStage = 'quiet' | 'opened' | 'hardened';

/**
 * Where the file stands, from the ledger alone.
 *
 * `proven` is the subset the recovery has confirmed - the same list `judge`
 * is given - and `ledger` is everything still inside the window. The first
 * letter goes on the LEDGER because being asked for records does not wait for
 * the price to come back; the second goes on the PROVEN case, because that is
 * the point at which somebody would really instruct counsel.
 */
export const noticeStage = (
    ledger: readonly SuspiciousBuy[],
    proven: readonly SuspiciousBuy[],
): NoticeStage => {
    if ((ledger?.length ?? 0) === 0) return 'quiet';
    // CASE_MINIMUM is the bar `judge` uses to decide there is anything to
    // answer at all. Reused rather than picked, so the second letter cannot
    // arrive for a file that would be dropped, and cannot fail to arrive for
    // one that would not.
    return caseStrength([...(proven ?? [])]) >= CASE_MINIMUM ? 'hardened' : 'opened';
};

/**
 * Which letters are due, given what has already been sent.
 *
 * Returns the stages to announce now, in order, and an empty list when there
 * is nothing new - which is every quarter except two in a whole run.
 *
 * IT CATCHES UP. A player who crosses both bars in one quarter gets both
 * letters, in sequence, rather than only the louder one: being told the file
 * exists is what makes the second letter mean anything, and skipping it to
 * save a message would leave exactly the hole this file was written to close.
 */
export const noticesDue = (
    stage: NoticeStage,
    alreadySent: readonly NoticeStage[],
): NoticeStage[] => {
    const sent = new Set(alreadySent ?? []);
    const order: NoticeStage[] = ['opened', 'hardened'];
    const reached = order.slice(0, order.indexOf(stage) + 1);
    return reached.filter(s => !sent.has(s));
};
