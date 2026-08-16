// src/features/profile/components/FamilySuccessionList.tsx
//
// ============================================================================
//  FAMILY SUCCESSION ROSTER COMPONENT
// ============================================================================
//
//  Clean list of heirs showing Name, relation/age, relationship score,
//  and a right chevron. Tapping opens the full Heir Dossier Modal.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { Child } from '../../../core/store/useFamilyStore';

interface FamilySuccessionListProps {
    children: Child[];
    designatedSuccessorId: string | null;
    onSelectChild: (child: Child) => void;
}

export const FamilySuccessionList: React.FC<FamilySuccessionListProps> = ({
    children,
    designatedSuccessorId,
    onSelectChild,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>DYNASTY & SUCCESSION</Text>
                <Text style={styles.countText}>{children.length} Heirs</Text>
            </View>

            {children.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No descendants currently recorded.</Text>
                </View>
            ) : (
                children.map((child) => {
                    const isSuccessor = child.id === designatedSuccessorId;
                    const initials = child.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                    const relationLabel = child.gender === 'Female' ? 'Daughter' : 'Son';

                    return (
                        <Pressable
                            key={child.id}
                            style={({ pressed }) => [
                                styles.childRow,
                                isSuccessor && styles.successorRow,
                                pressed && styles.rowPressed,
                            ]}
                            onPress={() => onSelectChild(child)}
                        >
                            {/* Avatar Initials */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>

                            {/* Info Block */}
                            <View style={styles.infoBlock}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.childName} numberOfLines={1}>
                                        {child.name}
                                    </Text>
                                    {isSuccessor && (
                                        <View style={styles.heirTag}>
                                            <Text style={styles.heirTagText}>HEIR</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.childSub}>
                                    {relationLabel} • Age {child.age} • {child.educationLevel}
                                </Text>
                            </View>

                            {/* Relationship Score + Chevron */}
                            <View style={styles.rightBlock}>
                                <View style={styles.bondPill}>
                                    <Text style={styles.bondText}>
                                        {child.relationshipWithPlayer}% Bond
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={22}
                                    color={theme.colors.textMuted}
                                />
                            </View>
                        </Pressable>
                    );
                })
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        color: '#05A8F6', // Electric blue sub-header
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    countText: {
        color: '#05A8F6',
        fontSize: 11,
        fontWeight: '700',
    },
    childRow: {
        backgroundColor: theme.colors.surface, // Solid surface, NO border
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    successorRow: {
        backgroundColor: '#353842', // Subtle elevation for primary heir
    },
    rowPressed: {
        backgroundColor: theme.colors.surfaceRaised,
        transform: [{ scale: 0.99 }],
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    infoBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    childName: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    heirTag: {
        backgroundColor: '#4E3A20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    heirTagText: {
        color: '#FBBF24',
        fontSize: 9,
        fontWeight: '800',
    },
    childSub: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    rightBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bondPill: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bondText: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    emptyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
    },
});

export default FamilySuccessionList;
