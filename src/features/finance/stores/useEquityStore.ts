import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import {
    BUYBACK_PRICE_SUPPORT,
    DILUTION_PRICE_PRESSURE,
    DIVIDEND_SENTIMENT_BOOST,
    IPO_HYPE_MULTIPLIER,
    IPO_MIN_VALUATION,
    ownershipPercent,
    quoteBuyback,
    quoteIpo,
    quoteSecondary,
    DIVIDEND_TAX,
    quoteSecondarySale,
    sharePrice,
} from '../../../core/market/equity';

/**
 * ============================================================================
 *  EQUITY STORE — artik KENDI kap tablosunu TUTMUYOR
 * ============================================================================
 *
 *  ESKI HALI OYUNUN EN BUYUK SAYI HATASIYDI.
 *
 *  Bu store kendi icinde `totalShares: 1_000_000` ve
 *  `playerShares: 1_000_000` tutuyordu — yani oyuncu %100 sahip
 *  gorunuyordu. Oysa ayni anda:
 *
 *    useShareholderStore : 10.000.000 hisse, oyuncuda 6.500.000 (%65)
 *    useStatsStore       : companyOwnership = 65
 *
 *  Stock Market ekrani BU store'u okudugu icin "%100 senin" yaziyordu.
 *  Ayrica fiyat 10 kat sapiyordu: biri degerlemeyi 1M'e, digeri 10M'e
 *  boluyordu.
 *
 *  SIMDI: kap tablosu TEK yerde — useShareholderStore. Bu store onun
 *  uzerine ince bir katman: hisse sayilarini oradan okur, fiyati
 *  statsStore'dan alir, islemleri (IPO, seyreltme, geri alim) oraya
 *  yazar. Kendi state'inde yalnizca piyasa duygusu ve fiyat gecmisi
 *  kalir — bunlarin baska sahibi yok.
 *
 *  Mevcut 13 dosya ayni API'yi kullanmaya devam ediyor; degisen tek sey
 *  sayilarin nereden geldigi.
 * ============================================================================
 */
export interface EquityState {
    /** Piyasa duygusu carpani. 1.0 = normal, >1 = coskulu */
    marketMultiplier: number;
    priceHistory: number[];

    // --- Turetilmis alanlar (kap tablosundan okunur) ---
    totalShares: number;
    publicShares: number;
    playerShares: number;
    stockPrice: number;
    isPublic: boolean;

    syncStockPrice: (valuation: number) => void;
    goPublic: (valuation: number, addCashFn: (amount: number) => void, floatRatio?: number) => { cashRaised: number; sharesSold: number; newOwnershipPercent: number; fee: number; leftOnTable: number; error?: string };
    executeBuyback: (amountToSpend: number, currentValuation: number, spendCashFn: (amount: number) => void) => { sharesBurned: number; newOwnershipPercent: number };
    executeDilution: (percentToSell: number, currentValuation: number, addCashFn: (amount: number) => void) => { newShares: number; capitalRaised: number; newOwnershipPercent: number };
    /**
     * KENDI HISSENI SAT. Para SIRKETE degil SANA gider (vergi dusulur).
     * Yeni hisse basilmaz, toplam degismez — yalnizca sahiplik degisir.
     */
    sellOwnShares: (sharesToSell: number, addPersonalCashFn: (n: number) => void) =>
        { netToFounder: number; tax: number; newOwnershipPercent: number; error?: string };
    distributeDividend: (amountPerShare: number, spendCashFn: (amount: number) => void) => { totalRequired: number; playerPortion: number; playerGross: number; tax: number; isAffordable: boolean };

    getPlayerOwnership: () => number;
    getMarketCap: () => number;
    /** Kap tablosundaki degisiklikten sonra turetilmis alanlari tazeler */
    refresh: () => void;
    reset: () => void;
}

const updatePriceHistory = (history: number[], newPrice: number): number[] => {
    const updated = [...history, newPrice];
    if (updated.length > 12) updated.shift();
    return updated;
};

