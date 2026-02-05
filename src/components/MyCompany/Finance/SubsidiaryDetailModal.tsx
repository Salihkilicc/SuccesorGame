import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { theme } from '../../../core/theme';
import { useCorporateFinanceStore, SubsidiaryStrategy } from '../../../features/finance/stores/useCorporateFinanceStore';

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
            // Optional warning
        }
        updateSubsidiaryStrategy(subsidiaryId, strategy);
        onClose();
    };

    const handleSell = () => {
        Alert.alert(
            'Sell Subsidiary',
            `Sell ${subsidiary.name} for $${(subsidiary.valuation / 1_000_000).toFixed(2)}M?`,
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
            if (newVal < 0) return prev;
            if (delta > 0 && remaining <= 0) return prev;
            return { ...prev, [key]: newVal };
        });
    };

    // Advisor Logic
    const getAdvisorHint = () => {
        const s = subsidiary.sector;
        if (s === 'Technology') return 'Focus heavily on R&D for tech growth.';
        if (s === 'Industrial') return 'Production capacity is key for heavy industry.';
        if (s === 'Retail') return 'Marketing drives retail sales.';
        if (s === 'Finance') return 'Balance Marketing and R&D for fintech products.';
        return 'Maintain a balanced strategy.';
    };

    const renderControl = (
        label: string,
        key: keyof SubsidiaryStrategy,
        value: number
    ) => (
        <View style={styles.controlRow} key={key}>
            <Text style={styles.controlLabel}>{label}</Text>
            <View style={styles.stepperInfo}>
                <TouchableOpacity
                    style={[styles.stepperBtn, value === 0 && styles.disabledBtn]}
                    onPress={() => updatePoint(key, -1)}
                    disabled={value === 0}
                >
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.valueText}>{value}</Text>
                <TouchableOpacity
                    style={[styles.stepperBtn, remaining === 0 && styles.disabledBtn]}
                    onPress={() => updatePoint(key, 1)}
                    disabled={remaining === 0}
                >
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{subsidiary.name}</Text>
                    <View style={{ width: 50 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Top Section */}
                    <View style={styles.topSection}>
                        <Text style={styles.valuationLabel}>CURRENT VALUATION</Text>
                        <View style={styles.valuationRow}>
                            <Text style={styles.valuationValue}>
                                ${(subsidiary.valuation / 1_000_000).toFixed(2)}M
                            </Text>
                            <Text style={[styles.changeText, subsidiary.lastChangePercent >= 0 ? { color: '#4ADE80' } : { color: '#FF453A' }]}>
                                {subsidiary.lastChangePercent > 0 ? '+' : ''}{subsidiary.lastChangePercent.toFixed(1)}%
                            </Text>
                        </View>

                        <View style={styles.advisorContainer}>
                            <Text style={styles.advisorTitle}>💡 ADVISOR SAYS:</Text>
                            <Text style={styles.advisorText}>{getAdvisorHint()}</Text>
                        </View>
                    </View>

                    {/* Points Pool */}
                    {remaining > 0 && (
                        <View style={styles.pointsPool}>
                            <Text style={styles.pointsLabel}>POINTS AVAILABLE</Text>
                            <Text style={[styles.pointsValue, { color: '#4ADE80' }]}>
                                {remaining}
                            </Text>
                        </View>
                    )}

                    {/* Strategy Controls */}
                    <View style={styles.controlsSection}>
                        {renderControl('Marketing 📢', 'marketing', strategy.marketing)}
                        {renderControl('R&D 🔬', 'rnd', strategy.rnd)}
                        {renderControl('Production 🏭', 'production', strategy.production)}
                        {renderControl('Workforce 👷', 'workforce', strategy.workforce)}
                    </View>
                </ScrollView>

                {/* Bottom Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                        <Text style={styles.confirmText}>CONFIRM STRATEGY</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sellBtn} onPress={handleSell}>
                        <Text style={styles.sellText}>SELL COMPANY</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default SubsidiaryDetailModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backBtn: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    valuationLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1,
    },
    valuationRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 20,
    },
    valuationValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFD700',
    },
    changeText: {
        fontSize: 16,
        fontWeight: '700',
    },
    advisorContainer: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        width: '100%',
    },
    advisorTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFD700',
        marginBottom: 6,
    },
    advisorText: {
        fontSize: 14,
        color: '#CCCCCC',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    pointsPool: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    pointsLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    controlsSection: {
        gap: 16,
    },
    controlRow: {
        backgroundColor: '#1C1C1E',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    controlLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepperInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepperBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledBtn: {
        opacity: 0.3,
    },
    btnText: {
        fontSize: 24,
        color: '#FFF',
        marginTop: -2,
    },
    valueText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        width: 30,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#121212',
        paddingHorizontal: 20,
        paddingTop: 12, // Reduced from 16
        paddingBottom: 24, // Reduced from 40 (-40%)
        borderTopWidth: 1,
        borderTopColor: '#333',
        gap: 12,
    },
    confirmBtn: {
        backgroundColor: '#4ADE80',
        paddingVertical: 12, // Reduced from 18
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    sellBtn: {
        paddingVertical: 8, // Reduced from 18
        alignItems: 'center',
        // Removed border and background for "smaller look"
    },
    sellText: {
        color: '#FF453A',
        fontSize: 14, // Reduced from 16
        fontWeight: '600',
    },
});
