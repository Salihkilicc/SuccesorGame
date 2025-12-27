import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../theme';
import { MartialArtDiscipline } from '../useGymSystem';

const BELT_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];

type MartialArtsViewProps = {
    selectedMartialArt: MartialArtDiscipline | null;
    currentLevel: number;
    workoutInProgress: boolean;
    onStartMartialArts: (type: MartialArtDiscipline) => void;
    onBack: () => void;
};

const MartialArtsView = ({
    selectedMartialArt,
    currentLevel,
    workoutInProgress,
    onStartMartialArts,
    onBack,
}: MartialArtsViewProps) => {

    const getBeltColor = (level: number) => {
        const colors = ['#FFF', '#FFD700', '#FFA500', '#228B22', '#1E90FF', '#8B4513', '#000'];
        return colors[level] || '#FFF';
    };

    const handleStart = () => {
        if (selectedMartialArt && !workoutInProgress) {
            onStartMartialArts(selectedMartialArt);
        }
    };

    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>{selectedMartialArt?.toUpperCase()} TRAINING</Text>
            <View style={styles.beltDisplay}>
                <Text style={styles.beltLabel}>CURRENT BELT</Text>
                <Text style={styles.beltName}>{BELT_NAMES[currentLevel]}</Text>
                <View style={[styles.beltVisual, { backgroundColor: getBeltColor(currentLevel) }]} />
            </View>
            <TouchableOpacity
                onPress={handleStart}
                style={[styles.startBtn, workoutInProgress && styles.disabledBtn]}
                disabled={workoutInProgress}
                activeOpacity={0.7}>
                <Text style={styles.startText}>{workoutInProgress ? 'TRAINING...' : 'DO TRAINING'}</Text>
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
    beltDisplay: { alignItems: 'center', marginVertical: 30 },
    beltLabel: { color: '#666', fontSize: 12, letterSpacing: 1 },
    beltName: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 5 },
    beltVisual: { width: 100, height: 20, borderRadius: 4, marginTop: 10, borderWidth: 1, borderColor: '#333' },
    startBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    startText: { color: '#000', fontWeight: '800', fontSize: 16 },
    disabledBtn: { backgroundColor: '#333' },
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#666', fontSize: 14 },
});

export default MartialArtsView;
