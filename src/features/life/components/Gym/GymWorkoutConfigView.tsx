import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useGymSystem, WorkoutType } from './useGymSystem';

const WORKOUTS: { type: WorkoutType; icon: string; label: string; desc: string }[] = [
    { type: 'Weights', icon: '🏋️', label: 'Weights', desc: 'Build raw power' },
    { type: 'Yoga', icon: '🧘', label: 'Yoga', desc: 'Flexibility & balance' },
    { type: 'Running', icon: '🏃', label: 'Running', desc: 'Cardio endurance' },
    { type: 'Pilates', icon: '🤸', label: 'Pilates', desc: 'Core strength' },
];

/**
 * GYM WORKOUT CONFIG VIEW
 * 
 * Displays workout options in a 2x2 grid.
 * Each workout applies the same base formula with trainer multipliers.
 */
const GymWorkoutConfigView = () => {
    // --- Hook Destructuring ---
    const { data, actions } = useGymSystem();
    const { stats, trainerId } = data;
    const { goBackToHub, trainWorkout, calculatePotentialGain } = actions;

    const { fatigue } = stats;
    const potentialGain = calculatePotentialGain();

    // --- Handler ---
    const handleWorkout = (type: WorkoutType) => {
        const result = trainWorkout(type);
        if (result.success && result.gains) {
            Alert.alert(
                'Workout Complete! 💪',
                `Strength +${result.gains.strength.toFixed(2)}\nCharm +${result.gains.charm.toFixed(2)}`
            );
        } else {
            Alert.alert('Cannot Train', result.message);
        }
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
                            <Text style={styles.title}>WORKOUT</Text>
                            <Text style={styles.subtitle}>Choose your training</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Stats Summary */}
                    <View style={styles.statsCard}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>FATIGUE</Text>
                            <Text style={[styles.statValue, { color: fatigue > 80 ? '#FF6F00' : '#FF6F00' }]}>
                                {fatigue}%
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>POTENTIAL GAIN</Text>
                            <Text style={styles.statValue}>+{potentialGain.toFixed(2)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>TRAINER BOOST</Text>
                            <Text style={styles.statValue}>{trainerId === 'none' ? 'None' : trainerId.toUpperCase()}</Text>
                        </View>
                    </View>

                    {/* Workout Grid (2x2) */}
                    <View style={styles.grid}>
                        {WORKOUTS.map((workout) => (
                            <TouchableOpacity
                                key={workout.type}
                                style={styles.workoutCard}
                                onPress={() => handleWorkout(workout.type)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.workoutIcon}>{workout.icon}</Text>
                                <Text style={styles.workoutLabel}>{workout.label}</Text>
                                <Text style={styles.workoutDesc}>{workout.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Info Footer */}
                    <View style={styles.infoFooter}>
                        <Text style={styles.infoText}>
                            💡 Each workout: +15% Fatigue, +{potentialGain.toFixed(2)} Strength, +{(potentialGain * 0.1).toFixed(2)} Charm
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        backgroundColor: '#0D1321',
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
        backgroundColor: '#0D1321',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: { fontSize: 14, color: '#C0C0C0', fontWeight: '700' },
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
        color: '#C0C0C0',
        marginTop: 4,
    },
    statsCard: {
        backgroundColor: '#000000',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#C0C0C0',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: { height: 1, backgroundColor: '#C0C0C0', marginVertical: 8 },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#C0C0C0', letterSpacing: 0.5 },
    statValue: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // gap: 12, // Removing gap to rely on space-between for horizontal
        marginBottom: 20,
    },
    workoutCard: {
        width: '47%', // Reduced slightly to ensure fit
        marginBottom: 12, // vertical spacing

        backgroundColor: '#0D1321',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FF6F00',
        shadowColor: '#FF6F00',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    workoutIcon: { fontSize: 36, marginBottom: 8 },
    workoutLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    workoutDesc: {
        fontSize: 11,
        color: '#C0C0C0',
        textAlign: 'center',
    },
    infoFooter: {
        backgroundColor: '#000000',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FF6F00',
    },
    infoText: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default GymWorkoutConfigView;
