import { t } from '../i18n';
// src/core/market/brand.ts
//
// ============================================================================
//  MARKA — oyunun en yavaş ve en kalıcı birikimi
// ============================================================================
//
//  OYUNCUNUN SORUSU
//  ----------------
//  "en onemli mekanik bu brand value ama ona pek deginmiyoruz, cok sacma,
//   artisini cozemedim. pazar payini degistirmeli, net worthu degistirmeli."
//
//  Hakliydi. Marka VARDI ama tek yonlu bir borudan ibaretti:
//
//      pazarlama butcesi -> marka -> cekicilik -> pazar payi
//
//  Yani markayi yalnizca PARA insa ediyordu. Gercekte marka paradan cok
//  daha fazlasindan beslenir: kac kisinin urunu kullandigi, kimin satin
//  alindigi, sirketin ne kadar suredir ayakta oldugu. Ve tersine, marka
//  yalnizca satisi degil SIRKETIN DEGERINI de tasir.
//
//  BU DOSYANIN KURDUGU DONGU
//  -------------------------
//      pazarlama ─┐
//      kalite     ├─> MARKA ─┬─> cekicilik -> pazar payi ─┐
//      pazar payi ┘          ├─> degerleme carpani        │
//      devralma              └─> hisse fiyati              │
//           ↑                                              │
//           └──────────────────────────────────────────────┘
//                        (kendini besleyen halka)
//
//  Bu kasitli bir GERI BESLEME dongusudur ve oyunun bilesik buyume
//  motorudur: pay aldikca marka buyur, marka buyudukce pay almak
//  kolaylasir. Ama bilesik buyume kontrolsuz birakilirsa oyunu bitirir,
//  o yuzden uc fren var:
//
//    1) TESIS TAVANI — atolyede premium marka olamazsin (capacity.ts)
//    2) AZALAN VERIM — marka 100'e yaklastikca kazanmak zorlasir
//    3) BAKIM ESIGI  — buyudukce markayi korumak pahalilasir
//
//  ZAMAN BOYUTU: marka kasitli olarak YAVAS. Bir ceyrekte en fazla
//  birkac puan oynar. Sebebi su — oyundaki her sey (uretim, pazarlama,
//  kadro) bir ceyrekte degistirilebilir. Marka degistirilemez. Oyuncunun
//  UZUN VADELI dusunmek zorunda kaldigi tek yer burasi olmali.
//
//  NEWS BAGLANTISI: ileride haber sistemi buraya baglanacak. `BrandShock`
//  tipi ve `applyBrandShock` o yuzden simdiden burada — haber geldiginde
//  tek yapilacak sey bu fonksiyonu cagirmak olacak.
//
// ============================================================================

/** Markanin mutlak tavani. */
export const BRAND_MAX = 100;

// ============================================================================
//  1. PAZAR PAYI → MARKA
// ============================================================================
//  Bir markayi taniyor olmanin en buyuk sebebi cevrendekilerin onu
//  kullaniyor olmasidir. Pazar payi bu yuzden markanin en dogal
//  besleyicisidir ve gercek hayatta reklamdan daha guclu calisir.
//
//  Ama ANINDA degil: pazarin %30'unu bugun alsan bile insanlarin seni
//  "buyuk marka" saymasi yillar alir. O yuzden payin kendisi degil,
//  payin GECMISI onemli — bu da dogal bir gecikme yaratir.
// ============================================================================

/** Pazar payinin markaya cevrilme orani. Ceyrek basina. */
export const SHARE_TO_BRAND_RATE = 0.06;

/**
 * Pazar payinin bu ceyrek markaya katkisi.
 *
 * Payin dengeye getirdigi bir marka seviyesi vardir: pazarin %40'ini
 * elinde tutan bir sirket, hic reklam vermese bile taninir. `equilibrium`
 * o seviyedir; marka ona dogru yavasca kayar.
 *
 * KAREKOK kullaniyoruz cunku ilk %10 pay taninirlik acisindan sonraki
 * %10'dan cok daha degerlidir — sifirdan gorunur olmak, gorunurken daha
 * gorunur olmaktan zordur.
 */
