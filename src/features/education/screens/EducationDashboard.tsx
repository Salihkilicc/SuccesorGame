import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../core/theme';
import { useEducationStore } from '../../../core/store/useEducationStore';
import { EDUCATION_DATA } from '../../education/data/educationData';
import EducationHeader from '../../../components/Education/EducationHeader';
import { usePlayerStore } from '../../../core/store/usePlayerStore';

const EducationDashboard = () => {
    const navigation = useNavigation<any>();
    const { activeAcademic, activeCertificate, completedEducations, study, dropOut } = useEducationStore();
    const player = usePlayerStore();
    const { core } = player;

    // --- Render Academic Track ---
    const renderAcademicTrack = () => {
        if (!activeAcademic) {
            return (
                <View style={styles.inactiveContainer}>
                    <Ionicons name="school-outline" size={48} color={theme.colors.textSecondary} style={{ marginBottom: 12 }} />
                    <Text style={styles.inactiveTitle}>No Active Degree</Text>
                    <Text style={styles.inactiveSubtitle}>
                        Enroll in a Bachelor's, Master's, or PhD program
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('EducationBrowse')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.browseButtonText}>Browse Programs</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const { item: program, progress } = activeAcademic;
        const progressPerQuarter = 100 / program.durationQuarter;
        const quartersRemaining = Math.max(0, Math.ceil((100 - progress) / progressPerQuarter));



        const handleDropOut = () => {
            Alert.alert(
                "Drop Out?",
                "You will lose all progress in this program.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Drop Out", style: "destructive", onPress: () => dropOut('academic') }
                ]
            );
        };

        return (
            <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.programTitle}>{program.title}</Text>
                        <Text style={styles.programSubtitle}>{program.type.toUpperCase()} • {program.field}</Text>
                    </View>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressBadgeText}>{progress.toFixed(1)}%</Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${Math.max(5, progress)}%` }]} />
                </View>
                <Text style={styles.progressDetailText}>
                    {quartersRemaining} Quarters Remaining
                </Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.dropOutButton} onPress={handleDropOut}>
                        <Text style={styles.dropOutText}>Drop Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // --- Render Certificate Track ---
    const renderCertificateTrack = () => {
        if (!activeCertificate) {
            return (
                <View style={styles.inactiveContainer}>
                    <Ionicons name="ribbon-outline" size={48} color={theme.colors.textSecondary} style={{ marginBottom: 12 }} />
                    <Text style={styles.inactiveTitle}>No Active Certificate</Text>
                    <Text style={styles.inactiveSubtitle}>
                        Enroll in a professional certification program
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('EducationBrowse')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.browseButtonText}>Browse Certificates</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const { item: program, progress } = activeCertificate;
        const progressPerQuarter = 100 / program.durationQuarter;
        const quartersRemaining = Math.max(0, Math.ceil((100 - progress) / progressPerQuarter));



        const handleDropOut = () => {
            Alert.alert(
                "Drop Out?",
                "You will lose all progress in this certificate.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Drop Out", style: "destructive", onPress: () => dropOut('certificate') }
                ]
            );
        };

        return (
            <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.programTitle}>{program.title}</Text>
                        <Text style={styles.programSubtitle}>CERTIFICATE • {program.field}</Text>
                    </View>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressBadgeText}>{progress.toFixed(1)}%</Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${Math.max(5, progress)}%`, backgroundColor: theme.colors.warning }]} />
                </View>
                <Text style={styles.progressDetailText}>
                    {quartersRemaining} Quarters Remaining
                </Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.dropOutButton} onPress={handleDropOut}>
                        <Text style={styles.dropOutText}>Drop Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // --- History ---
    // (No helper needed, we filter inline below)

    return (
        <View style={styles.container}>
            <EducationHeader
                title="Education"
                rightAction={{
                    label: "Browse",
                    onPress: () => navigation.navigate('EducationBrowse')
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Academic Track */}
                <Text style={styles.sectionTitle}>🎓 Academic Track</Text>
                {renderAcademicTrack()}

                {/* Certificate Track */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📜 Certificate Track</Text>
                {renderCertificateTrack()}

                {/* Curriculum Vitae (History) */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Curriculum Vitae</Text>
                {completedEducations.length === 0 ? (
                    <Text style={styles.emptyText}>There is no education history.</Text>
                ) : (
                    EDUCATION_DATA.filter(item => completedEducations.includes(item.id)).map((prog, index) => (
                        <View key={index} style={styles.historyCard}>
                            <View style={styles.historyIcon}>
                                <Text style={{ fontSize: 20 }}>
                                    {prog.type === 'certificate' ? '📜' : '🎓'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyTitle}>{prog.title}</Text>
                                <Text style={styles.historySubtitle}>{prog.field} • {prog.type.toUpperCase()}</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 12,
    },
    inactiveContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    inactiveTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    inactiveSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    browseButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    browseButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    programTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    programSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    progressBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        justifyContent: 'center',
    },
    progressBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 11,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 6,
    },
    progressDetailText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studyButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        flex: 1,
        marginRight: 10,
        justifyContent: 'center',
    },
    studyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    dropOutButton: {
        paddingHorizontal: 10,
    },
    dropOutText: {
        color: theme.colors.error,
        fontSize: 12,
        fontWeight: '600',
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.cardSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    historySubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        fontSize: 12,
    }
});

export default EducationDashboard;
