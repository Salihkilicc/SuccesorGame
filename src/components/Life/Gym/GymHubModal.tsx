import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    SafeAreaView,
} from 'react-native';
import { theme } from '../../../theme';
import { TrainerId, MartialArtDiscipline } from './useGymSystem';

import GymHubView from './components/GymHubView';
import TrainerSelectionView from './components/TrainerSelectionView';
import SupplementsView from './components/SupplementsView';
import FitnessConfigView from './components/FitnessConfigView';
import MartialArtsView from './components/MartialArtsView';
import GymResultView from './components/GymResultView';

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
                    {currentView === 'hub' && (
                        <GymHubView
                            onSelectFitness={(type) => {
                                setSelectedFitness(type);
                                setFitnessOption(0);
                                setCurrentView('fitnessConfig');
                            }}
                            onSelectMartialArt={(type) => {
                                setSelectedMartialArt(type);
                                setCurrentView('martialArts');
                            }}
                            onOpenTrainer={() => setCurrentView('trainer')}
                            onOpenSupplements={() => setCurrentView('supplements')}
                            trainerId={trainerId}
                            martialArtsLevels={martialArtsLevels}
                        />
                    )}

                    {currentView === 'trainer' && (
                        <TrainerSelectionView
                            trainerId={trainerId}
                            onHireTrainer={(id) => {
                                onHireTrainer(id);
                                setCurrentView('hub');
                            }}
                            onBack={handleBack}
                        />
                    )}

                    {currentView === 'supplements' && (
                        <SupplementsView
                            onBack={handleBack}
                        />
                    )}

                    {currentView === 'fitnessConfig' && (
                        <FitnessConfigView
                            selectedFitness={selectedFitness}
                            fitnessOption={fitnessOption}
                            setFitnessOption={setFitnessOption}
                            workoutInProgress={workoutInProgress}
                            onStartFitness={onStartFitness}
                            onBack={handleBack}
                        />
                    )}

                    {currentView === 'martialArts' && (
                        <MartialArtsView
                            selectedMartialArt={selectedMartialArt}
                            currentLevel={selectedMartialArt ? (martialArtsLevels[selectedMartialArt] || 0) : 0}
                            workoutInProgress={workoutInProgress}
                            onStartMartialArts={onStartMartialArts}
                            onBack={handleBack}
                        />
                    )}

                    {currentView === 'result' && (
                        <GymResultView
                            lastResult={lastResult}
                            onClose={() => {
                                onResultClose();
                                setCurrentView('hub');
                            }}
                        />
                    )}
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
});