export const brandFromMarketShare = (
    currentBrand: number,
    totalMarketShare: number,
): { delta: number; equilibrium: number } => {
    const share = Math.max(0, Math.min(100, totalMarketShare || 0));
    // %40 pay ~63 marka dengesi verir; %10 pay ~32.
    const equilibrium = Math.min(BRAND_MAX, Math.sqrt(share / 100) * 100);
    const delta = (equilibrium - (currentBrand || 0)) * SHARE_TO_BRAND_RATE;
    return { delta, equilibrium };
};

// ============================================================================
//  2. DEVRALMA → MARKA
// ============================================================================
//  Bir sirketi satin aldiginda onun ITIBARINI da alirsin. Gercek
//  hayattaki en net ornegi budur: kimse Instagram'i Facebook'un
//  aldigini gunluk hayatta dusunmez ama Facebook o marka gucunu
//  bilancosuna yazar.
//
//  Katki hedefin SENIN YANINDA ne kadar buyuk oldugune baglidir. Kendi
//  boyunun onda biri bir sirket markana hicbir sey katmaz; kendinden
//  buyugunu alirsan markan sicrar.
//
//  DUSMANCA DEVRALMADA YARISI: itibar transferi iyi niyet ister. Zorla
//  aldigin sirketin musterisi ve ekibi seninle gelmez.
// ============================================================================

/** Devralmanin verebilecegi en yuksek tek seferlik marka puani. */
export const ACQUISITION_BRAND_MAX = 12;

export const brandFromAcquisition = (
    targetValue: number,
    acquirerValue: number,
    hostile: boolean,
    currentBrand: number,
): number => {
    const ratio = Math.max(0, targetValue) / Math.max(1, acquirerValue);
    // Karekok: kendinden buyugunu almak buyuk katki verir ama dogrusal degil.
    const raw = Math.min(ACQUISITION_BRAND_MAX, Math.sqrt(ratio) * ACQUISITION_BRAND_MAX);
    const realized = raw * (hostile ? 0.5 : 1);
    // AZALAN VERIM: zaten guclu markaya eklemek zordur.
    const headroom = Math.max(0, (BRAND_MAX - (currentBrand || 0)) / BRAND_MAX);
    return realized * headroom;
};

// ============================================================================
//  3. ZAMAN → MARKA
// ============================================================================
//  Ayakta kalmanin kendisi bir itibardir. Yirmi yildir var olan bir
//  sirket, ayni buyuklukteki iki yillik sirketten daha guvenilirdir.
//  Cok kucuk bir katki ama BILESIKTIR ve oyuncunun sabrini odullendiren
//  tek mekanik budur.
//
//  Yalnizca KARLI ceyreklerde isler: hayatta kalmak ayri sey, zar zor
//  ayakta durmak ayri.
// ============================================================================

export const BRAND_TENURE_PER_QUARTER = 0.15;
/** Zamanla erisilebilecek en yuksek marka — tek basina yetmez. */
export const BRAND_TENURE_CAP = 45;

export const brandFromTenure = (currentBrand: number, profitable: boolean): number => {
    if (!profitable || (currentBrand || 0) >= BRAND_TENURE_CAP) return 0;
    return BRAND_TENURE_PER_QUARTER;
};

// ============================================================================
//  4. MARKA → DIŞARI
// ============================================================================

/**
 * Markanin DEGERLEME carpanina etkisi.
 *
 * Guclu marka fiyatlama gucu demektir; fiyatlama gucu marj demektir;
 * marj da carpan demektir. Piyasa bunu her zaman odullendirir — ayni
 * kari eden iki sirketten markali olani daha pahali islem gorur.
 *
 * KARESEL: dusuk markadan orta markaya cikmak degerlemeyi az oynatir,
 * orta markadan guclu markaya cikmak cok oynatir. Gercek hayatta da
 * premium algisi bir esikten sonra devreye girer.
 */
export const BRAND_VALUATION_BONUS = 0.55;

export const brandValuationMultiplier = (brandValue: number): number => {
    const b = Math.min(BRAND_MAX, Math.max(0, brandValue || 0)) / 100;
    return 1 + BRAND_VALUATION_BONUS * (b * b);
};

/**
 * Markanin HISSE OYNAKLIGINA etkisi.
 *
 * Guclu markali sirketin hissesi daha az oynar: yatirimci kotu bir
 * ceyregi "gecici" diye okur. Zayif markada ayni kotu ceyrek "bitiyor"
 * diye okunur. Buna finansta "kalite primi" denir.
 */
