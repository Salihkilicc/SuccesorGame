import { Alert } from 'react-native';
import { t } from '../../../../core/i18n';
// 👇 DÜZELTME: Bir "../" daha eklendi
import { useStatsStore, Shareholder } from '../../../../core/store/useStatsStore';

export const useShareholderActions = () => {
    const { setField, updateShareholderRelationship, shareholders, setShareholders } = useStatsStore();

    const performInsult = (shareholder: Shareholder) => {
        Alert.alert(
            t('equity.pressureTitle'),
            t('equity.pressureBody'),
            [
                { text: t('ui.cancel'), style: 'cancel' },
                {
                    text: t('ui.confirm'),
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
                                t('equity.pressureWorkedTitle'),
                                t('equity.pressureWorkedBody', {
                                    name: shareholder.name,
                                    percent: panicAmount.toFixed(1),
                                })
                            );
                        } else {
                            // Başarısız (İlişki Düşer)
                            updateShareholderRelationship(shareholder.id, -20);
                            Alert.alert(
                                t('equity.pressureBackfiredTitle'),
                                t('equity.pressureBackfiredBody', { name: shareholder.name })
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