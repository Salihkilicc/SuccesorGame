import { t } from '../i18n';
// src/core/market/mergers.ts
//
// ============================================================================
//  SATIN ALMA — birleşme ve devralmanın finansal modeli
// ============================================================================
//
//  ONCE NE OLUYORDU
//  ----------------
//  Satin alma tek satirlik bir islemdi: parayi ode, sirket listene eklensin.
//  Hisse fiyatina TEK etkisi kasadan cikan nakitti. Yani:
//
//    - Prim odemenin bir bedeli yoktu (dusmanca devralma "%20 prim"
//      diyordu ama o %20 hicbir yere yansimıyordu)
//    - Satin alinan sirketin KARI senin karina hic girmiyordu
//    - Entegrasyon diye bir sey yoktu; birlesme aninda ve bedava idi
//    - Kotu bir satin almanin cezasi da yoktu
//
//  Yani oyundaki en buyuk stratejik karar, sonucu olmayan bir dugmeydi.
//
//  YENI MODEL — gercek bir devralmanın dort bacagi
//  ------------------------------------------------
//   1) PRIM: piyasa degerinin ustunde odedigin her kurus, ilk gunde
//      yok olan degerdir. Hedefin hissedarlarina hediye ettin.
//      Devralmalarin cogunun deger yakmasinin bir numarali sebebi budur.
//
//   2) ENTEGRASYON MALIYETI: ilk ceyreklerde gider yazilir — tazminat,
//      sistem birlesmesi, danismanlar. Once gelir, sonra fayda.
//
//   3) SINERJI: maliyet ve gelir sinerjileri YAVAS gelir ve genelde
//      vaat edilenden azdir. Tam hizina ulasmasi ~6 ceyrek surer.
//
//   4) HEDEFIN KAZANCI: satin aldigin sey budur. Karli bir sirket
//      aldiysan EBIT'in artar; zarar eden aldiysan azalir. Ilk
//      ceyreklerde bu katki da dusuktur — devralma isi bozar.
//
//  Hepsi EBIT uzerinden gecer, EBIT de kazanc gucune, o da degerlemeye.
//  Yani hisse etkisi CEYREKLERE YAYILIR ve satin aldigin sirketin
//  gercekten kar edip etmedigine baglidir. Ayri bir "hisse etkisi"
//  formulu YOK — mevcut zincirin icinden gecer.
//
//  MBA NOTU: gercek hayatta sorulan ilk soru "accretive mi dilutive mi",
//  yani islem hisse basi kari artiriyor mu azaltiyor mu. Bu dosya o
//  hesabi da uretir ve ekranda gosterilir.
//
// ============================================================================

import { ownershipPercent } from './equity';

/** Bir devralmanin tam kaydi. Kapanistan sonra her ceyrek islenir. */
export interface AcquisitionDeal {
    id: string;
    name: string;
    /** Odenen toplam bedel */
    price: number;
    /** Hedefin islem oncesi piyasa degeri — adil deger kabul edilir */
    fairValue: number;
    /** price - fairValue. Ilk gunde yok olan deger. */
    premium: number;
    /** Hedefin yillik faaliyet kari (tahmin) */
    targetAnnualEbit: number;
    /** Kapanistan bu yana kac ceyrek gecti */
    quartersSinceClose: number;
    /** Bilancoda duran serefiye. Deger dusuklugunde silinir. */
    goodwill: number;
    /** Deger dusuklugu yazildi mi */
    impaired: boolean;
    /** Dusmanca miydi — entegrasyon daha zor gecer */
    hostile: boolean;
    /**
     * How much of the synergy this deal will ever realise, 0-1.
     *
     * Undefined means "whatever the hostile flag implies", which is what every
     * deal did before and still does. It exists so that somebody ELSE can
     * damage a deal after it closes - a rival who wanted the same company and
     * hires its people out from under you. See core/market/ripple.ts.
     *
     * PERMANENT AND NOT A TIMER, deliberately. A siege ends; people who have
     * left do not come back, and the thing you actually bought was them.
     */
    synergyRealization?: number;
}

