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

    // ------------------------------------------------------------------
    //  7. THE FORTY MAGNATES, WHOSE LINE WAS ALREADY ON SCREEN IN ENGLISH
    // ------------------------------------------------------------------
    //  `Magnate.of` is printed under the name on every poker seat and has
    //  been since the table was built. Forty English phrases, in front of a
    //  Turkish player, for months.
    //
    //  scripts/untranslated.js could never have found them for the same
    //  reason it could not find the job titles: it reads .tsx and looks at
    //  Text children and naming props, and this arrives through a variable
    //  from a .ts data file. Found by needing them for the partner card.
    //
    //  Here rather than in a new table because that is exactly what this
    //  function is for: what somebody is known for. See the note at the top
    //  of features/love/logic/partnerText.ts about the second table that was
    //  written and backed out.
    // ------------------------------------------------------------------
    'Shipping, fourth generation': 'Denizcilik, dördüncü kuşak',
    'Private bank, Geneva': 'Özel banka, Cenevre',
    'Ports and rail': 'Limanlar ve demiryolu',
    'Copper and lithium': 'Bakır ve lityum',
    'Timber and paper': 'Kereste ve kağıt',
    'Refining': 'Rafineri',
    'Department stores': 'Büyük mağazalar',
    'Vineyards and hotels': 'Bağlar ve oteller',
    'Cement, half a continent': 'Çimento, yarım kıta',
    'Couture, sold it twice': 'Moda evi, iki kere sattı',
    'Insurance, inherited': 'Sigorta, miras',
    'Shipbuilding': 'Gemi inşa',
    'Cattle and grain': 'Sığır ve tahıl',
    'Diamonds, wholesale': 'Elmas, toptan',
    'Telecoms, private': 'Telekom, halka kapalı',
    'Racehorses and land': 'Yarış atları ve arazi',
    'Pistachios and pipelines': 'Antep fıstığı ve boru hatları',
    'Hedge fund, closed to new money': 'Hedge fon, yeni paraya kapalı',
    'Iron ore': 'Demir cevheri',
    'Airports': 'Havalimanları',
    'Fertiliser': 'Gübre',
    'Gold concessions': 'Altın imtiyazları',
    'Publishing, what is left of it': 'Yayıncılık, kalanı kadarıyla',
    'Olive oil, absurdly': 'Zeytinyağı, akıl almaz biçimde',
    'Machine tools': 'Takım tezgahları',
    'Auction house': 'Müzayede evi',
    'Sugar and logistics': 'Şeker ve lojistik',
    'Never worked a day': 'Hayatında bir gün çalışmadı',
    'Desalination': 'Deniz suyu arıtma',
    'Salmon': 'Somon',
    'Toll roads': 'Paralı yollar',
    'Rubber': 'Kauçuk',
    'Cold storage': 'Soğuk hava deposu',
    'Distilling': 'Damıtma',
    'Cocoa': 'Kakao',
    'Tankers': 'Tankerler',
    'Trusts, three of them': 'Vakıflar, üç tane',
    'Construction': 'İnşaat',
    'Perfume houses': 'Parfüm evleri',
    'Silver, since 1890': 'Gümüş, 1890 dan beri',
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

// ============================================================================
//  SHOP DESCRIPTIONS (All 29 Boutiques)
// ============================================================================

export const SHOP_DESCRIPTIONS_TR: Record<string, string> = {
    'Your palace in the clouds.': 'Bulutlardaki sarayınız.',
    'Supersonic superiority.': 'Süpersonik üstünlük.',
    'Vertical luxury.': 'Dikey lüks.',
    'Museum grade stones.': 'Müze kalitesinde taşlar.',
    'Heavy metal.': 'Ağır metaller.',
    'Fit for a queen.': 'Kraliçelere layık.',
    'Begin your legacy.': 'Mirasınızı başlatın.',
    'Frozen in time.': 'Zamanda donmuş zarafet.',
    'Megayachts for the 0.001%.': '%0.001 için megayatlar.',
    'Conquer the abyss.': 'Derinlikleri fethedin.',
    'Own the fleet.': 'Filoya hükmedin.',
    'Buy the horizon.': 'Ufku satın alın.',
    'Own the skyline.': 'Silüete sahip olun.',
    'Residences of distinction.': 'Seçkin rezidanslar.',
    'Fortified luxury.': 'Korumalı lüks.',
    'History is yours.': 'Tarih sizin.',
    'Commercial dominance.': 'Ticari hakimiyet.',
    'Low orbit, held privately.': 'Alçak yörünge, özel mülk.',
    'Everything past the moon.': 'Ayın ötesindeki her şey.',
    'Beyond speed.': 'Hızın ötesinde.',
    'Imperial transport.': 'İmparatorluk taşımacılığı.',
    "The collector's garage.": 'Koleksiyoncu garajı.',
    'Indestructible.': 'Yıkılmaz.',
    'Electric dreams.': 'Elektrikli rüyalar.',
    'Priceless history.': 'Paha biçilmez tarih.',
    'Heritage and investment.': 'Miras ve yatırım.',
    'Engineering insanity.': 'Mühendislik harikası.',
    'History for sale.': 'Satılık tarih.',
    'Bespoke brilliance.': 'Kişiye özel ihtişam.',
};

const REVERSE_SHOP_DESCRIPTIONS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(SHOP_DESCRIPTIONS_TR)) {
    REVERSE_SHOP_DESCRIPTIONS_EN[tr] = en;
}

export const translateShopDescription = (desc: string): string => {
    if (!desc) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_SHOP_DESCRIPTIONS_EN[desc] ?? desc;
    return SHOP_DESCRIPTIONS_TR[desc] ?? desc;
};

// ============================================================================
//  ITEM NAMES (Luxury Assets & Dynasty Wave Relics)
// ============================================================================

