import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import { theme } from '../../../theme';
import { useProductManagement } from './useProductManagement';
import { useProductStore, DEFAULT_SUPPLIERS } from '../../../store/useProductStore';
import { useStatsStore, TechLevels } from '../../../store/useStatsStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

// Map custom types to base types for supplier logic
const TYPE_MAPPING: Record<string, string> = {
    'Electronic Accessories': 'Electronics', // Maps to cheap electronics
    'MyPhone': 'Smartphones', // Will need specific handling
    'MyPad': 'Tablets',
    'MyMac': 'Laptops',
    'MyWatch': 'Wearables',
    'MyPods': 'Audio',
    'MyCar': 'Automotive',
    'MyVision': 'VR',
};

// Fixed market data for each product type
const MARKET_DATA: Record<string, { demand: number; competition: number }> = {
    'Electronic Accessories': { demand: 85, competition: 90 }, // High Demand, High Comp
    'MyPhone': { demand: 60, competition: 80 }, // Start mid demand, high comp
    'MyPad': { demand: 70, competition: 70 },
    'MyMac': { demand: 75, competition: 65 },
    'MyWatch': { demand: 65, competition: 60 },
    'MyPods': { demand: 80, competition: 65 },
    'MyCar': { demand: 95, competition: 85 },
    'MyVision': { demand: 88, competition: 50 },
    'Electronics': { demand: 75, competition: 65 },
};

interface ProductDef {
    id: string;
    label: string;
    type: string;
    req?: { category: keyof TechLevels; level: number };
    estCost: string;
    capacityWeight: number;
}

const PRODUCT_DEFINITIONS: ProductDef[] = [
    { id: 'accessories', label: 'Electronic Accessories', type: 'Electronic Accessories', estCost: '$5-$15', capacityWeight: 1 },
    { id: 'myphone', label: 'MyPhone', type: 'MyPhone', req: { category: 'hardware', level: 1 }, estCost: '$250-$400', capacityWeight: 2 }, // Actually Lvl 1 is start, so practically unlocked
    { id: 'mypad', label: 'MyPad', type: 'MyPad', req: { category: 'hardware', level: 2 }, estCost: '$150-$250', capacityWeight: 3 },
    { id: 'mymac', label: 'MyMac', type: 'MyMac', req: { category: 'hardware', level: 3 }, estCost: '$400-$700', capacityWeight: 5 },
    { id: 'mywatch', label: 'MyWatch', type: 'MyWatch', req: { category: 'hardware', level: 4 }, estCost: '$50-$100', capacityWeight: 1 },
    { id: 'mypods', label: 'MyPods', type: 'MyPods', req: { category: 'hardware', level: 4 }, estCost: '$30-$60', capacityWeight: 1 },
    { id: 'mycar', label: 'MyCar', type: 'MyCar', req: { category: 'future', level: 2 }, estCost: '$25k-$35k', capacityWeight: 50 },
    { id: 'myvision', label: 'MyVision', type: 'MyVision', req: { category: 'future', level: 3 }, estCost: '$1.5k-$2.5k', capacityWeight: 5 },
];

