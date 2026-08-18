import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import { useProductStore } from '../../../core/store/useProductStore';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { canUnlockAnotherCategory } from '../../../core/market/brand';
import { UnlockableProduct, ProductCategory } from '../data/unlockableProductsData';
import { ProductUnlockModal } from '../components';
import { formatNumber, formatMoney, formatRP, formatCompact } from '../../../core/utils';
import ScreenHeader from '../../../components/common/ScreenHeader';
import InfoDot from '../../../components/common/InfoDot';

const TechTreeScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { unlockableProducts } = useProductStore();
    const [selectedProduct, setSelectedProduct] = useState<UnlockableProduct | null>(null);

    // ------------------------------------------------------------------
    //  WHAT YOU HAVE, NOT JUST WHAT THINGS COST
    // ------------------------------------------------------------------
    //  The screen listed a price against every product and never once showed
    //  the balance those prices are measured against. You could read the whole
    //  tree and still not know whether a single row was within reach - the
    //  only way to find out was to tap one and be refused.
    //
    //  Two separate things gate an unlock and neither was visible here: the
    //  RP and cash cost, and the CATEGORY GATE - you cannot open a new market
    //  until every market you already trade in is at 200 brand points. Being
    //  refused for a reason the screen never mentioned is what made this page
    //  feel arbitrary.
    // ------------------------------------------------------------------
    const totalRP = useLaboratoryStore(st => st.totalRP);
    const companyCapital = useStatsStore(st => st.companyCapital);
    const brandByCategory = useStatsStore(st => st.brandByCategory);

    const activeCategories = Object.keys(brandByCategory || {});
    const gate = canUnlockAnotherCategory(brandByCategory || {}, activeCategories);

    /** Is this category already one of ours, or would opening it need the gate? */
    const categoryOpen = (category: ProductCategory) =>
        activeCategories.length === 0
        || (brandByCategory || {})[category] !== undefined
        || gate.allowed;

    const getCategoryIcon = (category: ProductCategory) => {
        switch (category) {
            case 'Consumer': return '📱';
            case 'Robotics': return '🤖';
            case 'Bio-Tech': return '🧬'; // Changed from Health
            case 'Deep Tech': return '⚡'; // Changed from Energy
            default: return '🔬';
        }
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
            <ScreenHeader
                title={t('product.futureTechnologies')}
                right={
                    /* The balance every price on this page is measured against. */
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <InfoDot
                            title={t('tactic.rdTitle')}
                            text={t('tactic.rdText')}
                            detail={t('tactic.rdDetail')}
                        />
                        <View style={styles.balance}>
                            <Text style={[styles.balanceValue, styles.rpFigure]}>{formatRP(totalRP)}</Text>
                            <Text style={styles.balanceCash}>{formatMoney(companyCapital)}</Text>
                        </View>
                    </View>
                }
            />

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

                            {/* Say WHY a category is shut before the player
                                spends a tap finding out. */}
                            {!categoryOpen(category) && (
                                <Text style={styles.gateNote}>
                                    {t('product.techGateNote', {
                                        v1: gate.weakest || '-',
                                        v2: Math.round(gate.have),
                                        v3: gate.required,
                                    })}
                                </Text>
                            )}

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
                                                <Text style={styles.stockBoostLabel}>{t('product.stockBoostV1', { v1: product.stockBoost })}</Text>
                                            )}
                                        </View>

                                        {/* Right: Status */}
                                        <View style={styles.statusContainer}>
                                            {product.isUnlocked ? (
                                                <View style={styles.activeBadge}>
                                                    <Text style={styles.activeText}>{t('product.active')}</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.lockedStatus}>
                                                    <View style={styles.costRow}>
                                                        <Text style={styles.lockIcon}>🔒</Text>
                                                        <Text
                                                            style={[
                                                                styles.costText,
                                                                totalRP >= product.unlockRPCost && styles.rpFigure,
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {formatRP(product.unlockRPCost)}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.costCash,
                                                            companyCapital >= product.unlockCashCost && styles.costAffordable,
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {formatMoney(product.unlockCashCost)}
                                                    </Text>
                                                    {totalRP < product.unlockRPCost && (
                                                        <Text style={styles.shortfall} numberOfLines={1}>
                                                            {formatCompact(product.unlockRPCost - totalRP)} short
                                                        </Text>
                                                    )}
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
        backgroundColor: theme.colors.surfaceRaised,
        borderColor: theme.colors.accent,
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
        backgroundColor: theme.colors.accent + '20', // Light green bg
    },
    productIcon: {
        fontSize: 24,
    },
    productInfo: {
        flex: 1,
        marginRight: 10,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    productNameUnlocked: {
        // "Unlocked" is a state, not a profit.
        color: theme.colors.textPrimary,
    },
    stockBoostLabel: {
        fontSize: 11,
        color: theme.colors.warning,
        marginTop: 2,
    },
    statusContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 90,
        flexShrink: 0,
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: theme.colors.accent,
    },
    activeText: {
        color: theme.colors.onLight,
        fontWeight: '800',
        fontSize: 10,
    },
    lockedStatus: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    lockIcon: {
        fontSize: 11,
        color: theme.colors.textMuted,
    },
    costText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },
    costCash: {
        fontSize: 10.5,
        color: theme.colors.textMuted,
        marginTop: 1,
    },
    /** Within reach. Not green - affording something is not a profit. */
    costAffordable: {
        color: theme.colors.textPrimary,
    },
    /**
     * Every RP figure in the app wears this. Research is the one resource
     * that is neither money nor a rate, and it was being drawn in whatever
     * colour the surrounding text happened to be - white here, muted there,
     * and the profit green on the laboratory screen.
     */
    rpFigure: {
        color: theme.colors.rp,
    },
    shortfall: {
        fontSize: 9.5,
        color: theme.colors.warning,
        marginTop: 1,
    },
    balance: {
        alignItems: 'flex-end',
    },
    balanceValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    balanceCash: {
        fontSize: 10.5,
        color: theme.colors.textSecondary,
        marginTop: 1,
    },
    gateNote: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        color: theme.colors.warning,
        fontSize: 11.5,
        lineHeight: 16,
    },
});

export default TechTreeScreen;
