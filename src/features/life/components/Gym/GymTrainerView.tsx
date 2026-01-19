import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    SafeAreaView,
    Image
} from 'react-native';
import { useGymSystem, TRAINER_COSTS, TrainerTier } from './useGymSystem';

interface Props {
    visible?: boolean;
    onClose?: () => void;
}

const TRAINERS: { id: TrainerTier; name: string; title: string; cost: number; icon: string; boost: string }[] = [
    { id: 'rookie', name: 'Mike', title: 'Gym Bro', cost: TRAINER_COSTS.rookie, icon: '🧢', boost: '+5% Gains' },
    { id: 'local', name: 'Sarah', title: 'Local Trainer', cost: TRAINER_COSTS.local, icon: '⏱️', boost: '+15% Gains' },
    { id: 'influencer', name: 'Chad', title: 'Influencer', cost: TRAINER_COSTS.influencer, icon: '📸', boost: '+30% Gains' },
    { id: 'legend', name: 'Ronnie', title: 'Mr. Olympia', cost: TRAINER_COSTS.legend, icon: '🏆', boost: '+50% Gains' },
];

const GymTrainerView = () => {
    const { activeView, isVisible, goBackToHub, gymState, hireTrainer } = useGymSystem();
    const currentTrainer = gymState.trainerId;

    const handleBack = () => {
        goBackToHub();
    };

    const handleHire = (tier: TrainerTier) => {
        const result = hireTrainer(tier);
        if (result.success) {
            Alert.alert('Trainer Hired', result.message);
        } else {
            Alert.alert('Error', result.message);
        }
    };

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
                            <Text style={styles.title}>HIRE TRAINER</Text>
                            <Text style={styles.subtitle}>Boost your gains</Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        {TRAINERS.map((trainer) => {
                            const isHired = currentTrainer === trainer.id;

                            return (
                                <View key={trainer.id} style={[styles.trainerCard, isHired && styles.activeCard]}>
                                    <Text style={styles.icon}>{trainer.icon}</Text>

                                    <View style={styles.info}>
                                        <Text style={styles.name}>{trainer.name}</Text>
                                        <Text style={styles.role}>{trainer.title}</Text>
                                        <Text style={styles.boost}>{trainer.boost}</Text>
                                    </View>

                                    <View style={styles.actions}>
                                        <Text style={styles.price}>${trainer.cost}/mo</Text>
                                        <TouchableOpacity
                                            style={[styles.hireBtn, isHired && styles.hiredBtn]}
                                            onPress={() => !isHired && handleHire(trainer.id)}
                                            disabled={isHired}
                                        >
                                            <Text style={[styles.hireText, isHired && { color: '#059669' }]}>
                                                {isHired ? 'HIRED' : 'HIRE'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

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
    title: { fontSize: 24, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    list: { gap: 16 },

    trainerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 16,
    },
    activeCard: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    icon: { fontSize: 32 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '800', color: '#111827' },
    role: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    boost: { fontSize: 12, color: '#007AFF', fontWeight: '700', marginTop: 2 },

    actions: { alignItems: 'flex-end', gap: 6 },
    price: { fontSize: 14, fontWeight: '700', color: '#374151' },
    hireBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    hiredBtn: {
        backgroundColor: '#D1FAE5',
    },
    hireText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
});

export default GymTrainerView;
