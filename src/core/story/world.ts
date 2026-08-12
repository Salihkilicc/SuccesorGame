// src/core/story/world.ts
//
// ============================================================================
//  READING THE WORLD A CONDITION IS ASKED ABOUT
// ============================================================================
//
//  conditions.ts takes a `World` as an argument rather than reaching into the
//  stores, so it can be tested with a plain object. This is the one place that
//  builds a real one.
//
//  Same split as effects.ts / gameSink.ts, for the same reason: the vocabulary
//  stays importable by tests and by the audit script, and only a small file
//  knows the app exists.
// ============================================================================

import { useStatsStore } from '../store/useStatsStore';
import { useStoryStore } from '../store/useStoryStore';
import { useGameStore } from '../store/useGameStore';
import { initialGameState } from '../store/useGameStore';
import { useLaboratoryStore } from '../store/useLaboratoryStore';
import type { World } from './conditions';
import { brotherLoyalty } from './brother';

/**
 * Quarters elapsed since the game began, 1-based.
 *
 * Derived rather than stored, and derived the same way the report label is:
 * years come from `age` (which counts them) and the quarter within the year
 * from `currentMonth`. Deriving it from currentMonth alone was the bug that
 * printed "Q2 · Year 1" forever, because that field wraps every twelve months.
 */
export const currentQuarter = (): number => {
    const { currentMonth, age } = useGameStore.getState();
    const years = Math.max(0, age - initialGameState.age);
    const quarterInYear = Math.floor(((currentMonth - 1) % 12) / 3) + 1;
    return years * 4 + quarterInYear;
};

export const readWorld = (): World => {
    const stats = useStatsStore.getState();
    const story = useStoryStore.getState();
    const report = useGameStore.getState().lastQuarterReport as any;
    // ----------------------------------------------------------------------
    //  STAFFING, BEFORE THE FIRST QUARTER HAS CLOSED
    // ----------------------------------------------------------------------
    //  `crewRequired` is 0 in the blank report, and 0/0 is NaN - which passes
    //  no comparison and fails every one, so the COO would simply never speak
    //  and nothing would say why. 100 is the honest reading of "we have not
    //  run a quarter yet": nobody is short of anything.
    // ----------------------------------------------------------------------
    const crew = report?.crewRequired ?? 0;
    const staffing = crew > 0 ? ((report?.headcount ?? 0) / crew) * 100 : 100;
    return {
        // The brother's number is READ FROM THE CAP TABLE, not from the stored
        // dial. He is one person in two systems and the board is the one that
        // stores him; see core/story/brother.ts. Reading the stored copy would
        // let a condition test a value a gift or a lobbying result had already
        // changed.
        dials: { ...story.dials, brotherTrust: brotherLoyalty() },
        flags: story.flags,
        quarter: currentQuarter(),
        capital: stats.companyCapital || 0,
        cash: stats.money || 0,
        // ------------------------------------------------------------------
        //  MORALE IS IN TWO STORES AND ONLY ONE OF THEM MOVES
        // ------------------------------------------------------------------
        //  `useStatsStore.employeeMorale` is initialised to 75 with a comment
        //  saying it must match the game store's - and then nothing ever
        //  writes it again. Measured over eight quarters: the game store
        //  walked 73.5 -> 70.3 while the stats copy sat at 75 the whole time.
        //
        //  The tick reads and writes the GAME store, so that is the real one
        //  and this reads it. See the note in ProductModals.tsx for the screen
        //  that was reading the frozen copy.
        // ------------------------------------------------------------------
        morale: useGameStore.getState().employeeMorale ?? 75,
        // From the last closed quarter's report rather than recomputed. The
        // tick works it out (`totalPlayerShare`) and puts it here; asking the
        // market stores again would be a second implementation of the one
        // number the competitive game is about.
        marketShare: report?.marketShare ?? 0,
        staffing,
        // The one figure here that is NOT from the report, because the report
        // has no reason to carry it - the lab is its own store and the number
        // is authoritative there. Zero at the start of every game.
        researchers: useLaboratoryStore.getState().researcherCount ?? 0,
    };
};
