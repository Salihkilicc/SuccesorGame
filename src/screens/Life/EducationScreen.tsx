import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useStatsStore } from '../../store/useStatsStore';
import { EDUCATION_DATA, EducationProgram } from '../../data/educationData';
import {
    canEnroll,
    calculateStudyProgress,
    advanceEducationState,
    applyGraduationBuffs
} from '../../logic/educationLogic';
import { theme } from '../../theme';
import SectionCard from '../../components/common/SectionCard';

export default function EducationScreen() {
    const player = usePlayerStore();
    const stats = useStatsStore();
    const { education } = player;

    // --- Active Enrollment Section ---
    const renderActiveEnrollment = () => {
        if (!education.activeEnrollment) return null;

        const { programId, currentYear, progress } = education.activeEnrollment;

        // Find program details
        const allPrograms = [
            ...EDUCATION_DATA.degrees,
            ...EDUCATION_DATA.postgrad,
            ...EDUCATION_DATA.certificates,
        ];
        const program = allPrograms.find(p => p.id === programId);

        if (!program) return null;

        const handleStudy = () => {
            // 1. Calculate Progress
            const progressGain = calculateStudyProgress(player.attributes.intellect);

            // 2. Add Stress
            const currentStress = player.core.stress;
            const newStress = Math.min(100, currentStress + 15);
            player.updateCore('stress', newStress);

            // 3. Update Progress in Store
            player.makeStudyProgress(progressGain);

            // 4. Check for Year Advancement / Graduation
            // Note: We need to check the *new* progress. 
            // Since zustand update is sync, we can re-read or calc locally.
            // Ideally, makeStudyProgress caps it at 100.
            const currentProgressState = player.education.activeEnrollment?.progress ?? 0;

            // We check logic based on the updated state ideally, or just simulate the check
            // For safety, let's grab the potentially updated state if possible, or assume the logic holds:
            // (progress + gain) might be > 100.
            // Let's rely on the logic helper on the *next* render or check immediately?
            // Better to check immediately to give instant feedback.

            const simulatedProgress = Math.min(100, currentProgressState + progressGain); // logic fn duplicates this clamp usually

            if (simulatedProgress >= 100) {
                const advancement = advanceEducationState(
                    {
                        ...education.activeEnrollment!,
                        progress: simulatedProgress,
                        programId: program.id // Pass programID for boost logic
                    },
                    program.durationYears
                );

                if (advancement.type === 'graduate') {
                    player.graduateCurrent();
                    Alert.alert('Congratulations!', `You have graduated from ${program.name}!`);
                } else if (advancement.type === 'advance_year') {
                    // Update Year & Reset Progress
                    player.setAll({
                        education: {
                            ...player.education,
                            activeEnrollment: {
                                ...player.education.activeEnrollment!,
                                currentYear: advancement.nextYear,
                                progress: 0
                            }
                        }
                    });

                    // APPLY YEARLY BOOST
                    let boostMsg = '';
                    if (advancement.yearlyBoost) {
                        const { stat, amount } = advancement.yearlyBoost;
                        player.updateAttribute(stat as any, (player.attributes[stat as keyof typeof player.attributes] || 0) + amount);
                        boostMsg = `\n(Bonus: +${amount} ${stat.charAt(0).toUpperCase() + stat.slice(1)})`;
                    }

                    Alert.alert('Year Complete', `Welcome to Year ${advancement.nextYear}!${boostMsg}`);
                    // Optional: Charge tuition for next year? 
                    // Prompt says: "Yeni yılın ücretini tahsil etme mantığını hazırla." -> Prepare logic.
                    // If program has cost, we should try to charge.
                    if (program.costPerYear > 0) {
                        const paySuccess = stats.spendMoney(program.costPerYear);
                        if (!paySuccess) {
                            Alert.alert('Tuition Warning', 'You could not pay tuition for the new year. You are in debt (logic pending).');
                            // Or we could block advancement? For now, we just warn or let them go negative if store allows (store blocks usually).
                            // If store blocks, year advance might fail? 
                            // Let's keep it simple: Try to pay, if fail, warn.
                        }
                    }
                }
            }
        };

        return (
            <View style={styles.activeContainer}>
                <Text style={styles.headerTitle}>Current Education</Text>
                <View style={styles.activeCard}>
                    <View style={styles.activeHeader}>
                        <Text style={styles.programName}>{program.name}</Text>
                        <Text style={styles.yearBadge}>{program.type === 'certificate' ? 'Certificate' : `Year ${currentYear} / ${program.durationYears}`}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <View style={{
                            height: 12,
                            backgroundColor: theme.colors.cardSoft,
                            borderRadius: 6,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            <View style={{
                                width: `${Math.min(100, Math.max(0, progress))}%`,
                                height: '100%',
                                backgroundColor: theme.colors.accent
                            }} />
                        </View>
                        <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.studyButton}
                        onPress={handleStudy}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.studyButtonText}>Study Hard (+Stress)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // --- Catalog Section ---
    const renderCatalogSection = (title: string, programs: EducationProgram[]) => {
        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {programs.map(program => {
                    const isCompleted = education.completedEducation.includes(program.id);
                    const isEnrolled = education.activeEnrollment?.programId === program.id;
                    const enrollmentCheck = canEnroll(player, stats.money, program.id);

                    let statusText = '';
                    let statusColor = undefined;
                    let onPress = undefined;
                    let disabled = false;

                    if (isCompleted) {
                        statusText = 'Completed ✅';
                        statusColor = theme.colors.success;
                        disabled = true;
                    } else if (isEnrolled) {
                        statusText = 'Enrolled';
                        statusColor = theme.colors.accent;
                        disabled = true;
                    } else if (!enrollmentCheck.success) {
                        statusText = 'Locked';
                        disabled = true; // Use check logic for detailed message if pressed or just show locked
                    } else {
                        statusText = 'Enroll';
                        onPress = () => {
                            Alert.alert(
                                'Enrollment',
                                `Enroll in ${program.name} for $${program.costPerYear.toLocaleString()}?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Enroll',
                                        onPress: () => {
                                            if (stats.spendMoney(program.costPerYear)) {
                                                player.enrollInProgram(program.id);
                                                Alert.alert('Success', 'You are now enrolled!');
                                            } else {
                                                Alert.alert('Error', 'Insufficient funds.');
                                            }
                                        }
                                    }
                                ]
                            );
                        };
                    }

                    // Custom "Locked" message handling for subtitle if locked
                    const subtitle = !isCompleted && !isEnrolled && !enrollmentCheck.success
                        ? enrollmentCheck.reason
                        : `$${program.costPerYear.toLocaleString()} / year • ${program.durationYears} Years`;

                    return (
                        <SectionCard
                            key={program.id}
                            title={program.name}
                            subtitle={subtitle}
                            rightText={statusText}
                            onPress={onPress}
                            disabled={disabled}
                            style={isEnrolled ? { borderColor: theme.colors.accent } : undefined}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderActiveEnrollment()}

                {renderCatalogSection('Degrees', EDUCATION_DATA.degrees)}
                {renderCatalogSection('Postgraduate', EDUCATION_DATA.postgrad)}
                {renderCatalogSection('Certificates', EDUCATION_DATA.certificates)}

                <View style={styles.footerSpacer} />
            </ScrollView>
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
    headerTitle: {
        fontSize: theme.typography.title,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    activeContainer: {
        marginBottom: theme.spacing.xl,
    },
    activeCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    programName: {
        fontSize: theme.typography.subtitle,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    yearBadge: {
        backgroundColor: theme.colors.accentSoft,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
        color: theme.colors.accent,
        fontWeight: 'bold',
        fontSize: theme.typography.caption,
        marginLeft: theme.spacing.sm,
    },
    progressContainer: {
        marginBottom: theme.spacing.md,
    },
    progressLabel: {
        color: theme.colors.textSecondary,
        marginBottom: 4,
        fontSize: theme.typography.caption,
    },
    progressText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    studyButton: {
        backgroundColor: theme.colors.accent,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    studyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: theme.typography.body,
    },
    sectionContainer: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.subtitle,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footerSpacer: {
        height: 40,
    }
});
