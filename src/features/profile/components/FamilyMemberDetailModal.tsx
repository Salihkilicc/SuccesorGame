// src/features/profile/components/FamilyMemberDetailModal.tsx
//
// ============================================================================
//  FAMILY MEMBER DETAIL & INTERACTION MODAL
// ============================================================================
//
//  Opens when tapping a family member from the Profile Screen roster.
//  Displays in-depth psychometrics, succession traits, financial demands,
//  and all actionable life interactions.
//
// ============================================================================

import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { PartnerProfile, Child } from '../../../core/store/useFamilyStore';

export type SelectedMember =
    | { type: 'partner'; data: PartnerProfile }
    | { type: 'child'; data: Child };

interface FamilyMemberDetailModalProps {
    visible: boolean;
    member: SelectedMember | null;
    isDesignatedSuccessor?: boolean;
    onClose: () => void;
    onGiftPartner?: () => void;
    onProposePartner?: () => void;
    onBreakupPartner?: () => void;
    onDatePartner?: () => void;
    onDesignateSuccessor?: (childId: string) => void;
    onAdjustAllowance?: (childId: string, delta: number) => void;
}

export const FamilyMemberDetailModal: React.FC<FamilyMemberDetailModalProps> = ({
    visible,
    member,
    isDesignatedSuccessor,
    onClose,
    onGiftPartner,
    onProposePartner,
    onBreakupPartner,
    onDatePartner,
    onDesignateSuccessor,
    onAdjustAllowance,
}) => {
    if (!member) return null;

    const isPartner = member.type === 'partner';
    const partner = isPartner ? member.data : null;
    const child = !isPartner ? member.data : null;

    const name = isPartner ? partner!.name : child!.name;
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Modal Top Bar */}
                    <View style={styles.topBar}>
                        <Text style={styles.topBarTitle}>
                            {isPartner ? 'PARTNER' : 'FAMILY MEMBER'}
                        </Text>
                        <Pressable style={styles.closeBtn} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.colors.textPrimary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Member Identity Header Card */}
                        <View style={styles.headerCard}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <View style={styles.identityBlock}>
                                <Text style={styles.memberName}>{name}</Text>
                                <Text style={styles.memberSub}>
                                    {isPartner
                                        ? `${partner!.stats.occupation} • Age ${partner!.stats.age}`
                                        : `${child!.role} • Age ${child!.age} (${child!.educationLevel})`}
                                </Text>
                            </View>
                            <View style={styles.badgesCol}>
                                {isPartner ? (
                                    <>
                                        <View style={styles.socialBadge}>
                                            <Text style={styles.socialBadgeText}>
                                                {partner!.stats.socialClass.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                partner!.isMarried && styles.marriedBadge,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusBadgeText,
                                                    partner!.isMarried && styles.marriedBadgeText,
                                                ]}
                                            >
                                                {partner!.isMarried ? 'MARRIED' : 'DATING'}
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    isDesignatedSuccessor && (
                                        <View style={styles.primaryHeirBadge}>
                                            <Text style={styles.primaryHeirText}>PRIMARY HEIR</Text>
                                        </View>
                                    )
                                )}
                            </View>
                        </View>

                        {/* Relationship Health Meter */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>
                                    {isPartner ? 'AFFECTION & DEVOTION' : 'FAMILY BOND'}
                                </Text>
                                <Text style={styles.meterValueText}>
                                    {isPartner ? partner!.love : child!.relationshipWithPlayer}%
                                </Text>
                            </View>
                            <View style={styles.meterTrack}>
                                <View
                                    style={[
                                        styles.meterFill,
                                        {
                                            width: `${isPartner ? partner!.love : child!.relationshipWithPlayer}%`,
                                            backgroundColor: '#9B7EE8',
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* ========================================================= */}
                        {/* PARTNER DEEP STATS & ACTIONS                              */}
                        {/* ========================================================= */}
                        {isPartner && partner && (
                            <>
                                {/* Deep Psychometrics Grid */}
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>PSYCHOMETRICS & TRAITS</Text>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>CRAZY</Text>
                                            <Text style={[styles.statTileValue, { color: '#E5983B' }]}>
                                                {partner.stats.crazy}%
                                            </Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>JEALOUSY</Text>
                                            <Text style={[styles.statTileValue, { color: '#05A8F6' }]}>
                                                {partner.stats.jealousy}%
                                            </Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>LOOKS</Text>
                                            <Text style={styles.statTileValue}>{partner.stats.looks}</Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>INTELLIGENCE</Text>
                                            <Text style={styles.statTileValue}>{partner.stats.intelligence}</Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>WEALTH</Text>
                                            <Text style={styles.statTileValue}>{partner.stats.familyWealth}</Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>LIBIDO</Text>
                                            <Text style={styles.statTileValue}>{partner.stats.libido}%</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Partner Financial Details */}
                                {partner.finances && (
                                    <View style={styles.sectionCard}>
                                        <View style={styles.rowBetween}>
                                            <Text style={styles.sectionTitle}>MONTHLY UPKEEP</Text>
                                            <Text style={styles.upkeepValue}>
                                                ${partner.finances.monthlyCost.toLocaleString()} / mo
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Partner Interaction Buttons */}
                                <View style={styles.actionsContainer}>
                                    <Text style={styles.sectionTitle}>INTERACTIONS</Text>
                                    <View style={styles.actionButtonsCol}>
                                        {onDatePartner && (
                                            <Pressable
                                                style={({ pressed }) => [styles.actionButton, styles.btnSurface, pressed && styles.btnPressed]}
                                                onPress={() => {
                                                    onDatePartner();
                                                    onClose();
                                                }}
                                            >
                                                <MaterialCommunityIcons name="glass-cocktail" size={18} color="#05A8F6" />
                                                <Text style={styles.btnSurfaceText}>Exclusive Date Night ($2.5k)</Text>
                                            </Pressable>
                                        )}

                                        {onGiftPartner && (
                                            <Pressable
                                                style={({ pressed }) => [styles.actionButton, styles.btnSurface, pressed && styles.btnPressed]}
                                                onPress={() => {
                                                    onGiftPartner();
                                                    onClose();
                                                }}
                                            >
                                                <MaterialCommunityIcons name="gift-outline" size={18} color="#05A8F6" />
                                                <Text style={styles.btnSurfaceText}>Send Luxury Gift ($15k)</Text>
                                            </Pressable>
                                        )}

                                        {!partner.isMarried && onProposePartner && (
                                            <Pressable
                                                style={({ pressed }) => [styles.actionButton, styles.btnAmber, pressed && styles.btnPressed]}
                                                onPress={() => {
                                                    onProposePartner();
                                                    onClose();
                                                }}
                                            >
                                                <MaterialCommunityIcons name="ring" size={18} color="#FBBF24" />
                                                <Text style={styles.btnAmberText}>Propose Marriage</Text>
                                            </Pressable>
                                        )}

                                        {onBreakupPartner && (
                                            <Pressable
                                                style={({ pressed }) => [styles.actionButton, styles.btnDestructive, pressed && styles.btnPressed]}
                                                onPress={() => {
                                                    onBreakupPartner();
                                                    onClose();
                                                }}
                                            >
                                                <MaterialCommunityIcons name="heart-broken" size={18} color={theme.colors.textSecondary} />
                                                <Text style={styles.btnDestructiveText}>
                                                    {partner.isMarried ? 'File for Divorce' : 'Break Up'}
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}

                        {/* ========================================================= */}
                        {/* CHILD DEEP STATS & SUCCESSION ACTIONS                     */}
                        {/* ========================================================= */}
                        {!isPartner && child && (
                            <>
                                {/* Succession Aptitude Stats */}
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>SUCCESSION SUITABILITY</Text>
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>BUSINESS ACUMEN</Text>
                                            <Text style={[styles.statTileValue, { color: '#E5983B' }]}>
                                                {child.stats.businessAcumen}
                                            </Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>INTELLECT</Text>
                                            <Text style={[styles.statTileValue, { color: '#05A8F6' }]}>
                                                {child.stats.intellect}
                                            </Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>AMBITION</Text>
                                            <Text style={[styles.statTileValue, { color: '#05A8F6' }]}>
                                                {child.stats.ambition}
                                            </Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>CHARM</Text>
                                            <Text style={styles.statTileValue}>{child.stats.charm}</Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>LOYALTY</Text>
                                            <Text style={styles.statTileValue}>{child.stats.loyalty}</Text>
                                        </View>
                                        <View style={styles.statTile}>
                                            <Text style={styles.statTileLabel}>HEALTH</Text>
                                            <Text style={styles.statTileValue}>{child.stats.health}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Traits List */}
                                {child.traits && child.traits.length > 0 && (
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>SPECIAL TRAITS</Text>
                                        <View style={styles.traitsWrap}>
                                            {child.traits.map((trait, index) => (
                                                <View key={index} style={styles.traitChip}>
                                                    <Text style={styles.traitText}>{trait}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Allowance Management */}
                                <View style={styles.sectionCard}>
                                    <View style={styles.rowBetween}>
                                        <View>
                                            <Text style={styles.sectionTitle}>QUARTERLY SUPPORT</Text>
                                            <Text style={styles.allowanceValue}>
                                                ${child.allowance.toLocaleString()}
                                            </Text>
                                        </View>
                                        {onAdjustAllowance && (
                                            <View style={styles.allowanceControls}>
                                                <Pressable
                                                    style={styles.stepBtn}
                                                    onPress={() => onAdjustAllowance(child.id, -250)}
                                                >
                                                    <Text style={styles.stepBtnText}>-</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.stepBtn}
                                                    onPress={() => onAdjustAllowance(child.id, 250)}
                                                >
                                                    <Text style={styles.stepBtnText}>+</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Child Interaction Buttons */}
                                <View style={styles.actionsContainer}>
                                    <Text style={styles.sectionTitle}>DYNASTY ACTIONS</Text>
                                    <View style={styles.actionButtonsCol}>
                                        {onDesignateSuccessor && !isDesignatedSuccessor && (
                                            <Pressable
                                                style={({ pressed }) => [styles.actionButton, styles.btnAmber, pressed && styles.btnPressed]}
                                                onPress={() => {
                                                    onDesignateSuccessor(child.id);
                                                    onClose();
                                                }}
                                            >
                                                <MaterialCommunityIcons name="crown" size={18} color="#FBBF24" />
                                                <Text style={styles.btnAmberText}>Designate as Primary Heir</Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background, // #1C242C Ground
    },
    safeArea: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    topBarTitle: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 40,
    },
    headerCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    identityBlock: {
        flex: 1,
    },
    memberName: {
        color: theme.colors.textPrimary,
        fontSize: 17,
        fontWeight: '700',
    },
    memberSub: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    badgesCol: {
        alignItems: 'flex-end',
        gap: 4,
    },
    socialBadge: {
        backgroundColor: '#183D5C',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    socialBadgeText: {
        color: '#7DD3FC',
        fontSize: 9,
        fontWeight: '700',
    },
    statusBadge: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    marriedBadge: {
        backgroundColor: '#183D5C',
    },
    statusBadgeText: {
        color: theme.colors.textSecondary,
        fontSize: 9,
        fontWeight: '700',
    },
    marriedBadgeText: {
        color: '#7DD3FC',
    },
    primaryHeirBadge: {
        backgroundColor: '#4E3A20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryHeirText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '700',
    },
    sectionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    meterValueText: {
        color: '#05A8F6',
        fontSize: 12,
        fontWeight: '700',
    },
    meterTrack: {
        height: 6,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 3,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 3,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statTile: {
        width: '31%',
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    statTileLabel: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 4,
        textAlign: 'center',
    },
    statTileValue: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    traitsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    traitChip: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    traitText: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    upkeepValue: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    allowanceControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    allowanceValue: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    actionsContainer: {
        marginTop: 4,
    },
    actionButtonsCol: {
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
        gap: 8,
    },
    btnSurface: {
        backgroundColor: theme.colors.surface,
    },
    btnSurfaceText: {
        color: '#05A8F6',
        fontSize: 13,
        fontWeight: '700',
    },
    btnAmber: {
        backgroundColor: '#4E3A20',
    },
    btnAmberText: {
        color: '#FBBF24',
        fontSize: 13,
        fontWeight: '700',
    },
    btnDestructive: {
        backgroundColor: theme.colors.surface,
    },
    btnDestructiveText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    btnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.99 }],
    },
});

export default FamilyMemberDetailModal;
