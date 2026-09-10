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
    // ------------------------------------------------------------------
    //  THE KEYS THE PARTNER CARD ACTUALLY PASSES
    // ------------------------------------------------------------------
    //  Every key above is a display string with a space in it, and the thing
    //  the card hands this function is `partner.stats.socialClass`, which is
    //  a SocialClass: OldMoney, HighSociety, CriminalElite. None of them
    //  matched, so the row under a partner's name read "OldMoney" in both
    //  languages - the fallback returning the key it was given.
    //
    //  Same eight as relationshipTypes.SocialClass, so the lookup can no
    //  longer miss.
    // ------------------------------------------------------------------
    'Underclass': 'Alt Sınıf',
    'WorkingClass': 'İşçi Sınıfı',
    'MiddleClass': 'Orta Sınıf',
    'HighSociety': 'Yüksek Sosyete',
    'OldMoney': 'Köklü Zenginlik',
    'BillionaireHeir': 'Milyarder Varisi',
    'Royalty': 'Kraliyet',
    'CriminalElite': 'Suç Eliti',
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
    // Partner style traits
    'Elegant': 'Zarif',
    'Luxury': 'Lüks',
    'Business': 'Kurumsal',
    'Bohemian': 'Bohem',
    'Goth': 'Gotik',
    'Casual': 'Günlük',
    'Sporty': 'Sportif',
    // ------------------------------------------------------------------
    //  THE TEN PERSONALITIES, WHICH WERE THE HOLE IN THIS TABLE
    // ------------------------------------------------------------------
    //  `TRAITS_TR` had the fifteen character traits, the seven partner STYLE
    //  words and the six child traits, and none of the ten things in
    //  love/data/personalitiesData.ts - which is the label the encounter card
    //  actually prints on the pill beside somebody's face.
    //
    //  So the pill read POWER BROKER and OLD-MONEY ELEGANCE in a Turkish
    //  game. It fell through `translateTrait`'s own fallback, which returns
    //  the key it was given, and that is precisely why a missing entry here
    //  is invisible rather than loud.
    //
    //  Found while wiring the encounter card into this registry. That card
    //  was the one partner surface that had never used it at all: it read
    //  `personality.label` and `stats.occupation` straight off the data.
    // ------------------------------------------------------------------
    'Power Broker': 'Güç Simsarı',
    'Old-Money Elegance': 'Köklü Zarafet',
    'Corporate Shark': 'Kurumsal Köpekbalığı',
    'High Maintenance': 'Masrafı Yüksek',
    'Tech Visionary': 'Teknoloji Vizyoneri',
    'Global Philanthropist': 'Küresel Hayırsever',
    'Luxury Connoisseur': 'Lüks Düşkünü',
    'Ambitious Climber': 'Hırslı Tırmanıcı',
    'Loyal Confidante': 'Sadık Sırdaş',
    'Strategic Pragmatist': 'Stratejik Pragmatist',

    // Child traits
    'Strategic Mind': 'Stratejik Zeka',
    'Creative Genius': 'Yaratıcı Deha',
    'Quick Learner': 'Hızlı Öğrenen',
    'Curious Explorer': 'Meraklı Kaşif',
    'Newborn Successor': 'Yeni Doğan Varis',
    'Unplanned': 'Planlanmamış',
};

