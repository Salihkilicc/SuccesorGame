// @survives-new-game the chosen language is a preference, not a save. A new
// company must not put the app back into English.
//
// src/core/i18n/index.ts
//
// ============================================================================
//  DİL — tek kaynak, kalıcı, İngilizceye düşen
// ============================================================================
//
//  NEDEN BU DOSYA VAR
//  ------------------
//  Oyunda zaten bir dil "ayari" vardi: HomeScreen icinde
//  `useState<'EN'|'TR'>('EN')` ve bir dugme. Dugmeye basinca yalnizca
//  o ekrandaki etiket degisiyordu — hicbir metin cevrilmiyordu, ve deger
//  ekran kapaninca kayboluyordu. Yani onuncu kez ayni desen: yazilmis,
//  baglanmamis.
//
//  BU PROJEDE OGRENILEN DERS: iki kaynak birakirsan sessizce ayrilirlar.
//  O yuzden dil TEK yerde tutulur ve TEK fonksiyondan okunur.
//
//  KULLANIM
//  --------
//      import { t } from '../../core/i18n';
//      <Text>{t('report.netIncome')}</Text>
//      <Text>{t('bank.available', { amount: '$14M' })}</Text>
//
//  Bilesenlerin dil degisince yeniden cizilmesi icin `useLocale()`
//  cagirmak yeterli — t() saf, useLocale abonelik saglar.
//
//  ANAHTAR BULUNAMAZSA: Ingilizce metin doner, bulunamazsa anahtarin
//  kendisi doner. Ceviri eksik diye ekran BOS KALMAZ. Bu bilincli: 656
//  metinlik bir sweep tek seferde bitmez, ve yarim cevrilmis bir uygulama
//  calisir kalmali.
//
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { resolveInitialLocale } from './deviceLocale';
import { en } from './en';
import { tr } from './tr';

export type Locale = 'en' | 'tr';

export const LOCALES: { code: Locale; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'tr', label: 'Turkish', native: 'Türkçe' },
];

/**
 * The language the game falls back to, and the only one guaranteed complete.
 *
 * `t()` already falls through to the English catalogue for a missing key, so
 * this is the same choice stated twice deliberately: English is both the last
 * resort for a single string and the last resort for a whole device.
 */
export const FALLBACK_LOCALE: Locale = 'en';

/**
 * Derived, never written out by hand.
 *
 * A second list of codes beside LOCALES is two sources that drift, which is
 * the failure this project keeps meeting. Adding a language is then one row in
 * LOCALES and a catalogue, and the device resolver picks it up with no further
 * edit anywhere.
 */
const SUPPORTED_CODES: readonly Locale[] = LOCALES.map(l => l.code);

const CATALOGS: Record<Locale, Record<string, string>> = { en, tr };

interface LocaleState {
    locale: Locale;
    setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
    persist(
        (set) => ({
            // SHELVED, and kept here because the reason it was wrong is not
            // obvious from the line that replaced it:
            //
            //     locale: 'en',
            //
            // A literal here is the right default for one audience and the
            // wrong one for the primary market. It is not a bug that reports
            // itself either: the game works perfectly, in English, for someone
            // who owns 3037 Turkish strings they never see.
            //
            // READ ONCE, AT MODULE INIT, AND ONLY LOAD-BEARING WHEN THE DISK IS
            // EMPTY. `persist` rehydrates over the top of this, so a player who
            // has chosen a language keeps it even if they later change their
            // phone's language. See deviceLocale.ts for why that ordering is
            // the entire safety property.
            locale: resolveInitialLocale(SUPPORTED_CODES, FALLBACK_LOCALE),
            setLocale: (locale) => set({ locale }),
        }),
        { name: 'succesor_locale', storage: createJSONStorage(() => zustandStorage) },
    ),
);

/** Bilesende kullan: dil degisince yeniden cizilmeyi saglar. */
export const useLocale = (): Locale => useLocaleStore(s => s.locale);

/**
 * Metni cevir.
 *
 * `vars` ile yer tutucu doldurulur: t('a.b', { n: 5 }) -> "... {n} ..."
 *
 * DIKKAT: bu fonksiyon store'u DOGRUDAN okur, hook degildir. Bilesen
 * disinda da (Alert.alert, motor mesajlari) calisir. Ama bir bilesenin
 * dil degisiminde yeniden cizilmesi icin o bilesende `useLocale()`
 * cagrilmis olmali.
 */
export const t = (key: string, vars?: Record<string, string | number>): string => {
    const locale = useLocaleStore.getState().locale;
    const raw = CATALOGS[locale]?.[key] ?? CATALOGS.en[key] ?? key;
    if (!vars) return raw;
    return Object.keys(vars).reduce(
        (acc, k) => acc.split(`{${k}}`).join(String(vars[k])),
        raw,
    );
};

/**
 * Bu anahtar ICIN gercekten bir metin var mi.
 *
 * `t()` bulamadigi anahtarin KENDISINI dondurur, ki bu bilincli bir karar
 * (yukaridaki nota bakin: yarim cevrilmis uygulama calisir kalmali). Ama bazi
 * yerlerde cagiran tarafin "yoksa baska bir sey goster" demesi gerekir, ve
 * `t(k) === k` diye bakmak bir gun anahtarla ayni metni tasiyan bir kayitta
 * sessizce yanlis cevap verir.
 *
 * Ilk kullanan: partner is unvanlari. Turkce hepsini tek satirda karsiliyor,
 * Ingilizce ikisinde cinsiyete gore ayriliyor, ve olmayan varyant icin
 * genel olana dusulmesi gerekiyor. Bkz. features/love/logic/partnerText.ts
 */
export const hasKey = (key: string): boolean => {
    const locale = useLocaleStore.getState().locale;
    return key in (CATALOGS[locale] || {}) || key in CATALOGS.en;
};

/**
 * Cevrilmemis anahtarlari bulmak icin. Gelistirme sirasinda konsola
 * dokulur; yayinda cagrilmaz.
 */
export const missingKeys = (locale: Locale): string[] => {
    const target = CATALOGS[locale] || {};
    return Object.keys(CATALOGS.en).filter(k => !(k in target));
};