const NewProductWizard = ({ visible, onClose }: Props) => {
    // ALL HOOKS MUST BE CALLED FIRST, UNCONDITIONALLY
    const [step, setStep] = useState(1);
    const [selectedDef, setSelectedDef] = useState<ProductDef | null>(null);
    const [marketResearched, setMarketResearched] = useState(false);

    const productManagement = useProductManagement();
    const addProduct = useProductStore((state) => state.addProduct);
    const { techLevels, companyCapital, setField } = useStatsStore();

    // NOW we can use the values
    const availableCapacity = productManagement.availableCapacity;
    const currentMarketData = selectedDef ? MARKET_DATA[selectedDef.type] || MARKET_DATA['Electronics'] : null;

    const handleSelectProduct = (def: ProductDef) => {
        // Check requirement
        if (def.req) {
            const currentLevel = techLevels[def.req.category] || 0;
            if (currentLevel < def.req.level) {
                Alert.alert(
                    'Investment Required',
                    `Research ${def.req.category.charAt(0).toUpperCase() + def.req.category.slice(1)} Level ${def.req.level} to unlock ${def.label}.`
                );
                return;
            }
        }

        setSelectedDef(def);
        setMarketResearched(false);
        setStep(2);
    };

    const handleMarketSearch = () => {
        if (!selectedDef) return;

        if (companyCapital < 50_000) {
            Alert.alert('Insufficient Funds', 'You need $50,000 for market research.');
            return;
        }

        setField('companyCapital', companyCapital - 50_000);
        setMarketResearched(true);
    };

    const handleLaunch = () => {
        if (!selectedDef) return;

        const tempId = `product_${Date.now()}`;

        // Resolve Supplier
        // Use mapping or fallback to 'Electronics'
        const baseType = TYPE_MAPPING[selectedDef.type] || 'Electronics';
        const suppliers = DEFAULT_SUPPLIERS[baseType] || DEFAULT_SUPPLIERS['Electronics'];
        let defaultSupplier = { ...suppliers[0] };

        // Apply ChipMaster effect (10% cost reduction)
        const { acquisitions } = useStatsStore.getState();
        if (acquisitions.chipMaster) {
            defaultSupplier.cost = Math.floor(defaultSupplier.cost * 0.9);
        }

        const marketData = currentMarketData || { demand: 50, competition: 50 };

        // Apply MyAI Integration effect (Demand Boost)
        let finalDemand = marketData.demand;
        if (techLevels.software >= 3) {
            finalDemand = Math.min(100, finalDemand + 15);
        }

        const newProduct = {
            id: tempId,
            name: selectedDef.label,
            type: selectedDef.type,
            supplier: defaultSupplier,
            production: {
                allocated: 0, // Start with 0 allocation
                capacity: availableCapacity,
                weight: selectedDef.capacityWeight || 1, // Add weight here
            },
            pricing: {
                salePrice: defaultSupplier.cost * 2.0, // Conservative start
            },
            market: {
                demand: finalDemand,
                competition: marketData.competition,
                researched: true,
            },
            revenue: 0,
            status: 'active' as const,
        };

        addProduct(newProduct);
        handleClose();
    };

    const handleBack = () => {
        setStep(1);
        setSelectedDef(null);
        setMarketResearched(false);
    };

    const handleClose = () => {
        setStep(1);
        setSelectedDef(null);
        setMarketResearched(false);
        onClose();
    };

    const isLocked = (def: ProductDef) => {
        if (!def.req) return false;
        return techLevels[def.req.category] < def.req.level;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>✨ New Product Wizard</Text>
                            <Text style={styles.subtitle}>Step {step} of 2</Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>×</Text>
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        {step === 1 && (
                            <View style={styles.stepContainer}>
                                <Text style={styles.stepTitle}>Select Product</Text>
                                <FlatList
                                    data={PRODUCT_DEFINITIONS}
                                    keyExtractor={(item) => item.id}
                                    numColumns={2}
                                    contentContainerStyle={styles.typeGrid}
                                    renderItem={({ item }) => {
                                        const locked = isLocked(item);
                                        const isActiveOwned = productManagement.products.some(
                                            p => p.type === item.type && p.status === 'active'
                                        );

                                        return (
                                            <Pressable
                                                onPress={() => {
                                                    if (isActiveOwned) {
                                                        Alert.alert('Limit Reached', 'You already have an active product line of this type. Please retire the existing one to launch a new version.');
                                                        return;
                                                    }
                                                    handleSelectProduct(item)
                                                }}
                                                disabled={locked}
                                                style={({ pressed }) => [
                                                    styles.typeCard,
                                                    (locked || isActiveOwned) && styles.typeCardLocked,
                                                    isActiveOwned && styles.typeCardOwned, // New style
                                                    pressed && !locked && !isActiveOwned && styles.typeCardPressed,
                                                ]}>
                                                <View style={styles.cardHeader}>
                                                    <Text style={[styles.typeText, (locked || isActiveOwned) && styles.typeTextLocked]}>
                                                        {item.label}
                                                    </Text>
                                                    {isActiveOwned && (
                                                        <View style={styles.activeBadge}>
                                                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {(!locked && !isActiveOwned) && (
                                                    <View style={{ marginTop: 4, alignItems: 'center' }}>
                                                        <Text style={styles.estCostText}>Cost: {item.estCost}</Text>
                                                        <Text style={styles.capWeightText}>🏭 Cap: {item.capacityWeight}x</Text>
                                                    </View>
                                                )}

                                                {locked && (
                                                    <Text style={styles.lockInfo}>
                                                        🔒 Req: {item.req?.category} Lv{item.req?.level}
                                                    </Text>
                                                )}
                                            </Pressable>
                                        );
                                    }}
                                />
                            </View>
                        )}

                        {step === 2 && selectedDef && (
                            <View style={styles.stepContainer}>
                                <Text style={styles.stepTitle}>Market Research: {selectedDef.label}</Text>
                                <Text style={styles.stepDescription}>
                                    Analyze the market demand and competition for {selectedDef.label}.
                                </Text>
                                <View style={styles.costCard}>
                                    <Text style={styles.costLabel}>Research Cost</Text>
                                    <Text style={styles.costValue}>$50,000</Text>
                                </View>

                                {!marketResearched ? (
                                    <View style={styles.buttonRow}>
                                        <Pressable
                                            onPress={handleBack}
                                            style={({ pressed }) => [
                                                styles.btn,
                                                styles.btnSecondary,
                                                pressed && styles.btnPressed,
                                            ]}>
                                            <Text style={styles.btnText}>Back</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={handleMarketSearch}
                                            style={({ pressed }) => [
                                                styles.btn,
                                                styles.btnPrimary,
                                                pressed && styles.btnPressed,
                                                { flex: 2 }
                                            ]}>
                                            <Text style={[styles.btnText, { color: '#000' }]}>
                                                Perform Analysis
                                            </Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.marketResultsCard}>
                                            <Text style={styles.marketResultsTitle}>✓ Market Analysis Complete</Text>

                                            {currentMarketData && (
                                                <>
                                                    <View style={styles.marketStat}>
                                                        <Text style={styles.marketLabel}>Demand</Text>
                                                        <View style={styles.marketBar}>
                                                            <View
                                                                style={[
                                                                    styles.marketBarFill,
                                                                    { width: `${currentMarketData.demand}%` },
                                                                ]}
                                                            />
                                                        </View>
                                                        <Text style={styles.marketValue}>{currentMarketData.demand}%</Text>
                                                    </View>

                                                    <View style={styles.marketStat}>
                                                        <Text style={styles.marketLabel}>Competition</Text>
                                                        <View style={styles.marketBar}>
                                                            <View
                                                                style={[
                                                                    styles.marketBarFill,
                                                                    styles.marketBarDanger,
                                                                    { width: `${currentMarketData.competition}%` },
                                                                ]}
                                                            />
                                                        </View>
                                                        <Text style={styles.marketValue}>{currentMarketData.competition}%</Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>

                                        <View style={styles.buttonRow}>
                                            <Pressable
                                                onPress={handleBack}
                                                style={({ pressed }) => [
                                                    styles.btn,
                                                    styles.btnSecondary,
                                                    pressed && styles.btnPressed,
                                                ]}>
                                                <Text style={styles.btnText}>
                                                    Back
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={handleLaunch}
                                                style={({ pressed }) => [
                                                    styles.btn,
                                                    styles.btnSuccess,
                                                    pressed && styles.btnPressed,
                                                ]}>
                                                <Text style={[styles.btnText, { color: '#000' }]}>
                                                    Launch Product
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        fontSize: 28,
        color: theme.colors.textSecondary,
        lineHeight: 28,
    },
    body: {
        padding: theme.spacing.lg,
    },
    stepContainer: {
        gap: theme.spacing.md,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    stepDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    typeGrid: {
        gap: theme.spacing.sm,
    },
    typeCard: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        margin: theme.spacing.xs / 2,
        borderWidth: 1,
        borderColor: theme.colors.accent,
        minHeight: 80,
        justifyContent: 'center',
    },
    typeCardLocked: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border,
        opacity: 0.6,
    },
    typeCardPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.96 }],
    },
    typeText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    typeTextLocked: {
        color: theme.colors.textSecondary,
    },
    estCostText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    capWeightText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    typeCardOwned: {
        opacity: 0.6,
        borderColor: theme.colors.success,
        borderWidth: 1,
    },
    cardHeader: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeBadge: {
        backgroundColor: theme.colors.success + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    activeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.success,
        textTransform: 'uppercase',
    },
    lockInfo: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    costCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    costLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    costValue: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    marketResultsCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    marketResultsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
        textAlign: 'center',
        marginBottom: 4,
    },
    marketStat: {
        gap: 4,
    },
    marketLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    marketBar: {
        height: 8,
        backgroundColor: theme.colors.card,
        borderRadius: 4,
        overflow: 'hidden',
    },
    marketBarFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
    },
    marketBarDanger: {
        backgroundColor: theme.colors.danger,
    },
    marketValue: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    btn: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    btnPrimary: {
        backgroundColor: theme.colors.accent,
    },
    btnSuccess: {
        flex: 1,
        backgroundColor: '#4CAF50',
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        borderColor: theme.colors.border,
    },
    btnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
});

export default NewProductWizard;
