// src/core/featureFlags.ts
//
// ============================================================================
//  FEATURE FLAGS — "CEO CORE" ODAK KESİTİ
// ============================================================================
//
//  Oyunun tür tanımlayıcı çekirdeği CEO simülasyonu. Bu dosya, çekirdek dışında
//  kalan hayat-simülasyonu modüllerini KOD SİLMEDEN devre dışı bırakır.
//
//  Geri açmak için: ilgili satırdaki `false` -> `true`. Başka hiçbir şey
//  yapmanız gerekmez; navigator, menü grid'leri ve aylık tick hook'ları
//  tamamı bu dosyadan okur.
//
//  KURAL: Yeni bir modül eklerken önce buraya bir flag ekle. Bir ekranı
//  navigator'a doğrudan (koşulsuz) bağlamak, dağılmanın başladığı yerdir.
//
// ============================================================================

export const FEATURES = {
    // ------------------------------------------------------------------
    //  CEO CORE — her zaman açık. Oyunun asıl konusu bunlar.
    // ------------------------------------------------------------------
    /** Şirket yönetimi: üretim, fabrika, işe alım, finans, satın alma */
    company: true,
    /** Ürün portföyü, fiyatlama, tedarik */
    products: true,
    /** Ar-Ge ve teknoloji ağacı */
    research: true,
    /** Hisse senedi piyasası ve yatırım */
    market: true,
    /** Hissedarlar, sermaye yapısı, seyreltme, müzakere */
    shareholders: true,
    /** Çeyreklik finansal rapor — oyunun öğretme yüzeyi */
    financialReport: true,
    /** MBA / executive education. CEO'ya bağlanacak: karar kalitesi + kredibilite */
    education: true,
    /** Takvim, notlar, ayarlar, profil — OS kabuğu */
    os: true,

    // ------------------------------------------------------------------
    //  RAFA KALDIRILDI — kod duruyor, sadece erişim kapalı.
    //  Motor derinleştikten sonra tek tek, gerekçesiyle geri açılacak.
    // ------------------------------------------------------------------
    /** Lifestyle hub'ı (features/life) — Life sekmesi ve app grid'i */
    life: false,
    /** İlişkiler / partner sistemi (features/love).
     *  NOT: Geri döneceği hâli "stakeholder management" olacak
     *  (yönetim kurulu, yatırımcı ilişkileri, kilit işe alım). */
    love: false,
    /** Kumarhane: slots, rulet, poker, blackjack */
    casino: false,
    /** Underworld sekmesi (kara borsa + hookup + network hub'ı) */
    underworld: false,
    /** Kara borsa ve polis takibi mini-oyunu */
    blackMarket: false,
    /** Night out / hookup zinciri */
    nightOut: false,
    /** Lüks tüketim ve mağazalar */
    shopping: false,
    /** Kişisel eşya portföyü */
    belongings: false,
    /** DNA / karakter statları ekranı */
    dna: false,
    /** Spor salonu ve dövüş sanatları */
    gym: false,
    /** Spa, bakım, estetik */
    sanctuary: false,
    /** Seyahat ve tatil rezervasyonu */
    travel: false,
    /** Hava durumu uygulaması */
    weather: false,

    // ------------------------------------------------------------------
    //  GELİŞTİRİCİ ARAÇLARI
    // ------------------------------------------------------------------
    /** God Mode paneli. Yayın build'inde false olmalı. */
    godMode: __DEV__,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Tek bir modülün açık olup olmadığını sorar. */
export const isEnabled = (key: FeatureKey): boolean => FEATURES[key] === true;

/**
 * Menü/grid dizilerini flag'e göre süzer.
 *
 *   const items = filterByFeature(SECTION_LEISURE);
 *
 * `feature` alanı olmayan öğeler her zaman kalır.
 */
export const filterByFeature = <T extends { feature?: FeatureKey }>(items: T[]): T[] =>
    items.filter(item => item.feature === undefined || isEnabled(item.feature));

/** Rafa kaldırılmış modüllerin listesi — teşhis/log amaçlı. */
export const shelvedFeatures = (): FeatureKey[] =>
    (Object.keys(FEATURES) as FeatureKey[]).filter(k => !isEnabled(k));