export const brandStabilityFactor = (brandValue: number): number => {
    const b = Math.min(BRAND_MAX, Math.max(0, brandValue || 0)) / 100;
    return 1 - 0.35 * b; // marka 100 -> oynaklik %35 daha az
};

// ============================================================================
//  5. HABER ŞOKU — şimdilik boş, sistem hazır
// ============================================================================
//  Haber sistemi yazildiginda tek yapilacak sey burayi cagirmak olacak.
//  Simdiden burada duruyor ki haber eklendiginde markaya BASKA bir yol
//  acilmasin — bu projede ikinci yol biraktigimiz her yerde iki sayi
//  birbirinden ayrildi.
// ============================================================================

export interface BrandShock {
    /** Pozitif ya da negatif ham puan */
    magnitude: number;
    /** Oyuncuya gosterilecek sebep */
    reason: string;
}

/**
 * Bir haberin markaya etkisi.
 *
 * Iyi haber azalan verimle, kotu haber TAM etkiyle uygulanir. Itibar
 * kazanmak yillar alir, kaybetmek bir gun — bu asimetri kasitlidir ve
 * markayi gercekten korumaya deger kilan sey odur.
 */
export const applyBrandShock = (currentBrand: number, shock: BrandShock): number => {
    const b = currentBrand || 0;
    if (shock.magnitude >= 0) {
        const headroom = Math.max(0, (BRAND_MAX - b) / BRAND_MAX);
        return shock.magnitude * headroom;
    }
    return shock.magnitude;
};

// ============================================================================
//  6. ÇEYREKLİK TOPLAM
// ============================================================================

export interface BrandQuarterInput {
    currentBrand: number;
    /** Pazarlama/kalite tarafindan uretilen degisim (attraction.ts) */
    marketingDelta: number;
    /** Oyuncunun tum kategorilerdeki agirlikli toplam pazar payi */
    totalMarketShare: number;
    /** Bu ceyrek karli miydi */
    profitable: boolean;
    /** Bu ceyrek yapilan devralmalarin marka katkisi */
    acquisitionGain: number;
    /** Haber solari (ileride) */
    shocks?: BrandShock[];
    /** Tesis kademesinin marka tavani */
    ceiling: number;
    /** Tesis kademesinin marka tabani */
    floor: number;
}

export interface BrandQuarterResult {
    newBrand: number;
    change: number;
    /** Hangi kaynak ne kadar katti — ekranda gostermek icin */
    sources: { label: string; amount: number }[];
    /** Pazar payinin getirdigi denge seviyesi */
    shareEquilibrium: number;
    cappedByFacility: boolean;
}

/**
 * Bir ceyregin marka hareketinin TAMAMI. Tek kapi.
 *
 * Motor yalnizca bunu cagirir; boylece "marka nereden geliyor" sorusunun
 * tek bir cevabi olur ve ekranda kalem kalem gosterilebilir.
 */
export const advanceBrand = (input: BrandQuarterInput): BrandQuarterResult => {
    const start = Math.max(0, input.currentBrand || 0);
    const sources: { label: string; amount: number }[] = [];

    // 1) Pazarlama ve kalite (attraction.ts'ten gelir)
    if (Math.abs(input.marketingDelta) > 0.01) {
        sources.push({ label: t('data.brand.marketingQuality'), amount: input.marketingDelta });
    }

    // 2) Pazar payi
    const share = brandFromMarketShare(start, input.totalMarketShare);
    if (Math.abs(share.delta) > 0.01) {
        sources.push({
            label: `Market share (${input.totalMarketShare.toFixed(1)}%)`,
            amount: share.delta,
        });
    }

    // 3) Zaman
    const tenure = brandFromTenure(start, input.profitable);
    if (tenure > 0) sources.push({ label: t('data.brand.anotherProfitableQuarter'), amount: tenure });

    // 4) Devralmalar
    if (input.acquisitionGain > 0.01) {
        sources.push({ label: t('data.brand.brandsYouAcquired'), amount: input.acquisitionGain });
    }

    // 5) Haber (ileride)
    let shockTotal = 0;
    (input.shocks || []).forEach(s => {
        const applied = applyBrandShock(start, s);
        shockTotal += applied;
        sources.push({ label: s.reason, amount: applied });
    });

    const raw =
        start + input.marketingDelta + share.delta + tenure + input.acquisitionGain + shockTotal;

    // TESIS TAVANI: atolyede premium marka olamazsin.
    const ceiling = Math.min(BRAND_MAX, input.ceiling ?? BRAND_MAX);
    const capped = raw > ceiling;
    const newBrand = Math.max(input.floor ?? 0, Math.min(ceiling, raw));

    return {
        newBrand,
        change: newBrand - start,
        sources,
        shareEquilibrium: share.equilibrium,
        cappedByFacility: capped,
    };
};

