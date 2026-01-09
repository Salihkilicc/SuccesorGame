import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';
import { TrainerId, TRAINERS, MartialArtDiscipline } from '../useGymSystem';

const BELT_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];

type GymHubViewProps = {
    onSelectFitness: (type: string) => void;
    onSelectMartialArt: (type: MartialArtDiscipline) => void;
    onOpenTrainer: () => void;
    onOpenSupplements: () => void;
    trainerId: TrainerId | null;
    martialArtsLevels: Record<string, number>;
};

const GymHubView = ({
    onSelectFitness,
    onSelectMartialArt,
    onOpenTrainer,
    onOpenSupplements,
    trainerId,
    martialArtsLevels,
}: GymHubViewProps) => {
    return (
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
                        onPress={() => onSelectFitness(item.key)}
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
                        onPress={() => onSelectMartialArt(art)}
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
                onPress={onOpenTrainer}
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
                onPress={onOpenSupplements}
                style={styles.modifierBtn}
                activeOpacity={0.7}>
                <Text style={styles.modLabel}>LOCKER ROOM (SUPPLEMENTS)</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
});

export default GymHubView;
