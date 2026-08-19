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

// ============================================================================
//  THE CLASS BADGE, IN COLOURS THE APP ALREADY OWNS
// ============================================================================
//
//  This carried eight hand-picked hues - a gold, a green, a pink, a red - none
//  of which were in the palette. Two of them were worse than merely new:
//  #34D399 sits where the profit green does and #F87171 where the loss red
//  does, so an OLD MONEY badge read as a gain and an UNDERGROUND badge read as
//  a cost. A wayfinding colour that looks like a signal is worse than no
//  colour at all, which is rule 3 in core/theme.ts almost word for word.
//
//  `avatarTints` is the set this belongs in. It exists for exactly this: eight
//  hues with no valence, used to tell people apart, every one of them chosen
//  to take black text at better than 10:1. Social class is the same kind of
//  fact - categorical, no good or bad - so it gets the same set rather than a
//  ninth palette.
//
//  The mapping is FIXED rather than hashed. `avatarTintFor` hashes a name
//  because names are unbounded; there are six classes and they should not
//  change colour between two players.
// ============================================================================
const CLASS_TINT: Record<string, number> = {
    Royalty: 4,          // wheat
    HighSociety: 1,      // sand
    HIGH_SOCIETY: 1,
    OldMoney: 3,         // teal
    CorporateElite: 5,   // sky
    CORPORATE_ELITE: 5,
    BillionaireHeir: 2,  // rose
    Artistic: 6,         // lilac
    Underground: 0,      // coral
    UNDERGROUND: 0,
    WorkingClass: 7,     // sage
    MiddleClass: 7,
    CriminalElite: 0,
};

const getSocialClassTheme = (socialClass?: string): { color: string; bg: string; label: string } => {
    const tints = theme.colors.avatarTints;
    const color = tints[CLASS_TINT[socialClass ?? ''] ?? 5];
    return {
        color,
        // The badge fill is a SURFACE, not a wash of the hue. A tinted panel
        // is the thing that made these read as signals; the word and the
        // colour of the word are enough.
        bg: theme.colors.surfaceHigh,
        label: (socialClass || 'SOCIETY').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase(),
    };
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
                                <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
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
        backgroundColor: 'rgba(28, 36, 44, 0.88)',
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
        backgroundColor: theme.colors.surface,
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
        backgroundColor: theme.colors.surfaceHigh,
        borderWidth: 2,
        borderColor: theme.colors.accent,
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
        color: theme.colors.textSecondary,
    },
    occupationText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
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
    // ------------------------------------------------------------------
    //  THE TWO PILLS THAT WERE WEARING SIGNAL COLOURS
    // ------------------------------------------------------------------
    //  The trait pill was a violet wash and the buff pill was #34D399, which
    //  sits where the profit green does. So "gives you a business network"
    //  read as a gain in the same colour the income statement uses for one,
    //  on a card about a person.
    //
    //  Both are surfaces now, with the research violet on the trait text
    //  because a personality trait is the nearest thing on this card to a
    //  fact about capability. The buff keeps `brandMuted`, the section
    //  heading colour, because that is what it is: a label on a benefit.
    // ------------------------------------------------------------------
    traitPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceRaised,
    },
    traitPillText: {
        color: theme.colors.rp,
        fontSize: 10.5,
        fontWeight: '700',
    },
    buffPill: {
        backgroundColor: theme.colors.surfaceRaised,
    },
    buffPillText: {
        color: theme.colors.brandMuted,
        fontSize: 10.5,
        fontWeight: '700',
    },

    // Upkeep / Cost Bar (Dark Executive Styling)
    costBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
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
        color: theme.colors.textMuted,
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
        color: theme.colors.textSecondary,
        letterSpacing: 0.5,
    },

    // Scenario Box
    scenarioCard: {
        backgroundColor: theme.colors.background,
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
        color: theme.colors.textSecondary,
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
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    hookupButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFA94D',
    },
    hookupSubtext: {
        fontSize: 10.5,
        color: theme.colors.textSecondary,
    },
});

export default EncounterModal;