/**
 * Kap tablosuna TEMBEL erisim.
 * useShareholderStore bu dosyayi import ediyor; ust seviye import
 * dongu yaratip TypeScript'in store tiplerini `never` cikarmasina
 * sebep oluyordu.
 */
const shareholderStore = () =>
    require('../../shareholders/stores/useShareholderStore').useShareholderStore;

/** Kap tablosunu TEK kaynaktan oku. */
const readCapTable = () => {
    const sh = shareholderStore().getState();
    const totalShares = sh.totalShares || 10_000_000;
    const playerShares = sh.playerShareCount ?? 0;
    const insiderShares = (sh.members || []).reduce((sum: number, m: any) => sum + (m.shareCount || 0), 0);
    // Kalan kisim halka acik dolasimdir.
    const publicShares = Math.max(0, totalShares - playerShares - insiderShares);
    return { totalShares, playerShares, insiderShares, publicShares };
};

export const useEquityStore = create<EquityState>()(
    persist<EquityState>(
        (set, get) => ({
            marketMultiplier: 1.0,
            priceHistory: [] as number[],

            totalShares: 10_000_000,
            publicShares: 0,
            playerShares: 6_500_000,
            stockPrice: 0,
            isPublic: false,

            refresh: () => {
                const cap = readCapTable();
                const stats = useStatsStore.getState();
                set({
                    totalShares: cap.totalShares,
                    playerShares: cap.playerShares,
                    publicShares: cap.publicShares,
                    stockPrice: stats.companySharePrice || 0,
                    isPublic: !!stats.isPublic,
                });
            },

            syncStockPrice: (valuation) => {
                const cap = readCapTable();
                const { marketMultiplier, priceHistory } = get();
                const finalPrice = sharePrice(valuation, cap.totalShares) * marketMultiplier;

                useStatsStore.getState().setCompanySharePrice(finalPrice);
                set({
                    stockPrice: finalPrice,
                    priceHistory: updatePriceHistory(priceHistory, finalPrice),
                    totalShares: cap.totalShares,
                    playerShares: cap.playerShares,
                    publicShares: cap.publicShares,
                    isPublic: !!useStatsStore.getState().isPublic,
                });
            },

            // ---- HALKA ARZ ----
            //  ESKIDEN BEDAVAYDI: sabit %20 satiliyor, degerleme neyse o
            //  kadar nakit geliyordu. Gercekte iki buyuk kesinti var:
            //  aracilik komisyonu (%7) ve halka arz iskontosu (%12).
            //  Ikincisi kasten yapilir — talep dolsun diye hisse adil
            //  degerin altinda fiyatlanir. Literaturde "masada birakilan
            //  para" denir ve halka arzi otomatik bir kazanc olmaktan
            //  cikaran sey tam olarak budur.
            goPublic: (valuation, addCashFn, floatRatio = 0.20) => {
                const stats = useStatsStore.getState();
                const cap = readCapTable();
                const fail = (error: string) => ({
                    cashRaised: 0, sharesSold: 0,
                    newOwnershipPercent: get().getPlayerOwnership(),
                    fee: 0, leftOnTable: 0, error,
                });

                if (stats.isPublic) return fail('Already public.');
                if (valuation < IPO_MIN_VALUATION) {
                    return fail(
                        `Underwriters will not take you public below ${Math.round(IPO_MIN_VALUATION / 1_000_000)}M in valuation.`
                    );
                }

                const q = quoteIpo(valuation, cap.totalShares, cap.playerShares, floatRatio);

                addCashFn(q.netProceeds);
                shareholderStore().setState({ totalShares: cap.totalShares + q.newShares });
                useStatsStore.getState().setIsPublic(true);

                // Ilk gun coskusu. Artik KALICI DEGIL: her ceyrek 1.0'a
                // dogru soner (bkz. decaySentiment). Once sonumleme yoktu
                // ve fiyat sonsuza kadar %50 sisik kaliyordu.
                set({ marketMultiplier: IPO_HYPE_MULTIPLIER });
                get().syncStockPrice(valuation);

                return {
                    cashRaised: q.netProceeds,
                    sharesSold: q.newShares,
                    newOwnershipPercent: q.playerOwnershipAfter,
                    fee: q.underwritingFee,
                    leftOnTable: q.moneyLeftOnTable,
                };
            },

            // ---- GERI ALIM ----
            //  Yalnizca HALKA ACIK dolasimdaki hisse geri alinabilir; ozel
            //  sirkette geri alinacak bir sey yoktur.
            //
            //  ISLEM PRIMI: buyuk bir blok almak fiyati sana karsi yukseltir.
            //  Dolasimin yarisini almaya kalkarsan ortalama gerceklesme
            //  fiyatin ciddi sekilde artar. Once bu yoktu ve geri alim
            //  bedava bir sahiplik artirma yoluydu.
            executeBuyback: (amountToSpend, currentValuation, spendCashFn) => {
                const cap = readCapTable();
                const price = useStatsStore.getState().companySharePrice || 0;
                const q = quoteBuyback(amountToSpend, price, cap.totalShares, cap.playerShares, cap.publicShares);

                if (q.shares <= 0) {
                    return { sharesBurned: 0, newOwnershipPercent: get().getPlayerOwnership() };
                }

                spendCashFn(q.totalCost);
                shareholderStore().setState({ totalShares: cap.totalShares - q.shares });

                // Arz azaldi, sinyal olumlu: fiyat destek gorur.
                const impact = q.floatConsumed * BUYBACK_PRICE_SUPPORT * 0.15;
                set(state => ({ marketMultiplier: state.marketMultiplier + impact }));
                get().syncStockPrice(currentValuation);

                return { sharesBurned: q.shares, newOwnershipPercent: q.playerOwnershipAfter };
            },

            // ---- IKINCIL ARZ (SEYRELTME) ----
            //  Yeni hisse ADIL fiyattan degil, ISKONTOLU satilir (%8) ve
            //  ustune komisyon vardir (%4). Once iskontosuz ve komisyonsuzdu,
            //  yani "istedigin an degerlemenden nakit basmak" gibiydi.
            executeDilution: (percentToSell, valuation, addCashFn) => {
                const cap = readCapTable();
                const decimal = Math.max(0, Math.min(0.5, percentToSell / 100));
                const price = useStatsStore.getState().companySharePrice
                    || sharePrice(valuation, cap.totalShares);

                const q = quoteSecondary(price, cap.totalShares, cap.playerShares, decimal);
                const sharesCreated = q.newShares;
                const cashRaised = q.netProceeds;

                addCashFn(cashRaised);
                shareholderStore().setState({ totalShares: cap.totalShares + sharesCreated });

                // Yeni hisse cikarmak piyasada olumsuz sinyaldir.
                const impact = decimal * DILUTION_PRICE_PRESSURE;
                set(state => ({ marketMultiplier: Math.max(0.1, state.marketMultiplier - impact) }));
                get().syncStockPrice(valuation);

                return {
                    newShares: sharesCreated,
                    capitalRaised: cashRaised,
                    newOwnershipPercent: q.playerOwnershipAfter,
                };
            },

            // ---- TEMETTU ----
            //  Istikrar sinyalidir: piyasa olumlu karsilar.
            // ---- KENDI HISSENI SAT (ikincil satis) ----
            //  Para SIRKETE DEGIL SANA gider. Yeni hisse basilmaz, toplam
            //  degismez — yalnizca sahiplik el degistirir. Yukaridaki
            //  seyreltmenin tam tersi ve ikisi ayri ekranda olmali.
            sellOwnShares: (sharesToSell, addPersonalCashFn) => {
                const cap = readCapTable();
                const stats = useStatsStore.getState();
                const price = stats.companySharePrice || 0;

                if (price <= 0) {
                    return {
                        netToFounder: 0, tax: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                        error: 'No share price yet.',
                    };
                }
                // En az %10 sende kalmali.
                const floor = cap.totalShares * 0.10;
                if (cap.playerShares - sharesToSell < floor) {
                    return {
                        netToFounder: 0, tax: 0,
                        newOwnershipPercent: get().getPlayerOwnership(),
                        error: 'You cannot go below 10%. Below that you are a passenger, not a founder.',
                    };
                }

                const q = quoteSecondarySale(sharesToSell, price, cap.playerShares, cap.totalShares);

                // Hisseler dolasima gecer: TOPLAM DEGISMEZ, yalnizca senden cikar.
                shareholderStore().setState({ playerShareCount: cap.playerShares - q.sharesSold });
                addPersonalCashFn(q.netToFounder);

                // Iceriden satis piyasanin en guclu olumsuz isaretlerinden biri.
                const drop = Math.min(0.35, (q.sharesSold / cap.totalShares) * 1.2);
                set(state => ({ marketMultiplier: Math.max(0.3, state.marketMultiplier * (1 - drop)) }));
                get().refresh();

                return {
                    netToFounder: q.netToFounder,
                    tax: q.tax,
                    newOwnershipPercent: q.newOwnershipPercent,
                };
            },

            distributeDividend: (amountPerShare, spendCashFn) => {
                const cap = readCapTable();
                const totalCost = amountPerShare * cap.totalShares;
                const playerGross = amountPerShare * cap.playerShares;

                // ----------------------------------------------------------
                //  PARA GORUNMEZ BIR DEPOYA GIDIYORDU
                // ----------------------------------------------------------
                //  `usePlayerStore.earnMoney` cagriliyordu ve o store
                //  `core.money` tutuyor. Ama oyunun her yeri (ve az once
                //  yazdigim hisse satisi dahil) `useStatsStore.money`
                //  okuyor. Yani temettu "odendi" diyor, para hicbir ekranda
                //  gorunmuyordu.
                //
                //  Bu projede ONUNCU kez ayni desen: ayni sey iki yerde
                //  tutuluyor, biri digerini bilmiyor. Kisisel nakit artik
                //  TEK yerde — useStatsStore.money.
                //
                //  TEMETTU VERGISI: sirket zaten kurumlar vergisi odedi,
                //  sen de temettu vergisi odersin. Finansta buna "cifte
                //  vergilendirme" denir ve sirketlerin neden temettu yerine
                //  hisse geri alimi tercih ettiginin bir numarali sebebidir.
                // ----------------------------------------------------------
                const tax = playerGross * DIVIDEND_TAX;
                const playerNet = playerGross - tax;

                spendCashFn(totalCost);
                const st = useStatsStore.getState();
                st.update({ money: (st.money || 0) + playerNet });

                set(state => ({
                    marketMultiplier: state.marketMultiplier + DIVIDEND_SENTIMENT_BOOST,
                }));

                // Kurul temettu istediyse, bu odeme talebi kapatir.
                // Talebi ACAN uye ozellikle memnun olur.
                try {
                    require('../../shareholders/stores/useShareholderStore')
                        .useShareholderStore.getState().satisfyDemand('pay_dividend');
                } catch { /* kurul modulu yoksa sessiz gec */ }

                return {
                    totalRequired: totalCost,
                    playerPortion: playerNet,
                    playerGross,
                    tax,
                    isAffordable: true,
                };
            },

            getPlayerOwnership: () => {
                const cap = readCapTable();
                return ownershipPercent(cap.playerShares, cap.totalShares);
            },

            getMarketCap: () => {
                const cap = readCapTable();
                return (useStatsStore.getState().companySharePrice || 0) * cap.totalShares;
            },

            reset: () => {
                set({
                    marketMultiplier: 1.0,
                    priceHistory: [] as number[],
                    totalShares: 10_000_000,
                    publicShares: 0,
                    playerShares: 6_500_000,
                    stockPrice: 0,
                    isPublic: false,
                });
            },
        }),
        {
            // Surum yukseltildi: eski kayitlar 1M hisseli yanlis kap
            // tablosunu tasiyordu, tasinmalari degil ATILMALARI gerekiyor.
            name: 'succesor_equity_v2',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({
                marketMultiplier: state.marketMultiplier,
                priceHistory: state.priceHistory,
            }) as any,
        }
    )
);
