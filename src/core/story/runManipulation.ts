// src/core/story/runManipulation.ts
//
// ============================================================================
//  THE SINK: THE LEDGER, THE INVESTIGATION AND WHAT IT COSTS
// ============================================================================
//
//  The rule is in manipulation.ts and knows nothing about stores. This is the
//  half that touches them, and it runs once a quarter from the tick.
//
//  Three things happen here, in this order and for a reason:
//
//    1. WRITE. A purchase made while the stock was on the floor goes in the
//       ledger. Nothing is decided; at this moment there is no way to tell a
//       manufactured collapse from a real one.
//    2. FORGET. Entries past the window come out, so a forty year run does not
//       carry a growing list of ancient quarters.
//    3. JUDGE. If the price has come back on any entry still in the window,
//       the case is brought - once, and never again.
//
//  A CASE IS BROUGHT ONCE. The verdict is stored, and its presence is what
//  stops the same file being opened every quarter for the rest of the run.
// ============================================================================

import { useStoryStore } from '../store/useStoryStore';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../store/useStatsStore';
import { loyaltyOf } from '../market/loyalty';
import {
    isStale,
    judge,
    provenBuys,
    recordSuspicion,
    type Judgement,
} from './manipulation';
import { noticeStage, noticesDue, type NoticeStage } from './manipulationNotice';

export interface WatchContext {
    quarter: number;
    /** What the stock cost when the buying happened: the price the quarter opened at. */
    priceAtBuy: number;
    /** What it was worth before the fall, at that same moment. */
    referenceAtBuy: number;
    /** Where the price ended up this quarter. This is what proves the case. */
    priceNow: number;
    ownershipBefore: number;
    ownershipAfter: number;
    /**
     * Of that rise, how much was the share count SHRINKING.
     *
     * A treasury buyback retires shares and lifts the percentage without a
     * purchase. Subtracted before the ledger is written, or the way the game
     * offers to take your own company is also the way it convicts you.
     */
    ownershipFromBuyback?: number;
    /** The player's own money. Lawyers are not a company expense. */
    personalWealth: number;
}

/**
 * The board's average loyalty, 0-100.
 *
 * `loyaltyOf` rather than `trust`, and the difference is load bearing: a Snake
 * enjoying your downfall has HIGH trust and would otherwise have counted as a
 * character witness. See core/market/governance.ts.
 */
/**
 * What an empty board is worth as a defence.
 *
 * The midpoint, because there is nobody in the room either way. Not 100: a
 * player who bought out every director has no one to vouch for them either,
 * and a company held alone should not be a licence.
 */
export const NO_BOARD_LOYALTY = 50;

export const boardLoyalty = (): number => {
    try {
        const members = useShareholderStore.getState().members || [];
        // ------------------------------------------------------------------
        //  NO BOARD IS NOT A BOARD THAT HATES YOU
        // ------------------------------------------------------------------
        //  This returned 0, and 0 on this scale means every director in the
        //  room testifying against you. But the player with no board is the
        //  player who BOUGHT THEM ALL OUT - which the game offers as a way to
        //  win - and it left them with no defence at all.
        //
        //  Reported as "hisselerim yuzde yuzune sahipken birden barred oldum,
        //  illegal bir sey de yapmadim". Measured on one purchase at 35% of
        //  reference with the price recovering:
        //
        //      an adoring board   fine
        //      an ordinary board  fine
        //      a cool board       barred
        //      NO BOARD           barred, with a defence of 0.010
        //
        //  So owning the whole company was punished harder than owning most
        //  of it, for the same act. Neutral is the honest reading: nobody
        //  spoke for you and nobody spoke against you.
        // ------------------------------------------------------------------
        if (members.length === 0) return NO_BOARD_LOYALTY;
        const total = members.reduce((sum, m) => sum + loyaltyOf(m as any), 0);
        return total / members.length;
    } catch {
        return 0;
    }
};

/** What a verdict does to the player. Returns the ending id, if it ends the run. */
export const applyVerdict = (j: Judgement): string | null => {
    switch (j.verdict) {
        case 'fine': {
            const stats = useStatsStore.getState();
            // Personal money, not the company's. The company was the victim.
            stats.update({ money: Math.max(0, (stats.money || 0) - j.fine) });
            return null;
        }
        case 'barred':
            // The chair is gone and the dynasty is not. Same door the board
            // already uses when it removes a chief executive.
            return 'barredForManipulation';
        case 'prison':
            return 'convictedOfManipulation';
        default:
            return null;
    }
};

/**
 * One quarter of watching. Returns the verdict if a case was brought.
 *
 * Safe to call every quarter and on every save, including ones written before
 * any of this existed.
 */
