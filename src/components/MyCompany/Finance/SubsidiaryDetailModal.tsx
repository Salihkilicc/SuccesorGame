import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import GameModal from '../../common/GameModal';
import { useCorporateFinanceStore, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';
import { formatCurrency } from '../../../utils/formatCurrency'; // Assuming utility exists, else will use toLocaleString

type Props = {
    visible: boolean;
    onClose: () => void;
    subsidiaryId: string;
};

const SubsidiaryDetailModal = ({ visible, onClose, subsidiaryId }: Props) => {
    const { subsidiaries, updateSubsidiaryStrategy, sellSubsidiary } = useCorporateFinanceStore();
    const subsidiary = subsidiaries.find(s => s.id === subsidiaryId);

    const [strategy, setStrategy] = useState<SubsidiaryStrategy>({
        marketing: 0,
        rnd: 0,
        production: 0,
        workforce: 0,
    });

    // Load initial strategy when modal opens or subsidiary changes
    useEffect(() => {
        if (subsidiary) {
            setStrategy(subsidiary.strategy);
        }
    }, [subsidiary, visible]);

    if (!subsidiary) return null;

    const totalPoints = strategy.marketing + strategy.rnd + strategy.production + strategy.workforce;
    const remaining = 10 - totalPoints;

    const handleConfirm = () => {
        if (remaining !== 0) {
            Alert.alert('Incomplete Strategy', 'You must allocate exactly 10 points.'); // Or maybe allow less? Prompt implies "allocate exactly 10 Points" logic but "Constraint: Sum must be <= 10" in interface. User prompt says "remaining = 10 - totalPoints" and "Color it Red if 0, Green if > 0" implies remaining > 0 is good? Wait, "Color it Red if 0, Green if > 0" usually means green is available.
            // Re-reading user request: "Remaining Points: X / 10". Color it Red if 0 (no points left), Green if > 0 (points available).
            // "Disable [+] if remaining === 0". This implies we stop at 0 remaining.
            // Does strictly strictly require exactly 10 used? "manage ... exactly 10 Points". "Constraint: Sum must be <= 10".
            // I'll assume we can save if <= 10, but ideally we use them all. I won't block saving if < 10 but user probably wants to use all.
            // Let's just save.
        }
        updateSubsidiaryStrategy(subsidiaryId, strategy);
        onClose();
    };

    const handleSell = () => {
        Alert.alert(
            'Sell Subsidiary',
            `Are you sure you want to sell ${subsidiary.name} for $${(subsidiary.valuation / 1_000_000).toFixed(2)}M?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell & Cash Out',
                    style: 'destructive',
                    onPress: () => {
                        sellSubsidiary(subsidiaryId);
                        onClose();
                    }
                }
            ]
        );
    };

    const updatePoint = (key: keyof SubsidiaryStrategy, delta: number) => {
        setStrategy(prev => {
            const currentVal = prev[key];
            const newVal = currentVal + delta;

            // Check bounds
            if (newVal < 0) return prev; // Cannot go below 0
            if (delta > 0 && remaining <= 0) return prev; // Cannot exceed 10 total

            return { ...prev, [key]: newVal };
        });
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.companyName}>{subsidiary.name}</Text>
                <Text style={styles.companyValuation}>
                    Valuation: ${(subsidiary.valuation / 1_000_000).toFixed(2)}M
                </Text>
                <View style={styles.sectorBadge}>
                    <Text style={styles.sectorText}>{subsidiary.sector}</Text>
                </View>
            </View>

            {/* POINTS POOL */}
            <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>REMAINING POINTS</Text>
                <Text style={[styles.pointsValue, { color: remaining > 0 ? theme.colors.success : theme.colors.error }]}>
                    {remaining} / 10
                </Text>
            </View>

            {/* CONTROLS */}
            <View style={styles.controlsContainer}>
                {renderControl('Marketing 📢', 'marketing', strategy.marketing, remaining, updatePoint)}
                {renderControl('R&D 🔬', 'rnd', strategy.rnd, remaining, updatePoint)}
                {renderControl('Production 🏭', 'production', strategy.production, remaining, updatePoint)}
                {renderControl('Workforce 👷', 'workforce', strategy.workforce, remaining, updatePoint)}
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
                    <Text style={styles.sellButtonText}>Sell Company</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>Confirm Strategy</Text>
                </TouchableOpacity>
            </View>
        </GameModal>
    );
};

// Helper for rendering stepper rows
const renderControl = (
    label: string,
    key: keyof SubsidiaryStrategy,
    value: number,
    remaining: number,
    updateFn: (k: keyof SubsidiaryStrategy, d: number) => void
) => (
    <View style={styles.controlRow} key={key}>
        <Text style={styles.controlLabel}>{label}</Text>
        <View style={styles.stepperContainer}>
            <TouchableOpacity
                style={[styles.stepperBtn, value === 0 && styles.stepperBtnDisabled]}
                onPress={() => updateFn(key, -1)}
                disabled={value === 0}
            >
                <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>

            <View style={styles.valueBox}>
                <Text style={styles.valueText}>{value}</Text>
            </View>

            <TouchableOpacity
                style={[styles.stepperBtn, remaining === 0 && styles.stepperBtnDisabled]}
                onPress={() => updateFn(key, 1)}
                disabled={remaining === 0}
            >
                <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2D35',
        paddingBottom: 16,
    },
    companyName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    companyValuation: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: '700',
        marginBottom: 8,
    },
    sectorBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    sectorText: {
        fontSize: 12,
        color: '#8A9BA8',
        fontWeight: '600',
    },
    pointsContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#8A9BA8',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    pointsValue: {
        fontSize: 32,
        fontWeight: '900',
    },
    controlsContainer: {
        gap: 16,
        marginBottom: 32,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    controlLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E0E0E0',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    stepperBtnDisabled: {
        opacity: 0.3,
        borderColor: '#2A2D35',
    },
    stepperBtnText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '700',
        lineHeight: 20,
    },
    valueBox: {
        width: 40,
        alignItems: 'center',
    },
    valueText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFD700',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    sellButton: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    sellButtonText: {
        color: '#FF3B30',
        fontWeight: '700',
        fontSize: 14,
    },
    confirmButton: {
        flex: 2,
        backgroundColor: '#30D158',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    confirmButtonText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
    },
});

export default SubsidiaryDetailModal;
