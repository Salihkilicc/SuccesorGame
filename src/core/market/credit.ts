import { t } from '../i18n';
// src/core/market/credit.ts
//
// ============================================================================
//  BORÇLANMA — kredi notu, faiz, amortisman, sözleşme ve temerrüt
// ============================================================================
//
//  ONCE NE VARDI (dordu de kirikti)
//  ---------------------------------
//  1) KREDI HIC KAPANMIYORDU. `payMonthlyInterests` parayi aliyor ama
//     `loan.remaining` ve `totalDebt` degerlerini AZALTMIYORDU. Yani
//     sonsuza kadar odersin, borc yerinde durur.
//
//  2) KREDI SKORU OLCEKTE ANLAMSIZDI. Formul `600 + degerleme/1M x 5`
//     idi; yaklasik 50 milyon dolar degerlemenin ustundeki HER sirket
//     850 puan ve %3 faiz aliyordu. Yani skor erken oyundan sonra olu
//     bir sayiydi ve buyumek otomatik olarak ucuz para getiriyordu.
//
//  3) IKI AYRI BORC SAYISI vardi: `statsStore.companyDebtTotal` ve
//     `financeStore.totalDebt`, birbirinden habersiz.
//
//  4) VADE VE TEMERRUT YOKTU. Kredi hic dolmuyordu, odeyememenin bir
//     sonucu yoktu — yani borc risksiz paraydi.
//
//  KAVRAMSAL DUZELTME
//  ------------------
//  En buyuk hata 300-850 arasi bir TUKETICI kredi skoru kullanmakti.
//  Bu bir sirket. Sirketler HARF NOTU alir ve not degerlemeden degil
//  NAKIT AKISINDAN gelir. Bankalarin gercekten baktigi iki oran:
//
//      Kaldirac        = Borc / EBITDA     "kac yillik karinla kapatirsin"
//      Faiz karsilama  = EBIT / Faiz       "karin faizi kac kez karsiliyor"
//
//  Bu, olcekten BAGIMSIZ calisir: 10 milyonluk sirket de 35 milyarlik
//  sirket de ayni oranlarla yargilanir. Buyumek ucuz para getirmez —
//  KARLILIK getirir. Oyun acisindan da dogru olan bu.
//
//  DENGE NOTU: 4x kaldiracta ve BB notunda (%9) faiz karsilamasi ~2.8x
//  cikiyor. Sozlesme esigi 2.0x, yani 4x kaldiracla oynayan bir oyuncuyu
//  tek bir kotu ceyrek ihlale sokar. Kaldirac bilerek bicak sirtidir.
//
// ============================================================================

// ============================================================================
//  NOT
// ============================================================================

export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';

export interface RatingTier {
    rating: CreditRating;
    /** Borc / EBITDA bu degerin ALTINDA olmali */
    maxLeverage: number;
    /** EBIT / Faiz bu degerin USTUNDE olmali */
    minCoverage: number;
    /** Yillik faiz orani */
    rate: number;
    /** Oyuncuya tek cumlelik anlami */
    meaning: string;
}

/**
 * Not merdiveni. Bir nota hak kazanmak icin HER IKI orani da tutturmak
 * gerekir — gercek derecelendirme de boyle calisir, en zayif halka
 * notu belirler.
 */
export const RATING_TIERS: RatingTier[] = [
    { rating: 'AAA', maxLeverage: 1.0, minCoverage: 12, rate: 0.035, get meaning() { return t('data.credit.pristineLendersCompeteForYou'); } },
    { rating: 'AA', maxLeverage: 1.5, minCoverage: 8, rate: 0.042, get meaning() { return t('data.credit.veryStrongDebtIsCheap'); } },
    { rating: 'A', maxLeverage: 2.0, minCoverage: 6, rate: 0.050, get meaning() { return t('data.credit.solidInvestmentGrade'); } },
    { rating: 'BBB', maxLeverage: 3.0, minCoverage: 4, rate: 0.065, get meaning() { return t('data.credit.lowestInvestmentGradeOneBad'); } },
    { rating: 'BB', maxLeverage: 4.0, minCoverage: 2.5, rate: 0.090, get meaning() { return t('data.credit.junkLendersAreWatchingEvery'); } },
    { rating: 'B', maxLeverage: 5.0, minCoverage: 1.5, rate: 0.130, get meaning() { return t('data.credit.deepJunkRefinancingIsA'); } },
    { rating: 'CCC', maxLeverage: Infinity, minCoverage: 0, rate: 0.190, get meaning() { return t('data.credit.distressedOnlyOpportunistsWillLend'); } },
];

