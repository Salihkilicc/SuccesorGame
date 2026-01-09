import { useState } from 'react';
import { Alert } from 'react-native';
// 👇 DÜZELTME: Bir "../" daha eklendi
import { useStatsStore, Shareholder } from '../../../../core/store/useStatsStore';

export const GIFTS = [
    { id: 'watch', name: 'Luxury Watch', cost: 15_000, impact: 5, icon: '⌚' },
    { id: 'golf', name: 'Golf Membership', cost: 40_000, impact: 10, icon: '⛳' },
    { id: 'wine', name: 'Vintage Wine', cost: 80_000, impact: 15, icon: '🍷' },
    { id: 'car', name: 'Sports Car', cost: 150_000, impact: 25, icon: '🏎️' },
];

export const useGiftLogic = (shareholder: Shareholder) => {
    const { money, setField, updateShareholderRelationship } = useStatsStore();
    const [result, setResult] = useState<{ sent: boolean; giftName: string; impact: number } | null>(null);

    const sendGift = (gift: typeof GIFTS[0]) => {
        if (money < gift.cost) {
            Alert.alert('Insufficient Funds', "You can't afford this gift.");
            return;
        }

        Alert.alert(
            'Confirm Gift',
            `Send ${gift.name} ($${gift.cost.toLocaleString()})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
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