// ============================================================================
//  THE TWO LETTERS
// ============================================================================
//
//  From the Field Office, which the cast file already holds and already gives
//  a tone to: "flat, procedural, every sentence built to be quoted back at
//  you. Never accuses; requests, notes, and reminds. The threat is entirely in
//  what is not written." That is the right voice for this and it was written
//  before there was anything for it to say.
//
//  NEITHER ONE NAMES A PENALTY. A letter that says "you may be barred" turns
//  the system into a slot machine with a warning label on it; a letter that
//  asks you to keep your records is how anybody actually finds out they are
//  being looked at. The player is told the file EXISTS, which is the whole of
//  what was missing.
// ============================================================================

const LETTERS: Record<NoticeStage, { subject: string; body: string } | null> = {
    quiet: null,
    opened: {
        subject: 'Retention of records: trading in own securities',
        body:
            'This office is conducting a routine review of trading in the '
            + 'securities of Hale Industries.\n\n'
            + 'You are asked to retain, in their original form, all records '
            + 'relating to acquisitions of the undertaking\u2019s own stock made '
            + 'by you or on your behalf. This includes instructions, timings '
            + 'and any correspondence bearing on them.\n\n'
            + 'No response is required at this stage. This notice does not '
            + 'imply a finding.',
    },
    hardened: {
        subject: 'Notice of formal enquiry',
        body:
            'The review referred to in our earlier notice has been placed on a '
            + 'formal footing.\n\n'
            + 'The matter under examination is whether acquisitions of the '
            + 'undertaking\u2019s own stock were made at prices that did not '
            + 'reflect its condition at the time.\n\n'
            + 'You may wish to instruct counsel. Any expenditure on your '
            + 'defence is a matter for you personally and not for the '
            + 'undertaking.\n\n'
            + 'The file remains open.',
    },
};

/**
 * Send whichever of the two has come due, and remember that it went.
 *
 * Guarded end to end: a letter is the least important thing happening in this
 * quarter and must never be the reason the tick throws.
 */
const postNotices = (
    ledger: readonly Parameters<typeof isStale>[0][],
    proven: readonly Parameters<typeof isStale>[0][],
): void => {
    try {
        const sent = (useStoryStore.getState().manipulationNoticesSent ?? []) as NoticeStage[];
        const due = noticesDue(noticeStage(ledger, proven), sent);
        if (due.length === 0) return;

        const sink = require('./gameSink').gameSink();
        for (const stage of due) {
            const letter = LETTERS[stage];
            if (letter) sink.mail({ from: 'fbi', ...letter });
        }
        useStoryStore.setState({ manipulationNoticesSent: [...sent, ...due] });
    } catch (e) {
        console.warn('[manipulation] the notice could not be posted', e);
    }
};

export const runManipulationWatch = (ctx: WatchContext): Judgement | null => {
    const story = useStoryStore.getState();

    // A player already judged is not judged again, and a run that has ended
    // is not still being investigated.
    if (story.manipulationVerdict || story.ending) return null;

    const ledger = [...(story.manipulationLedger || [])];

    // 1. WRITE
    const fresh = recordSuspicion({
        quarter: ctx.quarter,
        price: ctx.priceAtBuy,
        reference: ctx.referenceAtBuy,
        ownershipBefore: ctx.ownershipBefore,
        ownershipAfter: ctx.ownershipAfter
            - Math.max(0, ctx.ownershipFromBuyback || 0),
    });
    if (fresh) ledger.push(fresh);

    // 2. FORGET
    const live = ledger.filter(b => !isStale(b, ctx.quarter));

    // ------------------------------------------------------------------
    //  2b. AND TELL THEM, WHICH IT NEVER DID
    // ------------------------------------------------------------------
    //  BEFORE the early return below, and that placement is the whole fix.
    //  The first letter must go out when the entry is WRITTEN, not when the
    //  case is proven - proving needs the price to come back, which can be
    //  three years later, and until then the player was told nothing at all.
    //
    //  Reported as being barred with no idea why. See manipulationNotice.ts.
    // ------------------------------------------------------------------
    const proven = provenBuys(live, { quarter: ctx.quarter, price: ctx.priceNow });
    postNotices(live, proven);

    // 3. JUDGE
    if (proven.length === 0) {
        useStoryStore.setState({ manipulationLedger: live });
        return null;
    }

    const verdict = judge(proven, {
        boardLoyalty: boardLoyalty(),
        personalWealth: ctx.personalWealth,
    });

    if (verdict.verdict === 'none') {
        // The file was opened and closed. The entries stay: a second, worse
        // purchase can still bring it back, and dropping them here would make
        // the first offence free forever.
        useStoryStore.setState({ manipulationLedger: live });
        return null;
    }

    useStoryStore.setState({ manipulationLedger: live, manipulationVerdict: verdict });

    const ending = applyVerdict(verdict);
    if (ending) useStoryStore.getState().endGame(ending);

    return verdict;
};
