import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import { Product } from '../data/productsData';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useProductStore } from '../../../core/store/useProductStore';
// Removed obsolete imports
// import { ... } from '../../../features/products/logic/productUpgrades';

// --- LAUNCH MODAL ---
export const ProductLaunchModal = ({ visible, product, onClose, onAnalyze, onLaunch, analysisData }: any) => {
    if (!product) return null;
    const isAnalyzed = analysisData?.id === product.id;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.modalTitle}>🚀 New Product Opportunity</Text>

                    <View style={styles.header}>
                        <Text style={styles.icon}>{product.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{product.name}</Text>
                            <Text style={styles.desc}>{product.description}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.label}>Unlock Cost (R&D)</Text>
                        <Text style={styles.valueAccent}>{product.rndCost}</Text>
                    </View>

                    {isAnalyzed ? (
                        <View style={styles.analysisBox}>
                            <Text style={styles.sectionHeader}>📊 Market Analysis</Text>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>Market Demand</Text>
                                <Text style={styles.value}>{product.marketDemand}%</Text>
                            </View>
                            {/* Demand Bar */}
                            <View style={styles.barBg}><View style={[styles.barFill, { width: `${product.marketDemand}%` }]} /></View>

                            <View style={styles.statRow}>
                                <Text style={styles.label}>Competition</Text>
                                <Text style={[styles.value, { color: theme.colors.warning }]}>{product.competition}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>Est. Base Cost</Text>
                                <Text style={styles.value}>${product.baseProductionCost}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.blurBox}>
                            <Text style={styles.blurText}>??? Market Data Hidden ???</Text>
                            <Text style={styles.blurSubText}>Run analysis to reveal</Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        {!isAnalyzed ? (
                            <Pressable style={styles.btnPrimary} onPress={onAnalyze}>
                                <Text style={styles.btnText}>Perform Market Analysis</Text>
                            </Pressable>
                        ) : (
                            <Pressable style={styles.btnSuccess} onPress={onLaunch}>
                                <Text style={styles.btnText}>LAUNCH PRODUCT</Text>
                            </Pressable>
                        )}
                        <Pressable style={styles.btnGhost} onPress={onClose}>
                            <Text style={styles.ghostText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
export const ProductDetailModal = ({ visible, product: initialProduct, onClose, onUpdate, onRetire, getTip, totalCapacity }: any) => {
    // 1. Get live product from store to ensure reactivity
    const product = useProductStore((state) =>
        state.products.find((p) => p.id === initialProduct?.id)
    );

    // If product doesn't exist (e.g. retired/deleted), return null or close
    if (!product) return null;

    const { totalRP } = useLaboratoryStore();
    const { optimizeProductionLine, upgradeProductQuality, randomizeProductName } = useProductStore();

    const [production, setProduction] = useState(product.productionLevel ?? 50);
    const [marketing, setMarketing] = useState(product.marketingBudget || 0);
    const [marketingPerUnit, setMarketingPerUnit] = useState(product.marketingSpendPerUnit || 0);
    const displayName = product.name;

    const processLevel = product.processLevel || 1;
    const qualityLevel = product.qualityLevel || 1;
    const complexity = product.complexity || 50;

    // Cost Calculator Check
    const getUpgradeCost = (level: number) => Math.floor(complexity * 100 * Math.pow(1.5, level));

    const processUpgradeRP = getUpgradeCost(processLevel);
    const qualityUpgradeRP = getUpgradeCost(qualityLevel);

    const canUpgradeProcess = totalRP >= processUpgradeRP;
    const canUpgradeQuality = totalRP >= qualityUpgradeRP;

    // Cost Optimization Limit Check (40% of base)
    const currentUnitCost = product.unitCost ?? product.baseProductionCost;
    const minUnitCost = Math.floor(product.baseProductionCost * 0.40);
    const isMaxEfficiency = currentUnitCost <= minUnitCost;


    const handleSave = () => {
        onUpdate(product.id, {
            productionLevel: production,
            marketingBudget: marketing,
            marketingSpendPerUnit: marketingPerUnit
        });
        onClose();
    };

    const handleProcessUpgrade = () => {
        const result = optimizeProductionLine(product.id, totalRP, (amount) => {
            useLaboratoryStore.getState().spendRP(amount);
        });
        if (!result.success) {
            Alert.alert('Error', result.message);
        }
    };

    const handleQualityUpgrade = () => {
        const result = upgradeProductQuality(product.id, totalRP, (amount) => {
            useLaboratoryStore.getState().spendRP(amount);
        });
        if (!result.success) {
            Alert.alert('Error', result.message);
        }
    };

    const handleRandomizeName = () => {
        randomizeProductName(product.id);
    };

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    // Calculate Real Production Units (Dynamic Base)
    const BASE_CAPACITY = totalCapacity || 1500000;
    const estimatedUnits = Math.round(BASE_CAPACITY * (production / 100));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { height: '85%' }]}>
                    <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.modalTitle}>{product.icon} {displayName}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* RP Badge */}
                            <View style={styles.rpBadge}>
                                <Text style={styles.rpBadgeText}>{totalRP.toLocaleString()} RP</Text>
                            </View>
                            <Pressable onPress={onClose}><Text style={styles.closeIcon}>✕</Text></Pressable>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Insight */}
                        <View style={styles.insightBox}>
                            <Text style={styles.insightTitle}>💡 AI Insight</Text>
                            <Text style={styles.insightText}>{getTip(product)}</Text>
                        </View>

                        {/* R&D UPGRADES SECTION - COMPACT DESIGN */}
                        {/* R&D UPGRADES SECTION - COMPACT DESIGN */}
                        <View style={styles.rdSection}>
                            <Text style={styles.sectionTitle}>🔬 R&D Upgrades</Text>

                            {/* Optimize Process (Cost) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>Optimize Process</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${currentUnitCost}</Text>
                                        <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>(-2%)</Text>
                                    </View>
                                    <Text style={styles.hint}>Lvl {processLevel} ➜ {processLevel + 1}</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtnCompact,
                                        (!canUpgradeProcess || isMaxEfficiency) && styles.upgradeBtnDisabled
                                    ]}
                                    onPress={handleProcessUpgrade}
                                    disabled={!canUpgradeProcess || isMaxEfficiency}
                                >
                                    <Text style={styles.upgradeBtnTextCompact}>
                                        {isMaxEfficiency
                                            ? 'MAX EFFICIENCY'
                                            : `${formatNumber(processUpgradeRP)} RP`}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Improve Quality (Price) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>Improve Quality</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${product.sellingPrice || product.suggestedPrice}</Text>
                                        <Text style={{ color: theme.colors.success, fontWeight: 'bold' }}>(+3%)</Text>
                                    </View>
                                    <Text style={styles.hint}>Lvl {qualityLevel} ➜ {qualityLevel + 1}</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtnCompact,
                                        !canUpgradeQuality && styles.upgradeBtnDisabled
                                    ]}
                                    onPress={handleQualityUpgrade}
                                    disabled={!canUpgradeQuality}
                                >
                                    <Text style={styles.upgradeBtnTextCompact}>
                                        {`${formatNumber(qualityUpgradeRP)} RP`}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Production Capacity Control */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>Production Capacity</Text>
                            <View style={styles.sliderRow}>
                                <Pressable onPress={() => setProduction(Math.max(0, production - 10))} style={styles.adjBtn}><Text style={styles.adjText}>-</Text></Pressable>
                                <Text style={styles.controlValue}>{production}%</Text>
                                <Pressable onPress={() => setProduction(Math.min(100, production + 10))} style={styles.adjBtn}><Text style={styles.adjText}>+</Text></Pressable>
                            </View>
                            <View style={styles.realStatsRow}>
                                <Text style={styles.realStatsText}>Output: {formatNumber(estimatedUnits)} Units</Text>
                                <Text style={styles.hint}>Market Demand: {product.marketDemand}%</Text>
                            </View>
                        </View>

                        {/* Marketing Spend (Per Unit) - NEW */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>Marketing Spend (Per Unit)</Text>
                            <Text style={styles.hint}>Higher spend increases sales conversion</Text>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min(100, (marketingPerUnit / 100) * 100)}%` }]} />
                                </View>
                                <Text style={styles.progressValue}>${marketingPerUnit}</Text>
                            </View>
                            <View style={styles.sliderRow}>
                                <Pressable onPress={() => setMarketingPerUnit(Math.max(0, marketingPerUnit - 10))} style={styles.adjBtn}><Text style={styles.adjText}>-$10</Text></Pressable>
                                <Pressable onPress={() => setMarketingPerUnit(Math.max(0, marketingPerUnit - 5))} style={styles.adjBtn}><Text style={styles.adjText}>-$5</Text></Pressable>

                                <Pressable onPress={() => setMarketingPerUnit(Math.min(100, marketingPerUnit + 5))} style={styles.adjBtn}><Text style={styles.adjText}>+$5</Text></Pressable>
                                <Pressable onPress={() => setMarketingPerUnit(Math.min(100, marketingPerUnit + 10))} style={styles.adjBtn}><Text style={styles.adjText}>+$10</Text></Pressable>
                            </View>
                        </View>

                        {/* Inventory Status - NEW */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>📦 Inventory Status</Text>
                            <Text style={styles.heroValue}>{formatNumber(product.inventory || 0)} Units</Text>
                            <Text style={styles.hint}>Est. Storage Cost: ${formatNumber((product.inventory || 0) * 5)} / quarter</Text>
                        </View>

                        <Pressable style={styles.btnPrimary} onPress={handleSave}>
                            <Text style={styles.btnText}>Save Changes</Text>
                        </Pressable>

                        {/* Change Product Name Button */}
                        <Pressable style={styles.btnOutline} onPress={handleRandomizeName}>
                            <Text style={styles.btnOutlineText}>🎲 Change Product Name</Text>
                        </Pressable>

                        <Pressable style={styles.btnDanger} onPress={() => onRetire(product.id)}>
                            <Text style={styles.btnText}>Retire Product</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 16 },
    content: { backgroundColor: '#1A202C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2D3748' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
    header: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    icon: { fontSize: 42 },
    name: { fontSize: 18, fontWeight: '700', color: '#fff' },
    desc: { fontSize: 13, color: '#A0AEC0' },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#A0AEC0', fontSize: 14 },
    value: { color: '#fff', fontWeight: '700' },
    valueAccent: { color: theme.colors.accent, fontWeight: '800', fontSize: 16 },
    analysisBox: { backgroundColor: '#2D3748', padding: 12, borderRadius: 8, marginBottom: 20 },
    sectionHeader: { color: '#fff', fontWeight: '700', marginBottom: 12 },
    barBg: { height: 6, backgroundColor: '#1A202C', borderRadius: 3, marginBottom: 12 },
    barFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 3 },
    blurBox: { height: 100, backgroundColor: '#2D3748', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#4A5568' },
    blurText: { color: '#fff', fontWeight: '700' },
    blurSubText: { color: '#A0AEC0', fontSize: 12 },
    actions: { gap: 10 },
    btnPrimary: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnSuccess: { backgroundColor: theme.colors.success, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnDanger: { backgroundColor: theme.colors.danger, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    btnOutline: {
        backgroundColor: 'transparent',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A5568',
        marginTop: 12
    },
    btnGhost: { padding: 14, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
    btnOutlineText: { color: '#A0AEC0', fontWeight: '700', fontSize: 16 },
    ghostText: { color: '#A0AEC0', fontWeight: '600' },
    closeIcon: { fontSize: 24, color: '#A0AEC0' },
    rpBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    rpBadgeText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
    },
    progressBarContainer: {
        marginVertical: 12,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#2D3748',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 4,
    },
    progressValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    diceBtn: { padding: 4 },
    diceIcon: { fontSize: 20 },
    insightBox: { backgroundColor: theme.colors.cardSoft, padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
    insightTitle: { color: theme.colors.accent, fontWeight: '700', marginBottom: 4 },
    insightText: { color: '#E2E8F0', fontSize: 13 },
    rdSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 12 },

    // COMPACT UPGRADE CARD STYLES
    upgradeCardCompact: {
        backgroundColor: '#2D3748',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#4A5568',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    upgradeContentCompact: {
        flex: 1,
        alignItems: 'center'
    },
    upgradeLabel: {
        fontSize: 11,
        color: '#A0AEC0',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    heroValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1
    },
    upgradeBtnCompact: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 140
    },
    upgradeBtnTextCompact: {
        color: '#000',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center'
    },

    // OLD STYLES (keeping for compatibility)
    upgradeCard: { backgroundColor: '#2D3748', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#4A5568' },
    upgradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    upgradeLevel: { fontSize: 12, color: theme.colors.accent, fontWeight: '600' },
    upgradeStats: { marginBottom: 12 },
    statItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statLabel: { color: '#A0AEC0', fontSize: 13 },
    statValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    rpCost: { color: theme.colors.accent, fontSize: 13, fontWeight: '700' },
    upgradeBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: 8, alignItems: 'center' },
    upgradeBtnDisabled: { backgroundColor: '#4A5568', opacity: 0.5 },
    upgradeBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

    controlGroup: { marginBottom: 20 },
    controlTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
    controlValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2D3748', padding: 8, borderRadius: 8 },
    adjBtn: { width: 36, height: 36, backgroundColor: '#4A5568', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    adjText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    hint: { fontSize: 11, color: '#718096', marginTop: 4, textAlign: 'right' },
    realStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    realStatsText: { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
});