export const OCCUPATIONS_TR: Record<string, string> = {
    // Legacy / general
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

    // 0. GLOBAL ELITE
    'Reigning Sovereign': 'Hükümran Hükümdar',
    'Reigning King': 'Hükümran Kral',
    'Reigning Queen': 'Hükümran Kraliçe',
    'Sovereign Wealth Fund Chair': 'Varlık Fonu Başkanı',
    'Central Bank Governor': 'Merkez Bankası Başkanı',
    'Head of an Oil Dynasty': 'Petrol Hanedanı Lideri',
    'Orbital Launch Company Founder': 'Yörünge Fırlatma Şirketi Kurucusu',
    'Owner of a Global Media Empire': 'Küresel Medya İmparatorluğu Sahibi',
    'Shipping Dynasty Chair': 'Deniz Ticareti Hanedanı Başkanı',
    'Nobel Laureate in Physics': 'Nobel Fizik Ödüllü Fizikçi',
    'Grand Prix Constructor Owner': 'Formula 1 Takım Sahibi',
    'Sovereign of a Private State': 'Özel Ada Devleti Hükümdarı',

    // 1. CORPORATE ELITE
    'Silicon Valley Tech CEO': 'Silikon Vadisi Teknoloji CEO’su',
    'Hedge Fund Managing Director': 'Hedge Fon Yönetici Direktörü',
    'Venture Capital General Partner': 'Risk Sermayesi Genel Ortağı',
    'Private Equity Principal': 'Özel Sermaye Direktörü',
    'Elite M&A Partner (Wall Street)': 'Wall Street Birleşme & Satın Alma Ortağı',
    'Semiconductor Foundry VP': 'Yarı İletken Fabrikası Başkan Yardımcısı',
    'AI Research Institute Director': 'Yapay Zeka Araştırma Enstitüsü Direktörü',
    'Aerospace & Defense Executive': 'Havacılık ve Savunma Sanayii Yöneticisi',
    'Chief Investment Officer (Family Office)': 'Yatırım Direktörü (Family Office)',
    'Biotech Syndicate Founder': 'Biyoteknoloji Konsorsiyumu Kurucusu',
    'Central Bank Monetary Advisor': 'Merkez Bankası Para Politikası Danışmanı',
    'Global Energy & Oil Trader': 'Küresel Enerji & Petrol Tüccarı',
    'Elite Neurosurgeon': 'Beyin Cerrahı',

    // 2. HIGH SOCIETY
    'Old-Money Dynasty Heiress': 'Köklü Hanedan Varisi',
    'Old-Money Dynasty Heir': 'Köklü Hanedan Varisi',
    'Billionaire Industrial Heir': 'Sanayici Milyarder Varisi',
    'Billionaire Industrial Heiress': 'Sanayici Milyarder Varisi',
    'Royal Philanthropy Ambassador': 'Kraliyet Yardım Elçisi',
    'Haute Couture Creative Director': 'Haute Couture Kreatif Direktörü',
    "Sotheby's Fine Art Auctioneer": "Sotheby's Sanat Müzayedecisi",
    'Superyacht Charter Fleet Owner': 'Süperyat Filosu Sahibi',
    'Formula 1 Team Principal': 'Formula 1 Takım Patronu',
    'UN Ambassador & Envoy': 'BM Elçisi & Temsilcisi',
    'Diamond Syndicate Director': 'Elmas Konsorsiyumu Direktörü',
    '3-Star Michelin Empire Owner': '3 Yıldızlı Michelin İmparatorluğu Sahibi',
    'Vogue Global Supermodel': 'Vogue Küresel Süpermodel',

    // 3. ARTISTIC
    'A-List Movie Star': 'A-List Film Yıldızı',
    'Grammy-Winning Producer': 'Grammy Ödüllü Yapımcı',
    'Blue-Chip Contemporary Artist': 'Çağdaş Sanatçı',
    'Pritzker-Winning Architect': 'Pritzker Ödüllü Mimar',

    // 4. UNDERGROUND
    'Private Intelligence Contractor': 'Özel İstihbarat Danışmanı',
    'Elite Cyber Security Architect': 'Siber Güvenlik Mimarı',
    'High-Stakes VIP Syndicate Whale': 'Yüksek Bahisli VIP Oyuncu',
    'Offshore Crypto Arbitrageur': 'Offshore Kripto Arbitrajcısı',

    // 5. BLUE COLLAR & DEDICATED PROFESSIONALS
    'Private Jet Captain': 'Özel Jet Kaptanı',
    'Elite Celebrity Trainer': 'Ünlülerin Özel Eğitmeni',
    'Master Sommelier': 'Master Sommelier',

    // 6. STUDENT & PROMISING PRODIGIES
    'Stanford MBA Candidate': 'Stanford MBA Öğrencisi',
    'MIT Quantum Physics Fellow': 'MIT Kuantum Fiziği Araştırmacısı',
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
    'SPACE': 'Uzay',
};

export const PROPOSAL_LOCATIONS_TR: Record<string, string> = {
    'Public Park': 'Halka Açık Park',
    'Local Coffee Shop': 'Yerel Kafe',
    'Sunset Beach': 'Gün Batımı Plajı',
    'Luxury Restaurant': 'Lüks Restoran',
    'Hot Air Balloon': 'Sıcak Hava Balonu',
    'Fairytale Castle': 'Masalsı Şato',
    'Private Yacht': 'Özel Yat',
    'Eiffel Tower Top': 'Eyfel Kulesi Zirvesi',
    'Maldives Overwater Villa': 'Maldivler Su Üstü Villası',
    'Times Square Billboard': 'Times Meydanı Dev Reklam Panosu',
    'Rented Private Island': 'Kiralık Özel Ada',
    'Orbit (Space Station)': 'Yörünge (Uzay İstasyonu)',
};

export const GIFTS_TR: Record<string, string> = {
    'Flowers': 'Çiçek',
    'Chocolates': 'Çikolata',
    'Jewelry': 'Mücevher',
    'Sports Car': 'Spor Araba',
};

