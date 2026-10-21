// src/core/i18n/deviceLocale.ts
//
// ============================================================================
//  WHICH LANGUAGE THE GAME OPENS IN, THE FIRST TIME SOMEBODY OPENS IT
// ============================================================================
//
//  `useLocaleStore` carried `locale: 'en'` as a literal. That is a reasonable
//  default for exactly one audience, and the primary market is not it: a Turkish
//  player downloaded a game that holds 3037 Turkish strings and was shown
//  English until they found the language row in Settings. Most people do not go
//  looking. They decide the game is not for them and close it.
//
//  There is no second build and there is no first-launch language picker. One
//  binary carries every catalogue, and the device already knows the answer.
//
//  ---------------------------------------------------------------------------
//  AN EXPLICIT CHOICE MUST ALWAYS BEAT THE DEVICE, AND THAT IS WHY THIS IS
//  ONLY THE INITIAL STATE
//  ---------------------------------------------------------------------------
//  This resolver is read ONCE, as the initial value of a persisted store, and
//  it is therefore only ever load-bearing when the disk holds nothing. If the
//  player has chosen a language, `persist` rehydrates over the top of it and
//  this file's answer is discarded.
//
//  That ordering is the whole safety property. Reading the device language on
//  every launch and applying it would mean a player who deliberately set
//  English gets dragged back to Turkish the moment they change their phone's
//  language, which is a preference being overwritten by a machine.
//
//  There is no flash of the wrong language while the disk read is in flight:
//  App.tsx does not render until `warmUpStorage()` resolves.
//
//  ---------------------------------------------------------------------------
//  NO NEW DEPENDENCY
//  ---------------------------------------------------------------------------
//  `react-native-localize` is the usual answer and it would mean another
//  package, another `pod install`, and another native module that can fail to
//  build. React Native already exposes the language on both platforms through
//  modules that ship with the framework, so this reads those directly.
//
//  Every read is wrapped and every failure path returns an empty list rather
//  than throwing. A game that will not start because it could not work out
//  which language to start in would be an absurd way to lose a player.
//
//  ---------------------------------------------------------------------------
//  BUILT FOR THE CATALOGUES THAT DO NOT EXIST YET
//  ---------------------------------------------------------------------------
//  Nothing here names Turkish or English. The supported list is passed in from
//  i18n/index.ts, which derives it from `LOCALES`. Adding a fifth country is
//  then a catalogue plus one row in `LOCALES`; this file does not get edited,
//  and `deviceLocale.test.ts` proves that by resolving against made up locale
//  sets that the game does not ship.
// ============================================================================

import { NativeModules, Platform } from 'react-native';

/**
 * Language codes Android still reports under their pre 1989 ISO names.
 *
 * `java.util.Locale` keeps the obsolete codes for backwards compatibility, so
 * a Hebrew device reports `iw` and never `he`. A supported list written from
 * the modern codes would therefore miss them, and the failure would be
 * invisible from here: the fallback is a real language, so the player just
 * silently gets English.
 *
 * Left as a map rather than folded into the matcher so a new one can be added
 * without touching the matching rules.
 */
export const LEGACY_LANGUAGE_CODES: Record<string, string> = {
    iw: 'he',   // Hebrew
    in: 'id',   // Indonesian
    ji: 'yi',   // Yiddish
    tl: 'fil',  // Tagalog, which Android reports for Filipino
};

/**
 * Reduce whatever the platform handed over to a comparable BCP 47 tag.
 *
 * The platforms disagree about nearly every detail. Android returns
 * `tr_TR` with an underscore; iOS returns `tr-TR` with a hyphen; a POSIX style
 * value can arrive as `tr_TR.UTF-8`, and a calendar or collation override
 * appends `@calendar=buddhist`. All four mean Turkish.
 *
 * Returns null for anything that is not a language tag, which includes the
 * empty string, because `''.split('-')[0]` is `''` and an empty language code
 * would match an empty supported entry if one ever appeared.
 */
export const normaliseTag = (raw: unknown): string | null => {
    if (typeof raw !== 'string') return null;

    const cleaned = raw
        .trim()
        .split('@')[0]      // drop @calendar=, @collation=
        .split('.')[0]      // drop .UTF-8
        .replace(/_/g, '-')
        .toLowerCase();

    if (!/^[a-z]{2,8}(-[a-z0-9]{1,8})*$/.test(cleaned)) return null;
    return cleaned;
};

/**
 * The player's preferred languages, best first.
 *
 * iOS returns an ORDERED LIST and that list is the point. Someone whose phone
 * is set to German, then Turkish, then English should get Turkish from a game
 * that speaks Turkish and English, not English because German failed to match
 * and nobody looked further. Android exposes only the single active locale.
 */
export const readDeviceLanguageTags = (): string[] => {
    const tags: string[] = [];

    const push = (raw: unknown): void => {
        const tag = normaliseTag(raw);
        if (tag && !tags.includes(tag)) tags.push(tag);
    };

    try {
        if (Platform.OS === 'ios') {
            const settings = (NativeModules as any)?.SettingsManager?.settings;

            // AppleLanguages is the language PREFERENCE list, which is the
            // question being asked. AppleLocale is the region FORMAT locale and
            // is consulted second: its language subtag is usually the same, but
            // it is chosen for date and number formatting rather than for text,
            // so it is the weaker signal of the two.
            const preferred = settings?.AppleLanguages;
            if (Array.isArray(preferred)) for (const tag of preferred) push(tag);
            push(settings?.AppleLocale);
        } else {
            push((NativeModules as any)?.I18nManager?.localeIdentifier);
        }
    } catch {
        // A missing or renamed native module is not an error worth surfacing.
        // An empty list is a complete answer: it means "use the fallback".
    }

    return tags;
};

/**
 * Pick the best supported locale for a list of preferred tags.
 *
 * Pure, and exported separately from the native read so the interesting half
 * can be tested without a device. Four passes, in descending specificity:
 *
 *   1. exact tag          device `pt-br`  against supported `pt-BR`
 *   2. language only      device `tr-TR`  against supported `tr`
 *   3. language to region device `pt`     against supported `pt-BR`
 *   4. the fallback
 *
 * Passes 1 and 3 do nothing today, because the game ships bare `en` and `tr`.
 * They are here because the first regional catalogue is the moment this would
 * otherwise break, and it would break by quietly returning English.
 */
export const matchLocale = <T extends string>(
    preferred: readonly (string | null | undefined)[],
    supported: readonly T[],
    fallback: T,
): T => {
    const lower = supported.map(code => ({ code, lower: code.toLowerCase() }));

    const baseOf = (tag: string): string => {
        const head = tag.split('-')[0];
        return LEGACY_LANGUAGE_CODES[head] ?? head;
    };

    for (const raw of preferred) {
        const tag = normaliseTag(raw);
        if (!tag) continue;

        const exact = lower.find(s => s.lower === tag);
        if (exact) return exact.code;

        const base = baseOf(tag);

        const language = lower.find(s => s.lower === base);
        if (language) return language.code;

        const region = lower.find(s => baseOf(s.lower) === base);
        if (region) return region.code;
    }

    return fallback;
};

/**
 * What the store should start in when the disk holds nothing.
 *
 * Never throws, always returns a member of `supported` provided `fallback` is
 * one, and is called exactly once per launch at module initialisation.
 */
export const resolveInitialLocale = <T extends string>(
    supported: readonly T[],
    fallback: T,
): T => matchLocale(readDeviceLanguageTags(), supported, fallback);
