import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useGymSystem, MartialArtStyle } from './useGymSystem';

const MARTIAL_ARTS_LIST: { id: MartialArtStyle; name: string; icon: string; desc: string }[] = [
    { id: 'boxing', name: 'Boxing', icon: '🥊', desc: 'Focus on punches and footwork.' },
    { id: 'muaythai', name: 'Muay Thai', icon: '🦵', desc: 'The art of eight limbs.' },
    { id: 'bjj', name: 'Jiu-Jitsu', icon: '🥋', desc: 'Ground fighting and submission.' },
    { id: 'mma', name: 'MMA', icon: '🤼', desc: 'Mixed martial arts combat.' },
    { id: 'karate', name: 'Karate', icon: '🥷', desc: 'Striking, kicking, and knee strikes.' },
];

/**
 * GYM MARTIAL ARTS VIEW
 * 
 * Two-state component:
 * - Selection Mode: Choose a martial art style
 * - Training Mode: View progress and train
 */
const GymMartialArtsView = () => {
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
            case 0: return '#F3F4F6';
            case 1: return '#3B82F6';
            case 2: return '#8B5CF6';
            case 3: return '#92400E';
            case 4:
            case 5: return '#111827';
            default: return '#F3F4F6';
        }
    };

    const getBeltTextColor = (rank: number) => {
        if (rank === 0) return '#1F2937';
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
                                        <Text style={styles.selectBtnText}>SELECT</Text>
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
                                    <Text style={styles.progressLabel}>PROGRESS TO NEXT BELT</Text>
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
                                <Text style={styles.infoLabel}>Fatigue Cost:</Text>
                                <Text style={styles.infoValue}>+45%</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Strength Gain:</Text>
                                <Text style={styles.infoValue}>+3</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Frequency:</Text>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
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
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: { fontSize: 14, color: '#374151', fontWeight: '700' },
    headerTitleContainer: { alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 4,
    },
    listContainer: {
        gap: 12,
        paddingBottom: 20,
    },
    selectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 16,
    },
    artIcon: { fontSize: 32 },
    artInfo: { flex: 1 },
    artName: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    artDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    selectBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    selectBtnText: {
        color: '#2563EB',
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
        borderColor: '#E5E7EB',
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
    progressLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    progressValue: { fontSize: 12, fontWeight: '700', color: '#1F2937' },
    progressBarBg: {
        height: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
        borderRadius: 6,
    },
    infoRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '700' },
    trainBtn: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    trainBtnDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
    },
    trainBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    trainBtnSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
});

export default GymMartialArtsView;
