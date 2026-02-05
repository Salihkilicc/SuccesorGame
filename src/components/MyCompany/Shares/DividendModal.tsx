import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDividendLogic } from '../../../features/finance/hooks/useDividendLogic';
import BottomStatsBar from '../../common/BottomStatsBar';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DividendModal = ({ visible, onClose }: Props) => {
    const navigation = useNavigation<any>();
    const {
        dividendPercentage,
        setDividendPercentage,
        availableCash,
        distributionAmount,
        playerDividend,
        remainingCapital,
        playerSharePercentage,
        isRisky,
        handleConfirm
    } = useDividendLogic(visible, onClose);

    // Stepper handler - clamps between 1% and 50%
    const adjustPercent = (delta: number) => {
        const newValue = dividendPercentage + delta;
        const clampedValue = Math.min(50, Math.max(1, newValue));
        setDividendPercentage(clampedValue);
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.centeredView}>
                    <View style={styles.card}>
                        {/* Header */}
                        <Text style={styles.title}>Distribute Dividends</Text>
                        <Text style={styles.subtitle}>Reward shareholders with profits</Text>

                        {/* Available Cash */}
                        <View style={styles.cashCard}>
                            <Text style={styles.cashLabel}>Available Company Cash</Text>
                            <Text style={styles.cashValue}>
                                ${(availableCash / 1_000_000).toFixed(2)}M
                            </Text>
                        </View>

                        {/* Stepper Interface */}
                        <View style={styles.stepperSection}>
                            <Text style={styles.label}>Distribution Percentage</Text>
                            <View style={styles.stepperContainer}>
                                {/* Decrease Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(-1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={dividendPercentage <= 1}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        dividendPercentage <= 1 && styles.stepperTextDisabled
                                    ]}>
                                        −
                                    </Text>
                                </TouchableOpacity>

                                {/* Display */}
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{dividendPercentage}%</Text>
                                    <Text style={styles.labelSmall}>OF CASH RESERVES</Text>
                                </View>

                                {/* Increase Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={dividendPercentage >= 50}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        dividendPercentage >= 50 && styles.stepperTextDisabled
                                    ]}>
                                        +
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Quick Presets */}
                        <View style={styles.presetsRow}>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setDividendPercentage(10)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>10%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setDividendPercentage(25)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>25%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setDividendPercentage(50)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>50%</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Distribution Info Display */}
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Total Payout</Text>
                                <Text style={styles.infoValue}>
                                    ${(distributionAmount / 1_000_000).toFixed(2)}M
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>
                                    Dividend Per Share
                                </Text>
                                <Text style={styles.infoValue}>
                                    ${(distributionAmount / 1_000_000).toFixed(4)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Remaining Capital</Text>
                                <Text style={[
                                    styles.infoValue,
                                    { color: isRisky ? '#FF453A' : '#FFFFFF' }
                                ]}>
                                    ${(remainingCapital / 1_000_000).toFixed(2)}M
                                </Text>
                            </View>
                        </View>

                        {/* You Receive Highlight */}
                        <View style={styles.profitHighlight}>
                            <Text style={styles.profitLabel}>💰 You Receive</Text>
                            <Text style={styles.profitAmount}>
                                ${(playerDividend / 1_000_000).toFixed(2)}M
                            </Text>
                            <Text style={styles.profitNote}>
                                Based on your {playerSharePercentage.toFixed(1)}% ownership
                            </Text>
                            <View style={styles.profitBadge}>
                                <Text style={styles.profitBadgeText}>Added to personal wallet</Text>
                            </View>
                        </View>

                        {/* Risk Warning */}
                        {isRisky && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    ⚠️ High distribution risk - low capital reserves
                                </Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.distributeButton}
                                onPress={handleConfirm}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.distributeButtonText}>Distribute Profits</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
                <BottomStatsBar onHomePress={handleHomePress} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        // No padding here
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        marginBottom: 80, // Space for Bottom Bar
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    cashCard: {
        backgroundColor: 'rgba(48, 209, 88, 0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#30D15840',
    },
    cashLabel: {
        fontSize: 13,
        color: '#30D158',
        fontWeight: '600',
        marginBottom: 6,
    },
    cashValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#30D158',
    },
    stepperSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 12,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        padding: 8,
        justifyContent: 'space-between',
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3A3A3C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepperTextDisabled: {
        color: '#666',
    },
    valueContainer: {
        alignItems: 'center',
        flex: 1,
    },
    valueText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    labelSmall: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
        letterSpacing: 1,
    },
    presetsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    presetButton: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    presetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    infoSection: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    infoLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 0,
    },
    divider: {
        height: 1,
        backgroundColor: '#3A3A3C',
        marginVertical: 8,
    },
    profitHighlight: {
        backgroundColor: 'rgba(48, 209, 88, 0.2)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#30D158',
    },
    profitLabel: {
        fontSize: 14,
        color: '#30D158',
        fontWeight: '600',
        marginBottom: 8,
    },
    profitAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#30D158',
        marginBottom: 6,
    },
    profitNote: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 12,
    },
    profitBadge: {
        backgroundColor: '#30D158',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    profitBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
    },
    warningBox: {
        backgroundColor: '#FF453A20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FF453A40',
    },
    warningText: {
        fontSize: 13,
        color: '#FF453A',
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    distributeButton: {
        flex: 1,
        backgroundColor: '#30D158',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    distributeButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
});

export default DividendModal;