// ============================================================================
//  HEDEFİN KAZANCINI TAHMİN ET
// ============================================================================
//  Borsa verisinde kar alani yok, sadece piyasa degeri ve risk var.
//  Kazanci risk profilinden turetiyoruz — bu hem gercekci hem de
//  oyuncuya gercek bir tercih sunuyor:
//
//    Dusuk riskli  -> olgun, karli, ucuz carpanli. Hemen EBIT ekler.
//    Yuksek riskli -> buyume sirketi, karsiz. Simdi seyreltir, sonra
//                     belki cok kazandirir.
//
//  Yani "ucuz mu pahali mi" degil, "simdi mi sonra mi" sorusu.
// ============================================================================

/**
 * Borsa verisindeki risk etiketleri. `marketData.ts` ile birebir ayni
 * olmali — ilk yazimda sadece uc tanesi vardi ve 'Extreme' ile
 * 'Medium-High' sessizce 'Medium' muamelesi goruyordu. Yani SafeMoonScam
 * ile Pfizero ayni karliligi veriyordu.
 */
export type TargetRisk =
    | 'Very Low'
    | 'Low'
    | 'Medium'
    | 'Medium-High'
    | 'High'
    | 'Extreme';

/**
 * Piyasa degerinin yuzde kaci yillik faaliyet kari olarak gelir.
 *
 * NEGATIF DEGER MUMKUN — ve olmali. Oyundaki 'Extreme' riskli sirketler
 * zaten SafeMoonScam, PepeFake, HerbalLife Scam gibi seyler. Bunlarin
 * kar etmesi degil, para YAKMASI gerekir. Boylece:
 *   - degerleme, satin aldiktan sonra duser
 *   - 8. ceyrekte serefiye deger dusuklugu tetiklenir
 *   - "ucuz gorunen sirket" gercek bir tuzak olur
 */
export const EARNINGS_YIELD_BY_RISK: Record<TargetRisk, number> = {
    'Very Low': 0.070,     // ~14x — kamu hizmeti gibi, sikici ve karli
    Low: 0.060,            // ~17x — olgun sirket
    Medium: 0.042,         // ~24x
    'Medium-High': 0.025,  // ~40x — buyume hikayesi
    High: 0.012,           // ~83x — neredeyse karsiz
    Extreme: -0.030,       // PARA YAKAR. Deger tuzagi.
};

export const estimateTargetEbit = (marketCap: number, risk: TargetRisk = 'Medium'): number => {
    const yieldRate = EARNINGS_YIELD_BY_RISK[risk] ?? EARNINGS_YIELD_BY_RISK.Medium;
    return Math.max(0, marketCap || 0) * yieldRate;
};

// ============================================================================
//  İŞLEM PARAMETRELERİ
// ============================================================================

/** Dostane devralmada odenen tipik prim. */
export const FRIENDLY_PREMIUM = 0.15;
/**
 * WHAT IT COSTS TO TAKE A COMPANY THAT DOES NOT WANT TO BE TAKEN.
 *
 * TWO AND A HALF TIMES THE MARKET, FLAT, FOR EVERY COMPANY. A premium of 1.5
 * on top of the fair value is the same statement written the way the quote
 * wants it.
 *
 * ---------------------------------------------------------------------------
 *  IT WAS 0.35, THEN IT WAS A CURVE, AND NOW IT IS A PRICE
 * ---------------------------------------------------------------------------
 *  The curve (`hostilePremiumFor`, shelved in negotiation.ts) ran 0.45 to 0.75
 *  on how hard the board resisted, and the argument for it was good: a board
 *  that would fight to the last share should cost more than one that barely
 *  refused you.
 *
 *  What it could not survive is that NOTHING TOLD THE PLAYER. The acquisition
 *  screen printed `valuation * 1.2` beside the hostile button and the engine
 *  charged something else entirely, so the curve was invisible in exactly the
 *  place the player decides. A price nobody can see is not a mechanic, it is
 *  a surprise at the till.
 *
 *  So: one number, stated on the button, charged by the engine. The hostile
 *  route is the route where you do not negotiate and you pay through the nose
 *  for the privilege - and now the nose has a figure on it.
 */
