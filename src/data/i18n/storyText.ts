// src/data/i18n/storyText.ts
//
// ============================================================================
//  THE STORY IN ANOTHER LANGUAGE
// ============================================================================
//
//  Eighteen thousand four hundred words of dialogue live in `src/data/`, hard
//  coded in English, and none of it is in the app's i18n system. This is the
//  layer that lets it be read in another language without touching a single
//  scene file.
//
//  ---------------------------------------------------------------------------
//  A SEPARATE DICTIONARY, NOT A `textTr` FIELD ON EVERY NODE
//  ---------------------------------------------------------------------------
//  Four reasons, and the third is the one that decided it.
//
//  1. A translator - human or machine - gets ONE file, not fifty-one.
//  2. The scene files stay readable. They are already mostly reasoning.
//  3. THE TESTS KEEP WORKING. Roughly forty assertions read English prose
//     (`expect(text).toContain('twice the rate')`). Translating the scene
//     files in place would break them all at once, and the failures would say
//     nothing useful about what went wrong.
//  4. A missing entry falls back to English VISIBLY, and `missingKeys` can
//     count what is left.
//
//  ---------------------------------------------------------------------------
//  THE KEY IS `conversationId/nodeId` AND `conversationId/nodeId#n`
//  ---------------------------------------------------------------------------
//  A card's body is `scene/card`. Its answers are `scene/card#0`, `#1` - by
//  index, because the button text is what identifies a choice and translating
//  it would make a text key circular.
//
//  Mail subjects are `scene/@subject`.
// ============================================================================

import { useLocaleStore } from '../../core/i18n';

export type StoryDictionary = Record<string, string>;

/** Body of a card. */
export const nodeKey = (conversationId: string, nodeId: string): string =>
    `${conversationId}/${nodeId}`;

/** One answer on a card, by position. */
export const choiceKey = (
    conversationId: string, nodeId: string, index: number,
): string => `${conversationId}/${nodeId}#${index}`;

/**
 * A tutorial lock's instruction.
 *
 * These are dialogue - the father says them over a dimmed screen - so they
 * belong in the same dictionary as everything else he says, rather than in
 * the UI catalogue with the button labels.
 */
export const lockKey = (lockId: string): string => `@lock/${lockId}`;

/** The subject line of a letter. */
export const subjectKey = (conversationId: string): string =>
    `${conversationId}/@subject`;

// ============================================================================
//  THE DICTIONARIES
// ============================================================================
//  `en` is deliberately EMPTY and stays that way. English is what the scene
//  files hold, so an English dictionary would be a second copy of the same
//  strings and the two would drift within a month.
// ============================================================================

export const STORY_TR: StoryDictionary = {
    // Filled by tools/exportStoryText.js -> a translator -> 
    // tools/importStoryText.js. Sorted by key; edit by re-importing.
    'event-friend-board-seat/open': 'asistanın takvimime "yönetim kurulu oryantasyonu" diye bir şey koymuş ve yirmi dakikadır ona bakıyorum\n\nbu gerçek bir şey mi yoksa biri yanlış kişiye mi tıkladı',
};

const DICTIONARIES: Record<string, StoryDictionary> = {
    tr: STORY_TR,
};

// ============================================================================
//  THERE IS NO SEPARATE STORY LANGUAGE SETTING
// ============================================================================
//
//  The first draft of this file held its own module-level `active` variable
//  and a `setStoryLanguage()` called at startup. That is a second source for
//  a fact the app already stores, and core/i18n/index.ts opens with the
//  reason not to do it: leave two and they drift. The drift here would be
//  particularly ugly - the menus in Turkish and the father dying in English,
//  or the reverse after a language change mid-campaign.
//
//  So the story reads the SAME store every button label reads. A component
//  showing story text calls `useLocale()` to be redrawn on a change, exactly
//  as it would for any other string.
// ============================================================================

export const storyLanguage = (): string | undefined => {
    const locale = useLocaleStore.getState().locale;
    return DICTIONARIES[locale] ? locale : undefined;
};

/**
 * Look up a line, falling back to the English the scene file holds.
 *
 * FALLS BACK RATHER THAN FAILING, on purpose. A half-translated game is
 * playable and a game that throws on a missing key is not - and the release
 * that matters is the one where somebody notices a stray English line, not
 * the one that crashes in the middle of the father's death.
 */
export const line = (key: string, english: string): string => {
    const active = storyLanguage();
    if (!active) return english;
    const translated = DICTIONARIES[active][key];
    return translated && translated.trim() ? translated : english;
};

// ============================================================================
//  WHAT IS LEFT
// ============================================================================

export interface Coverage {
    total: number;
    translated: number;
    missing: string[];
}

/**
 * How much of a language is done, measured against the real scene list.
 *
 * Counted rather than estimated, so "the Turkish is finished" is a claim
 * somebody can check instead of a feeling.
 */
export const coverage = (
    keys: string[],
    lang: string,
): Coverage => {
    const dict = DICTIONARIES[lang] ?? {};
    const missing = keys.filter(k => !dict[k] || !dict[k].trim());
    return { total: keys.length, translated: keys.length - missing.length, missing };
};
