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
import { t, useLocale } from '../../../core/i18n';
import { translateEducationLevel } from '../../../data/i18n/profileLoveShopText';
import Portrait from '../../../components/common/Portrait';
import { facesFor } from '../../../core/portraits/faces';

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
    useLocale();

    // ------------------------------------------------------------------
    //  THE WHOLE LIST AT ONCE, SO NO TWO CHILDREN SHARE A FACE
    // ------------------------------------------------------------------
    //  Siblings are the worst case for the pool: they tend to be the same
    //  band, and half of them the same gender, which is exactly where two
    //  faces landing on one is the usual outcome rather than an edge. Two
    //  identical brothers on one screen reads as a bug in a way that two
    //  unfamiliar brothers never would.
    //
    //  The age is PRINTED on the same row, so the band has to be right. A
    //  child under thirteen gets no face at all and keeps their initials -
    //  nothing under that age was ever drawn, and a teenager beside the
    //  number 8 is worse than saying nothing.
    // ------------------------------------------------------------------
    const faces = facesFor(
        children.map(c => ({
            id: c.id,
            name: c.name,
            female: c.gender === 'Female',
            age: c.age,
        })),
    );

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('family.dynastySuccession')}</Text>
                <Text style={styles.countText}>
                    {t('family.successorsCount', { count: String(children.length) })}
                </Text>
            </View>

            {children.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>{t('family.noDescendants')}</Text>
                </View>
            ) : (
                children.map((child) => {
                    const isSuccessor = child.id === designatedSuccessorId;
                    const relationLabel = child.gender === 'Female' ? t('family.daughter') : t('family.son');
                    const educationLabel = translateEducationLevel(child.educationLevel);

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
                            {/* The face, or the initials circle it always was.
                                Same 44 points, same raised fill, no ring: the
                                row gains a picture and changes nothing else. */}
                            <Portrait
                                id={child.id}
                                name={child.name}
                                size={44}
                                borderWidth={0}
                                fill={theme.colors.surfaceRaised}
                                source={faces.get(child.id) as number | null}
                                style={styles.avatar}
                            />

                            {/* Info Block */}
                            <View style={styles.infoBlock}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.childName} numberOfLines={1}>
                                        {child.name}
                                    </Text>
                                    {isSuccessor && (
                                        <View style={styles.heirTag}>
                                            <Text style={styles.heirTagText}>{t('family.successor')}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.childSub}>
                                    {relationLabel} • {t('family.age', { age: String(child.age) })} • {educationLabel}
                                </Text>
                            </View>

                            {/* Relationship Score + Chevron */}
                            <View style={styles.rightBlock}>
                                <View style={styles.bondPill}>
                                    <Text style={styles.bondText}>
                                        {t('family.bond', { pct: String(child.relationshipWithPlayer) })}
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
    /**
     * Only the spacing is left here.
     *
     * The size, the radius and the fill moved onto the Portrait props so that
     * one component owns what an avatar looks like everywhere. The margin
     * stays because it is about this ROW, not about the circle.
     */
    avatar: {
        marginRight: 12,
    },
    // SHELVED, not deleted: the circle these rows drew before there were
    // photographs. Portrait takes the same 44 points, the same radius and the
    // same raised fill through props now, and derives the initials size from
    // the diameter instead of fixing it at 15.
    //
    // avatar: {
    //     width: 44,
    //     height: 44,
    //     borderRadius: 22,
    //     backgroundColor: theme.colors.surfaceRaised,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     marginRight: 12,
    // },
    // avatarText: {
    //     color: theme.colors.textPrimary,
    //     fontSize: 15,
    //     fontWeight: '800',
    // },
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