export const HOSTILE_MULTIPLE = 2.5;
export const HOSTILE_PREMIUM = HOSTILE_MULTIPLE - 1;

/** Entegrasyon maliyeti islem bedelinin bu orani kadardir. */
export const INTEGRATION_COST_RATIO = 0.04;
/** Dusmanca devralmada entegrasyon daha pahali: ekip direnir, kilit adamlar gider. */
export const HOSTILE_INTEGRATION_MULTIPLIER = 1.8;
/** Entegrasyon maliyeti kac ceyrege yayilir. */
export const INTEGRATION_QUARTERS = 4;

/**
 * Tam hizda yillik sinerji — HEDEFIN KARININ orani olarak.
 *
 * ONCE ISLEM BEDELININ ORANIYDI (%5) VE BU SISTEMI BOZUYORDU.
 * Oyuncu "devraldigim sirket bana aylik ne gideri oluyor" diye sorunca
 * hesabi cikardim ve su ortaya cikti:
 *
 *   risk          hedefin yillik kari    sinerji    sinerji/kar
 *   Medium               2,10M            2,88M        %137
 *   High                 0,60M            2,88M        %479
 *   Extreme             -1,50M            2,88M       -%192
 *
 *  Yani sinerji hedefin KALITESINDEN tamamen bagimsizdi. Sonucu:
 *
 *   1) Para YAKAN bir sirket (SafeMoonScam, yilda -1,5M) satin alindiginda
 *      +2,9M sinerji aliyordu ve NET KAR ediyordu. "Deger tuzagi" diye
 *      tasarladigim sey aslinda karli bir yatirimdi.
 *
 *   2) Serefiye deger dusuklugu de HIC tetiklenmiyordu: esik
 *      (kar + sinerji) x 8 >= serefiye idi ve sisirilmis sinerji bu
 *      testi her zaman gecirtiyordu. Yani kotu devralmanin cezasi
 *      olan tek mekanik de olu kalmisti.
 *
 * DOGRUSU: sinerji hedefin kendi kar gucunden dogar. Maliyet sinerjisi
 * "onlarin giderlerinden kirptigin kisim"dir; gideri karsilayacak kadar
 * geliri olmayan bir sirkette kirpacak bir sey de yoktur. Kar etmeyen
 * hedefte sinerji SIFIRDIR.
 */
export const SYNERGY_ANNUAL_RATIO = 0.30;
/** Sinerjinin tam hizina ulasmasi kac ceyrek surer. */
export const SYNERGY_RAMP_QUARTERS = 6;
/** Dusmanca devralmada sinerjinin ne kadari gerceklesir. */
/**
 * How much of the synergy a hostile deal actually realises.
 *
 * Raised from 0.60. At 0.60 a hostile bid was strictly dominated: it paid 20
 * points more premium, doubled the integration bill, took a heavier
 * announcement hit AND gave up a third of the synergy for good. Nothing
 * compensated, so the option existed and no one would ever take it.
 *
 * Losing key people in a contested deal is real and should still cost, but a
 * permanent third is too much. At 0.85 the premium and the integration remain
 * the price of going hostile, and payback moves from 4.7 years to about 3.5.
 */
export const HOSTILE_SYNERGY_REALIZATION = 0.85;

/** Hedefin kazancinin ilk ceyrekte ne kadari sana gecer. */
export const EARNINGS_CAPTURE_START = 0.5;
/** Kazanc yakalamanin tam hizina ulasmasi kac ceyrek surer. */
export const EARNINGS_CAPTURE_QUARTERS = 4;

/**
 * DEĞER DÜŞÜKLÜĞÜ (serefiye silme).
 *
 * Hedef bu kadar ceyrek ust uste beklentinin altinda kalirsa serefiye
 * silinir: tek seferlik agir bir EBIT darbesi ve piyasada guven kaybi.
 * Gercek hayatta devralmalarin basarisizligi boyle ilan edilir.
 */
