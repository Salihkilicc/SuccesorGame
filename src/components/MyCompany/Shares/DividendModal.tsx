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

const DividendModal = ({ visible, onClose }: Props) => {
    const { companyCapital, companyOwnership, payDividend } = useStatsStore();
    const [dividendPercentage, setDividendPercentage] = useState(10);

    const dividendPool = companyCapital * (dividendPercentage / 100);
    const playerDividend = dividendPool * (companyOwnership / 100);
    const remainingCapital = companyCapital - dividendPool;

    const handleConfirm = () => {
        if (dividendPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a dividend percentage.');
            return;
        }

        if (dividendPool > companyCapital) {
            Alert.alert('Insufficient Capital', 'Company does not have enough capital for this dividend.');
            return;
        }

        const warningMessage = dividendPercentage > 30
            ? '\n\n⚠️ Warning: This is a large dividend that may impact company operations.'
            : '';

        Alert.alert(
            'Confirm Dividend',
            `Pay ${dividendPercentage.toFixed(1)}% dividend? You will receive $${(playerDividend / 1_000_000).toFixed(2)}M.${warningMessage}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay Dividend',
                    onPress: () => {
                        payDividend(dividendPercentage);
                        onClose();
                        Alert.alert(
                            'Dividend Paid',
                            `$${(playerDividend / 1_000_000).toFixed(2)}M transferred to your personal account.`
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
                    <Text style={styles.title}>💸 Pay Dividend</Text>

                    <Text style={styles.description}>
                        Distribute company profits to shareholders. Your share will be transferred to your personal wallet.
                    </Text>

                    <View style={styles.capitalCard}>
                        <Text style={styles.capitalLabel}>Available Capital</Text>
                        <Text style={styles.capitalValue}>
                            ${(companyCapital / 1_000_000).toFixed(2)}M
                        </Text>
                    </View>

                    <View style={styles.sliderCard}>
                        <View style={styles.sliderHeader}>
                            <Text style={styles.sliderLabel}>Dividend Amount</Text>
                            <Text style={styles.sliderValue}>{dividendPercentage.toFixed(1)}%</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={50}
                            step={1}
                            value={dividendPercentage}
                            onValueChange={setDividendPercentage}
                            minimumTrackTintColor={theme.colors.success}
                            maximumTrackTintColor={theme.colors.cardSoft}
                            thumbTintColor={theme.colors.success}
                        />
                    </View>

                    <View style={styles.calculationCard}>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Total Dividend Pool</Text>
                            <Text style={styles.calcValue}>
                                ${(dividendPool / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Your Share ({companyOwnership.toFixed(1)}%)</Text>
                            <Text style={[styles.calcValue, { color: theme.colors.success }]}>
                                +${(playerDividend / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Remaining Capital</Text>
                            <Text style={[
                                styles.calcValue,
                                { color: remainingCapital < companyCapital * 0.3 ? theme.colors.danger : theme.colors.textPrimary }
                            ]}>
                                ${(remainingCapital / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>
                    </View>

                    {dividendPercentage > 30 && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                ⚠️ High dividend may impact company operations
                            </Text>
                        </View>
                    )}

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
                            <Text style={[styles.btnText, { color: '#000' }]}>Pay Dividend</Text>
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
    capitalCard: {
        backgroundColor: theme.colors.success + '20',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    capitalLabel: {
        fontSize: 14,
        color: theme.colors.textPrimary,
    },
    capitalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.success,
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
        color: theme.colors.success,
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
    warningBox: {
        backgroundColor: theme.colors.danger + '20',
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    warningText: {
        fontSize: 12,
        color: theme.colors.danger,
        textAlign: 'center',
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

export default DividendModal;
