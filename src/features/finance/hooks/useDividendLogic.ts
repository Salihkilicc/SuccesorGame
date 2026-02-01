import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../stores/useEquityStore';

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

    // Financial Calculations
    // Distribution is % of Company Capital
    const distributionAmount = (companyCapital * dividendPercentage) / 100;

    // Effect on Company
    const remainingCapital = companyCapital - distributionAmount;

    // Effect on Player (preview - actual will come from equity store)
    const playerSharePercentage = getPlayerOwnership();
    const playerDividend = (distributionAmount * playerSharePercentage) / 100;

    // Risk Check: Warn if remaining capital < 20% of CURRENT capital
    const isRisky = remainingCapital < (companyCapital * 0.2);

    // Actions
    const handleConfirm = () => {
        if (remainingCapital < 0) {
            Alert.alert("Error", "Insufficient funds!");
            return;
        }

        // Calculate amount per share for equity store
        const amountPerShare = distributionAmount / totalShares;

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

        Alert.alert(
            "Success",
            `$${(result.playerPortion / 1_000_000).toFixed(2)}M Dividend Paid!`,
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
        handleConfirm
    };
};
