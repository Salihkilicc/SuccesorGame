import React, { useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useGymSystem } from './useGymSystem';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

interface GymHubModalProps {
    visible?: boolean; // Deprecated, controlled by store
    onClose?: () => void;
}

const GymHubView = () => {
    // 1. Hook Integration
    const {
        isVisible,
        activeView,
        closeGym,
        openMartialArts,
        openTrainer,
        openMembership,
        openWorkout,
        openSupplements,

        bodyType,
        fatigue,
        membership,
        selectedArt,
        beltTitle,
    } = useGymSystem();

    // 2. Computed Visibility (Managed by Parent Container now via conditional rendering)
    // But we keep hook access.

    // Handle Closing
    const handleClose = () => {
        closeGym();
    };

    // 3. Dynamic Button Logic
    const renderMartialArtsButton = () => {
        const isSelected = !!selectedArt;
        const label = isSelected
            ? `${selectedArt?.toUpperCase()} - ${beltTitle}`
            : 'Choose Martial Art';

        const subtitle = isSelected ? 'Train Now' : 'Select Discipline';

        return (
            <TouchableOpacity
                style={[styles.menuButton, isSelected ? styles.maButtonActive : styles.maButtonInactive]}
                onPress={openMartialArts}
                activeOpacity={0.8}
            >
                <Text style={styles.menuIcon}>{isSelected ? '🥋' : '👊'}</Text>
                <View>
                    <Text style={[styles.menuLabel, isSelected && { color: '#FFF' }]}>{label}</Text>
                    <Text style={[styles.menuSubLabel, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>{subtitle}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.safeArea}>

                <View style={styles.glassCard}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>GYM</Text>
                            <View style={[styles.badge, membership === 'TITANIUM' ? styles.badgeTitanium : styles.badgeStandard]}>
                                <Text style={[styles.badgeText, membership === 'TITANIUM' ? styles.textTitanium : styles.textStandard]}>
                                    {membership || 'GUEST'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Top Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>BODY TYPE</Text>
                            <Text style={[styles.statValue, { color: getBodyTypeColor(bodyType) }]}>{bodyType}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>FATIGUE</Text>
                            <View style={styles.fatigueContainer}>
                                <View style={styles.fatigueBar}>
                                    <View
                                        style={[
                                            styles.fatigueFill,
                                            {
                                                width: `${Math.min(100, fatigue)}%`,
                                                backgroundColor: getFatigueColor(fatigue)
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.fatigueText}>{fatigue}%</Text>
                            </View>
                        </View>
                    </View>

                    {/* Grid Menu */}
                    <View style={styles.grid}>
                        {/* 1. Workout Button */}
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openWorkout}
                        >
                            <Text style={styles.menuIcon}>🏋️</Text>
                            <View>
                                <Text style={styles.menuLabel}>Workout</Text>
                                <Text style={styles.menuSubLabel}>Strength & Cardio</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 2. Martial Arts */}
                        {renderMartialArtsButton()}

                        {/* 3. Trainer */}
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openTrainer}
                        >
                            <Text style={styles.menuIcon}>🧢</Text>
                            <View>
                                <Text style={styles.menuLabel}>Trainer</Text>
                                <Text style={styles.menuSubLabel}>Hire Expert</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 4. Membership */}
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openMembership}
                        >
                            <Text style={styles.menuIcon}>💳</Text>
                            <View>
                                <Text style={styles.menuLabel}>Membership</Text>
                                <Text style={styles.menuSubLabel}>Upgrade Status</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 5. Locker Room (Supplements) */}
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openSupplements}
                        >
                            <Text style={styles.menuIcon}>🧪</Text>
                            <View>
                                <Text style={styles.menuLabel}>Locker Room</Text>
                                <Text style={styles.menuSubLabel}>Supplements & Gear</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
            </SafeAreaView>

            {/* Bottom Bar */}
            <View style={styles.bottomBarContainer}>
                <BottomStatsBar />
            </View>
        </View>
    );
};

// --- Helpers ---
const getBodyTypeColor = (type: string) => {
    switch (type) {
        case 'Godlike': return '#F59E0B';
        case 'Muscular': return '#EF4444';
        case 'Fit': return '#10B981';
        default: return '#6B7280';
    }
};

const getFatigueColor = (fatigue: number) => {
    if (fatigue > 80) return '#EF4444';
    if (fatigue > 50) return '#F59E0B';
    return '#10B981';
};

// --- Styles ---
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        width: '100%',
        alignItems: 'center',
    },
    glassCard: {
        width: '90%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: { fontSize: 18, color: '#374151' },
    titleContainer: { alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 1
    },
    badge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    badgeStandard: { borderColor: '#9CA3AF', backgroundColor: '#F3F4F6' },
    badgeTitanium: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    textStandard: { color: '#4B5563' },
    textTitanium: { color: '#D97706' },

    statsCard: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
    statValue: { fontSize: 16, fontWeight: '900' },

    fatigueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fatigueBar: {
        width: 100,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fatigueFill: { height: '100%', borderRadius: 4 },
    fatigueText: { fontSize: 12, fontWeight: '700', color: '#374151' },

    grid: {
        width: '100%',
        gap: 12,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 16,
    },
    menuIcon: { fontSize: 28 },
    menuLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    menuSubLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    maButtonActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    maButtonInactive: {
        borderColor: '#2563EB',
        borderWidth: 1.5,
        backgroundColor: '#EFF6FF',
    },

    bottomBarContainer: {
        position: 'absolute',
        bottom: 20,
        width: '90%',
    }
});

// --- Styles ---
// ... (styles omitted)

export default GymHubView;
