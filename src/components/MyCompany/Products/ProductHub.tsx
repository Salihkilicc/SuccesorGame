import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { useProductManagement } from './useProductManagement';
import ProductDetailModal from './ProductDetailModal';
import NewProductWizard from './NewProductWizard';

const ProductHub = () => {
    const { products, availableCapacity } = useProductManagement();
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isWizardVisible, setWizardVisible] = useState(false);

    const canAddProduct = products.length < 6;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏭 Products</Text>
                <View style={styles.capacityBadge}>
                    <Text style={styles.capacityText}>
                        Capacity: {availableCapacity.toLocaleString()}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}>
                {products.map((product) => (
                    <Pressable
                        key={product.id}
                        onPress={() => setSelectedProductId(product.id)}
                        style={({ pressed }) => [
                            styles.productCard,
                            pressed && styles.productCardPressed,
                        ]}>
                        <View style={styles.productHeader}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    product.revenue > 0 ? styles.statusActive : styles.statusInactive,
                                ]}>
                                <Text style={styles.statusText}>
                                    {product.revenue > 0 ? 'Active' : 'New'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.productType}>{product.type}</Text>
                        <View style={styles.productStats}>
                            <View style={styles.stat}>
                                <Text style={styles.statLabel}>Revenue</Text>
                                <Text style={styles.statValue}>
                                    ${(product.revenue / 1000).toFixed(0)}k
                                </Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statLabel}>Production</Text>
                                <Text style={styles.statValue}>
                                    {product.production.allocated.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                ))}

                {canAddProduct && (
                    <Pressable
                        onPress={() => setWizardVisible(true)}
                        style={({ pressed }) => [
                            styles.newProductCard,
                            pressed && styles.newProductCardPressed,
                        ]}>
                        <Text style={styles.newProductIcon}>+</Text>
                        <Text style={styles.newProductText}>New Product</Text>
                        <Text style={styles.newProductHint}>
                            {6 - products.length} slots remaining
                        </Text>
                    </Pressable>
                )}
            </ScrollView>

            {selectedProductId && (
                <ProductDetailModal
                    productId={selectedProductId}
                    visible={!!selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}

            <NewProductWizard
                visible={isWizardVisible}
                onClose={() => setWizardVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.title,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    capacityBadge: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    capacityText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    productList: {
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    productCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.sm,
    },
    productCardPressed: {
        backgroundColor: theme.colors.cardSoft,
        transform: [{ scale: 0.98 }],
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusActive: {
        backgroundColor: theme.colors.success,
    },
    statusInactive: {
        backgroundColor: theme.colors.cardSoft,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
    },
    productType: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    productStats: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
        marginTop: theme.spacing.xs,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    newProductCard: {
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    newProductCardPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.98 }],
    },
    newProductIcon: {
        fontSize: 32,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    newProductText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    newProductHint: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
});

export default ProductHub;
