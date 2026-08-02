// src/core/market/attraction.ts
//
// ============================================================================
//  ÇEKİCİLİK MODELİ — pazar payının nasıl hesaplandığı
// ============================================================================
//
//  TEMEL FIKIR
//  -----------
//  Her urunun bir "cekicilik" skoru vardir. Pazardaki payin, senin toplam
//  cekiciligin ile rakiplerin toplam cekiciligine oranidir:
//
//      pay = A_sen / (A_sen + A_rakipler)
//
//  Bu modeli secmemizin sebebi uc ozelligi:
//    - Paylar her zaman %100'e tamamlanir, kacak olmaz
//    - GORELIDIR: pazarlamani artirmak ancak rakip artirmadiysa ise yarar
//    - Azalan verim kendiliginden cikar, elle formul uydurmak gerekmez
//
//  KALIBRASYON
//  -----------
//  Rakiplerin toplam cekiciligini elle yazmiyoruz. Pazar verisindeki
//  `baselineShare` degerinden TURETIYORUZ:
//
//      "Sade bir urun %0.15 pay alsin"  ->  A_rakipler = (1 - 0.0015) / 0.0015
//
//  Boylece tek bir sayiyi oynatarak pazarin zorlugunu ayarlarsin.
//
//  BES FAKTOR — DAHA FAZLASINI EKLEME
//  -----------------------------------
//  Fiyat, pazarlama, kalite, marka, urun cazibesi. Altinci faktor eklemek
//  cazip gelecek ama model okunmaz olur: oyuncu neyin ne yaptigini
//  hissedemezse oyun hesap tablosuna doner. Bir sey eklemek istiyorsan
//  once bir seyi cikar.
//
//  ONEMLI: Bu dosyada yan etki YOK. Sadece sayi alir sayi doner.
//  Boylece motordan bagimsiz dusunulebilir ve test edilebilir.
//
// ============================================================================

import type { ProductMarket } from './productMarkets';

/** Cekicilik hesabinin girdileri. */
export interface AttractionInput {
    /** Oyuncunun belirledigi satis fiyati */
    sellingPrice: number;
    /** Urunun referans fiyati — sapma buradan olculur */
    suggestedPrice: number;
    /** Satilan birim basina pazarlama harcamasi */
    /** Ceyreklik pazarlama BUTCESI (dolar) */
    marketingBudget: number;
    /** Bu urunun kiyas butcesi */
    benchmark: number;
    /** Ar-Ge kalite seviyesi (1'den baslar) */
    qualityLevel: number;
    /** Sirket marka degeri (0-100) */
    brandValue: number;
    /** Urunun kendi cazibesi (0-100, 50 = notr) */
    marketDemand: number;
}

/** Cekicilik kirilimi — rapora "neden" yazabilmek icin. */
export interface AttractionBreakdown {
    price: number;
    marketing: number;
    quality: number;
    brand: number;
    appeal: number;
    /** Hepsinin carpimi */
    total: number;
}

// --- Ayar sabitleri --------------------------------------------------------

/** Kalite seviyesi basina cekicilik artisi. Lvl 5 -> 1 + 4*0.25 = 2.0 kat */
const QUALITY_STEP = 0.25;

/** Doymus ses payinin cekicilige katkisi. 2 -> en fazla 3 kat. */
const MARKETING_MAX_BONUS = 2.0;

/**
 * Kiyas butcesi cironun bu orani kadar buyur.
 * Buyudukce payi korumak pahalilasir — istenen davranis bu.
 */
const BENCHMARK_OF_REVENUE = 0.18;

/** Marka 100'e ciktiginda cekicilik carpani bu olur. */
const BRAND_MAX_MULTIPLIER = 3.5;

/** Fiyat carpaninin alt/ust siniri — asiri degerlerde model patlamasin. */
const PRICE_FACTOR_MIN = 0.05;
const PRICE_FACTOR_MAX = 6.0;

