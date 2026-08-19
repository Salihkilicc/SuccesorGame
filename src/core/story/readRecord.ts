// src/core/story/readRecord.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE STORES
// ============================================================================
//
//  record.ts is the vocabulary and the writing. This is the only file that
//  knows which store holds what, exactly as world.ts is to conditions.ts.
//
//  Everything here is READ AT THE MOMENT THE GAME ENDS and never again, which
//  is worth saying because it is the reason nothing is memoised and the reason
//  the lazy requires below are harmless.
//
//  ---------------------------------------------------------------------------
//  EVERY FIGURE IS DEFENDED, BECAUSE THIS SCREEN CANNOT FAIL
//  ---------------------------------------------------------------------------
//  It is the last thing the player sees, and the states it runs in are the
//  worst ones the game has: bankruptcy, a board removal, a death. If a store
//  is missing a field the record must show a zero, not throw and leave a
//  player who has just lost their company looking at a blank overlay.
//
//  So the reads are individually guarded rather than wrapped in one try. One
//  store being unavailable should cost one row.
// ============================================================================

import { useStatsStore } from '../store/useStatsStore';
import { useGameStore } from '../store/useGameStore';
import { useProductStore } from '../store/useProductStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStoryStore } from '../store/useStoryStore';
import { currentQuarter } from './world';
import { buildRecord, type EstateSummary, type RecordRow } from './record';
import { divideEstate, familyHolding, type Survivor } from './inheritance';
import { successorFor } from './mortality';

/**
 * The endings that leave an estate behind.
 *
 * A LIST rather than a flag on the ending record, because it is a fact about
 * what the closing screen shows rather than about the ending itself, and
 * putting it on the Ending type would put a rendering concern in a data file
 * that has stayed clean of them.
 *
 * Bankruptcy is deliberately not here. There is nothing to divide and a row
 * reading "Your successor took nothing" would be the game rubbing it in.
 */
const ENDINGS_WITH_AN_ESTATE = ['diedInOffice', 'diedWithoutAnHeir'];

/** Read a number off a store without letting a missing one end the screen. */
const safe = <T>(read: () => T, fallback: T): T => {
    try {
        const v = read();
        return v === undefined || v === null ? fallback : v;
    } catch {
        return fallback;
    }
};

/**
 * What the estate did, or undefined when there was not one.
 *
 * The one place the closing screen reads the ending it is showing, and it is
 * worth being explicit about why: the DIVISION is the same arithmetic whoever
 * asks, but whether the player wants to see it depends entirely on how the run
 * finished. See core/story/inheritance.ts for the rule itself.
 */
const readEstate = (): EstateSummary | undefined => {
    try {
        const ending = useStoryStore.getState().ending;
        if (!ending || !ENDINGS_WITH_AN_ESTATE.includes(ending)) return undefined;

        const stats = useStatsStore.getState() as any;
        const family = useFamilyStore.getState() as any;
        const board = require('../../features/shareholders/stores/useShareholderStore')
            .useShareholderStore.getState();

        const children = (family.children ?? []);
        const survivors: Survivor[] = [
            ...children.map((c: any) => ({ id: c.id, kind: 'child' as const })),
            ...(family.partner ? [{ id: 'partner', kind: 'spouse' as const }] : []),
        ];

        const heir = successorFor(
            children.map((c: any) => ({ id: c.id, age: c.age ?? 0 })),
            family.designatedSuccessorId ?? null,
        );

        const bequests = divideEstate(
            { cash: stats.money ?? 0, shares: board.playerShareCount ?? 0 },
            survivors,
            heir?.id ?? null,
        );
        if (bequests.length === 0) {
            return { heirCash: 0, heirStake: 0, familyStake: 0 };
        }

        const total = board.totalShares || 0;
        const heirBequest = bequests.find(b => b.kind === 'heir');
        return {
            heirCash: heirBequest?.cash ?? 0,
            heirStake: total > 0 ? (heirBequest?.shares ?? 0) / total : 0,
            familyStake: familyHolding(bequests, total),
        };
    } catch {
        // The last screen of the game cannot fail. No estate rows is a worse
        // screen; a thrown error is no screen.
        return undefined;
    }
};

export const readRecord = (): RecordRow[] => {
    const stats = safe(() => useStatsStore.getState(), {} as any);
    const game = safe(() => useGameStore.getState(), {} as any);
    const family = safe(() => useFamilyStore.getState(), {} as any);

    return buildRecord({
        quarters: safe(() => currentQuarter(), 0),
        age: game.age ?? 0,
        companyValue: stats.companyValue ?? 0,
        // The player's own worth, which is NOT companyValue. It is what the
        // home screen shows and what the divorce settlement takes a share of.
        netWorth: stats.netWorth ?? 0,
        // ------------------------------------------------------------------
        //  HEADCOUNT COMES FROM THE STATS STORE, MORALE DOES NOT
        // ------------------------------------------------------------------
        //  Worth flagging next to each other: `employeeMorale` exists in both
        //  stats and game and only the game store's copy moves (see the note
        //  in world.ts). `employeeCount` is the other way round - the stats
        //  store is the one the tick writes. Neither is wrong; they are just
        //  not the same store, and guessing costs you a wrong number on the
        //  one screen that has no next screen to correct it.
        // ------------------------------------------------------------------
        employees: stats.employeeCount ?? 0,
        // Retired products are still in the array. A record of what you were
        // selling should not count the ones you pulled.
        products: safe(
            () => (useProductStore.getState().products ?? [])
                .filter((p: any) => p?.status !== 'retired').length,
            0,
        ),
        subsidiaries: safe(
            () => (require('../../features/finance/stores/useCorporateFinanceStore')
                .useCorporateFinanceStore.getState().subsidiaries ?? []).length,
            0,
        ),
        children: (family.children ?? []).length,
        heirNamed: !!family.designatedSuccessorId,
        estate: readEstate(),
    });
};
