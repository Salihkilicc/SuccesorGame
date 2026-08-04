import React from 'react';
import { t, useLocale } from '../core/i18n';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useStatsStore, useGameStore } from '../core/store';

interface GodModeModalProps {
    visible: boolean;
    onClose: () => void;
}

const GodModeModal: React.FC<GodModeModalProps> = ({ visible, onClose }) => {
    useLocale();
    const handleReset = () => {
        Alert.alert(
            'Reset Game',
            'Are you sure you want to completely reset your progress?',
            [
                { text: t('ui.cancel'), style: 'cancel' },
                {
                    text: t('ui.reset'),
                    style: 'destructive',
                    onPress: async () => {
                        await useGameStore.getState().resetGame();
                        onClose();
                    }
                }
            ]
        );
    };

    const handleAddMoney = () => {
        useStatsStore.getState().earnMoney(100_000_000);
        Alert.alert('Success', '$100M added to your balance!');
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name="flash" size={24} color="#D4AF37" />
                            <Text style={styles.title}>{t('ui.godMode')}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#AAAAAA" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>// SUPERUSER_TERMINAL_ACCESS</Text>

                    <View style={styles.content}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleAddMoney} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['rgba(39, 174, 96, 0.2)', 'rgba(39, 174, 96, 0.05)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <MaterialCommunityIcons name="cash-multiple" size={24} color="#2ecc71" />
                            <Text style={styles.actionTextMoney}>{t('ui.add100m')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, { borderColor: 'rgba(192, 57, 43, 0.3)' }]} onPress={handleReset} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['rgba(192, 57, 43, 0.2)', 'rgba(192, 57, 43, 0.05)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <MaterialCommunityIcons name="skull" size={24} color="#e74c3c" />
                            <Text style={styles.actionTextReset}>{t('ui.resetGame')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default GodModeModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D4AF37',
        overflow: 'hidden',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.2)',
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#D4AF37',
        letterSpacing: 2,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        color: '#00ff00',
        fontSize: 12,
        fontFamily: 'Courier',
        textAlign: 'center',
        marginTop: 15,
        letterSpacing: 1,
        opacity: 0.8,
    },
    content: {
        padding: 20,
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(39, 174, 96, 0.3)',
        gap: 12,
        overflow: 'hidden',
    },
    actionTextMoney: {
        color: '#2ecc71',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    actionTextReset: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
