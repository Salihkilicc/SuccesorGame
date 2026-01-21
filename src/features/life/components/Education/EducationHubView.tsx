import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    ImageBackground
} from 'react-native';
import { useEducationSystem } from './useEducationSystem';
import { MAJOR_DATA, MajorType, CERTIFICATE_DATA, CertificateType, MASTERS_DATA, MastersType } from './educationData';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

// ========================================
// TYPES
// ========================================

interface EducationHubViewProps {
    onNavigate: (view: 'CLUBS' | 'PROGRAMS' | 'TRANSCRIPT', params?: { tab?: 'Certificate' }) => void;
    onStudy: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const EducationHubView: React.FC<EducationHubViewProps> = ({ onNavigate, onStudy }) => {
    const { activeDegree, activeCertificate, salaryMultiplier, closeEducation } = useEducationSystem();
    const hasStudied = usePlayerStore((state) => state.quarterlyActions.hasStudied);

    // Helper to get program display details
    const getProgramDisplay = (id: string, type: string, isCertificate: boolean) => {
        if (isCertificate) {
            return {
                label: CERTIFICATE_DATA[id as CertificateType]?.label || id,
                typeLabel: 'Certificate',
                durationLabel: 'Months'
            };
        }
        if (type === 'Master' && id in MASTERS_DATA) {
            return {
                label: MASTERS_DATA[id as MastersType]?.label || id,
                typeLabel: "Master's Degree",
                durationLabel: 'Years'
            };
        }
        if (type === 'PhD') {
            return {
                label: MAJOR_DATA[id as MajorType]?.label || id,
                typeLabel: "PhD",
                durationLabel: 'Years'
            };
        }
        return {
            label: MAJOR_DATA[id as MajorType]?.label || id,
            typeLabel: "Bachelor's Degree",
            durationLabel: 'Years'
        };
    };

    const renderPrimaryProgress = () => {
        if (!activeDegree) {
            // Placeholder if no degree
            return (
                <View style={styles.primaryCardEmpty}>
                    <Text style={styles.emptyTitle}>No Active Degree</Text>
                    <Text style={styles.emptySubtitle}>Start your academic journey today.</Text>
                    <TouchableOpacity
                        style={styles.enrollBtnPrimary}
                        onPress={() => onNavigate('PROGRAMS')}
                    >
                        <Text style={styles.enrollBtnText}>Browse Degrees</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const { id, type, progress, totalDuration } = activeDegree;
        const { label, typeLabel } = getProgramDisplay(id, type, false);

        const currentYear = Math.ceil(progress / 4);
        const totalYears = Math.ceil(totalDuration / 4);
        const progressPercentage = (progress / totalDuration) * 100;
        const remainingQuarters = totalDuration - progress;

        return (
            <View style={styles.primaryCard}>
                <View style={styles.primaryHeader}>
                    <View>
                        <Text style={styles.primaryType}>{typeLabel}</Text>
                        <Text style={styles.primaryTitle}>{label}</Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Text style={styles.primaryIcon}>🎓</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressText}>Year {currentYear} of {totalYears}</Text>
                        <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Text style={styles.remainingText}>
                        {remainingQuarters === 0 ? 'Final Quarter!' : `${remainingQuarters} Quarter${remainingQuarters !== 1 ? 's' : ''} Remaining`}
                    </Text>
                </View>
            </View>
        );
    };

    const renderSecondaryProgress = () => {
        if (activeCertificate) {
            const { id, progress, totalDuration } = activeCertificate;
            const { label } = getProgramDisplay(id, 'Certificate', true);
            const progressPercentage = (progress / totalDuration) * 100;
            const currentMonth = progress * 3; // Approx quarters to months
            const remainingQuarters = totalDuration - progress;

            return (
                <View style={styles.secondaryCard}>
                    <View style={styles.secondaryHeader}>
                        <Text style={styles.secondaryType}>ACTIVE CERTIFICATE</Text>
                        <Text style={styles.secondaryTitle}>{label}</Text>
                    </View>

                    <View style={styles.secondaryProgressRow}>
                        <View style={styles.secondaryBarBg}>
                            <View style={[styles.secondaryBarFill, { width: `${progressPercentage}%` }]} />
                        </View>
                        <Text style={styles.secondaryPercent}>{Math.round(progressPercentage)}%</Text>
                    </View>
                    <Text style={styles.secondaryDetail}>Month {Math.ceil(currentMonth)}</Text>
                    <Text style={styles.secondaryRemaining}>
                        {remainingQuarters === 0 ? 'Completing Soon!' : `${remainingQuarters} Quarter${remainingQuarters !== 1 ? 's' : ''} Left`}
                    </Text>
                </View>
            );
        }

        // Add Skill Placeholder
        return (
            <TouchableOpacity
                style={styles.addSkillCard}
                onPress={() => onNavigate('PROGRAMS', { tab: 'Certificate' })}
                activeOpacity={0.7}
            >
                <View style={styles.addSkillIconContainer}>
                    <Text style={styles.addSkillIcon}>+</Text>
                </View>
                <View>
                    <Text style={styles.addSkillTitle}>Add a Skill</Text>
                    <Text style={styles.addSkillSubtitle}>Enroll in a Certificate Program</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const menuItems = [
        {
            id: 'LIBRARY',
            title: 'Library',
            icon: '📚',
            subtitle: '+3 Intellect',
            action: onStudy,
        },
        {
            id: 'CLUBS',
            title: 'Student Clubs',
            icon: '🤝',
            subtitle: 'Join Elite Societies',
            action: () => onNavigate('CLUBS'),
        },
        {
            id: 'TRANSCRIPT',
            title: 'Transcript',
            icon: '📜',
            subtitle: `Multiplier: ${salaryMultiplier()}x`,
            action: () => onNavigate('TRANSCRIPT'),
        },
    ];

    return (
        <View style={styles.backdrop}>
            {/* Main Card Content */}
            <View style={styles.mainContainer}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={closeEducation} style={styles.closeBtn}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.universitySymbol}>🏛️</Text>
                            <View>
                                <Text style={styles.headerTitle}>IVY LEAGUE</Text>
                                <Text style={styles.headerSubtitle}>UNIVERSITY</Text>
                            </View>
                        </View>

                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Primary Progress (Degree) */}
                        {renderPrimaryProgress()}

                        {/* Secondary Progress (Certificate) */}
                        <View style={styles.secondarySection}>
                            {renderSecondaryProgress()}
                        </View>

                        {/* Menu Section */}
                        <View style={styles.menuSection}>
                            {/* Row 1: Library and Clubs */}
                            <View style={styles.menuRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.menuItemHalf,
                                        hasStudied && styles.menuItemDisabled
                                    ]}
                                    onPress={onStudy}
                                    activeOpacity={hasStudied ? 1 : 0.7}
                                    disabled={hasStudied}
                                >
                                    <Text style={styles.menuIcon}>📚</Text>
                                    <Text style={styles.menuTitle}>Library</Text>
                                    <Text style={[
                                        styles.menuSubtitle,
                                        hasStudied && styles.menuSubtitleDisabled
                                    ]}>
                                        {hasStudied ? 'Already Studied' : '+3 Intellect'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.menuItemHalf}
                                    onPress={() => onNavigate('CLUBS')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.menuIcon}>🤝</Text>
                                    <Text style={styles.menuTitle}>Student Clubs</Text>
                                    <Text style={styles.menuSubtitle}>Join Elite Societies</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Row 2: Education History (Full Width) */}
                            <TouchableOpacity
                                style={styles.menuItemFull}
                                onPress={() => onNavigate('TRANSCRIPT')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.menuIconLarge}>📜</Text>
                                <View style={styles.menuFullContent}>
                                    <Text style={styles.menuTitleLarge}>Education History</Text>
                                    <Text style={styles.menuSubtitleLarge}>Salary Multiplier: {salaryMultiplier()}x</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>

            {/* Bottom Stats Bar */}
            <View style={styles.bottomBarContainer}>
                <BottomStatsBar />
            </View>
        </View>
    );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    mainContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    universitySymbol: {
        fontSize: 24,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1e3a8a',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#d4af37', // Gold
        letterSpacing: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 16,
        color: '#374151',
    },

