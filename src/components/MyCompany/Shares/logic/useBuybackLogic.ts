import { useState } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useEquityStore } from '../../../../features/finance/stores/useEquityStore';

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
            Alert.alert('Insufficient Capital', `Company needs $${(cost / 1_000_000).toFixed(1)}M to buy back shares.`);
            return;
        }

        Alert.alert(
            'Confirm Buyback',
            `Spend $${(cost / 1_000_000).toFixed(1)}M to buy back ${buybackPercentage.toFixed(1)}% of shares?\n\n` +
            `📈 Market Boost: Stock price will increase by 5%\n\n` +
            `This will increase your ownership to ${newOwnership.toFixed(1)}%.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        // Execute buyback via Equity Store
                        const result = useEquityStore.getState().executeBuyback(cost);

                        // Deduct cost from company capital
                        useStatsStore.getState().update({
                            companyCapital: companyCapital - cost,
                            companyOwnership: result.newOwnershipPercent
                        });

                        console.log('[BuybackLogic] Buyback executed:', result);

                        onClose();
                        Alert.alert(
                            'Buyback Complete',
                            `${result.sharesBurned.toLocaleString()} shares retired.\n` +
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