/**
 * Satin alinan sirketin cekiciliginin ne kadari sana gecer.
 *
 * TAMAMI DEGIL — entegrasyon kaybi gercek: musterilerin bir kismi gider,
 * ekip dagilir, marka degeri seyrelir. Bu sayi satin almayi "bedava
 * buyume" olmaktan cikarip gercek bir kumara cevirir.
 *
 * MBA notu: satin almalarin cogunun deger yakmasinin sebebi tam olarak bu.
 */
export const ACQUIRED_ATTRACTION_KEPT = 0.75;

// --- Faktorler -------------------------------------------------------------

/**
 * Fiyat carpani. Onerilen fiyattan satarsan 1.0.
 * Ucuzlatirsan artar, pahalilastirinca duser. Ustel iliski, cunku
 * talep fiyata dogrusal tepki vermez.
 */
export const priceFactor = (
    sellingPrice: number,
    suggestedPrice: number,
    elasticity: number,
): number => {
    if (!(sellingPrice > 0) || !(suggestedPrice > 0)) return 1;
    const raw = Math.pow(suggestedPrice / sellingPrice, elasticity);
    return Math.min(PRICE_FACTOR_MAX, Math.max(PRICE_FACTOR_MIN, raw));
};

/**
 * KIYAS BUTCE — "bu pazarda sesini duyurmanin bedeli".
 *
 * Kategorinin taban degeri ile KENDI cironun %25'inin buyugu.
 * Kucukken taban gecerlidir; buyudukce kiyas seninle birlikte buyur,
 * yani ayni butce giderek daha az ses getirir. Payi savunmak pahalilasir.
 */
export const marketingBenchmark = (market: ProductMarket, previousRevenue: number): number =>
    Math.max(market.marketingBenchmark, Math.max(0, previousRevenue) * BENCHMARK_OF_REVENUE);

/**
 * Pazarlama carpani — SES PAYI modeli.
 *
 * ONEMLI DEGISIKLIK: pazarlama artik BIRIM BASINA degil, CEYREKLIK BUTCE.
 * Eskiden satilan birim basina odeniyordu, yani satmazsan odemiyordun —
 * bu da onu oyundaki tek risksiz kaldirac yapiyordu. Artik satsan da
 * satmasan da odenir.
 *
 * Etki mutlak degil GORELI: butce/(butce+kiyas). Kiyasa esit harcarsan
 * ses payin %50 olur. Iki kati harcarsan %67 — azalan verim formulun
 * kendisinden dogar, elle tavan koymaya gerek yok.
 */
export const marketingFactor = (budget: number, benchmark: number): number => {
    const b = Math.max(0, budget);
    const denom = b + Math.max(1, benchmark);
    const shareOfVoice = denom > 0 ? b / denom : 0;
    return 1 + MARKETING_MAX_BONUS * shareOfVoice;
};

/** Ses payi (0-1) — ekranda gostermek icin. */
export const shareOfVoice = (budget: number, benchmark: number): number => {
    const b = Math.max(0, budget);
    return b / (b + Math.max(1, benchmark));
};

/** Kalite carpani. Ar-Ge'nin paya dogrudan etkisi burasi. */
export const qualityFactor = (qualityLevel: number): number =>
    1 + Math.max(0, (qualityLevel || 1) - 1) * QUALITY_STEP;

/** Marka carpani. 0 -> 1.0, 100 -> BRAND_MAX_MULTIPLIER. */
export const brandFactor = (brandValue: number): number => {
    const clamped = Math.min(100, Math.max(0, brandValue || 0));
    return 1 + (BRAND_MAX_MULTIPLIER - 1) * (clamped / 100);
};

/** Urunun kendi cazibesi. 50 notr kabul edilir. */
export const appealFactor = (marketDemand: number): number => {
    const clamped = Math.min(100, Math.max(0, marketDemand ?? 50));
    return Math.max(0.2, clamped / 50);
};