    // Primary Card (Degree)
    primaryCard: {
        backgroundColor: '#1e3a8a', // Dark Blue
        borderRadius: 20,
        padding: 24,
        marginBottom: 4, // Tight spacing with secondary
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryCardEmpty: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    enrollBtnPrimary: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    enrollBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    primaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    primaryType: {
        color: '#93c5fd', // Light Blue
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    primaryTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        maxWidth: 240,
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryIcon: {
        fontSize: 24,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        color: '#e0f2fe',
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#d4af37', // Gold
        borderRadius: 6,
    },

    // Secondary Section (Certificate)
    secondarySection: {
        alignItems: 'center',
        marginBottom: 30,
        zIndex: -1, // Sits slightly 'behind' visually if we added negative margin
    },
    secondaryCard: {
        width: '90%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginTop: -10, // Overlap effect or just tight spacing
    },
    secondaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    secondaryType: {
        color: '#0d9488', // Teal
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryTitle: {
        color: '#1f2937',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'right',
        flex: 1,
        marginLeft: 10,
    },
    secondaryProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    secondaryBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        overflow: 'hidden',
    },
    secondaryBarFill: {
        height: '100%',
        backgroundColor: '#14b8a6', // Teal
        borderRadius: 3,
    },
    secondaryPercent: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f766e',
        width: 35,
        textAlign: 'right',
    },
    secondaryDetail: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 6,
        textAlign: 'right',
    },

    // Add Skill Placeholder
    addSkillCard: {
        width: '85%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        marginTop: 10, // Space if separated
    },
    addSkillIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addSkillIcon: {
        color: '#0284c7',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addSkillTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    addSkillSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },


    // Menu Section
    menuSection: {
        gap: 12,
    },
    menuRow: {
        flexDirection: 'row',
        gap: 12,
    },
    menuItemHalf: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItemDisabled: {
        opacity: 0.5,
        backgroundColor: '#f9fafb',
    },
    menuIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    menuSubtitle: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
    },
    menuSubtitleDisabled: {
        color: '#9ca3af',
    },
    menuItemFull: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIconLarge: {
        fontSize: 40,
        marginRight: 16,
    },
    menuFullContent: {
        flex: 1,
    },
    menuTitleLarge: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    menuSubtitleLarge: {
        fontSize: 13,
        color: '#6b7280',
    },

    // Remaining Quarters Text
    remainingText: {
        fontSize: 11,
        color: '#8892b0',
        fontStyle: 'italic',
        marginTop: 6,
        textAlign: 'right',
    },
    secondaryRemaining: {
        fontSize: 10,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 4,
        textAlign: 'right',
    },

    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    }
});
