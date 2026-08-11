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
import type { World } from './conditions';

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
    return {
        dials: story.dials,
        flags: story.flags,
        quarter: currentQuarter(),
        capital: stats.companyCapital || 0,
        cash: stats.money || 0,
    };
};
