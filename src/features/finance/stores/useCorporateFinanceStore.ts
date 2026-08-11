// @orphan-ok-symbol getBorrowingCapacity - the finance hub reads assessment.headroom from credit.ts instead
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { useEquityStore } from './useEquityStore';
import {
    CreditAssessment,
    LoanKind,
    DistressState,
    EXTENDED_LOAN_PRODUCTS,
    LOAN_PRODUCTS,
    assessCollateral,
    quoteMezzanine,
    LoanRecord,
    assessCredit,
    assessDistress,
    productRate,
    ratingAtLeast,
    serviceLoanQuarter,
    FINANCING_SIGNALS,
    FinancingEvent,
    FinancingSignal,
    signalForLoan,
} from '../../../core/market/credit';
import {
    AcquisitionDeal,
    FinancingMethod,
    TargetRisk,
    advanceDeal,
    announcementImpact,
    dealQuarterEffect,
    estimateTargetEbit,
    quoteAcquisition,
    quoteDivestiture,
    quoteFinancing,
} from '../../../core/market/mergers';
import { directorFromAcquisition } from '../../../core/market/governance';
import { boardWillSell } from '../../../core/market/mergers';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { formatMoney } from '../../../core/utils';

/**
 * CORPORATE FINANCE STORE
 * Manages Debt, Credit Score, Leverage, and Subsidiaries
 * ============================================================================
 *  STORAGE — the same AsyncStorage every other store uses
 * ============================================================================
 *  This was the only store in the project on MMKV, with its own local
 *  `zustandStorage` shadowing the shared one. Two failures came out of that:
 *
 *  1) SILENT DATA LOSS. If `new MMKV()` threw - an unlinked pod, a New
 *     Architecture mismatch, a simulator without the native module - the catch
 *     block installed a no-op store whose set() discards and getString()
 *     returns null. Writes went nowhere and reads came back empty, so
 *     subsidiaries survived only in memory and vanished on every restart. The
 *     player's report was "the companies I bought disappear when I close the
 *     game". The only trace was one console warning at startup.
 *
 *  2) NEW GAME NEVER CLEARED IT. PERSIST_KEYS lists 'subsidiary-storage' and
 *     newGame.ts deletes it from AsyncStorage - a different store entirely, so
 *     the delete hit nothing.
 *
 *  Both disappear by using the shared storage. Twenty other stores persist
 *  this way without trouble, and the async write is not a problem here: the
 *  data is only read at startup, and zustand handles hydration.
 * ============================================================================
 */

// 2. Define Interfaces
export interface Loan {
    id: string;
    principal: number;
    interestRate: number;
    monthlyPayment: number;
    remaining: number;
    type: 'Bank' | 'Bonds' | 'Shark';
    originationDate: number;
}

export interface SubsidiaryStrategy {
    marketing: number;
    rnd: number;
    production: number;
    workforce: number;
    // Constraint: Sum <= 10
}

export interface Subsidiary {
    id: string;
    name: string;
    sector: string;
    valuation: number;
    acquiredAt: number;
    /**
     * DEVRALMANIN FINANSAL KAYDI.
     *
     * Once satin alma tek satirlik bir islemdi: parayi ode, listeye
     * eklensin. Hisseye tek etkisi kasadan cikan nakitti — prim odemenin
     * bedeli yoktu, hedefin kari senin karina hic girmiyordu, entegrasyon
     * diye bir sey yoktu.
     *
     * Artik her islem bir kayit tasir ve her ceyrek islenir.
     * Bkz. core/market/mergers.ts
     */
    deal?: AcquisitionDeal;
    strategy: SubsidiaryStrategy;
    lastChangePercent: number; // For UI display (e.g. +12.5%)
    history: number[];
}

export interface CorporateFinanceState {
    loans: LoanRecord[];
    /** GOSTERIMLIK skor — gercek olcut harf notudur */
    creditScore: number;
    totalDebt: number;
    /** Ust uste kac ceyrektir sozlesme ihlalinde */
    quartersInBreach: number;
    subsidiaries: Subsidiary[];

    // Actions
    /** ESKI — not artik nakit akisindan geliyor. Sadece gosterimlik skor. */
    refreshCreditScore: (valuation?: number, cash?: number) => void;
    /** Not, faiz, kapasite ve sozlesme durumu — TEK KAYNAK */
    getAssessment: () => CreditAssessment;
    getInterestRate: () => number;
    /** Varliga dayali borclanma kapasitesi (bkz. credit.ts assessCollateral) */
    getCollateral: () => ReturnType<typeof assessCollateral>;
    /** Mezzanine teklifi — odeyemezsen hisseye doner */
    getMezzanine: (amount: number) => ReturnType<typeof quoteMezzanine>;
    /** Ceyreklik borc servisi: faiz + anapara. Motor cagirir. */
    serviceDebtQuarter: (quarters: number) => { interest: number; principal: number; total: number };
    getDistress: () => DistressState;
    advanceDistress: () => DistressState;
    takeLoan: (
        amount: number,
        valuation: number,
        loanType: LoanKind,
        baseRate: number,
        addCashFn: (amount: number) => void
    ) => { success: boolean; message: string };
    repayLoan: (
        id: string,
        amount: number,
        spendCashFn: (amount: number) => void
    ) => { success: boolean; message: string };
    /**
     * EMEKLIYE AYRILDI — cagirmayin.
     * Parayi aliyor ama bakiyeyi azaltmiyordu; kredi hic kapanmiyordu.
     * Yerine: serviceDebtQuarter
     */
    payMonthlyInterests: (spendCashFn: (amount: number) => void) => {
        totalPayment: number;
        success: boolean;
    };
    getBorrowingCapacity: (valuation: number) => number;
    getCurrentLeverage: (valuation: number) => number;
    getMonthlyInterestTotal: () => number;

    // Subsidiary Actions
    acquireCompany: (company: any, price: number, deal?: AcquisitionDeal) => void;

