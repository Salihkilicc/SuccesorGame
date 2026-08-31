// src/data/i18n/profileLoveShopText.ts
//
// ============================================================================
//  PROFILE, LOVE & SHOPPING DYNAMIC TRANSLATION REGISTRY
// ============================================================================
//
//  Handles dynamic strings for:
//   - Heirs' education levels (Elementary, High School, Ivy League, PhD...)
//   - Social classes and tiers (High Society, Corporate Elite, Working Class...)
//   - Character psychometric traits (Analytical, Charismatic, Reckless, Visionary...)
//   - Partner occupations (Venture Capitalist, Art Gallerist, Supermodel...)
//   - Luxury store categories and asset rarities (Legendary, Sovereign...)
//
//  Strict Language Isolation:
//   - When locale === 'en', guarantees 100% English.
//   - When locale === 'tr', returns curated, atmospheric Turkish terms.
// ============================================================================

import { useLocaleStore } from '../../core/i18n';

export const EDUCATION_TR: Record<string, string> = {
    'None': 'Eğitim Yok',
    'Elementary': 'İlkokul',
    'High School': 'Lise',
    'Undergraduate': 'Lisans',
    'Ivy League': 'Ivy League',
    'PhD': 'Doktora',
    'Boarding School': 'Yatılı Okul',
    'Private Tutor': 'Özel Mürebbiye',
};

export const SOCIAL_CLASS_TR: Record<string, string> = {
    'High Society': 'Yüksek Sosyete',
    'Corporate Elite': 'Kurumsal Elit',
    'Underground': 'Yeraltı',
    'Blue Collar': 'Mavi Yaka',
    'Student Life': 'Öğrenci Hayatı',
    'Student': 'Öğrenci',
    'Artistic': 'Sanatsal',
    'Elite': 'Elit',
    'Upper Class': 'Üst Sınıf',
    'Middle Class': 'Orta Sınıf',
    'Working Class': 'İşçi Sınıfı',
};

export const TRAITS_TR: Record<string, string> = {
    'Analytical': 'Analitik',
    'Charismatic': 'Karizmatik',
    'Reckless': 'Pervasız',
    'Frugal': 'Tutumlu',
    'Ruthless': 'Acımasız',
    'Visionary': 'Vizyoner',
    'Prodigy': 'Harika Çocuk',
    'Cautious': 'Temkinli',
    'Creative': 'Yaratıcı',
    'Aggressive': 'Agresif',
    'Diplomatic': 'Diplomatik',
    'Ambitious': 'Hırslı',
    'Loyal': 'Sadık',
    'Independent': 'Bağımsız',
    'Decisive': 'Kararlı',
};

export const OCCUPATIONS_TR: Record<string, string> = {
    'Venture Capitalist': 'Girişim Sermayedarı',
    'Art Gallerist': 'Sanat Galerisi Sahibi',
    'Supermodel': 'Süpermodel',
    'Tech Founder': 'Teknoloji Kurucusu',
    'Corporate Lawyer': 'Şirket Avukatı',
    'Private Banker': 'Özel Bankacı',
    'Underground DJ': "Yeraltı DJ'i",
    'Student': 'Öğrenci',
    'Barista': 'Barista',
    'Fashion Designer': 'Moda Tasarımcısı',
    'Unemployed': 'İşsiz',
    'Socialite': 'Sosyete Mensubu',
    'Hedge Fund Analyst': 'Hedge Fon Analisti',
    'Architect': 'Mimar',
};

export const RARITIES_TR: Record<string, string> = {
    'COMMON': 'YAYGIN',
    'RARE': 'NADİR',
    'EPIC': 'DESTANSI',
    'LEGENDARY': 'EFSANEVİ',
    'MYTHIC': 'MİTİK',
    'SOVEREIGN': 'EGEMEN',
};

export const CATEGORIES_TR: Record<string, string> = {
    'VEHICLE': 'Araçlar',
    'REAL_ESTATE': 'Gayrimenkul',
    'WATCH': 'Saatler',
    'JEWELRY': 'Mücevher',
    'MARINE': 'Denizcilik',
    'AIRCRAFT': 'Havacılık',
    'COLLECTION': 'Koleksiyon',
};

// Build reverse lookups for 100% strict isolation back to English
const REVERSE_EDUCATION_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(EDUCATION_TR)) {
    REVERSE_EDUCATION_EN[tr] = en;
}

const REVERSE_SOCIAL_CLASS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(SOCIAL_CLASS_TR)) {
    REVERSE_SOCIAL_CLASS_EN[tr] = en;
}

const REVERSE_TRAITS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(TRAITS_TR)) {
    REVERSE_TRAITS_EN[tr] = en;
}

const REVERSE_OCCUPATIONS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(OCCUPATIONS_TR)) {
    REVERSE_OCCUPATIONS_EN[tr] = en;
}

const REVERSE_RARITIES_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(RARITIES_TR)) {
    REVERSE_RARITIES_EN[tr] = en;
}

const REVERSE_CATEGORIES_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(CATEGORIES_TR)) {
    REVERSE_CATEGORIES_EN[tr] = en;
}

export const translateEducationLevel = (edu: string): string => {
    if (!edu) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_EDUCATION_EN[edu] ?? edu;
    return EDUCATION_TR[edu] ?? edu;
};

export const translateSocialClass = (cls: string): string => {
    if (!cls) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_SOCIAL_CLASS_EN[cls] ?? cls;
    return SOCIAL_CLASS_TR[cls] ?? cls;
};

export const translateTrait = (trait: string): string => {
    if (!trait) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_TRAITS_EN[trait] ?? trait;
    return TRAITS_TR[trait] ?? trait;
};

export const translateOccupation = (job: string): string => {
    if (!job) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_OCCUPATIONS_EN[job] ?? job;
    return OCCUPATIONS_TR[job] ?? job;
};

export const translateRarity = (rarity: string): string => {
    if (!rarity) return '';
    const locale = useLocaleStore.getState().locale;
    const upper = rarity.toUpperCase();
    if (locale === 'en') return REVERSE_RARITIES_EN[upper] ?? upper;
    return RARITIES_TR[upper] ?? upper;
};

export const translateCategory = (cat: string): string => {
    if (!cat) return '';
    const locale = useLocaleStore.getState().locale;
    const upper = cat.toUpperCase();
    if (locale === 'en') return REVERSE_CATEGORIES_EN[upper] ?? cat;
    return CATEGORIES_TR[upper] ?? cat;
};
