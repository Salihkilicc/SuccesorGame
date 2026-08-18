// src/features/love/components/EncounterModal.tsx
//
// ============================================================================
//  ENCOUNTER CANDIDATE MODAL (EXECUTIVE THEME RENOVATION)
// ============================================================================
//
//  Ultra-premium VIP encounter card matching the game's dark theme:
//  #1C242C, #05A8F6, #FFA94D, sleek typography, crisp dark surface cards,
//  social class badges, psychometric traits, and refined date/hookup actions.
//
// ============================================================================

import React, { useEffect, useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    SafeAreaView,
    StatusBar,
    Pressable,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { PartnerProfile, SocialClass } from '../../../data/relationshipTypes';
import { EncounterScenario } from '../data/encounterData';

const { width } = Dimensions.get('window');

interface EncounterModalProps {
    visible: boolean;
    candidate: PartnerProfile | null;
    scenario: EncounterScenario | null;
    context: string;
    onIgnore: () => void;
    onHookup: () => void;
    onDate: () => void;
    isEmbedded?: boolean;
}

// Helper functions for Social Class & Tier Badges
const getSocialClassTheme = (socialClass?: string): { color: string; bg: string; label: string } => {
    switch (socialClass) {
        case 'Royalty':
            return { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.14)', label: 'ROYALTY' };
        case 'HighSociety':
        case 'HIGH_SOCIETY':
            return { color: '#FFA94D', bg: 'rgba(255, 169, 77, 0.14)', label: 'HIGH SOCIETY' };
        case 'OldMoney':
            return { color: '#34D399', bg: 'rgba(52, 211, 153, 0.14)', label: 'OLD MONEY' };
        case 'CorporateElite':
        case 'CORPORATE_ELITE':
            return { color: '#05A8F6', bg: 'rgba(5, 168, 246, 0.14)', label: 'CORPORATE ELITE' };
        case 'BillionaireHeir':
            return { color: '#F472B6', bg: 'rgba(244, 114, 182, 0.14)', label: 'BILLIONAIRE HEIR' };
        case 'Artistic':
            return { color: '#C084FC', bg: 'rgba(192, 132, 252, 0.14)', label: 'ARTISTIC' };
        case 'Underground':
        case 'UNDERGROUND':
            return { color: '#F87171', bg: 'rgba(248, 113, 113, 0.14)', label: 'UNDERGROUND' };
        default:
            return { color: '#7DD3FC', bg: 'rgba(125, 211, 252, 0.14)', label: (socialClass || 'SOCIETY').toUpperCase() };
    }
};

export const EncounterModal: React.FC<EncounterModalProps> = ({
    visible,
    candidate,
    scenario,
    context,
    onIgnore,
    onHookup,
    onDate,
    isEmbedded = false,
}) => {
    useLocale();
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    if (!visible || !candidate || !scenario) return null;

    // Resolve Deep Persona / Partner data
    const isDeepPersona = 'job' in candidate && 'personality' in candidate && 'finances' in candidate;
    const deepPartner = isDeepPersona ? (candidate as any) : null;

    const initials = candidate.name
        ? candidate.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
        : 'VIP';

    const socialClass = candidate.stats?.socialClass || deepPartner?.job?.tier || 'HighSociety';
    const classTheme = getSocialClassTheme(socialClass);
    const occupation = candidate.stats?.occupation || deepPartner?.job?.title || 'High Society Figure';
    const age = candidate.stats?.age || deepPartner?.age || 28;
    const monthlyCost = candidate.finances?.monthlyCost || deepPartner?.finances?.monthlyCost || 0;
    const trait = deepPartner?.personality?.label || candidate.stats?.style || null;

    const content = (
        <View style={styles.overlay}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Main Executive Card */}
                    <View style={styles.profileCard}>
                        {/* Top Header Row: Category Badge & Close Button */}
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.contextBadge}>
                                <MaterialCommunityIcons name="crown" size={13} color="#05A8F6" style={{ marginRight: 4 }} />
                                <Text style={styles.contextBadgeText}>
                                    {context === 'VIP_LOUNGE' ? 'VIP LOUNGE ENCOUNTER' : 'ELITE CIRCLE ENCOUNTER'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={onIgnore} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="close" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Candidate Identity Block */}
                        <View style={styles.identitySection}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>

                            <Text style={styles.nameText}>
                                {candidate.name}
                                <Text style={styles.ageText}>, {age}</Text>
                            </Text>

                            <Text style={styles.occupationText} numberOfLines={1}>
                                {occupation}
                            </Text>

                            {/* Tags / Badges Row */}
                            <View style={styles.badgeRow}>
                                <View style={[styles.pillBadge, { backgroundColor: classTheme.bg }]}>
                                    <Text style={[styles.pillText, { color: classTheme.color }]}>
                                        {classTheme.label}
                                    </Text>
                                </View>

                                {trait && (
                                    <View style={[styles.pillBadge, styles.traitPill]}>
                                        <MaterialCommunityIcons name="sparkles" size={11} color="#C4B5FD" style={{ marginRight: 3 }} />
                                        <Text style={styles.traitPillText}>{trait.toUpperCase()}</Text>
                                    </View>
                                )}

                                {candidate.stats?.reputationBuff && candidate.stats.reputationBuff > 0 && (
                                    <View style={[styles.pillBadge, styles.buffPill]}>
                                        <Text style={styles.buffPillText}>+{candidate.stats.reputationBuff} Rep</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Monthly Upkeep Bar (Dark Theme) */}
                        {monthlyCost > 0 && (
                            <View style={styles.costBar}>
                                <View style={styles.costIconWrap}>
                                    <MaterialCommunityIcons name="credit-card-outline" size={18} color="#FFA94D" />
                                </View>
                                <View style={styles.costInfo}>
                                    <Text style={styles.costLabel}>{t('love.monthlyUpkeep') || 'MONTHLY UPKEEP'}</Text>
                                    <Text style={styles.costValue}>${monthlyCost.toLocaleString()}/mo</Text>
                                </View>
                                <View style={styles.lifestyleTag}>
                                    <Text style={styles.lifestyleText}>LUXURY</Text>
                                </View>
                            </View>
                        )}

                        {/* Encounter Scenario Box */}
                        <View style={styles.scenarioCard}>
                            <MaterialCommunityIcons
                                name="format-quote-open"
                                size={18}
                                color="#05A8F6"
                                style={styles.quoteIcon}
                            />
                            <Text style={styles.scenarioText}>"{scenario.text}"</Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            {/* Primary: Date / Court */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.dateButton]}
                                onPress={onDate}
                                activeOpacity={0.85}
                            >
                                <View style={styles.btnRow}>
                                    <MaterialCommunityIcons name="heart" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.dateButtonText}>Court & Start Dating</Text>
                                </View>
                                <Text style={styles.dateSubtext} numberOfLines={1}>
                                    "{scenario.flirt}"
                                </Text>
                            </TouchableOpacity>

                            {/* Secondary: Casual Hookup */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.hookupButton]}
                                onPress={onHookup}
                                activeOpacity={0.85}
                            >
                                <View style={styles.btnRow}>
                                    <MaterialCommunityIcons name="fire" size={18} color="#FFA94D" style={{ marginRight: 6 }} />
                                    <Text style={styles.hookupButtonText}>Casual Hookup</Text>
                                </View>
                                <Text style={styles.hookupSubtext}>
                                    {t('love.noStringsAttached') || 'No Strings Attached'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </View>
    );

    if (isEmbedded) {
        return <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>{content}</View>;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={onIgnore}
        >
            {content}
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 30, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    container: {
        width: '100%',
        maxWidth: 390,
    },
    safeArea: {
        position: 'relative',
    },

    // Main Profile Card
    profileCard: {
        backgroundColor: '#1E2833',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
    },

    // Header Row
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    contextBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(5, 168, 246, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    contextBadgeText: {
        color: '#05A8F6',
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Identity Section
    identitySection: {
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#183D5C',
        borderWidth: 2,
        borderColor: '#05A8F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    nameText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        marginBottom: 3,
        textAlign: 'center',
    },
    ageText: {
        fontSize: 17,
        fontWeight: '500',
        color: '#94A3B8',
    },
    occupationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 12,
        textAlign: 'center',
    },

    // Badges Row
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    pillBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 7,
    },
    pillText: {
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    traitPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(192, 132, 252, 0.14)',
    },
    traitPillText: {
        color: '#C084FC',
        fontSize: 10.5,
        fontWeight: '700',
    },
    buffPill: {
        backgroundColor: 'rgba(52, 211, 153, 0.14)',
    },
    buffPillText: {
        color: '#34D399',
        fontSize: 10.5,
        fontWeight: '700',
    },

    // Upkeep / Cost Bar (Dark Executive Styling)
    costBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#151D26',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    costIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 169, 77, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    costInfo: {
        flex: 1,
    },
    costLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 1,
    },
    costValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    lifestyleTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    lifestyleText: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },

    // Scenario Box
    scenarioCard: {
        backgroundColor: '#151D26',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
    },
    quoteIcon: {
        position: 'absolute',
        top: 8,
        left: 8,
        opacity: 0.35,
    },
    scenarioText: {
        fontSize: 13,
        lineHeight: 19,
        color: '#CBD5E1',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 8,
    },

    // Buttons
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    dateButton: {
        backgroundColor: '#05A8F6',
    },
    dateButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    dateSubtext: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.85)',
        fontStyle: 'italic',
    },
    hookupButton: {
        backgroundColor: '#263342',
        borderWidth: 1,
        borderColor: 'rgba(255, 169, 77, 0.3)',
    },
    hookupButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFA94D',
    },
    hookupSubtext: {
        fontSize: 10.5,
        color: '#94A3B8',
    },
});

export default EncounterModal;
