// src/core/i18n/deviceLocale.test.ts
//
// ============================================================================
//  THE LANGUAGE THE GAME OPENS IN, AND THE ONE RULE THAT MUST NEVER BREAK
// ============================================================================
//
//  Every assertion in this file is cheap except one, and that one is the
//  reason the file exists:
//
//      A LANGUAGE THE PLAYER CHOSE BEATS THE PHONE'S LANGUAGE, ALWAYS.
//
//  Reading the device language and applying it on every launch is a one line
//  change away from what is written here, it passes every other test below,
//  and its symptom is a player who set English being dragged back to Turkish
//  when they change their phone's language. Nobody reports that as a bug. They
//  set it again, and then again, and then stop.
//
//  The second thing being defended is that none of this is about Turkish. The
//  resolver is run against locale sets the game does not ship, because the
//  point of the mechanism is the fifth country, not the second.
// ============================================================================

import { NativeModules, Platform } from 'react-native';

import {
    LEGACY_LANGUAGE_CODES,
    matchLocale,
    normaliseTag,
    readDeviceLanguageTags,
    resolveInitialLocale,
} from './deviceLocale';

// ---------------------------------------------------------------------------
//  Platform and NativeModules are shared mutable state in the preset, so each
//  test states what it needs and `afterEach` puts both back. A leaked
//  `SettingsManager` would otherwise make a later Android case read iOS.
// ---------------------------------------------------------------------------

const realOS = Platform.OS;

const setPlatform = (os: 'ios' | 'android'): void => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
};

const setIosLanguages = (preferred?: unknown, locale?: unknown): void => {
    setPlatform('ios');
    (NativeModules as any).SettingsManager = {
        settings: { AppleLanguages: preferred, AppleLocale: locale },
    };
};

const setAndroidLocale = (identifier: unknown): void => {
    setPlatform('android');
    (NativeModules as any).I18nManager = { localeIdentifier: identifier };
};

afterEach(() => {
    setPlatform(realOS as 'ios' | 'android');
    delete (NativeModules as any).SettingsManager;
    delete (NativeModules as any).I18nManager;
    jest.resetModules();
});

// ===========================================================================
//  1. THE TAG, AS THE PLATFORMS ACTUALLY HAND IT OVER
// ===========================================================================

describe('normaliseTag', () => {
    it('accepts the three separators the platforms disagree about', () => {
        expect(normaliseTag('tr_TR')).toBe('tr-tr');       // Android
        expect(normaliseTag('tr-TR')).toBe('tr-tr');       // iOS
        expect(normaliseTag('tr')).toBe('tr');             // bare language
    });

    it('strips the POSIX and ICU suffixes that ride along', () => {
        expect(normaliseTag('tr_TR.UTF-8')).toBe('tr-tr');
        expect(normaliseTag('th_TH@calendar=buddhist')).toBe('th-th');
        expect(normaliseTag('  en_GB  ')).toBe('en-gb');
    });

    it('keeps a script subtag rather than throwing the tag away', () => {
        expect(normaliseTag('zh-Hans-CN')).toBe('zh-hans-cn');
    });

    it('refuses anything that is not a language tag', () => {
        // The empty string is the one that matters: ''.split('-')[0] is '',
        // which would compare equal to an empty supported entry.
        expect(normaliseTag('')).toBeNull();
        expect(normaliseTag('   ')).toBeNull();
        expect(normaliseTag(null)).toBeNull();
        expect(normaliseTag(undefined)).toBeNull();
        expect(normaliseTag(42)).toBeNull();
        expect(normaliseTag({})).toBeNull();
        expect(normaliseTag('C')).toBeNull();              // POSIX default
        expect(normaliseTag('not a tag')).toBeNull();
    });
});

// ===========================================================================
//  2. MATCHING, AGAINST LOCALE SETS THE GAME DOES NOT SHIP
// ===========================================================================

