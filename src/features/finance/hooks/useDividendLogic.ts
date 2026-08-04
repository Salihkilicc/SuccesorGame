import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useGameStore } from '../../../core/store/useGameStore';
import { quoteDividend } from '../../../core/market/equity';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../stores/useEquityStore';
import { formatMoney } from '../../../core/utils';

export interface DividendLogicResult {
    // State
    dividendPercentage: number;
    setDividendPercentage: (val: number) => void;

    // Calculated Values
    availableCash: number;
    distributionAmount: number;
    playerDividend: number;
    remainingCapital: number;
    playerSharePercentage: number;
    isRisky: boolean;
    /** Temettunun kaynagi: gecen ceyregin kari */
    lastQuarterProfit: number;
    /** Hisse basina dagitilan */
    perShare: number;
    /** Yillik temettu getirisi (yuzde) */
    annualYieldPercent: number;
    /** Kar yokken dagitiliyor mu — kirmizi bayrak */
    fundedFromReserves: boolean;
    /** Nakit yetiyor mu */
    affordable: boolean;

    // Actions
    handleConfirm: () => void;
}

/**
 * Hook: useDividendLogic
 * 
 * Handles business logic for DividendModal.
 * - Auto-resets state when modal opens/closes.
 * - Calculates financial projections.
 * 
 * REFACTORED: Now uses useEquityStore for centralized equity management.
 */
export const useDividendLogic = (visible: boolean, onClose: () => void): DividendLogicResult => {
    // Local State
    const [dividendPercentage, setDividendPercentage] = useState(10);

    // Store Data
    const companyCapital = useStatsStore((state) => state.companyCapital || 0);

    // Equity Store Data
    const totalShares = useEquityStore((state) => state.totalShares);
    const getPlayerOwnership = useEquityStore((state) => state.getPlayerOwnership);

    // BUG FIX: State Reset Logic
    useEffect(() => {
        if (visible) {
            // When modal opens, reset to default safe value
            setDividendPercentage(10);
        } else {
            // When modal closes, reset to 0 to prevent "stuck" value ghosting
            setDividendPercentage(0);
        }
    }, [visible]);

    // ------------------------------------------------------------------
    //  TEMETTU ARTIK KARIN YUZDESI, NAKDIN DEGIL
    // ------------------------------------------------------------------
    //  Eskiden "sermayenin %10'unu dagit" idi. O bir temettu degil,
    //  kismi tasfiyedir: kar etmeyen bir sirket bile kasasini bosaltip
    //  dagitabiliyordu. Gercek sirketler KARDAN dagitir; dagitim orani
    //  olgunluk isaretidir, zarardayken dagitmak ise kirmizi bayraktir.
    //  Bkz. core/market/equity.ts -> quoteDividend
    // ------------------------------------------------------------------
    const lastQuarterProfit = useGameStore(state => state.lastQuarterProfit) || 0;
    const sharePriceNow = useStatsStore(state => state.companySharePrice || 0);
    const playerShares = useEquityStore(state => state.playerShares);

    const quote = quoteDividend(
        dividendPercentage / 100,
        lastQuarterProfit,
        companyCapital,
        totalShares,
        playerShares,
        sharePriceNow,
    );

    const distributionAmount = quote.total;
    const remainingCapital = companyCapital - distributionAmount;
    const playerSharePercentage = getPlayerOwnership();
    const playerDividend = quote.playerCut;

    // Kasanin beste birinden fazlasini goturuyorsa veya kar yokken
    // dagitiliyorsa uyar.
    const isRisky =
        quote.fundedFromReserves || remainingCapital < companyCapital * 0.2;

    // Actions
    const handleConfirm = () => {
        if (remainingCapital < 0) {
            Alert.alert("Error", "Insufficient funds!");
            return;
        }

        const amountPerShare = quote.perShare;

        // Execute dividend distribution via Equity Store
        const result = useEquityStore.getState().distributeDividend(
            amountPerShare,
            (amount) => {
                const currentCapital = useStatsStore.getState().companyCapital;
                useStatsStore.getState().update({ companyCapital: currentCapital - amount });
            }
        );

        console.log('[DividendLogic] Dividend distributed:', {
            totalRequired: result.totalRequired,
            playerPortion: result.playerPortion,
            remaining: companyCapital - result.totalRequired
        });

        // Brut/net/vergi AYRI gosterilir. Once yalnizca tek bir rakam
        // vardi ve oyuncu kasasindaki degisimle eslestiremiyordu.
        Alert.alert(
            'Dividend paid',
            `The company paid out ${formatMoney(result.totalRequired)} in total.\n\n` +
            `Your share: ${formatMoney(result.playerGross)}\n` +
            `Dividend tax: −${formatMoney(result.tax)}\n` +
            `Into your personal account: ${formatMoney(result.playerPortion)}\n\n` +
            `The company already paid corporate tax on this profit — you are taxed on it ` +
            `a second time. That is why buybacks are often the cheaper way to return cash.`,
            [
                {
                    text: "OK",
                    onPress: () => {
                        // Explicit Reset before closing
                        setDividendPercentage(0);
                        onClose();
                    }
                }
            ]
        );
    };

    return {
        dividendPercentage,
        setDividendPercentage,
        availableCash: companyCapital,
        distributionAmount,
        playerDividend,
        remainingCapital,
        playerSharePercentage,
        isRisky,
        // Yeni: yatirimcinin gercekten baktigi sayilar
        lastQuarterProfit,
        perShare: quote.perShare,
        annualYieldPercent: quote.annualYieldPercent,
        fundedFromReserves: quote.fundedFromReserves,
        affordable: quote.affordable,
        handleConfirm
    };
};