export const IMPAIRMENT_AFTER_QUARTERS = 8;
/** Silinen serefiyenin ne kadari gidere yazilir. */
export const IMPAIRMENT_RATIO = 0.6;

// ============================================================================
//  ÇEYREKLİK ETKİ
// ============================================================================

export interface DealQuarterEffect {
    /** Hedefin bu ceyrek sana gecen faaliyet kari */
    earningsContribution: number;
    /** Bu ceyrek yazilan entegrasyon gideri (negatif etki) */
    integrationCost: number;
    /** Bu ceyrek gerceklesen sinerji */
    synergy: number;
    /** Serefiye deger dusuklugu (varsa, tek seferlik) */
    impairment: number;
    /** Hepsinin toplami — EBIT'e eklenecek net tutar */
    netEbit: number;
    /** Kazanc yakalama orani — ekranda gostermek icin */
    captureRatio: number;
    /** Sinerji rampasinin neresindeyiz */
    synergyRatio: number;
}

/** Bir rampanin belirli ceyrekteki orani (0-1). */
const rampRatio = (quartersSince: number, rampQuarters: number, start: number = 0): number => {
    const t = Math.min(1, Math.max(0, quartersSince / Math.max(1, rampQuarters)));
    return start + (1 - start) * t;
};

export const dealQuarterEffect = (deal: AcquisitionDeal): DealQuarterEffect => {
    const q = Math.max(0, deal.quartersSinceClose);

    // 1) Hedefin kazanci — ilk ceyreklerde yarisi, zamanla tamami.
    //    Devralma isi bozar: ekip dagilir, musteri tedirgin olur.
    const captureRatio = rampRatio(q, EARNINGS_CAPTURE_QUARTERS, EARNINGS_CAPTURE_START);
    const earningsContribution = (deal.targetAnnualEbit / 4) * captureRatio;

    // 2) Entegrasyon maliyeti — ilk ceyreklerde, sonra biter.
    const totalIntegration =
        deal.price * INTEGRATION_COST_RATIO * (deal.hostile ? HOSTILE_INTEGRATION_MULTIPLIER : 1);
    const integrationCost =
        q < INTEGRATION_QUARTERS ? totalIntegration / INTEGRATION_QUARTERS : 0;

    // 3) Sinerji — yavas gelir, dusmanca devralmada eksik gerceklesir.
    const synergyRatio = rampRatio(q, SYNERGY_RAMP_QUARTERS);
    // A raid overrides the hostile default rather than multiplying it: a deal
    // can only be damaged to a level, not repeatedly, so two rivals cannot
    // stack their way to zero.
    const realization = deal.synergyRealization
        ?? (deal.hostile ? HOSTILE_SYNERGY_REALIZATION : 1);
    // TABAN: hedefin KENDI kari. Kar etmeyen sirkette kirpacak gider
    // yoktur — sinerji sifirdir. Once `deal.price` uzerinden hesaplaniyordu
    // ve para yakan bir hedefi bile karli gosteriyordu.
    const synergyBase = Math.max(0, deal.targetAnnualEbit);
    const synergy = ((synergyBase * SYNERGY_ANNUAL_RATIO) / 4) * synergyRatio * realization;

    // 4) Deger dusuklugu — hedef uzun sure kazandirmadiysa serefiye silinir.
    // Hedef, odedigin primi hakli cikaracak kadar kazanmiyorsa serefiye
    // silinir. Sadece "zarar ediyor" degil: yeterince kazanmiyor da yeter.
    const annualSynergyFull =
        Math.max(0, deal.targetAnnualEbit) *
        SYNERGY_ANNUAL_RATIO *
        (deal.hostile ? HOSTILE_SYNERGY_REALIZATION : 1);
    const justifiesGoodwill =
        (deal.targetAnnualEbit + annualSynergyFull) * 8 >= deal.goodwill;
    const shouldImpair = !deal.impaired && q >= IMPAIRMENT_AFTER_QUARTERS && !justifiesGoodwill;
    const impairment = shouldImpair ? deal.goodwill * IMPAIRMENT_RATIO : 0;

    return {
        earningsContribution,
        integrationCost,
        synergy,
        impairment,
        netEbit: earningsContribution - integrationCost + synergy - impairment,
        captureRatio,
        synergyRatio,
    };
};

