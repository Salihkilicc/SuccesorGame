import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import {
    BUYBACK_PRICE_SUPPORT,
    DILUTION_PRICE_PRESSURE,
    ownershipPercent,
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
    goPublic: (valuation: number, addCashFn: (amount: number) => void) => { cashRaised: number; sharesSold: number; newOwnershipPercent: number };
    executeBuyback: (amountToSpend: number, currentValuation: number, spendCashFn: (amount: number) => void) => { sharesBurned: number; newOwnershipPercent: number };
    executeDilution: (percentToSell: number, currentValuation: number, addCashFn: (amount: number) => void) => { newShares: number; capitalRaised: number; newOwnershipPercent: number };
    distributeDividend: (amountPerShare: number, spendCashFn: (amount: number) => void) => { totalRequired: number; playerPortion: number; isAffordable: boolean };

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

            // ---- IPO ----
            goPublic: (valuation, addCashFn) => {
                const stats = useStatsStore.getState();
                if (stats.isPublic) {
                    return { cashRaised: 0, sharesSold: 0, newOwnershipPercent: get().getPlayerOwnership() };
                }

                const cap = readCapTable();
                // Halka arzda YENI hisse cikarilir; oyuncunun hisseleri
                // yerinde kalir ama toplam artar, yani orantili seyrelir.
                const sharesToSell = Math.floor(cap.totalShares * 0.20);
                const cashRaised = sharePrice(valuation, cap.totalShares) * sharesToSell;

                addCashFn(cashRaised);
                shareholderStore().setState({ totalShares: cap.totalShares + sharesToSell });
                useStatsStore.getState().setIsPublic(true);

                // IPO coskusu — bir sure fiyati yukari tasir
                set({ marketMultiplier: 1.5 });
                get().syncStockPrice(valuation);

                return {
                    cashRaised,
                    sharesSold: sharesToSell,
                    newOwnershipPercent: get().getPlayerOwnership(),
                };
            },

            // ---- GERI ALIM ----
            executeBuyback: (amountToSpend, currentValuation, spendCashFn) => {
                const cap = readCapTable();
                const price = useStatsStore.getState().companySharePrice || 0;
                if (amountToSpend <= 0 || price <= 0) {
                    return { sharesBurned: 0, newOwnershipPercent: get().getPlayerOwnership() };
                }

                const wanted = Math.floor(amountToSpend / price);
                // Yalnizca halka acik dolasimdaki hisse geri alinabilir.
                const burned = Math.min(wanted, cap.publicShares);
                if (burned <= 0) {
                    return { sharesBurned: 0, newOwnershipPercent: get().getPlayerOwnership() };
                }

                spendCashFn(burned * price);
                shareholderStore().setState({ totalShares: cap.totalShares - burned });

                // Arz azaldi, sinyal olumlu: fiyat destek gorur.
                const impact = (burned / cap.totalShares) * BUYBACK_PRICE_SUPPORT;
                set(state => ({ marketMultiplier: state.marketMultiplier + impact }));
                get().syncStockPrice(currentValuation);

                return { sharesBurned: burned, newOwnershipPercent: get().getPlayerOwnership() };
            },

            // ---- SEYRELTME ----
            executeDilution: (percentToSell, valuation, addCashFn) => {
                const cap = readCapTable();
                const decimal = Math.max(0, Math.min(0.9, percentToSell / 100));
                const newTotal = Math.floor(cap.totalShares / (1 - decimal));
                const sharesCreated = newTotal - cap.totalShares;
                const cashRaised = sharePrice(valuation, cap.totalShares) * sharesCreated;

                addCashFn(cashRaised);
                shareholderStore().setState({ totalShares: newTotal });

                // Yeni hisse cikarmak piyasada olumsuz sinyaldir.
                const impact = decimal * DILUTION_PRICE_PRESSURE;
                set(state => ({ marketMultiplier: Math.max(0.1, state.marketMultiplier - impact) }));
                get().syncStockPrice(valuation);

                return {
                    newShares: sharesCreated,
                    capitalRaised: cashRaised,
                    newOwnershipPercent: get().getPlayerOwnership(),
                };
            },

            // ---- TEMETTU ----
            distributeDividend: (amountPerShare, spendCashFn) => {
                const cap = readCapTable();
                const totalCost = amountPerShare * cap.totalShares;
                const playerCut = amountPerShare * cap.playerShares;

                spendCashFn(totalCost);
                usePlayerStore.getState().earnMoney(playerCut);

                return { totalRequired: totalCost, playerPortion: playerCut, isAffordable: true };
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
