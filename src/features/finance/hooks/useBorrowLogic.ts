import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store/useStatsStore';

export interface BorrowLogicResult {
    // State
    amount: number;
    setAmount: (val: number) => void;

    // Calculated Values
    maxBorrowable: number;
    monthlyInterestCost: number;
    newTotalDebt: number;

    // Actions
    handleConfirm: () => void;
}

/**
 * Hook: useBorrowLogic
 * 
 * Handles business logic for BorrowModal.
 * - Calculates max borrow limit based on Company Valuation.
 * - Manages loan amount state.
 * - Executes borrow action via store.
 */
export const useBorrowLogic = (
    visible: boolean,
    onClose: () => void,
    rate: number
): BorrowLogicResult => {
    // Local State
    const [amount, setAmount] = useState(1_000_000);

    // Store Data
    const companyValue = useStatsStore((state: any) => state.companyValue || 0);
    const companyDebtTotal = useStatsStore((state: any) => state.companyDebtTotal || 0);
    const borrowCapital = useStatsStore((state: any) => state.borrowCapital);

    // Logic Constants
    const DEBT_LIMIT_RATIO = 0.4; // Can borrow up to 40% of Valuation

    // 1. Calculate Max Borrow Limit
    // Limit is Total Debt Capacity - Current Debt
    const totalDebtCapacity = companyValue * DEBT_LIMIT_RATIO;
    const maxBorrowable = Math.max(0, totalDebtCapacity - companyDebtTotal);

    // 2. Calculate Costs
    const monthlyInterestCost = (amount * (rate / 100)) / 12;
    const newTotalDebt = companyDebtTotal + amount;

    // Reset Condition
    useEffect(() => {
        if (visible) {
            setAmount(1_000_000);
        } else {
            setAmount(0);
        }
    }, [visible]);

    // Actions
    const handleConfirm = () => {
        if (amount > maxBorrowable) {
            Alert.alert("High Risk", "Bank refuses to lend more than 40% of your valuation.");
            return;
        }

        // Execute Store Action
        borrowCapital(amount, rate);

        console.log('[BorrowLogic] Borrowed:', { amount, rate });

        Alert.alert(
            "Loan Approved",
            `$${(amount / 1_000_000).toFixed(1)}M added to company capital.`,
            [
                {
                    text: "OK",
                    onPress: () => {
                        onClose();
                    }
                }
            ]
        );
    };

    return {
        amount,
        setAmount,
        maxBorrowable,
        monthlyInterestCost,
        newTotalDebt,
        handleConfirm
    };
};
