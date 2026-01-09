import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../../../core/theme';
import { Shareholder } from '../../../core/store/useStatsStore';
// 👇 YOL GÜNCELLENDİ
import { useShareholderActions } from './logic/useShareholderActions';

interface Props {
    visible: boolean;
    shareholder: Shareholder;
    onClose: () => void;
    onOpenGift: (shareholder: Shareholder) => void;
    onOpenNegotiate: (shareholder: Shareholder) => void;
}

const ShareholderProfileModal = ({ visible, shareholder, onClose, onOpenGift, onOpenNegotiate }: Props) => {
    const { performInsult } = useShareholderActions();

    const relationship = shareholder.relationship || 50;
    const isPlayer = shareholder.type === 'player';

    const getRelationshipColor = () => {
        if (relationship >= 61) return theme.colors.success;
        if (relationship >= 31) return '#FFA500';
        return theme.colors.danger;
    };

    const getRelationshipLabel = () => {
        if (relationship >= 61) return 'Supportive';
        if (relationship >= 31) return 'Neutral';
        return 'Hostile';
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.content}>
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

                    <View style={styles.ownershipCard}>
                        <Text style={styles.ownershipLabel}>Shares Owned</Text>
                        <Text style={styles.ownershipValue}>{shareholder.percentage.toFixed(2)}%</Text>
                    </View>

                    {!isPlayer && (
                        <View style={styles.relationshipCard}>
                            <View style={styles.relationshipHeader}>
                                <Text style={styles.relationshipLabel}>Relationship</Text>
                                <Text style={[styles.relationshipStatus, { color: getRelationshipColor() }]}>
                                    {getRelationshipLabel()}
                                </Text>
                            </View>
                            <View style={styles.relationshipBar}>
                                <View style={[styles.relationshipBarFill, { width: `${relationship}%`, backgroundColor: getRelationshipColor() }]} />
                            </View>
                            <Text style={styles.relationshipValue}>{relationship}/100</Text>
                        </View>
                    )}

                    {shareholder.bio && (
                        <View style={styles.bioCard}>
                            <Text style={styles.bioLabel}>Background</Text>
                            <Text style={styles.bioText}>{shareholder.bio}</Text>
                        </View>
                    )}

                    {!isPlayer && (
                        <View style={styles.actionsColumn}>
                            <ActionButton
                                icon="📉"
                                title="Negotiate Shares"
                                subtitle="Buy or sell shares"
                                onPress={() => onOpenNegotiate(shareholder)}
                            />
                            <ActionButton
                                icon="🎁"
                                title="Send Gift / Lobby"
                                subtitle="Improve relationship"
                                onPress={() => onOpenGift(shareholder)}
                            />
                            <ActionButton
                                icon="💬"
                                title="Insult / Pressure"
                                subtitle="Risk relationship for gain"
                                onPress={() => performInsult(shareholder)}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const ActionButton = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.actionBtn}>
        <View style={styles.btnContent}>
            <Text style={styles.btnIcon}>{icon}</Text>
            <View>
                <Text style={styles.btnTitle}>{title}</Text>
                <Text style={styles.btnSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <Text style={styles.btnArrow}>›</Text>
    </TouchableOpacity>
);

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
});

export default ShareholderProfileModal;