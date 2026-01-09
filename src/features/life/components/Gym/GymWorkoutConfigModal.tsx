import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { theme } from '../../../../core/theme';

type GymWorkoutConfigModalProps = {
    visible: boolean;
    onClose: () => void;
    type: string | null;
    onStart: (config: any) => void;
};

const GymWorkoutConfigModal = ({ visible, onClose, type, onStart }: GymWorkoutConfigModalProps) => {
    const [option, setOption] = useState(0);

    if (!type) return null;

    const CONFIGS: Record<string, string[]> = {
        cardio: ['15 Minutes', '30 Minutes', '1 Hour', '2 Hours'],
        hypertrophy: ['Light', 'Medium', 'Heavy', 'Till Failure'],
        yoga: ['15 Minutes', '30 Minutes', '1 Hour'],
        calisthenics: ['Beginner', 'Intermediate', 'Advanced', 'Beast Mode']
    };

    const options = CONFIGS[type] || [];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>{type.toUpperCase()} SETUP</Text>

                    <Text style={styles.label}>SELECT INTENSITY/DURATION</Text>
                    <View style={styles.options}>
                        {options.map((opt, idx) => (
                            <Pressable
                                key={opt}
                                onPress={() => setOption(idx)}
                                style={[styles.btn, option === idx && styles.activeBtn]}>
                                <Text style={[styles.btnText, option === idx && styles.activeText]}>{opt}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={() => onStart({ option })} style={styles.startBtn}>
                        <Text style={styles.startText}>START WORKOUT</Text>
                    </Pressable>

                    <Pressable onPress={onClose} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default GymWorkoutConfigModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 24,
        borderColor: theme.colors.border,
        borderWidth: 1
    },
    title: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 20 },
    label: { color: '#666', fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1 },
    options: { gap: 10, marginBottom: 24 },
    btn: { padding: 16, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    activeBtn: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
    btnText: { color: '#888', fontWeight: '600', textAlign: 'center' },
    activeText: { color: theme.colors.primary, fontWeight: '700' },
    startBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: 8, alignItems: 'center' },
    startText: { color: '#000', fontWeight: '800', fontSize: 16 },
    cancelBtn: { marginTop: 16, alignItems: 'center' },
    cancelText: { color: '#666' }
});
