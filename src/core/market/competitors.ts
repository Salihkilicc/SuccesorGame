// @orphan-ok-symbol describeShareImpact - written for a UI string that was never built
// src/core/market/competitors.ts
//
// ============================================================================
//  RAKİPLER — pazar payı hareket eder, değerleme payı takip eder
// ============================================================================
//
//  ONCE NE VARDI
//  -------------
//  Rakiplerin payi `productMarkets.ts` icinde SABIT bir sayiydi. Pear Inc.
//  %31 idi ve on yil sonra da %31 olacakti. Bunun iki sonucu vardi:
//
//   1) Rakipler asla hata yapmiyordu, asla birbirini yemiyordu. Pazar
//      canli bir yer degil, bir duvar kagidiydi.
//
//   2) Bir rakibin borsa fiyati ile pazardaki durumu ARASINDA HIC BAG
//      YOKTU. Pazar payini elinden aldigin sirketin hissesi yukselmeye
//      devam edebiliyordu. Oyuncu bunu fark etti: "pazar payi ile sirket
//      valuesu orantili mi olsa".
//
//  DOGRU CEVAP: evet, ve bu bir suslemé degil. Bir sirketin degeri
//  gelecekteki nakit akisidir; pazar payi da o nakit akisinin en dogrudan
//  gostergesidir. Pay kaybeden sirketin degeri duser. Oyunun butun
//  rekabet dongusunu kapatan halka budur:
//
//      pazarlama/kalite/fiyat -> pazar payi -> rakibin degeri
//      -> onu satin alma bedeli -> senin buyume hizin
//
//  BASIT TUTMAK ICIN ALINAN KARARLAR
//  ---------------------------------
//  Rakip yapay zekasi yazmiyoruz. Rakipler karar VERMEZ; guclerine gore
//  yavasca kayarlar. Guclu olan zayiftan pay alir, hepsi birden senin
//  aldigin payi verir. Bu, tam bir simulasyondan cok daha ongorulebilir
//  ve oyuncunun kendi hamlesinin sonucunu okuyabilmesini saglar —
//  oyunun ogretilebilir kalmasi buna bagli.
//
// ============================================================================

export interface CompetitorState {
    stockId: string;
    /** Su anki pazar payi (yuzde) */
    share: number;
    /** Baslangic payi — degerleme carpani bununla kiyaslanir */
    baselineShare: number;
}

/**
 * Rakiplerin birbirine gore kayma hizi. Ceyrek basina.
 *
 * Bilincli olarak YAVAS. Gercek pazarlarda pay yillar icinde degisir,
 * ceyreklerde degil. Hizli yaparsak oyuncunun kendi hamlesinin etkisini
 * gurultuden ayirt etmesi imkansizlasir.
 */
export const COMPETITOR_DRIFT = 0.012;

/** Bir rakibin baslangic payinin en fazla bu kadar altina/ustune cikabilir. */
export const DRIFT_BAND = 0.45;

export interface CompetitorInput {
    stockId: string;
    share: number;
    strength: number;
}

/**
 * Bir ceyrek ilerlet.
 *
 * @param competitors  Rakiplerin mevcut durumu
 * @param playerShare  Oyuncunun bu pazardaki payi (yuzde)
 * @param baselines    Rakiplerin baslangic paylari (stockId -> yuzde)
 * @param random       Test edilebilirlik icin disaridan verilir
 */
