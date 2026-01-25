import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEducationSystem } from '../store/useEducationSystem';
import { MAJOR_DATA, MajorType, CERTIFICATE_DATA, CertificateType, DegreeType, MASTERS_DATA, MastersType } from '../data/educationData';
import BottomStatsBar from '../../../../../components/common/BottomStatsBar';

// ========================================
// TYPES
// ========================================

interface EducationTranscriptViewProps {
    onBack: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const EducationTranscriptView: React.FC<EducationTranscriptViewProps> = ({ onBack }) => {
    const navigation = useNavigation();
    const { completedDegrees, salaryMultiplier, closeEducation } = useEducationSystem();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Academic Transcript</Text>
                        <Text style={styles.subtitle}>Your Education History</Text>
                    </View>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Salary Multiplier Card */}
                    <View style={styles.multiplierCard}>
                        <Text style={styles.multiplierLabel}>Current Salary Multiplier</Text>
                        <Text style={styles.multiplierValue}>{salaryMultiplier()}x</Text>
                        <Text style={styles.multiplierHint}>
                            Based on your completed degrees
                        </Text>
                    </View>

                    {/* Completed Degrees */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completed Degrees</Text>
                        {completedDegrees.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>📜</Text>
                                <Text style={styles.emptyText}>No degrees completed yet</Text>
                                <Text style={styles.emptyHint}>
                                    Enroll in Academic Programs to start your education journey
                                </Text>
                            </View>
                        ) : (
                            completedDegrees.map((degree, index) => {
                                const isCertificate = degree.type === 'Certificate';
                                const isMaster = degree.type === 'Master' && degree.id in MASTERS_DATA;

                                let label = '';
                                if (isCertificate) {
                                    label = CERTIFICATE_DATA[degree.id as CertificateType]?.label || degree.id;
                                } else if (isMaster) {
                                    label = MASTERS_DATA[degree.id as MastersType]?.label || degree.id;
                                } else {
                                    label = MAJOR_DATA[degree.id as MajorType]?.label || degree.id;
                                }

                                return (
                                    <View key={index} style={styles.degreeCard}>
                                        <View style={styles.degreeHeader}>
                                            <Text style={styles.degreeMajor}>{label || degree.id}</Text>
                                            <Text style={styles.degreeType}>{degree.type}</Text>
                                        </View>
                                        <Text style={styles.degreeBonus}>
                                            {isCertificate ? 'Skill Certification' : 'Academic Degree'}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Stats Bar */}
            <BottomStatsBar onHomePress={() => {
                closeEducation();
                // @ts-ignore - Simple navigation
                navigation.navigate('Home');
            }} />
        </View>
    );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#ffffff',
        borderBottomWidth: 2,
        borderBottomColor: '#d4af37',
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    multiplierCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#d4af37',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    multiplierLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '600',
    },
    multiplierValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    multiplierHint: {
        fontSize: 12,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    degreeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#1e3a8a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    degreeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    degreeMajor: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    degreeType: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    degreeBonus: {
        fontSize: 14,
        color: '#d4af37',
        fontWeight: '700',
    },
});
