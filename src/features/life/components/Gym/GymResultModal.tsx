import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { WorkoutResult } from './useGymSystem';

type GymResultModalProps = {
    visible: boolean;
    onClose: () => void;
    result: WorkoutResult | null;
};

const GymResultModal = ({ visible, onClose, result }: GymResultModalProps) => {
    useLocale();
    if (!result) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t('life.workoutComplete')}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.health')}</Text>
                            <Text style={[styles.statValue, result.healthChange < 0 ? styles.red : styles.green]}>
                                {result.healthChange > 0 ? '+' : ''}{result.healthChange}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.stress')}</Text>
                            <Text style={[styles.statValue, result.stressChange < 0 ? styles.green : styles.red]}>
                                {result.stressChange}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('life.charisma')}</Text>
                            <Text style={[styles.statValue, styles.green]}>
                                +{result.charismaChange}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.message}>{result.message}</Text>

                    <Pressable onPress={onClose} style={styles.button}>
                        <Text style={styles.buttonText}>{t('life.continue')}</Text>
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
        backgroundColor: '#0B0635',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#0B0635',
        borderRadius: theme.radius.lg,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
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
        borderBottomColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 8
    },
    statLabel: {
        color: '#C734CA',
        fontSize: 16
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700'
    },
    green: { color: '#C734CA' },
    red: { color: '#C734CA' },
    message: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
        opacity: 0.8
    },
    button: {
        backgroundColor: '#0B0635',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});