export const ITEM_NAMES_TR: Record<string, string> = {
    // Aircraft
    'The Flying Palace (S900 Custom)': 'Uçan Saray (S900 Özel Yapım)',
    'Meridian Business Jet 800-8': 'Meridian İş Jeti 800-8',
    'Northwind Global 8000': 'Northwind Global 8000',
    'Silverstream S700': 'Silverstream S700',
    'The Standing Fleet': 'Daimi Filo',
    'FX-9 Talon (Demilitarized)': 'FX-9 Talon (Sivil Versiyon)',
    'Nightjar Chopper': 'Nightjar Helikopteri',
    'Volkov V-29 Fulcrum': 'Volkov V-29 Fulcrum',
    'Halcyon H-92 VIP': 'Halcyon H-92 VIP',
    'Continental CH-160': 'Continental CH-160',

    // Jewelry & Gems
    'The Rose Sovereign': 'Gül Hükümdarı',
    'The Azure Regent': 'Gök Mavisi Naip',
    'The Sorrow Stone Replica': 'Keder Taşı Replikası',
    'The Orange': 'Turuncu Elmas',
    'Classic Solitaire': 'Klasik Tektaş',
    'The Royal Halo': 'Kraliyet Halesi',
    'Princess Cut Promise': 'Prenses Kesim Söz Yüzüğü',
    'Celebrity Emerald Cut': 'Ünlü Zümrüt Kesim',
    'Vintage Estate Ring': 'Tarihi Miras Yüzük',
    'The Ascot Tiara Replica': 'Ascot Tacı Replikası',
    'Emerald Kokoshnik': 'Zümrüt Kokoşnik Taç',
    'Solid Gold Shirt': 'Som Altın Zırh Gömlek',
    'Panther Necklace': 'Panter Gerdanlık',
    'The Winter Star': 'Kış Yıldızı',
    'Hoarfrost Tiara': 'Kırağı Tacı',
    'The Glacier Suite': 'Buzul Takımı',
    'Cold Room Collar': 'Soğuk Oda Kolyesi',
    'The Sun Throne Regalia': 'Güneş Tahtı Nişanı',
    'The Gold Bathhouse': 'Altın Hamam',

    // Marine
    'The Gigayacht': 'Gigayat',
    'The Sovereign': 'Egemen Süperyat',
    'Project X': 'Proje X Megayat',
    'The Sailing Monolith': 'Yelkenli Monolit',
    'The Floating Principality': 'Yüzen Prenslik',
    'Global Cruise Ship': 'Küresel Yolcu Gemisi',
    'Luxury Liner Class': 'Lüks Transatlantik',
    'The World Residence': 'Dünya Rezidansı Gemisi',
    'Military Grade Sub': 'Askeri Standart Denizaltı',
    'Abyss 36000/2': 'Abyss 36000/2 Denizaltı',
    'Leviathan M5': 'Leviathan M5 Denizaltı',

    // Real Estate
    'The World Island (Dubai)': 'Dünya Adası (Dubai)',
    'Pacific Atoll Kingdom': 'Pasifik Mercan Krallığı',
    'Caribbean Expanse': 'Karayip Cenneti',
    'Greek Cyclades Empire': 'Yunan Kiklad İmparatorluğu',
    'Zenith Tower Crown Floor': 'Zenith Kulesi Kral Katı',
    'Tokyo Spire': 'Tokyo Gökdeleni',
    'NYC Billionaire Tower': 'New York Milyarderler Kulesi',
    'Singapore Garden Tower': 'Singapur Botanik Kulesi',
    'London Historic Palace': 'Londra Tarihi Sarayı',
    'Beverly Hills Mega-Mansion': 'Beverly Hills Malikânesi',
    'Monaco Penthouse': 'Monako Çatı Katı',
    'Alpine Doomsday Fortress': 'Alp Sığınağı Kalesi',
    'Dakota Missile Silo': 'Dakota Füze Silosu Malikânesi',
    'Château Beaumont Annex': 'Beaumont Şatosu',
    'Tuscan Dynasty Villa': 'Toskana Hanedan Villası',
    'Silicon Valley Campus HQ': 'Silikon Vadisi Genel Merkezi',
    'Shanghai Financial Hub': 'Şanghay Finans Merkezi',
    'The Vertical City': 'Dikey Şehir Kompleksi',
    'Gulf Free Zone Freehold': 'Körfez Serbest Bölge Mülkü',
    'Transcontinental Terminal': 'Kıtalararası Terminal',
    'Rhineland Prince Bishopric': 'Rheinland Prens Piskoposluğu',
    'Kyoto Temple Compound': 'Kyoto Tapınak Kompleksi',
    'Pacific Trench Habitat': 'Pasifik Çukuru Yaşam Alanı',

    // Space
    'Suborbital Tourist Fleet': 'Yörünge Altı Turist Filosu',
    'Private Launch Complex': 'Özel Fırlatma Üssü',
    'Geostationary Constellation': 'Sabit Yörünge Uydu Takımı',
    'Orbital Residence Ring': 'Yörünge Rezidans Halkası',
    'Deep Field Observatory': 'Derin Uzay Gözlemevi',
    'Lunar South Pole Claim': 'Ay Güney Kutbu Maden İmtiyazı',
    'Asteroid Mining Charter': 'Asteroit Madencilik Beratı',
    'The Ark Programme': 'Nuh Gemisi Uzay Programı',

    // Vehicles
    'Vaurien Tourbillon V16': 'Vaurien Tourbillon V16',
    'Nordkraft Jarl Absolut': 'Nordkraft Jarl Absolut',
    'Fenice Purista': 'Fenice Purista',
    'Sable Monoposto GT': 'Sable Monoposto GT',
    'Taurino Revanche Opera Unica': 'Taurino Revanche Opera Unica',
    'Ashgrove Atelier Coupe': 'Ashgrove Atelier Coupe',
    'Argent & Hume Sovereign II': 'Argent & Hume Sovereign II',
    'Argent & Hume Bespoke Roadster': 'Argent & Hume Özel Roadster',
    'Sternhaus Grand Haute Voiture': 'Sternhaus Grand Haute Voiture',
    '1962 Corsalta 260 Berlinetta': '1962 Corsalta 260 Berlinetta',
    'Sable Roadcar': 'Sable Yol Otomobili',
    'Kaisei Meteor R36 Works': 'Kaisei Meteor R36 Works',
    'Yamashiro LFX Circuit Package': 'Yamashiro LFX Pist Paketi',
    'Aoi Tempest 24B Works Prototype': 'Aoi Tempest 24B Prototip',
    'Ironclad Titan 6x6 Military': 'Ironclad Titan 6x6 Askeri',
    'Sternhaus GX 6x6': 'Sternhaus GX 6x6',
    'Bastion Paladin XV': 'Bastion Paladin XV',
    'Voltaic Tempest Time Attack': 'Voltaic Tempest Time Attack',
    'Farinelli Barzetta': 'Farinelli Barzetta',
    'Fukuro Owl': 'Fukuro Owl',
    'Sternhaus 320 SLW Werkscoupe': 'Sternhaus 320 SLW Werkscoupe',
    'Vaurien Type 59SC Atlantique': 'Vaurien Type 59SC Atlantique',
    'Corsalta 340 S Spider Carrozzata': 'Corsalta 340 S Spider Carrozzata',

    // Watches
    'Beaulieu & Fils Grand Sonnerie': 'Beaulieu & Fils Grand Sonnerie',
    'Beaulieu & Fils Argonaut 5719 Robin Blue': 'Beaulieu & Fils Argonaut 5719 Robin Blue',
    'Roche Royale Concept': 'Roche Royale Concept',
    'Valmont Constant Les Artisans': 'Valmont Constant Les Artisans',
    'Jasper & Co. Billionaire': 'Jasper & Co. Billionaire',
    'Rion Meridien RM 58-02 Sapphire': 'Rion Meridien RM 58-02 Sapphire',
    'Vaurien W16 Tourbillon Blue Sapphire': 'Vaurien W16 Tourbillon Blue Sapphire',
    'Rion Meridien RM 90 Grin': 'Rion Meridien RM 90 Grin',
    'The Screen Idol Speedway': 'Sinema İdolü Speedway',
    'Beaulieu & Fils Ref. 1520 Steel': 'Beaulieu & Fils Ref. 1520 Çelik',
    'Regulus "The Last Emperor" 6062': 'Regulus "Son İmparator" 6062',
    'Gravelle Diamonds Mirage': 'Gravelle Diamonds Mirage',
    'Charbonnel 201-Carat': 'Charbonnel 201-Karat',
    'The Cabinotier Commission': 'The Cabinotier Özel Üretim',

    // Generation Waves (Dynasty Era Relics)
    'The Emptied Duchy': 'Terk Edilmiş Dükalık',
    'The Sovereign Vault Floor': 'Egemen Kasa Katı',
    'The Harbour Freehold': 'Serbest Liman Mülkü',
    'The Mile Spire': 'Bir Millik Kule',
    'The Icebound Explorer': 'Buzkıran Keşif Gemisi',
    'The Abyssal Survey Fleet': 'Derin Deniz Araştırma Filosu',
    'The Continental Wing': 'Kıtalararası Uçak Filosu',
    'The Interceptor Flight': 'Önleme Filosu',
    'The Rooftop Network': 'Çatı İniş Pisti Ağı',
    'The Closed Archipelago': 'Özel Takımada',
    'The Winter Principality': 'Kış Prensliği Vadisi',
    'The Recovered Regalia': 'Kurtarılan Kraliyet Mücevherleri',
    'The Dispersed Collection': 'Dağıtılmış Koleksiyon',
    'The Chartered City': 'Özerk Berat Şehri',
    'The Orbital Freight Line': 'Yörünge Kargo Hattı',
    'The Continental Grid': 'Kıtasal Enerji Şebekesi',
    'The Belt Claim': 'Asteroit Kuşağı Maden İmtiyazı',
    'The Floating City': 'Yüzen Şehir',
    'The Strait Concession': 'Boğaz Geçiş İmtiyazı',
    'The Buried Capital': 'Yeraltı Başkenti',
    'The Vacated Kingdom': 'Metruk Krallık Sarayları',
    'The Continental Reserve': 'Kıtasal Kasa Rezervi',
    'The Sovereign Flotilla': 'Egemen Filotilla',
    'The Trench Colony': 'Okyanus Çukuru Kolonisi',
    'The Standing Air Bridge': 'Daimi Hava Köprüsü Filosu',
    'The Ring Habitat': 'Halka Uzay Yaşam Alanı',
    'The Made Island': 'Yapay Ada',
    'The Polar Freehold': 'Kutup Araştırma Mülkü',
    'The Standing Squadron': 'Daimi Helikopter Filosu',
    'The Single Stone': 'Ham Dev Elmas',
    'The Whole Treasury': 'Eksiksiz Hanedan Hazinesi',
    'The Outer System Charter': 'Dış Sistem Keşif Beratı',
    'The Orbital Ring': 'Yörünge Halkası',
    'The Roofed Sea': 'Kubbe Deniz Şehri',
    'The Water Concession': 'Kıtasal Su İmtiyazı',
    'The Migrant Fleet': 'Göçmen Deniz Filosu',
};

