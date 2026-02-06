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
    const getAdvisorReport = () => {
        const s = subsidiary.sector;
        const { marketing, rnd, production, workforce } = strategy;

        // 🚨 Critical Rule
        if (workforce < 2) {
            return "⚠️ HR DIRECTOR: 'Morale is critical. The union is threatening an immediate strike! We need to raise wages.'";
        }

        // 🏭 Sector Specific Rules
        if (s === 'Technology' && rnd < 4) {
            return "💡 CTO: 'Our tech stack is outdated. Competitors are launching faster. We need R&D funds.'";
        }
        if (s === 'Industrial' && production < 4) {
            return "⚙️ OPS MANAGER: 'Machinery breakdowns are frequent. Production lines are stalling.'";
        }
        if ((s === 'Retail' || s === 'Consumer') && marketing < 4) {
            return "📢 CMO: 'Brand awareness is dropping. Focus groups don't recognize our new products.'";
        }
        if ((s === 'Category' || s === 'Health' || s === 'Healthcare') && rnd < 4) {
            return "🏥 SURGEON GENERAL: 'Clinical trials are delayed. We need more R&D to pass FDA approval.'";
        }
        if ((s === 'Finance' || s === 'Financial') && (marketing < 3 || rnd < 3)) {
            return "📉 ANALYST: 'We are losing clients to fintech apps. We need better tech and branding.'";
        }

        // ✅ Good Strategy
        return "📈 BOARD MEMO: 'Quarterly projections look solid. The current strategy is aligned with market trends.'";
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

                        {/* Sector Badge */}
                        <View style={styles.sectorBadge}>
                            <Text style={styles.sectorText}>{subsidiary.sector.toUpperCase()}</Text>
                        </View>

                        <View style={styles.advisorCard}>
                            <Text style={styles.advisorLabel}>EXECUTIVE SUMMARY</Text>
                            <Text style={styles.advisorText}>{getAdvisorReport()}</Text>
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
    sectorBadge: {
        marginTop: 8,
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#555',
    },
    sectorText: {
        color: '#DDD',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    advisorCard: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#222',
        marginTop: 20,
        marginBottom: 20,
        borderColor: '#333',
        borderWidth: 1,
        width: '100%',
    },
    advisorLabel: {
        color: '#555',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
        letterSpacing: 1,
    },
    advisorText: {
        color: '#DDD',
        fontSize: 14,
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