/** Ceyrek sonunda islemi bir adim ilerlet. */
export const advanceDeal = (deal: AcquisitionDeal, quarters: number = 1): AcquisitionDeal => {
    const effect = dealQuarterEffect(deal);
    return {
        ...deal,
        quartersSinceClose: deal.quartersSinceClose + Math.max(1, quarters),
        impaired: deal.impaired || effect.impairment > 0,
        goodwill: effect.impairment > 0 ? deal.goodwill - effect.impairment : deal.goodwill,
    };
};

// ============================================================================
//  TEKLİF — oyuncuya işlemi imzalamadan önce gösterilir
// ============================================================================

export interface AcquisitionQuote {
    fairValue: number;
    premiumRatio: number;
    premium: number;
    price: number;
    targetAnnualEbit: number;
    goodwill: number;

    /** Ilk yil entegrasyon gideri */
    firstYearIntegration: number;
    /** Tam hizda yillik sinerji */
    annualSynergyAtFullRun: number;

    /**
     * ILK YIL EBIT ETKISI. Pozitifse islem accretive, negatifse dilutive.
     * Gercek hayatta bir devralmaya bakan herkesin sordugu ilk soru.
     */
    firstYearEbitImpact: number;
    /** Tam hizda yillik EBIT etkisi */
    steadyStateEbitImpact: number;
    accretive: boolean;

    /** Islem bedelinin alicinin degerine orani */
    relativeSize: number;
    /** Duyuru aninda hisseye beklenen tepki (yuzde) */
    announcementImpactPercent: number;
    /** Islem bedelinin kac yilda kendini odedigi */
    paybackYears: number;
}

/**
 * DUYURU TEPKISI.
 *
 * Gercek dunyada alicinin hissesi devralma duyurusunda genelde DUSER.
 * Sebep: piyasa primi hemen yazar, sinerjiyi ise gorene kadar inanmaz.
 * Buyuk ve pahali islemler daha sert tepki alir.
 */
/** Duyuru tepkisi bundan daha sert olamaz. */
export const ANNOUNCEMENT_MAX_DROP = 35;

export const announcementImpact = (
    premium: number,
    acquirerValuation: number,
    relativeSize: number,
    hostile: boolean,
): number => {
    if (!(acquirerValuation > 0)) return 0;
    // Primin alicinin degerine orani — dogrudan deger transferi.
    // Kucuk bir islem buyuk bir sirkette hicbir sey yapmaz; buyuk bir
    // islem kucuk bir sirkette her seydir. Oran zaten bunu saglar.
    const premiumDrag = (premium / acquirerValuation) * 100;
    // Buyuk islem = buyuk entegrasyon riski.
    const sizeDrag = relativeSize * 4;
    const hostilePenalty = hostile ? 1.5 : 0;
    // SINIR: kendinden buyuk bir sirketi almak formulu sonsuza goturur.
    // Piyasa bir sirketi tek duyuruda %35'ten fazla indirmez; kalan
    // hasar sonraki ceyreklerde temellerden gelir.
    return -Math.min(ANNOUNCEMENT_MAX_DROP, premiumDrag + sizeDrag + hostilePenalty);
};

