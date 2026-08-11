// src/core/market/loyalty.ts
//
// ============================================================================
//  IS THIS MEMBER BEHIND ME, AND WHAT DOES THE BOARD STORE INSTEAD
// ============================================================================
//
//  Two pure functions, in their own file so they can be tested and read
//  without the app around them. They started in governance.ts, which imports
//  i18n for its message strings, which imports AsyncStorage - so a test of
//  arithmetic could not run off a device. governance.ts re-exports them, so
//  nothing that already imported them had to change.
//
//  ---------------------------------------------------------------------------
//  WHY LOYALTY IS NOT TRUST
//  ---------------------------------------------------------------------------
//  `trust` measures "is this member pleased with the situation". What the
//  governance code actually needs is "is this member behind ME", and for a
//  Snake those are INVERSELY related: a Snake who is comfortable is a Snake
//  who likes his odds.
//
//  Getting this wrong once cost a real bug - the member most actively trying
//  to depose the player was counting as protection against removal.
// ============================================================================

import type { TraitType } from './governanceTypes';

export type LoyaltyMember = { trait: TraitType; trust: number };

/** How far this member is behind you, 0-100. */
export const loyaltyOf = (m: LoyaltyMember): number =>
    m.trait === 'Snake' ? 100 - m.trust : m.trust;

/**
 * The inverse: the `trust` a member of this trait must hold to have this
 * loyalty.
 *
 * `trustForLoyalty(trait, loyaltyOf(m)) === m.trust` for every trait, which
 * is what lets the story talk about someone in the only terms a writer can
 * use - "is he behind me" - while the board keeps storing what it stores.
 */
export const trustForLoyalty = (trait: TraitType, loyalty: number): number => {
    const l = Math.max(0, Math.min(100, Math.round(loyalty)));
    return trait === 'Snake' ? 100 - l : l;
};
