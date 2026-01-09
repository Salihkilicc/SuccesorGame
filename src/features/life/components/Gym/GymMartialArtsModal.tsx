import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { MartialArtDiscipline, MARTIAL_ARTS_BELTS } from './useGymSystem';

type GymMartialArtsModalProps = {
    visible: boolean;
    onClose: () => void;
    discipline: MartialArtDiscipline | null;
    currentLevel: number;
    onTrain: () => void;
    workoutInProgress: boolean;
};

const GymMartialArtsModal = ({
    visible,
    onClose,
    discipline,
    currentLevel,
    onTrain,
    workoutInProgress
}: GymMartialArtsModalProps) => {

    if (!discipline) return null;

    const beltName = MARTIAL_ARTS_BELTS[Math.min(currentLevel, MARTIAL_ARTS_BELTS.length - 1)];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{discipline.toUpperCase()}</Text>
                        <Text style={styles.beltLabel}>CURRENT BELT</Text>
                        <Text style={[styles.beltValue, { color: beltName === 'Black' ? '#FFF' : beltName }]}>
                            {beltName.toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.dojo}>
                        <Text style={styles.sensei}>"Pain is weakness leaving the body."</Text>
                    </View>

                    <Pressable
                        onPress={onTrain}
                        disabled={workoutInProgress}
                        style={[styles.trainBtn, workoutInProgress && styles.disabled]}>
                        <Text style={styles.trainText}>
                            {workoutInProgress ? 'TRAINING...' : 'DO TRAINING'}
                        </Text>
                    </Pressable>

                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Leave Dojo</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default GymMartialArtsModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: '#111',
        borderRadius: 4,
        padding: 30,
        borderWidth: 2,
        borderColor: '#333'
    },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '900', color: theme.colors.error, marginBottom: 20, letterSpacing: 2 },
    beltLabel: { color: '#666', fontSize: 12, letterSpacing: 3, marginBottom: 4 },
    beltValue: { fontSize: 28, fontWeight: '800' },
    dojo: { alignItems: 'center', marginBottom: 40 },
    sensei: { fontStyle: 'italic', color: '#555', textAlign: 'center' },
    trainBtn: { backgroundColor: theme.colors.error, paddingVertical: 18, borderRadius: 2, alignItems: 'center' },
    trainText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    disabled: { opacity: 0.5 },
    closeBtn: { marginTop: 20, alignItems: 'center' },
    closeText: { color: '#444' }
});
