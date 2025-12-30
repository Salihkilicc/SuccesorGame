import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore, Shareholder } from '../../../store/useStatsStore';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';

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
            <Pressable
                onPress={() => onSelectMember(item)}
                style={({ pressed }) => [
                    styles.memberCard,
                    pressed && styles.memberCardPressed
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.avatar || item.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{item.name} {isPlayer && '(You)'}</Text>
                        <Text style={styles.stakeText}>Stake: {item.percentage.toFixed(1)}%</Text>
                    </View>
                </View>

                {/* Relationship Bar for Non-Player */}
                {!isPlayer && (
                    <View style={styles.relationshipRow}>
                        <Text style={styles.relLabel}>Relationship</Text>
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
                        <Text style={[styles.relValue, { color: getRelationshipColor(relationship) }]}>
                            {relationship}%
                        </Text>
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="Board Members"
            subtitle="View and manage shareholders"
        >
            <FlatList
                data={shareholders}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </GameModal>
    );
};

const styles = StyleSheet.create({
    memberCard: {
        backgroundColor: '#2D3748',
        borderRadius: theme.radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: '#4A5568',
        gap: 12,
    },
    memberCardPressed: {
        backgroundColor: '#232730', // Like SectionCard
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    stakeText: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    relationshipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    relLabel: {
        fontSize: 10,
        color: '#A0AEC0',
        width: 60,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#1A202C',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    relValue: {
        fontSize: 12,
        fontWeight: '700',
        width: 30,
        textAlign: 'right',
    },
});

export default BoardMembersModal;
