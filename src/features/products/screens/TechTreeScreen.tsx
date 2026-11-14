import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useProductStore } from '../../../core/store/useProductStore';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { canUnlockAnotherCategory, CATEGORY_UNLOCK_BRAND } from '../../../core/market/brand';
import { getTier } from '../../../core/market/capacity';
import { UnlockableProduct, ProductCategory } from '../data/unlockableProductsData';
import { ProductUnlockModal } from '../components';
import { ProductIconBadge, getCategoryColor, getCategoryIconName } from '../components/ProductIcon';
import { formatNumber, formatMoney, formatRP, formatCompact } from '../../../core/utils';
import ScreenHeader from '../../../components/common/ScreenHeader';
import InfoDot from '../../../components/common/InfoDot';
import { categoryLabel } from '../../../core/i18n/categoryLabel';

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
    // See brand.categoryUnlockRequirement: the gate scales with the factory.
    const facilityTier = useStatsStore(st => st.facilityTier);
    const gateClearedByCategory = useStatsStore(st => st.gateClearedByCategory);

    const activeCategories = Object.keys(brandByCategory || {});
    const gate = canUnlockAnotherCategory(brandByCategory || {}, activeCategories, gateClearedByCategory);

    /** Is this category already one of ours, or would opening it need the gate? */
    const categoryOpen = (category: ProductCategory) =>
        activeCategories.length === 0
        || (brandByCategory || {})[category] !== undefined
        || gate.allowed;

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
                {/* ------------------------------------------------------------
                    THE GATE, ONE MARKET PER LINE

                    The corporate brand on the home screen is a WEIGHTED
                    AVERAGE over the markets you trade in, and this gate reads
                    the WEAKEST one. Those are never the same number and the
                    average is always the kinder of the two, so the figure the
                    player checked could not tell them whether the gate was
                    open. Worse, opening a second market DROPS the average
                    while the gate is unmoved, which reads as the brand
                    collapsing for no reason.

                    So the average is not shown here at all. Every market gets
                    its own line and its own distance to the bar, and the one
                    holding you back is named.
                   ------------------------------------------------------------ */}
                {activeCategories.length > 0 && (
                    <View style={styles.gatePanel}>
                        <View style={styles.gatePanelHead}>
                            <Text style={styles.gatePanelTitle}>{t('product.gatePanelTitle')}</Text>
                            <Text style={styles.gatePanelBar}>
                                {t('product.gatePanelBar', { v1: CATEGORY_UNLOCK_BRAND })}
                            </Text>
                        </View>

                        {activeCategories.map(cat => {
                            const points = Math.round((brandByCategory || {})[cat] || 0);
                            const cleared = !!(gateClearedByCategory || {})[cat];
                            const done = cleared || points >= CATEGORY_UNLOCK_BRAND;
                            const fill = Math.min(100, (points / CATEGORY_UNLOCK_BRAND) * 100);
                            return (
                                <View key={cat} style={styles.gateRow}>
                                    <Text style={styles.gateRowName} numberOfLines={1}>{categoryLabel(cat)}</Text>
                                    <View style={styles.gateTrack}>
                                        {/* Blue when it is there, brand orange while it
                                            climbs. Neither is green: clearing a gate is
                                            not a profit (theme rule 4). */}
                                        <View style={[styles.gateFill, {
                                            width: `${fill}%`,
                                            backgroundColor: done ? theme.colors.primary : theme.colors.brand,
                                        }]} />
                                    </View>
                                    <Text style={[styles.gateRowValue, done && styles.gateRowValueDone]}>
                                        {done ? t('product.gateRowCleared') : `${points}`}
                                    </Text>
                                </View>
                            );
                        })}

                        <Text style={styles.gatePanelFoot}>
                            {gate.allowed
                                ? t('product.gatePanelOpen')
                                : t('product.gatePanelShut', {
                                    v1: gate.weakest || '',
                                    v2: Math.max(0, Math.round(gate.required - gate.have)),
                                })}
                        </Text>
                    </View>
                )}

                {categories.map((category) => {
                    const products = groupedProducts[category] || [];
                    if (products.length === 0) return null;

                    const catColor = getCategoryColor(category);
                    const catIconName = getCategoryIconName(category);

                    return (
                        <View key={category} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <View style={[styles.categoryIconBadge, { backgroundColor: `${catColor}18`, borderColor: `${catColor}38` }]}>
                                    <MaterialCommunityIcons name={catIconName} size={18} color={catColor} />
                                </View>
                                <Text style={styles.categoryTitle}>{categoryLabel(category)}</Text>
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
                                        {/* Left: Product Icon */}
                                        <ProductIconBadge
                                            productId={product.id}
                                            category={product.category}
                                            size={44}
                                            iconSize={22}
                                            unlocked={product.isUnlocked}
                                        />

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
                                                        <MaterialCommunityIcons name="lock-outline" size={13} color="rgba(255,255,255,0.4)" style={{ marginRight: 2 }} />
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

            {/* UNLOCK MODAL */}
            {selectedProduct && (
                <ProductUnlockModal
                    visible={!!selectedProduct}
                    product={selectedProduct}
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
        gap: 10,
    },
    categoryIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    categoryTitle: {
        fontSize: 16,
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
        gap: 14,
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
        marginLeft: 4,
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

    // ---- the category gate panel ----
    gatePanel: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        padding: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    gatePanelHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    gatePanelTitle: {
        color: theme.colors.textPrimary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    gatePanelBar: {
        color: theme.colors.brandMuted,
        fontSize: 10.5,
        fontWeight: '700',
    },
    gateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    gateRowName: {
        width: 78,
        color: theme.colors.textSecondary,
        fontSize: 11,
    },
    gateTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    gateFill: {
        height: '100%',
        borderRadius: 3,
    },
    gateRowValue: {
        width: 62,
        textAlign: 'right',
        color: theme.colors.brand,
        fontSize: 11.5,
        fontWeight: '800',
    },
    /** Cleared reads in the accent, not the brand orange, so it stops being a
     *  number you are still chasing. */
    gateRowValueDone: {
        color: theme.colors.primary,
    },
    gatePanelFoot: {
        marginTop: 9,
        color: theme.colors.textMuted,
        fontSize: 10.5,
        lineHeight: 15,
    },
});

export default TechTreeScreen;
