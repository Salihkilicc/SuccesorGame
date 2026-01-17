import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import { Product } from '../data/productsData';
import { ProductLaunchModal, ProductDetailModal as DetailModalComponent } from '../components/ProductModals';
import { useProductsLogic } from '../logic/useProductsLogic';

interface ProductDetailModalProps {
    visible: boolean;
    productId: string | null;
    onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ visible, productId, onClose }) => {
    const { products, actions, totalRP } = useProductsLogic();
    const product = products.find(p => p.id === productId);

    const [formState, setFormState] = useState<{
        sellingPrice: number;
        marketingBudget: number;
        productionLevel: number;
        supplierId: string;
    }>({ sellingPrice: 0, marketingBudget: 0, productionLevel: 0, supplierId: '' });

    const [tip, setTip] = useState('');

    useEffect(() => {
        if (product) {
            setFormState({
                sellingPrice: product.sellingPrice || product.suggestedPrice || 0,
                marketingBudget: product.marketingBudget || 0,
                productionLevel: product.productionLevel || 0,
                supplierId: product.supplierId || 'local',
            });
            setTip('');
        }
    }, [product, visible]);

    if (!visible || !product) return null;

    const handleSave = () => {
        actions.updateProductSettings(product.id, formState);
        Alert.alert('Saved', 'Product settings updated.');
        onClose();
    };

    const handleRetire = () => {
        Alert.alert('Retire Product', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Retire',
                style: 'destructive',
                onPress: () => {
                    actions.retireProduct(product.id);
                    onClose();
                }
            }
        ]);
    };

    const handleGetInsight = () => {
        setTip(actions.getInsightTip(product));
    };

    // Helper for number increment with dynamic max for marketing
    const adjustValue = (field: keyof typeof formState, delta: number, min = 0, max?: number) => {
        // Calculate dynamic max for marketing budget (50% of selling price)
        let effectiveMax = max;
        if (field === 'marketingBudget' && !max) {
            effectiveMax = Math.floor(formState.sellingPrice * 0.5);
        }
        effectiveMax = effectiveMax || 10000; // Fallback

        setFormState(prev => ({
            ...prev,
            [field]: Math.max(min, Math.min(effectiveMax, (prev[field] as number) + delta))
        }));
    };

    // Helper for percentage-based marketing budget adjustment
    const adjustMarketingByPercent = (percent: number) => {
        const maxLimit = Math.floor(formState.sellingPrice * 0.5);
        const delta = Math.floor(maxLimit * (percent / 100));
        const newValue = formState.marketingBudget + delta;

        setFormState(prev => ({
            ...prev,
            marketingBudget: Math.max(0, Math.min(maxLimit, newValue))
        }));
    };

    const renderControl = (label: string, field: 'sellingPrice' | 'marketingBudget' | 'productionLevel', step: number, suffix = '', max = 10000) => {
        let subLabelText = '';
        let demandBoostElement = null;
        let percentageButtons = null;

        if (field === 'productionLevel') {
            subLabelText = `Market Demand: ${product.marketDemand}%`;
        } else if (field === 'marketingBudget') {
            const limit = Math.floor(formState.sellingPrice * 0.5);

            // Demand Boost Calculation
            const efficiency = Math.min(1, formState.marketingBudget / limit);
            const boostPercentage = Math.floor(efficiency * 30);

            subLabelText = `Max Limit: $${limit}`;

            if (boostPercentage > 0) {
                demandBoostElement = (
                    <Text style={[styles.boostText, { color: theme.colors.success }]}>
                        Demand Boost: +{boostPercentage}%
                    </Text>
                );
            } else {
                demandBoostElement = (
                    <Text style={[styles.boostText, { color: theme.colors.textSecondary }]}>
                        Etki: Yok (Organic)
                    </Text>
                );
            }

            // Percentage adjustment buttons
            percentageButtons = (
                <View style={styles.percentButtonsContainer}>
                    <Pressable style={styles.percentBtn} onPress={() => adjustMarketingByPercent(-5)}>
                        <Text style={styles.percentBtnText}>-5%</Text>
                    </Pressable>
                    <Pressable style={styles.percentBtn} onPress={() => adjustMarketingByPercent(-3)}>
                        <Text style={styles.percentBtnText}>-3%</Text>
                    </Pressable>
                    <Pressable style={styles.percentBtn} onPress={() => adjustMarketingByPercent(3)}>
                        <Text style={styles.percentBtnText}>+3%</Text>
                    </Pressable>
                    <Pressable style={styles.percentBtn} onPress={() => adjustMarketingByPercent(5)}>
                        <Text style={styles.percentBtnText}>+5%</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <View style={styles.controlRow}>
                <View>
                    <Text style={styles.label}>{label}</Text>
                    {subLabelText ? (
                        <Text style={styles.subLabel}>{subLabelText}</Text>
                    ) : null}
                </View>

                <View style={styles.stepperContainer}>
                    <Pressable style={styles.stepperBtn} onPress={() => adjustValue(field, -step, 0, max)}>
                        <Text style={styles.stepperText}>-</Text>
                    </Pressable>

                    <View style={styles.valueContainer}>
                        <Text style={styles.stepperValue}>
                            {field === 'sellingPrice' ? '$' : ''}{formState[field]}{suffix}
                        </Text>
                    </View>

                    <Pressable style={styles.stepperBtn} onPress={() => adjustValue(field, step, 0, max)}>
                        <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                </View>

                {/* Percentage buttons for marketing */}
                {percentageButtons}

                {/* Demand Boost Display below the slider/stepper */}
                {demandBoostElement && (
                    <View style={styles.boostContainer}>
                        {demandBoostElement}
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Text style={styles.icon}>{product.icon}</Text>
                            <Text style={styles.title}>{product.name}</Text>
                        </View>
                        <Pressable onPress={onClose}><Text style={styles.closeIcon}>✕</Text></Pressable>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Revenue</Text>
                                <Text style={styles.statValue}>${(product.revenue || 0).toLocaleString()}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Profit Margin</Text>
                                <Text style={styles.statValue}>
                                    {Math.round(((formState.sellingPrice - (product.unitCost || product.baseProductionCost)) / formState.sellingPrice) * 100)}%
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.sectionHeader}>Management</Text>

                        {renderControl('Selling Price', 'sellingPrice', 5, '', undefined)}
                        {renderControl('Marketing Budget', 'marketingBudget', 10, '', undefined)}
                        {renderControl('Production Level', 'productionLevel', 5, '%', 100)}

                        <Text style={styles.sectionHeader}>R&D Upgrades</Text>
                        <View style={styles.upgradeRow}>
                            {/* Quality Upgrade */}
                            <View style={styles.upgradeCard}>
                                <Text style={styles.upgradeTitle}>Improve Quality</Text>
                                <View style={styles.upgradeStats}>
                                    <Text style={styles.statText}>Lvl {product.qualityLevel || 1} ➜ {(product.qualityLevel || 1) + 1}</Text>
                                    <Text style={[styles.statEffect, { color: theme.colors.success }]}>+3% Price</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtn,
                                        totalRP < actions.calculateUpgradeCost(product, 'quality') && styles.disabledBtn
                                    ]}
                                    disabled={totalRP < actions.calculateUpgradeCost(product, 'quality')}
                                    onPress={() => actions.handleUpgradeQuality(product)}
                                >
                                    <Text style={styles.upgradeBtnText}>
                                        Upgrade ({actions.calculateUpgradeCost(product, 'quality').toLocaleString()} RP)
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Process Upgrade */}
                            <View style={styles.upgradeCard}>
                                <Text style={styles.upgradeTitle}>Optimize Process</Text>
                                <View style={styles.upgradeStats}>
                                    <Text style={styles.statText}>Lvl {product.processLevel || 1} ➜ {(product.processLevel || 1) + 1}</Text>
                                    <Text style={[styles.statEffect, { color: theme.colors.accent }]}>-2% Cost</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtn,
                                        (totalRP < actions.calculateUpgradeCost(product, 'process') || (product.unitCost || 0) <= (product.baseProductionCost * 0.4)) && styles.disabledBtn
                                    ]}
                                    disabled={totalRP < actions.calculateUpgradeCost(product, 'process') || (product.unitCost || 0) <= (product.baseProductionCost * 0.4)}
                                    onPress={() => actions.handleOptimizeProcess(product)}
                                >
                                    <Text style={styles.upgradeBtnText}>
                                        {(product.unitCost || 0) <= (product.baseProductionCost * 0.4)
                                            ? 'Max Efficiency'
                                            : `Optimize(${actions.calculateUpgradeCost(product, 'process').toLocaleString()} RP)`
                                        }
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.controlRow}>
                            <Text style={styles.label}>Supplier</Text>
                            <View style={styles.supplierContainer}>
                                {['Local', 'Global', 'Premium'].map(s => (
                                    <Pressable
                                        key={s}
                                        style={[styles.supplierBtn, formState.supplierId === s.toLowerCase() && styles.supplierBtnActive]}
                                        onPress={() => setFormState(prev => ({ ...prev, supplierId: s.toLowerCase() }))}
                                    >
                                        <Text style={[styles.supplierText, formState.supplierId === s.toLowerCase() && styles.supplierTextActive]}>{s}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {tip ? (
                            <View style={styles.tipBox}>
                                <Text style={styles.tipText}>💡 {tip}</Text>
                            </View>
                        ) : (
                            <Pressable style={styles.insightBtn} onPress={handleGetInsight}>
                                <Text style={styles.insightBtnText}>Get AI Insight</Text>
                            </Pressable>
                        )}

                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable style={styles.retireBtn} onPress={handleRetire}>
                            <Text style={styles.retireText}>Retire</Text>
                        </Pressable>
                        <Pressable style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveText}>Save Changes</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 10,
    },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        flex: 1,
        marginVertical: 40,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        backgroundColor: theme.colors.card,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    icon: { fontSize: 24 },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
    closeIcon: { fontSize: 24, color: theme.colors.textSecondary },
    scrollContent: { padding: 20 },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statBox: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    },
    statLabel: { fontSize: 12, color: theme.colors.textSecondary },
    statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success, marginTop: 4 },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: 15
    },
    controlRow: { marginBottom: 20 },
    label: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
    subLabel: { fontSize: 11, color: theme.colors.textSecondary },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: 5
    },
    stepperBtn: { padding: 15, width: 60, alignItems: 'center' },
    stepperText: { fontSize: 20, color: theme.colors.primary },
    stepperValue: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
    footer: {
        padding: 20,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        flexDirection: 'row',
        gap: 10
    },
    saveBtn: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    saveText: { fontWeight: 'bold', color: '#000' },
    retireBtn: {
        flex: 0.5,
        backgroundColor: theme.colors.error + '20',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    retireText: { color: theme.colors.error, fontWeight: '600' },
    supplierContainer: { flexDirection: 'row', gap: 10, marginTop: 8 },
    supplierBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center'
    },
    supplierBtnActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    supplierText: { color: theme.colors.textSecondary, fontSize: 12 },
    supplierTextActive: { color: '#000', fontWeight: 'bold' },
    insightBtn: {
        backgroundColor: theme.colors.cardSoft,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.accent,
        borderStyle: 'dashed'
    },
    insightBtnText: { color: theme.colors.accent },
    tipBox: { backgroundColor: theme.colors.accent + '20', padding: 15, borderRadius: 8 },
    tipText: { color: theme.colors.textPrimary, fontSize: 14 },
    upgradeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    upgradeCard: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    upgradeTitle: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, marginBottom: 5 },
    upgradeStats: { marginBottom: 10 },
    statText: { fontSize: 12, color: theme.colors.textPrimary },
    statEffect: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
    upgradeBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 6,
        alignItems: 'center'
    },
    disabledBtn: { backgroundColor: '#444', opacity: 0.7 },
    upgradeBtnText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
    boostContainer: { alignItems: 'center', marginTop: 8 },
    boostText: { fontSize: 13, fontWeight: 'bold' },
    valueContainer: { flex: 1, alignItems: 'center' },
    barContainer: {
        height: 4,
        width: '80%',
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2
    },
    percentButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        justifyContent: 'center'
    },
    percentBtn: {
        backgroundColor: theme.colors.cardSoft,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 50,
        alignItems: 'center'
    },
    percentBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textPrimary
    }
});