describe('matchLocale', () => {
    const TWO = ['en', 'tr'] as const;

    it('resolves the two languages that ship today', () => {
        expect(matchLocale(['tr-TR'], TWO, 'en')).toBe('tr');
        expect(matchLocale(['en-US'], TWO, 'en')).toBe('en');
    });

    it('falls back for a language with no catalogue', () => {
        expect(matchLocale(['de-DE'], TWO, 'en')).toBe('en');
        expect(matchLocale(['ja'], TWO, 'en')).toBe('en');
    });

    it('falls back when there is nothing to go on', () => {
        expect(matchLocale([], TWO, 'en')).toBe('en');
        expect(matchLocale([null, undefined, ''], TWO, 'en')).toBe('en');
    });

    // -----------------------------------------------------------------------
    //  The ordered list is the point of reading a list at all
    // -----------------------------------------------------------------------
    it('walks the preference list instead of giving up on the first miss', () => {
        // German first, but this player also reads Turkish and the game speaks
        // it. Taking only preferred[0] would hand back English here, which is
        // the plausible wrong implementation.
        expect(matchLocale(['de-DE', 'tr-TR', 'en-US'], TWO, 'en')).toBe('tr');
    });

    it('prefers an earlier supported language over a later one', () => {
        expect(matchLocale(['tr', 'en'], TWO, 'en')).toBe('tr');
        expect(matchLocale(['en', 'tr'], TWO, 'en')).toBe('en');
    });

    // -----------------------------------------------------------------------
    //  Regional catalogues. None of these locales exist in the game.
    // -----------------------------------------------------------------------
    it('matches an exact regional tag before the bare language', () => {
        const SET = ['en', 'pt-PT', 'pt-BR'] as const;
        expect(matchLocale(['pt-BR'], SET, 'en')).toBe('pt-BR');
        expect(matchLocale(['pt-PT'], SET, 'en')).toBe('pt-PT');
    });

    it('gives a bare language the first regional catalogue for it', () => {
        const SET = ['en', 'pt-BR'] as const;
        expect(matchLocale(['pt'], SET, 'en')).toBe('pt-BR');
    });

    it('gives an unlisted region the catalogue for its language', () => {
        const SET = ['en', 'es'] as const;
        expect(matchLocale(['es-419'], SET, 'en')).toBe('es');
        expect(matchLocale(['es-MX'], SET, 'en')).toBe('es');
    });

    it('is not confused by case on either side', () => {
        const SET = ['en', 'pt-BR'] as const;
        expect(matchLocale(['PT-br'], SET, 'en')).toBe('pt-BR');
    });

    // -----------------------------------------------------------------------
    //  Android's obsolete ISO codes
    // -----------------------------------------------------------------------
    it("accepts Android's pre 1989 codes for a modern supported list", () => {
        const SET = ['en', 'he', 'id'] as const;
        expect(matchLocale(['iw_IL'], SET, 'en')).toBe('he');
        expect(matchLocale(['in_ID'], SET, 'en')).toBe('id');
    });

    it('has a legacy entry for every code it claims to handle', () => {
        // Guards the map against an entry being half added: a key that maps to
        // itself would silently do nothing.
        for (const [legacy, modern] of Object.entries(LEGACY_LANGUAGE_CODES)) {
            expect(legacy).not.toBe(modern);
            expect(normaliseTag(legacy)).toBe(legacy);
            expect(normaliseTag(modern)).toBe(modern);
        }
    });

    it('always returns a member of the supported list', () => {
        const SET = ['en', 'tr', 'pt-BR'] as const;
        const inputs = [
            'tr', 'tr-TR', 'en', 'pt', 'pt-BR', 'de', 'zh-Hans-CN', 'iw',
            '', 'C', 'not a tag', null, undefined,
        ];
        for (const input of inputs) {
            expect(SET).toContain(matchLocale([input], SET, 'en'));
        }
    });
});

// ===========================================================================
//  3. READING THE DEVICE
// ===========================================================================

