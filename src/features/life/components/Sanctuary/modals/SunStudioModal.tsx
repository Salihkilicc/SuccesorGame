import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../../core/theme';
import { useStatsStore } from '../../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../../core/store/usePlayerStore';
import GameModal from '../../../../../components/common/GameModal';
import GameButton from '../../../../../components/common/GameButton';

type SunStudioModalProps = {
    visible: boolean;
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
};

const SunStudioModal = ({ visible, onClose, handleServicePurchase }: SunStudioModalProps) => {
    useLocale();
    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title={t('life.sunStudio')}
            subtitle={t('life.achieveThePerfectGlow')}>

            <View style={styles.options}>
                {/* SPRAY TAN */}
                <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => {
                        handleServicePurchase(
                            100,
                            { charisma: usePlayerStore.getState().attributes.charm + 2 },
                            'SPRAY TAN',
                            'You look glowing and ready for summer.',
                            [{ label: t('life.charisma'), value: '+2', isPositive: true }]
                        );
                    }}
                >
                    <Text style={styles.emoji}>🧴</Text>
                    <Text style={styles.cardTitle}>{t('life.instantSprayTan')}</Text>
                    <Text style={styles.cardPrice}>$100</Text>
                    <Text style={styles.cardDesc}>{t('life.safeQuickAndOrangeFree')}</Text>
                    <Text style={styles.statText}>{t('life.charisma2Safe')}</Text>
                </Pressable>

                {/* UV BED */}
                <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => {
                        const burned = Math.random() < 0.1;
                        const player = usePlayerStore.getState();
                        const currentCharm = player.attributes.charm;
                        const currentHealth = player.core.health;

                        if (burned) {
                            handleServicePurchase(
                                250,
                                {
                                    charisma: currentCharm - 2,
                                    health: currentHealth - 1
                                },
                                'SKIN BURN!',
                                'The UV bed was too intense. You look red and painful.',
                                [
                                    { label: t('life.charisma'), value: '-2', isPositive: false },
                                    { label: t('life.health'), value: '-1', isPositive: false }
                                ]
                            );
                        } else {
                            handleServicePurchase(
                                250,
                                { charisma: currentCharm + 5 },
                                'DEEP BRONZE',
                                'Perfect, deep tan achieved. You look amazing.',
                                [{ label: t('life.charisma'), value: '+5', isPositive: true }]
                            );
                        }
                    }}
                >
                    <Text style={styles.emoji}>☀️</Text>
                    <Text style={styles.cardTitle}>{t('life.uvSolariumBed')}</Text>
                    <Text style={styles.cardPrice}>$250</Text>
                    <Text style={styles.cardDesc}>{t('life.deepBronzeLookWithA')}</Text>
                    <Text style={[styles.statText, styles.riskText]}>{t('life.charisma5RiskSkinBurn')}</Text>
                </Pressable>
            </View>

            <GameButton
                title={t('life.close')}
                variant="ghost"
                onPress={onClose}
                style={{ marginTop: 24 }}
            />
        </GameModal>
    );
};

export default SunStudioModal;

const styles = StyleSheet.create({
    options: {
        gap: theme.spacing.md,
    },
    card: {
        backgroundColor: '#434B50',
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
    },
    cardPressed: {
        backgroundColor: '#535B5F',
        transform: [{ scale: 0.98 }],
    },
    emoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardPrice: {
        fontSize: 16,
        color: '#FF8A8A',
        fontWeight: '600',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 13,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    statText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    riskText: {
        color: '#FF8A8A',
    },
});
