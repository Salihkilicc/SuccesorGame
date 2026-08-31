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
export const boardLoyalty = (): number => {
    try {
        const members = useShareholderStore.getState().members || [];
        if (members.length === 0) return 0;
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
        ownershipAfter: ctx.ownershipAfter,
    });
    if (fresh) ledger.push(fresh);

    // 2. FORGET
    const live = ledger.filter(b => !isStale(b, ctx.quarter));

    // 3. JUDGE
    const proven = provenBuys(live, { quarter: ctx.quarter, price: ctx.priceNow });
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
