// src/core/story/fines.ts
//
// ============================================================================
//  WHAT A PENALTY COSTS DEPENDS ON WHO IS PAYING IT
// ============================================================================
//
//  THE BUG, AND IT IS A BALANCE BUG RATHER THAN A BROKEN ONE. Every penalty in
//  the game was a literal figure written into a scene, and the company starts
//  with three million:
//
//      the regulator settles at        4,500,000     150% of everything you own
//      the supply crisis costs         6,400,000     213%
//      a conviction costs             18,000,000     600%
//
//  So a scene written to be a bad quarter was, in the first year, the end of
//  the run - and the same figure in the fifteenth year is a rounding error the
//  player does not look up from. A number that is fatal early and free late is
//  not a difficulty setting, it is a difficulty LOTTERY decided by when the
//  scene happened to fire.
//
//  Reported as "bu para cezalari cok fazla, oyun oynanmaz".
//
//  ---------------------------------------------------------------------------
//  SO A SCENE SAYS HOW BAD IT IS, AND THE ENGINE SAYS WHAT THAT COSTS
//  ---------------------------------------------------------------------------
//  This is the same division the rest of the story vocabulary already makes.
//  `retention` prices itself off the target's own earnings because "a scene
//  knows WHO is angry, it cannot know what the target earns". A scene knows a
//  regulator is furious. It cannot know what the company is worth on the
//  quarter the letter arrives.
//
//  Four named severities, not a free percentage, for the reason the whole
//  effect vocabulary is closed: a number in a scene is a number the next scene
//  copies and adjusts, and within a month there are thirty of them and no
//  scale at all.
//
//  ---------------------------------------------------------------------------
//  AND A FINE CAN NO LONGER END THE COMPANY BY ITSELF
//  ---------------------------------------------------------------------------
//  A share of capital is always payable. That is deliberate and it is the
//  actual fix: bankruptcy stays a thing the player drives into over quarters,
//  rather than something a single letter does in one tap.
//
//  PURE. No stores. The capital is passed in.
// ============================================================================

/** How bad it is, in the only terms a scene can honestly speak. */
export type FineSeverity = 'minor' | 'serious' | 'severe' | 'ruinous';

/**
 * What each severity takes, as a share of company capital.
 *
 * Calibrated against the figures they replace, read as fractions of the three
 * million the company starts with: the old 900k nuisances land near `minor`,
 * the 2.4M settlements near `serious`, the 4.5M regulator near `severe`, and
 * the conviction is its own thing.
 */
export const FINE_SHARE: Record<FineSeverity, number> = {
    minor: 0.03,
    serious: 0.08,
    severe: 0.15,
    ruinous: 0.30,
};

/**
 * Below this it is not a penalty, it is paperwork.
 *
 * Without a floor, a company that has just spent everything on a factory pays
 * nothing at all for a scandal, and the scene reads as though the world
 * decided to let it go.
 */
export const FINE_FLOOR = 25_000;

/**
 * And above this it stops being a number anybody can feel.
 *
 * Thirty per cent of a late-stage balance sheet is a headline figure that
 * means nothing on screen. The cap is high enough that it never binds during
 * an ordinary run.
 */
export const FINE_CAP = 250_000_000;

/**
 * What this penalty costs this company, today. Always positive.
 *
 * Clamped to what is actually there, so the caller can subtract it without
 * checking: a company with less than the floor pays what it has.
 */
export const fineAmount = (companyCapital: number, severity: FineSeverity): number => {
    const capital = Number.isFinite(companyCapital) ? Math.max(0, companyCapital) : 0;
    const share = FINE_SHARE[severity] ?? FINE_SHARE.minor;
    const raw = capital * share;
    const clamped = Math.min(FINE_CAP, Math.max(FINE_FLOOR, raw));
    // Never more than there is. A fine is a penalty, not an execution.
    return Math.round(Math.min(capital, clamped));
};

/** For the badge on the choice, so the player is told before they tap. */
export const FINE_LABEL: Record<FineSeverity, string> = {
    minor: 'Minor penalty',
    serious: 'Serious penalty',
    severe: 'Severe penalty',
    ruinous: 'Ruinous penalty',
};