    /**
     * TEK KAPI — her devralma buradan gecer.
     *
     * ONCEDEN UC AYRI YOL VARDI ve ucu de farkli sey yapiyordu:
     *
     *   1) useMarketStore.acquireCompany
     *      KISISEL cuzdandan harciyordu (spendMoney), sonucu
     *      useUserStore.subsidiaries'e yaziyordu. Hicbir ekrandan
     *      cagrilmiyordu ama duruyordu.
     *
     *   2) useStatsStore.addAcquisition
     *      NegotiationModal kullaniyordu. Parayi elle dusuyor, kaydi
     *      statsStore.acquisitions'a yaziyordu. Motor ORAYA BAKMADIGI
     *      icin: pazar payi gecmiyor, hedefin kari EBIT'e girmiyor,
     *      entegrasyon ve sinerji hic islemiyordu. Yani pazarlikla
     *      alinan sirket oyunda hicbir sey yapmiyordu.
     *
     *   3) useCorporateFinanceStore.acquireCompany
     *      Gercek olan. AcquisitionModal kullaniyordu.
     *
     *   Ayrica satin alma BUFF'lari (Ar-Ge hizi, uretim maliyeti...)
     *   useUserStore.subsidiaries'ten okunuyordu — yani yalnizca
     *   1. yolun yazdigi yerden. O yol hic cagrilmadigi icin buff'lar
     *   HIC CALISMIYORDU.
     *
     * Artik hepsi bu fonksiyona baglidir. Yeni bir devralma ekrani
     * yazacaksan bunu cagir, kendi yolunu acma.
     */
    executeAcquisition: (input: {
        target: { id: string; name: string; marketCap: number; risk?: string; category?: string; sector?: string; acquisitionBuff?: any };
        hostile: boolean;
        financing: FinancingMethod;
        /** Pazarlikla belirlenen fiyat — verilmezse standart prim uygulanir */
        negotiatedPrice?: number;
    }) => { success: boolean; message: string; announcementImpact: number };
    /**
     * Tum devralmalarin bu ceyrekki toplam EBIT etkisi. Motor cagirir.
     *
     * Read-only, so the tick can ask before tax and again at report time
     * without paying the earnings twice. `advanceAcquisitionsQuarter` is what
     * actually moves the deals on.
     */
    acquisitionsQuarterEffect: (quarters: number) => {
        netEbit: number;
        integrationCost: number;
        synergy: number;
        earnings: number;
        impairment: number;
    };
    /** Her anlasmayi bir ceyrek ilerlet. Ceyrekte TAM BIR KEZ cagrilir. */
    advanceAcquisitionsQuarter: (quarters: number) => void;
    sellSubsidiary: (id: string) => void;
    updateSubsidiaryStrategy: (id: string, newStrategy: SubsidiaryStrategy) => void;
    evaluateSubsidiaries: () => void;

    // Capital Injection
    injectCapital: (amount: number) => { success: boolean; msg: string };

    reset: () => void;

    // Negotiated Sale
    attemptToSellCompany: (id: string, askingPrice: number) => { success: boolean; msg?: string; price?: number };
}

/**
 * Kurul uyesinden alinan borcun ortulu faiz orani.
 * Sozlesmesinde yazili bir faiz yok — teminat hisselerin ve vade sert.
 * Ama oyunun borc terazisinde bir maliyeti olmali, yoksa "bedava borc"
 * kapisi acik kalirdi.
 */
/** A listed company's competitor strength, where it competes in a product market. */
const competitorStrengthOf = (stockId: string): number | undefined => {
    try {
        const { PRODUCT_MARKETS } = require('../../../core/market/productMarkets');
        for (const m of PRODUCT_MARKETS) {
            const c = (m.competitors || []).find((x: any) => x.stockId === stockId);
            if (c) return c.strength;
        }
    } catch { /* not a product-market rival */ }
    return undefined;
};

const SHARK_IMPLIED_RATE = 0.30;

/** Kurul uyelerinden alinan aktif borclarin toplami. */
const sharkLoanTotal = (): number => {
    try {
        const sh = require('../../shareholders/stores/useShareholderStore')
            .useShareholderStore.getState();
        return (sh.sharkLoans || [])
            .filter((l: any) => l.isActive)
            .reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
    } catch {
        return 0;
    }
};

/**
 * Bir finansman hamlesinin hisseye sinyal etkisini uygular.
 *
 * Borc kendi basina hisseyi dusurmez — degerleme zaten borcu duser.
 * Buradaki sey ayri: piyasanin hamleyi nasil okudugu. Ayni parayi
 * bankadan mi tefeciden mi buldugun, ne kadar buldugun kadar onemli.
 */
const applyFinancingSignal = (event: FinancingEvent): FinancingSignal => {
    const signal = FINANCING_SIGNALS[event];
    try {
        require('./useEquityStore').useEquityStore.setState((st: any) => ({
            marketMultiplier: Math.max(
                0.3,
                st.marketMultiplier * (1 + signal.impactPercent / 100),
            ),
        }));
    } catch { /* piyasa tepkisi uygulanamadi */ }
    return signal;
};

const MAX_LEVERAGE = 0.8; // 80% of Valuation
const RISK_THRESHOLD = 0.5; // 50% triggers market penalty


/**
 * ============================================================================
 *  KURUL KAPISI — buyuk kararlar buradan gecer
 * ============================================================================
 *  Oyuncunun kurali: "hisselerin %50'den az ise cogu sey zaten direkt
 *  kurula sorulmali". Cogunluktayken yalnizca gercekten buyuk kararlar
 *  oya gider; cogunlugu kaybettigin an her sey degisir.
 *
 *  Bu fonksiyon TEK KAPI: hem kredi hem devralma buradan geciyor ki
 *  ileride yeni bir karar turu eklendiginde iki ayri onay yolu
 *  olusmasin. (Bu projede ayni hatayi yedi kez gorduk.)
 *
 *  Donen deger `null` ise karar serbest; degilse oylama sonucudur.
 */
