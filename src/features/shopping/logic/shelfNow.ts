// src/features/shopping/logic/shelfNow.ts
//
// ============================================================================
//  WHAT IS ON SALE TODAY
// ============================================================================
//
//  `ITEMS` is the whole written catalogue and always has been. This is the one
//  place that answers the smaller question the shop actually asks: which of
//  them a player in THIS generation may see.
//
//  ---------------------------------------------------------------------------
//  DERIVED, NOT STORED
// ---------------------------------------------------------------------------
//  Which twelve come up is a pure function of the company name and the
//  generation. Nothing is written to a store, nothing is scheduled at a
//  succession, and there is no tick to forget to call.
//
//  That is not tidiness, it is the bug this shape avoids. A drawn shelf held
//  in a store has to survive `partialize`, `onRehydrateStorage`, a save made
//  before the field existed, and a reset - four places where this codebase has
//  already lost data at least once each. `core/luxury/promotions.ts` made the
//  same call for the same reason and its note is worth reading.
//
//  `Math.random` is the other obvious way to draw and it is wrong twice over:
//  the shelf would differ between two screens rendering the same shop, and it
//  would change under a player's hand on every re render.
//
//  ---------------------------------------------------------------------------
//  SEEDED ON THE COMPANY NAME
// ---------------------------------------------------------------------------
//  The generation alone would give every save in the world the same twelve,
//  which is a fixed list wearing a draw's clothes. The company name is chosen
//  once in onboarding, never changed afterwards (nothing calls a setter for
//  it), and is in every save. So two runs see two shelves and one run sees one
//  shelf forever.
//
//  A save with no name yet still works: the hash of an empty string is a
//  number like any other, and nothing unlocks before generation two anyway.
// ============================================================================

import { ITEMS } from '../data/shoppingRegistry';
import {
    RICH_DRAWN, TOP_DRAWN, WAVES, WAVE_ITEM_IDS, LAST_GROWING_GENERATION,
} from '../data/generationWaves';
import type { ShoppingItem } from '../types';

/**
 * A small deterministic hash, the same one promotions.ts uses.
 *
 * Duplicated rather than shared, deliberately: that module is about quarters
 * and this one is about generations, and a change to one must not silently
 * reshuffle the other.
 */
const hash = (n: number): number => {
    let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
};

/** A string as a number, so a company name can seed a draw. */
export const seedFromName = (name: string): number => {
    let h = 2166136261;
    for (let i = 0; i < (name || '').length; i++) {
        h = Math.imul(h ^ name.charCodeAt(i), 16777619);
    }
    return h >>> 0;
};

/**
 * Pick `count` distinct entries from a list, by seed.
 *
 * Walks forward from a seeded start with a stride, so the result is distinct
 * by construction and the loop cannot spin. Lifted from promotions.ts, which
 * had the identical problem.
 */
const pick = <T>(list: readonly T[], count: number, seed: number): T[] => {
    if (list.length === 0 || count <= 0) return [];
    const take = Math.min(count, list.length);
    const start = hash(seed) % list.length;
    const stride = 1 + (hash(seed + 1) % Math.max(1, list.length - 1));
    const step = list.length % stride === 0 ? 1 : stride;

    const out: T[] = [];
    const seen = new Set<number>();
    let i = start;
    while (out.length < take) {
        if (!seen.has(i)) {
            seen.add(i);
            out.push(list[i]);
        } else {
            i = (i + 1) % list.length;
            continue;
        }
        i = (i + step) % list.length;
    }
    return out;
};

/**
 * The twelve one wave puts on the shelf for this save.
 *
 * Nine from the ordinary band and three from the top, drawn separately. One
 * draw over the whole eighteen would sooner or later hand a generation twelve
 * ordinary things and nothing at the top, and "three properly expensive ones,
 * because they are getting richer" is the request.
 */
export const drawnFromWave = (waveIndex: number, seed: number): ShoppingItem[] => {
    const wave = WAVES[waveIndex];
    if (!wave) return [];
    // Different offsets, or the same seed picks the same INDEX out of both
    // lists and the two draws move together.
    return [
        ...pick(wave.rich, RICH_DRAWN, seed + waveIndex * 101),
        ...pick(wave.top, TOP_DRAWN, seed + waveIndex * 101 + 7717),
    ];
};

/**
 * Everything the waves have opened by this generation, cumulative.
 *
 * A third generation still sees what the second was offered. The market grew;
 * it did not turn over. Taking last generation's stock away would mean an heir
 * losing the thing they had been saving for on the day they took the chair.
 */
export const openedBy = (generation: number, companyName: string): ShoppingItem[] => {
    const g = Number.isFinite(generation) ? Math.max(1, Math.floor(generation)) : 1;
    const seed = seedFromName(companyName || '');
    const out: ShoppingItem[] = [];
    WAVES.forEach((wave, index) => {
        if (g >= wave.generation) out.push(...drawnFromWave(index, seed));
    });
    return out;
};

/** The live generation and company name, or the founder's defaults. */
const runNow = (): { generation: number; companyName: string } => {
    try {
        const { useFamilyStore } = require('../../../core/store/useFamilyStore');
        const { useStatsStore } = require('../../../core/store/useStatsStore');
        const g = useFamilyStore.getState().generation;
        const name = useStatsStore.getState().companyName;
        return {
            generation: typeof g === 'number' && g > 0 ? g : 1,
            companyName: typeof name === 'string' ? name : '',
        };
    } catch {
        // A store that has not stood up yet reads as the founder, which shows
        // the base catalogue. Stale, never wrong.
        return { generation: 1, companyName: '' };
    }
};

/**
 * Every item id a player may see right now.
 *
 * A Set rather than a list because every caller is filtering, and because the
 * callers are the point of this module: seven places read the catalogue and
 * one of them missing this gate is an item on sale a generation early.
 */
export const shelfIds = (generation?: number, companyName?: string): ReadonlySet<string> => {
    const run = generation === undefined || companyName === undefined ? runNow() : null;
    const g = generation ?? run!.generation;
    const name = companyName ?? run!.companyName;
    return new Set(openedBy(g, name).map(i => i.id));
};

/**
 * Is this one on the shelf?
 *
 * Anything that is not part of a wave has always been on sale and always will
 * be: the base catalogue is untouched by any of this.
 */
export const onShelf = (itemId: string, open?: ReadonlySet<string>): boolean => {
    if (!WAVE_ITEM_IDS.has(itemId)) return true;
    return (open ?? shelfIds()).has(itemId);
};

/**
 * The catalogue as it stands today.
 *
 * The one function every screen should be calling instead of `ITEMS`.
 */
export const shelfNow = (generation?: number, companyName?: string): ShoppingItem[] => {
    const open = shelfIds(generation, companyName);
    return ITEMS.filter(i => onShelf(i.id, open));
};

/** True while there is still a generation that opens something new. */
export const marketStillGrowing = (generation: number): boolean =>
    generation < LAST_GROWING_GENERATION;
