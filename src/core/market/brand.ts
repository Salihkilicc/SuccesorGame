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
