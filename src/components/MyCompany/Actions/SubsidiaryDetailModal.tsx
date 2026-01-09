import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { theme } from '../../../core/theme';
import { SubsidiaryState } from '../../../core/store/useStatsStore';
import { useStatsStore } from '../../../core/store';

type Props = {
    visible: boolean;
    onClose: () => void;
    subsidiary: SubsidiaryState | null;
};

const formatMoney = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
};

const SubsidiaryDetailModal = ({ visible, onClose, subsidiary }: Props) => {
    const { companyCapital, setField, subsidiaryStates, update } = useStatsStore();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!subsidiary) return null;

    const isHealthy = !subsidiary.isLossMaking;
    const restructureCost = subsidiary.marketCap * 0.1;
    const sellValue = subsidiary.marketCap * 0.5;

    const handleRestructure = () => {
        if (companyCapital < restructureCost) {
            Alert.alert('Insufficient Funds', `You need $${(restructureCost / 1e9).toFixed(2)}B to restructure this company.`);
            return;
        }

        Alert.alert(
            'Confirm Restructuring',
            `Inject $${(restructureCost / 1e9).toFixed(2)}B to fix ${subsidiary.name}?\n\nThis will restore profitability immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restructure',
                    style: 'destructive',
                    onPress: () => {
                        setIsProcessing(true);

                        // Deduct cost
                        setField('companyCapital', companyCapital - restructureCost);

                        // Fix subsidiary
                        const updatedSub: SubsidiaryState = {
                            ...subsidiary,
                            isLossMaking: false,
                            currentProfit: subsidiary.baseProfit,
                        };

                        update({
                            subsidiaryStates: {
                                ...subsidiaryStates,
                                [subsidiary.id]: updatedSub,
                            },
                        });

                        setTimeout(() => {
                            setIsProcessing(false);
                            Alert.alert('Success!', `${subsidiary.name} has been restructured and is now profitable.`);
                            onClose();
                        }, 500);
                    },
                },
            ]
        );
    };

    const handleSell = () => {
        Alert.alert(
            'Confirm Fire Sale',
            `Sell ${subsidiary.name} for $${(sellValue / 1e9).toFixed(2)}B?\n\nThis is 50% of its market value. The company will be removed from your portfolio.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell',
                    style: 'destructive',
                    onPress: () => {
                        setIsProcessing(true);

                        // Add cash
                        setField('companyCapital', companyCapital + sellValue);

                        // Remove subsidiary
                        const { [subsidiary.id]: removed, ...remainingSubsidiaries } = subsidiaryStates;
                        const remainingAcquisitions = useStatsStore.getState().acquisitions.filter(id => id !== subsidiary.id);

                        update({
                            acquisitions: remainingAcquisitions,
                            subsidiaryStates: remainingSubsidiaries,
                        });

                        setTimeout(() => {
                            setIsProcessing(false);
                            Alert.alert('Sold', `${subsidiary.name} has been sold for $${(sellValue / 1e9).toFixed(2)}B.`);
                            onClose();
                        }, 500);
                    },
                },
            ]
        );
    };

    const handleInvest = () => {
        const investmentCost = subsidiary.marketCap * 0.1;

        if (companyCapital < investmentCost) {
            Alert.alert('Insufficient Funds', `You need ${formatMoney(investmentCost)} to invest in this company.`);
            return;
        }

        Alert.alert(
            'Confirm Investment',
            `Invest ${formatMoney(investmentCost)} to boost ${subsidiary.name}'s annual profit by 3%?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Invest',
                    onPress: () => {
                        setIsProcessing(true);

                        // Deduct investment cost
                        setField('companyCapital', companyCapital - investmentCost);

                        // Increase base profit by 3%
                        const newBaseProfit = subsidiary.baseProfit * 1.03;
                        const updatedSub: SubsidiaryState = {
                            ...subsidiary,
                            baseProfit: newBaseProfit,
                            currentProfit: subsidiary.isLossMaking ? subsidiary.currentProfit : newBaseProfit,
                        };

                        update({
                            subsidiaryStates: {
                                ...subsidiaryStates,
                                [subsidiary.id]: updatedSub,
                            },
                        });

                        setTimeout(() => {
                            setIsProcessing(false);
                            Alert.alert('Investment Complete', `${subsidiary.name}'s profit has been increased by 3%!`);
                            onClose();
                        }, 500);
                    },
                },
            ]
        );
    };

    const calculateSalePrice = () => {
        const initialProfit = subsidiary.baseProfit;
        const currentProfit = subsidiary.currentProfit;

        // Calculate profit change ratio
        const profitChangeRatio = currentProfit / initialProfit;

        // Sale price = Initial purchase price + (Initial price * profit change)
        const salePrice = subsidiary.initialPurchasePrice + (subsidiary.initialPurchasePrice * (profitChangeRatio - 1));

        return Math.max(0, salePrice); // Ensure non-negative
    };

    const handleSellCompany = () => {
        const salePrice = calculateSalePrice();
        const profitLoss = salePrice - subsidiary.initialPurchasePrice;
        const isProfitable = profitLoss > 0;

        Alert.alert(
            'Confirm Sale',
            `Sell ${subsidiary.name} for ${formatMoney(salePrice)}?\n\n` +
            `Purchase Price: ${formatMoney(subsidiary.initialPurchasePrice)}\n` +
            `${isProfitable ? 'Profit' : 'Loss'}: ${formatMoney(Math.abs(profitLoss))}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell',
                    style: isProfitable ? 'default' : 'destructive',
                    onPress: () => {
                        setIsProcessing(true);

                        // Add sale proceeds
                        setField('companyCapital', companyCapital + salePrice);

                        // Remove subsidiary
                        const { [subsidiary.id]: removed, ...remainingSubsidiaries } = subsidiaryStates;
                        const remainingAcquisitions = useStatsStore.getState().acquisitions.filter(id => id !== subsidiary.id);

                        update({
                            acquisitions: remainingAcquisitions,
                            subsidiaryStates: remainingSubsidiaries,
                        });

                        setTimeout(() => {
                            setIsProcessing(false);
                            Alert.alert(
                                'Company Sold',
                                `${subsidiary.name} sold for ${formatMoney(salePrice)}.\n` +
                                `${isProfitable ? 'Profit' : 'Loss'}: ${formatMoney(Math.abs(profitLoss))}`
                            );
                            onClose();
                        }, 500);
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{subsidiary.name}</Text>
                        <Pressable onPress={onClose}>
                            <Text style={styles.closeText}>×</Text>
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                        {/* Status Indicator */}
                        <View style={[styles.statusCard, isHealthy ? styles.statusHealthy : styles.statusCritical]}>
                            <Text style={styles.statusLabel}>STATUS</Text>
                            <Text style={[styles.statusValue, isHealthy ? styles.statusTextHealthy : styles.statusTextCritical]}>
                                {isHealthy ? '🟢 Healthy' : '🔻 CRITICAL LOSS'}
                            </Text>
                            {!isHealthy && (
                                <Text style={styles.warningText}>
                                    ⚠️ This company is draining {formatMoney(Math.abs(subsidiary.currentProfit))} from your cash reserves every month!
                                </Text>
                            )}
                        </View>

                        {/* Financial Metrics */}
                        <View style={styles.metricsCard}>
                            <Text style={styles.sectionTitle}>FINANCIAL OVERVIEW</Text>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Market Cap</Text>
                                <Text style={styles.metricValue}>{formatMoney(subsidiary.marketCap)}</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Purchase Price</Text>
                                <Text style={styles.metricValue}>{formatMoney(subsidiary.initialPurchasePrice)}</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Base Profit (Annual)</Text>
                                <Text style={styles.metricValue}>{formatMoney(subsidiary.baseProfit)}</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Current Profit (Monthly)</Text>
                                <Text style={[styles.metricValue, subsidiary.currentProfit < 0 && { color: theme.colors.danger }]}>
                                    {formatMoney(subsidiary.currentProfit / 12)}
                                </Text>
                            </View>
                        </View>

                        {/* Investment Actions */}
                        <View style={styles.investmentActions}>
                            <Pressable
                                style={({ pressed }) => [styles.investButton, pressed && styles.buttonPressed]}
                                onPress={handleInvest}
                                disabled={isProcessing}
                            >
                                <Text style={styles.investButtonText}>💰 Invest</Text>
                                <Text style={styles.investButtonDesc}>Pay {formatMoney(subsidiary.marketCap * 0.1)} to boost profit by 3%</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [styles.sellButton, pressed && styles.buttonPressed]}
                                onPress={handleSellCompany}
                                disabled={isProcessing}
                            >
                                <Text style={styles.sellButtonText}>💸 Sell Company</Text>
                                <Text style={styles.sellButtonDesc}>Receive {formatMoney(calculateSalePrice())}</Text>
                            </Pressable>
                        </View>

                        {/* Action Buttons */}
                        {!isHealthy && (
                            <View style={styles.actionsCard}>
                                <Text style={styles.sectionTitle}>MANAGEMENT OPTIONS</Text>

                                {/* Restructure */}
                                <Pressable
                                    style={({ pressed }) => [styles.actionButton, styles.actionRestructure, pressed && styles.actionPressed]}
                                    onPress={handleRestructure}
                                    disabled={isProcessing}
                                >
                                    <View style={styles.actionHeader}>
                                        <Text style={styles.actionIcon}>🛠️</Text>
                                        <Text style={styles.actionTitle}>Restructure / Inject Capital</Text>
                                    </View>
                                    <Text style={styles.actionDesc}>
                                        Cost: {formatMoney(restructureCost)} (10% of market cap)
                                    </Text>
                                    <Text style={styles.actionResult}>✅ 100% chance to restore profitability</Text>
                                </Pressable>

                                {/* Do Nothing */}
                                <Pressable
                                    style={({ pressed }) => [styles.actionButton, styles.actionWait, pressed && styles.actionPressed]}
                                    onPress={onClose}
                                    disabled={isProcessing}
                                >
                                    <View style={styles.actionHeader}>
                                        <Text style={styles.actionIcon}>🤷</Text>
                                        <Text style={styles.actionTitle}>Do Nothing (Wait it out)</Text>
                                    </View>
                                    <Text style={styles.actionDesc}>Wait and hope for a market recovery</Text>
                                    <Text style={styles.actionResult}>💡 ~25% chance of recovery next month</Text>
                                </Pressable>

                                {/* Sell */}
                                <Pressable
                                    style={({ pressed }) => [styles.actionButton, styles.actionSell, pressed && styles.actionPressed]}
                                    onPress={handleSell}
                                    disabled={isProcessing}
                                >
                                    <View style={styles.actionHeader}>
                                        <Text style={styles.actionIcon}>💸</Text>
                                        <Text style={styles.actionTitle}>Sell Asset (Fire Sale)</Text>
                                    </View>
                                    <Text style={styles.actionDesc}>Sell at a loss to stop the bleeding</Text>
                                    <Text style={styles.actionResult}>💰 Receive {formatMoney(sellValue)} (50% of value)</Text>
                                </Pressable>
                            </View>
                        )}

                        {isHealthy && (
                            <View style={styles.healthyMessage}>
                                <Text style={styles.healthyIcon}>✨</Text>
                                <Text style={styles.healthyText}>
                                    This company is performing well and contributing to your monthly revenue.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default SubsidiaryDetailModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.textPrimary,
    },
    closeText: {
        fontSize: 32,
        fontWeight: '300',
        color: theme.colors.textSecondary,
    },
    statusCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        gap: 8,
    },
    statusHealthy: {
        backgroundColor: theme.colors.success + '15',
        borderColor: theme.colors.success,
    },
    statusCritical: {
        backgroundColor: theme.colors.danger + '15',
        borderColor: theme.colors.danger,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    statusTextHealthy: {
        color: theme.colors.success,
    },
    statusTextCritical: {
        color: theme.colors.danger,
    },
    warningText: {
        fontSize: 13,
        color: theme.colors.danger,
        fontWeight: '600',
        marginTop: 8,
        lineHeight: 18,
    },
    metricsCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    metricValue: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        fontWeight: '800',
    },
    actionsCard: {
        gap: 12,
    },
    actionButton: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        gap: 8,
    },
    actionRestructure: {
        backgroundColor: theme.colors.primary + '10',
        borderColor: theme.colors.primary,
    },
    actionWait: {
        backgroundColor: theme.colors.cardSoft,
        borderColor: theme.colors.border,
    },
    actionSell: {
        backgroundColor: theme.colors.danger + '10',
        borderColor: theme.colors.danger,
    },
    actionPressed: {
        opacity: 0.7,
    },
    actionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    actionDesc: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    actionResult: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontStyle: 'italic',
    },
    healthyMessage: {
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    healthyIcon: {
        fontSize: 48,
    },
    healthyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    investmentActions: {
        gap: 12,
    },
    investButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 4,
    },
    sellButton: {
        backgroundColor: theme.colors.danger + '20',
        borderWidth: 2,
        borderColor: theme.colors.danger,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 4,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    investButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    investButtonDesc: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.8,
    },
    sellButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.danger,
    },
    sellButtonDesc: {
        fontSize: 12,
        color: theme.colors.danger,
        opacity: 0.8,
    },
});
