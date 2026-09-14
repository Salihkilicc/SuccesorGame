import { useState } from 'react';
import { Alert } from 'react-native';
import { t } from '../../../../core/i18n';
// 👇 DÜZELTME: Bir "../" daha eklendi
import { useStatsStore, Shareholder } from '../../../../core/store/useStatsStore';
import { formatMoney } from '../../../../core/utils';

export const GIFTS = [
    { id: 'watch', name: 'Luxury Watch', cost: 15_000, impact: 5, icon: 'watch', color: '#FBBF24' },
    { id: 'golf', name: 'Golf Membership', cost: 40_000, impact: 10, icon: 'golf', color: '#34D399' },
    { id: 'wine', name: 'Vintage Wine', cost: 80_000, impact: 15, icon: 'glass-wine', color: '#F87171' },
    { id: 'car', name: 'Sports Car', cost: 150_000, impact: 25, icon: 'car-sports', color: '#38BDF8' },
];

export const useGiftLogic = (shareholder: Shareholder) => {
    const { money, setField, updateShareholderRelationship } = useStatsStore();
    const [result, setResult] = useState<{ sent: boolean; giftName: string; impact: number } | null>(null);

    const sendGift = (gift: typeof GIFTS[0]) => {
        if (money < gift.cost) {
            Alert.alert(t('equity.insufficientCapital'), t('equity.cannotAffordGift'));
            return;
        }

        Alert.alert(
            t('equity.confirmGift'),
            t('equity.sendGiftBody', { gift: gift.name, cost: formatMoney(gift.cost) }),
            [
                { text: t('ui.cancel'), style: 'cancel' },
                {
                    text: t('equity.send'),
                    onPress: () => {
                        setField('money', money - gift.cost);
                        updateShareholderRelationship(shareholder.id, gift.impact);
                        setResult({ sent: true, giftName: gift.name, impact: gift.impact });
                    },
                },
            ]
        );
    };

    const resetResult = () => setResult(null);

    return {
        money,
        GIFTS,
        result,
        sendGift,
        resetResult
    };
};