// ============================================================================
//  KATEGORI MARKALARI VE KURUMSAL CATI
// ============================================================================
//  Marka tek bir sayiydi: saglikta kazandigin itibar teknolojide de
//  isine yariyordu. Gercek hayatta boyle degil — Apple telefonda
//  guclu diye ilac satamaz.
//
//  Artik her kategorinin kendi markasi var ve urunun cekiciligi KENDI
//  kategorisinin markasini okur. Dongu kategori icinde kapanir:
//  teknolojide sat -> teknoloji markan buyur -> teknolojide daha cok sat.
//
//  Ustte bir de KURUMSAL MARKA duruyor: kategori markalarinin ciro
//  agirlikli ortalamasi. Kategoriye bagli olmayan her sey bunu okur —
//  hisse istikrari, kredi notu, fasoncuya kabul, ise alim, giris esigi.
// ============================================================================

/** Yeni kategoriye girerken kurumsal markanin ne kadari taban sayilir. */
export const CORPORATE_HALO = 0.20;

/**
 * Kurumsal marka: kategori markalarinin CIRO AGIRLIKLI ortalamasi.
 *
 * Agirlik ciro cunku sirketi taniyan kitle nerede satiyorsan oradadir.
 * Hic ciro yoksa duz ortalamaya duser.
 */
export const corporateBrand = (
    byCategory: Record<string, number>,
    revenueByCategory: Record<string, number>,
): number => {
    const keys = Object.keys(byCategory);
    if (keys.length === 0) return 0;

    const totalRevenue = keys.reduce((sum, k) => sum + Math.max(0, revenueByCategory[k] || 0), 0);
    if (totalRevenue <= 0) {
        return keys.reduce((sum, k) => sum + (byCategory[k] || 0), 0) / keys.length;
    }
    return keys.reduce(
        (sum, k) => sum + (byCategory[k] || 0) * (Math.max(0, revenueByCategory[k] || 0) / totalRevenue),
        0,
    );
};

/**
 * Yeni bir kategoriye ilk girerken markan sifirdan baslamaz.
 * Kurumsal itibarinin bir kismi kapida sana yarar — ama yalnizca bir kismi.
 */
export const categoryStartingBrand = (corporate: number): number =>
    Math.max(0, (corporate || 0) * CORPORATE_HALO);

// ============================================================================
//  BRAND POINTS — the player-facing scale, anchored to market share
// ============================================================================
//
//  The player's design, in his own numbers:
//
//      share 0.6%  -> brand 26
//      share 1.8%  -> brand 78
//      share 4.7%  -> brand 200   (the gate to the next category)
//      share 10%   -> brand 433
//
//  All four sit on one line: 26/0.6 = 78/1.8 = 433/10 = 43.3. So brand points
//  are market share expressed in a bigger unit, and BRAND_POINTS_PER_SHARE is
//  that unit.
//
//  WHY ANCHOR BRAND TO SHARE AT ALL: it makes the loop legible. Buy a company,
//  inherit its share, and your brand jumps the same multiple - which is
//  exactly what the player asked for ("startup'i aldim, 1.2 pay bana gecti,
//  brand 3 katina firlamali"). Marketing, serving demand and news then move
//  you off that line temporarily, and brand feeds back into attraction, which
//  earns more share. The line is the equilibrium, not a hard identity.
//
//  THE 0-100 CONSUMERS: attraction, valuation multiples, hiring pull, contract
//  partners and facility ceilings were all written against a 0-100 brand.
//  Rather than rewrite six modules, points convert to that index:
//
//      index = min(100, points / BRAND_INDEX_SCALE)
//
//  433 points (10% share) = index 100. Past 10% of a market you are already a
//  household name, so saturating there is the honest behaviour rather than an
//  arbitrary clamp.
// ============================================================================

