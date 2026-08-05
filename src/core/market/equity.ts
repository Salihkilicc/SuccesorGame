// src/core/market/equity.ts
//
// ============================================================================
//  VALUATION AND SHARES — the single source
// ============================================================================
//
//  WHY THIS FILE EXISTS: the game had THREE SEPARATE share systems and all
//  three quoted different numbers.
//
//    1) useStatsStore.companyOwnership  -> 65 (a percentage only)
//    2) useShareholderStore             -> 10,000,000 shares, 6.5M held
//    3) useEquityStore                  -> 1,000,000 shares, 1M held
//
//  The Stock Market screen read THE THIRD. The player appeared to hold
//  1M/1M = 100%, while the board had four members and 35% of the company.
//  That is why the screen said "it's all yours".
//
//  The price was off by 10x too: one divided the valuation by 1M shares, the
//  other by 10M.
//
//  WHY THE DAILY CHANGE WAS ALWAYS 0%
//  ----------------------------------
//  `companyDailyChange` was only written inside `processCompanyMonthlyTick`,
//  and that function was NEVER CALLED. So the field was never updated; even
//  when the price moved, the screen read 0.00%.
//
//  NOW: the cap table lives in useShareholderStore (10M shares, board members
//  included), valuation and price live in the pure functions in this file,
//  and the results are stored in statsStore. One chain.
//
//  THIS FILE UNDERPINS BANKING AND SHARE SALES. Read what is already here
//  before adding a new formula; do not create a third source.
//
// ============================================================================

/** Sirketin toplam hisse sayisi. Kap tablosunun temeli. */
export const TOTAL_SHARES_DEFAULT = 10_000_000;

// ============================================================================
//  VALUATION
// ============================================================================
//  THERE USED TO BE TWO FORMULAS:
//    engine:     capital x 1.5
//    statsStore: monthlyRevenue x 12 x multiple + capital
//  The engine overwrote the other one every quarter, so the second never
//  actually applied.
//
//  THE NEW MODEL — the three legs of a real valuation:
//    cash + earnings multiple + revenue multiple
//
//  Why both (earnings AND revenue): early on, profit is low but growing
//  revenue is valuable; late on, profit dominates. Using an earnings multiple
//  alone would value a fast-growing loss-maker at zero, which is unrealistic.
//
//  BEING PUBLIC RAISES THE MULTIPLE. A liquidity and visibility premium.
//  Brand contributes too: a recognised company trades on a higher multiple.
// ============================================================================

import { brandValuationMultiplier } from './brand';
import { shareValuationMultiplier } from './competitors';

/** Pay carpaninin kiyas noktasi: bu payda carpan 1.0 kabul edilir. */
export const SHARE_LIFT_REFERENCE = 5;
/** Marka + pay carpanlarinin birlikte gecemeyecegi tavan. */
export const MAX_VALUATION_LIFT = 2.2;