export interface CreditAssessment {
    rating: CreditRating;
    /** Borc / yillik EBITDA */
    leverage: number;
    /** EBIT / yillik faiz */
    coverage: number;
    /** Yillik faiz orani */
    rate: number;
    /** Bu notta alinabilecek azami toplam borc */
    debtCapacity: number;
    /** Kalan borclanma alani */
    headroom: number;
    meaning: string;
    /** Sozlesme ihlali var mi */
    inBreach: boolean;
}

/** Borc alinabilecek azami kaldirac — en riskli notta bile. */
export const HARD_LEVERAGE_CAP = 6.0;

/**
 * SOZLESME ESIKLERI (covenant).
 *
 * Gercek kredi sozlesmelerinde bunlar yazilidir ve ihlal edilirse banka
 * once faizi yukseltir, sonra yeni kredi vermez, sonra erken geri odeme
 * ister. Gercek CEO'lari gece uyutmayan sey budur.
 */
export const COVENANT_MAX_LEVERAGE = 4.0;
export const COVENANT_MIN_COVERAGE = 2.0;

export const assessCredit = (
    totalDebt: number,
    annualEbitda: number,
    annualEbit: number,
    annualInterest: number,
): CreditAssessment => {
    const debt = Math.max(0, totalDebt || 0);
    const ebitda = Math.max(0, annualEbitda || 0);
    const ebit = annualEbit || 0;
    const interest = Math.max(0, annualInterest || 0);

    // Karsiz sirketin kaldiraci sonsuzdur — o da CCC demektir.
    const leverage = ebitda > 0 ? debt / ebitda : (debt > 0 ? Infinity : 0);
    // Borcu olmayanin karsilamasi sonsuz.
    const coverage = interest > 0 ? ebit / interest : (ebit >= 0 ? Infinity : 0);

    // EN ZAYIF HALKA belirler: iki orani da tutturamadigin ilk basamakta
    // durursun.
    const tier =
        RATING_TIERS.find(t => leverage < t.maxLeverage && coverage > t.minCoverage) ??
        RATING_TIERS[RATING_TIERS.length - 1];

    // Kapasite: notun izin verdigi kaldirac, mutlak tavanla sinirli.
    const allowedLeverage = Math.min(HARD_LEVERAGE_CAP, tier.maxLeverage);
    const debtCapacity = ebitda * allowedLeverage;

    return {
        rating: tier.rating,
        leverage,
        coverage,
        rate: tier.rate,
        debtCapacity,
        headroom: Math.max(0, debtCapacity - debt),
        meaning: tier.meaning,
        inBreach: leverage > COVENANT_MAX_LEVERAGE || coverage < COVENANT_MIN_COVERAGE,
    };
};

// ============================================================================
//  KREDİ TÜRLERİ
// ============================================================================
//  Once uc tur vardi ama aralarinda gercek bir fark yoktu — hepsi ayni
//  sekilde davraniyordu. Artik her birinin kendi takasi var.
// ============================================================================

export type LoanKind =
    | 'revolver'
    | 'term'
    | 'bond'
    | 'shark'
    /** Varlik teminatli — kazanctan BAGIMSIZ kapasite, ama haciz riski */
    | 'secured'
    /** Ara kat: odeyemezsen hisseye doner ve alacakli kurula girer */
    | 'mezzanine';

export interface LoanProduct {
    kind: LoanKind;
    name: string;
    /** Notun uzerine eklenen fark */
    spread: number;
    /** Vade (ceyrek). 0 = vadesiz (revolving) */
    termQuarters: number;
    /** Erken kapatma cezasi (kalan anaparanin orani) */
    prepaymentPenalty: number;
    description: string;
    /** Alinabilmesi icin gereken en dusuk not */
    minRating?: CreditRating;
    /** Halka acik olma sarti */
    requiresPublic?: boolean;
    /** Sabit oran — nota bakmaz (tefeci) */
    fixedRate?: number;
}

