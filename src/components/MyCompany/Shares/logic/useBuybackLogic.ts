import { useState } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useEquityStore } from '../../../../features/finance/stores/useEquityStore';
import { formatNumber, formatMoney } from '../../../../core/utils';
import { t } from '../../../../core/i18n';
import { useShareholderStore } from '../../../../features/shareholders/stores/useShareholderStore';

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

    // ----------------------------------------------------------------------
    //  YOU CAN ONLY BUY BACK WHAT IS PUBLICLY TRADED
    // ----------------------------------------------------------------------
    //  quoteBuyback buys from the FLOAT, and a private company has none: at
    //  the start the cap table is 65% founder plus 35% board, so the float is
    //  zero and a buyback purchases nothing. The engine handles that safely -
    //  it returns zero shares before spending a cent - but this screen still
    //  showed a confirmation promising a higher stake and a price boost, and
    //  then nothing happened. That is the "buyback seems to do nothing" the
    //  player reported: not a broken mechanic, an unexplained precondition.
    // ----------------------------------------------------------------------
    const floatShares = useShareholderStore(st => {
        const insiders = (st.members || []).reduce((sum: number, m: any) => sum + (m.shareCount || 0), 0);
        return Math.max(0, (st.totalShares || 0) - (st.playerShareCount || 0) - insiders);
    });
    const hasFloat = floatShares > 0;

    const handleConfirm = () => {
        if (!hasFloat) {
            Alert.alert(t('equity.nothingToBuyBack'), t('equity.nothingToBuyBackBody'));
            return;
        }
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
        floatShares,
        hasFloat,
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