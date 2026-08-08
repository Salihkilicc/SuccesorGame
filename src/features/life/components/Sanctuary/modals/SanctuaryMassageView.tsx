import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../../../../core/theme';
import GameButton from '../../../../../components/common/GameButton';
import CrystalNavBar from '../../../../../navigation/components/CrystalNavBar';

import { useStatsStore } from '../../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../../core/store/usePlayerStore';

import { MASSAGE_SERVICES } from '../data/sanctuaryData';

type RoyalMassageModalProps = {
    visible: boolean; // Kept for prop compatibility
    onClose: () => void;
    handleServicePurchase: (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => void;
    isVIPMember: boolean;
    onGoHome: () => void;
};

const SanctuaryMassageView = ({ visible, onClose, handleServicePurchase, isVIPMember, onGoHome }: RoyalMassageModalProps) => {
    useLocale();
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('life.royalMassage2')}</Text>
                        <Text style={styles.subtitle}>{t('life.relaxRejuvenate')}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* VIP BANNER */}
                    {isVIPMember && (
                        <View style={styles.vipBanner}>
                            <Text style={styles.vipIcon}>👑</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.vipTitle}>{t('life.vipPlatinumMember')}</Text>
                                <Text style={styles.vipText}>{t('life.allMassagesAreFreeFor')}</Text>
                            </View>
                        </View>
                    )}

                    {MASSAGE_SERVICES.map((option) => {
                        const finalCost = isVIPMember ? 0 : option.cost;

                        return (
                            <Pressable
                                key={option.name}
                                style={({ pressed }) => [
                                    styles.optionCard,
                                    pressed && styles.optionCardPressed,
                                    isVIPMember && styles.optionCardVIP
                                ]}
                                onPress={() => {
                                    const { core } = usePlayerStore.getState();
                                    handleServicePurchase(
                                        finalCost,
                                        {
                                            stress: Math.max(0, core.stress - option.stress),
                                            health: Math.min(100, core.health + option.health)
                                        },
                                        option.name,
                                        `You enjoyed a ${option.name}.`,
                                        [
                                            { label: t('life.stress'), value: `-${option.stress}`, isPositive: true },
                                            ...(option.health > 0 ? [{ label: t('life.health'), value: `+${option.health}`, isPositive: true }] : [])
                                        ]
                                    );
                                }}
                            >
                                <View style={styles.optionHeader}>
                                    <Text style={styles.optionName}>{option.name}</Text>
                                    {isVIPMember ? (
                                        <View style={styles.freeBadge}>
                                            <Text style={styles.freeText}>{t('life.free')}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.optionCost}>${option.cost.toLocaleString()}</Text>
                                    )}
                                </View>
                                <Text style={styles.optionDesc}>{option.description}</Text>
                                <View style={styles.statsRow}>
                                    <Text style={styles.statText}>Stress -{option.stress}</Text>
                                    {option.health > 0 && (
                                        <Text style={[styles.statText, styles.healthText]}>Health +{option.health}</Text>
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {/* Universal Crystal Navigation Bar */}
            <CrystalNavBar activeTab="Life" variant="dark" />
        </View>
    );
};

export default SanctuaryMassageView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#7B68D7',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.48)',
        backgroundColor: '#7B68D7',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0B0635',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    vipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C734CA20',
        borderRadius: theme.radius.sm,
        padding: 12,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        gap: 10,
    },
    vipIcon: {
        fontSize: 24,
    },
    vipTitle: {
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
    },
    vipText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
        gap: theme.spacing.md,
    },
    optionCard: {
        backgroundColor: '#0B0635', // Deep Ocean Blue
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        shadowColor: '#7B68D7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionCardVIP: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        backgroundColor: '#0B0635', // Deep Ocean Blue
    },
    optionCardPressed: {
        backgroundColor: '#0B0635',
        transform: [{ scale: 0.98 }],
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center',
    },
    optionName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    optionCost: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.48)',
    },
    freeBadge: {
        backgroundColor: 'rgba(255,255,255,0.48)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    freeText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    optionDesc: {
        fontSize: 13,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statText: {
        fontSize: 12,
        color: '#7B68D7', // Green
        fontWeight: '600',
    },
    healthText: {
        color: '#7B68D7', // Blue
    },
});