/** Tum faktorleri hesaplar ve carpar. */
export const computeAttraction = (
    input: AttractionInput,
    market: ProductMarket,
): AttractionBreakdown => {
    const price = priceFactor(input.sellingPrice, input.suggestedPrice, market.priceElasticity);
    const marketing = marketingFactor(input.marketingBudget, input.benchmark);
    const quality = qualityFactor(input.qualityLevel);
    const brand = brandFactor(input.brandValue);
    const appeal = appealFactor(input.marketDemand);

    return {
        price,
        marketing,
        quality,
        brand,
        appeal,
        total: price * marketing * quality * brand * appeal,
    };
};

// --- Pay ------------------------------------------------------------------

/**
 * Rakiplerin toplam cekiciligi.
 *
 * `baselineShare`'den turetilir: sade bir urun (tum faktorler 1) o payi
 * alsin isteniyorsa, rakiplerin toplami su olmali:
 *
 *     pay = 1 / (1 + K)  ->  K = (1 - pay) / pay
 */
export const competitorAttraction = (market: ProductMarket): number => {
    const base = Math.min(99, Math.max(0.0001, market.baselineShare)) / 100;
    return (1 - base) / base;
};

/**
 * Rakiplerin cekiciligini SIRKET BASINA dagitir.
 *
 * NEDEN AYIRIYORUZ: satin alma. Pear'i aldiginda Pear'in cekiciligi
 * havuzdan CIKMALI ve bir kismi sana gecmeli. Tek blok halinde tutarsak
 * bunu yapamayiz.
 *
 * Dagitim, veride yazili paylarla orantilidir: %31 payi olan sirket
 * havuzun %31'ine denk gelen bolumunu tasir.
 *
 * `acquiredStockIds`: oyuncunun satin aldigi sirketler. Bunlar havuzdan
 * dusulur — pazarda artik rakip degiller.
 */
export const competitorAttractionMap = (
    market: ProductMarket,
    acquiredStockIds: string[] = [],
): { perCompetitor: Record<string, number>; remainingTotal: number } => {
    const total = competitorAttraction(market);
    const shareSum = market.competitors.reduce((sum, c) => sum + c.share, 0);
    const perCompetitor: Record<string, number> = {};
    let remainingTotal = 0;

    for (const c of market.competitors) {
        const portion = shareSum > 0 ? c.share / shareSum : 0;
        const attraction = total * portion;
        perCompetitor[c.stockId] = attraction;
        if (!acquiredStockIds.includes(c.stockId)) {
            remainingTotal += attraction;
        }
    }

    return { perCompetitor, remainingTotal };
};

/**
 * Bir kategorideki tum urunlerin paylarini birlikte hesaplar.
 *
 * NEDEN BIRLIKTE: ayni kategorideki urunlerin BIRBIRININ payini yemesi
 * gerekiyor. Ayri ayri hesaplarsan iki urun tek urunun iki kati pay alir
 * ki bu yanlis — ayni pastadan yiyorlar.
 *
 * Donen deger: her urunun payi (yuzde) ve kategori toplami.
 */
export const computeShares = (
    attractions: number[],
    market: ProductMarket,
    /** Satin alinan rakipler havuzdan cikar, paylari sana gecer. */
    acquiredStockIds: string[] = [],
): { shares: number[]; totalShare: number } => {
    const { perCompetitor, remainingTotal } = competitorAttractionMap(market, acquiredStockIds);

    // Satin alinan sirketlerin cekiciliginin bir kismi oyuncuya gecer.
    // Tamami degil: entegrasyon kaybi. Bkz. ACQUIRED_ATTRACTION_KEPT
    const inherited = acquiredStockIds.reduce(
        (sum, id) => sum + (perCompetitor[id] || 0) * ACQUIRED_ATTRACTION_KEPT,
        0,
    );

    const K = remainingTotal;
    const sumPlayer = attractions.reduce((sum, a) => sum + Math.max(0, a), 0) + inherited;
    const denominator = sumPlayer + K;

    if (!(denominator > 0)) {
        return { shares: attractions.map(() => 0), totalShare: 0 };
    }

    const shares = attractions.map(a => (Math.max(0, a) / denominator) * 100);
    return { shares, totalShare: (sumPlayer / denominator) * 100 };
};

