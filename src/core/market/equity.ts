// src/core/market/equity.ts
//
// ============================================================================
//  DEĞERLEME VE HİSSE — tek kaynak
// ============================================================================
//
//  NEDEN BU DOSYA VAR: oyunda UC AYRI hisse sistemi vardi ve ucu de
//  birbirinden farkli sayi soyluyordu.
//
//    1) useStatsStore.companyOwnership  -> 65 (sadece yuzde)
//    2) useShareholderStore             -> 10.000.000 hisse, oyuncuda 6.5M
//    3) useEquityStore                  -> 1.000.000 hisse, oyuncuda 1M
//
//  Stock Market ekrani UCUNCUSUNU okuyordu. Oyuncuda 1M/1M = %100
//  gorunuyordu, oysa kurulda dort uye ve %35 pay vardi. Ekranin "hepsi
//  senin" demesinin sebebi buydu.
//
//  Fiyat da 10 kat sapiyordu: biri degerlemeyi 1M hisseye, digeri 10M
//  hisseye boluyordu.
//
//  GUNLUK DEGISIM NEDEN HEP %0 IDI
//  --------------------------------
//  `companyDailyChange` yalnizca `processCompanyMonthlyTick` icinde
//  yaziliyordu ve o fonksiyon HIC CAGRILMIYORDU. Yani alan hicbir zaman
//  guncellenmedi; fiyat degisse bile ekranda %0.00 yaziyordu.
//
//  ARTIK: kap tablosu useShareholderStore'da (10M hisse, kurul uyeleri
//  dahil), degerleme ve fiyat bu dosyadaki saf fonksiyonlarda, sonuclar
//  statsStore'da saklanir. Tek zincir.
//
//  BU DOSYA BANKACILIK VE HISSE SATISININ TEMELI. Buraya yeni bir formul
//  eklemeden once mevcut olani okuyun; ucuncu bir kaynak yaratmayin.
//
// ============================================================================

/** Sirketin toplam hisse sayisi. Kap tablosunun temeli. */
export const TOTAL_SHARES_DEFAULT = 10_000_000;

// ============================================================================
//  DEĞERLEME
// ============================================================================
//  ONCEDEN IKI FORMUL VARDI:
//    motor:      sermaye x 1.5
//    statsStore: aylikCiro x 12 x carpan + sermaye
//  Motor her ceyrek digerinin uzerine yaziyordu, yani ikincisi hic
//  gecerli olmuyordu.
//
//  YENI MODEL — gercek bir degerlemenin uc bacagi:
//    nakit + kazanc carpani + ciro carpani
//
//  Neden ikisi birden (kazanc VE ciro): erken oyunda kar dusuktur ama
//  buyuyen bir ciro degerlidir; gec oyunda kar hakimdir. Tek basina
//  kar carpani kullanirsak zarar eden ama hizli buyuyen sirket sifir
//  degerli cikar, ki bu gercek disi.
//
//  HALKA ACIK OLMAK CARPANI BUYUTUR. Likidite ve gorunurluk primi.
//  Marka da katkida bulunur: taninan sirket daha yuksek carpanla islem
//  gorur.
// ============================================================================

export interface ValuationInput {
    /** Sirket kasasi */
    cash: number;
    /** Son ceyregin hasilati */
    quarterRevenue: number;
    /** Son ceyregin faaliyet kari (EBIT) */
    quarterEbit: number;
    /** Toplam borc — degerlemeden duser */
    debt: number;
    /** Halka acik mi */
    isPublic: boolean;
    /** Marka degeri 0-100 */
    brandValue: number;
}

export interface ValuationBreakdown {
    /** Nakit katkisi */
    cash: number;
    /** Yillik kazanc x kazanc carpani */
    earnings: number;
    /** Yillik ciro x ciro carpani */
    revenue: number;
    /** Borcun negatif katkisi */
    debt: number;
    /** Kullanilan kazanc carpani */
    earningsMultiple: number;
    /** Kullanilan ciro carpani */
    revenueMultiple: number;
    /** Toplam — asla negatif olmaz */
    total: number;
}

/** Ozel sirket kazanc carpani. */
const EARNINGS_MULTIPLE_PRIVATE = 12;
/** Halka acik sirket kazanc carpani — likidite primi. */
const EARNINGS_MULTIPLE_PUBLIC = 22;
/** Ciro carpanlari. */
const REVENUE_MULTIPLE_PRIVATE = 0.8;
const REVENUE_MULTIPLE_PUBLIC = 1.6;
/** Marka 100'de carpanlara eklenen oran. */
const BRAND_MULTIPLE_BONUS = 0.35;

export const companyValuation = (input: ValuationInput): ValuationBreakdown => {
    const brandLift = 1 + (Math.min(100, Math.max(0, input.brandValue || 0)) / 100) * BRAND_MULTIPLE_BONUS;

    const earningsMultiple =
        (input.isPublic ? EARNINGS_MULTIPLE_PUBLIC : EARNINGS_MULTIPLE_PRIVATE) * brandLift;
    const revenueMultiple =
        (input.isPublic ? REVENUE_MULTIPLE_PUBLIC : REVENUE_MULTIPLE_PRIVATE) * brandLift;

    const annualEbit = (input.quarterEbit || 0) * 4;
    const annualRevenue = Math.max(0, input.quarterRevenue || 0) * 4;

    const cash = Math.max(0, input.cash || 0);
    // Zarar eden sirketin kazanc bacagi sifirdir, NEGATIF degil —
    // aksi halde tek kotu ceyrek degerlemeyi sifirin altina itiyor.
    const earnings = Math.max(0, annualEbit) * earningsMultiple;
    const revenue = annualRevenue * revenueMultiple;
    const debt = Math.max(0, input.debt || 0);

    const total = Math.max(0, cash + earnings + revenue - debt);

    return { cash, earnings, revenue, debt, earningsMultiple, revenueMultiple, total };
};