// Build reverse lookups for 100% strict isolation back to English
const REVERSE_EDUCATION_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(EDUCATION_TR)) {
    REVERSE_EDUCATION_EN[tr] = en;
}

const REVERSE_SOCIAL_CLASS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(SOCIAL_CLASS_TR)) {
    // FIRST KEY WINS. Two English forms now share a Turkish word - 'High
    // Society' and 'HighSociety' are both Yüksek Sosyete - and the plain
    // overwrite made the camelCase one the answer, so an English player
    // reading a Turkish save got "HighSociety" back. The spaced form is the
    // display string and comes first in the table above.
    if (REVERSE_SOCIAL_CLASS_EN[tr] === undefined) REVERSE_SOCIAL_CLASS_EN[tr] = en;
}
// The English side of the same eight. The loop above only builds Turkish to
// English, so an English player handed a SocialClass fell through to the key
// itself and read "CriminalElite" with no space in it.
Object.assign(REVERSE_SOCIAL_CLASS_EN, {
    Underclass: 'Underclass',
    WorkingClass: 'Working Class',
    MiddleClass: 'Middle Class',
    HighSociety: 'High Society',
    OldMoney: 'Old Money',
    BillionaireHeir: 'Billionaire Heir',
    Royalty: 'Royalty',
    CriminalElite: 'Criminal Elite',
});

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
    REVERSE_CATEGORIES_EN[tr.toUpperCase()] = en;
}

const REVERSE_PROPOSAL_LOCATIONS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(PROPOSAL_LOCATIONS_TR)) {
    REVERSE_PROPOSAL_LOCATIONS_EN[tr] = en;
}

const REVERSE_GIFTS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(GIFTS_TR)) {
    REVERSE_GIFTS_EN[tr] = en;
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


// ============================================================================
//  THE ONE LINE UNDER THE PLAYER'S NAME
// ============================================================================
//
//  Reported as "the titles are translated on the profile and not on the home
//  screen". They were not translated anywhere, in fact: what the profile shows
//  is a partner's OCCUPATION, which goes through `translateOccupation` above,
//  and what the home screen shows is the player's own standing, which comes
//  out of core/story/title.ts as a hardcoded English string.
//
//  So a Turkish player reading a Turkish game was told they were a "Tycoon".
//
//  Keyed on the English rather than on an id, deliberately. `titleFor` returns
//  a STRING and always has; every rung, every dynasty name and every special
//  title is written as prose in that file, which is the right place for a
//  writer to work. Giving seventeen of them ids to satisfy a lookup would move
//  the writing into a data structure to serve the translation, which is the
//  wrong way round. An unknown title falls through unchanged, so adding a
//  rung is never a crash - it is one line of English until somebody translates
//  it, which is the same contract the rest of this file has.
// ============================================================================

const CEO_TITLE_TR: Record<string, string> = {
    'Factory Owner': 'Fabrika Sahibi',
    Manufacturer: 'Üretici',
    Industrialist: 'Sanayici',
    Magnate: 'Kodaman',
    Tycoon: 'Patron',
    'Titan of Industry': 'Sanayi Devi',
    Colossus: 'Dev',
    'Chief Executive': 'Genel Müdür',
    'Old Money': 'Köklü Servet',
    Dynast: 'Hanedan Sahibi',
    'Head of the House': 'Hanenin Reisi',
    'Keeper of the Name': 'Adın Bekçisi',
    'Founder of a Dynasty': 'Bir Hanedanın Kurucusu',
    'The Inheritor': 'Varis',
    'The Second Founder': 'İkinci Kurucu',
    'The One Who Kept It': 'Elinde Tutan',
};

/** The player's own standing, in the language they are playing in. */
export const translateCeoTitle = (title: string): string => {
    if (!title) return '';
    if (useLocaleStore.getState().locale === 'en') return title;
    return CEO_TITLE_TR[title] ?? title;
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
    if (locale === 'en') return REVERSE_CATEGORIES_EN[cat] ?? REVERSE_CATEGORIES_EN[upper] ?? cat;
    return CATEGORIES_TR[upper] ?? CATEGORIES_TR[cat] ?? cat;
};

export const translateProposalLocation = (venue: string): string => {
    if (!venue) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_PROPOSAL_LOCATIONS_EN[venue] ?? venue;
    return PROPOSAL_LOCATIONS_TR[venue] ?? venue;
};

export const translateGift = (gift: string): string => {
    if (!gift) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_GIFTS_EN[gift] ?? gift;
    return GIFTS_TR[gift] ?? gift;
};

