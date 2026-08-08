import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDividendLogic } from '../../../features/finance/hooks/useDividendLogic';
import { formatMoney, formatPrice } from '../../../core/utils';
import { DIVIDEND_TAX } from '../../../core/market/equity';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { theme } from '../../../core/theme';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const DividendModal = ({ visible, onClose }: Props) => {
    // Dil degisince yeniden ciz. Bu satir olmadan ekran eski dilde donar.
    useLocale();
    const navigation = useNavigation<any>();
    // Hisse basi temettu hesabi icin gercek hisse sayisi gerekli.
    const totalShares = useShareholderStore(state => state.totalShares);
    const {
        dividendPercentage,
        setDividendPercentage,
        availableCash,
        distributionAmount,
        playerDividend,
        remainingCapital,
        playerSharePercentage,
        isRisky,
        lastQuarterProfit,
        perShare,
        annualYieldPercent,
        fundedFromReserves,
        affordable,
        handleConfirm
    } = useDividendLogic(visible, onClose);

    // Stepper handler - clamps between 1% and 50%
    // Dagitim orani %0-100: karin ne kadarini dagittigin.
    // Eskiden %1-50 idi ama o NAKDIN yuzdesiydi, tamamen baska bir sey.
    const adjustPercent = (delta: number) => {
        const newValue = dividendPercentage + delta;
        setDividendPercentage(Math.min(100, Math.max(0, newValue)));
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
                {/* ------------------------------------------------------------
                    KAYDIRMA + HER ZAMAN ERISILEBILIR CIKIS
                    ------------------------------------------------------------
                    Bu ekran sabit yukseklikli bir View'daydi ve icerik ekrandan
                    tasiyordu: ne kaydirilabiliyor ne de alttaki iptal dugmesine
                    ulasilabiliyordu. BorrowModal'da da ayni sey olmustu.

                    Cozum ayni: govde ScrollView, cikis dugmesi govdenin DISINDA.
                   ------------------------------------------------------------ */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.centeredView} pointerEvents="box-none">
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{t('dividend.title')}</Text>
                                <Text style={styles.subtitle}>{t('dividend.subtitle')}</Text>
                            </View>
                            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            showsVerticalScrollIndicator
                        >

                        {/* Kar — temettunun kaynagi. Nakit degil. */}
                        <View style={styles.cashCard}>
                            <Text style={styles.cashLabel}>{t('dividend.lastQuarterProfit')}</Text>
                            <Text style={[
                                styles.cashValue,
                                lastQuarterProfit <= 0 && { color: theme.colors.textPrimary },
                            ]}>
                                {formatMoney(lastQuarterProfit)}
                            </Text>
                            <Text style={styles.cashHint}>{t('equity.cashOnHandV1', { v1: formatMoney(availableCash) })}</Text>
                        </View>

                        {fundedFromReserves && (
                            <View style={styles.flagBox}>
                                <Text style={styles.flagText}>
                                    You did not make a profit last quarter. Paying a dividend now
                                    means paying out of reserves — investors read that as a company
                                    buying goodwill it cannot afford.
                                </Text>
                            </View>
                        )}

                        {/* Stepper Interface */}
                        <View style={styles.stepperSection}>
                            <Text style={styles.label}>{t('dividend.payoutRatio')}</Text>
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
                                    <Text style={styles.labelSmall}>{t('dividend.ofCashReserves')}</Text>
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
                                <Text style={styles.infoLabel}>{t('dividend.totalPayout')}</Text>
                                <Text style={styles.infoValue}>
                                    {formatMoney(distributionAmount)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('equity.dividendPerShare')}</Text>
                                {/* HATA DUZELTMESI: eskiden sabit 1.000.000'a bolunuyordu.
                                    Toplam hisse 10.000.000 oldugu icin hisse basi temettu
                                    10 KAT fazla gorunuyordu. Artik gercek hisse sayisina bolunuyor.
                                    Kaynak: features/shareholders/stores/useShareholderStore.ts (TOTAL_SHARES) */}
                                <Text style={styles.infoValue}>{formatPrice(perShare)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('dividend.remainingCapital')}</Text>
                                <Text style={[
                                    styles.infoValue,
                                    { color: isRisky ? '#FF8A8A' : '#FFFFFF' }
                                ]}>
                                    {formatMoney(remainingCapital)}
                                </Text>
                            </View>

                            {/* Getiri — yatirimcinin gercekten baktigi sayi */}
                            <View style={styles.yieldRow}>
                                <Text style={styles.yieldLabel}>{t('dividend.annualYield')}</Text>
                                <Text style={styles.yieldValue}>
                                    {annualYieldPercent.toFixed(2)}%
                                </Text>
                            </View>
                        </View>

                        {/* You Receive Highlight */}
                        <View style={styles.profitHighlight}>
                            <Text style={styles.profitLabel}>💰 You Receive</Text>
                            <Text style={styles.profitAmount}>
                                {formatMoney(playerDividend * (1 - DIVIDEND_TAX))}
                            </Text>
                            <Text style={styles.profitNote}>{t('equity.basedOnYourV1Ownership', { v1: playerSharePercentage.toFixed(1) })}</Text>
                            <View style={styles.profitBadge}>
                                <Text style={styles.profitBadgeText}>{t('dividend.addedToWallet')}</Text>
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

                        </ScrollView>

                        {/* Buttons — ScrollView DISINDA, her zaman gorunur */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.distributeButton}
                                onPress={handleConfirm}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.distributeButtonText}>{t('dividend.distribute')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Persistent Bottom Bar */}            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    cashHint: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginTop: 4 },
    flagBox: {
        backgroundColor: 'rgba(5,168,246,0.10)', borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(5,168,246,0.30)',
        padding: 12, marginBottom: 12,
    },
    flagText: { color: theme.colors.textPrimary, fontSize: 11.5, lineHeight: 16 },
    yieldRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
        marginTop: 8,
    },
    yieldLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 11.5 },
    yieldValue: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.85)',
        // No padding here
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#434B50',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        // Ekranin en fazla %80'i; gerisi kaydirilir.
        maxHeight: '80%',
        marginBottom: 80, // Space for Bottom Bar
    },
    body: { flexGrow: 0, flexShrink: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#323A40', alignItems: 'center', justifyContent: 'center',
    },
    closeText: { color: 'rgba(255,255,255,0.48)', fontSize: 16, fontWeight: '700' },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 16,
    },
    cashCard: {
        backgroundColor: 'rgba(207,208,210,0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#CFD0D240',
    },
    cashLabel: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 6,
    },
    cashValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
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
        backgroundColor: '#434B50',
        borderRadius: 16,
        padding: 8,
        justifyContent: 'space-between',
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepperTextDisabled: {
        color: '#FFFFFF',
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
        color: 'rgba(255,255,255,0.48)',
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
        backgroundColor: '#434B50',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    presetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.48)',
    },
    infoSection: {
        backgroundColor: '#434B50',
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
        color: 'rgba(255,255,255,0.48)',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 0,
    },
    divider: {
        height: 1,
        backgroundColor: '#434B50',
        marginVertical: 8,
    },
    profitHighlight: {
        backgroundColor: 'rgba(207,208,210,0.2)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    profitLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 8,
    },
    profitAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    profitNote: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        marginBottom: 12,
    },
    profitBadge: {
        backgroundColor: '#CFD0D2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    profitBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.onLight,
    },
    warningBox: {
        backgroundColor: '#FF8A8A20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FF8A8A40',
    },
    warningText: {
        fontSize: 13,
        color: theme.colors.warning,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#434B50',
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
        backgroundColor: '#CFD0D2',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    distributeButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.onLight,
    },
});

export default DividendModal;