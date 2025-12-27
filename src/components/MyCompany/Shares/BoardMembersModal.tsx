import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore, Shareholder } from '../../../store/useStatsStore';


interface Props {
    visible: boolean;
    onClose: () => void;
    onSelectMember: (shareholder: Shareholder) => void;
}

const BoardMembersModal = ({ visible, onClose, onSelectMember }: Props) => {
    const { shareholders } = useStatsStore();

    const getRelationshipColor = (relationship: number) => {
        if (relationship >= 61) return theme.colors.success;
        if (relationship >= 31) return '#FFA500'; // Orange
        return theme.colors.danger;
    };

    const renderMember = ({ item }: { item: Shareholder }) => {
        const relationship = item.relationship || 0;
        const isPlayer = item.type === 'player';

        return (
            <TouchableOpacity
                style={styles.memberCard}
                activeOpacity={0.7}
                onPress={() => onSelectMember(item)}>
                {/* Left: Avatar */}
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.avatar || item.name.charAt(0)}</Text>
                </View>

                {/* Middle: Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <View style={styles.stakeBadge}>
                        <Text style={styles.stakeText}>Stake: {item.percentage.toFixed(1)}%</Text>
                    </View>
                </View>

                {/* Right: Relationship (Non-player only) */}
                {!isPlayer ? (
                    <View style={styles.relationshipContainer}>
                        <Text style={[styles.relationshipLabel, { color: getRelationshipColor(relationship) }]}>
                            {relationship}%
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${relationship}%`,
                                        backgroundColor: getRelationshipColor(relationship)
                                    }
                                ]}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.playerBadge}>
                        <Text style={styles.playerBadgeText}>YOU</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Board Members</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </Pressable>
                    </View>

                    <FlatList
                        data={shareholders}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMember}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </View>


        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
        elevation: 10,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: 0.5,
    },
    closeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 20,
    },
    closeBtnText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    memberCardPressed: {
        backgroundColor: theme.colors.cardSoft,
        transform: [{ scale: 0.98 }],
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    stakeBadge: {
        backgroundColor: theme.colors.cardSoft,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    stakeText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    relationshipContainer: {
        width: 80,
        alignItems: 'flex-end',
        gap: 4,
    },
    relationshipLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: theme.colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    playerBadge: {
        width: 80,
        alignItems: 'center',
        backgroundColor: theme.colors.accent + '20',
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    playerBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.accent,
    },
});

export default BoardMembersModal;
