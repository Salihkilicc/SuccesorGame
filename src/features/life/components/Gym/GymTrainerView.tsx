import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
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
import { useGymSystem, TrainerTier } from './useGymSystem';
import { TRAINER_COSTS } from './gymData';

interface Props {
    visible?: boolean;
    onClose?: () => void;
}

const TRAINERS: { id: TrainerTier; name: string; title: string; cost: number; icon: string; boost: string }[] = [
    { id: 'rookie', name: t('life.mike'), title: t('life.gymBro'), cost: TRAINER_COSTS.rookie, icon: '🧢', boost: '+5% Gains' },
    { id: 'local', name: t('life.sarah'), title: t('life.localTrainer'), cost: TRAINER_COSTS.local, icon: '⏱️', boost: '+15% Gains' },
    { id: 'influencer', name: t('life.chad'), title: t('life.influencer'), cost: TRAINER_COSTS.influencer, icon: '📸', boost: '+30% Gains' },
    { id: 'legend', name: t('life.ronnie'), title: t('life.mrOlympia'), cost: TRAINER_COSTS.legend, icon: '🏆', boost: '+50% Gains' },
];

const GymTrainerView = () => {
    useLocale();
    const { data, actions, activeView, isVisible } = useGymSystem();
    const { trainerId: currentTrainer } = data;
    const { goBackToHub, hireTrainer } = actions;
    // const currentTrainer = gymState.trainerId; // Removed legacy line

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
                            <Text style={styles.title}>{t('life.hireTrainer')}</Text>
                            <Text style={styles.subtitle}>{t('life.boostYourGains')}</Text>
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
                                            <Text style={[styles.hireText, isHired && { color: '#C734CA' }]}>
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
        backgroundColor: '#020626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    card: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#020626',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#020626',
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
        backgroundColor: '#020626',
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    backText: { fontSize: 14, color: '#C734CA', fontWeight: '700' },
    headerTitleContainer: { alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: '#C734CA', marginTop: 4 },
    list: { gap: 16 },

    trainerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#020626',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 16,
    },
    activeCard: {
        backgroundColor: '#020626',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    icon: { fontSize: 32 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    role: { fontSize: 12, color: '#C734CA', fontWeight: '600' },
    boost: { fontSize: 12, color: '#C734CA', fontWeight: '700', marginTop: 2 },

    actions: { alignItems: 'flex-end', gap: 6 },
    price: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    hireBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#0B0635',
        borderRadius: 8,
    },
    hiredBtn: {
        backgroundColor: '#020626',
    },
    hireText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});

export default GymTrainerView;
