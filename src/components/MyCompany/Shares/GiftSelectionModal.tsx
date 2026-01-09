import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { theme } from '../../../core/theme';
import { Shareholder } from '../../../core/store/useStatsStore';
// 👇 YOL GÜNCELLENDİ
import { useGiftLogic } from './logic/useGiftLogic';

interface Props {
    visible: boolean;
    shareholder: Shareholder;
    onClose: () => void;
}

const GiftSelectionModal = ({ visible, shareholder, onClose }: Props) => {
    const { money, GIFTS, result, sendGift, resetResult } = useGiftLogic(shareholder);
    const appreciationAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (result?.sent) {
            Animated.timing(appreciationAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
            }).start();
        } else {
            appreciationAnim.setValue(0);
        }
    }, [result]);

    const handleClose = () => {
        resetResult();
        onClose();
    };

    const relationship = shareholder?.relationship || 50;

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                {result ? (
                    <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>🎁 Gift Sent!</Text>
                        <Text style={styles.resultMessage}>{shareholder.name} loved the {result.giftName}!</Text>

                        <View style={styles.appreciationCard}>
                            <Text style={styles.appreciationLabel}>Relationship Improvement</Text>
                            <View style={styles.barContainer}>
                                <View style={[styles.barBg, { width: '100%' }]}>
                                    <View style={[styles.barFill, { width: `${relationship}%` }]} />
                                    <Animated.View
                                        style={[
                                            styles.barGain,
                                            {
                                                left: `${relationship - result.impact}%`,
                                                width: appreciationAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', `${result.impact}%`]
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={styles.impactText}>+{result.impact}% Increase</Text>
                        </View>

                        <Pressable style={styles.closeBtn} onPress={handleClose}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Send Gift</Text>
                            <View style={styles.walletBadge}>
                                <Text style={styles.walletText}>💰 ${money.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Text style={styles.subtitle}>Select a gift for {shareholder.name}:</Text>

                        <View style={styles.grid}>
                            {GIFTS.map(gift => (
                                <Pressable
                                    key={gift.id}
                                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                                    onPress={() => sendGift(gift)}>
                                    <Text style={styles.icon}>{gift.icon}</Text>
                                    <Text style={styles.name}>{gift.name}</Text>
                                    <Text style={styles.cost}>${gift.cost.toLocaleString()}</Text>
                                    <View style={styles.impactBadge}>
                                        <Text style={styles.impactTextSmall}>+{gift.impact} Rel</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        <Pressable style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    walletBadge: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    walletText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.accent,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    card: {
        width: '47%',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 4,
    },
    cardPressed: {
        transform: [{ scale: 0.96 }],
        backgroundColor: theme.colors.background,
    },
    icon: {
        fontSize: 32,
        marginBottom: 4,
    },
    name: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    cost: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    impactBadge: {
        backgroundColor: theme.colors.success + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    impactTextSmall: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.success,
    },
    cancelBtn: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    cancelText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    resultContent: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.success,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.success,
        marginBottom: theme.spacing.sm,
    },
    resultMessage: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    appreciationCard: {
        width: '100%',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.lg,
    },
    appreciationLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    barContainer: {
        height: 12,
        backgroundColor: theme.colors.background,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: theme.spacing.xs,
    },
    barBg: {
        height: '100%',
        backgroundColor: theme.colors.background,
    },
    barFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
    },
    barGain: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: theme.colors.success,
    },
    impactText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.success,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    closeBtn: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    closeBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default GiftSelectionModal;