export const advanceCompetitors = (
    competitors: CompetitorInput[],
    playerShare: number,
    baselines: Record<string, number>,
    random: () => number = Math.random,
): CompetitorState[] => {
    if (competitors.length === 0) return [];

    // ------------------------------------------------------------------
    //  HEDEF TOPLAM — "digerleri" boslugunu KORUYARAK
    // ------------------------------------------------------------------
    //  Ilk yazimda rakipleri `100 - oyuncuPayi` havuzuna normalize
    //  etmistim. Bu YANLISTI: productMarkets.ts icinde listelenen rakip
    //  paylari bilincli olarak %100'un ALTINDA toplaniyor; kalan kisim
    //  "adi gecmeyen kucuk oyuncular" demek. Havuza normalize edince o
    //  bosluk rakiplere dagiliyordu ve Pear Inc. daha ilk ceyrekte
    //  %31'den %47'ye firliyordu — kimse bir sey yapmadan.
    //
    //  Dogrusu: oyuncu buyudukce HERKES orantili kucululur, isimsiz
    //  kucuk oyuncular dahil. Pazardan pay almak listede olmayanlardan
    //  da alir.
    // ------------------------------------------------------------------
    const player = Math.max(0, Math.min(100, playerShare || 0));
    const originalTotal = competitors.reduce(
        (sum, c) => sum + (baselines[c.stockId] ?? c.share), 0,
    );
    const pool = originalTotal * ((100 - player) / 100);

    // Ortalama guc: bunun ustundekiler pay kazanir, altindakiler kaybeder.
    const avgStrength =
        competitors.reduce((sum, c) => sum + (c.strength || 50), 0) / competitors.length;

    const moved = competitors.map(c => {
        const base = baselines[c.stockId] ?? c.share;
        // Guc farki: +/- 1 civari bir sayiya normalize edilir.
        const edge = ((c.strength || 50) - avgStrength) / Math.max(1, avgStrength);
        // Gurultu: rakipler de hata yapar, kampanyalari tutar ya da tutmaz.
        const noise = (random() - 0.5) * COMPETITOR_DRIFT;
        let next = c.share * (1 + edge * COMPETITOR_DRIFT + noise);

        // BANT: hicbir rakip sonsuza kadar buyuyemez ve sifira inmez.
        // Bantsiz birakirsak en guclu rakip 40 ceyrekte pazarin tamamini
        // alir ve oyun anlamsizlasir — bileşik buyumenin klasik tuzagi.
        const lo = base * (1 - DRIFT_BAND);
        const hi = base * (1 + DRIFT_BAND);
        next = Math.max(lo, Math.min(hi, next));

        return { stockId: c.stockId, share: next, baselineShare: base };
    });

    // Havuza normalize et: oyuncunun aldigi pay hepsinden ORANTILI cikar.
    const total = moved.reduce((sum, c) => sum + c.share, 0);
    if (total <= 0) return moved;

    return moved.map(c => ({ ...c, share: (c.share / total) * pool }));
};

/**
 * Bir rakibin degerleme carpani.
 *
 * Payi baslangic payinin iki katina cikmissa degeri de kabaca iki katina
 * cikmali. Ama tam dogrusal degil: buyuk sirketlerin degeri paydan baska
 * seylere de bagli (nakit, marka, baska is kollari). Karekok bu yuzden —
 * pay etkisini gercek ama abartisiz tutar.
 *
 * ORNEK: %31'den %20'ye dusen Pear Inc. carpani sqrt(20/31) = 0,80.
 * Yani pazarin ucte birini kaybetmek degerinin bestede birini goturur.
 * Gercek hayatta da olcek buyudukce pay kaybi degeri boyle asindirir.
 */
export const shareValuationMultiplier = (
    currentShare: number,
    baselineShare: number,
): number => {
    const base = Math.max(0.01, baselineShare || 0.01);
    const now = Math.max(0, currentShare || 0);
    const ratio = now / base;
    // Alt sinir: pazardan tamamen silinse bile sirketin varliklari durur.
    return Math.max(0.25, Math.min(3, Math.sqrt(ratio)));
};

/**
 * Oyuncunun bir rakipten aldigi pay, o rakibin degerini ne kadar dusurur.
 * Devralma ekraninda "bunu ucuza kapatmanin yolu once pazarda dovmek"
 * fikrini gorunur kilar.
 */
export const describeShareImpact = (
    currentShare: number,
    baselineShare: number,
): string => {
    const m = shareValuationMultiplier(currentShare, baselineShare);
    if (m >= 1.15) return `Gaining ground — worth ${((m - 1) * 100).toFixed(0)}% more than at launch.`;
    if (m <= 0.85) return `Losing ground — worth ${((1 - m) * 100).toFixed(0)}% less than at launch.`;
    return 'Holding its position.';
};