describe('readDeviceLanguageTags', () => {
    it('reads the ordered preference list on iOS', () => {
        setIosLanguages(['tr-TR', 'en-US'], 'en_US');
        expect(readDeviceLanguageTags()).toEqual(['tr-tr', 'en-us']);
    });

    it('consults AppleLocale after the preference list, not instead of it', () => {
        setIosLanguages(['tr-TR'], 'de_DE');
        expect(readDeviceLanguageTags()).toEqual(['tr-tr', 'de-de']);
    });

    it('does not repeat a tag that appears in both iOS sources', () => {
        setIosLanguages(['tr-TR'], 'tr_TR');
        expect(readDeviceLanguageTags()).toEqual(['tr-tr']);
    });

    it('reads the single active locale on Android', () => {
        setAndroidLocale('tr_TR');
        expect(readDeviceLanguageTags()).toEqual(['tr-tr']);
    });

    // -----------------------------------------------------------------------
    //  Every one of these must be an empty list, never a throw. A game that
    //  will not start because it could not work out which language to start
    //  in is an absurd way to lose a player.
    // -----------------------------------------------------------------------
    it('answers an empty list when the native module is absent', () => {
        setPlatform('android');
        delete (NativeModules as any).I18nManager;
        expect(readDeviceLanguageTags()).toEqual([]);

        setPlatform('ios');
        delete (NativeModules as any).SettingsManager;
        expect(readDeviceLanguageTags()).toEqual([]);
    });

    it('answers an empty list for a module that is present but useless', () => {
        setIosLanguages(undefined, undefined);
        expect(readDeviceLanguageTags()).toEqual([]);

        setIosLanguages('tr-TR', undefined);   // a string, not the array
        expect(readDeviceLanguageTags()).toEqual([]);

        setAndroidLocale(null);
        expect(readDeviceLanguageTags()).toEqual([]);
    });

    it('does not throw when reading the module itself throws', () => {
        setPlatform('android');
        Object.defineProperty(NativeModules, 'I18nManager', {
            configurable: true,
            get() { throw new Error('native side exploded'); },
        });
        expect(() => readDeviceLanguageTags()).not.toThrow();
        expect(readDeviceLanguageTags()).toEqual([]);
    });
});

describe('resolveInitialLocale', () => {
    it('opens in Turkish on a Turkish phone', () => {
        setAndroidLocale('tr_TR');
        expect(resolveInitialLocale(['en', 'tr'], 'en')).toBe('tr');
    });

    it('opens in English on a phone speaking a language the game does not', () => {
        setAndroidLocale('de_DE');
        expect(resolveInitialLocale(['en', 'tr'], 'en')).toBe('en');
    });

    it('opens in the fallback when the device cannot be read', () => {
        setPlatform('android');
        delete (NativeModules as any).I18nManager;
        expect(resolveInitialLocale(['en', 'tr'], 'en')).toBe('en');
    });
});

// ===========================================================================
//  4. NOTHING HERE IS ABOUT TURKISH
// ===========================================================================

