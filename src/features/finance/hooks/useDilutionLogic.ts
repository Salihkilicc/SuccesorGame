import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';

export interface DilutionLogicResult {
    // State
    dilutionPercentage: number;
    setDilutionPercentage: (val: number) => void;

    // Calculated Values
    capitalRaised: number;
    newOwnership: number;
    estimatedNewSharePrice: number;
    currentOwnership: number;

    // Actions
    handleConfirm: () => void;
}

/**
 * Hook: useDilutionLogic
 * 
 * Handles business logic for DilutionModal.
 * - Manages dilution percentage state.
 * - Calculates capital raised and ownership impact.
 * - Executes dilution action via store.
 */
export const useDilutionLogic = (visible: boolean, onClose: () => void): DilutionLogicResult => {
    // Local State
    const [dilutionPercentage, setDilutionPercentage] = useState(5);

    // Store Data
    const companyValue = useStatsStore((state: any) => state.companyValue || 0);
    const companyOwnership = useStatsStore((state: any) => state.companyOwnership || 0);
    const companySharePrice = useStatsStore((state: any) => state.companySharePrice || 0);
    const performDilution = useStatsStore((state: any) => state.performDilution);

    // Reset Condition
    useEffect(() => {
        if (visible) {
            setDilutionPercentage(5);
        }
    }, [visible]);

    // Financial Calculations

    // 1. Cash raised from new shares
    const capitalRaised = companyValue * (dilutionPercentage / 100);

    // 2. New Ownership %
    // Formula: Current * (1 - Dilution%)
    const newOwnership = companyOwnership * (1 - (dilutionPercentage / 100));

    // 3. Estimated Price Drop (Market perception)
    // Supply up -> Price down approx 3%
    const estimatedNewSharePrice = companySharePrice * 0.97;

    // Actions
    const handleConfirm = () => {
        Alert.alert(
            "Confirm Dilution",
            `Diluting shares by ${dilutionPercentage}%. Your ownership will drop to ${newOwnership.toFixed(1)}%.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm & Sell",
                    style: "destructive",
                    onPress: () => {
                        performDilution(dilutionPercentage);
                        Alert.alert("Success", `$${(capitalRaised / 1_000_000).toFixed(1)}M Raised!`);
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
        currentOwnership: companyOwnership,
        handleConfirm
    };
};