const REVERSE_ITEM_NAMES_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(ITEM_NAMES_TR)) {
    REVERSE_ITEM_NAMES_EN[tr] = en;
}

export const translateItemName = (name: string): string => {
    if (!name) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_ITEM_NAMES_EN[name] ?? name;
    return ITEM_NAMES_TR[name] ?? name;
};

// ============================================================================
//  ITEM SPECS & FEATURES
// ============================================================================

export const ITEM_SPECS_TR: Record<string, string> = {
    'Double Decker': 'Çift Katlı',
    'Gold Plated': 'Altın Kaplama',
    'Flying Spa': 'Uçan Spa',
    'Concert Hall': 'Konser Salonu',
    'Queen of the Skies': 'Göklerin Kraliçesi',
    'Master Suite': 'Kral Dairesi',
    'Dining for 14': '14 Kişilik Yemek Alanı',
    'Upper Loft': 'Üst Loft',
    '8000nm Range': '8000 Deniz Mili Menzil',
    'Mach 0.94': 'Mach 0.94 Hız',
    'Zero Gravity Seats': 'Sıfır Yerçekimi Koltukları',
    'Flagship': 'Amiral Gemisi',
    '5 Living Areas': '5 Yaşam Alanı',
    'Circadian Lighting': 'Sirkadiyen Aydınlatma',
    'Whisper Quiet': 'Fısıltı Sessizliğinde',
    'Speed Record': 'Hız Rekoru',
    'Nine Airframes': 'Dokuz Uçak Gövdesi',
    'Crewed Always': 'Daimi Mürettebat',
    'Four Continents': 'Dört Kıta',
    'Never Grounded': 'Asla Yere İnmez',
    'Stealth': 'Hayalet (Görünmez)',
    'Supercruise': 'Süper Seyir Hızı',
    'Vector Thrust': 'Vektör İtki Sistemi',
    'Air Superiority': 'Hava Üstünlüğü',
    'Armored': 'Zırhlı',
    'Twin Engine': 'Çift Motorlu',
    'Special Ops': 'Özel Harekat',
    'Rugged': 'Ağır Hizmet Tipi',
    'Mach 2.25': 'Mach 2.25 Hız',
    'High G-Force': 'Yüksek G Kuvveti',
    'Cobra Maneuver': 'Kobra Manevrası',
    'Cold War Icon': 'Soğuk Savaş İkonu',
    'Head of State Spec': 'Devlet Başkanı Donanımı',
    'Stand-up Cabin': 'Geniş Ferah Kabin',
    'Shower': 'Duş Alanı',
    'Anti-Vibration': 'Titreşim Önleyici',
    'Blue Edge Blades': 'Sessiz Rotor Kanatları',
    'Silent Flight': 'Sessiz Uçuş',
    'Panoramic': 'Panoramik Manzara',
    'Style': 'Özel Tasarım',
    '59.60 Carats': '59.60 Karat',
    'Fancy Vivid Pink': 'Canlı Parlak Pembe',
    'Internally Flawless': 'Kusursuz Berraklık',
    'Record Breaker': 'Rekor Sahibi',
    '14.62 Carats': '14.62 Karat',
    'Fancy Vivid Blue': 'Canlı Parlak Mavi',
    'Emerald Cut': 'Zümrüt Kesim',
    'Legendary': 'Efsanevi',
    '45.52 Carats': '45.52 Karat',
    'Deep Blue': 'Derin Mavi',
    'Cursed?': 'Lanetli mi?',
    'Museum Quality': 'Müze Kalitesinde',
    '14.82 Carats': '14.82 Karat',
    'Fancy Vivid Orange': 'Canlı Parlak Turuncu',
    'Pear Shape': 'Damla Kesim',
    'Fire': 'Ateş Parıltısı',
    '1.5 Carat': '1.5 Karat',
    'Round Brilliant': 'Yuvarlak Pırlanta Kesim',
    'Platinum Band': 'Platin Halka',
    'Timeless': 'Zamansız',
    '2.0 Carat Center': '2.0 Karat Merkez Taş',
    'Pavé Halo': 'Pavé Hale Montür',
    'White Gold': 'Beyaz Altın',
    'Sparkling': 'Işıltılı',
    '3.0 Carat': '3.0 Karat',
    'Princess Cut': 'Prenses Kesim',
    'Channel Set': 'Kanal Dizim',
    'Modern': 'Modern',
    '8.0 Carat': '8.0 Karat',
    'Flawless': 'Kusursuz',
    'Statement': 'Göz Alıcı',
    'Art Deco': 'Art Deco',
    'Old Mine Cut': 'Eski Maden Kesim',
    'Sapphire Accents': 'Sarı Safir Vurgular',
    '1920s': '1920ler Dönemi',
    'Diamonds': 'Pırlantalar',
    'Silver': 'Gümüş',
    'Scrollwork': 'Kabartma İşleme',
    'Princess': 'Prenses',
    'Emeralds': 'Zümrütler',
    'Platinum': 'Platin',
    'Russian Style': 'Rus Stili',
    'Grand': 'Görkemli',
    '24k Woven Gold': '24 Ayar Örme Altın',
    '3kg Weight': '3 kg Ağırlık',
    'Velvet Lined': 'Kadife Astarlı',
    'Impact': 'Vurucu',
    'Onyx': 'Oniks',
    'Iconic': 'İkonik',
    '52.4 Carats': '52.4 Karat',
    'Unset': 'Montürsüz',
    'Nine Points': 'Dokuz Zirveli',
    'Detachable': 'Ayrılabilir',
    'Commissioned': 'Özel Sipariş',
    'Seven Pieces': 'Yedi Parça',
    'Matched Stones': 'Uyumlu Taşlar',
    'Vault Kept': 'Kasada Saklanmış',
    'One Owner': 'İlk Sahibinden',
    'Riviere': 'Riviere Sıra',
    'Graduated': 'Kademeli Boyut',
    'Signed': 'İmzalı Eser',
    'Crown And Sceptre': 'Taç ve Asa',
    'Deposed Line': 'Tarihi Hanedan',
    'Provenanced': 'Belgeli Köken',
    'Export Barred': 'Yurtdışına Çıkarılamaz',
    'Solid 24k': 'Som 24 Ayar',
    'Two Tonnes': 'İki Ton',
    'Plumbed': 'Tesisatlı',
    'Installed': 'Monte Edilmiş',
    '200m+ Length': '200m+ Uzunluk',
    'Missile Defense': 'Füze Savunma Sistemi',
    'Mini-Sub Dock': 'Mini Denizaltı İskelesi',
    '3 Helipads': '3 Helikopter Pisti',
    '160m Length': '160m Uzunluk',
    'Giant Screen Cinema': 'Dev Ekran Sinema',
    'Beach Club': 'Plaj Kulübü',
    'Snow Room': 'Kar Odası',
    '100m Length': '100m Uzunluk',
    'Glass Bottom Pool': 'Cam Tabanlı Havuz',
    'Hybrid Propulsion': 'Hibrit İtki Sistemi',
    'Art Gallery': 'Sanat Galerisi',
    '143m Length': '143m Uzunluk',
    'Tallest Masts': 'En Yüksek Direkler',
    'Underwater Obs': 'Sualtı Gözlem Odası',
    'Bomb Proof': 'Bombaya Dayanıklı',
    '400m Length': '400m Uzunluk',
    'Nine Decks': 'Dokuz Güverte',
    'Flag Of Its Own': 'Kendi Bayrağı',
    'Never Docks': 'Asla Limana Yanaşmaz',
    '5000 Passengers': '5000 Yolcu Kapasitesi',
    '20 Decks': '20 Güverte',
    'Water Park': 'Su Parkı',
    'Floating Resort': 'Yüzen Tatil Köyü',
    'Transatlantic': 'Transatlantik',
    'Reinforced Hull': 'Güçlendirilmiş Gövde',
    'Ballroom': 'Balo Salonu',
    'Casino': 'Kumarhane',
    '165 Apartments': '165 Rezidans Daire',
    'Continual Voyage': 'Kesintisiz Seyir',
    'Private Community': 'Özel Topluluk',
    'Floating Tax Haven': 'Yüzen Vergi Cenneti',
    'Demilitarized': 'Silahsızlandırılmış',
    'Nuclear Powered': 'Nükleer Güçlü',
    'Unlimited Range': 'Sınırsız Menzil',
    'Sonar Stealth': 'Sonar Görünmezliği',
    'Full Ocean Depth': 'Tam Okyanus Derinliği',
    'Titanium Hull': 'Titanyum Gövde',
    'Challenger Deep': 'Challenger Çukuru Dereceli',
    'Research Grade': 'Araştırma Standartlarında',
    'Submersible Yacht': 'Dalgıç Yat',
    'Helipad': 'Helikopter Pisti',
    'Pool': 'Havuz',
    'Underwater Views': 'Sualtı Manzarası',
    'Man-Made': 'Yapay Ada',
    'Dubai Coast': 'Dubai Kıyısı',
    'Helipad Network': 'Helikopter Pisti Ağı',
    'Royal Status': 'Kraliyet Statüsü',
    'Unknown Sovereignty': 'Bağımsız Egemenlik',
    'Naval Dock': 'Askeri Rıhtım',
    'AirStrip': 'Uçak Pisti',
    'Self-Sustaining': 'Kendi Kendine Yeten',
    '300 Acres': '300 Dönüm',
    'Superyacht Marina': 'Süperyat Marinası',
    '7 Villas': '7 Özel Villa',
    'White Sand': 'Beyaz Kum',
    '3 Islands': '3 Ada',
    'Ancient Ruins': 'Antik Kalıntılar',
    'Olive Groves': 'Zeytinlikler',
    'Mediterranean': 'Akdeniz',
    'Shinjuku': 'Şincuku',
    'Seismic Proof': 'Depreme Dayanıklı',
    'Neo-Futurist': 'Neo-Fütürist',
    '100 Floors': '100 Kat',
    'Vertical Forest': 'Dikey Orman',
    'Infinity Pool': 'Sonsuzluk Havuzu',
    'Marina Bay': 'Marina Bay',
    'Eco-Luxury': 'Eko-Lüks',
    'Kensington': 'Kensington',
    'Royal Neighbors': 'Kraliyet Komşuları',
    'Gardens': 'Tarihi Bahçeler',
    '90210': 'Beverly Hills 90210',
    'Giant Screen Theater': 'Dev Ekran Tiyatro',
    'Bowling Alley': 'Özel Bovling Salonu',
    'Car Gallery': 'Otomobil Galerisi',
    'Monte Carlo': 'Monte Carlo',
    'Street Circuit View': 'Yarış Pisti Manzaralı',
    'Private Casino': 'Özel Kumar Salonu',
    'Rooftop Pool': 'Çatı Havuzu',
    'Swiss Alps': 'İsviçre Alpleri',
    'Nuclear Proof': 'Nükleer Korumalı',
    '50 Year Supplies': '50 Yıllık Erzak',
    'Luxury Suites': 'Lüks Süitler',
    '15 Floors Deep': '15 Kat Yeraltı',
    'Data Center': 'Veri Merkezi',
    'Hydroponics': 'Hidroponik Tarım',
    'Armory': 'Silah Deposu',
    'France': 'Fransa',
    'Historic': 'Tarihi',
    'Orangery': 'Limonluk',
    'Private Park': 'Özel Park',
    'Italy': 'İtalya',
    'Vineyard': 'Bağlar',
    'Renaissance Art': 'Rönesans Sanatı',
    'Chapel': 'Şapel',
    'R&D Labs': 'Ar-Ge Laboratuvarları',
    'Auditorium': 'Oditoryum',
    'Carbon Neutral': 'Karbon Nötr',
    'The Bund': 'The Bund',
    'Trading Floors': 'Borsa İşlem Salonları',
    'Bank Vault': 'Banka Kasası',
    'Two Kilometres': 'İki Kilometre',
    'Own Postcode': 'Özel Posta Kodu',
    'Forty Thousand Residents': 'Kırk Bin Sakin',
    'Freehold': 'Tam Mülkiyet',
    'Own Customs': 'Özel Gümrük Hakkı',
    'Own Courts': 'Kendi Mahkemeleri',
    'Deep Water Port': 'Derin Su Limanı',
    'Perpetual': 'Daimi Hak',
    'Rail and Sea': 'Demir ve Deniz Yolu',
    'Bonded': 'Gümrüklü Antrepo',
    'Priority Berths': 'Öncelikli Yanaşma',
    'Ninety Nine Years': 'Doksan Dokuz Yıllık',
    'Eleventh Century': 'On Birinci Yüzyıl',
    'Vineyards': 'Üzüm Bağları',
    'Titular Style': 'Unvan Hakkı',
    'Chapel Crypt': 'Şapel Mahzeni',
    'Nine Buildings': 'Dokuz Bina',
    'Moss Garden': 'Yosun Bahçesi',
    'Registered': 'Tescilli',
    'Closed To Visitors': 'Ziyaretçilere Kapalı',
    'Four Kilometres Down': 'Dört Kilometre Derinde',
    'Unlisted': 'Kayıt Dışı',
    'Own Power': 'Kendi Enerji Santrali',
    'Sonar Dark': 'Sonar Körlüğü',
    'Six Vehicles': 'Altı Araç',
    'Eleven Minutes': 'On Bir Dakika',
    'Reusable': 'Yeniden Kullanılabilir',
    'Licensed': 'Ruhsatlı',
    'Two Pads': 'İki Fırlatma Pisti',
    'Equatorial': 'Ekvatoral Konum',
    'Own Airspace': 'Özel Hava Sahası',
    'Fuel Plant': 'Yakıt Tesisi',
    '400 Satellites': '400 Uydu',
    'Global Coverage': 'Küresel Kapsama',
    'Own Spectrum': 'Özel Frekans Bandı',
    'Encrypted': 'Uçtan Uca Şifreli',
    'Spun Gravity': 'Dönme Yerçekimi',
    'Twelve Suites': 'On İki Süit',
    'Cupola Deck': 'Kubbe Gözlem Güvertesi',
    'Permanent Crew': 'Daimi Mürettebat',
    'Lunar Farside': 'Ayın Karanlık Yüzü',
    'Radio Quiet': 'Radyo Sessizliği',
    'Naming Rights': 'İsimlendirme Hakkı',
    'Sole Access': 'Tek Erişim Hakkı',
    'Water Ice': 'Su Buzu',
    'Permanent Light': 'Daimi Işık Zirvesi',
    'Disputed': 'Tartışmalı Egemenlik',
    'First Mover': 'İlk Hamle Üstünlüğü',
    'Metal Rich': 'Metal Zengini',
    'Nine Year Transit': 'Dokuz Yıllık Geçiş',
    'Sole Charter': 'Tek İmtiyaz Beratı',
    'Unvalued': 'Değer Biçilemez',
    'Thousand Berths': 'Bin Yataklı',
    'Closed Loop': 'Kapalı Döngü Ekosistem',
    'Century Build': 'Yüzyıllık İnşaat',
    'One Buyer': 'Tek Alıcı',
    '1800 HP': '1800 Beygir',
    'V16 Hybrid': 'V16 Hibrit Motor',
    'Analogue Gauges': 'Analog Göstergeler',
    'Masterpiece': 'Başyapıt',
    '330+ mph': '530+ km/s Hız',
    '1600 HP': '1600 Beygir',
    'Low Drag': 'Düşük Sürtünme',
    'Speed King': 'Hız Kralı',
    '864 HP': '864 Beygir',
    'V12 Twin Turbo': 'V12 Çift Turbo',
    'Manual Gearbox': 'Manuel Şanzıman',
    'Art on Wheels': 'Tekerlekli Sanat',
    'V10': 'V10 Motor',
    'Single Seat': 'Tek Koltuklu',
    'Track Only': 'Sadece Pist Kullanımı',
    'Video Game Realized': 'Gerçeğe Dönüşen Rüya',
    '1001 HP': '1001 Beygir',
    'V12 Hybrid': 'V12 Hibrit Motor',
    'Hand Painted': 'El Boyaması',
    'One-Off': 'Tek Üretim',
    '740 HP': '740 Beygir',
    'W12': 'W12 Motor',
    '3D Printed Gold': '3D Baskı Altın',
    'Coachbuilt': 'Özel Karoser',
    'V12': 'V12 Motor',
    'Privacy Suite': 'Özel Gizlilik Süiti',
    'Starlight': 'Yıldız Tavan',
    'Magic Carpet': 'Uçan Halı Konforu',
    'Rose Essence': 'Gül Özü',
    'Baguette Watch': 'Baget Saat',
    'Unique': 'Benzersiz',
    'Bouclé Fabric': 'Buklet Kumaş',
    'Rose Gold': 'Roze Altın',
    'Limited': 'Limitli Üretim',
    'Fashion Inspired': 'Moda İlhamlı',
    'Race History': 'Yarış Geçmişi',
    'Homologation': 'Homologasyon',
    'Holy Grail': 'Kutsal Kâse',
    'Gold Engine Bay': 'Altın Motor Bölmesi',
    'Central Seat': 'Merkezi Sürücü Koltuğu',
    'Naturally Aspirated': 'Atmosferik Motor',
    'Legend': 'Efsane',
    '500 HP': '500 Beygir',
    'Limited to 19': '19 Adetle Sınırlı',
    'Hand Built': 'El Yapımı',
    'Carbon': 'Karbon Fiber',
    'V10 Sound': 'V10 Motor Sesi',
    'Carbon Loom': 'Karbon Dokuma',
    'Track Focused': 'Pist Odaklı',
    'Orchestral Exhaust': 'Senfonik Egzoz',
    '000/400': '000/400 Seri No',
    'Widebody': 'Geniş Gövde',
    'Rally Blue': 'Ralli Mavisi',
    'Museum Grade': 'Müze Kalitesi',
    '1300 HP': '1300 Beygir',
    '6 Wheel Drive': '6 Tekerlekten Çekiş',
    'EMP Protection': 'EMP Koruması',
    'Smoke Screen': 'Sis Perdesi',
    'Portal Axles': 'Portal Akslar',
    '5 Garage': '5 Araçlık Garaj',
    'Desert Stormer': 'Çöl Fatihi',
    'Massive': 'Devasa',
    'Bio-Diesel': 'Biyo-Dizel',
    'Luxury Interior': 'Lüks İç Mekan',
    'Tank': 'Tank Standartlarında',
    '1914 HP': '1914 Beygir',
    'Green Livery': 'Yeşil Yarış Rengi',
    '1900 HP': '1900 Beygir',
    'Italian Design': 'İtalyan Tasarımı',
    'Zero Emissions': 'Sıfır Emisyon',
    'GT Comfort': 'GT Konforu',
    '1.69s 0-60': '0-100: 1.69 sn',
    'Japanese': 'Japon Mühendisliği',
    'Low Profile': 'Alçak Profil',
    'Insane': 'Akıl Almaz',
    '1 of 2': 'Dünyada Sadece 2 Adet',
    'World Record': 'Dünya Rekoru',
    'Silver Bullet': 'Gümüş Mermi',
    'Unobtainable': 'Ulaşılamaz',
    'Riveted Seam': 'Perçinli Gövde',
    'Fashion House Owned': 'Moda Evi Koleksiyonu',
    'Thousand Mile Race': 'Mille Miglia Yarışçısı',
    'The 24 Hours': '24 Saat Le Mans',
    'Racing Red': 'Yarış Kırmızısı',
    '20 Complications': '20 Komplikasyon',
    'Reversible': 'Çift Taraflı Kasa',
    'Hand Engraved': 'El İşlemesi',
    'Robin Blue': 'Robin Mavisi',
    'Double Signed': 'Çift İmzalı',
    'Limited 170': '170 Adetle Sınırlı',
    'Hype King': 'Zirve Parça',
    'Flying Tourbillon': 'Uçan Tourbillon',
    'Panther Dial': 'Panter Kadran',
    'Titanium': 'Titanyum',
    'Comic Collab': 'Özel Çizgi Koleksiyon',
    'Unique Piece': 'Tek Eser',
    'Grande Sonnerie': 'Grande Sonnerie',
    'Symphonia': 'Senfoni',
    'Art': 'Sanat Eseri',
    '260ct Emerald Cut': '260 Karat Zümrüt Kesim',
    'Skeleton Tourbillon': 'İskelet Tourbillon',
    '18k White Gold': '18 Ayar Beyaz Altın',
    'Champion Owned': 'Şampiyon Koleksiyonu',
    'Full Sapphire Case': 'Tam Safir Kasa',
    'Cable Suspended': 'Kablo Askılı Mekanizma',
    'Transparency': 'Şeffaflık',
    'Unbreakable': 'Kırılmaz',
    'Sapphire Case': 'Safir Kasa',
    'Working W16': 'Çalışan Minyatür W16',
    'Piston Movement': 'Pistonlu Hareket',
    'Hypercar': 'Hiper Otomobil Temalı',
    'Micro Sculpture': 'Mikro Heykel',
    'Tourbillon': 'Tourbillon',
    'Playful': 'Oyuncu Tasarım',
    'Producer Owned': 'Yapımcı Koleksiyonu',
    'Stainless Steel': 'Paslanmaz Çelik',
    'Perpetual Calendar': 'Sonsuz Takvim',
    'Chronograph': 'Kronograf',
    '1 of 4': 'Dünyada Sadece 4 Adet',
    'Emperor Owned': 'İmparator Koleksiyonu',
    'Black Dial': 'Siyah Kadran',
    'Diamond Markers': 'Pırlanta İndeksler',
    '110ct Colored Diamonds': '110 Karat Renkli Pırlantalar',
    'Quartz': 'Kuvars',
    'Rainbow': 'Gökkuşağı',
    '201 Carats': '201 Karat',
    'Heart Specific': 'Kalp Kesim',
    'Spring Loaded': 'Yaylı Gizli Kapak',
    'Blinding': 'Göz Kamaştırıcı',
    'Eleven Years': 'On Bir Yılda Tamamlandı',
    'Your Sky': 'Sizin Gökyüzünüz',
    'Single Piece': 'Tek Üretim',
    'Unrepeatable': 'Tekrarlanamaz',
};

