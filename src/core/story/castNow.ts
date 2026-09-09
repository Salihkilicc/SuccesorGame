// src/core/story/castNow.ts
//
// ============================================================================
//  WHO HOLDS THE SEAT THIS GENERATION
// ============================================================================
//
//  `CAST` is static data and stays static: the scenes are written for those
//  people, keyed on those ids and validated against them. This is the one
//  place that says who is SITTING in each seat right now, and it is a lookup
//  rather than a rewrite.
//
//  ---------------------------------------------------------------------------
//  ONE DOOR, AND THE REASON IS SPECIFIC
//  ---------------------------------------------------------------------------
//  SEVEN places read `CAST[id]` for a name: the message poster, the mail
//  poster, the neglect chaser twice, the conversation runner, the tutorial and
//  the succession's first letter. Any one of them left on the raw table gives
//  a save where the inbox says Ingrid Sollberg and the transcript above the
//  reply says Arthur Vance - the same person, two names, one tap apart. That
//  is the exact bug the avatar tint had before it was centralised, and the
//  fix is the same: everybody asks one function.
//
//  Guarded and total. A missing generation, a store that has not stood up, an
//  id with no roster - each one falls back to the cast entry as written, which
//  is generation one and is never wrong, only stale.
// ============================================================================

import { CAST } from '../../data/story/cast';
import type { CastMember } from './cast';
import {
    CAST_GENERATIONS,
    GENERATIONS_WRITTEN,
    seatPortraitId,
    type SeatHolder,
} from '../../data/story/castGenerations';

/**
 * A cast member as they are today, with enough to draw them.
 *
 * `gender` and `age` are absent for generation one and for anybody with no
 * roster: those have portraits of their own on disk and are found by id. They
 * are present for everybody after, who cannot and must take a pool face. See
 * core/store/useMessageStore.Thread.
 */
export type SeatedMember = CastMember & {
    gender?: 'male' | 'female';
    age?: number;
    /**
     * Where THIS person's portrait is filed, which is not where the seat's is.
     *
     * `id` stays the seat - the threads, the scenes and the conversation
     * attachments are all keyed on it and must not move. This is the second
     * id, used only to find a face, and it is what stopped the second and
     * fourth holder of a seat being the same photograph.
     */
    portraitId?: string;
};

/**
 * Which set of names is in play.
 *
 * Generation one is the founder's and is written out in full. After the fifth
 * it comes round to the SECOND, not the first: bringing the founder's own
 * chief financial officer back in generation six would read as the bug this
 * exists to fix rather than as a nice touch.
 */
export const rosterIndexFor = (generation: number): number => {
    const g = Math.max(1, Math.floor(generation || 1));
    if (g <= GENERATIONS_WRITTEN) return g - 1;
    // 6 -> 1, 7 -> 2, ... and never back to 0.
    const after = GENERATIONS_WRITTEN - 1;
    return 1 + ((g - 1 - GENERATIONS_WRITTEN) % after);
};

/** The generation the family is on, or one when nothing knows. */
const currentGeneration = (): number => {
    try {
        const { useFamilyStore } = require('../store/useFamilyStore');
        const g = useFamilyStore.getState().generation;
        return typeof g === 'number' && g > 0 ? g : 1;
    } catch {
        return 1;
    }
};

/**
 * The person in this seat, right now.
 *
 * `generation` is injectable so the whole table can be walked in a test
 * without five successions; the game passes nothing.
 */
export const castNow = (id: string, generation?: number): SeatedMember | undefined => {
    const base = CAST[id];
    if (!base) return undefined;

    const roster = CAST_GENERATIONS[id];
    if (!roster || roster.length === 0) return base;

    const holder: SeatHolder | undefined = roster[rosterIndexFor(generation ?? currentGeneration())];
    if (!holder) return base;

    // Generation one IS the cast entry. Returning it untouched rather than
    // rebuilding it keeps the founder's game byte for byte what it was, and
    // leaves them finding their portrait by id like they always have.
    if (holder.name === base.name) return base;

    return {
        ...base,
        name: holder.name,
        gender: holder.gender,
        age: holder.age,
        portraitId: seatPortraitId(id, generation ?? currentGeneration()),
    };
};

/** The same, never undefined, for callers that only want to print a name. */
export const nameNow = (id: string, generation?: number): string =>
    castNow(id, generation)?.name ?? CAST[id]?.name ?? id;
