import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type FitnessConfigViewProps = {
    selectedFitness: string | null;
    fitnessOption: number;
    setFitnessOption: (option: number) => void;
    workoutInProgress: boolean;
    onStartFitness: (type: string, config: any) => void;
    onBack: () => void;
};

const FitnessConfigView = ({
    selectedFitness,
    fitnessOption,
    setFitnessOption,
    workoutInProgress,
    onStartFitness,
    onBack,
}: FitnessConfigViewProps) => {
    const CONFIGS: Record<string, string[]> = {
        cardio: ['15 Minutes', '30 Minutes', '1 Hour', '2 Hours'],
        hypertrophy: ['Light', 'Medium', 'Heavy', 'Till Failure'],
        yoga: ['15 Minutes', '30 Minutes', '1 Hour'],
        calisthenics: ['Beginner', 'Intermediate', 'Advanced', 'Beast Mode']
    };
    const options = selectedFitness ? CONFIGS[selectedFitness] || [] : [];

    const handleStart = () => {
        if (selectedFitness && !workoutInProgress) {
            onStartFitness(selectedFitness, { option: fitnessOption });
        }
    };

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
                onPress={handleStart}
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
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Back to Gym</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    subTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 10 },
    configLabel: { color: '#666', fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1, textAlign: 'center' },
    optionsList: { gap: 10, marginBottom: 24 },
    optionBtn: { padding: 16, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    optionActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
    optionText: { color: '#888', fontWeight: '600', textAlign: 'center' },
    optionTextActive: { color: theme.colors.primary, fontWeight: '700' },
    startBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    startText: { color: '#000', fontWeight: '800', fontSize: 16 },
    disabledBtn: { backgroundColor: '#333' },
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#666', fontSize: 14 },
});

export default FitnessConfigView;