const REVERSE_ITEM_SPECS_EN: Record<string, string> = {};
for (const [en, tr] of Object.entries(ITEM_SPECS_TR)) {
    REVERSE_ITEM_SPECS_EN[tr] = en;
}

export const translateItemSpec = (spec: string): string => {
    if (!spec) return '';
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return REVERSE_ITEM_SPECS_EN[spec] ?? spec;
    return ITEM_SPECS_TR[spec] ?? spec;
};

// ============================================================================
//  ENCOUNTER SCENARIOS & FLIRTS (All 48 Situations)
// ============================================================================

export const ENCOUNTER_SCENARIOS_TR: Record<string, { text: string; flirt: string }> = {
    vip_davos: {
        text: "Davos'taki Dünya Ekonomik Forumu'nun özel delege salonunda, karlı şöminenin başında espresso içerken zeki bir yönetici direktör piyasa tezinize meydan okuyor.",
        flirt: "Gülümseyip tartışmayı Klosters'ta baş başa bir akşam yemeğinde çözmeyi önerin.",
    },
    vip_ma_war_room: {
        text: "Yorucu 14 saatlik yönetim kurulu satın alma müzakerelerinin ardından, rakip konsorsiyumun baş M&A ortağı yönetici koridorunda manidar bir tebessümle bekliyor.",
        flirt: "Acımasız çapraz sorgusunun büyüleyici olduğunu itiraf edin ve gece bir şeyler içmeye davet edin.",
    },
    vip_silicon_summit: {
        text: "Woodside'daki özel davetli Silikon Vadisi kurucular yemeğinde, masanın karşısındaki bir risk sermayesi ortağı bardağınıza doğru gizlice siyah bir kart kaydırıyor.",
        flirt: "Kişisel portföyünüzün özel incelemeye açık olduğunu fısıldayın.",
    },
    vip_private_hangar: {
        text: "Teterboro özel havalimanında pist rötarlı iken, çarpıcı bir havacılık yöneticisi sizi fırtınayı Silverstream S700 kabininde beklemeye davet ediyor.",
        flirt: "Gülümseyerek kabul edin ve beklenmedik birinci sınıf kaçamaklar ile anlık çekime kadeh kaldırın.",
    },
    vip_monaco_yacht: {
        text: "Monaco Grand Prix sıralama turlarında 90 metrelik süperyattan limanı izlerken, köklü bir hanedan varisi kadehini Hale'in yükselen değerlemesine kaldırıyor.",
        flirt: "Korkuluklarda yanına geçip birlikte egemen imparatorluklar kurmaya kadeh kaldırın.",
    },
    vip_art_auction: {
        text: "Mayfair'deki sekiz haneli Sotheby's çağdaş sanat müzayedesinde, ikiniz de aynı müze kalitesindeki başyapıt için bayrak kaldırıyorsunuz.",
        flirt: "Özel bir kutlama yemeği karşılığında kazanan tekliften çekilin.",
    },
    vip_wallst_cigar: {
        text: "Wall Street'e bakan seçkin bir özel kulüpte, bir hedge fon ortağı nadir bir tek malt viski yudumlarken piyasa hamlelerinizi dikkatle izliyor.",
        flirt: "Deri bir koltuk çekip sermaye, nüfuz ve kimyanın ittifakını önerin.",
    },
    vip_geneva_vault: {
        text: "Cenevre Gölü kıyısındaki İsviçre özel varlık sempozyumundan çıkarken, aristokrat bir aile ofisi direktörü nesiller boyu süren hanedanlar üzerine sohbet başlatıyor.",
        flirt: "En kalıcı hanedanların her zaman inkâr edilemez bir kıvılcımla başladığını belirtin.",
    },
    vip_f1_paddock: {
        text: "Silverstone'daki kükreyen VIP padok kulübünde, göz alıcı bir Formula 1 yöneticisi bir sonraki çeyreğinizin kendi pol turundan hızlı olacağına bahse giriyor.",
        flirt: "Kendinden emin bir gülümsemeyle bahsi kabul edin ve yıllanmış şampanyayla mühürleyin.",
    },
    vip_stbarts: {
        text: "Yılbaşı gecesi St. Barts açıklarında demirliyken, bir teknoloji kurucusu ve girişim varisi sürat teknesini nadir bir Krug şampanyasıyla yatınıza yanaştırıyor.",
        flirt: "Yıldızların altında gece yarısı havai fişekleri için güverteye davet etmek üzere elinizi uzatın.",
    },
    vip_taipei_foundry: {
        text: "Taipei'deki çok özel bir yarı iletken sempozyumunda, önde gelen bir çip fabrikası yöneticisi akşam yemeğinde agresif silikon yol haritanızı övüyor.",
        flirt: "Şehrin özel manzarasına karşı gizli mimari sinerjileri tartışmaya davet edin.",
    },
    vip_paris_fashion: {
        text: "Paris Haute Couture Moda Haftası'nda ön sırada, lüks bir moda evinin kreatif direktörü etkileyici yönetici auranıza olan hayranlığını fısıldamak için eğiliyor.",
        flirt: "Saint-Germain'deki özel partiye eşlik etmeyi teklif edin.",
    },
    vip_aspen_chalet: {
        text: "Özel pistlerde geçen bir günün ardından Aspen dağ evinde şömine başında, bir biyoteknoloji öncüsü pazar hakimiyeti ve tutkudan bahsediyor.",
        flirt: "Bir kadeh daha grand cru doldurup odaklanmasını sınamak için yakınına sokulun.",
    },
    vip_gala_charity: {
        text: "Metropolitan Müzesi Galası'nda, keman sesleri yükselirken bir kraliyet yardım elçisi liderlik etkinizi takdir ediyor.",
        flirt: "Yüksek bahisli hayırseverlik ve karşı konulmaz bağlar için esprili bir kadeh kaldırın.",
    },
    gym_1: {
        text: "Yanınızdaki koşu bandında sınırlarını zorlayan birini fark ediyorsunuz. Baktığınızı yakalayıp terler içindeyken gülümsüyor.",
        flirt: "Antrenman programını sorun.",
    },
    gym_2: {
        text: "Ağırlıkların yanında, fit biri ağır bir halterle zorlanıyor. Bir yardımcıya ihtiyacı var.",
        flirt: "Yardım eli uzatın.",
    },
    gym_3: {
        text: "Yoga stüdyosunda, zarif bir yabancıyla yanlışlıkla matlarınız çarpışıyor.",
        flirt: "Özür dileyip duruşunu ve formunu övün.",
    },
    gym_4: {
        text: "Su şişenizi doldururken biri antrenmanınızın temposuna övgüde bulunuyor.",
        flirt: "Bir hidrasyon ipucu paylaşın ve kendinizi tanıtın.",
    },
    gym_5: {
        text: "Soyunma odasından çıkarken, yorgun ama seansından memnun görünen birini fark ediyorsunuz.",
        flirt: "Birlikte antrenman sonrası protein shake içmeyi önerin.",
    },
    club_1: {
        text: "Baslar gümbürdüyor. VIP bölümünde elinde şampanyayla tek başına oturan biri gözünüze çarpıyor.",
        flirt: "Kutlamasına katılmayı teklif edin.",
    },
    club_2: {
        text: "Dans pistinde kalabalık yarılıyor ve kendinizi büyüleyici bir dansçıyla yüz yüze buluyorsunuz.",
        flirt: "Daha yakına dans edip ritmine ayak uydurun.",
    },
    club_3: {
        text: "Barda beklerken, biri aşırı pahalı bir kokteyl sipariş ediyor ve oldukça sıkılmış görünüyor.",
        flirt: "İçki seçimi hakkında yorum yapın.",
    },
    club_4: {
        text: "Balkonda soluklanırken, yanınıza temiz hava almak için biri çıkıyor.",
        flirt: "Manzara ya da içerideki gürültü hakkında konuşun.",
    },
    club_5: {
        text: "Bir fotoğrafçı kalabalığı çekerken, bir yabancıyla mükemmel bir karede yan yana geliyorsunuz.",
        flirt: "Gecenin yeni gözde çifti olduğunuza dair espri yapın.",
    },
    jp_1: {
        text: "Ueno Parkı'nda açan kiraz çiçeklerinin altında, yerel biri düşen yaprakların fotoğraflarını çekiyor.",
        flirt: "Fotoğrafınızı çekmesini rica edin, ardından sanatsal bakışını övün.",
    },
    jp_2: {
        text: "Hareketli bir Akihabara elektronik mağazasında, ikiniz de aynı retro oyun konsoluna uzanıyorsunuz.",
        flirt: "Kimin alacağını belirlemek için bir oyun düellosuna davet edin.",
    },
    jp_3: {
        text: "Kyoto'daki sessiz bir çay evinde, biri yan masadaki arkadaşına seremoninin inceliklerini anlatıyor.",
        flirt: "Konuyu bilmediğinizi itiraf edip kısa bir ders rica edin.",
    },
    jp_4: {
        text: "Shibuya kavşağında kalabalığı geçerken, kargaşanın ortasında şık bir yabancıyla göz göze geliyorsunuz.",
        flirt: "Karşı kaldırıma geçtiğinde ona yetişin.",
    },
    jp_5: {
        text: "Bir onsen kasabasındaki ayak banyosunda gevşerken, rahatlamış bir gezgin sıcaklık hakkında sohbete başlıyor.",
        flirt: "Matcha dondurmasıyla serinlemeyi önerin.",
    },
    fr_1: {
        text: "Le Marais'deki bir butikte gezinirken, biri ipek fular hakkındaki fikrinizi soruyor.",
        flirt: "Etkileyici ve dürüst bir yorum yapın.",
    },
    fr_2: {
        text: "Gün batımında Sen Nehri kıyısında otururken, bir sanatçı nehrin taslağını çiziyor.",
        flirt: "Çizimde sizin de olup olmadığınızı sorun.",
    },
    fr_3: {
        text: "Bordeaux'daki bir bağda, bir uzman yıllanmış bir kırmızıyı büyük bir dikkatle tadıyor.",
        flirt: "Tadım için bir ipucu isteyin.",
    },
    fr_4: {
        text: "Louvre kuyruğunda beklerken, yorgun düşmüş bir sanatseverle ortak bir kahkaha paylaşıyorsunuz.",
        flirt: "Yakındaki bir kafeye kaçmayı teklif edin.",
    },
    fr_5: {
        text: "Provence'ta bir lavanta tarlasında yürürken, kokuya kapılıp gitmiş biriyle karşılaşıyorsunuz.",
        flirt: "Çiçeklerin arasında fotoğrafını çekmeyi teklif edin.",
    },
    us_1: {
        text: "Hollywood'da bir çatı partisinde, genç bir oyuncu köşede repliklerini çalışıyor.",
        flirt: "Replikleri birlikte çalışmayı önerin.",
    },
    us_2: {
        text: "Palo Alto'da bir kafede, hararetle kod yazan bir girişimci kahvesini döküyor.",
        flirt: "Peçete uzatıp girişimi hakkında soru sorun.",
    },
    us_3: {
        text: "Miami South Beach'te güneşlenen biri, yüzerken eşyalarına göz kulak olmanızı rica ediyor.",
        flirt: "Kabul edin, ama karşılığında bir içki ısmarlamasını isteyin.",
    },
    us_4: {
        text: "Golden Gate Köprüsü'nde bisiklet sürerken, bir yerliyle aynı seyir noktasında duruyorsunuz.",
        flirt: "Şehirdeki en iyi akşam yemeği mekanını sorun.",
    },
    us_5: {
        text: "New Orleans'taki bir caz kulübünde, biri sizi bando eşliğinde dansa davet ediyor.",
        flirt: "Büyük bir hevesle kabul edin.",
    },
    ae_1: {
        text: "Burj Al Arab lobisinde, lüks araba tutkunu biri altın kaplama bir süper arabayı hayranlıkla inceliyor.",
        flirt: "Motorun gücüyle altının cazibesini kıyaslayın.",
    },
    ae_2: {
        text: "Gün batımında çöl safarisinde, heyecan arayan biriyle aynı deveyi paylaşıyorsunuz.",
        flirt: "Çöl hükümdarı olduğunuza dair espri yapın.",
    },
    ae_3: {
        text: "Dubai Mall'da alışveriş yaparken, biri çok sayıda tasarım çantayla yürümekte zorlanıyor.",
        flirt: "En ağırını taşımayı teklif edin.",
    },
    ae_4: {
        text: "Üst düzey bir müzayedede, bir koleksiyoncu nadir bir parça için sizden daha yüksek teklif veriyor.",
        flirt: "Onu tebrik edin ve koleksiyonunu görmeyi rica edin.",
    },
    ae_5: {
        text: "Atlantis'te su altında akşam yemeği yerken, balıkları büyülenmiş şekilde izleyen biriyle göz göze geliyorsunuz.",
        flirt: "Denizde çok balık olduğuna dair esprili bir gönderme yapın.",
    },
    gen_1: {
        text: "Çatı katındaki bir yönetici salonunda, biri kol saatinizi fark edip nadir komplikasyonlar hakkında sohbet başlatıyor.",
        flirt: "Saatin hikayesini anlatıp bir sonraki kokteyli ısmarlamayı teklif edin.",
    },
    gen_2: {
        text: "Havalimanı salonunda özel bir finans bültenini incelerken, ikiniz de son piyasa dalgalanması hakkında yorum yapıyorsunuz.",
        flirt: "Kahve eşliğinde birlikte piyasa tahmini yapmayı önerin.",
    },
    gen_3: {
        text: "Özel bir teknoloji konferansı kokteylinde, yeni nesil bilişim hakkında keskin fikirler paylaşıyorsunuz.",
        flirt: "Tartışmaya daha sessiz bir ortamda devam etmeyi önerin.",
    },
    gen_4: {
        text: "Yönetici süitinin asansöründe birkaç dakika mahsur kaldığınızda, gökdelen kurumsal dramaları hakkında eğlenceli bir kahkaha paylaşıyorsunuz.",
        flirt: "Elektrik kesintilerinin her zaman en beklenmedik bağları kurduğuna dair espri yapın.",
    },
};

export type ScenarioLike = {
    id: string;
    text: string;
    flirt: string;
};

export const translateScenario = <T extends ScenarioLike | null | undefined>(scenario: T): T => {
    if (!scenario) return scenario;
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return scenario;
    const tr = ENCOUNTER_SCENARIOS_TR[scenario.id];
    if (!tr) return scenario;
    return {
        ...scenario,
        text: tr.text,
        flirt: tr.flirt,
    };
};


