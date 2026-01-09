import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { EDUCATION_DATA, EducationProgram } from '../../../data/educationData';
import { canEnroll } from '../../../logic/educationLogic';
import { theme } from '../../../core/theme';
import SectionCard from '../../../components/common/SectionCard';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EducationScreen() {
    const player = usePlayerStore();
    const stats = useStatsStore();
    const { education, core } = player;

    const [activeTab, setActiveTab] = useState<'degrees' | 'certificates' | 'postgrad'>('degrees');

    // --- 1. ACTIVE STUDENT MODE ---
    const renderActiveMode = () => {
        if (!education.activeEnrollment) return null;

        const { programId, currentYear, progress } = education.activeEnrollment;

        // Find Program
        const allPrograms = [
            ...EDUCATION_DATA.degrees,
            ...EDUCATION_DATA.postgrad,
            ...EDUCATION_DATA.certificates,
        ];
        const program = allPrograms.find(p => p.id === programId);
        if (!program) return <Text style={{ color: 'red' }}>Error: Program not found</Text>;

        // Calculate Stats
        const quartersCompleted = Math.floor(progress / 25);
        const quartersRemaining = 4 - quartersCompleted;

        // Calculate accrued bonus (Simulated display)
        // Logic: +10 stat per year completed.
        // Current Bonus = (Current Year - 1) * 10
        const statName = program.buffs.statBoost ? Object.keys(program.buffs.statBoost)[0] : 'Intellect';
        const totalBonus = (currentYear - 1) * 10;

        const handleStudyHard = () => {
            // Stress Check
            if (core.stress >= 90) {
                Alert.alert('Burnout Warning', 'You are too stressed to study! Take a break.');
                return;
            }

            // Apply Actions
            player.updateCore('stress', core.stress + 15);
            player.makeStudyProgress(25); // Bonus 25% (1 Quarter worth)

            Alert.alert('Study Hard', 'You crammed effectively! (+25% Progress, +15 Stress)');
        };

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.activeContainer}>
                    {/* Header Info */}
                    <View style={styles.activeHeader}>
                        <View>
                            <Text style={styles.activeTitle}>{program.name}</Text>
                            <Text style={styles.activeSubtitle}>
                                {program.type === 'certificate' ? 'Certificate Program' : `Year ${currentYear} / ${program.durationYears}`}
                            </Text>
                        </View>
                        <View style={styles.iconCircle}>
                            <Ionicons name="school" size={24} color={theme.colors.accent} />
                        </View>
                    </View>

                    {/* Circular Progress (Simplified as Bar for now as no library) */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.floor(progress)}% Complete (Year {currentYear})</Text>
                    </View>

                    {/* Countdown Information */}
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.infoText}>
                            {quartersRemaining > 0
                                ? `${quartersRemaining} Quarters until Year ${currentYear + 1}`
                                : "Final Exams Pending..."
                            }
                        </Text>
                    </View>

                    {/* Stat Bonus Tracking */}
                    <View style={styles.bonusCard}>
                        <Text style={styles.bonusLabel}>Current Bonus Gained:</Text>
                        <Text style={styles.bonusValue}>+{totalBonus} {statName.charAt(0).toUpperCase() + statName.slice(1)}</Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleStudyHard}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionButtonText}>Study Hard / Cram</Text>
                        <Text style={styles.actionButtonSubtext}>+15 Stress • Guarantees Progress</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        );
    };

    // --- 2. CATALOG MODE ---
    const renderCatalog = () => {
        // Tab Headers
        const tabs = [
            { id: 'degrees', label: 'Degrees' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'postgrad', label: 'Masters/PhD' },
        ];

        let currentList: EducationProgram[] = [];
        if (activeTab === 'degrees') currentList = EDUCATION_DATA.degrees;
        else if (activeTab === 'certificates') currentList = EDUCATION_DATA.certificates;
        else currentList = EDUCATION_DATA.postgrad;

        return (
            <View style={{ flex: 1 }}>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab.id as any)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {currentList.map(program => {
                        const check = canEnroll(player, stats.money, program.id);
                        const isCompleted = education.completedEducation.includes(program.id);

                        // Button Text & State
                        let btnText = 'Enroll';
                        let btnDisabled = false;
                        let btnStyle: StyleProp<ViewStyle> = styles.enrollButton;

                        if (isCompleted) {
                            btnText = 'Completed';
                            btnDisabled = true;
                            btnStyle = styles.completedButton;
                        } else if (!check.success) {
                            btnText = check.reason ? check.reason.substring(0, 15) + '...' : 'Locked';
                            if (check.reason?.includes('Intellect')) btnText = `Req: Int ${program.reqIntellect}`;
                            else if (check.reason?.includes('funds')) btnText = 'No Funds';

                            btnDisabled = true;
                            btnStyle = styles.lockedButton;
                        }

                        const handleEnroll = () => {
                            if (check.success) {
                                Alert.alert(
                                    'Enrollment',
                                    `Enroll in ${program.name}?\n${program.type === 'certificate' ? 'Fee' : 'Yearly Tuition'}: $${program.costPerYear.toLocaleString()}`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Confirm', onPress: () => {
                                                if (stats.spendMoney(program.costPerYear)) {
                                                    player.enrollInProgram(program.id);
                                                    Alert.alert('Success', `Welcome to ${program.name}!`);
                                                } else {
                                                    Alert.alert('Error', 'Insufficient funds.');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }
                        };

                        return (
                            <View key={program.id} style={styles.programCard}>
                                {/* Left Icon */}
                                <View style={styles.programIcon}>
                                    <Ionicons
                                        name={program.type === 'certificate' ? "ribbon-outline" : "school-outline"}
                                        size={24}
                                        color={theme.colors.textSecondary}
                                    />
                                </View>

                                {/* Center Info */}
                                <View style={styles.programInfo}>
                                    <Text style={styles.cardTitle}>{program.name}</Text>
                                    <Text style={styles.cardSubtitle}>
                                        ${program.costPerYear.toLocaleString()}/{program.type === 'certificate' ? 'total' : 'yr'}
                                    </Text>
                                    {program.buffs?.salaryMultiplier && (
                                        <Text style={styles.cardBonus}>Potential: {program.buffs.salaryMultiplier}x Salary</Text>
                                    )}
                                </View>

                                {/* Right Button */}
                                <TouchableOpacity
                                    style={btnStyle}
                                    disabled={btnDisabled}
                                    onPress={handleEnroll}
                                >
                                    <Text style={styles.enrollButtonText}>{btnText}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {education.activeEnrollment ? renderActiveMode() : renderCatalog()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    // --- Active Mode Styles ---
    activeContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: theme.spacing.xl,
        marginTop: theme.spacing.md,
        alignItems: 'center',
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: theme.spacing.xl,
        alignItems: 'center'
    },
    activeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    activeSubtitle: {
        fontSize: theme.typography.body,
        color: theme.colors.textSecondary,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.cardSoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSection: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    progressBarBg: {
        height: 12,
        backgroundColor: theme.colors.border,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 6,
    },
    progressText: {
        alignSelf: 'center',
        color: theme.colors.textSecondary,
        fontSize: theme.typography.caption,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    infoText: {
        marginLeft: 6,
        color: theme.colors.textSecondary,
        fontSize: theme.typography.body,
    },
    bonusCard: {
        backgroundColor: theme.colors.success + '20', // transparent green
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.success + '50',
    },
    bonusLabel: {
        color: theme.colors.success,
        fontWeight: '600',
    },
    bonusValue: {
        color: theme.colors.success,
        fontWeight: 'bold',
    },
    actionButton: {
        backgroundColor: theme.colors.error, // Red for "Action/Stress"
        width: '100%',
        paddingVertical: 14,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    actionButtonSubtext: {
        color: '#FFDDDD',
        fontSize: 11,
    },

    // --- Catalog Mode Styles ---
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.md,
    },
    tabButton: {
        marginRight: theme.spacing.sm,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.cardSoft,
    },
    activeTabButton: {
        backgroundColor: theme.colors.accent,
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    activeTabText: {
        color: '#FFF',
    },
    programCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    programIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    programInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    cardBonus: {
        fontSize: 10,
        color: theme.colors.success,
        fontWeight: '600',
    },
    enrollButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    completedButton: {
        backgroundColor: theme.colors.success,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    lockedButton: {
        backgroundColor: theme.colors.cardSoft,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    enrollButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
