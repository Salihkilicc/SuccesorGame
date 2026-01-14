import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEducationStore } from '../../../core/store/useEducationStore';
import { EDUCATION_DATA } from '../../education/data/educationData';
import { EducationItem, EducationType } from '../../education/educationTypes';
import { canEnroll } from '../../../logic/educationLogic';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EducationScreen() {
    const player = usePlayerStore();
    const stats = useStatsStore();
    const educationStore = useEducationStore();
    const { activeAcademic, activeCertificate, completedEducations, enroll } = educationStore;
    const { core } = player;

    // Use activeAcademic for legacy screen (this screen is being phased out)
    const activeEducation = activeAcademic;

    const [activeTab, setActiveTab] = useState<EducationType | 'advanced'>('degree');

    // --- 1. ACTIVE STUDENT MODE ---
    const renderActiveMode = () => {
        if (!activeEducation) return null;

        const { item: program, progress } = activeEducation;

        if (!program) return null;

        // Progress Calculation
        const progressPerQuarter = 100 / program.durationQuarter;
        const quartersRemaining = Math.max(0, Math.ceil((100 - progress) / progressPerQuarter));

        const benefitText = `+${program.benefits.intelligenceBonus} Intellect`;



        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.activeContainer}>
                    {/* Header Info */}
                    <View style={styles.activeHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activeTitle}>{program.title}</Text>
                            <Text style={styles.activeSubtitle}>
                                {program.type.toUpperCase()} • {program.field}
                            </Text>
                        </View>
                        <View style={styles.iconCircle}>
                            <Ionicons name="school" size={24} color={theme.colors.accent} />
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, progress))}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{progress.toFixed(1)}% Complete</Text>
                    </View>

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {quartersRemaining} Qtrs Left
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="bulb-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {benefitText}
                            </Text>
                        </View>
                    </View>

                    {/* Action Button */}
                    {/* Action Button */}
                    <View style={styles.infoItem}>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
                            Progress advances 1 quarter every specific time logic.
                        </Text>
                    </View>

                </View>
            </ScrollView>
        );
    };

    // --- 2. CATALOG MODE ---
    const renderCatalog = () => {
        type TabOption = { id: EducationType | 'advanced', label: string };
        const tabs: TabOption[] = [
            { id: 'certificate', label: 'Certificates' },
            { id: 'degree', label: 'Degrees' },
            { id: 'advanced', label: 'Masters/PhD' },
        ];

        let currentList = EDUCATION_DATA.filter(p => {
            if (activeTab === 'advanced') {
                return p.type === 'master' || p.type === 'phd';
            }
            return p.type === activeTab;
        });

        return (
            <View style={{ flex: 1 }}>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {currentList.map(program => {
                        const check = canEnroll({
                            completedEducations,
                            activeProgramId: activeEducation?.item?.id,
                            money: stats.money
                        }, program.id);
                        const isCompleted = completedEducations.includes(program.id);

                        // Layout
                        let btnText = 'Enroll';
                        let btnDisabled = false;
                        let btnStyle: StyleProp<ViewStyle> = styles.enrollButton;

                        if (isCompleted) {
                            btnText = 'Completed';
                            btnDisabled = true;
                            btnStyle = styles.completedButton;
                        } else if (!check.success) {
                            btnText = 'Locked';
                            if (check.reason?.includes('Intellect')) btnText = `Req: Int ${program.requirements.minIntelligence}`;
                            else if (check.reason?.includes('funds')) btnText = 'No Funds';
                            else if (check.reason?.includes('Prerequisite')) btnText = 'Missing Deg.';

                            btnDisabled = true;
                            btnStyle = styles.lockedButton;
                        }

                        const handleEnroll = () => {
                            if (check.success) {
                                const cost = check.costToPay || program.cost || 0;
                                const costLabel = program.isMonthlyCost ? 'Monthly/Quarterly Tuition' : 'Tuition Fee';

                                Alert.alert(
                                    'Enrollment',
                                    `Enroll in ${program.title}?\n${costLabel}: $${cost.toLocaleString()}`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Confirm', onPress: () => {
                                                try {
                                                    enroll(program);
                                                    Alert.alert('Success', `Welcome to ${program.title}!`);
                                                } catch (e: any) {
                                                    Alert.alert('Enrollment Failed', e.message);
                                                }
                                            }
                                        }
                                    ]
                                );
                            } else {
                                if (check.reason) Alert.alert('Cannot Enroll', check.reason);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={program.id}
                                style={styles.programCard}
                                onPress={() => !check.success && !isCompleted ? Alert.alert("Requirements", check.reason) : null}
                                activeOpacity={0.9}
                            >
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
                                    <Text style={styles.cardTitle}>{program.title}</Text>
                                    <View style={styles.tagsRow}>
                                        <View style={styles.tag}>
                                            <Text style={styles.tagText}>${program.cost.toLocaleString()}{program.isMonthlyCost ? '/mo' : ''}</Text>
                                        </View>
                                        <View style={styles.tag}>
                                            <Text style={styles.tagText}>{program.durationQuarter} Qtrs</Text>
                                        </View>
                                    </View>
                                    {program.requirements.minIntelligence && (
                                        <Text style={styles.reqText}>Min Intellect: {program.requirements.minIntelligence}</Text>
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
                            </TouchableOpacity>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {activeEducation ? renderActiveMode() : renderCatalog()}
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
        marginBottom: theme.spacing.md,
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
    infoGrid: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 8,
        borderRadius: 8,
    },
    infoText: {
        marginLeft: 6,
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
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
    tagsRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    tag: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    tagText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    reqText: {
        fontSize: 10,
        color: '#ffc107',
        fontStyle: 'italic',
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