export const quoteAcquisition = (
    marketCap: number,
    risk: TargetRisk,
    hostile: boolean,
    acquirerValuation: number,
    /**
     * The premium actually being paid, when the caller knows it.
     *
     * A hostile bid's price now depends on how hard the board resists
     * (`hostilePremiumFor` in negotiation.ts), and a friendly one can carry a
     * premium the target negotiated for. Passed IN rather than computed here
     * because this module must not import the negotiation module - that module
     * imports this one, and the cycle would be real.
     *
     * Omitted, it falls back to the flat rates, so an old caller prices a
     * hostile deal at the shelved 0.35 rather than at the friendly rate. Wrong
     * by a known amount beats wrong by a silent one.
     */
    premiumOverride?: number,
): AcquisitionQuote => {
    const fairValue = Math.max(0, marketCap || 0);
    const premiumRatio = premiumOverride ?? (hostile ? HOSTILE_PREMIUM : FRIENDLY_PREMIUM);
    const price = fairValue * (1 + premiumRatio);
    const premium = price - fairValue;
    const targetAnnualEbit = estimateTargetEbit(fairValue, risk);

    const totalIntegration =
        price * INTEGRATION_COST_RATIO * (hostile ? HOSTILE_INTEGRATION_MULTIPLIER : 1);
    // ------------------------------------------------------------------
    //  SYNERGY COMES FROM THE BUSINESS, NOT FROM WHAT YOU PAID
    // ------------------------------------------------------------------
    //  This quote scaled synergy by `price` while the quarterly engine
    //  (processAcquisitionsQuarter) scales it by targetAnnualEbit. Two
    //  consequences, both bad: the preview never matched what the engine
    //  delivered, and paying a higher premium APPEARED to buy more synergy -
    //  so a hostile bid's 15% realisation penalty was cancelled out by its own
    //  20-point premium and the two came out identical.
    //
    //  Overpaying does not make two businesses fit together better.
    // ------------------------------------------------------------------
    const annualSynergy =
        Math.max(0, targetAnnualEbit) * SYNERGY_ANNUAL_RATIO *
        (hostile ? HOSTILE_SYNERGY_REALIZATION : 1);

    // Ilk yil: kazanc yakalama ortalama ~%75, sinerji ~%29, entegrasyonun
    // tamami. Bu yuzden ilk yil neredeyse her zaman dilutive olur — ki
    // gercek hayatta da oyledir.
    const firstYearEarnings = targetAnnualEbit * 0.75;
    const firstYearSynergy = annualSynergy * 0.29;
    const firstYearEbitImpact = firstYearEarnings + firstYearSynergy - totalIntegration;
    const steadyStateEbitImpact = targetAnnualEbit + annualSynergy;

    const relativeSize = acquirerValuation > 0 ? price / acquirerValuation : 1;

    return {
        fairValue,
        premiumRatio,
        premium,
        price,
        targetAnnualEbit,
        goodwill: premium,
        firstYearIntegration: totalIntegration,
        annualSynergyAtFullRun: annualSynergy,
        firstYearEbitImpact,
        steadyStateEbitImpact,
        accretive: firstYearEbitImpact > 0,
        relativeSize,
        announcementImpactPercent: announcementImpact(premium, acquirerValuation, relativeSize, hostile),
        paybackYears: steadyStateEbitImpact > 0 ? price / steadyStateEbitImpact : Infinity,
    };
};

export const MERGER_EXPLANATIONS = {
    premium:
        'What you pay above the target\'s market value. It is handed to their shareholders on day one and never comes back. This single line is the main reason most acquisitions destroy value.',
    integration:
        'Severance, systems, consultants. It lands in the first four quarters, before any benefit arrives. A hostile deal costs nearly twice as much to integrate — the team resists and key people leave.',
    synergy:
        'Cost and revenue benefits from combining. They arrive slowly, over about six quarters, and a hostile deal only realises about 60% of them.',
    accretion:
        'Whether the deal adds to or subtracts from your operating profit. The first year is almost always dilutive: you pay integration costs up front and collect the benefits later. What matters is where it lands at full run rate.',
    impairment:
        'If the target still is not earning after two years, you write down the goodwill. It is a large one-off hit to profit and a public admission that the deal failed.',
} as const;

