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
import { theme } from '../../theme';
import { PartnerProfile } from '../../data/relationshipTypes';
import { EncounterScenario } from './data/encounterData';

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
                duration: 800,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    if (!visible || !candidate || !scenario) return null;

    // --- Theme Logic ---
    const getBorderColor = () => {
        switch (candidate.stats.socialClass) {
            case 'Royalty':
            case 'BillionaireHeir':
                return '#FFD700'; // Gold
            case 'CriminalElite':
                return '#FF4444'; // Danger Red
            case 'OldMoney':
                return '#C0C0C0'; // Silver
            case 'HighSociety':
                return '#E6E6FA'; // Lavender
            default:
                return theme.colors.accent;
        }
    };

    const borderColor = getBorderColor();

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

                        {/* === 1. CONTEXT HEADER === */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.contextText}>
                                {context.toUpperCase().replace('_', ' • ')}
                            </Text>
                        </View>

                        {/* === 2. AVATAR & CHARACTER INFO === */}
                        <View style={styles.characterContainer}>
                            <View style={[styles.avatarCircle, { borderColor }]}>
                                {/* Placeholder for Character Image */}
                                <Text style={styles.avatarPlaceholder}>
                                    {candidate.name.charAt(0)}
                                </Text>
                            </View>

                            <Text style={styles.charName}>
                                {candidate.name}
                            </Text>

                            <Text style={styles.charDetail}>
                                {candidate.stats.occupation} • {candidate.stats.socialClass}
                            </Text>

                            {/* Stats Preview (Refined) */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statIcon}>❤️</Text>
                                    <Text style={styles.statValue}>{candidate.stats.looks}</Text>
                                    <Text style={styles.statLabel}>Looks</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statIcon}>🧠</Text>
                                    <Text style={styles.statValue}>{Math.round(candidate.stats.intelligence)}</Text>
                                    <Text style={styles.statLabel}>Smart</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statIcon}>🎂</Text>
                                    <Text style={styles.statValue}>{candidate.stats.age}</Text>
                                    <Text style={styles.statLabel}>Age</Text>
                                </View>
                            </View>
                        </View>

                        {/* === 3. NARRATIVE === */}
                        <View style={styles.narrativeContainer}>
                            <Text style={styles.narrativeText}>
                                "{scenario.text}"
                            </Text>
                        </View>

                        {/* === 4. ACTIONS === */}
                        <View style={styles.actionsContainer}>

                            {/* DATE BUTTON (Main Action) */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.dateButton]}
                                onPress={onDate}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.flirtText}>
                                    "{scenario.flirt}"
                                </Text>
                                <Text style={styles.dateLabel}>DATE ❤️</Text>
                            </TouchableOpacity>

                            {/* FLING BUTTON (Secondary) */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.flingButton]}
                                onPress={onHookup}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.flingText}>HAVE FUN 🔥</Text>
                                <Text style={styles.subText}>No strings attached.</Text>
                            </TouchableOpacity>

                            {/* IGNORE BUTTON (Tertiary) */}
                            <TouchableOpacity
                                style={styles.ignoreButton}
                                onPress={onIgnore}
                            >
                                <Text style={styles.ignoreText}>Ignore & Walk Away</Text>
                            </TouchableOpacity>

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
        backgroundColor: 'rgba(0, 0, 0, 0.90)', // Ultra Dark Cinematic
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },

    // Header
    headerContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    contextText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },

    // Character
    characterContainer: {
        alignItems: 'center',
        marginTop: -40, // Visual adjustment
    },
    avatarCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        backgroundColor: theme.colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarPlaceholder: {
        fontSize: 48,
        color: theme.colors.textMuted,
        fontWeight: '300',
    },
    charName: {
        fontSize: 28,
        color: theme.colors.textPrimary,
        fontWeight: '300', // Light font for elegance
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    charDetail: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statIcon: {
        fontSize: 16,
        marginBottom: 2,
    },
    statValue: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // Narrative
    narrativeContainer: {
        paddingHorizontal: 10,
    },
    narrativeText: {
        color: theme.colors.textPrimary,
        fontSize: 20,
        lineHeight: 30,
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '400',
        opacity: 0.9,
    },

    // Actions
    actionsContainer: {
        gap: 16,
        width: '100%',
        paddingBottom: 20,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },

    // Date Button
    dateButton: {
        backgroundColor: theme.colors.accentSoft,
        borderColor: theme.colors.accent,
    },
    flirtText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    dateLabel: {
        color: theme.colors.accent,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 4,
    },

    // Fling Button
    flingButton: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: theme.colors.border,
    },
    flingText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    subText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        marginTop: 2,
    },

    // Ignore Button
    ignoreButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    ignoreText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
});
