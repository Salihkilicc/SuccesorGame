import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGymSystem } from './useGymSystem';
import CrystalNavBar from '../../../../navigation/components/CrystalNavBar';

/**
 * GYM HUB VIEW
 * 
 * Main entry point for the Gym system.
 * Displays body stats and navigation menu to sub-features.
 */
const GymHubView = () => {
    useLocale();
    // --- Hook Destructuring ---
    const { data, actions } = useGymSystem();
    const { stats, martialArts, membership } = data;
    const { navigate, closeGym } = actions;
    const navigation = useNavigation<any>();

    const { bodyType, fatigue } = stats;
    const { style: selectedArt, title: beltTitle } = martialArts;

    // --- Helpers ---
    const getBodyTypeColor = (type: string) => {
        switch (type) {
            case 'Godlike': return '#E3A857';
            case 'Muscular': return '#E3A857';
            case 'Fit': return '#E3A857';
            default: return '#E9B8C9';
        }
    };

    const getFatigueColor = (value: number) => {
        if (value > 80) return '#E3A857';
        if (value > 50) return '#E3A857';
        return '#E3A857';
    };

    const renderMartialArtsButton = () => {
        const isSelected = !!selectedArt;
        const label = isSelected ? `${selectedArt?.toUpperCase()} - ${beltTitle}` : 'Choose Martial Art';
        const subtitle = isSelected ? 'Train Now' : 'Select Discipline';

        return (
            <TouchableOpacity
                style={[styles.menuButton, isSelected ? styles.maButtonActive : styles.maButtonInactive]}
                onPress={() => navigate('MARTIAL_ARTS')}
                activeOpacity={0.8}
            >
                <Text style={styles.menuIcon}>{isSelected ? '🥋' : '👊'}</Text>
                <View>
                    <Text style={[styles.menuLabel, isSelected && { color: '#FFF' }]}>{label}</Text>
                    <Text style={[styles.menuSubLabel, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                        {subtitle}
                    </Text>
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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                            <Text style={styles.closeIcon}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{t('life.gym')}</Text>
                            <View style={[styles.badge, membership === 'TITANIUM' ? styles.badgeTitanium : styles.badgeStandard]}>
                                <Text style={[styles.badgeText, membership === 'TITANIUM' ? styles.textTitanium : styles.textStandard]}>
                                    {membership || 'GUEST'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.bodyType')}</Text>
                            <Text style={[styles.statValue, { color: getBodyTypeColor(bodyType) }]}>
                                {bodyType}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.fatigue')}</Text>
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

                    {/* Menu Grid */}
                    <View style={styles.grid}>
                        {/* Workout */}
                        <TouchableOpacity style={styles.menuButton} onPress={() => navigate('WORKOUT')}>
                            <Text style={styles.menuIcon}>🏋️</Text>
                            <View>
                                <Text style={styles.menuLabel}>{t('life.workout2')}</Text>
                                <Text style={styles.menuSubLabel}>{t('life.strengthCardio')}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Martial Arts */}
                        {renderMartialArtsButton()}

                        {/* Trainer */}
                        <TouchableOpacity style={styles.menuButton} onPress={() => navigate('TRAINER')}>
                            <Text style={styles.menuIcon}>🧢</Text>
                            <View>
                                <Text style={styles.menuLabel}>{t('life.trainer')}</Text>
                                <Text style={styles.menuSubLabel}>{t('life.hireExpert')}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Membership */}
                        <TouchableOpacity style={styles.menuButton} onPress={() => navigate('MEMBERSHIP')}>
                            <Text style={styles.menuIcon}>💳</Text>
                            <View>
                                <Text style={styles.menuLabel}>{t('life.membership')}</Text>
                                <Text style={styles.menuSubLabel}>{t('life.upgradeStatus')}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Locker Room */}
                        <TouchableOpacity style={styles.menuButton} onPress={() => navigate('SUPPLEMENTS')}>
                            <Text style={styles.menuIcon}>🧪</Text>
                            <View>
                                <Text style={styles.menuLabel}>{t('life.lockerRoom')}</Text>
                                <Text style={styles.menuSubLabel}>{t('life.supplementsGear')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* Universal Crystal Navigation Bar */}
            <CrystalNavBar activeTab="Life" variant="dark" />
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#0F0E0D', // Changed to full black
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    glassCard: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0F0E0D', // Dark premium background
        padding: 24,
        paddingBottom: 100, // Safe space for CrystalNavBar
        alignItems: 'center',
        // Removed borders and shadows
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
        backgroundColor: '#0F0E0D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: { fontSize: 18, color: '#E9B8C9' },
    titleContainer: { alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#EDE8E4', // Changed from dark text to light
        letterSpacing: 1
    },
    badge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    badgeStandard: { borderColor: '#E9B8C9', backgroundColor: '#0F0E0D' },
    badgeTitanium: { borderColor: '#E3A857', backgroundColor: '#0F0E0D' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    textStandard: { color: '#E9B8C9' },
    textTitanium: { color: '#E3A857' },
    statsCard: {
        width: '100%',
        backgroundColor: '#0F0E0D', // Darker premium tint
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9B8C9',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: { height: 1, backgroundColor: '#E9B8C9', marginVertical: 12 },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#E9B8C9', letterSpacing: 0.5 },
    statValue: { fontSize: 16, fontWeight: '900', color: '#EDE8E4' },
    fatigueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fatigueBar: {
        width: 100,
        height: 8,
        backgroundColor: '#E9B8C9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fatigueFill: { height: '100%', borderRadius: 4 },
    fatigueText: { fontSize: 12, fontWeight: '700', color: '#E9B8C9' },
    grid: {
        width: '100%',
        gap: 12,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0E0D', // Dark mode card
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E9B8C9',
        gap: 16,
    },
    menuIcon: { fontSize: 28 },
    menuLabel: { fontSize: 16, fontWeight: '700', color: '#EDE8E4' },
    menuSubLabel: { fontSize: 12, color: '#E9B8C9', marginTop: 2 },
    maButtonActive: {
        backgroundColor: '#E3A857',
        borderColor: '#E3A857',
    },
    maButtonInactive: {
        borderColor: '#E3A857',
        borderWidth: 1.5,
        backgroundColor: '#0F0E0D',
    },
});

export default GymHubView;
