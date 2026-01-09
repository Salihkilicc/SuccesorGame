import { Alert } from 'react-native';
// 👇 DÜZELTME: Bir "../" daha eklendi
import { useStatsStore, Shareholder } from '../../../../core/store/useStatsStore';

export const useShareholderActions = () => {
    const { setField, updateShareholderRelationship, shareholders, setShareholders } = useStatsStore();

    const performInsult = (shareholder: Shareholder) => {
        Alert.alert(
            'Apply Pressure / Insult',
            `Are you sure? This is a High Risk action.\n\n• 95% Chance: Relationship -20\n• 5% Chance: They panic and surrender 1% stake`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Do it',
                    style: 'destructive',
                    onPress: () => {
                        const roll = Math.random();

                        // %5 Şansla Başarılı (Panic Sell)
                        if (roll < 0.05) {
                            const panicAmount = Math.min(shareholder.percentage, 1.0);

                            // 👇 DÜZELTME: (sh: Shareholder) eklendi
                            const newShareholders = shareholders.map((sh: Shareholder) => {
                                if (sh.id === shareholder.id) {
                                    return { ...sh, percentage: Math.max(0, sh.percentage - panicAmount) };
                                }
                                if (sh.id === 'player') {
                                    return { ...sh, percentage: sh.percentage + panicAmount };
                                }
                                return sh;
                            });

                            setShareholders(newShareholders);
                            // 👇 DÜZELTME: (s: Shareholder) eklendi
                            const newPlayerPct = newShareholders.find((s: Shareholder) => s.id === 'player')?.percentage || 0;
                            setField('companyOwnership', newPlayerPct);

                            Alert.alert(
                                'It worked!',
                                `${shareholder.name} panicked to avoid a scandal and surrendered ${panicAmount.toFixed(1)}% stake to you.`
                            );
                        } else {
                            // Başarısız (İlişki Düşer)
                            updateShareholderRelationship(shareholder.id, -20);
                            Alert.alert(
                                'Backfired!',
                                `${shareholder.name} is furious at your behavior! Relationship -20.`
                            );
                        }
                    },
                },
            ]
        );
    };

    return {
        performInsult
    };
};