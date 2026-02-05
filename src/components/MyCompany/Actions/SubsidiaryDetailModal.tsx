import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
} from 'react-native';
import { theme } from '../../../core/theme';
import { useCorporateFinanceStore, Subsidiary, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

interface SubsidiaryDetailModalProps {
    visible: boolean;
    onClose: () => void;
    subsidiary: Subsidiary;
}

const formatMoney = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
};

export const SubsidiaryDetailModal = ({ visible, onClose, subsidiary }: SubsidiaryDetailModalProps) => {
    const { updateSubsidiaryStrategy, sellSubsidiary } = useCorporateFinanceStore();
    const [strategy, setStrategy] = useState<SubsidiaryStrategy>(subsidiary.strategy);

    // Reset local state when subsidiary changes
    useEffect(() => {
        setStrategy(subsidiary.strategy);
    }, [subsidiary]);

    // Calculate Points used
    const totalPoints = strategy.marketing + strategy.rnd + strategy.production + strategy.workforce;
    const maxPoints = 10;
    const remainingPoints = maxPoints - totalPoints;

    // Forecast Text
    const getForecast = () => {
        const stats = [
            { name: 'Market Leader', val: strategy.marketing },
            { name: 'Innovator', val: strategy.rnd },
            { name: 'Mass Producer', val: strategy.production },
            { name: 'Top Employer', val: strategy.workforce },
        ];
        // Sort desc
        stats.sort((a, b) => b.val - a.val);

        if (stats[0].val === stats[1].val) return "Balanced Growth";
        return `Focus: ${stats[0].name}`;
    };

    const handleUpdate = (field: keyof SubsidiaryStrategy, delta: number) => {
        const currentValue = strategy[field];
        const newValue = currentValue + delta;

        // Constraints
        if (newValue < 0) return; // Cannot go below 0
        if (newValue > 10) return; // Individual max (logic limit)

        // Check Total Sum constraint ONLY if increasing
        if (delta > 0 && totalPoints >= maxPoints) return;

        setStrategy(prev => ({ ...prev, [field]: newValue }));
    };

    const handleSave = () => {
        updateSubsidiaryStrategy(subsidiary.id, strategy);
        Alert.alert('Strategy Updated', 'Instructions sent to the board.');
        onClose();
    };

    const handleSell = () => {
        Alert.alert(
            'Sell Subsidiary?',
            `Are you sure you want to sell ${subsidiary.name} for ${formatMoney(subsidiary.currentValuation)}?\n\nThis action is irreversible.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell Company',
                    style: 'destructive',
                    onPress: () => {
                        sellSubsidiary(subsidiary.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const renderStepper = (label: string, field: keyof SubsidiaryStrategy) => {
        const val = strategy[field];
        const canInc = totalPoints < maxPoints;
        const canDec = val > 0;

        return (
            <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>{label}</Text>
                <View style={styles.stepperControls}>
                    <Pressable
                        style={[styles.stepBtn, !canDec && styles.stepBtnDisabled]}
                        onPress={() => handleUpdate(field, -1)}
                        disabled={!canDec}
                    >
                        <Text style={styles.stepBtnText}>-</Text>
                    </Pressable>

                    <Text style={styles.stepValue}>{val}</Text>

                    <Pressable
                        style={[styles.stepBtn, !canInc && styles.stepBtnDisabled]}
                        onPress={() => handleUpdate(field, 1)}
                        disabled={!canInc}
                    >
                        <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.companyName}>{subsidiary.name}</Text>
                            <View style={styles.valuationBadge}>
                                <Text style={styles.valuationText}>{formatMoney(subsidiary.currentValuation)}</Text>
                                {/* Simple growth indicator based on acquired vs current */}
                                {subsidiary.currentValuation >= subsidiary.acquiredAtValuation ? (
                                    <Text style={styles.growthText}>▲</Text>
                                ) : (
                                    <Text style={[styles.growthText, { color: theme.colors.danger }]}>▼</Text>
                                )}
                            </View>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Allocation Section */}
                    <View style={styles.allocationSection}>
                        <View style={styles.allocHeader}>
                            <Text style={styles.sectionTitle}>Strategy Allocation</Text>
                            <Text style={[
                                styles.pointsText,
                                remainingPoints === 0 ? { color: theme.colors.success } : { color: theme.colors.textSecondary }
                            ]}>
                                Points Used: {totalPoints} / {maxPoints}
                            </Text>
                        </View>

                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(totalPoints / maxPoints) * 100}%` }]} />
                        </View>

                        <Text style={styles.forecastText}>{getForecast()}</Text>

                        <View style={styles.stepperContainer}>
                            {renderStepper('Marketing', 'marketing')}
                            {renderStepper('R&D', 'rnd')}
                            {renderStepper('Production', 'production')}
                            {renderStepper('Workforce', 'workforce')}
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <Pressable style={styles.actionSave} onPress={handleSave}>
                            <Text style={styles.actionSaveText}>SAVE STRATEGY</Text>
                        </Pressable>
                        <Pressable style={styles.actionSell} onPress={handleSell}>
                            <Text style={styles.actionSellText}>SELL COMPANY</Text>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    container: {
        backgroundColor: theme.colors.card, // Assuming dark theme card
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: theme.spacing.md,
    },
    companyName: {
        fontSize: theme.typography.title,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    valuationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    valuationText: {
        fontSize: theme.typography.body,
        fontWeight: '700',
        color: theme.colors.accent,
    },
    growthText: {
        fontSize: 12,
        color: theme.colors.success,
    },
    closeBtn: {
        padding: 8,
    },
    closeText: {
        fontSize: 20,
        color: theme.colors.textSecondary,
    },

    // Allocation
    allocationSection: {
        gap: theme.spacing.md,
    },
    allocHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: theme.typography.subtitle,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    pointsText: {
        fontSize: theme.typography.body,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
    },
    forecastText: {
        fontSize: theme.typography.caption,
        color: theme.colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 8,
    },

    // Steppers
    stepperContainer: {
        gap: theme.spacing.sm,
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.sm + 4,
        borderRadius: theme.radius.md,
    },
    stepperLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.body,
        fontWeight: '600',
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.card, // Contrast inset
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    stepBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: theme.colors.cardSoft,
    },
    stepBtnDisabled: {
        opacity: 0.3,
    },
    stepBtnText: {
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 18,
    },
    stepValue: {
        width: 24,
        textAlign: 'center',
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
    },

    // Footer
    footer: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    actionSave: {
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        shadowColor: theme.colors.accent,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    actionSaveText: {
        color: '#000',
        fontWeight: '800',
        fontSize: theme.typography.body,
    },
    actionSell: {
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    actionSellText: {
        color: theme.colors.danger,
        fontWeight: '700',
        fontSize: theme.typography.body,
    },
});
