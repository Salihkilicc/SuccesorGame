import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../theme';
import { TrainerId, TRAINERS } from '../useGymSystem';

type TrainerSelectionViewProps = {
    trainerId: TrainerId | null;
    onHireTrainer: (id: TrainerId) => void;
    onBack: () => void;
};

const TrainerSelectionView = ({ trainerId, onHireTrainer, onBack }: TrainerSelectionViewProps) => {
    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>SELECT TRAINER</Text>
            <View style={styles.list}>
                {(['sarah', 'marcus', 'ken'] as TrainerId[]).map((id) => {
                    const trainer = TRAINERS[id];
                    const isSelected = trainerId === id;
                    return (
                        <TouchableOpacity
                            key={id}
                            onPress={() => onHireTrainer(id)}
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
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Back to Gym</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    subTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 10 },
    list: { gap: 12 },
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
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#666', fontSize: 14 },
});

export default TrainerSelectionView;