export const LOAN_PRODUCTS: LoanProduct[] = [
    {
        kind: 'revolver',
        get name() { return t('data.credit.revolvingCredit'); },
        spread: 0.02,
        termQuarters: 0,
        prepaymentPenalty: 0,
        get description() { return t('data.credit.drawAndRepayWheneverYou'); },
    },
    {
        kind: 'term',
        get name() { return t('data.credit.termLoan'); },
        spread: 0,
        termQuarters: 20,
        prepaymentPenalty: 0.02,
        get description() { return t('data.credit.fiveYearsFixedScheduleYour'); },
    },
    {
        kind: 'bond',
        get name() { return t('data.credit.corporateBond'); },
        spread: -0.01,
        termQuarters: 40,
        prepaymentPenalty: 0.05,
        get description() { return t('data.credit.tenYearsAtTheFinest'); },
        minRating: 'BBB',
        requiresPublic: true,
    },
    {
        kind: 'shark',
        get name() { return t('data.credit.privateCredit'); },
        spread: 0,
        fixedRate: 0.35,
        termQuarters: 8,
        prepaymentPenalty: 0.10,
        get description() { return t('data.credit.moneyTodayNoQuestionsNo'); },
    },
];

export const RATING_ORDER: CreditRating[] = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];

export const ratingAtLeast = (rating: CreditRating, minimum: CreditRating): boolean =>
    RATING_ORDER.indexOf(rating) <= RATING_ORDER.indexOf(minimum);

export const productRate = (product: LoanProduct, assessment: CreditAssessment): number =>
    product.fixedRate ?? Math.max(0.02, assessment.rate + product.spread);

// ============================================================================
//  AMORTİSMAN
// ============================================================================
//  ONCE HIC YOKTU: odeme aliniyor, bakiye azalmiyordu. Artik her ceyrek
//  odeme FAIZ ve ANAPARA olarak ayrisir ve borc gercekten kapanir.
// ============================================================================

export interface LoanRecord {
    id: string;
    kind: LoanKind;
    name: string;
    /** Ilk anapara */
    principal: number;
    /** Kalan bakiye */
    balance: number;
    /** Yillik faiz orani (alindigi andaki not) */
    rate: number;
    /** Kalan vade (ceyrek). 0 = vadesiz */
    quartersRemaining: number;
    /** Toplam vade */
    termQuarters: number;
    prepaymentPenalty: number;
    /** Temerrude dustu mu */
    delinquent: boolean;
}

export interface LoanPeriodResult {
    interest: number;
    principalPaid: number;
    totalPayment: number;
    closed: boolean;
    loan: LoanRecord;
}

/**
 * Bir kredinin bir ceyregini isler.
 *
 * Vadesiz (revolving) kredide yalnizca faiz odenir, anapara durur —
 * gercek bir kredi limitinde de oyledir. Vadeli kredide esit taksitle
 * anapara da erir.
 */
export const serviceLoanQuarter = (loan: LoanRecord): LoanPeriodResult => {
    const quarterlyRate = loan.rate / 4;
    const interest = loan.balance * quarterlyRate;

    if (loan.termQuarters === 0) {
        // Revolving: sadece faiz.
        return {
            interest,
            principalPaid: 0,
            totalPayment: interest,
            closed: false,
            loan: { ...loan },
        };
    }

    const n = Math.max(1, loan.quartersRemaining);
    // Esit taksit (annuite). Faiz sifirsa duz bolme.
    const payment =
        quarterlyRate > 0
            ? (loan.balance * quarterlyRate) / (1 - Math.pow(1 + quarterlyRate, -n))
            : loan.balance / n;

    const principalPaid = Math.min(loan.balance, payment - interest);
    const balance = Math.max(0, loan.balance - principalPaid);
    const quartersRemaining = Math.max(0, loan.quartersRemaining - 1);
    const closed = balance <= 0.01 || quartersRemaining === 0;

    return {
        interest,
        principalPaid,
        totalPayment: interest + principalPaid,
        closed,
        loan: { ...loan, balance: closed ? 0 : balance, quartersRemaining },
    };
};