/**
 * Pazarin bu urunden talep ettigi adet.
 * Uretimden BAGIMSIZ — modelin butun mesele bu.
 */
export const demandUnits = (market: ProductMarket, sharePercent: number): number =>
    Math.floor(market.sizeUnitsPerQuarter * (Math.max(0, sharePercent) / 100));

// ============================================================================
//  MARKA DINAMIGI
// ============================================================================
//  Marka yavas hareket eder — ceyrekte en fazla birkac puan. Bu bilincli:
//  itibar hizli kazanilmaz, ama hizli kaybedilir.
//
//  Yukselten:  BAKIM esiginin ustunde pazarlama, yuksek kalite
//  Dusuren:    bakimin altinda kalmak, stok tukenmesi
//
//  Bakim esigi kiyas butcesine, kiyas butcesi de CIRONA bagli. Yani
//  buyudukce markayi ayakta tutmanin bedeli de buyur.
// ============================================================================

export interface BrandUpdateInput {
    currentBrand: number;
    /** Satilan toplam adet */
    unitsSold: number;
    /** Mal yetmedigi icin karsilanamayan talep */
    unmetDemand: number;
    /** Bu ceyrek harcanan toplam pazarlama BUTCESI */
    marketingSpend: number;
    /** Urunlerin kiyas butcelerinin toplami — bakim seviyesi buradan cikar */
    marketingBenchmarkTotal: number;
    /** Aktif urunlerin ortalama kalite seviyesi */
    averageQuality: number;
    /** Tesis kademesinin marka tavani (bkz. capacity.ts) */
    brandCeiling?: number;
    /** Tesis kademesinin marka tabani */
    brandFloor?: number;
}

export interface BrandUpdateResult {
    newBrand: number;
    change: number;
    /** Bu ceyregin bakim esigi — ekranda gostermek icin */
    maintenance: number;
    /** Markanin bu kademede takildigi tavan — ekranda gostermek icin */
    ceiling: number;
    reasons: string[];
}

/** Marka bir ceyrekte en fazla bu kadar YUKSELIR. */
const BRAND_MAX_GAIN = 4;
/** Marka bir ceyrekte en fazla bu kadar DUSER. */
const BRAND_MAX_DROP = 3;
/** Bakim esigi kiyas butcesinin bu orani kadardir. */
const BRAND_MAINTENANCE_RATIO = 0.25;
/** Bakimin uzerine cikinca alinabilecek en yuksek kazanc. */
const BRAND_GAIN_MAX = 4.0;
/** Bakimin altina duserken alinabilecek en yuksek asinma. */
const BRAND_DECAY_MAX = 1.2;
/**
 * MARKA TABANI — motor kademeden gecirmezse kullanilan asgari deger.
 *
 * Simulasyon bu tabani koymadan once sunu gosterdi: 20 calisanla baslayan
 * oyuncu zaten pazarin tamamini karsilayamaz, stok tukenmesi kacinilmazdir.
 * Ceza tabansiz olunca marka 3 ceyrekte sifira dusuyor ve bir daha
 * toparlanamiyordu. Yani oyuncu BASLANGIC KOSULU yuzunden cezalandiriliyordu.
 *
 * Ikinci turda ayni sey BUYUYEN oyuncunun basina geldi: pay artinca talep
 * kapasiteyi asiyor, stok tukeniyor, marka yaniyordu — yani oyuncuyu KENDI
 * BASARISI cezalandiriyordu. Bu yuzden taban artik TESIS KADEMESINDEN
 * gelir (bkz. capacity.ts): kurumsal bir ureticinin itibari sifirlanmaz.
 */