export interface ValuationInput {
    /** Sirket kasasi */
    cash: number;
    /**
     * Trailing twelve months of revenue (TTM).
     *
     * This used to be "last quarter x 4" and the result was nonsense: when
     * profit fell from $350k to 0 in a single quarter the share lost 66%.
     * Real markets price the last 12 months, not one quarter. With TTM, one
     * bad quarter has a quarter of the effect.
     */
    ttmRevenue: number;
    /**
     * MADDI DURAN VARLIKLAR — tesis kademesine yatirilan + laboratuvar
     * + istiraklerin degeri. Degerlemeye TASFIYE TABANI olarak girer.
     */
    tangibleAssets?: number;
    /**
     * EARNINGS POWER — smoothed TTM EBIT (see updateEarningsPower).
     * Not raw TTM: the market does not fully price a single noisy quarter.
     */
    ttmEbit: number;
    /** Toplam borc — degerlemeden duser */
    debt: number;
    /** Halka acik mi */
    isPublic: boolean;
    /** Marka degeri 0-100 */
    brandValue: number;
    /** Total realised market share (%). Raises earnings QUALITY. */
    marketShare?: number;
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
/** The uplift added to the multiples at brand 100. */
/**
 * RETIRED — the brand multiplier now lives in brand.ts.
 * This one was linear and weak (35% cap, linear). Brand effects only bite
 * past a threshold, so it became quadratic and the cap rose to 55%.
 * See core/market/brand.ts -> brandValuationMultiplier
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

    // ------------------------------------------------------------------
    //  MARKET SHARE -> EARNINGS QUALITY
    // ------------------------------------------------------------------
    //  Share is not added to the valuation as MONEY — revenue and profit
    //  already flow from share, and adding it on top would double-count.
    //  What share does is raise the MULTIPLE: the profit of a company that
    //  owns 8% of its market is worth more than the same profit at a 0.5%
    //  company, because that profit is more durable. Finance calls it
    //  "earnings quality"; it is the price of a moat.
    //
    //  Square-root shaped: the first points of share are the most valuable.
    //  Together with the brand multiplier it is capped in total, otherwise
    //  the two would compound and send the valuation into orbit.
    // ------------------------------------------------------------------
    const shareLift = shareValuationMultiplier(
        Math.max(0, input.marketShare || 0),
        SHARE_LIFT_REFERENCE,
    );
    const lift = Math.min(MAX_VALUATION_LIFT, brandLift * shareLift);

    const earningsMultiple =
        (input.isPublic ? EARNINGS_MULTIPLE_PUBLIC : EARNINGS_MULTIPLE_PRIVATE) * lift;
    const revenueMultiple =
        (input.isPublic ? REVENUE_MULTIPLE_PUBLIC : REVENUE_MULTIPLE_PRIVATE) * lift;

    const annualEbit = input.ttmEbit || 0;
    const annualRevenue = Math.max(0, input.ttmRevenue || 0);

    const cash = Math.max(0, input.cash || 0);

    // LOSS DAMPING: a loss-making company is cheaper, but its value does not
    // fall to zero — its customers, brand and cash remain. The earnings leg
    // used to be CLAMPED to zero, which priced a company whose profit fell by
    // $1 the same as one losing $1M.
    const earnings =
        annualEbit >= 0
            ? annualEbit * earningsMultiple
            : annualEbit * earningsMultiple * LOSS_DAMPING;

    const revenue = annualRevenue * revenueMultiple;
    const debt = Math.max(0, input.debt || 0);

    // ------------------------------------------------------------------
    //  TANGIBLE FIXED ASSETS — plant, laboratory, subsidiaries
    // ------------------------------------------------------------------
    //  The player was right: "the factory on the ladder and the R&D plant
    //  should affect net worth too, because my company also has passive
    //  investments."
    //
    //  The valuation looked only at CASH FLOW. That is largely correct for a
    //  company, but even a heavy-industry firm earning near zero is not
    //  priced below the value of its plant — in the bad case the plant is
    //  sold. Finance calls this the "liquidation value floor" and it is the
    //  founding idea of value investing.
    //
    //  We do not add the FULL book value: plant does not fetch its price
    //  second-hand. And this is a FLOOR, not an addition — in a profitable
    //  company the earnings multiple already exceeds the factory's value, so
    //  it has no effect at all. It only protects a company in trouble.
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
        // Which floor set the value — so it can be explained on screen
        valuedOn: total === liquidation && liquidation > goingConcern ? 'assets' : 'earnings',
    };
};

// ============================================================================
//  SHARE PRICE
// ============================================================================

/** Value per share. One divisor: the total share count. */
export const sharePrice = (valuation: number, totalShares: number): number => {
    const shares = Math.max(1, totalShares || TOTAL_SHARES_DEFAULT);
    return Math.max(0, valuation) / shares;
};

/**
 * Market sentiment — the price's deviation from fundamental value.
 *
 * Small and random (+/-3%). Deliberately small: the MAIN driver of the price
 * should be company performance, not a coin flip. It used to be that half of
 * the movement was pure randomness (a +/-5% "news factor") and the player
 * could not tell what had caused what.
 */
export const SENTIMENT_RANGE = 0.02;

/**
 * PRICE SMOOTHING — the market does not price new information in full at once.
 *
 * A private company moves very slowly: its valuation only updates at a
 * funding round or in a sale negotiation; it has no daily price.
 *
 * A public company reprices fast, with a sentiment band on top. That is the
 * real trade of going public: the multiples grow, but you are judged every
 * quarter.
 */
export const PRICE_ADJUST_PRIVATE = 0.30;
export const PRICE_ADJUST_PUBLIC = 0.55;

// ----------------------------------------------------------------------------
//  SCALE DAMPING — a large company moves less
// ----------------------------------------------------------------------------
//  The model used to be SCALE-INDEPENDENT: a $10M company and a $2T company
//  swung by the same percentage. In reality small companies are volatile and
//  giants are not. The reasons are real:
//
//    - DIVERSIFICATION: a giant has dozens of products and markets; one bad
//      quarter in one of them does not move the whole
//    - LIQUIDITY AND COVERAGE: a deep order book and many analysts correct
//      mispricing quickly and absorb jumps
//    - INSTITUTIONAL OWNERSHIP: index funds and long-only funds hold the
//      stock; turnover falls
//
//  It matters for the game too: in the late game, running a giant while the
//  share price swings 70% a quarter would be both unrealistic and maddening.
//  As you grow the game calms down and decisions lengthen.
//
//  Logarithmic: full volatility at $10M (1.0), a third of it at $1T (0.35).
//  Each order of magnitude in between buys a notch of calm.
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
 * The market-sentiment multiplier decays back to 1.0 over time.
 *
 * IPO euphoria (1.5) or dilution panic (0.7) is not permanent. This decay
 * was MISSING at first: after an IPO the price stayed 50% inflated forever.
 */
export const SENTIMENT_DECAY = 0.25;

export const decaySentiment = (multiplier: number): number =>
    multiplier + (1 - multiplier) * SENTIMENT_DECAY;

// ----------------------------------------------------------------------------
//  EARNINGS POWER — the market prices what it EXPECTS, not what happened
// ----------------------------------------------------------------------------
//  TTM alone was not enough, for this reason: EBIT is the DIFFERENCE between
//  two large numbers (revenue and cost). A 10% swing in revenue can swing
//  profit 50% — that is operating leverage, and it is real. But real markets
//  do not price all of that noise; they weigh whether a quarter's deviation
//  is permanent or temporary and update their estimate only PARTLY.
//
//  So the valuation uses a smoothed "earnings power" rather than raw TTM
//  profit. The result: a noisy quarter moves the price a little, while a
//  lasting deterioration (bad quarter after bad quarter) is priced in full.
//
//  Why it matters for the game: random fluctuation is not punished, REAL
//  changes in performance are. The player's decisions are visible; the noise
//  is not.
// ----------------------------------------------------------------------------

/** Earnings power moves this far towards the new TTM each quarter. */
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
//  DILUTION AND BUYBACKS
// ============================================================================

/**
 * How many new shares must be issued to raise a given amount.
 * New shares are sold at the CURRENT price; everyone is diluted proportionally.
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
//  CAPITAL TRANSACTIONS — with their real costs
// ============================================================================
//  These transactions used to be "free": no fees, no discount, no deal
//  premium. In real life none of them are free, and their costs are exactly
//  what makes the decisions interesting.
// ============================================================================

// --- HALKA ARZ ---------------------------------------------------------------

/**
 * UNDERWRITING FEE. In real IPOs 5-7% of gross proceeds goes to the banks.
 * This breaks the expectation that "going public hands me my valuation in
 * cash".
 */
export const IPO_UNDERWRITING_FEE = 0.07;

/**
 * IPO DISCOUNT.
 *
 * Shares are DELIBERATELY priced below fair value so the book fills and the
 * stock rises on day one. The literature calls it "money left on the table";
 * it averages around 15%. So going public does not convert your whole
 * valuation into cash — which stops an IPO being automatic free money.
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
    /** The fair price before the discount — to show the player the gap */
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

