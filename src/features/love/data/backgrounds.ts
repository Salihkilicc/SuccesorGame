// src/features/love/data/backgrounds.ts
//
// ============================================================================
//  WHERE SOMEBODY CAME FROM, WHICH THE GAME HAD NEVER SAID
// ============================================================================
//
//  A partner arrived as a name, an age, a job title and a monthly bill. The
//  fifteen psychometrics behind them are real and derived (psychometrics.ts)
//  and none of them is a sentence, so the card could tell the player that
//  somebody's family wealth was 97 and never that they grew up in a house with
//  a name.
//
//  Asked for as "backgroundu iyi": the people at the top should read like
//  people at the top. That is a writing problem rather than a modelling one,
//  and the writing has to follow the same ladder everything else does, or a
//  student and a head of state get the same paragraph.
//
//  ---------------------------------------------------------------------------
//  KEYS, NOT SENTENCES
//  ---------------------------------------------------------------------------
//  What is stored on the partner is an i18n KEY. Two reasons, and the second
//  is the one that matters:
//
//    A player who changes language mid-run would otherwise carry a partner
//    whose history is in the old one, forever, because it was frozen into the
//    save at the moment they met.
//
//    And a raw string in a data file is exactly what scripts/untranslated.js
//    cannot see - it only reads .tsx - so it is the one place an English
//    sentence could sit and never be found. Better that it cannot happen.
//
//  ---------------------------------------------------------------------------
//  AND THE SAME PERSON HAS THE SAME PAST EVERY TIME THEY ARE LOOKED AT
//  ---------------------------------------------------------------------------
//  Drawn from the ID rather than from Math.random. A partner is stored and
//  read back on many screens; a history that re-rolls on every render is not a
//  history. Same argument, same shape, as shelfNow.ts.
// ============================================================================

import type { SocialTier } from '../../../data/relationshipTypes';

/**
 * How many pasts each room has. Five.
 *
 * Enough that two partners met in one run rarely share one, few enough that
 * every line can be written for its room rather than filled in. The name is a
 * constant so the test can assert the pools are level rather than counting
 * them by hand.
 */
export const BACKGROUNDS_PER_TIER = 5;

/**
 * The key suffixes, by room, in order.
 *
 * The full key is `bg.<tier>.<n>` and both en.ts and tr.ts carry every one.
 * The Turkish is the version that was written first: Turkish has no gendered
 * third person, so one line covers both a man and a woman without a variant,
 * which is the whole reason "erkekler de tabii" costs nothing here. The
 * English is written in the plural for the same effect.
 */
export const backgroundKeysFor = (tier: SocialTier): string[] =>
    Array.from({ length: BACKGROUNDS_PER_TIER }, (_, i) => `bg.${tier}.${i}`);

/**
 * A number from a string, stable across runs and platforms.
 *
 * FNV-1a, the same one shelfNow.ts uses. Written out rather than imported
 * because that module is about a shop and this one is about people, and one
 * shared hash between two unrelated systems is a dependency that buys nothing.
 */
const seedFrom = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < (s || '').length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

/**
 * Which past this person has.
 *
 * `id` is the partner's own id, which `generatePartner` makes once and which
 * travels with them into the save.
 */
export const backgroundKeyFor = (tier: SocialTier, id: string): string => {
    const pool = backgroundKeysFor(tier);
    return pool[seedFrom(id) % pool.length];
};
