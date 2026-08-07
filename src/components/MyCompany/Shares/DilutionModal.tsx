import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDilutionLogic } from '../../../features/finance/hooks/useDilutionLogic';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney, formatPrice } from '../../../core/utils';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DilutionModal = ({ visible, onClose }: Props) => {
    useLocale();
    const navigation = useNavigation<any>();
    const {
        dilutionPercentage,
        setDilutionPercentage,
        capitalRaised,
        newOwnership,
        estimatedNewSharePrice,
        currentOwnership,
        handleConfirm
    } = useDilutionLogic(visible, onClose);

    // Stepper handler - clamps between 1% and 49%
    const adjustPercent = (delta: number) => {
        const newValue = dilutionPercentage + delta;
        const clampedValue = Math.min(49, Math.max(1, newValue));
        setDilutionPercentage(clampedValue);
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    // VOLUME-WEIGHTED PRICE IMPACT PREDICTION
    // Match the store's formula: Impact = (Percent / 100) * DILUTION_SENSITIVITY
    const DILUTION_SENSITIVITY = 1.5;
    const predictedDrop = (dilutionPercentage / 100) * DILUTION_SENSITIVITY;
    const currentStockPrice = estimatedNewSharePrice / (1 - predictedDrop); // Reverse calculate current price
    const predictedPrice = currentStockPrice * (1 - predictedDrop);

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
                        <Text style={styles.title}>{t('equity.issueShares')}</Text>
                        <Text style={styles.subtitle}>{t('equity.raiseCapitalByDilutingOwnership')}</Text>

                        {/* Warning Banner */}
                        <View style={styles.warningBanner}>
                            <Text style={styles.warningBannerText}>
                                ⚡ This will dilute your ownership and impact stock price
                            </Text>
                        </View>

                        {/* Stepper Interface */}
                        <View style={styles.stepperSection}>
                            <Text style={styles.label}>{t('equity.selectDilutionPercentage')}</Text>
                            <View style={styles.stepperContainer}>
                                {/* Decrease Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(-1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={dilutionPercentage <= 1}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        dilutionPercentage <= 1 && styles.stepperTextDisabled
                                    ]}>
                                        −
                                    </Text>
                                </TouchableOpacity>

                                {/* Display */}
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{dilutionPercentage}%</Text>
                                    <Text style={styles.labelSmall}>{t('equity.equity')}</Text>
                                </View>

                                {/* Increase Button */}
                                <TouchableOpacity
                                    onPress={() => adjustPercent(1)}
                                    style={styles.stepperBtn}
                                    activeOpacity={0.7}
                                    disabled={dilutionPercentage >= 49}
                                >
                                    <Text style={[
                                        styles.stepperText,
                                        dilutionPercentage >= 49 && styles.stepperTextDisabled
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
                                onPress={() => setDilutionPercentage(5)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>5%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setDilutionPercentage(10)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>10%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.presetButton}
                                onPress={() => setDilutionPercentage(20)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.presetButtonText}>20%</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Impact Analysis */}
                        <View style={styles.impactSection}>
                            <View style={styles.impactRow}>
                                <Text style={styles.impactLabel}>💵 Cash Raised</Text>
                                <Text style={[styles.impactValue, { color: '#5FB37A' }]}>
                                    +{formatMoney(capitalRaised)}
                                </Text>
                            </View>
                            <View style={styles.impactRow}>
                                <Text style={styles.impactLabel}>👤 Your Ownership</Text>
                                <Text style={[
                                    styles.impactValue,
                                    { color: newOwnership < 50 ? '#E06B6B' : '#E3A857' }
                                ]}>
                                    {currentOwnership.toFixed(1)}% → {newOwnership.toFixed(1)}%
                                </Text>
                            </View>
                        </View>

                        {/* Stock Price Warning */}
                        <View style={styles.stockWarningBox}>
                            <Text style={styles.stockWarningIcon}>📉</Text>
                            <View style={styles.stockWarningContent}>
                                <Text style={styles.stockWarningTitle}>{t('equity.stockPriceImpact')}</Text>
                                <Text style={styles.stockWarningText}>
                                    Est. Price Drop: <Text style={{ color: '#E06B6B', fontWeight: '700' }}>
                                        -{(predictedDrop * 100).toFixed(1)}%
                                    </Text>
                                </Text>
                                <Text style={styles.stockWarningValue}>{t('equity.newPriceV1', { v1: formatPrice(predictedPrice) })}</Text>
                            </View>
                        </View>

                        {/* Critical Warning */}
                        {newOwnership < 50 && (
                            <View style={styles.criticalBox}>
                                <Text style={styles.criticalText}>⚠️ You will lose majority control</Text>
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
                                style={styles.authorizeButton}
                                onPress={handleConfirm}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.authorizeButtonText}>{t('equity.authorizeDilution')}</Text>
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
        padding: 20,
    },
    card: {
        backgroundColor: '#0F0E0D',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        marginBottom: 80, // Space for Bottom Bar
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#EDE8E4',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8A807B',
        marginBottom: 16,
    },
    warningBanner: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E3A85740',
    },
    warningBannerText: {
        fontSize: 13,
        color: '#E3A857',
        fontWeight: '600',
        textAlign: 'center',
    },
    stepperSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#EDE8E4',
        fontWeight: '600',
        marginBottom: 12,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0E0D',
        borderRadius: 16,
        padding: 8,
        justifyContent: 'space-between',
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#201D1C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#EDE8E4',
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
        color: '#EDE8E4',
        marginBottom: 2,
    },
    labelSmall: {
        fontSize: 11,
        color: '#8A807B',
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
        backgroundColor: '#0F0E0D',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#201D1C',
    },
    presetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8A807B',
    },
    impactSection: {
        backgroundColor: '#0F0E0D',
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
        color: '#EDE8E4',
        fontWeight: '500',
    },
    impactValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    stockWarningBox: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E3A857',
        flexDirection: 'row',
        gap: 12,
    },
    stockWarningIcon: {
        fontSize: 24,
    },
    stockWarningContent: {
        flex: 1,
    },
    stockWarningTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E3A857',
        marginBottom: 4,
    },
    stockWarningText: {
        fontSize: 13,
        color: '#EDE8E4',
        marginBottom: 6,
    },
    stockWarningValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E3A857',
    },
    criticalBox: {
        backgroundColor: '#E06B6B20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E06B6B40',
    },
    criticalText: {
        fontSize: 14,
        color: '#E06B6B',
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#0F0E0D',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#EDE8E4',
    },
    authorizeButton: {
        flex: 1,
        backgroundColor: '#E3A857',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    authorizeButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F0E0D',
    },
});

export default DilutionModal;