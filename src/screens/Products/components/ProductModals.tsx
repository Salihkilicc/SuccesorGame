import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme'; // Tema yolunu kontrol et
import { Product } from '../../../features/products/data/productsData';

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

// --- DETAIL MODAL ---
export const ProductDetailModal = ({ visible, product, onClose, onUpdate, onRetire, getTip }: any) => {
    if (!product) return null;

    const [production, setProduction] = useState(product.productionLevel || 50);
    const [price, setPrice] = useState(product.sellingPrice || 0);
    const [marketing, setMarketing] = useState(product.marketingBudget || 0);

    const handleSave = () => {
        onUpdate(product.id, { productionLevel: production, sellingPrice: price, marketingBudget: marketing });
        onClose();
    };

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    // Calculate Real Production Units (Base 1.5M * Percentage)
    const BASE_CAPACITY = 1500000;
    const estimatedUnits = Math.round(BASE_CAPACITY * (production / 100));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { height: '85%' }]}>
                    <View style={styles.headerRow}>
                        <Text style={styles.modalTitle}>{product.icon} {product.name}</Text>
                        <Pressable onPress={onClose}><Text style={styles.closeIcon}>✕</Text></Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Insight */}
                        <View style={styles.insightBox}>
                            <Text style={styles.insightTitle}>💡 AI Insight</Text>
                            <Text style={styles.insightText}>{getTip(product)}</Text>
                        </View>

                        {/* Production Slider Sim */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>Production Capacity</Text>
                            <View style={styles.sliderRow}>
                                <Pressable onPress={() => setProduction(Math.max(0, production - 10))} style={styles.adjBtn}><Text style={styles.adjText}>-</Text></Pressable>
                                <Text style={styles.controlValue}>{production}%</Text>
                                <Pressable onPress={() => setProduction(Math.min(100, production + 10))} style={styles.adjBtn}><Text style={styles.adjText}>+</Text></Pressable>
                            </View>

                            {/* NEW: Real Numbers Display */}
                            <View style={styles.realStatsRow}>
                                <Text style={styles.realStatsText}>Output: {formatNumber(estimatedUnits)} Units</Text>
                                <Text style={styles.hint}>Market Demand: {product.marketDemand}%</Text>
                            </View>
                        </View>

                        {/* Price Sim */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>Selling Price</Text>
                            <View style={styles.sliderRow}>
                                <Pressable onPress={() => setPrice(Math.max(0, price - 5))} style={styles.adjBtn}><Text style={styles.adjText}>-</Text></Pressable>
                                <Text style={styles.controlValue}>${price}</Text>
                                <Pressable onPress={() => setPrice(price + 5)} style={styles.adjBtn}><Text style={styles.adjText}>+</Text></Pressable>
                            </View>
                            <Text style={styles.hint}>Suggested: ${product.suggestedPrice}</Text>
                        </View>

                        {/* Marketing Sim */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>Marketing Budget</Text>
                            <View style={styles.sliderRow}>
                                <Pressable onPress={() => setMarketing(Math.max(0, marketing - 1000))} style={styles.adjBtn}><Text style={styles.adjText}>-</Text></Pressable>
                                <Text style={styles.controlValue}>${marketing}</Text>
                                <Pressable onPress={() => setMarketing(marketing + 1000)} style={styles.adjBtn}><Text style={styles.adjText}>+</Text></Pressable>
                            </View>
                        </View>

                        <Pressable style={styles.btnPrimary} onPress={handleSave}>
                            <Text style={styles.btnText}>Save Changes</Text>
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
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
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
    btnGhost: { padding: 14, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
    ghostText: { color: '#A0AEC0', fontWeight: '600' },
    closeIcon: { fontSize: 24, color: '#A0AEC0' },
    insightBox: { backgroundColor: theme.colors.cardSoft, padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
    insightTitle: { color: theme.colors.accent, fontWeight: '700', marginBottom: 4 },
    insightText: { color: '#E2E8F0', fontSize: 13 },
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