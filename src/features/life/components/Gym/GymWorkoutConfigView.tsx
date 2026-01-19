import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert
} from 'react-native';
import { useGymSystem, WorkoutType, TRAINER_MULTIPLIERS } from './useGymSystem';

interface Props {
    visible?: boolean;
    onClose?: () => void;
}

const WORKOUT_TYPES: { id: WorkoutType; label: string; icon: string; focus: string; color: string }[] = [
    { id: 'Weights', label: 'Weights', icon: '🏋️‍♂️', focus: 'Strength Focus', color: '#EF4444' },
    { id: 'Yoga', label: 'Yoga', icon: '🧘‍♂️', focus: 'Health Focus', color: '#10B981' },
    { id: 'Running', label: 'Running', icon: '🏃‍♂️', focus: 'Stamina Focus', color: '#F59E0B' },
    { id: 'Pilates', label: 'Pilates', icon: '🤸', focus: 'Flexibility Focus', color: '#8B5CF6' },
];

const GymWorkoutConfigView = () => {
    const {
        activeView,
        isVisible,
        goBackToHub, // Navigation Alias
        trainWorkout,
        trainerId,
        calculatePotentialGain,
    } = useGymSystem();

    const handleBack = () => {
        goBackToHub();
    };

    const handleTrain = (type: WorkoutType) => {
        const result = trainWorkout(type);
        if (result.success) {
            Alert.alert(
                'Workout Complete! 💪',
                `${result.message}\nFatigue: +15%`,
                [{ text: 'OK', onPress: handleBack }]
            );
        } else {
            Alert.alert('Cannot Train', result.message);
        }
    };

    const multiplier = TRAINER_MULTIPLIERS[trainerId] || 1.0;
    const potentialGain = calculatePotentialGain().toFixed(2);

    // Trainer Badge Display
    const trainerName = trainerId === 'none' ? 'No Trainer' : trainerId.charAt(0).toUpperCase() + trainerId.slice(1);

    return (
        <View style={styles.backdrop}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.card}>

                    {/* Header (Back Navigation) */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.title}>CHOOSE WORKOUT</Text>
                            <Text style={styles.subtitle}>Develop your physique</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Trainer Badge */}
                    <View style={styles.trainerBadge}>
                        <Text style={styles.trainerIcon}>🧢</Text>
                        <View>
                            <Text style={styles.trainerLabel}>Current Trainer</Text>
                            <Text style={styles.trainerValue}>
                                {trainerName}{' '}
                                <Text style={styles.multiplier}>(x{multiplier} Boost)</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {WORKOUT_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.gridItem, { borderColor: item.color }]}
                                onPress={() => handleTrain(item.id)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Text style={styles.itemIcon}>{item.icon}</Text>
                                </View>
                                <View>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                    <Text style={styles.itemFocus}>{item.focus}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Fatigue Cost:</Text>
                            <Text style={styles.statValueBad}>15%</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Potential Mastery:</Text>
                            <Text style={styles.statValueGood}>+{potentialGain}%</Text>
                        </View>
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    card: {
        width: '90%',
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
    title: { fontSize: 18, fontWeight: '900', color: '#111827', textTransform: 'uppercase' },
    subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    trainerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    trainerIcon: { fontSize: 24, marginRight: 12 },
    trainerLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
    trainerValue: { fontSize: 14, color: '#1E40AF', fontWeight: '800' },
    multiplier: { color: '#059669' },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginBottom: 24,
    },
    gridItem: {
        width: '48%',
        aspectRatio: 1.1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        gap: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemIcon: { fontSize: 24 },
    itemLabel: { fontSize: 14, fontWeight: '800', color: '#111827', textAlign: 'center' },
    itemFocus: { fontSize: 10, color: '#6B7280', fontWeight: '600', textAlign: 'center' },

    footer: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
        gap: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    statValueBad: { fontSize: 14, color: '#EF4444', fontWeight: '800' },
    statValueGood: { fontSize: 14, color: '#10B981', fontWeight: '800' },
});

export default GymWorkoutConfigView;