// ============================================================================
//  SÖZLEŞME İHLALİ VE TEMERRÜT — kademeli baskı
// ============================================================================
//  Oyun bitmez, ama agir yara alirsin. Her kademe bir oncekinin uzerine
//  biner ve cikis yolu her zaman aynidir: karini toparla ya da borcunu
//  azalt.
// ============================================================================

export type DistressStage = 'healthy' | 'watch' | 'breach' | 'restricted' | 'forced';

export interface DistressState {
    stage: DistressStage;
    /** Ust uste kac ceyrektir ihlalde */
    quartersInBreach: number;
    /** Nota eklenen ceza faizi */
    penaltyRate: number;
    /** Yeni kredi alabilir mi */
    canBorrow: boolean;
    /** Varlik satmaya zorlaniyor mu */
    mustSellAssets: boolean;
    message: string;
}

/** Ihlalde gecen her ceyrek faize eklenen ceza. */
export const PENALTY_RATE_PER_QUARTER = 0.02;
export const PENALTY_RATE_MAX = 0.10;

export const assessDistress = (
    assessment: CreditAssessment,
    quartersInBreach: number,
): DistressState => {
    // Ihlal yoksa sayac sifirlanir.
    if (!assessment.inBreach) {
        const nearBreach =
            assessment.leverage > COVENANT_MAX_LEVERAGE * 0.8 ||
            assessment.coverage < COVENANT_MIN_COVERAGE * 1.3;
        return {
            stage: nearBreach ? 'watch' : 'healthy',
            quartersInBreach: 0,
            penaltyRate: 0,
            canBorrow: true,
            mustSellAssets: false,
            message: nearBreach
                ? 'You are close to your covenants. One weak quarter and the terms change.'
                : 'Your lenders are comfortable.',
        };
    }

    const q = quartersInBreach + 1;
    const penaltyRate = Math.min(PENALTY_RATE_MAX, q * PENALTY_RATE_PER_QUARTER);

    if (q === 1) {
        return {
            stage: 'breach',
            quartersInBreach: q,
            penaltyRate,
            canBorrow: true,
            mustSellAssets: false,
            get message() { return t('data.credit.covenantBreachedYourLendersHave'); },
        };
    }
    if (q <= 3) {
        return {
            stage: 'restricted',
            quartersInBreach: q,
            penaltyRate,
            canBorrow: false,
            mustSellAssets: false,
            get message() { return t('data.credit.stillInBreachNoNew'); },
        };
    }
    return {
        stage: 'forced',
        quartersInBreach: q,
        penaltyRate,
        canBorrow: false,
        mustSellAssets: true,
        get message() { return t('data.credit.aYearInBreachYour'); },
    };
};

// ============================================================================
//  BORÇLANMA KAPASİTESİ RETOOLINGDE DÜŞER
// ============================================================================
//  Bankalar EBITDA'ya gore borc verir. Fabrika yukseltmesi sirasinda
//  kapasite %65-90'a duser, EBITDA da onunla birlikte duser — yani
//  BORCLANMA KAPASITEN DE DUSER.
//
//  Sonuc: limitine yakin borclanmisken insaata baslarsan, insaatin
//  ortasinda bankan "kapasiteni astin" der ve erken geri odeme ister.
//  Hem de tam uretimin dustugu ceyrekte.
//
//  Bu, oyunun en iyi bankacilik karari: "bu insaata ne kadar kaldiracla
//  girebilirim?" Cevabi duruma gore degisir ve iki sistemi birbirine
//  baglar. Gercek bir CFO'nun tam olarak hesapladigi sey.
// ============================================================================

export interface CapacityBreach {
    /** Kapasiteyi ne kadar astin */
    excess: number;
    /** Bankanin bu ceyrek istedigi asgari geri odeme */
    demandedRepayment: number;
    message: string;
}

/** Kapasite asimi bu oranda geri odenmesi istenir. */
export const FORCED_REPAYMENT_RATIO = 0.35;

export const checkCapacityBreach = (
    totalDebt: number,
    assessment: CreditAssessment,
    isRetooling: boolean,
): CapacityBreach | null => {
    const excess = totalDebt - assessment.debtCapacity;
    if (excess <= 0) return null;

    return {
        excess,
        demandedRepayment: excess * FORCED_REPAYMENT_RATIO,
        message: isRetooling
            ? 'Your build has cut EBITDA, and with it your borrowing base. The banks want part of the loan back — while you are producing less.'
            : 'Your debt is above what your earnings support. The banks are calling part of it in.',
    };
};

