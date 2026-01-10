import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { theme } from '../../../core/theme';
import { PartnerProfile } from '../../../data/relationshipTypes';
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
}

// Helper functions for Deep Persona display
const getTierBadgeColor = (tier: string): string => {
    switch (tier) {
        case 'HIGH_SOCIETY': return '#FFD700';
        case 'CORPORATE_ELITE': return '#1E3A8A';
        case 'UNDERGROUND': return '#7C2D12';
        case 'BLUE_COLLAR': return '#64748B';
        case 'STUDENT_LIFE': return '#0EA5E9';
        case 'ARTISTIC': return '#A855F7';
        default: return theme.colors.accent;
    }
};

const getTierLabel = (tier: string): string => {
    switch (tier) {
        case 'HIGH_SOCIETY': return 'High Society';
        case 'CORPORATE_ELITE': return 'Corporate Elite';
        case 'UNDERGROUND': return 'Underground';
        case 'BLUE_COLLAR': return 'Blue Collar';
        case 'STUDENT_LIFE': return 'Student';
        case 'ARTISTIC': return 'Artistic';
        default: return tier;
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
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    if (!visible || !candidate || !scenario) return null;

    // Check if this is a Deep Persona partner
    const isDeepPersona = 'job' in candidate && 'personality' in candidate && 'finances' in candidate;
    const deepPartner = isDeepPersona ? (candidate as any) : null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" />
                <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                    <SafeAreaView style={styles.safeArea}>

                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onIgnore}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>

                        {/* Profile Card */}
                        <View style={styles.profileCard}>

                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarText}>
                                        {candidate.name?.charAt(0) || '?'}
                                    </Text>
                                </View>
                            </View>

                            {/* Name & Age */}
                            <Text style={styles.nameText}>
                                {candidate.name || 'Unknown'}
                                {deepPartner?.age && `, ${deepPartner.age}`}
                            </Text>

                            {/* Job Title */}
                            {deepPartner?.job?.title && (
                                <Text style={styles.jobTitle}>
                                    {deepPartner.job.title}
                                </Text>
                            )}

                            {/* Tier Badge & Personality */}
                            {deepPartner?.job?.tier && (
                                <View style={styles.badgeRow}>
                                    <View style={[styles.tierBadge, {
                                        backgroundColor: getTierBadgeColor(deepPartner.job.tier) + '20',
                                        borderColor: getTierBadgeColor(deepPartner.job.tier),
                                    }]}>
                                        <Text style={[styles.tierText, {
                                            color: getTierBadgeColor(deepPartner.job.tier)
                                        }]}>
                                            {getTierLabel(deepPartner.job.tier)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Personality Trait */}
                            {deepPartner?.personality?.label && (
                                <View style={styles.traitRow}>
                                    <Text style={styles.traitLabel}>Trait:</Text>
                                    <Text style={styles.traitValue}>
                                        {deepPartner.personality.label}
                                    </Text>
                                </View>
                            )}

                            {/* Monthly Cost */}
                            {deepPartner?.finances?.monthlyCost > 0 && (
                                <View style={styles.costContainer}>
                                    <Text style={styles.costIcon}>💰</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.costLabel}>Monthly Upkeep</Text>
                                        <Text style={styles.costValue}>
                                            ${deepPartner.finances.monthlyCost.toLocaleString()}/mo
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Scenario Text */}
                            <View style={styles.scenarioContainer}>
                                <Text style={styles.scenarioText}>
                                    "{scenario.text}"
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.dateButton]}
                                    onPress={onDate}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.dateButtonText}>❤️ Date</Text>
                                    <Text style={styles.dateSubtext}>"{scenario.flirt}"</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.hookupButton]}
                                    onPress={onHookup}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.hookupButtonText}>🔥 Hookup</Text>
                                    <Text style={styles.hookupSubtext}>No strings attached</Text>
                                </TouchableOpacity>
                            </View>

                        </View>

                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        maxWidth: 400,
    },
    safeArea: {
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: -40,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '600',
    },

    // Profile Card
    profileCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },

    // Avatar
    avatarContainer: {
        marginBottom: 16,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.accentSoft,
        borderWidth: 3,
        borderColor: theme.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: theme.colors.accent,
    },

    // Name & Job
    nameText: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 12,
        textAlign: 'center',
    },

    // Badges
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tierBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    tierText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Trait
    traitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    traitLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    traitValue: {
        fontSize: 13,
        color: theme.colors.textPrimary,
        fontStyle: 'italic',
        fontWeight: '600',
    },

    // Cost
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
    },
    costIcon: {
        fontSize: 24,
    },
    costLabel: {
        fontSize: 11,
        color: '#7F1D1D',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    costValue: {
        fontSize: 18,
        color: '#DC2626',
        fontWeight: '800',
    },

    // Scenario
    scenarioContainer: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    scenarioText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    // Buttons
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateButton: {
        backgroundColor: theme.colors.accent,
    },
    dateButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    dateSubtext: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontStyle: 'italic',
    },
    hookupButton: {
        backgroundColor: theme.colors.cardSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    hookupButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    hookupSubtext: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },
});
