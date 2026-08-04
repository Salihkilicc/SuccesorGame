import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBuybackLogic } from './logic/useBuybackLogic';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney, formatPrice } from '../../../core/utils';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const BuybackModal = ({ visible, onClose }: Props) => {
    useLocale();
    const navigation = useNavigation<any>();
    const {
        buybackPercentage,
        setBuybackPercentage,
        cost,
        newOwnership,
        companyCapital,
        isAffordable,
        currentStockPrice,
        estimatedNewStockPrice,
        handleConfirm
    } = useBuybackLogic(onClose);

    // Stepper handler - clamps between 1% and 100%
    const adjustPercent = (delta: number) => {
        const newValue = buybackPercentage + delta;
        const clampedValue = Math.min(100, Math.max(1, newValue));
        setBuybackPercentage(clampedValue);
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    // VOLUME-WEIGHTED PRICE IMPACT PREDICTION
    // Match the store's formula: Impact = (Percent / 100) * BUYBACK_SENSITIVITY
    const BUYBACK_SENSITIVITY = 1.2;
    const predictedImpact = (buybackPercentage / 100) * BUYBACK_SENSITIVITY;
    const predictedPrice = currentStockPrice * (1 + predictedImpact);


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
                        <Text style={styles.title}>{t('equity.shareBuyback')}</Text>
                        <Text style={styles.subtitle}>{t('equity.retireSharesToIncreaseOwnership')}</Text>

                        {/* Stepper Interface */}
                        <View style={styles.stepperSection}>
                            <Text style={styles.label}>{t('equity.buybackPercentage')}</Text>
                            <View style={styles.stepperContainer}>
                                {/* Decrease Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(-1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={buybackPercentage <= 1}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        buybackPercentage <= 1 && styles.stepperTextDisabled
                                    ]}>
                                        −
                                    </Text>
                                </TouchableOpacity>

                                {/* Display */}
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{buybackPercentage}%</Text>
                                    <Text style={styles.labelSmall}>{t('equity.ofValuation')}</Text>
                                </View>

                                {/* Increase Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={buybackPercentage >= 100}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        buybackPercentage >= 100 && styles.stepperTextDisabled
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
                                onPress={() => setBuybackPercentage(1)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>1%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setBuybackPercentage(5)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>5%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setBuybackPercentage(10)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>10%</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount to Spend Display */}
                        <View style={styles.amountCard}>
                            <Text style={styles.amountLabel}>{t('equity.amountToSpend')}</Text>
                            <Text style={styles.amountValue}>
                                {formatMoney(cost)}
                            </Text>
                        </View>

                        {/* Impact Analysis */}
                        <View style={styles.impactSection}>
                            <View style={styles.impactRow}>
                                <Text style={styles.impactLabel}>📈 Stock Price</Text>
                                <Text style={[styles.impactValue, { color: '#0A84FF' }]}>
                                    {formatPrice(currentStockPrice)} → {formatPrice(estimatedNewStockPrice)}
                                </Text>
                            </View>
                            <View style={styles.impactRow}>
                                <Text style={styles.impactLabel}>⚡ Est. Price Impact</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.impactValue, { color: '#30D158' }]}>
                                        +{(predictedImpact * 100).toFixed(1)}%
                                    </Text>
                                    <Text style={styles.impactSubValue}>{t('equity.targetV1', { v1: formatPrice(predictedPrice) })}</Text>
                                </View>
                            </View>
                            <View style={styles.impactRow}>
                                <Text style={styles.impactLabel}>👤 Your Ownership</Text>
                                <Text style={[styles.impactValue, { color: '#0A84FF' }]}>
                                    {newOwnership.toFixed(2)}%
                                </Text>
                            </View>
                        </View>

                        {/* Cost Summary */}
                        <View style={styles.costSection}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>{t('equity.availableCash')}</Text>
                                <Text style={[
                                    styles.costValue,
                                    { color: isAffordable ? '#30D158' : '#FF453A' }
                                ]}>
                                    {formatMoney(companyCapital)}
                                </Text>
                            </View>
                        </View>

                        {/* Warning */}
                        {!isAffordable && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>⚠️ Insufficient capital</Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>{t('equity.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.executeButton,
                                    !isAffordable && styles.executeButtonDisabled
                                ]}
                                onPress={handleConfirm}
                                disabled={!isAffordable}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.executeButtonText,
                                    !isAffordable && styles.executeButtonTextDisabled
                                ]}>{t('equity.executeBuyback')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}
                <CrystalNavBar activeTab="Company" variant="dark" />
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
        padding: 20, // Moved padding here
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
    amountCard: {
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#0A84FF40',
    },
    amountLabel: {
        fontSize: 13,
        color: '#0A84FF',
        fontWeight: '600',
        marginBottom: 6,
    },
    amountValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0A84FF',
    },
    impactSection: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    impactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    impactLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    impactValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    impactSubValue: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    costSection: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    costLabel: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    costValue: {
        fontSize: 18,
        fontWeight: '700',
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
        fontSize: 14,
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
    executeButton: {
        flex: 1,
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    executeButtonDisabled: {
        backgroundColor: '#2C2C2E',
        opacity: 0.5,
    },
    executeButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    executeButtonTextDisabled: {
        color: '#666',
    },
});

export default BuybackModal;