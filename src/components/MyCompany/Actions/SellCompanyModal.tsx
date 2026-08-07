import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, Pressable, Alert, ToastAndroid, Platform } from 'react-native';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatMoney as formatMoneyExact } from '../../../core/utils';

type Props = {
    visible: boolean;
    companyId: string;
    onClose: () => void;
};

const SellCompanyModal = ({ visible, companyId, onClose }: Props) => {
    useLocale();
    const { subsidiaries, attemptToSellCompany } = useCorporateFinanceStore();
    const company = subsidiaries.find(c => c.id === companyId);

    // Default to valuation if company exists, otherwise 0
    const [askingPrice, setAskingPrice] = useState(0);

    useEffect(() => {
        if (company) {
            setAskingPrice(company.valuation);
        }
    }, [company, visible]);

    if (!company) return null;

    const currentValuation = company.valuation;
    const markup = (askingPrice - currentValuation) / currentValuation;

    // Probability Formula: 0.80 - (markup * 2.0)
    // Clamped between 0 and 1 for calculation
    const rawChance = 0.80 - (markup * 2.0);
    const successChance = Math.max(0, rawChance) * 100;

    // Color Logic
    let chanceColor = '#E06B6B'; // Red (< 40%)
    if (successChance >= 70) chanceColor = '#5FB37A'; // Green
    else if (successChance >= 40) chanceColor = '#E3A857'; // Yellow

    const formatMoney = (amount: number) => {
        return formatMoneyExact(amount);
    };

    const handlePriceChange = (amount: number) => {
        setAskingPrice(prev => Math.max(0, prev + amount));
    };

    const handleSubmit = () => {
        const result = attemptToSellCompany(company.id, askingPrice);

        if (result.success) {
            // Success Logic
            if (Platform.OS === 'android') {
                ToastAndroid.show(`Sold for ${formatMoney(askingPrice)}!`, ToastAndroid.LONG);
            } else {
                Alert.alert(t('alert.offerAccepted'), `You successfully sold ${company.name} for ${formatMoney(askingPrice)}.`);
            }
            onClose();
        } else {
            // Failure Logic
            Alert.alert(
                t('alert.dealFellThrough'),
                result.msg || "Buyers walked away.",
                [{ text: 'OK', onPress: onClose }]
            );
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('action.negotiateSale')}</Text>
                        <Text style={styles.headerSubtitle}>{company.name}</Text>
                    </View>

                    {/* Valuation Display */}
                    <View style={styles.valuationContainer}>
                        <Text style={styles.label}>{t('action.currentValuation')}</Text>
                        <Text style={styles.valuationValue}>{formatMoney(currentValuation)}</Text>
                    </View>

                    {/* Asking Price Controls */}
                    <View style={styles.priceSection}>
                        <View style={styles.controlsRow}>
                            <View style={styles.buttonGroup}>
                                <Pressable
                                    style={({ pressed }) => [styles.controlBtn, pressed && styles.btnPressed]}
                                    onPress={() => handlePriceChange(-(currentValuation * 0.01))}
                                >
                                    <Text style={styles.controlBtnText}>- 1%</Text>
                                </Pressable>
                            </View>

                            <Text style={styles.askingPrice}>{formatMoney(askingPrice)}</Text>

                            <View style={styles.buttonGroup}>
                                <Pressable
                                    style={({ pressed }) => [styles.controlBtn, styles.incrementBtn, pressed && styles.btnPressed]}
                                    onPress={() => handlePriceChange(currentValuation * 0.01)}
                                >
                                    <Text style={styles.controlBtnText}>+ 1%</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Probability Meter */}
                    <View style={[styles.probabilityBox, { borderColor: chanceColor }]}>
                        <Text style={[styles.probabilityLabel, { color: chanceColor }]}>{t('action.probabilityOfSale')}</Text>
                        <Text style={[styles.probabilityValue, { color: chanceColor }]}>
                            {successChance.toFixed(0)}%
                        </Text>
                        <Text style={styles.markupText}>
                            {markup > 0 ? `+${(markup * 100).toFixed(1)}% Markup` : 'Fair Value'}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionButtons}>
                        <Pressable
                            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>{t('action.cancel')}</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitBtnText}>{t('action.submitOffer')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default SellCompanyModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        backgroundColor: '#31241F', // Dark Gray
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#3C2D29',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#3C2D29',
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#B28C96',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    valuationContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 12,
    },
    label: {
        fontSize: 12,
        color: '#B28C96',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    valuationValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    priceSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#B28C96',
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    askingPrice: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginHorizontal: 16,
        letterSpacing: -1,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    controlBtn: {
        backgroundColor: '#3C2D29',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#523F3E',
    },
    incrementBtn: {
        backgroundColor: '#3C2D29', // Keep uniform dark, maybe blue tint? Sticking to dark.
        borderColor: '#5FB37A', // Green border for positive
    },
    controlBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    btnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },
    probabilityBox: {
        backgroundColor: '#000000',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        alignItems: 'center',
        marginBottom: 24,
    },
    probabilityLabel: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    probabilityValue: {
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 4,
    },
    markupText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#3C2D29',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    submitBtn: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#000000',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
});
