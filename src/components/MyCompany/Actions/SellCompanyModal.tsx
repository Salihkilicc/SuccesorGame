import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, Pressable, Alert, ToastAndroid, Platform } from 'react-native';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { quoteDivestiture, DIVESTITURE_DISCOUNT_MAX } from '../../../core/market/mergers';
import { formatMoney as formatMoneyExact } from '../../../core/utils';
import { theme } from '../../../core/theme';

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

    // ----------------------------------------------------------------------
    //  THE SAME QUOTE THE STORE WILL USE
    // ----------------------------------------------------------------------
    //  This screen priced everything off `company.valuation`, which is WHAT
    //  YOU PAID - premium included - while the rest of the game exits at a
    //  fair value derived from the target's own earnings, less a commission.
    //  So the screen offered a round trip at cost and the store paid it.
    //
    //  Both now read `quoteDivestiture`. See core/market/mergers.ts.
    // ----------------------------------------------------------------------
    // The live valuation, so the screen quotes what the player has been
    // growing rather than what the target earned on the day it was bought.
    const quote = company?.deal
        ? quoteDivestiture(company.deal, company.valuation)
        : undefined;
    const fairValue = quote ? quote.currentFairValue : (company?.valuation ?? 0);
    const commission = quote ? quote.discount : DIVESTITURE_DISCOUNT_MAX;
    const locked = !!quote?.locked;

    useEffect(() => {
        if (company) {
            setAskingPrice(Math.round(fairValue));
        }
    }, [company, visible, fairValue]);

    if (!company) return null;

    const currentValuation = fairValue;
    const markup = currentValuation > 0 ? (askingPrice - currentValuation) / currentValuation : 1;
    /** What actually lands in the company account if they say yes. */
    const netProceeds = Math.max(0, askingPrice * (1 - commission));

    // Probability Formula: 0.80 - (markup * 2.0)
    // Clamped between 0 and 1 for calculation
    const rawChance = 0.80 - (markup * 2.0);
    const successChance = Math.max(0, rawChance) * 100;

    // A LIKELIHOOD, NOT A RESULT. All three tiers used to be painted in
    // the loss red (two of them literally the same hex, with comments
    // claiming "Green" and "Yellow"), which said the sale had already gone
    // wrong before it was attempted. A poor chance is not money leaving -
    // it is simply nothing good, which is what grey means now.
    // Typed wide on purpose: `theme` is `as const`, so inferring from the
    // first assignment would pin this to that one literal hex.
    let chanceColor: string = theme.colors.down;
    if (successChance >= 70) chanceColor = theme.colors.up;
    else if (successChance >= 40) chanceColor = theme.colors.textSecondary;

    const formatMoney = (amount: number) => {
        return formatMoneyExact(amount);
    };

    const handlePriceChange = (amount: number) => {
        setAskingPrice(prev => Math.max(0, prev + amount));
    };

    const handleSubmit = () => {
        const result = attemptToSellCompany(company.id, askingPrice);

        if (result.success) {
            // WHAT LANDED, not what was agreed. The store returns the net and
            // this used to announce the asking price, so the figure in the
            // alert and the figure in the account were different numbers.
            const got = result.price ?? netProceeds;
            if (Platform.OS === 'android') {
                ToastAndroid.show(`Sold for ${formatMoney(got)}!`, ToastAndroid.LONG);
            } else {
                Alert.alert(
                    t('alert.offerAccepted'),
                    t('company.soldFor', { name: company.name, amount: formatMoney(got) }),
                );
            }
            onClose();
        } else {
            // Failure Logic
            Alert.alert(
                t('alert.dealFellThrough'),
                result.msg || t('company.buyersWalkedAway'),
                [{ text: t('ui.ok'), onPress: onClose }]
            );
        }
    };

    return (
        <Modal statusBarTranslucent navigationBarTranslucent
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
                        {/* THE TWO NUMBERS THAT WERE NOT HERE. A commission
                            the player only meets in their bank balance is the
                            same defect as a price the screen does not charge. */}
                        {locked ? (
                            <Text style={styles.lockNote}>
                                {t('action.saleLocked', { v1: quote!.quartersLeft })}
                            </Text>
                        ) : (
                            <Text style={styles.commissionNote}>
                                {t('action.saleCommission', {
                                    v1: Math.round(commission * 100),
                                    v2: formatMoney(netProceeds),
                                })}
                            </Text>
                        )}
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
                            {markup > 0 ? t('company.markup', { percent: (markup * 100).toFixed(1) }) : t('acq.fairValue')}
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
                            disabled={locked}
                            style={({ pressed }) => [
                                styles.submitBtn,
                                pressed && styles.btnPressed,
                                locked && styles.submitBtnOff,
                            ]}
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
        backgroundColor: 'rgba(28,36,44,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        backgroundColor: '#1C242C', // Dark Gray
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#434B50',
        padding: 12,
        borderRadius: 12,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
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
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#323A40',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    incrementBtn: {
        backgroundColor: '#323A40', // Keep uniform dark, maybe blue tint? Sticking to dark.
        borderColor: 'rgba(255,255,255,0.06)', // Green border for positive
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
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
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
        color: '#FFFFFF',
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
        backgroundColor: '#323A40',
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
        backgroundColor: '#323A40',
        alignItems: 'center',
    },
    submitBtnText: {
        color: theme.colors.textPrimary,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    /** Dimmed rather than recoloured: the label does not change colour with it. */
    submitBtnOff: { opacity: 0.4 },
    commissionNote: {
        marginTop: 6,
        color: theme.colors.textMuted,
        fontSize: 11,
        lineHeight: 15,
        textAlign: 'center',
    },
    lockNote: {
        marginTop: 6,
        color: theme.colors.warning,
        fontSize: 11.5,
        lineHeight: 16,
        textAlign: 'center',
    },
});