/** Brand points earned per point of market share. Derived from the design above. */
export const BRAND_POINTS_PER_SHARE = 43.3;

/** Points -> the 0-100 index every older module expects. */
export const BRAND_INDEX_SCALE = 4.33;

/** Brand points needed in a category before another category can be opened. */
export const CATEGORY_UNLOCK_BRAND = 200;

/** How fast brand walks towards its share-implied level, per quarter. */
export const BRAND_APPROACH = 0.25;

/** Extra pull when you actually served the demand you created. */
export const BRAND_SERVICE_BONUS = 0.10;

/** Converts brand points to the 0-100 index used by attraction, valuation etc. */
export const brandIndex = (points: number): number =>
    Math.max(0, Math.min(100, (points || 0) / BRAND_INDEX_SCALE));

/** The brand level a given market share supports on its own. */
export const brandEquilibrium = (sharePercent: number): number =>
    Math.max(0, sharePercent || 0) * BRAND_POINTS_PER_SHARE;

export interface CategoryBrandInput {
    /** Current brand points in this category */
    current: number;
    /** Realised market share this quarter (%) */
    share: number;
    /** Of the demand you created, what fraction did you actually deliver (0-1) */
    servedRatio: number;
    /** Marketing and quality contribution, in points */
    marketingDelta?: number;
    /** Points inherited from an acquisition that closed this quarter */
    acquisitionGain?: number;
    /** Negative news, in points */
    shock?: number;
}

/**
 * One quarter of a single category's brand.
 *
 * Share sets the destination; the walk is gradual because reputation lags
 * results. Delivering what you promised speeds the walk up - the player's
 * "insanlara yeterince satis yaparsam yavas yavas artmali". An acquisition is
 * the one thing that moves brand in a single step, because you did not build
 * that reputation, you bought it.
 */
export const advanceCategoryBrand = (input: CategoryBrandInput): {
    newBrand: number;
    equilibrium: number;
    sources: { label: string; amount: number }[];
} => {
    const current = Math.max(0, input.current || 0);
    const equilibrium = brandEquilibrium(input.share);
    const served = Math.max(0, Math.min(1, input.servedRatio ?? 1));
    const sources: { label: string; amount: number }[] = [];

    // Walk towards the level your share supports.
    const rate = BRAND_APPROACH + BRAND_SERVICE_BONUS * served;
    const pull = (equilibrium - current) * rate;
    if (Math.abs(pull) > 0.05) {
        sources.push({ label: t('data.brand.marketShareLabel'), amount: pull });
    }

    const marketing = input.marketingDelta || 0;
    if (Math.abs(marketing) > 0.05) {
        sources.push({ label: t('data.brand.marketingQuality'), amount: marketing });
    }

    const acquisition = input.acquisitionGain || 0;
    if (acquisition > 0.05) {
        sources.push({ label: t('data.brand.brandsYouAcquired'), amount: acquisition });
    }

    const shock = input.shock || 0;
    if (shock < -0.05) {
        sources.push({ label: t('data.brand.badNews'), amount: shock });
    }

    const newBrand = Math.max(0, current + pull + marketing + acquisition + shock);
    return { newBrand, equilibrium, sources };
};

// ============================================================================
//  CORPORATE BRAND Q — one number, built from the categories
// ============================================================================
//
//  The player's formula:  q = 0.2x + 0.4y + 0.6z + 0.8...
//  "her kategori daha agir, sonra gelen daha agir"
//
//  The weighting is kept exactly as designed: the harder the market, the more
//  it says about you. Competing in Deep Tech is worth more to your reputation
//  than selling phones, because far fewer companies can.
//
//  ONE CORRECTION, and it matters: the raw sum is NOT normalised. Taken
//  literally, a company operating only in Consumer with a category brand of
//  400 would have q = 0.2 x 400 = 80 - a fifth of its only business. And
//  opening a fourth weak category would RAISE q mechanically, rewarding
//  sprawl. So the weights are divided by the weights of the categories you
//  actually operate in:
//
//      q = SUM(w_i * x_i) / SUM(w_i)      over active categories only
//
//  One category -> q equals that category. Several -> a weighted average that
//  leans towards the hard ones. Same design, correct magnitude.
//
//  WHY Q HAS TO EXIST: the invoice, operations and the news system all need a
//  single company reputation. Bad news about phones drops x, and q follows on
//  its own because q is derived. Bad news about the COMPANY hits q, and that
//  has to travel the other way - down into every category, each taking a share
//  in proportion to its weight. That is what applyCorporateShock does.
// ============================================================================