// ============================================================================
//  HİSSE FİYATI
// ============================================================================

/** Hisse basina deger. Tek bolen: toplam hisse sayisi. */
export const sharePrice = (valuation: number, totalShares: number): number => {
    const shares = Math.max(1, totalShares || TOTAL_SHARES_DEFAULT);
    return Math.max(0, valuation) / shares;
};

/**
 * Piyasa duygusu — fiyatin temel degerden sapmasi.
 *
 * Kucuk ve rastgele (±%3). Kasten kucuk: fiyatin ASIL surukleyicisi
 * sirketin performansi olmali, kumar degil. Eskiden degisimin yarisi
 * saf rastgeleydi (±%5 haber faktoru) ve oyuncu neyin neden oldugunu
 * anlayamiyordu.
 */
export const SENTIMENT_RANGE = 0.03;

export const applySentiment = (price: number, random: number = Math.random()): number =>
    price * (1 + (random - 0.5) * 2 * SENTIMENT_RANGE);

/** Iki fiyat arasindaki yuzde degisim. */
export const priceChangePercent = (previous: number, current: number): number => {
    if (!(previous > 0)) return 0;
    return ((current - previous) / previous) * 100;
};

// ============================================================================
//  KAP TABLOSU
// ============================================================================

export interface CapTable {
    totalShares: number;
    playerShares: number;
    /** Halka acik dolasimdaki hisse */
    publicShares: number;
    /** Kurul uyelerinin toplami */
    insiderShares: number;
}

export const ownershipPercent = (shares: number, totalShares: number): number => {
    const total = Math.max(1, totalShares || TOTAL_SHARES_DEFAULT);
    return (Math.max(0, shares) / total) * 100;
};

/** Kontrol esikleri — oyuncunun bilmesi gereken sinirlar. */
export const CONTROL_THRESHOLDS = {
    /** Bunun altinda kurul seni gorevden alabilir */
    majority: 50,
    /** Ana sozlesme degisiklikleri icin gereken nitelikli cogunluk */
    supermajority: 67,
    /** Bunun altina dusmek oyunu kaybetmek demektir */
    minimum: 10,
} as const;

export type ControlStatus = 'control' | 'majority' | 'contested' | 'lost';

export const controlStatus = (playerPercent: number): ControlStatus => {
    if (playerPercent >= CONTROL_THRESHOLDS.supermajority) return 'control';
    if (playerPercent > CONTROL_THRESHOLDS.majority) return 'majority';
    if (playerPercent >= CONTROL_THRESHOLDS.minimum) return 'contested';
    return 'lost';
};

export const CONTROL_NOTES: Record<ControlStatus, string> = {
    control:
        'You hold a supermajority. You can change the charter, and no coalition on the board can stop you.',
    majority:
        'You hold a simple majority. Ordinary decisions are yours, but a charter change needs others to agree.',
    contested:
        'You are below 50%. A coalition of shareholders can outvote you — and can remove you as CEO.',
    lost:
        'You have lost effective control of your own company.',
};

// ============================================================================
//  SEYRELTME VE GERİ ALIM
// ============================================================================

/**
 * Belirli bir tutari toplamak icin kac yeni hisse cikarmak gerekir.
 * Yeni hisseler MEVCUT fiyattan satilir; herkesin payi orantili seyrelir.
 */
export const sharesForRaise = (amount: number, currentSharePrice: number): number => {
    if (!(currentSharePrice > 0)) return 0;
    return Math.floor(Math.max(0, amount) / currentSharePrice);
};

/** Seyreltme sonrasi oyuncunun yeni yuzdesi. */
export const dilutedOwnership = (
    playerShares: number,
    totalShares: number,
    newShares: number,
): number => ownershipPercent(playerShares, totalShares + Math.max(0, newShares));

/**
 * Seyreltme fiyat baskisi.
 *
 * Yeni hisse cikarmak piyasada olumsuz sinyaldir: "nakit sikintisi var"
 * veya "yonetim hisseyi pahali buluyor". Cikarilan oranin katiyla
 * fiyati asagi ceker.
 */
export const DILUTION_PRICE_PRESSURE = 1.4;

/** Geri alim fiyat destegi — arz azalir, sinyal olumludur. */
export const BUYBACK_PRICE_SUPPORT = 1.1;

export const EQUITY_EXPLANATIONS = {
    valuation:
        'Cash on the balance sheet, plus a multiple of annual operating profit, plus a multiple of annual revenue, minus debt. Going public raises both multiples; a strong brand raises them further.',
    sharePrice:
        'Valuation divided by total shares outstanding. Issuing new shares lowers it; buying shares back raises it.',
    ownership:
        'Your shares divided by all shares. Above 50% ordinary decisions are yours. Below it, a coalition can outvote you — and can remove you as CEO.',
    change:
        'The move in share price since last quarter. Most of it comes from what the company actually did; a small band of market sentiment sits on top.',
} as const;