// ============================================================================
//  KURUMLAR VERGİSİ VE BORÇ KALKANI
// ============================================================================
//  Faiz vergiden DUSER, temettu dusmez. Borcun ozkaynaktan gercekten
//  ucuz olmasinin sebebi budur — finansta "borc vergi kalkani" denir.
//
//  Oyunda vergi yoktu; o yuzden borc yalnizca risk tasiyordu, avantaji
//  yoktu. Simdi tam bir sermaye yapisi karari haline geliyor: borc
//  vergiyi dusurur ama iflas riskini artirir.
//
//  ZARAR MAHSUBU: zarar eden ceyrekte vergi yok, ve zarar ileriye
//  tasinir — sonraki karli ceyreklerde matrahtan dusulur. Gercek vergi
//  sistemleri de boyle calisir, ve bu, zor bir donemden cikan sirkete
//  nefes aldirir.
// ============================================================================

/** Kurumlar vergisi orani. */
export const CORPORATE_TAX_RATE = 0.21;

export interface TaxResult {
    /** Vergi oncesi kar (EBIT - faiz) */
    pretaxProfit: number;
    /** Bu ceyrek kullanilan gecmis zarar */
    lossOffsetUsed: number;
    /** Vergiye tabi matrah */
    taxableIncome: number;
    /** Odenen vergi */
    tax: number;
    /** Vergi sonrasi kar */
    netProfit: number;
    /** Ileriye tasinan yeni zarar bakiyesi */
    lossCarryforward: number;
    /** Faizin vergiden dusmesiyle kazanilan tutar */
    taxShield: number;
}

export const applyTax = (
    ebit: number,
    interestExpense: number,
    previousLossCarryforward: number,
): TaxResult => {
    const pretaxProfit = ebit - Math.max(0, interestExpense);
    const carried = Math.max(0, previousLossCarryforward || 0);

    if (pretaxProfit <= 0) {
        // Zarar: vergi yok, zarar ileriye tasinir.
        return {
            pretaxProfit,
            lossOffsetUsed: 0,
            taxableIncome: 0,
            tax: 0,
            netProfit: pretaxProfit,
            lossCarryforward: carried + Math.abs(pretaxProfit),
            taxShield: 0,
        };
    }

    const lossOffsetUsed = Math.min(carried, pretaxProfit);
    const taxableIncome = pretaxProfit - lossOffsetUsed;
    const tax = taxableIncome * CORPORATE_TAX_RATE;

    return {
        pretaxProfit,
        lossOffsetUsed,
        taxableIncome,
        tax,
        netProfit: pretaxProfit - tax,
        lossCarryforward: carried - lossOffsetUsed,
        // Faiz olmasaydi bu kadar fazla vergi oderdik.
        taxShield: Math.max(0, interestExpense) * CORPORATE_TAX_RATE,
    };
};

export const CREDIT_EXPLANATIONS = {
    rating:
        'Your credit rating comes from two ratios, not from how big you are. Leverage is debt against a year of operating cash flow; coverage is operating profit against the interest you owe. Growing does not make debt cheaper — earning does.',
    leverage:
        'Debt divided by annual EBITDA. Roughly: how many years of operating cash flow it would take to repay everything. Under 2× is comfortable, over 4× breaks your covenants.',
    coverage:
        'Operating profit divided by annual interest. How many times over your earnings cover what you owe the bank. Below 2× and the lenders change the terms.',
    covenant:
        'The promises written into your loan agreements. Break them and the bank raises your rate, then stops lending, then forces you to sell things. This is what keeps real CEOs awake.',
    taxShield:
        'Interest is deductible, so borrowing lowers your tax bill. That is what makes debt genuinely cheaper than equity — up to the point where the risk of not being able to pay outweighs the saving.',
} as const;

