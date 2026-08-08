import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';

// Types for the different contact categories
type FamilyMember = {
    id: string;
    name: string;
    relation?: string;
    photo?: string | null;
    relationship: number;
};

type FriendMember = {
    id: string;
    name: string;
    photo?: string | null;
    relationship: number;
};

type ExMember = {
    id: string;
    name: string;
    photo?: string | null;
    love: number;
};

type NpcContact = {
    id: string;
    name: string;
    type: string;
    age: number;
    relationship: number;
};

export type RelationshipListType = 'family' | 'friend' | 'ex';

interface Props {
    title: string;
    count: number;
    type: RelationshipListType;
    emptyText: string;
    legacyData?: (FamilyMember | FriendMember | ExMember)[];
    npcData?: NpcContact[];
    onItemPress: (item: any) => void;
}

const RelationshipList: React.FC<Props> = ({
    title,
    count,
    type,
    emptyText,
    legacyData = [],
    npcData = [],
    onItemPress,
}) => {
    const getNpcIconBg = (npcType: string): string => {
        if (npcType === 'Child') return 'rgba(250,204,21,0.12)';
        if (npcType === 'Mother') return 'rgba(236,72,153,0.12)';
        return 'rgba(99,102,241,0.12)';
    };

    const getNpcIcon = (npcType: string): string => {
        if (npcType === 'Child') return '👶';
        if (npcType === 'Mother') return '👩';
        return '👨';
    };

    const getNpcBarColor = (npcType: string): string => {
        if (npcType === 'Child') return '#E9B8C9';
        if (npcType === 'Mother') return '#E9B8C9';
        return '#0A2A92';
    };

    const getBarValue = (item: FamilyMember | FriendMember | ExMember): number => {
        if (type === 'ex') return (item as ExMember).love;
        return (item as FamilyMember | FriendMember).relationship;
    };

    const getBarColor = (): string => {
        if (type === 'ex') return theme.colors.textMuted;
        if (type === 'friend') return theme.colors.accent;
        return theme.colors.textSecondary; // family legacy
    };

    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionCount}>{count}</Text>
            </View>

            {/* Legacy data (family/friends/exes from useUserStore) */}
            {legacyData.map(item => (
                <Pressable
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => onItemPress(item)}
                >
                    <View style={styles.listPhotoContainer}>
                        {(item as FamilyMember).photo ? (
                            <Image source={{ uri: (item as FamilyMember).photo || undefined }} style={styles.listPhoto} />
                        ) : (
                            <Text style={styles.listInitial}>{item.name[0]}</Text>
                        )}
                    </View>
                    <View style={styles.listContent}>
                        <View style={styles.listNameRow}>
                            <Text style={styles.listName}>{item.name}</Text>
                            {type === 'family' && (item as FamilyMember).relation && (
                                <Text style={styles.listRole}>({(item as FamilyMember).relation})</Text>
                            )}
                        </View>
                        <View style={styles.listBarTrack}>
                            <View style={[styles.listBarFill, { width: `${getBarValue(item)}%`, backgroundColor: getBarColor() }]} />
                        </View>
                    </View>
                </Pressable>
            ))}

            {/* NPC contacts (from useRelationshipStore) — only relevant for family type */}
            {npcData && npcData.map(npc => (
                <View key={npc.id} style={styles.listItem}>
                    <View style={[styles.listPhotoContainer, { backgroundColor: getNpcIconBg(npc.type) }]}>
                        <Text style={styles.listInitial}>{getNpcIcon(npc.type)}</Text>
                    </View>
                    <View style={styles.listContent}>
                        <View style={styles.listNameRow}>
                            <Text style={styles.listName}>{npc.name}</Text>
                            <Text style={styles.listRole}>({npc.type}, Age {npc.age})</Text>
                        </View>
                        <View style={styles.listBarTrack}>
                            <View style={[styles.listBarFill, {
                                width: `${npc.relationship}%`,
                                backgroundColor: getNpcBarColor(npc.type),
                            }]} />
                        </View>
                    </View>
                </View>
            ))}

            {count === 0 && (
                <Text style={styles.emptyText}>{emptyText}</Text>
            )}
        </View>
    );
};

export default RelationshipList;

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 8,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    sectionCount: {
        color: '#7F5E51',
        fontSize: 11,
        fontWeight: '600',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
        marginBottom: 12,
    },
    listPhotoContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.cardSoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listPhoto: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    listInitial: {
        color: theme.colors.textMuted,
        fontSize: 18,
        fontWeight: '700',
    },
    listContent: {
        flex: 1,
        gap: 4,
    },
    listNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listName: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    listRole: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    listBarTrack: {
        height: 4,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 999,
        overflow: 'hidden',
        width: 80,
    },
    listBarFill: {
        height: '100%',
        backgroundColor: theme.colors.textSecondary,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontStyle: 'italic',
        paddingLeft: 4,
    },
});
