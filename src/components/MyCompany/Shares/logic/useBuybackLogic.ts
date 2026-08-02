import { useState } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useEquityStore } from '../../../../features/finance/stores/useEquityStore';
import { formatNumber, formatMoney } from '../../../../core/utils';

/**
 * Hook: useBuybackLogic
 * 
 * REFACTORED: Now uses useEquityStore for centralized equity management.
 */
export const useBuybackLogic = (onClose: () => void) => {
    const { companyValue, companyCapital } = useStatsStore();
    const [buybackPercentage, setBuybackPercentage] = useState(1);

    // Equity Store Data
    const stockPrice = useEquityStore((state) => state.stockPrice);
    const getPlayerOwnership = useEquityStore((state) => state.getPlayerOwnership);

    // Calculate cost based on company value
    const cost = companyValue * (buybackPercentage / 100);

    // Preview new ownership (actual value will come from equity store)
    const currentOwnership = getPlayerOwnership();
    const multiplier = 1 / (1 - (buybackPercentage / 100));
    const newOwnership = Math.min(100, currentOwnership * multiplier);

    // Estimated new stock price (5% boost from buyback)
    const estimatedNewStockPrice = stockPrice * 1.05;

    const isAffordable = companyCapital >= cost;

    const handleConfirm = () => {
        if (buybackPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a percentage.');
            return;
        }
        if (!isAffordable) {
            Alert.alert('Insufficient Capital', `Company needs ${formatMoney(cost)} to buy back shares.`);
            return;
        }

        Alert.alert(
            'Confirm Buyback',
            `Spend ${formatMoney(cost)} to buy back ${buybackPercentage.toFixed(1)}% of shares?\n\n` +
            `📈 Market Boost: Stock price will increase by 5%\n\n` +
            `This will increase your ownership to ${newOwnership.toFixed(1)}%.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        // Execute buyback via Equity Store
                        const result = useEquityStore.getState().executeBuyback(
                            cost,
                            companyValue,
                            (amount) => {
                                const currentCapital = useStatsStore.getState().companyCapital;
                                useStatsStore.getState().update({ companyCapital: currentCapital - amount });
                            }
                        );

                        // Update ownership in stats specific to result (optional if we want to sync strictly)
                        useStatsStore.getState().update({
                            companyOwnership: result.newOwnershipPercent
                        });

                        console.log('[BuybackLogic] Buyback executed:', result);

                        onClose();
                        Alert.alert(
                            'Buyback Complete',
                            `${formatNumber(result.sharesBurned)} shares retired.\n` +
                            `Your ownership increased to ${result.newOwnershipPercent.toFixed(1)}%.`
                        );
                    },
                },
            ]
        );
    };

    return {
        buybackPercentage,
        setBuybackPercentage,
        cost,
        newOwnership,
        companyCapital,
        isAffordable,
        currentStockPrice: stockPrice,
        estimatedNewStockPrice,
        handleConfirm
    };
};