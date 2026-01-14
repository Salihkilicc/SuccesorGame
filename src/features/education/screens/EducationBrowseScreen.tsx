import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../core/theme';
import { EDUCATION_DATA } from '../../education/data/educationData';
import { useEducationStore } from '../../../core/store/useEducationStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { canEnroll } from '../../../logic/educationLogic';
import EducationHeader from '../../../components/Education/EducationHeader';
import { EducationType } from '../../education/educationTypes';

const EducationBrowseScreen = () => {
    const navigation = useNavigation();
    const [selectedTab, setSelectedTab] = useState<string>('degree');
    const { enroll, completedEducations, activeAcademic, activeCertificate } = useEducationStore();
    const player = usePlayerStore();
    const stats = useStatsStore();

    const tabs = [
        { id: 'degree', label: 'Degrees' },
        { id: 'master', label: 'Masters' },
        { id: 'phd', label: 'PhD' },
        { id: 'certificate', label: 'Certificates' },
    ];

    const filteredList = EDUCATION_DATA.filter(p => p.type === selectedTab);

    const handleEnrollPress = (program: any) => {
        // Check track-specific enrollment
        const isCertificate = program.type === 'certificate';
        const isAcademic = program.type === 'degree' || program.type === 'master' || program.type === 'phd';

        if (isCertificate && activeCertificate) {
            Alert.alert("Already Enrolled", "You are already enrolled in a certificate. Finish or drop it first.");
            return;
        }

        if (isAcademic && activeAcademic) {
            Alert.alert("Already Enrolled", "You are already enrolled in an academic program. Finish or drop it first.");
            return;
        }

        const check = canEnroll({
            completedEducations,
            activeProgramId: undefined,
            money: stats.money
        }, program.id);

        if (!check.success) {
            Alert.alert("Locked", check.reason);
            return;
        }

        const costLabel = program.isMonthlyCost ? "Monthly Tuition" : "One-time Cost";
        const costVal = check.costToPay || program.cost;

        Alert.alert(
            "Confirm Enrollment",
            `${program.title}\n${costLabel}: $${costVal.toLocaleString()}\nDuration: ${program.durationQuarter} Quarters`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Enroll",
                    onPress: () => {
                        try {
                            enroll(program);
                            Alert.alert("Success", `You are now enrolled in ${program.title}!`);
                            navigation.goBack();
                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <EducationHeader title="Browse Catalog" />

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabButton, selectedTab === tab.id && styles.activeTabButton]}
                            onPress={() => setSelectedTab(tab.id)}
                        >
                            <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {filteredList.map(program => {
                    const isCertificate = program.type === 'certificate';
                    const isAcademic = program.type === 'degree' || program.type === 'master' || program.type === 'phd';

                    // Track-specific lock check
                    const trackLocked = (isCertificate && activeCertificate) || (isAcademic && activeAcademic);

                    const check = canEnroll({
                        completedEducations,
                        activeProgramId: undefined,
                        money: stats.money
                    }, program.id);
                    const isCompleted = completedEducations.includes(program.id);
                    const isLocked = (!check.success && !isCompleted) || trackLocked;

                    return (
                        <TouchableOpacity
                            key={program.id}
                            style={[styles.card, isLocked && styles.cardLocked]}
                            onPress={() => isLocked ? Alert.alert("Requirements", check.reason) : null}
                            disabled={isCompleted}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardTitle, isLocked && styles.textLocked]}>{program.title}</Text>
                                    <Text style={styles.cardSubtitle}>{program.field}</Text>
                                </View>
                                {isLocked && <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />}
                                {isCompleted && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.badges}>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>${program.cost.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{program.durationQuarter} Qtrs</Text>
                                    </View>
                                </View>

                                {!isCompleted && !isLocked && (
                                    <TouchableOpacity
                                        style={styles.enrollButton}
                                        onPress={() => handleEnrollPress(program)}
                                    >
                                        <Text style={styles.enrollButtonText}>Enroll</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabsContainer: {
        paddingVertical: 12,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabButton: {
        marginRight: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.cardSoft,
    },
    activeTabButton: {
        backgroundColor: theme.colors.accent,
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFF',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardLocked: {
        opacity: 0.7,
        backgroundColor: theme.colors.background, // Darker
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    textLocked: {
        color: theme.colors.textSecondary,
    },
    cardSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badges: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    enrollButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    enrollButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
});

export default EducationBrowseScreen;