export const boardGate = (
    kind: 'acquisition' | 'debt' | 'mezzanine' | 'dilution' | 'ipo' | 'dividend' | 'buyback' | 'capex' | 'divestiture',
    amount: number,
    title: string,
    hostile = false,
): { needed: boolean; passed: boolean; reason: string; result?: any } => {
    try {
        const sh = require('../../shareholders/stores/useShareholderStore').useShareholderStore;
        const stats = useStatsStore.getState();
        const proposal = {
            kind, amount, title, hostile,
            valuation: stats.companyValue || 0,
        };

        const check = sh.getState().needsVote(proposal);
        if (!check.required) return { needed: false, passed: true, reason: check.reason };

        const fin = useCorporateFinanceStore.getState();
        const a = fin.getAssessment();
        const ctx = {
            profitable: ((stats as any).lossStreak || 0) === 0,
            leverage: a.leverage === Infinity ? 99 : a.leverage,
            inBreach: a.inBreach,
            lossStreak: (stats as any).lossStreak || 0,
            priceVsPeak: 1,
        };

        const result = sh.getState().holdVote(proposal, ctx);
        return {
            needed: true,
            passed: result.passed,
            reason: result.summary,
            result,
        };
    } catch (err) {
        console.warn('[boardGate] vote failed, allowing', err);
        return { needed: false, passed: true, reason: '' };
    }
};

// ============================================================================
//  THE QUARTER'S ACQUISITION ARITHMETIC — ONE IMPLEMENTATION, TWO USES
// ============================================================================
//
//  The tick needs this answer at two different moments: once BEFORE tax, so
//  the subsidiaries' profit is taxed along with everything else, and once at
//  report time to advance every deal one quarter on.
//
//  Those two moments are two hundred lines apart, and the obvious way to get
//  the number twice is to call the same mutating function twice - which would
//  advance every deal twice and pay you their earnings twice. So the sum and
//  the advance are separated here, and both go through this one function so
//  they can never drift apart.
//
//  Pure: takes the list, returns the totals and the new list, touches nothing.
// ============================================================================
const runAcquisitionsQuarter = (subsidiaries: Subsidiary[], quarters: number) => {
    let netEbit = 0, integrationCost = 0, synergy = 0, earnings = 0, impairment = 0;

    const updated = subsidiaries.map(sub => {
        if (!sub.deal) return sub;
        const q = Math.max(1, quarters);
        let deal = sub.deal;
        // Quarter by quarter rather than in one jump: the capture ratio, the
        // synergy ramp and the integration bill all depend on WHERE in its
        // life the deal is, so skipping the middle would misprice it.
        for (let i = 0; i < q; i++) {
            const eff = dealQuarterEffect(deal);
            netEbit += eff.netEbit;
            integrationCost += eff.integrationCost;
            synergy += eff.synergy;
            earnings += eff.earningsContribution;
            impairment += eff.impairment;
            deal = advanceDeal(deal, 1);
        }
        return { ...sub, deal };
    });

    return { effect: { netEbit, integrationCost, synergy, earnings, impairment }, updated };
};

