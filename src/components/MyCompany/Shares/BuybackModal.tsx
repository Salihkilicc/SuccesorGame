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

const BuybackModal = ({ visible, onClose }: Props) => {
    const { companyValue, companyOwnership, companyCapital, performBuyback } = useStatsStore();
    const [buybackPercentage, setBuybackPercentage] = useState(1);

    const cost = companyValue * (buybackPercentage / 100);
    const multiplier = 1 / (1 - (buybackPercentage / 100));
    const newOwnership = Math.min(100, companyOwnership * multiplier);

    // Check affordability
    const isAffordable = companyCapital >= cost;

    const handleConfirm = () => {
        if (buybackPercentage <= 0) {
            Alert.alert('Invalid Amount', 'Please select a percentage.');
            return;
        }
        if (!isAffordable) {
            Alert.alert('Insufficient Capital', `Company needs $${(cost / 1_000_000).toFixed(1)}M to buy back shares.`);
            return;
        }

        Alert.alert(
            'Confirm Buyback',
            `Spend $${(cost / 1_000_000).toFixed(1)}M to buy back ${buybackPercentage.toFixed(1)}% of shares?\n\nThis will increase your ownership to ${newOwnership.toFixed(1)}%.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: () => {
                        performBuyback(buybackPercentage);
                        onClose();
                        Alert.alert(
                            'Buyback Complete',
                            `Company shares retired. Your ownership increased to ${newOwnership.toFixed(1)}%.`
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
                    <Text style={styles.title}>📈 Share Buyback</Text>

                    <Text style={styles.description}>
                        Use company capital to buy back and retire shares, increasing your ownership percentage.
                    </Text>

                    <View style={styles.sliderCard}>
                        <View style={styles.sliderHeader}>
                            <Text style={styles.sliderLabel}>Buyback Amount</Text>
                            <Text style={styles.sliderValue}>{buybackPercentage.toFixed(1)}%</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0.5}
                            maximumValue={10}
                            step={0.5}
                            value={buybackPercentage}
                            onValueChange={setBuybackPercentage}
                            minimumTrackTintColor={theme.colors.success}
                            maximumTrackTintColor={theme.colors.cardSoft}
                            thumbTintColor={theme.colors.success}
                        />
                    </View>

                    <View style={styles.calculationCard}>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Cost (Capital)</Text>
                            <Text style={[styles.calcValue, !isAffordable && { color: theme.colors.danger }]}>
                                -${(cost / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Available Capital</Text>
                            <Text style={styles.calcValue}>${(companyCapital / 1_000_000).toFixed(2)}M</Text>
                        </View>
                        <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>New Ownership</Text>
                            <Text style={[styles.calcValue, { color: theme.colors.success }]}>
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
                            disabled={!isAffordable}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnConfirm,
                                !isAffordable && styles.btnDisabled,
                                pressed && isAffordable && styles.btnPressed,
                            ]}>
                            <Text style={[styles.btnText, { color: '#000' }]}>Confirm Buyback</Text>
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
    btnDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.cardSoft,
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

export default BuybackModal;
