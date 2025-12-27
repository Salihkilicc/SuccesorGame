import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Modal,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore, Shareholder } from '../../../store/useStatsStore';

interface Props {
    visible: boolean;
    shareholder: Shareholder;
    onClose: () => void;
    onOpenGift: (shareholder: Shareholder) => void;
    onOpenNegotiate: (shareholder: Shareholder) => void;
}

const ShareholderProfileModal = ({ visible, shareholder, onClose, onOpenGift, onOpenNegotiate }: Props) => {
    const { money, setField, updateShareholderRelationship, shareholders, setShareholders } = useStatsStore();

    const relationship = shareholder.relationship || 50;
    const isPlayer = shareholder.type === 'player';

    const getRelationshipColor = () => {
        if (relationship >= 61) return theme.colors.success;
        if (relationship >= 31) return '#FFA500'; // Orange
        return theme.colors.danger;
    };

    const getRelationshipLabel = () => {
        if (relationship >= 61) return 'Supportive';
        if (relationship >= 31) return 'Neutral';
        return 'Hostile';
    };

    const handleInsult = () => {
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
                        if (roll < 0.05) {
                            // SUCCESS: Panic Sell (Gain 1% stake free)
                            const panicAmount = Math.min(shareholder.percentage, 1.0);

                            const newShareholders = shareholders.map(sh => {
                                if (sh.id === shareholder.id) {
                                    return { ...sh, percentage: Math.max(0, sh.percentage - panicAmount) };
                                }
                                if (sh.id === 'player') {
                                    return { ...sh, percentage: sh.percentage + panicAmount };
                                }
                                return sh;
                            });

                            setShareholders(newShareholders);
                            const newPlayerPct = newShareholders.find(s => s.id === 'player')?.percentage || 0;
                            setField('companyOwnership', newPlayerPct);

                            Alert.alert(
                                'It worked!',
                                `${shareholder.name} panicked to avoid a scandal and surrendered ${panicAmount.toFixed(1)}% stake to you.`
                            );
                        } else {
                            // FAILURE
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

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{shareholder.avatar || shareholder.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name}>{shareholder.name}</Text>
                            <Text style={styles.type}>{shareholder.type.toUpperCase()}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>×</Text>
                        </Pressable>
                    </View>

                    {/* Ownership */}
                    <View style={styles.ownershipCard}>
                        <Text style={styles.ownershipLabel}>Shares Owned</Text>
                        <Text style={styles.ownershipValue}>{shareholder.percentage.toFixed(2)}%</Text>
                    </View>

                    {/* Relationship (non-player only) */}
                    {!isPlayer && (
                        <View style={styles.relationshipCard}>
                            <View style={styles.relationshipHeader}>
                                <Text style={styles.relationshipLabel}>Relationship</Text>
                                <Text style={[styles.relationshipStatus, { color: getRelationshipColor() }]}>
                                    {getRelationshipLabel()}
                                </Text>
                            </View>
                            <View style={styles.relationshipBar}>
                                <View
                                    style={[
                                        styles.relationshipBarFill,
                                        { width: `${relationship}%`, backgroundColor: getRelationshipColor() },
                                    ]}
                                />
                            </View>
                            <Text style={styles.relationshipValue}>{relationship}/100</Text>
                        </View>
                    )}

                    {/* Bio */}
                    {shareholder.bio && (
                        <View style={styles.bioCard}>
                            <Text style={styles.bioLabel}>Background</Text>
                            <Text style={styles.bioText}>{shareholder.bio}</Text>
                        </View>
                    )}

                    {/* Actions (non-player only) */}
                    {!isPlayer && (
                        <View style={styles.actionsColumn}>
                            {/* A) Negotiate Shares */}
                            <TouchableOpacity
                                onPress={() => onOpenNegotiate(shareholder)}
                                activeOpacity={0.7}
                                style={[
                                    styles.actionBtn,
                                    styles.btnNegotiate,
                                ]}>
                                <View style={styles.btnContent}>
                                    <Text style={styles.btnIcon}>📉</Text>
                                    <View>
                                        <Text style={styles.btnTitle}>Negotiate Shares</Text>
                                        <Text style={styles.btnSubtitle}>Buy or sell shares</Text>
                                    </View>
                                </View>
                                <Text style={styles.btnArrow}>›</Text>
                            </TouchableOpacity>

                            {/* B) Send Gift / Lobby */}
                            <TouchableOpacity
                                onPress={() => onOpenGift(shareholder)}
                                activeOpacity={0.7}
                                style={[
                                    styles.actionBtn,
                                    styles.btnGift,
                                ]}>
                                <View style={styles.btnContent}>
                                    <Text style={styles.btnIcon}>🎁</Text>
                                    <View>
                                        <Text style={styles.btnTitle}>Send Gift / Lobby</Text>
                                        <Text style={styles.btnSubtitle}>Improve relationship</Text>
                                    </View>
                                </View>
                                <Text style={styles.btnArrow}>›</Text>
                            </TouchableOpacity>

                            {/* C) Insult / Pressure */}
                            <TouchableOpacity
                                onPress={() => {
                                    console.log("Insult/Pressure Pressed");
                                    handleInsult();
                                }}
                                activeOpacity={0.7}
                                style={[
                                    styles.actionBtn,
                                    styles.btnInsult,
                                ]}>
                                <View style={styles.btnContent}>
                                    <Text style={styles.btnIcon}>💬</Text>
                                    <View>
                                        <Text style={styles.btnTitle}>Insult / Pressure</Text>
                                        <Text style={styles.btnSubtitle}>Risk relationship for gain</Text>
                                    </View>
                                </View>
                                <Text style={styles.btnArrow}>›</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
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
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
    },
    headerInfo: {
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    type: {
        fontSize: 11,
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    ownershipCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    ownershipLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    ownershipValue: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.accent,
    },
    relationshipCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    relationshipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    relationshipLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    relationshipStatus: {
        fontSize: 13,
        fontWeight: '700',
    },
    relationshipBar: {
        height: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    relationshipBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    relationshipValue: {
        fontSize: 12,
        color: theme.colors.textMuted,
        textAlign: 'right',
    },
    bioCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bioLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    bioText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    actionsColumn: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'space-between',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    btnIcon: {
        fontSize: 24,
    },
    btnTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    btnSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    btnArrow: {
        fontSize: 20,
        color: theme.colors.textSecondary,
    },
    btnNegotiate: {
        backgroundColor: theme.colors.cardSoft,
        borderColor: theme.colors.accent,
    },
    btnGift: {
        backgroundColor: theme.colors.cardSoft,
        borderColor: theme.colors.success,
    },
    btnInsult: {
        backgroundColor: theme.colors.cardSoft,
        borderColor: theme.colors.danger,
    },
    btnPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.98 }],
    },
});

export default ShareholderProfileModal;
