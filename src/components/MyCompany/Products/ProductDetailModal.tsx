import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    FlatList,
} from 'react-native';
import { theme } from '../../../theme';
import { useProductManagement } from './useProductManagement';
import { Supplier } from '../../../store/useProductStore';

interface Props {
    productId: string;
    visible: boolean;
    onClose: () => void;
}

const ProductDetailModal = ({ productId, visible, onClose }: Props) => {
    const { allProducts, updateProduct, retireProduct, generateSuppliers, performMarketSearch } =
        useProductManagement();
    const product = allProducts.find((p) => p.id === productId);

    const [showSuppliers, setShowSuppliers] = useState(false);
    const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([]);

    if (!product) return null;

    const handleFindSuppliers = () => {
        const options = generateSuppliers(product.type, product.supplier);
        setSupplierOptions(options);
        setShowSuppliers(true);
    };

    const handleSelectSupplier = (supplier: Supplier) => {
        updateProduct(productId, { supplier });
        setShowSuppliers(false);
    };

    const handleMarketSearch = () => {
        const success = performMarketSearch(productId);
        if (!success) {
            console.log('Insufficient funds for market search!');
        }
    };

    const handlePriceChange = (delta: number) => {
        const newPrice = Math.max(1, product.pricing.salePrice + delta);
        updateProduct(productId, {
            pricing: { salePrice: newPrice },
        });
    };

    const handleCapacityChange = (value: number) => {
        updateProduct(productId, {
            production: { ...product.production, allocated: value },
        });
    };

    const handleRetire = () => {
        retireProduct(productId);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{product.name}</Text>
                            <Text style={styles.subtitle}>{product.type}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>×</Text>
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Supplier Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SUPPLIER</Text>
                            <View style={styles.supplierCard}>
                                <Text style={styles.supplierName}>{product.supplier.name}</Text>
                                <View style={styles.supplierStats}>
                                    <Text style={styles.supplierStat}>
                                        Cost: ${product.supplier.cost}
                                    </Text>
                                    <Text style={styles.supplierStat}>
                                        Quality: {product.supplier.quality}%
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={handleFindSuppliers}
                                style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
                                <Text style={styles.btnText}>Find New Suppliers</Text>
                            </Pressable>

                            {showSuppliers && (
                                <View style={styles.supplierList}>
                                    {supplierOptions.map((supplier, idx) => (
                                        <Pressable
                                            key={idx}
                                            onPress={() => handleSelectSupplier(supplier)}
                                            style={({ pressed }) => [
                                                styles.supplierOption,
                                                pressed && styles.supplierOptionPressed,
                                            ]}>
                                            <Text style={styles.supplierOptionName}>{supplier.name}</Text>
                                            <View style={styles.supplierOptionStats}>
                                                <Text style={styles.supplierOptionStat}>
                                                    ${supplier.cost}
                                                </Text>
                                                <Text style={styles.supplierOptionStat}>
                                                    Q: {supplier.quality}%
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Production Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PRODUCTION</Text>
                            <View style={styles.productionCard}>
                                <Text style={styles.productionLabel}>
                                    Allocated: {product.production.allocated.toLocaleString()} units
                                </Text>
                                <View style={styles.productionControls}>
                                    <Pressable
                                        onPress={() => handleCapacityChange(product.production.allocated - 100)}
                                        style={styles.productionBtn}>
                                        <Text style={styles.productionBtnText}>-100</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleCapacityChange(product.production.allocated + 100)}
                                        style={styles.productionBtn}>
                                        <Text style={styles.productionBtnText}>+100</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        {/* Pricing Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PRICING</Text>
                            <View style={styles.pricingCard}>
                                <Text style={styles.priceValue}>${product.pricing.salePrice}</Text>
                                <View style={styles.pricingControls}>
                                    <Pressable
                                        onPress={() => handlePriceChange(-5)}
                                        style={styles.priceBtn}>
                                        <Text style={styles.priceBtnText}>-$5</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handlePriceChange(5)}
                                        style={styles.priceBtn}>
                                        <Text style={styles.priceBtnText}>+$5</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        {/* Market Intelligence */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>MARKET INTELLIGENCE</Text>
                            {!product.market.researched ? (
                                <Pressable
                                    onPress={handleMarketSearch}
                                    style={({ pressed }) => [
                                        styles.btn,
                                        styles.btnPrimary,
                                        pressed && styles.btnPressed,
                                    ]}>
                                    <Text style={[styles.btnText, { color: '#000' }]}>
                                        Perform Market Search ($50k)
                                    </Text>
                                </Pressable>
                            ) : (
                                <View style={styles.marketCard}>
                                    <View style={styles.marketStat}>
                                        <Text style={styles.marketLabel}>Demand</Text>
                                        <View style={styles.marketBar}>
                                            <View
                                                style={[
                                                    styles.marketBarFill,
                                                    { width: `${product.market.demand}%` },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.marketValue}>{product.market.demand}%</Text>
                                    </View>
                                    <View style={styles.marketStat}>
                                        <Text style={styles.marketLabel}>Competition</Text>
                                        <View style={styles.marketBar}>
                                            <View
                                                style={[
                                                    styles.marketBarFill,
                                                    styles.marketBarDanger,
                                                    { width: `${product.market.competition}%` },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.marketValue}>{product.market.competition}%</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Retire Button */}
                        <Pressable
                            onPress={handleRetire}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnDanger,
                                pressed && styles.btnPressed,
                            ]}>
                            <Text style={[styles.btnText, { color: theme.colors.danger }]}>
                                Retire Product
                            </Text>
                        </Pressable>
                    </ScrollView>
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
        maxHeight: '90%',
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
    scrollContent: {
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    section: {
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
    },
    supplierCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    supplierName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    supplierStats: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    supplierStat: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    supplierList: {
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
    },
    supplierOption: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    supplierOptionPressed: {
        backgroundColor: theme.colors.card,
    },
    supplierOptionName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    supplierOptionStats: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    supplierOptionStat: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    productionCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    productionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    productionControls: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    productionBtn: {
        flex: 1,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    productionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    pricingCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    pricingControls: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    priceBtn: {
        backgroundColor: theme.colors.card,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    priceBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    marketCard: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
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
    btnDanger: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.danger,
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

export default ProductDetailModal;
