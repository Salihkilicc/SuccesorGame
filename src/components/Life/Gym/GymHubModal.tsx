import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Animated,
    SafeAreaView,
} from 'react-native';
import { theme } from '../../../theme';
import { TrainerId, TRAINERS, MartialArtDiscipline } from './useGymSystem';

// View states
type GymView = 'hub' | 'trainer' | 'supplements' | 'fitnessConfig' | 'martialArts' | 'result';

type GymHubModalProps = {
    visible: boolean;
    onClose: () => void;
    gymStatus: number;
    trainerId: TrainerId | null;

    // Trainer
    onHireTrainer: (id: TrainerId) => void;

    // Fitness
    onStartFitness: (type: string, config: any) => void;

    // Martial Arts
    martialArtsLevels: Record<string, number>;
    onStartMartialArts: (type: MartialArtDiscipline) => void;
    workoutInProgress: boolean;

    // Result
    lastResult: any;
    onResultClose: () => void;
    showResult: boolean;
};

const BELT_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];

const GymHubModal = ({
    visible,
    onClose,
    gymStatus,
    trainerId,
    onHireTrainer,
    onStartFitness,
    martialArtsLevels,
    onStartMartialArts,
    workoutInProgress,
    lastResult,
    onResultClose,
    showResult,
}: GymHubModalProps) => {

    const [currentView, setCurrentView] = useState<GymView>('hub');
    const [selectedFitness, setSelectedFitness] = useState<string | null>(null);
    const [selectedMartialArt, setSelectedMartialArt] = useState<MartialArtDiscipline | null>(null);
    const [fitnessOption, setFitnessOption] = useState(0);

    const progressAnim = useRef(new Animated.Value(0)).current;

    // Reset to hub when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentView('hub');
            Animated.timing(progressAnim, {
                toValue: gymStatus,
                duration: 1000,
                useNativeDriver: false
            }).start();
        }
    }, [visible, gymStatus]);

    // Show result when available
    useEffect(() => {
        if (showResult && lastResult) {
            setCurrentView('result');
        }
    }, [showResult, lastResult]);

    const widthInterpolated = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    const handleClose = () => {
        setCurrentView('hub');
        onClose();
    };

    const handleBack = () => {
        setCurrentView('hub');
    };

    // ============ HUB VIEW ============
    const renderHubView = () => (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* FITNESS & BODY */}
            <Text style={styles.sectionTitle}>FITNESS & BODY</Text>
            <View style={styles.grid}>
                {[
                    { key: 'cardio', icon: '🏃', label: 'Cardio' },
                    { key: 'hypertrophy', icon: '💪', label: 'Hypertrophy' },
                    { key: 'calisthenics', icon: '🤸', label: 'Calisthenics' },
                    { key: 'yoga', icon: '🧘', label: 'Yoga' },
                ].map(item => (
                    <TouchableOpacity
                        key={item.key}
                        onPress={() => {
                            setSelectedFitness(item.key);
                            setFitnessOption(0);
                            setCurrentView('fitnessConfig');
                        }}
                        style={styles.card}
                        activeOpacity={0.7}>
                        <Text style={styles.icon}>{item.icon}</Text>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* MARTIAL ARTS */}
            <Text style={styles.sectionTitle}>MARTIAL ARTS</Text>
            <View style={styles.maList}>
                {(['boxing', 'mma', 'kungfu', 'karate', 'kravmaga'] as MartialArtDiscipline[]).map(art => (
                    <TouchableOpacity
                        key={art}
                        onPress={() => {
                            setSelectedMartialArt(art);
                            setCurrentView('martialArts');
                        }}
                        style={styles.maCard}
                        activeOpacity={0.7}>
                        <Text style={styles.maLabel}>{art.toUpperCase()}</Text>
                        <Text style={styles.maBelt}>Belt: {BELT_NAMES[martialArtsLevels[art] || 0]}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* MODIFIERS */}
            <Text style={styles.sectionTitle}>MODIFIERS</Text>

            <TouchableOpacity
                onPress={() => setCurrentView('trainer')}
                style={styles.modifierBtn}
                activeOpacity={0.7}>
                <View style={styles.modContent}>
                    <Text style={styles.modLabel}>
                        {trainerId ? `TRAINER: ${TRAINERS[trainerId].name.toUpperCase()}` : 'SELECT PERSONAL TRAINER'}
                    </Text>
                    {trainerId && <Text style={styles.changeText}>CHANGE ↻</Text>}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setCurrentView('supplements')}
                style={styles.modifierBtn}
                activeOpacity={0.7}>
                <Text style={styles.modLabel}>LOCKER ROOM (SUPPLEMENTS)</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // ============ TRAINER VIEW ============
    const renderTrainerView = () => (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>SELECT TRAINER</Text>
            <View style={styles.list}>
                {(['sarah', 'marcus', 'ken'] as TrainerId[]).map((id) => {
                    const trainer = TRAINERS[id];
                    const isSelected = trainerId === id;
                    return (
                        <TouchableOpacity
                            key={id}
                            onPress={() => {
                                onHireTrainer(id);
                                setCurrentView('hub');
                            }}
                            style={[styles.trainerCard, isSelected && styles.activeCard]}
                            activeOpacity={0.7}>
                            <View style={styles.iconBox}>
                                <Text style={styles.trainerIcon}>{id === 'sarah' ? '👩' : id === 'marcus' ? '🧔' : '👴'}</Text>
                            </View>
                            <View style={styles.trainerInfo}>
                                <Text style={[styles.trainerName, isSelected && styles.activeText]}>{trainer.name}</Text>
                                <Text style={styles.trainerRole}>{trainer.label}</Text>
                                <Text style={styles.trainerBonus}>+{(trainer.multiplier * 100 - 100).toFixed(0)}% Gains</Text>
                            </View>
                            <Text style={[styles.trainerPrice, isSelected && styles.activeText]}>${trainer.cost}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Back to Gym</Text>
            </TouchableOpacity>
        </View>
    );

    // ============ SUPPLEMENTS VIEW ============
    const renderSupplementsView = () => (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>LOCKER ROOM</Text>
            <Text style={styles.subSubtitle}>Supplements & Boosters</Text>
            <View style={styles.list}>
                {[
                    { name: 'Protein Shake', effect: '+5% Muscle Gains', icon: '🥛' },
                    { name: 'Creatine', effect: '+10% Strength', icon: '💊' },
                    { name: 'Pre-Workout', effect: '+15% Energy', icon: '⚡' },
                ].map(item => (
                    <TouchableOpacity key={item.name} style={styles.supplementCard} activeOpacity={0.7}>
                        <Text style={styles.supplementIcon}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.supplementName}>{item.name}</Text>
                            <Text style={styles.supplementEffect}>{item.effect}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Back to Gym</Text>
            </TouchableOpacity>
        </View>
    );

    // ============ FITNESS CONFIG VIEW ============
    const renderFitnessConfigView = () => {
        const CONFIGS: Record<string, string[]> = {
            cardio: ['15 Minutes', '30 Minutes', '1 Hour', '2 Hours'],
            hypertrophy: ['Light', 'Medium', 'Heavy', 'Till Failure'],
            yoga: ['15 Minutes', '30 Minutes', '1 Hour'],
            calisthenics: ['Beginner', 'Intermediate', 'Advanced', 'Beast Mode']
        };
        const options = selectedFitness ? CONFIGS[selectedFitness] || [] : [];

        return (
            <View style={styles.subViewContainer}>
                <Text style={styles.subTitle}>{selectedFitness?.toUpperCase()} SETUP</Text>
                <Text style={styles.configLabel}>SELECT INTENSITY/DURATION</Text>
                <View style={styles.optionsList}>
                    {options.map((opt, idx) => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => setFitnessOption(idx)}
                            style={[styles.optionBtn, fitnessOption === idx && styles.optionActive]}
                            activeOpacity={0.7}>
                            <Text style={[styles.optionText, fitnessOption === idx && styles.optionTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (selectedFitness && !workoutInProgress) {
                            onStartFitness(selectedFitness, { option: fitnessOption });
                        }
                    }}
                    style={[styles.startBtn, workoutInProgress && styles.disabledBtn]}
                    disabled={workoutInProgress}
                    activeOpacity={0.7}>
                    <Text style={styles.startText}>
                        {workoutInProgress
                            ? (selectedFitness === 'cardio' ? 'RUNNING...'
                                : selectedFitness === 'yoga' ? 'STRETCHING...'
                                    : selectedFitness === 'hypertrophy' ? 'LIFTING...'
                                        : 'TRAINING...')
                            : 'START WORKOUT'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Text style={styles.backText}>← Back to Gym</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ============ MARTIAL ARTS VIEW ============
    const renderMartialArtsView = () => {
        const level = selectedMartialArt ? (martialArtsLevels[selectedMartialArt] || 0) : 0;
        return (
            <View style={styles.subViewContainer}>
                <Text style={styles.subTitle}>{selectedMartialArt?.toUpperCase()} TRAINING</Text>
                <View style={styles.beltDisplay}>
                    <Text style={styles.beltLabel}>CURRENT BELT</Text>
                    <Text style={styles.beltName}>{BELT_NAMES[level]}</Text>
                    <View style={[styles.beltVisual, { backgroundColor: getBeltColor(level) }]} />
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (selectedMartialArt && !workoutInProgress) {
                            onStartMartialArts(selectedMartialArt);
                        }
                    }}
                    style={[styles.startBtn, workoutInProgress && styles.disabledBtn]}
                    disabled={workoutInProgress}
                    activeOpacity={0.7}>
                    <Text style={styles.startText}>{workoutInProgress ? 'TRAINING...' : 'DO TRAINING'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Text style={styles.backText}>← Back to Gym</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ============ RESULT VIEW ============
    const renderResultView = () => (
        <View style={styles.subViewContainer}>
            <Text style={styles.resultTitle}>WORKOUT COMPLETE!</Text>
            {lastResult && (
                <>
                    <Text style={styles.resultMessage}>{lastResult.message || 'Great session!'}</Text>
                    {lastResult.enjoyment !== undefined && (
                        <View style={styles.enjoymentBar}>
                            <Text style={styles.enjoymentLabel}>ENJOYMENT</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${lastResult.enjoyment}%` }]} />
                            </View>
                            <Text style={styles.enjoymentValue}>{lastResult.enjoyment}%</Text>
                        </View>
                    )}
                    {lastResult.promoted && (
                        <View style={styles.promotionBadge}>
                            <Text style={styles.promotionText}>🎉 PROMOTED TO {lastResult.newBelt?.toUpperCase()}!</Text>
                        </View>
                    )}
                </>
            )}
            <TouchableOpacity
                onPress={() => {
                    onResultClose();
                    setCurrentView('hub');
                }}
                style={styles.doneBtn}
                activeOpacity={0.7}>
                <Text style={styles.doneText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>
    );

    const getBeltColor = (level: number) => {
        const colors = ['#FFF', '#FFD700', '#FFA500', '#228B22', '#1E90FF', '#8B4513', '#000'];
        return colors[level] || '#FFF';
    };

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.headerTitle}>GYM STATUS</Text>
                            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                                <Text style={styles.closeIcon}>✖</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.progressBarBg}>
                            <Animated.View style={[styles.progressBarFill, { width: widthInterpolated }]} />
                        </View>
                        <Text style={styles.statusText}>{gymStatus.toFixed(0)}% / 100%</Text>
                    </View>

                    {/* CONTENT - Switch based on currentView */}
                    {currentView === 'hub' && renderHubView()}
                    {currentView === 'trainer' && renderTrainerView()}
                    {currentView === 'supplements' && renderSupplementsView()}
                    {currentView === 'fitnessConfig' && renderFitnessConfigView()}
                    {currentView === 'martialArts' && renderMartialArtsView()}
                    {currentView === 'result' && renderResultView()}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default GymHubModal;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#050505' },
    container: { flex: 1, paddingTop: 20 },
    header: { paddingHorizontal: 20, marginBottom: 20, zIndex: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    closeIcon: { color: '#666', fontSize: 24, padding: 8 },
    progressBarBg: { height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: theme.colors.primary },
    statusText: { color: '#666', fontSize: 10, textAlign: 'right', marginTop: 5 },

    // Hub view
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: { color: '#444', fontWeight: '800', marginTop: 30, marginBottom: 15, fontSize: 12, letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '48%', aspectRatio: 1.2, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 32, marginBottom: 8 },
    cardLabel: { color: '#EEE', fontWeight: '700' },
    maList: { gap: 8 },
    maCard: { paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    maLabel: { color: '#CCC', fontWeight: '800', letterSpacing: 1 },
    maBelt: { color: '#666', fontSize: 12 },
    modifierBtn: { padding: 20, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
    modContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modLabel: { color: theme.colors.primary, fontWeight: '700', letterSpacing: 0.5 },
    changeText: { color: '#666', fontSize: 10 },

    // Sub views
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    subTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 10 },
    subSubtitle: { color: '#666', textAlign: 'center', marginBottom: 20 },
    list: { gap: 12 },
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#666', fontSize: 14 },

    // Trainer
    trainerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
    activeCard: { borderColor: theme.colors.success, backgroundColor: 'rgba(82, 196, 26, 0.1)' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    trainerIcon: { fontSize: 20 },
    trainerInfo: { flex: 1 },
    trainerName: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    trainerRole: { color: '#888', fontSize: 12 },
    trainerBonus: { color: theme.colors.success, fontSize: 12, marginTop: 2 },
    trainerPrice: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
    activeText: { color: theme.colors.success },

    // Supplements
    supplementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
    supplementIcon: { fontSize: 24, marginRight: 12 },
    supplementName: { color: '#FFF', fontWeight: '700' },
    supplementEffect: { color: theme.colors.success, fontSize: 12 },

    // Fitness config
    configLabel: { color: '#666', fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1, textAlign: 'center' },
    optionsList: { gap: 10, marginBottom: 24 },
    optionBtn: { padding: 16, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    optionActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
    optionText: { color: '#888', fontWeight: '600', textAlign: 'center' },
    optionTextActive: { color: theme.colors.primary, fontWeight: '700' },
    startBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    startText: { color: '#000', fontWeight: '800', fontSize: 16 },
    disabledBtn: { backgroundColor: '#333' },

    // Martial arts
    beltDisplay: { alignItems: 'center', marginVertical: 30 },
    beltLabel: { color: '#666', fontSize: 12, letterSpacing: 1 },
    beltName: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 5 },
    beltVisual: { width: 100, height: 20, borderRadius: 4, marginTop: 10, borderWidth: 1, borderColor: '#333' },

    // Result
    resultTitle: { fontSize: 28, fontWeight: '900', color: theme.colors.success, textAlign: 'center', marginTop: 40 },
    resultMessage: { color: '#CCC', textAlign: 'center', marginTop: 10, fontSize: 16 },
    enjoymentBar: { marginTop: 30, alignItems: 'center' },
    enjoymentLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
    barBg: { width: '80%', height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: theme.colors.success },
    enjoymentValue: { color: '#FFF', marginTop: 5 },
    promotionBadge: { marginTop: 20, backgroundColor: 'rgba(212, 175, 55, 0.2)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary },
    promotionText: { color: theme.colors.primary, fontWeight: '800', textAlign: 'center' },
    doneBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 40 },
    doneText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
