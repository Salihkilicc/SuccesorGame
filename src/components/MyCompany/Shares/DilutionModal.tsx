import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store/useStatsStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DilutionModal = ({ visible, onClose }: Props) => {
    const { companyValue, companyOwnership, performDilution } = useStatsStore();
    const [dilutionPercentage, setDilutionPercentage] = useState(5);

    const capitalRaised = companyValue * (dilutionPercentage / 100);
    const newOwnership = companyOwnership * (1 - dilutionPercentage / 100);

    const handleConfirm = () => {
        if (dilutionPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a dilution percentage.');
            return;
        }

        Alert.alert(
            'Confirm Dilution',
            `Sell ${dilutionPercentage.toFixed(1)}% of company shares for $${(capitalRaised / 1_000_000).toFixed(1)}M?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        performDilution(dilutionPercentage);
                        onClose();
                        Alert.alert(
                            'Dilution Complete',
                            `Raised $${(capitalRaised / 1_000_000).toFixed(1)}M. Your ownership is now ${newOwnership.toFixed(1)}%.`
                        );
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.content}>
                    <Text style={styles.title}>💰 Share Dilution</Text>

                    <Text style={styles.description}>
                        Issue new shares to raise capital. This will reduce your ownership percentage.
                    </Text>

                    <View style={styles.sliderCard}>
                        <View style={styles.sliderHeader}>
                            <Text style={styles.sliderLabel}>Dilution Amount</Text>
                            <Text style={styles.sliderValue}>{dilutionPercentage.toFixed(1)}%</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={10}
                            step={0.5}
                            value={dilutionPercentage}
                            onValueChange={setDilutionPercentage}
                            minimumTrackTintColor={theme.colors.accent}
                            maximumTrackTintColor={theme.colors.cardSoft}
                            thumbTintColor={theme.colors.accent}
                        />
                    </View>

                    <View style={styles.calculationCard}>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Capital Raised</Text>
                            <Text style={styles.calcValue}>
                                +${(capitalRaised / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Current Ownership</Text>
                            <Text style={styles.calcValue}>{companyOwnership.toFixed(2)}%</Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>New Ownership</Text>
                            <Text style={[styles.calcValue, { color: theme.colors.danger }]}>
                                {newOwnership.toFixed(2)}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnCancel,
                                pressed && styles.btnPressed,
                            ]}>
                            <Text style={styles.btnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnConfirm,
                                pressed && styles.btnPressed,
                            ]}>
                            <Text style={[styles.btnText, { color: '#000' }]}>Confirm</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    sliderCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sliderLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.accent,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    calculationCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calcLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    calcValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    btn: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    btnCancel: {
        backgroundColor: theme.colors.cardSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    btnConfirm: {
        backgroundColor: theme.colors.success,
    },
    btnPressed: {
        transform: [{ scale: 0.98 }],
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
});

export default DilutionModal;