// ============================================================================
//  FİNANSMAN HAMLELERİNİN HİSSEYE SİNYAL ETKİSİ
// ============================================================================
//  Borc, kendi basina hisseyi dusurmez. Degerleme zaten borcu duser ve
//  faiz zaten kari azaltir — o mekanik kisim isliyor. Buradaki sey ayri:
//  piyasanin HAMLEYI NASIL OKUDUGU.
//
//  Gercek dunyada:
//    - Tahvil ihraci duyurusu hisseyi genelde OYNATMAZ, hatta hafif
//      yukseltir. Yonetim gelecekteki nakit akisina guvendigini
//      soylemis olur.
//    - Hisse ihraci duyurusu DUSURUR (bkz. equity.ts, seyreltme).
//      Sebep ayni mantik tersten: "yonetim hisseyi pahali buluyor".
//    - Kredi limitini cekmek hafif olumsuzdur: nakit sikintisi sinyali.
//    - %35'ten borclanmak felakettir: "hicbir banka bize dokunmuyor".
//    - Yonetim kurulu uyesinden borc almak yonetisim kirmizi bayragidir:
//      cikar catismasi, ve teminat senin kontrolun.
//    - KURUCUNUN KENDI PARASINI KOYMASI en guclu olumlu sinyaldir.
//      Finansta "skin in the game" denir; iceriden alim, piyasanin en
//      cok guvendigi isarettir.
//
//  Yani ayni parayi nereden buldugun, ne kadar bulduğun kadar onemli.
// ============================================================================

export type FinancingEvent =
    | 'loan_healthy'      // Saglikli notla vadeli kredi/tahvil
    | 'loan_stretched'    // Zaten kaldiracliyken daha fazla borc
    | 'revolver_draw'     // Kredi limitini cekmek
    | 'private_credit'    // %35 — son care
    | 'insider_loan'      // Kurul uyesinden borc, teminat hisse
    | 'capital_injection' // Kurucu kendi parasini koyuyor
    | 'debt_repaid'       // Borc kapatma
    | 'rating_downgrade'  // Not dusuşu
    | 'covenant_breach';  // Sozlesme ihlali

export interface FinancingSignal {
    /** Hisseye yuzde etki */
    impactPercent: number;
    /** Oyuncuya gosterilecek aciklama */
    message: string;
}

export const FINANCING_SIGNALS: Record<FinancingEvent, FinancingSignal> = {
    loan_healthy: {
        impactPercent: 0.8,
        get message() { return t('data.credit.theMarketReadsCheapDebt'); },
    },
    loan_stretched: {
        impactPercent: -3.5,
        get message() { return t('data.credit.borrowingAgainAtThisLeverage'); },
    },
    revolver_draw: {
        impactPercent: -1.2,
        get message() { return t('data.credit.drawingOnTheCreditLine'); },
    },
    private_credit: {
        impactPercent: -8,
        get message() { return t('data.credit.borrowingAt35TellsThe'); },
    },
    insider_loan: {
        impactPercent: -6,
        get message() { return t('data.credit.aDirectorLendingToThe'); },
    },
    capital_injection: {
        impactPercent: 4,
        get message() { return t('data.credit.theFounderPuttingPersonalMoney'); },
    },
    debt_repaid: {
        impactPercent: 1,
        get message() { return t('data.credit.payingDownDebtLowersThe'); },
    },
    rating_downgrade: {
        impactPercent: -3,
        get message() { return t('data.credit.aDowngradeRaisesTheCost'); },
    },
    covenant_breach: {
        impactPercent: -10,
        get message() { return t('data.credit.aCovenantBreachBecomesPublic'); },
    },
};

/**
 * Kredi turune ve mevcut duruma gore hangi sinyal gecerli.
 * Saglikli notla banka kredisi olumlu; ayni kredi kaldiracliyken olumsuz.
 */
export const signalForLoan = (kind: LoanKind, assessment: CreditAssessment): FinancingEvent => {
    if (kind === 'shark') return 'private_credit';
    if (kind === 'revolver') return 'revolver_draw';
    // Yatirim yapilabilir notun altindaysan yeni borc endise yaratir.
    return ratingAtLeast(assessment.rating, 'BBB') ? 'loan_healthy' : 'loan_stretched';
};