// ============================================================================
//  ELDEN ÇIKARMA
// ============================================================================
//  ONCEKI HALI BIR SOMURUYDU: sattiginda ODEDIGIN fiyatin tamamini geri
//  aliyordun. Yani primi bedava geri kazaniyor, hatta dusmanca devralip
//  hemen satarak hic bedel odemeden deneyebiliyordun.
//
//  Gercekte: bir varligi satarken PRIM ALAMAZSIN, ustelik "neden
//  satiyor?" sorusu fiyati asagi ceker. Basarisiz bir devralmadan
//  cikmanin bedeli vardir.
// ============================================================================

/** Elden cikarirken piyasa degerinin bu kadari alinir. */
export const DIVESTITURE_DISCOUNT = 0.15;

export interface DivestitureQuote {
    /** Hedefin bugunku adil degeri (kazanc gucune gore) */
    currentFairValue: number;
    /** Eline gecen net tutar */
    proceeds: number;
    /** Odedigin fiyata gore kar/zarar */
    gainOrLoss: number;
}

export const quoteDivestiture = (deal: AcquisitionDeal): DivestitureQuote => {
    // Bugunku deger: hedefin kendi kazancina gore. Kazandiriyorsa
    // deger korunmus, yakiyorsa erimis olur.
    const impliedValue =
        deal.targetAnnualEbit > 0
            ? deal.targetAnnualEbit * 18
            : deal.fairValue * 0.4;
    const currentFairValue = Math.max(0, impliedValue);
    const proceeds = currentFairValue * (1 - DIVESTITURE_DISCOUNT);
    return { currentFairValue, proceeds, gainOrLoss: proceeds - deal.price };
};

// ============================================================================
//  FİNANSMAN — bedeli neyle ödüyorsun
// ============================================================================
//  Onceki hali yalnizca NAKIT kabul ediyordu. Sonuc: kendinden buyuk bir
//  sirketi asla alamiyordun, cunku kasanda o kadar para olmuyordu.
//
//  Gercek hayatta kucuk sirket buyugu alir — ama nakitle degil:
//
//    BORC   : kaldiracli satin alma. Faiz karini yer, borc degerlemeden
//             duser. Islem tutmazsa borc kalir, sirketi batirir.
//    HISSE  : hedefin ortaklarina KENDI hissenden verirsin. Nakit
//             gerekmez ama SEYRELIRSIN. Kendinden 100 kat buyuk bir
//             sirketi alirsan, birlesmis sirkette senin payin yuzde
//             birin altina duser — "kim kimi aldi" sorusu anlamsizlasir.
//
//  Kullanicinin sordugu agirlik tam olarak burada: 6 milyonluk sirket
//  1 trilyonluk sirketi hisseyle alabilir, ama sonunda sirketin sahibi
//  o olmaz. Bedel, kontrolun kendisidir.
// ============================================================================

export type FinancingMethod = 'cash' | 'debt' | 'stock';

export interface FinancingQuote {
    method: FinancingMethod;
    /** Nakitten cikan */
    cashUsed: number;
    /** Yeni ustlenilen borc */
    debtRaised: number;
    /** Hedefin ortaklarina verilen yeni hisse */
    sharesIssued: number;
    /** Islem sonrasi oyuncunun yuzdesi */
    playerOwnershipAfter: number;
    /** Yillik faiz yuku (borcla alimda) */
    annualInterest: number;
    /** Islem yapilabilir mi */
    feasible: boolean;
    reason?: string;
}

/** Kaldiracli alimda borcun degerlemeye orani bu siniri asamaz. */
export const MAX_LEVERAGE_RATIO = 0.6;

