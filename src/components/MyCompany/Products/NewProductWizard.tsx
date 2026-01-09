import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from 'react-native';
import { theme } from '../../../core/theme';
import { useProductManagement } from './useProductManagement';
import { useProductStore, DEFAULT_SUPPLIERS } from '../../../core/store/useProductStore';
import { useStatsStore, TechLevels } from '../../../core/store/useStatsStore';
import GameModal from '../../common/GameModal';
import GameButton from '../../common/GameButton';
import SectionCard from '../../common/SectionCard';

interface Props {
    visible: boolean;
    onClose: () => void;
}

// Map custom types to base types for supplier logic
const TYPE_MAPPING: Record<string, string> = {
    'Electronic Accessories': 'Electronics',
    'MyPhone': 'Smartphones',
    'MyPad': 'Tablets',
    'MyMac': 'Laptops',
    'MyWatch': 'Wearables',
    'MyPods': 'Audio',
    'MyCar': 'Automotive',
    'MyVision': 'VR',
};

// Fixed market data for each product type
const MARKET_DATA: Record<string, { demand: number; competition: number }> = {
    'Electronic Accessories': { demand: 85, competition: 90 },
    'MyPhone': { demand: 60, competition: 80 },
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
    { id: 'myphone', label: 'MyPhone', type: 'MyPhone', req: { category: 'hardware', level: 1 }, estCost: '$250-$400', capacityWeight: 2 },
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
        const baseType = TYPE_MAPPING[selectedDef.type] || 'Electronics';
        const suppliers = DEFAULT_SUPPLIERS[baseType] || DEFAULT_SUPPLIERS['Electronics'];
        let defaultSupplier = { ...suppliers[0] };

        // Apply ChipMaster effect (10% cost reduction)
        const { acquisitions } = useStatsStore.getState();
        if (Array.isArray(acquisitions) && acquisitions.includes('chipMaster')) {
            defaultSupplier.cost = Math.floor(defaultSupplier.cost * 0.9);
        }

        const marketData = currentMarketData || { demand: 50, competition: 50 };

        // Apply MyAI Integration effect
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
                allocated: 0,
                capacity: availableCapacity,
                weight: selectedDef.capacityWeight || 1,
            },
            pricing: {
                salePrice: defaultSupplier.cost * 2.0,
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

    const handleClose = () => {
        // Reset state
        setTimeout(() => {
            setStep(1);
            setSelectedDef(null);
            setMarketResearched(false);
        }, 300);
        onClose();
    };

    const handleBack = () => {
        setStep(1);
        setSelectedDef(null);
        setMarketResearched(false);
    };

    const isLocked = (def: ProductDef) => {
        if (!def.req) return false;
        return techLevels[def.req.category] < def.req.level;
    };

    return (
        <GameModal
            visible={visible}
            onClose={handleClose}
            title={step === 1 ? "✨ Select Product" : `Market Research: ${selectedDef?.label}`}
            subtitle={step === 1 ? "Step 1 of 2: Choose Line" : "Step 2 of 2: Analyze & Launch"}
        >
            <View style={{ gap: 16, height: '100%' }}>
                {step === 1 && (
                    <FlatList
                        data={PRODUCT_DEFINITIONS}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ gap: 8 }}
                        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
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
                                        styles.gridCard,
                                        (locked || isActiveOwned) && styles.gridCardLocked,
                                        isActiveOwned && styles.gridCardOwned,
                                        pressed && !locked && !isActiveOwned && styles.gridCardPressed,
                                    ]}
                                >
                                    <View>
                                        <Text style={[styles.cardTitle, (locked || isActiveOwned) && styles.textLocked]}>{item.label}</Text>
                                        {isActiveOwned && <Text style={styles.activeLabel}>ACTIVE</Text>}
                                        {!locked && !isActiveOwned && (
                                            <View style={{ marginTop: 4 }}>
                                                <Text style={styles.metaText}>{item.estCost}</Text>
                                                <Text style={styles.metaText}>Cap: {item.capacityWeight}x</Text>
                                            </View>
                                        )}
                                        {locked && (
                                            <Text style={styles.lockText}>
                                                🔒 Req: {item.req?.category} Lv{item.req?.level}
                                            </Text>
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                )}

                {step === 2 && selectedDef && (
                    <View style={{ gap: 16, flex: 1 }}>
                        <SectionCard
                            title="Research Quote"
                            rightText="$50,000"
                        />

                        {!marketResearched ? (
                            <View style={{ marginTop: 'auto', gap: 8 }}>
                                <GameButton
                                    title="Perform Analysis"
                                    variant="primary"
                                    onPress={handleMarketSearch}
                                />
                                <GameButton
                                    title="Back"
                                    variant="secondary"
                                    onPress={handleBack}
                                />
                            </View>
                        ) : (
                            <>
                                <View style={styles.resultsCard}>
                                    <Text style={styles.resultsTitle}>✓ Market Analysis Complete</Text>
                                    {currentMarketData && (
                                        <View style={{ gap: 12 }}>
                                            <View>
                                                <Text style={styles.statLabel}>Demand</Text>
                                                <View style={styles.barBg}>
                                                    <View style={[styles.barFill, { width: `${currentMarketData.demand}%`, backgroundColor: theme.colors.success }]} />
                                                </View>
                                                <Text style={styles.statValue}>{currentMarketData.demand}%</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.statLabel}>Competition</Text>
                                                <View style={styles.barBg}>
                                                    <View style={[styles.barFill, { width: `${currentMarketData.competition}%`, backgroundColor: theme.colors.danger }]} />
                                                </View>
                                                <Text style={styles.statValue}>{currentMarketData.competition}%</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View style={{ marginTop: 'auto', gap: 8 }}>
                                    <GameButton
                                        title="🚀 Launch Product"
                                        variant="primary" // Could be 'success' color if available, but primary is fine
                                        onPress={handleLaunch}
                                        style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }} // Custom override for success green
                                    />
                                    <GameButton
                                        title="Back"
                                        variant="secondary"
                                        onPress={handleBack}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}
            </View>
        </GameModal>
    );
};

const styles = StyleSheet.create({
    gridCard: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridCardLocked: {
        backgroundColor: theme.colors.background,
        opacity: 0.6,
    },
    gridCardOwned: {
        borderColor: theme.colors.success,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    gridCardPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.98 }],
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    textLocked: {
        color: theme.colors.textSecondary,
    },
    activeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.success,
        textAlign: 'center',
        marginTop: 4,
    },
    metaText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    lockText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 4,
    },
    resultsCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    resultsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
        textAlign: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    barBg: {
        height: 8,
        backgroundColor: theme.colors.card,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        textAlign: 'right',
        marginTop: 2,
    },
});

export default NewProductWizard;