describe('the resolver is not written around the two languages that ship', () => {
    it('names no locale code of its own', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs') as typeof import('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path') as typeof import('path');

        const source = fs.readFileSync(
            path.join(__dirname, 'deviceLocale.ts'),
            'utf8',
        );

        // Comments explain the Turkish player at length and should keep doing
        // so. Code must not: a quoted 'tr' or 'en' in the executable half
        // would mean the fifth language needs this file edited.
        const code = source
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');

        expect(code).not.toMatch(/['"`](en|tr)['"`]/);
    });

    it('is given its supported list rather than holding one', () => {
        // A made up pair with no overlap with the real catalogues. If the
        // resolver had hard coded 'en' as a fallback this returns 'en'.
        setAndroidLocale('ja_JP');
        expect(resolveInitialLocale(['ko', 'ja'], 'ko')).toBe('ja');

        setAndroidLocale('fi_FI');
        expect(resolveInitialLocale(['ko', 'ja'], 'ko')).toBe('ko');
    });
});

// ===========================================================================
//  5. THE RULE THAT MATTERS: A SAVED CHOICE BEATS THE PHONE
// ===========================================================================
//
//  These load the real store, through the real `persist`, against the mocked
//  AsyncStorage from jest.setup.js. `jest.isolateModules` is required: the
//  store is created once per module registry, and a store imported at the top
//  of the file would have resolved its language before the first test set a
//  device locale.
// ===========================================================================

describe('useLocaleStore', () => {
    /**
     * Load i18n fresh inside its own registry and let persist rehydrate.
     *
     * -----------------------------------------------------------------------
     *  THE DEVICE LOCALE IS SET INSIDE THE ISOLATE, AND THAT IS NOT A STYLE
     *  CHOICE
     * -----------------------------------------------------------------------
     *  `jest.isolateModules` hands out a private module registry, so the
     *  `react-native` required in there is a DIFFERENT OBJECT from the one at
     *  the top of this file. Setting NativeModules outside and requiring the
     *  store inside means the store reads an untouched module and resolves to
     *  the fallback every time.
     *
     *  Written that way first, and it cost two tests: the Turkish case failed
     *  honestly, and three others went GREEN FOR THE WRONG REASON. They all
     *  expected English, and English is what a failed device read returns, so
     *  "a saved choice beats the phone" was passing without a phone being
     *  read at all. That is the exact shape of bug this file is here to catch,
     *  reproduced in the file itself.
     * -----------------------------------------------------------------------
     */
    type Device = { os: 'ios' | 'android'; tag?: unknown; preferred?: unknown };

    const loadStore = (device: Device): any => {
        let api: any;
        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const RN = require('react-native');
            Object.defineProperty(RN.Platform, 'OS', {
                value: device.os,
                configurable: true,
            });
            if (device.os === 'ios') {
                RN.NativeModules.SettingsManager = {
                    settings: {
                        AppleLanguages: device.preferred,
                        AppleLocale: device.tag,
                    },
                };
            } else {
                RN.NativeModules.I18nManager = { localeIdentifier: device.tag };
            }

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            api = require('./index').useLocaleStore;
        });
        return api;
    };

    const freshStore = async (device: Device): Promise<{ locale: string }> => {
        const api = loadStore(device);

        // persist reads asynchronously. Wait for it rather than guessing a
        // number of microtasks, which is the kind of flake that gets a whole
        // file skipped later.
        if (api.persist?.hasHydrated && !api.persist.hasHydrated()) {
            await new Promise<void>(resolve => {
                const stop = api.persist.onFinishHydration(() => { stop?.(); resolve(); });
            });
        }
        return api.getState();
    };

    const storedLocale = (locale: string): void => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        AsyncStorage.getItem.mockImplementation(async (key: string) =>
            key === 'succesor_locale'
                ? JSON.stringify({ state: { locale }, version: 0 })
                : null,
        );
    };

    const storedNothing = (): void => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        AsyncStorage.getItem.mockImplementation(async () => null);
    };

    const TURKISH_PHONE: Device = { os: 'android', tag: 'tr_TR' };
    const ENGLISH_PHONE: Device = { os: 'android', tag: 'en_US' };
    const GERMAN_PHONE: Device = { os: 'android', tag: 'de_DE' };

    it('starts a brand new install in the phone language', async () => {
        storedNothing();
        expect((await freshStore(TURKISH_PHONE)).locale).toBe('tr');
    });

    it('starts a brand new install in English on an unsupported phone', async () => {
        storedNothing();
        expect((await freshStore(GERMAN_PHONE)).locale).toBe('en');
    });

    it('reads the iOS preference list on a brand new install', async () => {
        storedNothing();
        const iphone: Device = {
            os: 'ios',
            preferred: ['de-DE', 'tr-TR', 'en-US'],
            tag: 'de_DE',
        };
        expect((await freshStore(iphone)).locale).toBe('tr');
    });

    // -----------------------------------------------------------------------
    //  THE ONE THAT MUST NEVER GO GREEN FOR THE WRONG REASON
    // -----------------------------------------------------------------------
    //  Note the pairing. Each of these asserts the SAME device resolves the
    //  OTHER way when the disk is empty, so a broken device read cannot make
    //  them pass: the first half would fail first.
    // -----------------------------------------------------------------------
    it('keeps a chosen English over a Turkish phone', async () => {
        storedNothing();
        expect((await freshStore(TURKISH_PHONE)).locale).toBe('tr');

        storedLocale('en');
        expect((await freshStore(TURKISH_PHONE)).locale).toBe('en');
    });

    it('keeps a chosen Turkish over an English phone', async () => {
        storedNothing();
        expect((await freshStore(ENGLISH_PHONE)).locale).toBe('en');

        storedLocale('tr');
        expect((await freshStore(ENGLISH_PHONE)).locale).toBe('tr');
    });

    it('does not move an existing player when they change their phone language', async () => {
        // The sequence that would be silent in the field: a player set English
        // months ago, then switches their phone to Turkish for something else.
        storedLocale('en');
        expect((await freshStore(ENGLISH_PHONE)).locale).toBe('en');
        expect((await freshStore(TURKISH_PHONE)).locale).toBe('en');
    });

    it('still lets the player change language afterwards', async () => {
        storedNothing();
        const api = loadStore(TURKISH_PHONE);
        expect(api.getState().locale).toBe('tr');

        api.getState().setLocale('en');
        expect(api.getState().locale).toBe('en');
    });

    afterEach(() => {
        storedNothing();
    });
});