export const quoteFinancing = (
    method: FinancingMethod,
    price: number,
    availableCash: number,
    acquirerValuation: number,
    existingDebt: number,
    currentSharePrice: number,
    totalShares: number,
    playerShares: number,
    interestRate: number,
): FinancingQuote => {
    const base = {
        method,
        cashUsed: 0,
        debtRaised: 0,
        sharesIssued: 0,
        annualInterest: 0,
        playerOwnershipAfter: ownershipPercent(playerShares, totalShares),
        feasible: true,
    };

    if (method === 'cash') {
        if (availableCash < price) {
            return { ...base, feasible: false, reason: t('data.mergers.notEnoughCashTryDebt') };
        }
        return { ...base, cashUsed: price };
    }

    if (method === 'debt') {
        const capacity = acquirerValuation * MAX_LEVERAGE_RATIO - existingDebt;
        if (capacity < price) {
            return {
                ...base,
                feasible: false,
                reason: `Lenders will not go past ${Math.round(MAX_LEVERAGE_RATIO * 100)}% leverage. You can borrow about ${Math.max(0, Math.round(capacity)).toLocaleString()}.`,
            };
        }
        return { ...base, debtRaised: price, annualInterest: price * interestRate };
    }

    // HISSE TAKASI: nakit gerekmez, ama seyrelirsin.
    if (!(currentSharePrice > 0)) {
        return { ...base, feasible: false, reason: t('data.mergers.noSharePriceYetYou') };
    }
    const sharesIssued = Math.ceil(price / currentSharePrice);
    return {
        ...base,
        sharesIssued,
        playerOwnershipAfter: ownershipPercent(playerShares, totalShares + sharesIssued),
    };
};

export const FINANCING_EXPLANATIONS: Record<FinancingMethod, string> = {
    cash: 'Paid from the company treasury. Simple, and it costs you nothing in ownership — but you can only buy what you can afford.',
    debt: 'A leveraged buyout. No dilution and no cash needed up front, but the interest eats your profit every quarter and the debt sits against your valuation. If the deal disappoints, the debt does not.',
    stock: 'You hand the target\'s owners newly issued shares in your company. No cash required, so you can buy something far larger than yourself — but everyone, including you, is diluted. Buy a company a hundred times your size this way and you will own almost none of what results.',
};

// ============================================================================
//  NOT EVERY BOARD WILL SELL
// ============================================================================
//  Friendly offers were accepted unconditionally, and that is what left the
//  hostile route pointless: if the polite path always works, nobody ever pays
//  the premium for the rude one.
//
//  In reality a target's board refuses when it is doing well and does not need
//  you - which is exactly when you most want it. Refusal is decided by the
//  target itself, not by a dice roll the player can re-roll:
//
//    STRENGTH  a strong competitor has less reason to sell
//    SIZE      a target close to your own size is not looking for a rescue
//    RISK      a struggling company takes the offer; a low-risk one does not
//
//  When the board refuses, the acquisition is still possible - hostile. That
//  is what the premium buys: the ability to go over their heads. It also makes
//  the friendly/hostile choice situational instead of always-friendly.
// ============================================================================

/** Above this refusal score the target's board will not agree to be bought. */
export const REFUSAL_THRESHOLD = 0.55;

export interface RefusalCheck {
    refuses: boolean;
    score: number;
    reason: string;
}

/**
 * Will this board entertain a friendly offer?
 *
 * `strength` is the competitor's strength score (0-100) where known; without
 * it, only size and risk decide.
 */
export const boardWillSell = (
    targetMarketCap: number,
    acquirerValuation: number,
    risk: TargetRisk,
    strength?: number,
): RefusalCheck => {
    const relative = Math.min(2, targetMarketCap / Math.max(1, acquirerValuation));

    // A strong operator has less reason to take your money.
    const strengthPart = strength !== undefined
        ? Math.max(0, (strength - 50) / 100)      // 50 -> 0, 100 -> 0.5
        : 0.15;

    // Approaching your own size, they are a peer rather than a target.
    const sizePart = Math.min(0.35, relative * 0.25);

    // The riskier the business, the more willing they are to be rescued.
    const riskPart = risk === 'Low' ? 0.20 : risk === 'Medium' ? 0.05 : -0.15;

    const score = strengthPart + sizePart + riskPart;
    const refuses = score >= REFUSAL_THRESHOLD;

    return {
        refuses,
        score,
        reason: refuses ? t('merger.boardRefuses') : t('merger.boardOpen'),
    };
};
