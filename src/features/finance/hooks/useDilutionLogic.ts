import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { boardGate } from '../stores/useCorporateFinanceStore';
import { useEquityStore } from '../stores/useEquityStore';
import { formatMoney } from '../../../core/utils';
import { t } from '../../../core/i18n';

export interface DilutionLogicResult {
    // State
    dilutionPercentage: number;
    setDilutionPercentage: (val: number) => void;

    // Calculated Values
    capitalRaised: number;
    newOwnership: number;
    estimatedNewSharePrice: number;
    currentOwnership: number;
    currentStockPrice: number;

    // Actions
    handleConfirm: () => void;
}

/**
 * Hook: useDilutionLogic
 * 
 * Handles business logic for DilutionModal.
 * - Manages dilution percentage state.
 * - Calculates capital raised and ownership impact.
 * - Executes dilution action via EQUITY STORE.
 * 
 * REFACTORED: Now uses useEquityStore for centralized equity management.
 */
export const useDilutionLogic = (visible: boolean, onClose: () => void): DilutionLogicResult => {
    // Local State
    const [dilutionPercentage, setDilutionPercentage] = useState(5);

    // Store Data
    const companyValue = useStatsStore((state) => state.companyValue || 0);
    const companyCapital = useStatsStore((state) => state.companyCapital || 0);

    // Equity Store Data
    const stockPrice = useEquityStore((state) => state.stockPrice);
    const getPlayerOwnership = useEquityStore((state) => state.getPlayerOwnership);

    // Reset Condition
    useEffect(() => {
        if (visible) {
            setDilutionPercentage(5);
        }
    }, [visible]);

    // Financial Calculations
    const currentOwnership = getPlayerOwnership();

    // 1. Preview calculations (actual values will come from equity store)
    const capitalRaised = companyValue * (dilutionPercentage / 100);
    const newOwnership = currentOwnership * (1 - (dilutionPercentage / 100));

    // 2. Estimated Price Drop (5% market shock from dilution)
    const estimatedNewSharePrice = stockPrice * 0.95;

    // Actions
    const handleConfirm = () => {
        Alert.alert(
            "Confirm Dilution",
            `Diluting shares by ${dilutionPercentage}%.\n\n` +
            `⚠️ Market Shock: Stock price will drop by 5%\n\n` +
            `Your ownership will drop to ${newOwnership.toFixed(1)}%.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm & Sell",
                    style: "destructive",
                    onPress: () => {
                        // ------------------------------------------------------
                        //  THE BOARD DECIDES THIS ONE
                        // ------------------------------------------------------
                        //  Issuing shares was the one big capital decision that
                        //  never reached the board. governance.ts lists
                        //  'dilution' as a proposal kind and gives every
                        //  temperament a stance on it (Conservative -0.9,
                        //  Aggressive +0.5), and nothing ever called for the
                        //  vote - only acquisitions did.
                        //
                        //  That left an unlimited money printer: dilute, the
                        //  cash raises the valuation, dilute again against the
                        //  larger valuation. The player's report was "I can buy
                        //  any company I want, my own value does not matter".
                        //
                        //  Now it goes through the same gate as an acquisition.
                        //  While you hold a majority you still win the vote -
                        //  but against the board's advice that is an override,
                        //  and overrides cost trust and can trigger resignations.
                        // ------------------------------------------------------
                        const gate = boardGate(
                            'dilution',
                            capitalRaised,
                            t('equity.shareDilution'),
                        );
                        if (gate.needed && !gate.passed) {
                            Alert.alert(t('gov.boardRejected'), gate.reason);
                            onClose();
                            return;
                        }

                        // Execute dilution via Equity Store
                        const result = useEquityStore.getState().executeDilution(
                            dilutionPercentage,
                            companyValue,
                            (amount) => {
                                const currentCapital = useStatsStore.getState().companyCapital;
                                useStatsStore.getState().update({ companyCapital: currentCapital + amount });
                            }
                        );

                        // Update stats ownership (optional sync)
                        useStatsStore.getState().update({
                            companyOwnership: result.newOwnershipPercent
                        });

                        console.log('[DilutionLogic] Dilution executed:', result);

                        Alert.alert(
                            "Success",
                            `${formatMoney(result.capitalRaised)} Raised!\n` +
                            `New Ownership: ${result.newOwnershipPercent.toFixed(1)}%` +
                            (gate.needed ? `\n\n${gate.reason}` : ''),
                        );
                        onClose();
                    }
                }
            ]
        );
    };

    return {
        dilutionPercentage,
        setDilutionPercentage,
        capitalRaised,
        newOwnership,
        estimatedNewSharePrice,
        currentOwnership,
        currentStockPrice: stockPrice,
        handleConfirm
    };
};