// ----------------------------------------------------------------------------
//  KALDIRAÇ HİSSEYİ DAHA OYNAK YAPAR
// ----------------------------------------------------------------------------
//  Borclu bir sirketin hissesi daha volatildir ve bu matematiksel bir
//  zorunluluktur: faaliyet kari oynadiginda, sabit faiz gideri dususu
//  buyutur. Finansta "kaldiracli beta" denir.
//
//  Oyun acisindan da onemli: borc almanin bedeli yalnizca faiz degil,
//  her ceyregin daha sert gecmesi. 4x kaldiracta iyi ceyrekler daha
//  iyi, kotu ceyrekler cok daha kotu hissettirir.
// ----------------------------------------------------------------------------

/** 4x kaldiracta oynaklik bu kadar artar. */
export const LEVERAGE_VOLATILITY_MAX = 0.6;

export const leverageVolatilityMultiplier = (leverage: number): number => {
    const lev = Math.max(0, Math.min(6, leverage || 0));
    return 1 + (lev / 4) * LEVERAGE_VOLATILITY_MAX;
};

// ============================================================================
//  TEMİNATLI VE MEZZANİNE BORÇ — "100M kapasite yazıyor, 6M çekebiliyorum"
// ============================================================================
//
//  OYUNCUNUN SORUSU
//  ----------------
//  "para cekicem bankadan ama az cekebiliyorum... yuklu para cekme daha
//   cetin sekilde olmali ama cekebilmeliyim, belki share veririm cogunu"
//
//  Tam yerinden yakalanmis bir eksik. Kazanca dayali kredi (assessCredit)
//  DOGRU ama TEK BASINA EKSIKTI. Gercek hayatta bir sirketin borclanma
//  kapasitesi tek bir sayi degil, UC KATMANDIR ve her katman farkli bir
//  seye borc verir:
//
//    1) NAKIT AKISI       -> "kazancin faizi oduyor mu"      en ucuz
//    2) VARLIK (teminat)   -> "odemezsen neyi alirim"         orta
//    3) OZKAYNAK (mezzanine)-> "odemezsen sirketin ne kadari benim"  en pahali
//
//  Kazancin kucukse birinci katman kapali olabilir ama fabrikan duruyorsa
//  ikinci katman aciktir. Ikisi de yetmiyorsa ucuncu katman her zaman
//  aciktir — cunku artik para degil SIRKETI satiyorsun.
//
//  Bu, kaldiraci bir sayidan bir KARARA cevirir: ne kadar riski nereden
//  almak istiyorsun.
// ============================================================================

/** Tesis ve istiraklerin teminat olarak kabul edilen orani. */
export const COLLATERAL_ADVANCE_RATE = 0.55;
/** Istirakler daha likit sayilir — daha kolay satilir. */
export const SUBSIDIARY_ADVANCE_RATE = 0.45;

export interface CollateralBase {
    /** Tesisin defter degeri (kademe yatirimlarinin toplami) */
    facilityValue: number;
    /** Istiraklerin toplam degeri */
    subsidiaryValue: number;
    /** Stoktaki malin degeri */
    inventoryValue: number;
}

export interface CollateralAssessment {
    /** Teminat gosterilebilecek toplam varlik degeri */
    pledgeableValue: number;
    /** Bu teminatla alinabilecek azami borc */
    capacity: number;
    /** Bu teminata karsi zaten cekilmis tutar */
    used: number;
    headroom: number;
}

/**
 * Varliga dayali borclanma kapasitesi.
 *
 * DIKKAT — bu kapasite kazanc kapasitesinin YERINE GECMEZ, USTUNE BINER.
 * Gercek hayatta da boyledir: bir sirket hem nakit akisi kredisi hem
 * varlik teminatli kredi tasir. Ama teminatli kredide odeyemezsen
 * pazarlik yoktur; varlik gider.
 */
export const assessCollateral = (
    base: CollateralBase,
    securedDebt: number,
): CollateralAssessment => {
    const pledgeable =
        Math.max(0, base.facilityValue || 0) * COLLATERAL_ADVANCE_RATE +
        Math.max(0, base.subsidiaryValue || 0) * SUBSIDIARY_ADVANCE_RATE +
        Math.max(0, base.inventoryValue || 0) * 0.35;

    const used = Math.max(0, securedDebt || 0);
    return {
        pledgeableValue: pledgeable,
        capacity: pledgeable,
        used,
        headroom: Math.max(0, pledgeable - used),
    };
};

