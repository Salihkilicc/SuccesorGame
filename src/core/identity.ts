// src/core/identity.ts
//
// ============================================================================
//  WHO YOU ARE, AND WHAT YOU CALLED THE COMPANY
// ============================================================================
//
//  The rules for both, in one place and with no React in them, because a
//  length limit enforced only by `maxLength` on a TextInput is not enforced:
//  paste, autofill and restoring a saved value all bypass it. The input uses
//  these to stop bad typing early; the store uses the same ones to refuse bad
//  data whatever route it came in by.
//
//  TWO DIFFERENT LIFETIMES, and this is the part worth getting right:
//
//    YOUR NAME is asked once, on the first launch, and survives every new
//    game after it. You are the same person starting another company.
//
//    THE COMPANY NAME is asked at the start of each run, because that is
//    what a run is.
//
//  So they live in different stores - see useIdentityStore (kept out of the
//  new-game wipe on purpose) and useStatsStore (wiped with everything else).
// ============================================================================

export type Gender = 'male' | 'female';

/**
 * Sixteen characters.
 *
 * Long enough for the real names people have and short enough to sit in a
 * header next to a back button without shrinking. The limits are here rather
 * than inline so the screen and the store cannot disagree about them.
 */
export const NAME_MIN = 2;
export const NAME_MAX = 16;

/** Longer, because companies are called things like "Northwind Logistics". */
export const COMPANY_MIN = 2;
export const COMPANY_MAX = 24;

/**
 * Collapse whitespace and trim.
 *
 * A name typed as "  John   Smith " is the same name as "John Smith", and
 * storing the first version means every screen that shows it inherits the
 * spacing. Done on the way IN, once, rather than by each screen on the way
 * out.
 */
export const tidy = (raw: string): string => raw.replace(/\s+/g, ' ').trim();

/**
 * What a name may contain: letters from any alphabet, spaces, apostrophes,
 * hyphens and full stops. That covers O'Brien, Jean-Luc, and J. R. Ewing.
 *
 * `\p{L}` with the `u` flag rather than [A-Za-z], because the game is played
 * in Turkish too and Şükrü is a name.
 */
const NAME_SHAPE = /^[\p{L}][\p{L} '.\-]*$/u;

export type Check = { ok: true } | { ok: false; reason: string };

const lengthCheck = (value: string, min: number, max: number, what: string): Check | null => {
    if (value.length < min) return { ok: false, reason: `${what} needs at least ${min} characters.` };
    if (value.length > max) return { ok: false, reason: `${what} can be at most ${max} characters.` };
    return null;
};

export const checkName = (raw: string, what = 'This'): Check => {
    const v = tidy(raw);
    const len = lengthCheck(v, NAME_MIN, NAME_MAX, what);
    if (len) return len;
    if (!NAME_SHAPE.test(v)) {
        return { ok: false, reason: `${what} can only use letters, spaces, apostrophes and hyphens.` };
    }
    return { ok: true };
};

/**
 * A company name is allowed digits and `&`, which a person's name is not:
 * "Studio 54" and "Dunder & Co" are both reasonable, "John 54" is a typo.
 */
const COMPANY_SHAPE = /^[\p{L}\p{N}][\p{L}\p{N} '.\-&]*$/u;

export const checkCompany = (raw: string): Check => {
    const v = tidy(raw);
    const len = lengthCheck(v, COMPANY_MIN, COMPANY_MAX, 'A company name');
    if (len) return len;
    if (!COMPANY_SHAPE.test(v)) {
        return { ok: false, reason: 'A company name can only use letters, numbers, spaces and & . - \'' };
    }
    return { ok: true };
};

/** Both names as one string, for the places that show a person rather than a field. */
export const fullName = (firstName: string, lastName: string): string =>
    tidy(`${firstName} ${lastName}`);
