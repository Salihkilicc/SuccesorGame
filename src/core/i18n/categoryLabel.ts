// src/core/i18n/categoryLabel.ts
//
// ============================================================================
//  A SECTOR KEY IS NOT A LABEL, AND IT HAD BEEN BOTH
// ============================================================================
//
//  Reported from a device, as two separate complaints that turned out to be
//  one bug: the filters on the hostile takeover screen were in English, and so
//  were the headings in the research centre where products are unlocked.
//
//  Both are the same line of code written twice:
//
//      <Text>{category}</Text>
//
//  `category` is a key. It groups products, it gates the tech tree, it filters
//  the acquisition list, and it is compared with `===` in a dozen places. It
//  is also, because it happens to be made of English words, what the player
//  was reading. So the string had two jobs and could only be correct at one of
//  them: translating the data would have broken every comparison, and leaving
//  it alone left a Turkish player looking at "Deep Tech".
//
//  ---------------------------------------------------------------------------
//  WHY THE AUDIT SAID ZERO WHILE THIS WAS ON SCREEN
//  ---------------------------------------------------------------------------
//  `scripts/untranslated.js` looks for English LITERALS sitting in JSX. That
//  is the right net for the mistake this project kept making, and this English
//  was never a literal in a screen: it lived in a data file as `category:
//  'Robotics'` and arrived at the Text node through a variable. The audit was
//  reading the screen and the English was in the cupboard.
//
//  There is no general fix for that in a script - following every identifier
//  back to its source is a type checker's job, not a regex's. What closes it
//  instead is `categoryLabel.test.ts`, which reads the CATEGORY LITERALS OUT
//  OF THE DATA FILES and fails if any of them lacks a translation. The set is
//  small and closed, so closing it is cheap.
//
//  ---------------------------------------------------------------------------
//  IT FALLS BACK TO THE KEY, DELIBERATELY
//  ---------------------------------------------------------------------------
//  A category added to the data tomorrow and not to the catalogue shows up as
//  "Deep Tech" rather than as a blank chip or the word "undefined". Half
//  translated is ugly; empty is broken. The test is what stops it staying
//  that way, and the test failing is how anybody finds out.
// ============================================================================

import { t, hasKey } from './index';

/**
 * Every category the shipping data actually uses, plus the two the acquisition
 * filter synthesises.
 *
 * `All` and `Other` are not in any data file: AcquisitionModal builds its tab
 * strip by collecting the categories present and prepending "All", and uses
 * "Other" for a company with no category at all. They are labels on the same
 * strip as the real ones, so they translate through the same door.
 */
export const CATEGORY_KEYS = [
    'All',
    'Bio-Tech',
    'Consumer',
    'Deep Tech',
    'Industrial',
    'Media',
    'Other',
    'Primary',
    'Retail',
    'Robotics',
    'Technology',
] as const;

export type CategoryKey = typeof CATEGORY_KEYS[number];

/**
 * The catalogue key for a category.
 *
 * Lower cased with the punctuation taken out, so `Deep Tech` and `Bio-Tech`
 * become `sector.deepTech` and `sector.bioTech` rather than keys with a space
 * and a hyphen in them.
 */
export const categoryKeyFor = (category: string): string => {
    const camel = category
        .split(/[\s-]+/)
        .map((part, i) =>
            i === 0
                ? part.charAt(0).toLowerCase() + part.slice(1)
                : part.charAt(0).toUpperCase() + part.slice(1),
        )
        .join('');
    return `sector.${camel.charAt(0).toLowerCase()}${camel.slice(1)}`;
};

/**
 * What to put on the screen for a category.
 *
 * Call this at every Text node that shows one. Never translate the value in
 * the data, and never compare against the result of this: the key is the
 * identity and this is only ever the face.
 */
export const categoryLabel = (category: string | null | undefined): string => {
    if (!category) return '';
    const key = categoryKeyFor(category);
    return hasKey(key) ? t(key) : category;
};
