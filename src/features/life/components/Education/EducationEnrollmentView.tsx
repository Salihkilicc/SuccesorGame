import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEducationSystem } from './useEducationSystem';
import {
    MAJOR_DATA,
    MajorType,
    DegreeType,
    PROGRAM_DETAILS,
    CertificateType,
    CERTIFICATE_DATA,
    MASTERS_DATA,
    MastersType,
    PHD_DATA,
    PhDType
} from './educationData';
import { theme } from '../../../../core/theme';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

// ========================================
// TYPES & CONSTANTS
// ========================================

interface EducationEnrollmentViewProps {
    onBack: () => void;
    initialTab?: TabType;
}

type TabType = DegreeType | 'Certificate';

const TABS: TabType[] = ['Certificate', 'Undergraduate', 'Master', 'PhD'];

const TAB_LABELS: Record<TabType, string> = {
    'Certificate': 'Certificate',
    'Undergraduate': "Bachelor's",
    'Master': "Master's",
    'PhD': 'PhD'
};

// ========================================
// COMPONENT
// ========================================

export const EducationEnrollmentView: React.FC<EducationEnrollmentViewProps> = ({ onBack, initialTab = 'Undergraduate' }) => {
    const navigation = useNavigation();
    const { activeDegree, activeCertificate, completedDegrees, enroll, checkPrerequisites, closeEducation } = useEducationSystem();
    const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);

    // Helper to check if a program should be visible (not active or completed)
    const isVisible = (id: string, type: TabType): boolean => {
        // Check if currently active
        if (type === 'Certificate') {
            if (activeCertificate?.id === id) return false;
        } else {
            if (activeDegree?.id === id && activeDegree?.type === type) return false;
        }

        // Check if already completed
        const isCompleted = completedDegrees.some(d => d.id === id && d.type === type);
        if (isCompleted) return false;

        return true;
    };

    const handleEnroll = (id: string) => {
        const isCertificate = selectedTab === 'Certificate';
        const activeProgram = isCertificate ? activeCertificate : activeDegree;

        // Check prerequisites
        const { allowed, reason } = checkPrerequisites(id, selectedTab);
        if (!allowed) {
            Alert.alert(
                'Prerequisite Upgrade Required',
                reason || 'You do not meet the requirements for this program.',
                [{ text: 'OK' }]
            );
            return;
        }

        let label = '';
        let costDisplay = '';
        let durationDisplay = '';

        if (selectedTab === 'Certificate') {
            const cert = CERTIFICATE_DATA[id as CertificateType];
            label = cert.label;
            costDisplay = `$${cert.cost.toLocaleString()}`;
            durationDisplay = cert.duration;
        } else if (selectedTab === 'Master') {
            const masters = MASTERS_DATA[id as MastersType];
            label = masters.label;
            costDisplay = `$${masters.cost.toLocaleString()}`;
            durationDisplay = masters.duration;
        } else if (selectedTab === 'PhD') {
            const phd = PHD_DATA[id as PhDType];
            label = phd.label;
            costDisplay = `$${phd.cost.toLocaleString()}`;
            durationDisplay = `${phd.duration / 4} Years`;
        } else {
            const major = MAJOR_DATA[id as MajorType];
            const program = PROGRAM_DETAILS[selectedTab as DegreeType];
            label = `${major.label} (${TAB_LABELS[selectedTab]})`;
            costDisplay = program.cost === 0 ? 'Free' : `$${program.cost.toLocaleString()}`;
            durationDisplay = program.duration;
        }

        // Warning Message if replacing
        let warningMsg = '';
        if (activeProgram) {
            warningMsg = `\n\n⚠️ This will replace your current ${isCertificate ? 'Certificate' : 'Degree'} in ${activeProgram.id}. Progress will be lost!`;
        }

        Alert.alert(
            'Confirm Enrollment',
            `Enroll in ${label}?\n\nDuration: ${durationDisplay}\nCost: ${costDisplay}${warningMsg}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Enroll',
                    onPress: () => {
                        enroll(id as any, selectedTab);
                        Alert.alert('Enrolled!', `You are now studying ${label}`);
                        onBack();
                    }
                }
            ]
        );
    };

    const renderContent = () => {
        if (selectedTab === 'Certificate') {
            const certificates = Object.keys(CERTIFICATE_DATA) as CertificateType[];
            return certificates
                .filter((certId) => isVisible(certId, 'Certificate'))
                .map((certId) => {
                    const cert = CERTIFICATE_DATA[certId];
                    const isCurrent = activeCertificate?.id === certId;

                    return (
                        <View key={certId} style={styles.majorCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.majorTitle}>{cert.label}</Text>
                            </View>

                            <View style={styles.cardDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration:</Text>
                                    <Text style={styles.detailValue}>{cert.duration}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Cost:</Text>
                                    <Text style={styles.detailValue}>${cert.cost.toLocaleString()}</Text>
                                </View>
                            </View>

                            <View style={styles.badgeContainer}>
                                <View style={styles.statBadge}>
                                    <Text style={styles.statBadgeText}>
                                        Boosts: {cert.relatedStat.charAt(0).toUpperCase() + cert.relatedStat.slice(1)}
                                        {getStatIcon(cert.relatedStat)}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.enrollButton,
                                    isCurrent && styles.enrollButtonDisabled
                                ]}
                                onPress={() => handleEnroll(certId)}
                                disabled={isCurrent}
                            >
                                <Text style={styles.enrollButtonText}>
                                    {isCurrent ? 'Enrolled' : activeCertificate ? 'Switch Program' : 'Enroll Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                });
        } else if (selectedTab === 'Master') {
            const masterPrograms = Object.keys(MASTERS_DATA) as MastersType[];
            return masterPrograms
                .filter((masterId) => isVisible(masterId, 'Master'))
                .map((masterId) => {
                    const masters = MASTERS_DATA[masterId];
                    const parentMajor = MAJOR_DATA[masters.parentMajor];
                    const { allowed, reason } = checkPrerequisites(masterId, 'Master');
                    const isCurrent = activeDegree?.id === masterId && activeDegree.type === 'Master';

                    return (
                        <View key={masterId} style={[styles.majorCard, !allowed && styles.disabledCard]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.masterTitle}>
                                        {!allowed && '🔒 '}🎓 {masters.label}
                                    </Text>
                                </View>
                                <Text style={styles.masterSubtitle}>
                                    Field: {parentMajor.label} • {masters.duration}
                                </Text>
                            </View>

                            <View style={styles.cardDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration:</Text>
                                    <Text style={styles.detailValue}>{masters.duration}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Cost:</Text>
                                    <Text style={styles.detailValue}>${masters.cost.toLocaleString()}</Text>
                                </View>
                            </View>

                            <View style={styles.badgeContainer}>
                                <View style={styles.statBadge}>
                                    <Text style={styles.statBadgeText}>
                                        Boosts: {parentMajor.relatedStat.charAt(0).toUpperCase() + parentMajor.relatedStat.slice(1)}
                                        {getMajorIcon(masters.parentMajor) || getStatIcon(parentMajor.relatedStat)}
                                    </Text>
                                </View>
                            </View>

                            {!allowed && (
                                <View style={styles.prerequisiteContainer}>
                                    <Text style={styles.prerequisiteText}>
                                        ⚠️ {reason}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.enrollButton,
                                    (isCurrent || !allowed) && styles.enrollButtonDisabled
                                ]}
                                onPress={() => handleEnroll(masterId)}
                                disabled={isCurrent || !allowed}
                            >
                                <Text style={styles.enrollButtonText}>
                                    {isCurrent ? 'Enrolled' : !allowed ? 'Locked' : activeDegree ? 'Switch Major' : 'Enroll Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                });
        } else if (selectedTab === 'PhD') {
            // PhD Programs
            const phdPrograms = Object.keys(PHD_DATA) as PhDType[];
            return phdPrograms
                .filter((phdId) => isVisible(phdId, 'PhD'))
                .map((phdId) => {
                    const phd = PHD_DATA[phdId];
                    const parentMajor = MAJOR_DATA[phd.parentMajor];
                    const { allowed, reason } = checkPrerequisites(phdId, 'PhD');
                    const isCurrent = activeDegree?.id === phdId && activeDegree.type === 'PhD';

                    return (
                        <View key={phdId} style={[styles.majorCard, !allowed && styles.disabledCard]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.masterTitle}>
                                        {!allowed && '🔒 '}🎓 {phd.label}
                                    </Text>
                                </View>
                                <Text style={styles.masterSubtitle}>
                                    Field: {parentMajor.label} • {phd.duration / 4} Years
                                </Text>
                            </View>

                            {!allowed && reason && (
                                <View style={styles.prerequisiteWarning}>
                                    <Text style={styles.prerequisiteText}>⚠️ {reason}</Text>
                                </View>
                            )}

                            <View style={styles.cardDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration:</Text>
                                    <Text style={styles.detailValue}>{phd.duration / 4} Years ({phd.duration} Quarters)</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Cost:</Text>
                                    <Text style={styles.detailValue}>${phd.cost.toLocaleString()}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Boosts:</Text>
                                    <Text style={styles.detailValue}>
                                        {parentMajor.relatedStat.charAt(0).toUpperCase() + parentMajor.relatedStat.slice(1)}
                                        {getMajorIcon(phd.parentMajor) || getStatIcon(parentMajor.relatedStat)}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.enrollButton,
                                    (!allowed || isCurrent) && styles.enrollButtonDisabled
                                ]}
                                onPress={() => handleEnroll(phdId)}
                                disabled={!allowed || isCurrent}
                            >
                                <Text style={styles.enrollButtonText}>
                                    {isCurrent ? 'Enrolled' : !allowed ? 'Locked' : activeDegree ? 'Switch Program' : 'Enroll Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                });
        } else {
            const majors = Object.keys(MAJOR_DATA) as MajorType[];
            const programDetails = PROGRAM_DETAILS[selectedTab];
            const cost = programDetails.cost === 0 ? 'Free' : `$${programDetails.cost.toLocaleString()}`;

            return majors
                .filter((majorId) => isVisible(majorId, 'Undergraduate'))
                .map((majorId) => {
                    const major = MAJOR_DATA[majorId];
                    const isCurrent = activeDegree?.id === majorId && activeDegree.type === selectedTab;

                    return (
                        <View key={majorId} style={styles.majorCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.majorTitle}>{major.label}</Text>
                            </View>

                            <View style={styles.cardDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration:</Text>
                                    <Text style={styles.detailValue}>{programDetails.duration}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Cost:</Text>
                                    <Text style={styles.detailValue}>{cost}</Text>
                                </View>
                            </View>

                            <View style={styles.badgeContainer}>
                                <View style={styles.statBadge}>
                                    <Text style={styles.statBadgeText}>
                                        Boosts: {major.relatedStat.charAt(0).toUpperCase() + major.relatedStat.slice(1)}
                                        {getMajorIcon(majorId) || getStatIcon(major.relatedStat)}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.enrollButton,
                                    isCurrent && styles.enrollButtonDisabled
                                ]}
                                onPress={() => handleEnroll(majorId)}
                                disabled={isCurrent}
                            >
                                <Text style={styles.enrollButtonText}>
                                    {isCurrent ? 'Enrolled' : activeDegree ? 'Switch Major' : 'Enroll Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                });
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Academic Programs</Text>
                        <Text style={styles.subtitle}>Choose Your Path</Text>
                    </View>
                    <View style={{ width: 60 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabScrollContent}
                    >
                        {TABS.map((tab) => {
                            const isActive = selectedTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tab, isActive && styles.activeTab]}
                                    onPress={() => setSelectedTab(tab)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                        {TAB_LABELS[tab]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Active Programs Status */}
                {(activeDegree || activeCertificate) && (
                    <View style={styles.statusSection}>
                        {activeDegree && (
                            <View style={styles.warningBanner}>
                                <Text style={styles.warningText}>
                                    🎓 Active Degree: {activeDegree.id} ({activeDegree.type})
                                </Text>
                            </View>
                        )}
                        {activeCertificate && (
                            <View style={[styles.warningBanner, { marginTop: activeDegree ? 4 : 0 }]}>
                                <Text style={styles.warningText}>
                                    📜 Active Certificate: {CERTIFICATE_DATA[activeCertificate.id].label}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Content List */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Stats Bar */}
            <View style={styles.bottomBarContainer}>
                <BottomStatsBar onHomePress={() => {
                    closeEducation();
                    navigation.navigate('Home' as never);
                }} />
            </View>
        </View>
    );
};

// Helper to get icon for stat
const getStatIcon = (stat: string) => {
    switch (stat) {
        case 'intellect': return ' 🧠';
        case 'businessTrust': return ' 💼';
        case 'charm': return ' ✨';
        case 'happiness': return ' 😄';
        case 'strength': return ' 💪';
        case 'morality': return ' ⚖️';
        case 'highSociety': return ' 🎩';
        case 'health': return ' ❤️';
        default: return '';
    }
};

// Helper to get icon for major (overrides stat icon for specific majors)
const getMajorIcon = (majorId: MajorType) => {
    switch (majorId) {
        case 'ComputerScience': return ' 🛡️';
        default: return '';
    }
};

// ========================================
// STYLES - PRESTIGE THEME
// ========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a192f', // Navy Blue
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#112240',
        borderBottomWidth: 1,
        borderBottomColor: '#1e3a5f',
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(30, 58, 95, 0.5)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c5a059',
    },
    backText: {
        fontSize: 14,
        color: '#c5a059',
        fontWeight: '700',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e6f1ff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 12,
        color: '#8892b0',
        marginTop: 2,
    },
    // Tabs
    tabContainer: {
        backgroundColor: '#112240',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#c5a059',
    },
    tabScrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(136, 146, 176, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(136, 146, 176, 0.2)',
    },
    activeTab: {
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        borderColor: '#c5a059',
    },
    tabText: {
        color: '#8892b0',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#c5a059',
        fontWeight: 'bold',
    },
    // Status Section
    statusSection: {
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 107, 107, 0.3)',
    },
    warningBanner: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 12,
        alignItems: 'center',
    },
    warningText: {
        color: '#ff6b6b',
        fontSize: 13,
        fontWeight: '600',
    },
    // List
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
        gap: 20,
    },
    majorCard: {
        backgroundColor: '#112240',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledCard: {
        opacity: 0.8,
        borderColor: '#233554',
    },
    cardHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(136, 146, 176, 0.1)',
        paddingBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    majorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#e6f1ff',
        marginBottom: 4,
    },
    masterTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e6f1ff',
        marginBottom: 6,
    },
    masterSubtitle: {
        fontSize: 13,
        color: '#8892b0',
        fontStyle: 'italic',
    },
    cardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: 'rgba(10, 25, 47, 0.5)',
        padding: 12,
        borderRadius: 8,
    },
    detailRow: {
        flexDirection: 'column',
    },
    detailLabel: {
        fontSize: 12,
        color: '#8892b0',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#c5a059',
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    statBadge: {
        backgroundColor: 'rgba(100, 255, 218, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(100, 255, 218, 0.3)',
    },
    statBadgeText: {
        color: '#64ffda',
        fontSize: 13,
        fontWeight: '600',
    },
    prerequisiteContainer: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 8,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    prerequisiteWarning: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    prerequisiteText: {
        color: '#ff6b6b',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    enrollButton: {
        backgroundColor: '#c5a059',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: 'rgba(197, 160, 89, 0.4)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    enrollButtonDisabled: {
        backgroundColor: '#233554',
        shadowOpacity: 0,
    },
    enrollButtonText: {
        color: '#0a192f',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    },
});
