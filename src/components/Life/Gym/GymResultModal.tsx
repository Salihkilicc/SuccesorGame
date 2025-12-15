import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../theme';
import { WorkoutResult } from './useGymSystem';

type GymResultModalProps = {
    visible: boolean;
    onClose: () => void;
    result: WorkoutResult | null;
};

const GymResultModal = ({ visible, onClose, result }: GymResultModalProps) => {
    if (!result) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>WORKOUT COMPLETE</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Health</Text>
                            <Text style={[styles.statValue, result.healthChange < 0 ? styles.red : styles.green]}>
                                {result.healthChange > 0 ? '+' : ''}{result.healthChange}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Stress</Text>
                            <Text style={[styles.statValue, result.stressChange < 0 ? styles.green : styles.red]}>
                                {result.stressChange}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Charisma</Text>
                            <Text style={[styles.statValue, styles.green]}>
                                +{result.charismaChange}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.message}>{result.message}</Text>

                    <Pressable onPress={onClose} style={styles.button}>
                        <Text style={styles.buttonText}>CONTINUE</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default GymResultModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 20
    },
    statsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 20
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingBottom: 8
    },
    statLabel: {
        color: '#AAA',
        fontSize: 16
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700'
    },
    green: { color: theme.colors.success },
    red: { color: theme.colors.error },
    message: {
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
        opacity: 0.8
    },
    button: {
        backgroundColor: theme.colors.success,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8
    },
    buttonText: {
        color: '#000',
        fontWeight: '700'
    }
});