/** How much each market weighs in the corporate brand. Harder market, heavier. */
export const CATEGORY_BRAND_WEIGHT: Record<string, number> = {
    Consumer: 0.2,
    Robotics: 0.4,
    'Bio-Tech': 0.6,
    'Deep Tech': 0.8,
};

/** Anything not listed counts as an easy market. */
export const categoryWeight = (category: string): number =>
    CATEGORY_BRAND_WEIGHT[category] ?? 0.2;

/**
 * The corporate brand: a weighted average over the categories you are in.
 * Returns 0 when you are in none.
 */
export const corporateBrandFrom = (
    byCategory: Record<string, number>,
    activeCategories?: string[],
): number => {
    const cats = (activeCategories && activeCategories.length
        ? activeCategories
        : Object.keys(byCategory || {})
    ).filter(c => byCategory[c] !== undefined);

    if (cats.length === 0) return 0;

    let weighted = 0;
    let weights = 0;
    cats.forEach(c => {
        const w = categoryWeight(c);
        weighted += w * Math.max(0, byCategory[c] || 0);
        weights += w;
    });
    return weights > 0 ? weighted / weights : 0;
};

/**
 * A company-wide hit travels DOWN into the categories.
 *
 * `amount` is negative. Each category absorbs a slice proportional to its
 * weight, so a scandal hurts your reputation most where that reputation
 * counted for most. Returns a new map; the corporate figure is then simply
 * recomputed from it, which keeps q derived rather than stored twice.
 */
export const applyCorporateShock = (
    byCategory: Record<string, number>,
    amount: number,
    activeCategories?: string[],
): Record<string, number> => {
    const cats = (activeCategories && activeCategories.length
        ? activeCategories
        : Object.keys(byCategory || {})
    ).filter(c => byCategory[c] !== undefined);

    if (cats.length === 0 || !amount) return { ...byCategory };

    const totalWeight = cats.reduce((sum, c) => sum + categoryWeight(c), 0);
    if (totalWeight <= 0) return { ...byCategory };

    // ------------------------------------------------------------------
    //  THE NORMALISER HAS TO BE EXACT
    // ------------------------------------------------------------------
    //  A -50 hit to q must leave q exactly 50 lower. Since
    //  q = SUM(w*x)/SUM(w), spreading the hit as d_i = amount * w_i/SUM(w)
    //  gives dq = amount * SUM(w^2)/SUM(w)^2, which is SMALLER than amount.
    //  A first version multiplied by the category count instead and
    //  overshot badly: -50 landed as -64 on q across three categories.
    //
    //  The exact correction is k = SUM(w)^2 / SUM(w^2).
    // ------------------------------------------------------------------
    const sumSquares = cats.reduce((sum, c) => sum + categoryWeight(c) ** 2, 0);
    const k = sumSquares > 0 ? (totalWeight ** 2) / sumSquares : 1;

    const next = { ...byCategory };
    cats.forEach(c => {
        const slice = amount * (categoryWeight(c) / totalWeight) * k;
        next[c] = Math.max(0, (next[c] || 0) + slice);
    });
    return next;
};

/**
 * Can another category be opened?
 *
 * The chain the player described: reach the threshold where you already are
 * before spreading. Every category you currently operate in must be at or
 * above CATEGORY_UNLOCK_BRAND - you cannot open a fourth market on the back
 * of one strong one while two others sit neglected.
 */
export const canUnlockAnotherCategory = (
    byCategory: Record<string, number>,
    activeCategories: string[],
): { allowed: boolean; weakest?: string; have: number; required: number } => {
    const cats = activeCategories.filter(c => byCategory[c] !== undefined);
    if (cats.length === 0) {
        return { allowed: true, have: 0, required: 0 };
    }
    let weakest = cats[0];
    cats.forEach(c => {
        if ((byCategory[c] || 0) < (byCategory[weakest] || 0)) weakest = c;
    });
    const have = byCategory[weakest] || 0;
    return {
        allowed: have >= CATEGORY_UNLOCK_BRAND,
        weakest,
        have,
        required: CATEGORY_UNLOCK_BRAND,
    };
};