// ----------------------------------------------------------------------------
//  MEZZANİNE — parayı hisseyle ödemek
// ----------------------------------------------------------------------------
//  Adi "ara kat"tir: borc ile ozkaynak arasinda durur. Vadesinde nakit
//  odersen normal (pahali) bir kredidir. Odeyemezsen borc HISSEYE DONER
//  ve alacakli kap tablosuna girer — genelde bir de kurul koltugu ister.
//
//  Oyun acisindan onemi: bu, "sirketin ne kadarini vermeye razisin"
//  sorusunu bir dugmeye baglar. Ve kurul mekanigine dogrudan besleme
//  yapar — mezzanine veren biri artik masada oturuyordur.
// ----------------------------------------------------------------------------

/** Mezzanine borcun degerleme uzerinden hisseye donme iskontosu. */
export const MEZZANINE_CONVERSION_DISCOUNT = 0.30;
/** Bu buyuklugun ustundeki mezzanine bir kurul koltugu getirir. */
export const MEZZANINE_BOARD_SEAT_RATIO = 0.10;

export interface MezzanineQuote {
    /** Cekilebilecek azami tutar */
    maxAmount: number;
    /** Yillik faiz */
    rate: number;
    /** Odeyemezsen bu kadar hisse verirsin (adet) */
    sharesIfConverted: number;
    /** Bu, sirketin yuzde kaci */
    dilutionPercent: number;
    /** Kurul koltugu da gider mi */
    costsBoardSeat: boolean;
    warning: string;
}

/**
 * Mezzanine teklifi.
 *
 * Tavani DEGERLEMENIN orani olarak koyuyoruz, kazancin degil — cunku
 * alacakli buradan kazancina degil sirketin kendisine bakiyor. Kazanci
 * sifir olan bir sirket bile mezzanine bulabilir; sadece cok pahaliya.
 */
export const quoteMezzanine = (
    valuation: number,
    totalShares: number,
    amount: number,
    existingMezzanine: number = 0,
): MezzanineQuote => {
    const val = Math.max(0, valuation || 0);
    // Sirketin en fazla %35'i kadar mezzanine tasinabilir. Otesinde
    // sirket zaten alacaklinindir ve kimse borc vermez.
    const maxAmount = Math.max(0, val * 0.35 - Math.max(0, existingMezzanine));
    const draw = Math.max(0, Math.min(amount || 0, maxAmount));

    // Donusum fiyati bugunku degerlemenin %30 altinda — alacakli riski
    // bu iskontoyla fiyatliyor. Cok hisse vermenin sebebi budur.
    const conversionValuation = val * (1 - MEZZANINE_CONVERSION_DISCOUNT);
    const pricePerShare = conversionValuation > 0 && totalShares > 0
        ? conversionValuation / totalShares
        : 0;
    const shares = pricePerShare > 0 ? draw / pricePerShare : 0;
    const dilution = totalShares > 0 ? (shares / (totalShares + shares)) * 100 : 0;

    return {
        maxAmount,
        rate: 0.18,
        sharesIfConverted: Math.round(shares),
        dilutionPercent: dilution,
        costsBoardSeat: val > 0 && draw / val >= MEZZANINE_BOARD_SEAT_RATIO,
        warning:
            `If you cannot repay in cash, this converts into ${dilution.toFixed(1)}% of your ` +
            `company at a ${(MEZZANINE_CONVERSION_DISCOUNT * 100).toFixed(0)}% discount to today's ` +
            `valuation. You are not borrowing money — you are selling an option on control.`,
    };
};

/** Yeni kredi turleri — LOAN_PRODUCTS'a eklenir. */
export const EXTENDED_LOAN_PRODUCTS: LoanProduct[] = [
    {
        kind: 'secured',
        get name() { return t('data.credit.assetBackedLoan'); },
        spread: 0.015,
        termQuarters: 24,
        prepaymentPenalty: 0.01,
        get description() { return t('data.credit.securedOnYourPlantInventory'); },
    },
    {
        kind: 'mezzanine',
        get name() { return t('data.credit.mezzanineFacility'); },
        spread: 0,
        fixedRate: 0.18,
        termQuarters: 12,
        prepaymentPenalty: 0.03,
        get description() { return t('data.credit.largeMoneyAgainstTheCompany'); },
    },
];