export const useCorporateFinanceStore = create<CorporateFinanceState>()(
    persist(
        (set, get) => ({
            loans: [] as LoanRecord[],
            creditScore: 750,
            totalDebt: 0,
            quartersInBreach: 0,
            subsidiaries: [],

            // --- CREDIT SCORE & LOAN LOGIC (PRESERVED) ---

            /**
             * ESKI TUKETICI SKORU — emekliye ayrildi.
             *
             * Formul `600 + degerleme/1M x 5` idi; ~50 milyon dolarin
             * ustundeki HER sirket 850 puan ve %3 faiz aliyordu. Yani
             * skor erken oyundan sonra olu bir sayiydi ve buyumek
             * otomatik olarak ucuz para getiriyordu.
             *
             * Artik not NAKIT AKISINDAN gelir (kaldirac ve faiz
             * karsilama). Bkz. core/market/credit.ts -> assessCredit
             * Bu fonksiyon yalnizca eski cagrilar patlamasin diye durur
             * ve gosterimlik skoru nottan turetir.
             */
            refreshCreditScore: () => {
                const a = get().getAssessment();
                const scoreByRating: Record<string, number> = {
                    AAA: 830, AA: 790, A: 750, BBB: 700, BB: 640, B: 570, CCC: 480, D: 350,
                };
                set({ creditScore: scoreByRating[a.rating] ?? 600 });
            },

            /**
             * KREDI DEGERLENDIRMESI — tek kaynak.
             * Not, faiz orani, borclanma kapasitesi ve sozlesme durumu
             * hep buradan cikar.
             */
            getAssessment: () => {
                const { totalDebt, loans } = get();
                let stats: any = {};
                try {
                    stats = useStatsStore.getState();
                } catch { /* test ortami */ }

                // TTM EBITDA ve EBIT motorun sakladigi gecmisten.
                const ebitHist: number[] = stats.ebitHistory ?? [];
                const annualEbit = ebitHist.length
                    ? ebitHist.slice(-4).reduce((a: number, b: number) => a + b, 0) *
                      (4 / Math.min(4, ebitHist.length))
                    : 0;
                // Oyunda amortisman ayri bir kalem degil; EBITDA'yi EBIT'in
                // biraz ustunde kabul ediyoruz (tesis opex'inin bir kismi).
                const annualEbitda = annualEbit * 1.15;

                let annualInterest = loans.reduce(
                    (sum, l) => sum + l.balance * l.rate, 0,
                );

                // KURUL UYESINDEN ALINAN BORCLAR DA BORCTUR.
                //
                // `shareholderStore.sharkLoans` ayri bir sistemdi ve
                // kaldirac/covenant hesabina HIC girmiyordu: Marcus'tan
                // borc alip kredi notunu hic bozmadan devam edebiliyordun.
                // Teminat/haciz mekanigi orada kaliyor (hisselerine el
                // konur — bankadan borc almaktan farkli bir hikaye), ama
                // borcun kendisi artik ayni terazide.
                const sharkDebt = sharkLoanTotal();
                annualInterest += sharkDebt * SHARK_IMPLIED_RATE;

                return assessCredit(
                    totalDebt + sharkDebt,
                    annualEbitda,
                    annualEbit,
                    annualInterest,
                );
            },

            getInterestRate: () => get().getAssessment().rate,

            /**
             * VARLIGA DAYALI kapasite. Kazanctan bagimsizdir: tesisin ve
             * istiraklerin duruyorsa banka onlara borc verir. Bedeli,
             * odeyemezsen pazarliksiz haciz.
             */
            getCollateral: () => {
                const stats = useStatsStore.getState();
                const tierValue = (() => {
                    const { getTier } = require('../../../core/market/capacity');
                    const t = getTier(stats.facilityTier || 1);
                    // Defter degeri: bu kademeye gelmek icin odenenin kabaca toplami.
                    return (t.upgradeCost || 0) * 1.6;
                })();
                const subs = get().subsidiaries.reduce((sum, x) => sum + (x.valuation || 0), 0);
                const securedDebt = get().loans
                    .filter(l => l.kind === 'secured')
                    .reduce((sum, l) => sum + l.balance, 0);
                return assessCollateral(
                    {
                        facilityValue: tierValue,
                        subsidiaryValue: subs,
                        inventoryValue: 0,
                    },
                    securedDebt,
                );
            },

            /**
             * MEZZANINE teklifi — para degil, kontrol uzerine opsiyon
             * satiyorsun. Odeyemezsen borc hisseye doner ve alacakli
             * kurula girer.
             */
            getMezzanine: (amount: number) => {
                const stats = useStatsStore.getState();
                const sh = require('../../shareholders/stores/useShareholderStore').useShareholderStore.getState();
                const existing = get().loans
                    .filter(l => l.kind === 'mezzanine')
                    .reduce((sum, l) => sum + l.balance, 0);
                return quoteMezzanine(
                    stats.companyValue || 0,
                    sh.totalShares || 10_000_000,
                    amount,
                    existing,
                );
            },

            /**
             * KREDI AL.
             *
             * Kapasite artik DEGERLEMEDEN degil KAZANCTAN turetiliyor:
             * bankalar nakit akisina borc verir, hayale degil.
             */
            takeLoan: (amount, _valuation, loanType, _baseRate, addCashFn) => {
                const a = get().getAssessment();
                const distress = get().getDistress();

                if (!distress.canBorrow) {
                    return { success: false, message: distress.message };
                }

                const allProducts = [...LOAN_PRODUCTS, ...EXTENDED_LOAN_PRODUCTS];
                const product =
                    allProducts.find(pr => pr.kind === loanType) ?? LOAN_PRODUCTS[1];

                if (product.requiresPublic && !useStatsStore.getState().isPublic) {
                    return { success: false, message: 'Bonds require a public listing.' };
                }
                if (product.minRating && !ratingAtLeast(a.rating, product.minRating)) {
                    return {
                        success: false,
                        message: `Bonds need at least ${product.minRating}. You are ${a.rating}.`,
                    };
                }
                // ------------------------------------------------------------
                //  KATMANLI KAPASITE
                // ------------------------------------------------------------
                //  Oyuncu hakliydi: "100M kapasite yaziyor, 6M cekebiliyorum".
                //  Ama cozum kazanc kapasitesini sismek degil — o dogruydu.
                //  Cozum, gercek hayatta oldugu gibi UST KATMANLARI acmak:
                //
                //    kazanc  -> en ucuz, en kucuk
                //    varlik  -> daha buyuk, teminat karsiligi (haciz riski)
                //    mezzanine -> en buyuk, sirketin kendisi karsiligi
                //
                //  Boylece her zaman bir yol var, ama her yolun kendi
                //  bedeli var. Karar oyuncunun.
                // ------------------------------------------------------------
                if (product.kind === 'secured') {
                    const col = get().getCollateral();
                    if (amount > col.headroom) {
                        return {
                            success: false,
                            message:
                                `Your pledgeable assets support ${formatMoney(col.capacity)}. ` +
                                `${formatMoney(col.used)} is already pledged, leaving ` +
                                `${formatMoney(col.headroom)}. Build or buy more, and this grows.`,
                        };
                    }
                } else if (product.kind === 'mezzanine') {
                    const mz = get().getMezzanine(amount);
                    if (amount > mz.maxAmount) {
                        return {
                            success: false,
                            message:
                                `Mezzanine tops out at 35% of your valuation — ` +
                                `${formatMoney(mz.maxAmount)} more.`,
                        };
                    }
                } else if (amount > a.headroom) {
                    return {
                        success: false,
                        message:
                            `Your earnings support ${formatMoney(a.debtCapacity)} of debt. ` +
                            `You already carry ${formatMoney(get().totalDebt)}, so you can raise ` +
                            `${formatMoney(a.headroom)} this way. Asset-backed and mezzanine ` +
                            `facilities go further — at a price.`,
                    };
                }

                // ------------------------------------------------------------
                //  KURUL ONAYI
                // ------------------------------------------------------------
                //  Mezzanine HER ZAMAN oya gider — alacakli kurula girecek,
                //  yani oyuncu baskalarinin masasina birini oturtuyor.
                //  Buyuk borc da degerlemenin %20'sini asinca oya gider.
                // ------------------------------------------------------------
                const gateKind = product.kind === 'mezzanine' ? 'mezzanine' : 'debt';
                const gate = boardGate(gateKind, amount, `${product.name}: ${formatMoney(amount)}`);
                if (gate.needed && !gate.passed) {
                    return { success: false, message: `The board blocked it. ${gate.reason}` };
                }

                const rate = productRate(product, a);
                const loan: LoanRecord = {
                    id: `LOAN_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    kind: product.kind,
                    name: product.name,
                    principal: amount,
                    balance: amount,
                    rate,
                    quartersRemaining: product.termQuarters,
                    termQuarters: product.termQuarters,
                    prepaymentPenalty: product.prepaymentPenalty,
                    delinquent: false,
                };

                addCashFn(amount);
                const newTotal = get().totalDebt + amount;
                set({ loans: [...get().loans, loan], totalDebt: newTotal });

                // TEK BORC SAYISI: statsStore ile senkron tut.
                useStatsStore.getState().update({ companyDebtTotal: newTotal });

                // Piyasa hamleyi okur: saglikli notla ucuz borc guven
                // sinyalidir, %35'ten borclanmak felakettir.
                const signal = applyFinancingSignal(signalForLoan(product.kind, a));

                return {
                    success: true,
                    message:
                        `${product.name}: ${formatMoney(amount)} at ${(rate * 100).toFixed(1)}%.\n\n` +
                        `${signal.message} (${signal.impactPercent >= 0 ? '+' : ''}${signal.impactPercent.toFixed(1)}% on the share price)`,
                };
            },

            repayLoan: (id, amount, spendCashFn) => {
                const { loans, totalDebt } = get();
                const loan = loans.find(l => l.id === id);
                if (!loan) return { success: false, message: 'Loan not found.' };

                const payment = Math.min(amount, loan.balance);
                // Erken kapatma cezasi — vadeli kredide sozlesme boyle.
                const penalty = payment * (loan.prepaymentPenalty || 0);
                spendCashFn(payment + penalty);

                const balance = loan.balance - payment;
                const newTotal = Math.max(0, totalDebt - payment);

                set({
                    loans: balance <= 0.01
                        ? loans.filter(l => l.id !== id)
                        : loans.map(l => (l.id === id ? { ...l, balance } : l)),
                    totalDebt: newTotal,
                });
                useStatsStore.getState().update({ companyDebtTotal: newTotal });

                applyFinancingSignal('debt_repaid');

                return {
                    success: true,
                    message: balance <= 0.01
                        ? `${loan.name} repaid in full.${penalty > 0 ? ` Prepayment fee ${formatMoney(penalty)}.` : ''}`
                        : `Paid ${formatMoney(payment)}. ${formatMoney(balance)} remaining.`,
                };
            },

            /**
             * ÇEYREKLİK BORÇ SERVİSİ — motor cagirir.
             *
             * ESKI `payMonthlyInterests` PARAYI ALIYOR AMA BAKIYEYI
             * AZALTMIYORDU: sonsuza kadar odersin, borc yerinde dururdu.
             * Artik odeme faiz ve anapara olarak ayrisir, bakiye erir,
             * vade dolunca kredi kapanir.
             */
            serviceDebtQuarter: (quarters) => {
                const q = Math.max(1, quarters);
                // Kurul uyesi borclarinin faizi de her ceyrek gider yazilir.
                // Anaparasi vadesinde tek seferde odenir (bkz. useDebtEnforcer),
                // o yuzden burada yalnizca faiz isleniyor.
                let interest = sharkLoanTotal() * (SHARK_IMPLIED_RATE / 4) * q;
                let principal = 0;
                let loans = get().loans;

                for (let i = 0; i < q; i++) {
                    const next: LoanRecord[] = [];
                    loans.forEach(loan => {
                        const r = serviceLoanQuarter(loan);
                        interest += r.interest;
                        principal += r.principalPaid;
                        if (!r.closed) next.push(r.loan);
                    });
                    loans = next;
                }

                const newTotal = loans.reduce((sum, l) => sum + l.balance, 0);
                set({ loans, totalDebt: newTotal });
                useStatsStore.getState().update({ companyDebtTotal: newTotal });

                return { interest, principal, total: interest + principal };
            },

            /** Sozlesme ihlali ve temerrut kademesi. */
            payMonthlyInterests: () => {
                console.warn(
                    '[Finance] payMonthlyInterests is retired — it never reduced the balance. ' +
                    'Use serviceDebtQuarter instead.'
                );
                return { totalPayment: 0, success: false };
            },

            getDistress: () => {
                const a = get().getAssessment();
                return assessDistress(a, get().quartersInBreach || 0);
            },

            /** Motor her ceyrek cagirir: ihlal sayacini ilerletir. */
            advanceDistress: () => {
                const a = get().getAssessment();
                const next = a.inBreach ? (get().quartersInBreach || 0) + 1 : 0;
                set({ quartersInBreach: next });
                return assessDistress(a, Math.max(0, next - 1));
            },

            getBorrowingCapacity: (valuation) => {
                const { totalDebt } = get();
                const maxDebt = valuation * MAX_LEVERAGE;
                return Math.max(0, maxDebt - totalDebt);
            },

            getCurrentLeverage: (valuation) => {
                const { totalDebt } = get();
                if (valuation === 0) return 0;
                return (totalDebt / valuation) * 100;
            },

            getMonthlyInterestTotal: () => {
                const { loans } = get();
                return loans.reduce((sum, l) => sum + (l.balance * l.rate) / 12, 0);
            },

            // --- SUBSIDIARY SYSTEM (NEW LOGIC) ---

            acquireCompany: (company, price, deal) => {
                const { companyCapital, setCompanyCapital } = useStatsStore.getState();

                if (companyCapital < price) {
                    console.warn('[FinanceStore] Insufficient capital to acquire company');
                    return;
                }

                setCompanyCapital(companyCapital - price);

                const newSubsidiary: Subsidiary = {
                    id: company.id || company.symbol || `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: company.name || 'Unknown Subsidiary',
                    sector: company.sector || company.category || 'Conglomerate',
                    valuation: price,
                    acquiredAt: price,
                    strategy: { marketing: 2, rnd: 3, production: 3, workforce: 2 }, // Default Strategy
                    lastChangePercent: 0,
                    history: [],
                    deal,
                };

                set((state) => ({
                    subsidiaries: [...state.subsidiaries, newSubsidiary]
                }));
            },

            /**
             * Her ceyrek tum devralmalari bir adim ilerletir ve toplam
             * EBIT etkisini dondurur.
             *
             * Etki TEK BIR ANDA degil ceyreklere yayilir:
             *   - entegrasyon maliyeti once gelir (ilk 4 ceyrek)
             *   - hedefin kari yavas yavas sana gecer
             *   - sinerji en yavas gelen (6 ceyrek)
             *   - hedef hala kazandirmiyorsa 8. ceyrekte serefiye silinir
             */
            // SHELVED — replaced by the read/advance pair below.
            //
            //  It did both jobs in one call, which was fine while the engine
            //  only wanted the number at report time. Once the subsidiaries'
            //  profit had to be TAXED, the number was needed earlier as well,
            //  and a function that advances every deal as a side effect of
            //  being asked a question cannot be asked twice.
            //
            // processAcquisitionsQuarter: (quarters) => {
            //     const { subsidiaries } = get();
            //     ... accumulate dealQuarterEffect, advance, set() ...
            //     return { netEbit, integrationCost, synergy, earnings, impairment };
            // },

            /** Read-only. What the deals are worth this quarter. Taxable. */
            acquisitionsQuarterEffect: (quarters) =>
                runAcquisitionsQuarter(get().subsidiaries, quarters).effect,

            /** Mutation only. Move every deal one quarter further along. */
            advanceAcquisitionsQuarter: (quarters) => {
                set({ subsidiaries: runAcquisitionsQuarter(get().subsidiaries, quarters).updated });
            },

            /**
             * ELDEN CIKARMA.
             *
             * ESKIDEN ODEDIGIN FIYATIN TAMAMINI GERI VERIYORDU. Yani
             * dusmanca devralip hemen satarak primi bedavaya geri
             * aliyordun — devralma risksiz bir denemeye donusuyordu.
             *
             * Artik bugunku ADIL degerden, ustune satis iskontosuyla
             * satiyorsun. Kotu bir islemden cikmanin bedeli var.
             * Bkz. core/market/mergers.ts -> quoteDivestiture
             */
            executeAcquisition: ({ target, hostile, financing, negotiatedPrice }) => {
                const stats = useStatsStore.getState();
                const acquirerValuation = stats.companyValue || 0;
                const risk = (target.risk as TargetRisk) || 'Medium';

                // 1) Teklif — pazarlik varsa fiyati o belirler, kalan
                //    hesaplar (prim, entegrasyon, sinerji) yine ayni yerden.
                const base = quoteAcquisition(target.marketCap, risk, hostile, acquirerValuation);
                const price = negotiatedPrice ?? base.price;
                const premium = Math.max(0, price - target.marketCap);

                // ------------------------------------------------------------
                //  1b) HEDEFIN KURULU SATMAK ISTIYOR MU
                // ------------------------------------------------------------
                //  A friendly offer used to be accepted unconditionally, which
                //  is what made the hostile route pointless - if the polite
                //  path always works, nobody pays the premium for the rude one.
                //  A board that is strong, close to your size and not in
                //  trouble says no, and then hostile is the only way in.
                // ------------------------------------------------------------
                if (!hostile) {
                    const strength = competitorStrengthOf(target.id);
                    const check = boardWillSell(target.marketCap, acquirerValuation, risk, strength);
                    if (check.refuses) {
                        return {
                            success: false,
                            message: check.reason,
                            announcementImpact: 0,
                        };
                    }
                }

                // 2) Finansman
                const shStore = require('../../shareholders/stores/useShareholderStore').useShareholderStore;
                const cap = shStore.getState();
                const fin = quoteFinancing(
                    financing, price, stats.companyCapital || 0, acquirerValuation,
                    stats.companyDebtTotal || 0, stats.companySharePrice || 0,
                    cap.totalShares, cap.playerShareCount, get().getInterestRate(),
                );
                if (!fin.feasible) {
                    return { success: false, message: fin.reason || 'Cannot finance this deal.', announcementImpact: 0 };
                }

                // ------------------------------------------------------------
                //  2b) KURUL ONAYI
                // ------------------------------------------------------------
                //  Degerlemenin %25'ini asan devralmalar oya gider; %50'nin
                //  altindaysan HER devralma oya gider. Dusmanca teklifler
                //  kurulu ayrica tedirgin eder (pahali, dagitici, riskli).
                //
                //  Bu kontrol FINANSMANDAN SONRA, PARA ODENMEDEN ONCE
                //  duruyor: teklifin gercekten yapilabilir oldugunu bilmeden
                //  kurula sormanin anlami yok, ama para cikmadan da
                //  reddedilebilmeli.
                // ------------------------------------------------------------
                const gate = boardGate(
                    'acquisition', price,
                    `${hostile ? 'Hostile bid' : 'Acquisition'}: ${target.name}`,
                    hostile,
                );
                if (gate.needed && !gate.passed) {
                    return {
                        success: false,
                        message: `The board voted it down. ${gate.reason}`,
                        announcementImpact: 0,
                    };
                }

                // 3) Bedeli ode
                if (fin.method === 'cash') {
                    useStatsStore.getState().setCompanyCapital((stats.companyCapital || 0) - price);
                } else if (fin.method === 'debt') {
                    useStatsStore.getState().update({
                        companyDebtTotal: (stats.companyDebtTotal || 0) + fin.debtRaised,
                    });
                } else {
                    shStore.setState((st: any) => ({ totalShares: st.totalShares + fin.sharesIssued }));
                }

                // ------------------------------------------------------------
                //  3b) HEDEFIN KURUCUSU KURULA KATILIR (dostane devralmada)
                // ------------------------------------------------------------
                //  Kurul bugune kadar YALNIZCA basarisizlikla buyuyordu:
                //  tefeciden borc alip odeyememek. Iyi giden bir oyuncunun
                //  kurulu ilk gunku haliyle donuyordu.
                //
                //  Artik her dostane devralma masaya bir kisi daha oturtuyor
                //  ve senin payin bir tik eriyor. Dusmanca devralmada kimse
                //  gelmez — ama %35 prim odersin.
                //
                //  Yani ucuz yol seni yavasca kontrolden eder. Yeterince
                //  buyurse bir gun %50'nin altina dusersin ve kurul sistemi
                //  tam orada devreye girer: BUYUMENIN KENDISI bir risk.
                // ------------------------------------------------------------
                const incoming = directorFromAcquisition(
                    target.name, price, acquirerValuation,
                    shStore.getState().totalShares, risk, hostile,
                );
                if (incoming) {
                    shStore.setState((st: any) => ({
                        totalShares: st.totalShares + incoming.shareCount,
                        members: [...st.members, {
                            id: `DIR_${target.id}_${Date.now()}`,
                            name: incoming.name,
                            shareCount: incoming.shareCount,
                            trait: incoming.trait,
                            trust: incoming.trust,
                            isHostile: false,
                            origin: 'Investor' as const,
                        }],
                    }));
                    shStore.getState().recalculateBoardMood();
                }

                // 4) Istirak kaydi + M&A anlasmasi
                const deal: AcquisitionDeal = {
                    id: target.id,
                    name: target.name,
                    price,
                    fairValue: target.marketCap,
                    premium,
                    targetAnnualEbit: estimateTargetEbit(target.marketCap, risk),
                    quartersSinceClose: 0,
                    goodwill: premium,
                    impaired: false,
                    hostile,
                };

                set(state => ({
                    subsidiaries: [...state.subsidiaries, {
                        id: target.id,
                        name: target.name,
                        sector: target.sector || target.category || 'Conglomerate',
                        valuation: price,
                        acquiredAt: price,
                        strategy: { marketing: 2, rnd: 3, production: 3, workforce: 2 },
                        lastChangePercent: 0,
                        history: [],
                        deal,
                    }],
                }));

                // 5) SHELVED — the buff mirror.
                //    This wrote a SECOND copy of the acquisition into
                //    useUserStore purely so the engine could read a stat bonus
                //    off it. The engine no longer reads it, and keeping the
                //    write would leave a list that only ever grows: sales
                //    remove the company from `subsidiaries` above and never
                //    from this one. The deal record created in step 4 is now
                //    the only place an acquisition exists.
                //
                // if (target.acquisitionBuff) {
                //     try {
                //         require('../../../core/store/useUserStore').useUserStore
                //             .getState()
                //             .addSubsidiary({
                //                 id: target.id,
                //                 name: target.name,
                //                 category: target.category,
                //                 acquisitionBuff: target.acquisitionBuff,
                //             });
                //     } catch { /* buff yazilamadi, islem yine de gecerli */ }
                // }

                // 6) Duyuru tepkisi
                const impact = announcementImpact(
                    premium, acquirerValuation,
                    acquirerValuation > 0 ? price / acquirerValuation : 1,
                    hostile,
                );
                try {
                    const eq = require('./useEquityStore').useEquityStore;
                    eq.setState((st: any) => ({
                        marketMultiplier: Math.max(0.4, st.marketMultiplier * (1 + impact / 100)),
                    }));
                } catch { /* piyasa tepkisi uygulanamadi */ }

                return {
                    success: true,
                    message: `${target.name} acquired for ${formatMoney(price)}.`,
                    announcementImpact: impact,
                };
            },

            sellSubsidiary: (id) => {
                const { subsidiaries } = get();
                const subsidiary = subsidiaries.find(s => s.id === id);
                if (!subsidiary) return;

                const { companyCapital, setCompanyCapital } = useStatsStore.getState();
                const proceeds = subsidiary.deal
                    ? quoteDivestiture(subsidiary.deal).proceeds
                    : subsidiary.valuation * 0.85;

                setCompanyCapital(companyCapital + proceeds);

                // ----------------------------------------------------------
                //  SATTIGIN DEGERLEME PIYASAYA YAZILIR
                // ----------------------------------------------------------
                //  BUG (oyuncu bildirdi: "sattigim degerleme ile oraya
                //  gecmeli"): satis listesi INITIAL_MARKET_ITEMS'tan
                //  okunuyor ve degerleme marketPrices'a gore hesaplaniyordu.
                //  marketPrices'a dokunmadigimiz icin, buyuttugun (ya da
                //  batirdigin) sirket satilinca ILK GUNKU degerlemesiyle
                //  rafa geri donuyordu — bes yil emek verdigin sirketi
                //  satip ertesi ceyrek ayni ucuz fiyattan geri alabiliyordun.
                //
                //  Artik cikis degerlemesi ima edilen hisse fiyatina
                //  cevrilip piyasaya yaziliyor. Sirket rafa senin biraktigin
                //  degerle donuyor.
                // ----------------------------------------------------------
                try {
                    const { INITIAL_MARKET_ITEMS } = require('../../assets/data/marketData');
                    const base: any = (INITIAL_MARKET_ITEMS as any[]).find(x => x.id === id);
                    const exitValuation = subsidiary.valuation || 0;
                    if (base && exitValuation > 0 && (base.marketCap || 0) > 0) {
                        const basePrice = base.price || 100;
                        const impliedPrice = basePrice * (exitValuation / base.marketCap);
                        require('../../../core/store/useMarketStore').useMarketStore.setState(
                            (st: any) => ({
                                marketPrices: { ...st.marketPrices, [id]: impliedPrice },
                            }),
                        );
                    }
                } catch { /* piyasa deposu yoksa sessizce gec */ }

                set(state => ({
                    subsidiaries: state.subsidiaries.filter(s => s.id !== id),
                }));
            },

            updateSubsidiaryStrategy: (id, newStrategy) => {
                const sum = newStrategy.marketing + newStrategy.rnd + newStrategy.production + newStrategy.workforce;
                if (sum > 10) {
                    console.warn('[FinanceStore] Strategy sum exceeds 10');
                    return;
                }

                set((state) => ({
                    subsidiaries: state.subsidiaries.map(s =>
                        s.id === id ? { ...s, strategy: newStrategy } : s
                    )
                }));
            },

            evaluateSubsidiaries: () => {
                const { subsidiaries } = get();

                const updatedSubsidiaries = subsidiaries.map(sub => {
                    const { strategy, sector } = sub;

                    // 1. Determine Strategy Quality
                    // Good Criteria
                    const isTechGood = sector === 'Technology' && strategy.rnd >= 4;
                    const isIndGood = sector === 'Industrial' && strategy.production >= 4;
                    const isRetailGood = sector === 'Retail' && strategy.marketing >= 4;
                    const isFinGood = sector === 'Finance' && strategy.marketing >= 3 && strategy.rnd >= 3;

                    const meetsGoodCriteria = isTechGood || isIndGood || isRetailGood || isFinGood;

                    // Bad Override
                    const isWorkforceBad = strategy.workforce < 2;

                    // Final Decision
                    const isGoodStrategy = meetsGoodCriteria && !isWorkforceBad;

                    // 2. Probability Logic
                    const roll = Math.random() * 100;
                    let changePercent = 0;

                    if (isGoodStrategy) {
                        if (roll < 5) {
                            // 0-5 (5%): Super Growth (+15% to +20%)
                            changePercent = (Math.random() * 0.05) + 0.15;
                        } else if (roll < 65) {
                            // 5-65 (60%): Steady Growth (+1% to +6%)
                            changePercent = (Math.random() * 0.05) + 0.01;
                        } else {
                            // 65-100 (35%): Minor Drop (0% to -4%)
                            // Assuming 0 to -4 means change is between -0.04 and 0.
                            changePercent = -(Math.random() * 0.04);
                        }
                    } else {
                        // BAD STRATEGY (or not good)
                        if (roll < 8) {
                            // 0-8 (8%): Crash (-15% to -20%)
                            changePercent = -((Math.random() * 0.05) + 0.15);
                        } else if (roll < 60) {
                            // 8-60 (52%): Decline (0% to -6%)
                            changePercent = -(Math.random() * 0.06);
                        } else {
                            // 60-100 (40%): Stagnation (0% to -2%)
                            changePercent = -(Math.random() * 0.02);
                        }
                    }

                    // 3. Update Subsidiary
                    const newValuation = sub.valuation * (1 + changePercent);
                    const newHistory = [changePercent * 100, ...sub.history].slice(0, 4);

                    return {
                        ...sub,
                        valuation: newValuation,
                        lastChangePercent: changePercent * 100, // Stored as percentage number (e.g. 12.5 for 12.5%)
                        history: newHistory
                    };
                });

                set({ subsidiaries: updatedSubsidiaries });
            },

            attemptToSellCompany: (id, askingPrice) => {
                const state = get();
                const company = state.subsidiaries.find((s) => s.id === id);

                if (!company) return { success: false, msg: "Company not found." };

                // 1. Calculate Markup
                const markup = (askingPrice - company.valuation) / company.valuation;

                // 2. Probability: Base 80%, -2% for every 1% markup
                let successChance = 0.80 - (markup * 2.0);

                // Clamp Chance (0 to 1)
                if (successChance < 0) successChance = 0;
                if (successChance > 1) successChance = 1;

                console.log(`Sell Attempt: Ask $${askingPrice}, Chance ${(successChance * 100).toFixed(1)}%`);

                // 3. Roll Dice
                if (Math.random() <= successChance) {
                    // SUCCESS
                    const { companyCapital, setCompanyCapital } = useStatsStore.getState();
                    setCompanyCapital(companyCapital + askingPrice);

                    set((state) => ({
                        subsidiaries: state.subsidiaries.filter((s) => s.id !== id),
                    }));
                    return { success: true, price: askingPrice, msg: "Sold!" };
                } else {
                    // FAIL: -5% Valuation Penalty
                    const newVal = Math.floor(company.valuation * 0.95);
                    set((state) => ({
                        subsidiaries: state.subsidiaries.map((s) =>
                            s.id === id ? { ...s, valuation: newVal } : s
                        )
                    }));
                    return { success: false, msg: "Buyers rejected. Valuation dropped 5%." };
                }
            },

            // --- CAPITAL INJECTION ---

            injectCapital: (amount) => {
                const { money, subtractMoney, companyCapital, setCompanyCapital } = useStatsStore.getState();

                if (money < amount) {
                    return { success: false, msg: 'Insufficient personal funds.' };
                }

                subtractMoney(amount);
                setCompanyCapital(companyCapital + amount);

                // KURUCUNUN KENDI PARASINI KOYMASI en guclu olumlu
                // sinyaldir. Finansta "skin in the game" denir; iceriden
                // alim, piyasanin en cok guvendigi isarettir.
                //
                // DIKKAT: bu satir `return`DEN SONRA duruyordu, yani HIC
                // CALISMIYORDU. Sermaye enjeksiyonunun +%4 hisse etkisi
                // yazildigi gunden beri hic uygulanmamis.
                applyFinancingSignal('capital_injection');

                return {
                    success: true,
                    msg: `Injected ${formatMoney(amount)} into company.`
                };
            },

            reset: () => {
                set({
                    loans: [],
                    creditScore: 750,
                    totalDebt: 0,
                    subsidiaries: []
                });
            }
        }),
        {
            name: 'subsidiary-storage',
            storage: createJSONStorage(() => zustandStorage)
        }
    )
);
