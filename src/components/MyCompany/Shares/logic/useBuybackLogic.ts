import { useState } from 'react';
import { Alert } from 'react-native';
// 👇 DÜZELTME: Bir "../" daha eklendi (Toplam 4 tane)
import { useStatsStore } from '../../../../store/useStatsStore';

export const useBuybackLogic = (onClose: () => void) => {
    const { companyValue, companyOwnership, companyCapital, performBuyback } = useStatsStore();
    const [buybackPercentage, setBuybackPercentage] = useState(1);

    const cost = companyValue * (buybackPercentage / 100);
    
    const multiplier = 1 / (1 - (buybackPercentage / 100));
    const newOwnership = Math.min(100, companyOwnership * multiplier);

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
            `Spend $${(cost / 1_000_000).toFixed(1)}M to buy back ${buybackPercentage.toFixed(1)}% of shares?\n\nThis will increase your ownership to ${newOwnership.toFixed(1)}%.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        performBuyback(buybackPercentage);
                        onClose();
                        Alert.alert(
                            'Buyback Complete',
                            `Company shares retired. Your ownership increased to ${newOwnership.toFixed(1)}%.`
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
        handleConfirm
    };
};