    // An IPO issues NEW shares; existing holders keep their count but the
    // total rises, so everyone is diluted proportionally.
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

// --- SECONDARY OFFERING (DILUTION) -------------------------------------------

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

// --- BUYBACK -----------------------------------------------------------------

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

    // Not iterative — a closed-form approximation: estimate premium, then count.
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

// --- DIVIDEND ----------------------------------------------------------------

/**
 * A dividend is now a percentage of PROFIT (a payout ratio), not of CASH.
 *
 * The previous version was "distribute 10% of capital". That is not a
 * dividend, it is a partial liquidation. Real companies pay out of profit,
 * and the payout ratio is a sign of a company's maturity. Paying one while
 * loss-making is a serious warning signal.
 */
export const DIVIDEND_PAYOUT_MAX = 1.0;

export interface DividendQuote {
    /** Dagitilacak toplam tutar */
    total: number;
    /** Hisse basina */
    perShare: number;
    /** Oyuncunun cebine giren */
    playerCut: number;
    /** Annual yield: (per share x 4) / price */
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
//  THE FOUNDER SELLING THEIR OWN SHARES (secondary sale)
// ============================================================================
//
//  The player was right: "there's issue shares, the money goes to the company
//  but my stake shrinks, that's absurd — it should be one or the other."
//
//  In fact these are TWO DIFFERENT TRANSACTIONS that had been merged into a
//  single button on screen:
//
//    PRIMARY (dilution)   -> NEW shares are issued, the money goes to the
//                            COMPANY. Your stake falls because the pie grew.
//                            The company raises money to grow.
//
//    SECONDARY            -> YOUR shares change hands, the money goes to YOU.
//                            NO new shares, the total is unchanged.
//                            Not a cent reaches the company.
//
//  Both are real and both are needed. Merging them into one button made it
//  impossible for the player to understand which money went to whom.
//
//  A SECONDARY SALE IS TAXED: capital gains are taxable. This is separate
//  from corporation tax because this is YOUR income.
// ============================================================================

/** Sermaye kazanci vergisi — kurucunun kendi hisse satisindan. */
export const CAPITAL_GAINS_TAX = 0.20;

/**
 * Dividend tax. The company already paid corporation tax; whoever receives
 * the dividend pays again. Finance calls this "double taxation", and it is
 * the number one reason companies prefer buybacks to dividends — a buyback
 * defers the tax.
 */
export const DIVIDEND_TAX = 0.15;

/**
 * Block-sale discount.
 * Dumping a large parcel at once moves the price against you; the buyer
 * prices in the liquidity risk. The more you sell, the cheaper it goes.
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
