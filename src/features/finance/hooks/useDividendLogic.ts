import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../store/useStatsStore';

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
    const money = useStatsStore((state: any) => state.money || 0);

    // Business Logic Constants
    const DIVIDEND_POOL_RATIO = 0.5; // 50% of cash available
    const PLAYER_SHARE_PCT = 100;    // 100% ownership

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
    // 1. Pool is 50% of total money
    const dividendPool = money * DIVIDEND_POOL_RATIO;

    // 2. Distribution is % of that Pool (NOT % of total money directly)
    // Formula: (Pool * Slider%) / 100
    const distributionAmount = (dividendPool * dividendPercentage) / 100;

    // 3. Effect on Company
    const remainingCapital = money - distributionAmount;

    // 4. Effect on Player
    const playerDividend = (distributionAmount * PLAYER_SHARE_PCT) / 100;

    // Risk Check: Warn if remaining capital < 20% of CURRENT total money
    const isRisky = remainingCapital < (money * 0.2);

    // Actions
    const handleConfirm = () => {
        if (remainingCapital < 0) {
            Alert.alert("Error", "Insufficient funds!");
            return;
        }

        // TODO: Integrate actual store action
        // useStatsStore.getState().distributeDividend(distributionAmount);

        console.log('[DividendLogic] Confirmed:', {
            amount: distributionAmount,
            remaining: remainingCapital
        });

        Alert.alert(
            "Success",
            `$${(playerDividend / 1000).toFixed(1)}k Dividend Paid!`,
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
        availableCash: money,
        distributionAmount,
        playerDividend,
        remainingCapital,
        playerSharePercentage: PLAYER_SHARE_PCT,
        isRisky,
        handleConfirm
    };
};
