import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { theme } from '../../../theme';
import { TrainerId, TRAINERS } from './useGymSystem';

type GymTrainerModalProps = {
    visible: boolean;
    onClose: () => void;
    onHire: (id: TrainerId) => void;
    currentTrainerId: TrainerId | null;
};

const GymTrainerModal = ({
    visible,
    onClose,
    onHire,
    currentTrainerId,
}: GymTrainerModalProps) => {
    const trainerList: TrainerId[] = ['sarah', 'marcus', 'ken'];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>SELECT TRAINER</Text>

                    <View style={styles.list}>
                        {trainerList.map((id) => {
                            const trainer = TRAINERS[id];
                            const isSelected = currentTrainerId === id;
                            return (
                                <TouchableOpacity
                                    key={id}
                                    onPress={() => onHire(id)}
                                    style={[styles.card, isSelected && styles.activeCard]}
                                    activeOpacity={0.7}>
                                    <View style={styles.iconBox}>
                                        <Text style={styles.icon}>{id === 'sarah' ? '👩' : id === 'marcus' ? '🧔' : '👴'}</Text>
                                    </View>
                                    <View style={styles.info}>
                                        <Text style={[styles.name, isSelected && styles.activeText]}>{trainer.name}</Text>
                                        <Text style={styles.role}>{trainer.label}</Text>
                                        <Text style={styles.bonus}>+{(trainer.multiplier * 100 - 100).toFixed(0)}% Gains</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.price, isSelected && styles.activeText]}>${trainer.cost}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default GymTrainerModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center'
    },
    list: {
        gap: 12
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    activeCard: {
        borderColor: theme.colors.success,
        backgroundColor: 'rgba(82, 196, 26, 0.1)'
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    icon: {
        fontSize: 20
    },
    info: {
        flex: 1
    },
    name: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16
    },
    role: {
        color: '#888',
        fontSize: 12
    },
    bonus: {
        color: theme.colors.success,
        fontSize: 12,
        marginTop: 2
    },
    price: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 16
    },
    activeText: {
        color: theme.colors.success
    },
    closeBtn: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10
    },
    closeText: {
        color: '#666',
        textDecorationLine: 'underline'
    }
});
