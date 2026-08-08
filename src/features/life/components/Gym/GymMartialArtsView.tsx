import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useGymSystem, MartialArtStyle } from './useGymSystem';

const MARTIAL_ARTS_LIST: { id: MartialArtStyle; name: string; icon: string; desc: string }[] = [
    { id: 'boxing', name: t('life.boxing'), icon: '🥊', desc: t('life.focusOnPunchesAndFootwork') },
    { id: 'muaythai', name: t('life.muayThai'), icon: '🦵', desc: t('life.theArtOfEightLimbs') },
    { id: 'bjj', name: t('life.jiuJitsu'), icon: '🥋', desc: t('life.groundFightingAndSubmission') },
    { id: 'mma', name: 'MMA', icon: '🤼', desc: t('life.mixedMartialArtsCombat') },
    { id: 'karate', name: t('life.karate'), icon: '🥷', desc: t('life.strikingKickingAndKneeStrikes') },
];

/**
 * GYM MARTIAL ARTS VIEW
 * 
 * Two-state component:
 * - Selection Mode: Choose a martial art style
 * - Training Mode: View progress and train
 */
const GymMartialArtsView = () => {
    useLocale();
    // --- Hook Destructuring ---
    const { data, actions } = useGymSystem();
    const { stats, martialArts, currentQuarter } = data;
    const { goBackToHub, selectArt, trainMartialArts } = actions;

    const { fatigue } = stats;
    const { style: selectedArt, title: beltTitle, rank: beltRank, progress: trainingCount, lastTrainedQ } = martialArts;

    // --- Local Logic ---
    const isSelectionMode = !selectedArt;
    const maxTrainings = beltRank === 3 ? 6 : 3;

    // Constraints
    const isFatigued = fatigue > 80;
    const isTrainedThisQuarter = lastTrainedQ === currentQuarter;
    const canTrain = !isFatigued && !isTrainedThisQuarter;

    // --- Handlers ---
    const handleSelect = (art: MartialArtStyle) => {
        selectArt(art);
    };

    const handleTrain = () => {
        if (!canTrain) return;

        const result = trainMartialArts();
        if (result.success) {
            Alert.alert(
                result.newBelt ? 'Belt Promotion! 🎉' : 'Training Complete 🥋',
                result.message
            );
        } else {
            Alert.alert('Training Failed', result.message);
        }
    };

    // --- Helpers ---
    const getBeltColor = (rank: number) => {
        switch (rank) {
            case 0: return '#E9B8C9';
            case 1: return '#E9B8C9';
            case 2: return '#E9B8C9';
            case 3: return '#E9B8C9';
            case 4:
            case 5: return '#31241F';
            default: return '#E9B8C9';
        }
    };

    const getBeltTextColor = (rank: number) => {
        if (rank === 0) return '#31241F';
        return '#FFFFFF';
    };

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goBackToHub} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.title}>
                                {isSelectionMode ? 'CHOOSE PATH' : `${selectedArt?.toUpperCase()} DOJO`}
                            </Text>
                            <Text style={styles.subtitle}>
                                {isSelectionMode ? 'Select your discipline' : 'Master your craft'}
                            </Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* MODE A: SELECTION */}
                    {isSelectionMode && (
                        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                            {MARTIAL_ARTS_LIST.map((art) => (
                                <TouchableOpacity
                                    key={art.id}
                                    style={styles.selectionCard}
                                    onPress={() => handleSelect(art.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.artIcon}>{art.icon}</Text>
                                    <View style={styles.artInfo}>
                                        <Text style={styles.artName}>{art.name}</Text>
                                        <Text style={styles.artDesc}>{art.desc}</Text>
                                    </View>
                                    <View style={styles.selectBtn}>
                                        <Text style={styles.selectBtnText}>{t('life.select')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* MODE B: TRAINING */}
                    {!isSelectionMode && (
                        <View style={styles.trainingContainer}>
                            {/* Belt Badge */}
                            <View style={[styles.beltBadge, { backgroundColor: getBeltColor(beltRank) }]}>
                                <Text style={[styles.beltText, { color: getBeltTextColor(beltRank) }]}>
                                    {beltTitle}
                                </Text>
                            </View>

                            {/* Progress */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>{t('life.progressToNextBelt')}</Text>
                                    <Text style={styles.progressValue}>{trainingCount} / {maxTrainings}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${Math.min(100, (trainingCount / maxTrainings) * 100)}%` }
                                        ]}
                                    />
                                </View>
                            </View>

                            {/* Stats/Info */}
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('life.fatigueCost')}</Text>
                                <Text style={styles.infoValue}>+45%</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('life.strengthGain')}</Text>
                                <Text style={styles.infoValue}>+3</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('life.frequency')}</Text>
                                <Text style={styles.infoValue}>1x / Quarter</Text>
                            </View>

                            <View style={{ flex: 1 }} />

                            {/* Train Button */}
                            <TouchableOpacity
                                style={[styles.trainBtn, !canTrain && styles.trainBtnDisabled]}
                                onPress={handleTrain}
                                disabled={!canTrain}
                            >
                                <Text style={styles.trainBtnText}>
                                    {isTrainedThisQuarter ? 'ALREADY TRAINED' : isFatigued ? 'TOO TIRED' : 'TRAIN NOW'}
                                </Text>
                                <Text style={styles.trainBtnSub}>
                                    {canTrain ? 'Takes 3 Months' : isTrainedThisQuarter ? 'Wait until next quarter' : 'Rest required'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#31241F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#31241F',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#31241F',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#31241F',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: { fontSize: 14, color: '#E9B8C9', fontWeight: '700' },
    headerTitleContainer: { alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E9B8C9',
        marginTop: 4,
    },
    listContainer: {
        gap: 12,
        paddingBottom: 20,
    },
    selectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#31241F',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 16,
    },
    artIcon: { fontSize: 32 },
    artInfo: { flex: 1 },
    artName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    artDesc: { fontSize: 12, color: '#E9B8C9', marginTop: 2 },
    selectBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#31241F',
        borderRadius: 8,
    },
    selectBtnText: {
        color: '#E9B8C9',
        fontWeight: '700',
        fontSize: 12,
    },
    trainingContainer: {
        alignItems: 'center',
        gap: 20,
        minHeight: 300,
    },
    beltBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginTop: 10,
    },
    beltText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    progressSection: {
        width: '100%',
        gap: 8,
        marginBottom: 10,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: { fontSize: 12, fontWeight: '700', color: '#E9B8C9' },
    progressValue: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
    progressBarBg: {
        height: 12,
        backgroundColor: '#31241F',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#533D35',
        borderRadius: 6,
    },
    infoRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    infoLabel: { fontSize: 14, color: '#E9B8C9', fontWeight: '500' },
    infoValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
    trainBtn: {
        width: '100%',
        backgroundColor: '#533D35',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#31241F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    trainBtnDisabled: {
        backgroundColor: '#31241F',
        shadowOpacity: 0,
    },
    trainBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    trainBtnSub: {
        color: '#E9B8C9',
        fontSize: 12,
        marginTop: 2,
    },
});

export default GymMartialArtsView;
