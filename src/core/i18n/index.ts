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
import { en } from './en';
import { tr } from './tr';

export type Locale = 'en' | 'tr';

export const LOCALES: { code: Locale; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'tr', label: 'Turkish', native: 'Türkçe' },
];

const CATALOGS: Record<Locale, Record<string, string>> = { en, tr };

interface LocaleState {
    locale: Locale;
    setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
    persist(
        (set) => ({
            locale: 'en',
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
 * Cevrilmemis anahtarlari bulmak icin. Gelistirme sirasinda konsola
 * dokulur; yayinda cagrilmaz.
 */
export const missingKeys = (locale: Locale): string[] => {
    const target = CATALOGS[locale] || {};
    return Object.keys(CATALOGS.en).filter(k => !(k in target));
};
