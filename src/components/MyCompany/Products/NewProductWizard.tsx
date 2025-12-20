import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
} from 'react-native';
import { theme } from '../../../theme';
import { useProductManagement } from './useProductManagement';
import { useProductStore, PRODUCT_TYPES, DEFAULT_SUPPLIERS } from '../../../store/useProductStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

// Fixed market data for each product type
const MARKET_DATA: Record<string, { demand: number; competition: number }> = {
    'Electronics': { demand: 75, competition: 65 },
    'Clothing': { demand: 80, competition: 70 },
    'Food & Beverage': { demand: 85, competition: 60 },
    'Furniture': { demand: 60, competition: 50 },
    'Cosmetics': { demand: 70, competition: 75 },
    'Toys': { demand: 65, competition: 55 },
    'Sports Equipment': { demand: 55, competition: 60 },
    'Books & Media': { demand: 50, competition: 45 },
};

const NewProductWizard = ({ visible, onClose }: Props) => {
    // ALL HOOKS MUST BE CALLED FIRST, UNCONDITIONALLY
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [marketResearched, setMarketResearched] = useState(false);

    const productManagement = useProductManagement();
    const addProduct = useProductStore((state) => state.addProduct);

    // NOW we can use the values
    const availableCapacity = productManagement.availableCapacity;
    const currentMarketData = selectedType ? MARKET_DATA[selectedType] : null;

    const handleSelectType = (type: string) => {
        setSelectedType(type);
        setMarketResearched(false);
        setStep(2);
    };

    const handleMarketSearch = () => {
        if (!selectedType) return;
        setMarketResearched(true);
    };

    const handleLaunch = () => {
        if (!selectedType) return;

        const tempId = `product_${Date.now()}`;
        const defaultSupplier = DEFAULT_SUPPLIERS[selectedType][0];
        const marketData = MARKET_DATA[selectedType] || { demand: 50, competition: 50 };

        const newProduct = {
            id: tempId,
            name: `New ${selectedType}`,
            type: selectedType,
            supplier: defaultSupplier,
            production: {
                allocated: Math.min(1000, availableCapacity),
                capacity: availableCapacity,
            },
            pricing: {
                salePrice: defaultSupplier.cost * 2.5,
            },
            market: {
                demand: marketData.demand,
                competition: marketData.competition,
                researched: true,
            },
            revenue: 0,
            status: 'active' as const,
        };

        addProduct(newProduct);
        handleClose();
    };

    const handleCancelProduct = () => {
        setStep(1);
        setSelectedType(null);
        setMarketResearched(false);
    };

    const handleClose = () => {
        setStep(1);
        setSelectedType(null);
        setMarketResearched(false);
        onClose();
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
                                <Text style={styles.stepTitle}>Select Product Type</Text>
                                <FlatList
                                    data={PRODUCT_TYPES}
                                    keyExtractor={(item) => item}
                                    numColumns={2}
                                    contentContainerStyle={styles.typeGrid}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            onPress={() => handleSelectType(item)}
                                            style={({ pressed }) => [
                                                styles.typeCard,
                                                pressed && styles.typeCardPressed,
                                            ]}>
                                            <Text style={styles.typeText}>{item}</Text>
                                        </Pressable>
                                    )}
                                />
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.stepContainer}>
                                <Text style={styles.stepTitle}>Market Research Required</Text>
                                <Text style={styles.stepDescription}>
                                    Before launching {selectedType}, you must perform market research to
                                    understand demand and competition.
                                </Text>
                                <View style={styles.costCard}>
                                    <Text style={styles.costLabel}>Research Cost</Text>
                                    <Text style={styles.costValue}>$50,000</Text>
                                </View>

                                {!marketResearched ? (
                                    <Pressable
                                        onPress={handleMarketSearch}
                                        style={({ pressed }) => [
                                            styles.btn,
                                            styles.btnPrimary,
                                            pressed && styles.btnPressed,
                                        ]}>
                                        <Text style={[styles.btnText, { color: '#000' }]}>
                                            Perform Market Search
                                        </Text>
                                    </Pressable>
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
                                                onPress={handleCancelProduct}
                                                style={({ pressed }) => [
                                                    styles.btn,
                                                    styles.btnSecondary,
                                                    pressed && styles.btnPressed,
                                                ]}>
                                                <Text style={styles.btnText}>
                                                    Look for Another Product
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
        borderColor: theme.colors.border,
        minHeight: 80,
        justifyContent: 'center',
    },
    typeCardPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.96 }],
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        textAlign: 'center',
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
        backgroundColor: theme.colors.success,
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
