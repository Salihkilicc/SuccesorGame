import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';
import { TrainerId, TRAINERS } from '../useGymSystem';

type TrainerSelectionViewProps = {
    trainerId: TrainerId | null;
    onHireTrainer: (id: TrainerId) => void;
    onBack: () => void;
};

const TrainerSelectionView = ({ trainerId, onHireTrainer, onBack }: TrainerSelectionViewProps) => {
    useLocale();
    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>{t('life.selectTrainer')}</Text>
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
    subTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
    list: { gap: 12 },
    trainerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#C0C0C0' },
    activeCard: { borderColor: '#FF6F00', backgroundColor: '#0D1321' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0D1321', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    trainerIcon: { fontSize: 20 },
    trainerInfo: { flex: 1 },
    trainerName: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    trainerRole: { color: '#C0C0C0', fontSize: 12 },
    trainerBonus: { color: '#FF6F00', fontSize: 12, marginTop: 2 },
    trainerPrice: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    activeText: { color: '#FF6F00' },
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#C0C0C0', fontSize: 14 },
});

export default TrainerSelectionView;