const DEFAULT_BRAND_FLOOR = 5;

/**
 * MARKA GUNCELLEME — bakim seviyesi modeli.
 *
 * Marka bir STOK'tur, akis degil. Her ceyrek bir BAKIM ESIGI vardir
 * (kiyas butcesinin %35'i). Esigin uzerinde harcarsan marka birikir,
 * altinda kalirsan erir. Esik cironla birlikte buyudugu icin buyudukce
 * ayni butce yetmemeye baslar — payi savunmak pahalilasir.
 *
 * KRITIK: kazanc KARSILAMA ORANI ile olceklenir (satilan / talep edilen).
 * Kapasiten yokken pazarlamaya para gomersen marka YUKSELMEZ; talep
 * yaratip karsilayamamak itibar insa etmez, yikar. Simulasyonda bu
 * olmadan "kapasitesiz patlatma" karli cikiyordu — artik cikmiyor.
 */
export const updateBrand = (input: BrandUpdateInput): BrandUpdateResult => {
    const reasons: string[] = [];

    const maintenance = Math.max(0, input.marketingBenchmarkTotal) * BRAND_MAINTENANCE_RATIO;
    const spend = Math.max(0, input.marketingSpend);

    const totalWanted = input.unitsSold + input.unmetDemand;
    const fulfillment = totalWanted > 0 ? input.unitsSold / totalWanted : 1;

    let delta = 0;

    if (spend > maintenance) {
        const above = (spend - maintenance) / Math.max(1, maintenance);
        const gain = Math.min(BRAND_GAIN_MAX, above * 1.5) * fulfillment;
        if (gain > 0.05) {
            delta += gain;
            reasons.push('marketing above maintenance');
        }
    } else {
        const below = (maintenance - spend) / Math.max(1, maintenance);
        delta -= Math.min(BRAND_DECAY_MAX, below * BRAND_DECAY_MAX);
        reasons.push('marketing below maintenance');
    }

    // Kalite: seviye 1 notr, ustu marka insa eder. Bu da karsilama
    // oraniyla olceklenir — satamadigin urunun kalitesi kimseye ulasmaz.
    if (input.averageQuality > 1) {
        delta += Math.min(1.0, (input.averageQuality - 1) * 0.2) * fulfillment;
        reasons.push('product quality');
    }

    // Tavana dayandiysan oyuncuya sebebini soyle: sorun pazarlamada degil,
    // uretim kabiliyetinde.
    if (input.brandCeiling !== undefined && input.currentBrand >= input.brandCeiling - 0.5 && delta > 0) {
        reasons.push('capped by facility tier');
    }

    // Stok tukenmesi: musteriyi bos cevirmek marka yakar.
    if (input.unmetDemand > 0 && totalWanted > 0) {
        delta -= (input.unmetDemand / totalWanted) * 2.0;
        reasons.push('stockouts');
    }

    const clampedDelta = Math.max(-BRAND_MAX_DROP, Math.min(BRAND_MAX_GAIN, delta));
    const raw = input.currentBrand + clampedDelta;

    const floor = input.brandFloor ?? DEFAULT_BRAND_FLOOR;
    // TAVAN: atolyede premium marka olamazsin. Ne kadar pazarlama
    // yaparsan yap, uretim kabiliyetin itibarinin tavanini belirler.
    const ceiling = Math.min(100, input.brandCeiling ?? 100);

    // Taban yalnizca ASAGI yonlu koruma; zaten tavanin ustundeysen
    // (kademe dusurulduyse) yukselmene de izin verilmez.
    const floored = clampedDelta < 0 ? Math.max(floor, raw) : raw;
    const newBrand = Math.max(0, Math.min(ceiling, floored));

    return {
        newBrand: Math.round(newBrand * 10) / 10,
        change: Math.round((newBrand - input.currentBrand) * 10) / 10,
        maintenance: Math.round(maintenance),
        ceiling,
        reasons,
    };
};

