import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEducationSystem } from '../store/useEducationSystem';
import { CLUB_DATA, ClubType } from '../data/educationData';
import BottomStatsBar from '../../../../../components/common/BottomStatsBar';

// ========================================
// TYPES
// ========================================

interface EducationClubViewProps {
    onBack: () => void;
}

// ========================================
// HELPER: Generate Rich Kid Avatars
// ========================================

const RICH_NAMES = [
    'JD', 'CS', 'EB', 'MW', 'TK', 'RH', 'AL', 'SM', 'VN', 'GP',
    'BW', 'KL', 'NP', 'FT', 'DM', 'HJ'
];

const generateMemberAvatars = () => {
    const shuffled = [...RICH_NAMES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
};

// ========================================
// COMPONENT
// ========================================

export const EducationClubView: React.FC<EducationClubViewProps> = ({ onBack }) => {
    const navigation = useNavigation();
    const { activeClub, joinClub, leaveClub, closeEducation } = useEducationSystem();

    const handleClubAction = (clubType: ClubType) => {
        if (activeClub === clubType) {
            Alert.alert(
                'Leave Club?',
                `Are you sure you want to leave ${CLUB_DATA[clubType].name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        onPress: () => {
                            leaveClub();
                            Alert.alert('Left Club', 'You are no longer a member.');
                        }
                    }
                ]
            );
        } else {
            if (activeClub) {
                Alert.alert(
                    'Switch Clubs?',
                    `Leave ${CLUB_DATA[activeClub].name} and join ${CLUB_DATA[clubType].name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Switch',
                            onPress: () => {
                                joinClub(clubType);
                                Alert.alert('Joined!', `Welcome to ${CLUB_DATA[clubType].name}!`);
                            }
                        }
                    ]
                );
            } else {
                joinClub(clubType);
                Alert.alert('Joined!', `Welcome to ${CLUB_DATA[clubType].name}!`);
            }
        }
    };

    const clubs = Object.keys(CLUB_DATA) as ClubType[];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Student Clubs</Text>
                        <Text style={styles.subtitle}>Elite Societies</Text>
                    </View>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {clubs.map((clubType) => {
                        const club = CLUB_DATA[clubType];
                        const isActive = activeClub === clubType;
                        const members = generateMemberAvatars();

                        return (
                            <View
                                key={clubType}
                                style={[
                                    styles.clubCard,
                                    isActive && styles.clubCardActive
                                ]}
                            >
                                {/* Club Header */}
                                <View style={styles.clubHeader}>
                                    <View style={styles.clubTitleSection}>
                                        <Text style={styles.clubName}>{club.name}</Text>
                                        {isActive && <Text style={styles.activeBadge}>ACTIVE</Text>}
                                    </View>
                                    <Text style={styles.clubDescription}>{club.description}</Text>
                                </View>

                                {/* Buff Info */}
                                <View style={styles.buffSection}>
                                    <Text style={styles.buffLabel}>Quarterly Benefit:</Text>
                                    <Text style={styles.buffText}>
                                        +{club.buffAmount} {club.buffStat.charAt(0).toUpperCase() + club.buffStat.slice(1)} per Quarter
                                    </Text>
                                </View>

                                {/* Members Section */}
                                <View style={styles.membersSection}>
                                    <Text style={styles.membersLabel}>Members:</Text>
                                    <View style={styles.avatarsContainer}>
                                        {members.map((initials, index) => (
                                            <View key={index} style={styles.avatar}>
                                                <Text style={styles.avatarText}>{initials}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.actionBtn,
                                        isActive && styles.actionBtnActive
                                    ]}
                                    onPress={() => handleClubAction(clubType)}
                                >
                                    <Text style={styles.actionBtnText}>
                                        {isActive ? 'Leave Club' : 'Join Club'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
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
        gap: 16,
    },
    clubCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clubCardActive: {
        borderColor: '#1e3a8a',
        backgroundColor: '#eff6ff',
    },
    clubHeader: {
        marginBottom: 16,
    },
    clubTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    clubName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    activeBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    clubDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    buffSection: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    buffLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    buffText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#b45309',
    },
    membersSection: {
        marginBottom: 16,
    },
    membersLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    avatarsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#d4af37',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    actionBtn: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d4af37',
    },
    actionBtnActive: {
        backgroundColor: '#dc2626',
        borderColor: '#ef4444',
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
