import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';

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
 */
export const useDividendLogic = (visible: boolean, onClose: () => void): DividendLogicResult => {
    // Local State
    const [dividendPercentage, setDividendPercentage] = useState(10);

    // Store Data
    const companyCapital = useStatsStore((state: any) => state.companyCapital || 0);
    const companyOwnership = useStatsStore((state: any) => state.companyOwnership || 0);
    const payDividend = useStatsStore((state: any) => state.payDividend);

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

    // Effect on Player
    const playerDividend = (distributionAmount * companyOwnership) / 100;

    // Risk Check: Warn if remaining capital < 20% of CURRENT capital
    const isRisky = remainingCapital < (companyCapital * 0.2);

    // Actions
    const handleConfirm = () => {
        if (remainingCapital < 0) {
            Alert.alert("Error", "Insufficient funds!");
            return;
        }

        // Call the store action
        payDividend(dividendPercentage);

        console.log('[DividendLogic] Confirmed:', {
            amount: distributionAmount,
            remaining: remainingCapital
        });

        Alert.alert(
            "Success",
            `$${(playerDividend / 1_000_000).toFixed(2)}M Dividend Paid!`,
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
        playerSharePercentage: companyOwnership,
        isRisky,
        handleConfirm
    };
};
