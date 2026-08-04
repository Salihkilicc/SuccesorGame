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

import { brandValuationMultiplier } from './brand';

export interface ValuationInput {
    /** Sirket kasasi */
    cash: number;
    /**
     * SON DORT CEYREGIN toplam hasilati (TTM).
     *
     * Once "son ceyrek x 4" kullaniliyordu ve sonuc sacmaydi: tek bir
     * ceyrekte kar 350 binden 0'a dusunce hisse %66 eriyordu. Gercek
     * piyasalar son 12 ayi fiyatlar, tek ceyregi degil. TTM ile bir kotu
     * ceyregin etkisi dortte bire iner.
     */
    ttmRevenue: number;
    /**
     * MADDI DURAN VARLIKLAR — tesis kademesine yatirilan + laboratuvar
     * + istiraklerin degeri. Degerlemeye TASFIYE TABANI olarak girer.
     */
    tangibleAssets?: number;
    /**
     * KAZANC GUCU — yumusatilmis TTM EBIT (bkz. updateEarningsPower).
     * Ham TTM degil: piyasa tek bir gurultulu ceyregi tam fiyatlamaz.
     */
    ttmEbit: number;
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
    /** Varliklarin geri kazanilabilir degeri (tasfiye tabani) */
    tangible: number;
    /** Degerlemeyi hangi taban belirledi */
    valuedOn: 'earnings' | 'assets';
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
/**
 * EMEKLIYE AYRILDI — marka carpani artik brand.ts'te.
 * Dogrusal ve zayifti (%35 tavan, dogrusal). Marka etkisi bir esikten
 * sonra devreye girer; o yuzden karesel oldu ve tavan %55'e cikti.
 * Bkz. core/market/brand.ts -> brandValuationMultiplier
 */
const BRAND_MULTIPLE_BONUS_LEGACY = 0.35;
/** Zararin degerlemeye etkisi bu oranda sonumlenir. */
const LOSS_DAMPING = 0.4;
/** Degerleme nakdin bu oraninin altina inemez. */
const VALUATION_CASH_FLOOR = 0.3;

/**
 * Tesis ve laboratuvarin ikinci elde geri gelen orani.
 * Ozel amacli uretim ekipmani parasini etmez — %45 iyimser bile.
 */
export const TANGIBLE_RECOVERY = 0.45;

export const companyValuation = (input: ValuationInput): ValuationBreakdown => {
    // TEK KAYNAK: marka matematiginin tamami brand.ts'te.
    const brandLift = brandValuationMultiplier(input.brandValue || 0);

    const earningsMultiple =
        (input.isPublic ? EARNINGS_MULTIPLE_PUBLIC : EARNINGS_MULTIPLE_PRIVATE) * brandLift;
    const revenueMultiple =
        (input.isPublic ? REVENUE_MULTIPLE_PUBLIC : REVENUE_MULTIPLE_PRIVATE) * brandLift;

    const annualEbit = input.ttmEbit || 0;
    const annualRevenue = Math.max(0, input.ttmRevenue || 0);

    const cash = Math.max(0, input.cash || 0);

    // ZARAR SONUMLEME: zarar eden sirket daha ucuzdur ama degeri sifira
    // inmez — musterisi, markasi ve nakdi durur. Once kazanc bacagi
    // sifira KIRPILIYORDU, bu da kari 1 dolar dusen sirketle 1 milyon
    // dolar zarar eden sirketi ayni fiyata getiriyordu.
    const earnings =
        annualEbit >= 0
            ? annualEbit * earningsMultiple
            : annualEbit * earningsMultiple * LOSS_DAMPING;

    const revenue = annualRevenue * revenueMultiple;
    const debt = Math.max(0, input.debt || 0);

    // ------------------------------------------------------------------
    //  MADDİ DURAN VARLIKLAR — tesis, laboratuvar, iştirakler
    // ------------------------------------------------------------------
    //  Oyuncu hakliydi: "fabrika ladderdaki ve rd fabrikasinin yeri de
    //  net worth'u etkilemeli, cunku sirketimin bir de pasif yatirimlari
    //  vardir gibi."
    //
    //  Degerleme yalnizca NAKIT AKISINA bakiyordu. Bu bir sirket icin
    //  buyuk olcude dogrudur, ama sifira yakin kar eden agir sanayi
    //  sirketi bile fabrikasinin degerinden asagi fiyatlanmaz — kotu
    //  senaryoda tesis satilir. Finansta buna "tasfiye degeri tabani"
    //  denir ve deger yatirimciligin temel fikridir.
    //
    //  Defter degerinin TAMAMINI eklemiyoruz: ikinci elde tesis parasini
    //  etmez. Ayrica bu bir TABAN, bir toplama degil — karli sirkette
    //  kazanc carpani zaten fabrikanin degerinden buyuktur, o yuzden
    //  hicbir etkisi olmaz. Yalnizca zorda olan sirketi korur.
    // ------------------------------------------------------------------
    const tangible = Math.max(0, input.tangibleAssets || 0) * TANGIBLE_RECOVERY;

    // TABAN: nakdin ucte biri. Bu olmadan uzun zarar serisi degerlemeyi
    // sifira indiriyor ve toparlanma imkansizlasiyordu.
    const goingConcern = cash + earnings + revenue - debt;
    // Tasfiye tabani: nakit + varliklarin geri kazanilabilir kismi - borc.
    const liquidation = cash + tangible - debt;

    const total = Math.max(cash * VALUATION_CASH_FLOOR, goingConcern, liquidation);

    return {
        cash, earnings, revenue, debt, tangible,
        earningsMultiple, revenueMultiple, total,
        // Hangi taban belirledi — ekranda aciklamak icin
        valuedOn: total === liquidation && liquidation > goingConcern ? 'assets' : 'earnings',
    };
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
export const SENTIMENT_RANGE = 0.02;

/**
 * FIYAT YUMUSATMA — piyasa yeni bilgiyi ANINDA tam fiyatlamaz.
 *
 * Ozel sirket cok yavas hareket eder: degerleme ancak bir yatirim turunda
 * veya satis goruşmesinde guncellenir, gunluk bir fiyati yoktur.
 *
 * Halka acik sirket hizli fiyatlanir ve ustune duygu bandi biner. Halka
 * acilmanin gercek takasi budur: carpanlar buyur ama her ceyrek yargilanirsin.
 */
export const PRICE_ADJUST_PRIVATE = 0.30;
export const PRICE_ADJUST_PUBLIC = 0.55;

// ----------------------------------------------------------------------------
//  ÖLÇEK SÖNÜMLEMESİ — büyük şirket daha az oynar
// ----------------------------------------------------------------------------
//  Model once OLCEKTEN BAGIMSIZDI: 10 milyon dolarlik sirket de 2 trilyon
//  dolarlik sirket de ayni yuzde oynuyordu. Gercekte kucuk sirket
//  volatildir, dev sirket degildir. Sebepleri gercek:
//
//    - CESITLENME: dev sirketin onlarca urunu ve pazari vardir; birinde
//      kotu bir ceyrek butunu tasimaz
//    - LIKIDITE VE TAKIP: derin emir defteri ve cok sayida analist,
//      yanlis fiyatlamayi hizla duzeltir ve sicramalari yutar
//    - KURUMSAL SAHIPLIK: endeks fonlari ve uzun vadeli fonlar hisseyi
//      tutar; el degistirme hizi duser
//
//  Oyun acisindan da onemli: gec oyunda oyuncu dev bir sirket yonetirken
//  hisse fiyatinin ceyrekte %70 oynamasi hem gercek disi hem sinir bozucu
//  olurdu. Buyudukce oyun sakinlesir, kararlar uzun vadelenir.
//
//  Logaritmik: 10 milyon dolarda tam oynaklik (1.0), 1 trilyonda ucte bir
//  (0.35). Aradaki her buyukluk mertebesi bir kademe sakinlik getirir.
// ----------------------------------------------------------------------------

/** Sonumlemenin baslangic noktasi — bunun altinda tam oynaklik. */
export const VOLATILITY_SCALE_FLOOR = 10_000_000;
/** Sonumlemenin doydugu piyasa degeri. */
export const VOLATILITY_SCALE_CEILING = 1_000_000_000_000;
/** En buyuk sirkette oynakligin ne kadari kalir. */
export const VOLATILITY_MIN_FACTOR = 0.25;

/**
 * Piyasa degerine gore oynaklik carpani. 1.0 = kucuk sirket, tam oynaklik.
 */
export const volatilityDamping = (marketCap: number): number => {
    const cap = Math.max(1, marketCap || 0);
    if (cap <= VOLATILITY_SCALE_FLOOR) return 1;
    const span = Math.log10(VOLATILITY_SCALE_CEILING / VOLATILITY_SCALE_FLOOR);
    const ratio = Math.min(1, Math.log10(cap / VOLATILITY_SCALE_FLOOR) / span);
    return 1 - (1 - VOLATILITY_MIN_FACTOR) * ratio;
};

/**
 * Yeni fiyat: onceki fiyattan adil degere dogru kismi hareket.
 * Hareket hizi hem halka acik olmaya hem de SIRKETIN BUYUKLUGUNE baglidir.
 */
export const smoothPrice = (
    previousPrice: number,
    fairPrice: number,
    isPublic: boolean,
    marketCap: number = 0,
): number => {
    if (!(previousPrice > 0)) return fairPrice;
    const base = isPublic ? PRICE_ADJUST_PUBLIC : PRICE_ADJUST_PRIVATE;
    const speed = base * volatilityDamping(marketCap);
    return previousPrice + (fairPrice - previousPrice) * speed;
};

/**
 * Piyasa duygusu carpani zamanla 1.0'a doner.
 *
 * IPO coskusu (1.5) veya seyreltme paniği (0.7) kalici degildir. Once
 * bu sonumleme YOKTU: halka arzdan sonra fiyat sonsuza kadar %50 sisik
 * kaliyordu.
 */
export const SENTIMENT_DECAY = 0.25;

export const decaySentiment = (multiplier: number): number =>
    multiplier + (1 - multiplier) * SENTIMENT_DECAY;

// ----------------------------------------------------------------------------
//  KAZANÇ GÜCÜ — piyasa gerçekleşeni değil, BEKLENENİ fiyatlar
// ----------------------------------------------------------------------------
//  TTM tek basina yetmedi. Sebep sudur: EBIT iki buyuk sayinin (ciro ve
//  maliyet) FARKIDIR. Ciro %10 oynayinca kar %50 oynayabilir — buna
//  faaliyet kaldiraci denir ve gercektir. Ama gercek piyasalar bu
//  gurultunun tamamini fiyatlamaz; bir ceyregin sapmasini "kalici mi
//  gecici mi" diye tartar ve tahminini KISMEN gunceller.
//
//  Bu yuzden degerleme ham TTM kar yerine yumusatilmis bir "kazanc gucu"
//  kullanir. Sonuc: gurultulu bir ceyrek fiyati az oynatir, ama kalici
//  bir bozulma (ust uste kotu ceyrekler) tam olarak fiyatlanir.
//
//  Oyun acisindan onemi: rastgele dalgalanma cezalandirilmaz, GERCEK
//  performans degisimi cezalandirilir. Oyuncunun kararlari gorunur,
//  gurultu gorunmez.
// ----------------------------------------------------------------------------

/** Kazanc gucu her ceyrek yeni TTM'e bu oranda yaklasir. */
export const EARNINGS_POWER_ADJUST = 0.5;

export const updateEarningsPower = (
    previousPower: number | null | undefined,
    ttmEbit: number,
): number => {
    if (previousPower === null || previousPower === undefined || !isFinite(previousPower)) {
        return ttmEbit;
    }
    return previousPower + (ttmEbit - previousPower) * EARNINGS_POWER_ADJUST;
};

/** Son dort ceyregin toplami. Eksik ceyrek varsa oransal tamamlanir. */
export const trailingTotal = (history: number[]): number => {
    const h = (history || []).slice(-4);
    if (h.length === 0) return 0;
    const sum = h.reduce((a, b) => a + b, 0);
    // Henuz dort ceyrek olmadiysa mevcut ortalamadan yila tamamla.
    return h.length === 4 ? sum : (sum / h.length) * 4;
};

export const applySentiment = (
    price: number,
    random: number = Math.random(),
    marketCap: number = 0,
): number => {
    // Duygu bandi da olcekle daralir: dev sirket haber gurultusuyle
    // %3 oynamaz.
    const range = SENTIMENT_RANGE * volatilityDamping(marketCap);
    return price * (1 + (random - 0.5) * 2 * range);
};

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
    volatility:
        'Big companies move less. As market cap grows, the price reprices more slowly and the sentiment band narrows — diversification, deeper liquidity and institutional holders all absorb shocks that would swing a small company.',
} as const;

// ============================================================================
//  SERMAYE İŞLEMLERİ — gerçek maliyetleriyle
// ============================================================================
//  Bu islemler oncesinde "bedava" idi: komisyon yok, iskonto yok, islem
//  primi yok. Gercek hayatta hicbiri bedava degildir ve bedelleri tam da
//  kararlari ilginc kilan seydir.
// ============================================================================

// --- HALKA ARZ ---------------------------------------------------------------

/**
 * ARACILIK KOMISYONU. Gercek halka arzlarda brut hasilatin %5-7'si
 * bankalara gider. Bu, "halka acilinca degerlemem kadar para gelir"
 * beklentisini kirar.
 */
export const IPO_UNDERWRITING_FEE = 0.07;

/**
 * HALKA ARZ ISKONTOSU.
 *
 * Hisse KASTEN adil degerin altinda fiyatlanir ki talep dolsun ve ilk
 * gun yukselsin. Literaturde "masada birakilan para" denir; ortalama
 * %15 civarindadir. Yani halka acilmak degerlemenin tamamini nakde
 * cevirmez — bu, IPO'yu otomatik bir kazanc olmaktan cikarir.
 */
export const IPO_DISCOUNT = 0.12;

/** Halka arz sonrasi ilk coskudan gelen carpan. Zamanla 1.0'a doner. */
export const IPO_HYPE_MULTIPLIER = 1.35;

/** Halka acilabilmek icin gereken asgari degerleme. */
export const IPO_MIN_VALUATION = 50_000_000;

/** Satilabilecek halka aciklik orani araligi. */
export const IPO_FLOAT_MIN = 0.10;
export const IPO_FLOAT_MAX = 0.35;

export interface IpoQuote {
    /** Cikarilacak yeni hisse sayisi */
    newShares: number;
    /** Iskontolu arz fiyati */
    offerPrice: number;
    /** Iskontosuz adil fiyat — farki oyuncuya gostermek icin */
    fairPrice: number;
    /** Brut hasilat */
    grossProceeds: number;
    /** Aracilik komisyonu */
    underwritingFee: number;
    /** Sirkete kalan */
    netProceeds: number;
    /** Islem sonrasi oyuncunun yuzdesi */
    playerOwnershipAfter: number;
    /** Iskonto yuzunden "masada birakilan" tutar */
    moneyLeftOnTable: number;
}

export const quoteIpo = (
    valuation: number,
    totalShares: number,
    playerShares: number,
    floatRatio: number,
): IpoQuote => {
    const ratio = Math.min(IPO_FLOAT_MAX, Math.max(IPO_FLOAT_MIN, floatRatio));
    const fairPrice = sharePrice(valuation, totalShares);
    const offerPrice = fairPrice * (1 - IPO_DISCOUNT);

    // Halka arzda YENI hisse cikarilir; mevcut ortaklarin adedi degismez
    // ama toplam artar, yani herkes orantili seyrelir.
    const newShares = Math.floor((totalShares * ratio) / (1 - ratio));
    const grossProceeds = newShares * offerPrice;
    const underwritingFee = grossProceeds * IPO_UNDERWRITING_FEE;

    return {
        newShares,
        offerPrice,
        fairPrice,
        grossProceeds,
        underwritingFee,
        netProceeds: grossProceeds - underwritingFee,
        playerOwnershipAfter: ownershipPercent(playerShares, totalShares + newShares),
        moneyLeftOnTable: newShares * (fairPrice - offerPrice),
    };
};

// --- İKİNCİL HALKA ARZ (SEYRELTME) -------------------------------------------

/** Ikincil arzlarda hisse piyasa fiyatinin altinda satilir. */
export const SECONDARY_DISCOUNT = 0.08;
/** Ikincil arz komisyonu — IPO'dan ucuz, is daha kolay. */
export const SECONDARY_FEE = 0.04;

export interface SecondaryQuote {
    newShares: number;
    offerPrice: number;
    grossProceeds: number;
    fee: number;
    netProceeds: number;
    playerOwnershipAfter: number;
    /** Yeni hisse cikarmanin fiyata baskisi (yuzde) */
    priceImpactPercent: number;
}

export const quoteSecondary = (
    currentPrice: number,
    totalShares: number,
    playerShares: number,
    dilutionRatio: number,
): SecondaryQuote => {
    const ratio = Math.min(0.5, Math.max(0, dilutionRatio));
    const offerPrice = currentPrice * (1 - SECONDARY_DISCOUNT);
    const newShares = Math.floor((totalShares * ratio) / (1 - ratio));
    const grossProceeds = newShares * offerPrice;
    const fee = grossProceeds * SECONDARY_FEE;

    return {
        newShares,
        offerPrice,
        grossProceeds,
        fee,
        netProceeds: grossProceeds - fee,
        playerOwnershipAfter: ownershipPercent(playerShares, totalShares + newShares),
        priceImpactPercent: -ratio * DILUTION_PRICE_PRESSURE * 100,
    };
};

// --- GERİ ALIM ---------------------------------------------------------------

/**
 * ISLEM PRIMI.
 *
 * Buyuk bir blok satin almak fiyati SANA KARSI yukseltir; ortalama
 * gerceklesme fiyatin ilandan onceki fiyattan yuksek olur. Dolasimin
 * ne kadarini aldigina bagli.
 */
export const BUYBACK_EXECUTION_PREMIUM = 0.5;

export interface BuybackQuote {
    /** Geri alinabilecek hisse */
    shares: number;
    /** Ortalama gerceklesme fiyati (prim dahil) */
    averagePrice: number;
    /** Toplam maliyet */
    totalCost: number;
    /** Islem sonrasi oyuncunun yuzdesi */
    playerOwnershipAfter: number;
    /** Dolasimin ne kadari alindi */
    floatConsumed: number;
    /** Prim yuzdesi */
    premiumPercent: number;
}

export const quoteBuyback = (
    budget: number,
    currentPrice: number,
    totalShares: number,
    playerShares: number,
    publicShares: number,
): BuybackQuote => {
    if (!(currentPrice > 0) || publicShares <= 0 || budget <= 0) {
        return {
            shares: 0, averagePrice: currentPrice, totalCost: 0,
            playerOwnershipAfter: ownershipPercent(playerShares, totalShares),
            floatConsumed: 0, premiumPercent: 0,
        };
    }

    // Iteratif degil, kapali form yaklasimi: once prim tahmini, sonra adet.
    const naive = budget / currentPrice;
    const consumedGuess = Math.min(1, naive / publicShares);
    const premium = consumedGuess * BUYBACK_EXECUTION_PREMIUM;
    const averagePrice = currentPrice * (1 + premium);

    const shares = Math.min(publicShares, Math.floor(budget / averagePrice));
    const totalCost = shares * averagePrice;

    return {
        shares,
        averagePrice,
        totalCost,
        playerOwnershipAfter: ownershipPercent(playerShares, totalShares - shares),
        floatConsumed: shares / publicShares,
        premiumPercent: premium * 100,
    };
};

// --- TEMETTÜ -----------------------------------------------------------------

/**
 * Temettu artik NAKDIN yuzdesi degil, KARIN yuzdesi (dagitim orani).
 *
 * Onceki hali "sermayenin %10'unu dagit" idi. O bir temettu degil, kismi
 * tasfiyedir. Gercek sirketler kardan dagitir; dagitim orani sirketin
 * olgunluk isaretidir. Zarardayken dagitmak ise ciddi bir uyari sinyalidir.
 */
export const DIVIDEND_PAYOUT_MAX = 1.0;

export interface DividendQuote {
    /** Dagitilacak toplam tutar */
    total: number;
    /** Hisse basina */
    perShare: number;
    /** Oyuncunun cebine giren */
    playerCut: number;
    /** Yillik getiri: (hisse basi x 4) / fiyat */
    annualYieldPercent: number;
    /** Nakit yetiyor mu */
    affordable: boolean;
    /** Kar yokken dagitiliyor mu — kirmizi bayrak */
    fundedFromReserves: boolean;
}

export const quoteDividend = (
    payoutRatio: number,
    lastQuarterProfit: number,
    cash: number,
    totalShares: number,
    playerShares: number,
    currentPrice: number,
): DividendQuote => {
    const ratio = Math.min(DIVIDEND_PAYOUT_MAX, Math.max(0, payoutRatio));
    const total = Math.max(0, lastQuarterProfit) * ratio;
    const perShare = totalShares > 0 ? total / totalShares : 0;

    return {
        total,
        perShare,
        playerCut: perShare * playerShares,
        annualYieldPercent: currentPrice > 0 ? ((perShare * 4) / currentPrice) * 100 : 0,
        affordable: total <= cash,
        fundedFromReserves: lastQuarterProfit <= 0,
    };
};

/** Temettu odemesi piyasada olumlu karsilanir — istikrar sinyali. */
export const DIVIDEND_SENTIMENT_BOOST = 0.04;


// ============================================================================
//  KURUCUNUN KENDİ HİSSESİNİ SATMASI (secondary sale)
// ============================================================================
//
//  Oyuncu hakliydi: "issue shares var, para sirkete gidiyor ama benim
//  hissem azaliyor, bu sacma — ikisinden biri olsun."
//
//  Aslinda BUNLAR IKI FARKLI ISLEM ve ekranda tek dugmede birlesmisti:
//
//    BIRINCIL (dilution)  -> YENI hisse basilir, para SIRKETE girer.
//                            Senin payin duser cunku pasta buyudu.
//                            Sirket buyume icin para toplar.
//
//    IKINCIL (secondary)  -> SENIN hissen el degistirir, para SANA gider.
//                            Yeni hisse YOK, toplam degismez.
//                            Sirkete tek kurus girmez.
//
//  Ikisi de gercek ve ikisi de gerekli. Tek dugmede birlestirmek
//  oyuncunun hangi parayi kime verdigini anlamasini imkansiz kiliyordu.
//
//  IKINCIL SATISTA VERGI VAR: sermaye kazanci vergilendirilir. Sirket
//  vergisinden ayridir cunku bu SENIN gelirin.
// ============================================================================

/** Sermaye kazanci vergisi — kurucunun kendi hisse satisindan. */
export const CAPITAL_GAINS_TAX = 0.20;

/**
 * Temettu vergisi. Sirket zaten kurumlar vergisi odedi; temettuyu alan
 * kisi bir kez daha oder. Finansta "cifte vergilendirme" denir ve
 * sirketlerin neden temettu yerine hisse geri alimi tercih ettiginin
 * bir numarali sebebidir — geri alimda vergi ertelenir.
 */
export const DIVIDEND_TAX = 0.15;

/**
 * Blok satis iskontosu.
 * Buyuk bir paketi bir anda satmak fiyati kirar; alici likidite
 * riskini fiyatlar. Ne kadar buyuk satarsan o kadar ucuza gider.
 */
export const blockDiscount = (percentOfCompany: number): number =>
    Math.min(0.25, Math.max(0, percentOfCompany) * 0.012);

export interface FounderSaleQuote {
    sharesSold: number;
    /** Blok iskontosu sonrasi birim fiyat */
    pricePerShare: number;
    grossProceeds: number;
    tax: number;
    /** Kucugune gecen NET tutar */
    netToFounder: number;
    discountPercent: number;
    newOwnershipPercent: number;
}

export const quoteSecondarySale = (
    sharesToSell: number,
    marketPrice: number,
    playerShares: number,
    totalShares: number,
): FounderSaleQuote => {
    const shares = Math.max(0, Math.min(sharesToSell || 0, playerShares));
    const percentOfCompany = totalShares > 0 ? (shares / totalShares) * 100 : 0;
    const discount = blockDiscount(percentOfCompany);
    const pricePerShare = Math.max(0, marketPrice) * (1 - discount);
    const gross = shares * pricePerShare;
    const tax = gross * CAPITAL_GAINS_TAX;

    return {
        sharesSold: shares,
        pricePerShare,
        grossProceeds: gross,
        tax,
        netToFounder: gross - tax,
        discountPercent: discount * 100,
        newOwnershipPercent:
            totalShares > 0 ? ((playerShares - shares) / totalShares) * 100 : 0,
    };
};
