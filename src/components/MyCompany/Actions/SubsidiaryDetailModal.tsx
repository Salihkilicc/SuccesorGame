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
import { useCorporateFinanceStore, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';

interface SubsidiaryDetailModalProps {
    visible: boolean;
    onClose: () => void;
    companyId: string | null;
}

const formatMoney = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
};

export const SubsidiaryDetailModal = ({ visible, onClose, companyId }: SubsidiaryDetailModalProps) => {
    const { subsidiaries, updateSubsidiaryStrategy, sellSubsidiary } = useCorporateFinanceStore();
    const subsidiary = subsidiaries.find(s => s.id === companyId);

    // Fallback strategy to prevent hooks error
    const defaultStrategy: SubsidiaryStrategy = { marketing: 0, rnd: 0, production: 0, workforce: 0 };
    const [strategy, setStrategy] = useState<SubsidiaryStrategy>(subsidiary?.strategy || defaultStrategy);

    // Reset local state when subsidiary changes
    useEffect(() => {
        if (subsidiary) {
            setStrategy(subsidiary.strategy);
        }
    }, [subsidiary]);

    // Fallback if not found or no ID
    if (!subsidiary) return null;

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
            `Are you sure you want to sell ${subsidiary.name} for ${formatMoney(subsidiary.valuation)}?\n\nThis action is irreversible.`,
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
                                <Text style={styles.valuationText}>{formatMoney(subsidiary.valuation)}</Text>
                                {/* Simple growth indicator based on acquired vs current */}
                                {subsidiary.valuation >= subsidiary.acquiredAt ? (
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
        backgroundColor: '#1C1C1E', // Dark card
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        gap: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 16,
    },
    companyName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    valuationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    valuationText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFD60A', // Gold-ish
    },
    growthText: {
        fontSize: 12,
        color: '#30D158',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // Allocation
    allocationSection: {
        gap: 12,
    },
    allocHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pointsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0A84FF', // Blue
    },
    forecastText: {
        fontSize: 13,
        color: '#8E8E93',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 8,
    },

    // Steppers
    stepperContainer: {
        gap: 12,
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
    },
    stepperLabel: {
        color: '#E5E5E7',
        fontSize: 15,
        fontWeight: '600',
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#000000', // Deep black for contrast
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stepBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#1C1C1E',
    },
    stepBtnDisabled: {
        opacity: 0.3,
    },
    stepBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 20,
    },
    stepValue: {
        width: 24,
        textAlign: 'center',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Footer
    footer: {
        gap: 12,
        marginTop: 8,
    },
    actionSave: {
        backgroundColor: '#0A84FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#0A84FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    actionSaveText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    actionSell: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF453A',
    },
    actionSellText: {
        color: '#FF453A',
        fontWeight: '700',
        fontSize: 14,
    },
});
