import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import { useProductStore } from '../../../core/store/useProductStore';
import { UnlockableProduct, ProductCategory } from '../data/unlockableProductsData';
import { ProductUnlockModal } from '../components';

const TechTreeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { unlockableProducts } = useProductStore();
    const [selectedProduct, setSelectedProduct] = useState<UnlockableProduct | null>(null);

    const getCategoryIcon = (category: ProductCategory) => {
        switch (category) {
            case 'Consumer': return '📱';
            case 'Robotics': return '🤖';
            case 'Bio-Tech': return '🧬'; // Changed from Health
            case 'Deep Tech': return '⚡'; // Changed from Energy
            default: return '🔬';
        }
    };

    const formatRPShort = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M RP`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K RP`;
        return `${value} RP`;
    };

    const groupedProducts = unlockableProducts.reduce((acc: Record<ProductCategory, UnlockableProduct[]>, product: UnlockableProduct) => {
        if (!acc[product.category]) {
            acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
    }, {} as Record<ProductCategory, UnlockableProduct[]>);

    const categories: ProductCategory[] = ['Consumer', 'Robotics', 'Bio-Tech', 'Deep Tech'];

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </Pressable>
                <Text style={styles.title}>Future Technologies</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
            >
                {categories.map((category) => {
                    const products = groupedProducts[category] || [];
                    if (products.length === 0) return null;

                    return (
                        <View key={category} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                                <Text style={styles.categoryTitle}>{category}</Text>
                            </View>

                            <View style={styles.productsList}>
                                {products.map((product) => (
                                    <Pressable
                                        key={product.id}
                                        style={[
                                            styles.productRow,
                                            product.isUnlocked && styles.productRowUnlocked
                                        ]}
                                        onPress={() => !product.isUnlocked && setSelectedProduct(product)}
                                    >
                                        {/* Left: Icon Placeholder */}
                                        <View style={[styles.iconPlaceholder, product.isUnlocked && styles.iconUnlocked]}>
                                            <Text style={styles.productIcon}>{getCategoryIcon(product.category)}</Text>
                                        </View>

                                        {/* Middle: Product Name */}
                                        <View style={styles.productInfo}>
                                            <Text style={[styles.productName, product.isUnlocked && styles.productNameUnlocked]}>
                                                {product.name}
                                            </Text>
                                            {product.isUnlocked && (
                                                <Text style={styles.stockBoostLabel}>
                                                    Stock Boost: +{product.stockBoost}%
                                                </Text>
                                            )}
                                        </View>

                                        {/* Right: Status */}
                                        <View style={styles.statusContainer}>
                                            {product.isUnlocked ? (
                                                <View style={styles.activeBadge}>
                                                    <Text style={styles.activeText}>ACTIVE</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.lockedStatus}>
                                                    <Text style={styles.lockIcon}>🔒</Text>
                                                    <Text style={styles.costText}>{formatRPShort(product.unlockRPCost)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {selectedProduct && (
                <ProductUnlockModal
                    product={selectedProduct}
                    visible={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backButtonText: {
        fontSize: 24,
        color: theme.colors.textPrimary,
        lineHeight: 28,
        marginTop: -2,
    },
    title: {
        fontSize: 28, // Bigger title per design
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    categorySection: {
        marginBottom: theme.spacing.lg,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background, // Sticky header feel
    },
    categoryIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    productsList: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    productRowUnlocked: {
        backgroundColor: '#1A2E1A', // Dark green tint for unlocked
        borderColor: theme.colors.success,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconUnlocked: {
        backgroundColor: theme.colors.success + '20', // Light green bg
    },
    productIcon: {
        fontSize: 24,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    productNameUnlocked: {
        color: theme.colors.success,
    },
    stockBoostLabel: {
        fontSize: 11,
        color: theme.colors.success,
        marginTop: 2,
    },
    statusContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 80,
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: theme.colors.success,
    },
    activeText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 10,
    },
    lockedStatus: {
        alignItems: 'flex-end',
    },
    lockIcon: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginBottom: 2,
    },
    costText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
});

export default TechTreeScreen;
