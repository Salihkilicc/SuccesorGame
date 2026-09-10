// src/features/shopping/screens/CartScreen.tsx
//
// ============================================================================
//  LUXONET ACQUISITION CART SCREEN
// ============================================================================
//
//  Full-fledged screen presenting items added to the player's luxury cart,
//  breakdown of duties/escort, official ScreenHeader, and CrystalNavBar clearance.
//
// ============================================================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { announceLuxuryPurchase } from '../../../logic/personalEventsLogic';
import { effectivePrice } from '../../../core/luxury/promotions';
import { currentQuarter } from '../../../core/story/world';
import { SHOPS } from '../data/shoppingRegistry';
import { iconForItem, shopTheme } from '../data/shopIdentity';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import PaymentProcessingModal from '../components/PaymentProcessingModal';
import { t, useLocale } from '../../../core/i18n';
import { translateItemName } from '../../../data/i18n/profileLoveShopText';

// SHELVED: the third copy of the department icon list. A cart full of cars
// drew one symbol six times, which is the defect the symbol pass exists for.
// `iconForItem` is per ITEM and `shopTheme` gives it the selling shop's
// colour, so a cart reads as things from different houses.
//
//   const getCategoryTheme = (category: string) => { switch (category) { ... } };

export const CartScreen = () => {
    useLocale();
    const navigation = useNavigation<any>();
    const { cart, removeFromCart, purchaseCart } = useAssetStore();
    const { money, spendMoney } = useStatsStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);

    // ------------------------------------------------------------------
    //  THE TILL CHARGES THE PRICE THAT WAS ON THE SHELF
    // ------------------------------------------------------------------
    //  Priced HERE, at checkout, rather than frozen into the cart when the
    //  item was added. A cart that remembers an old price is a cart you can
    //  fill during a sale and empty ten years later, and a campaign that the
    //  checkout has never heard of is a banner rather than a mechanic.
    //
    //  Both screens and this one call the same `effectivePrice`, so the
    //  number cannot disagree with itself. See core/luxury/promotions.
    // ------------------------------------------------------------------
    const quarter = currentQuarter();
    const subtotal = cart.reduce(
        (acc, item) => acc + effectivePrice(item, SHOPS, quarter), 0,
    );
    const shippingCost = cart.length > 0 ? 5000 : 0;
    const luxuryTax = subtotal * 0.08;
    const calculatedTotal = subtotal + shippingCost + luxuryTax;

    const canAfford = money >= calculatedTotal;

    const handleCheckoutStart = () => {
        if (!canAfford) {
            Alert.alert(
                t('shop.insufficientFunds'),
                t('shop.insufficientFundsDesc', { needed: (calculatedTotal - money).toLocaleString() }),
            );
            return;
        }

        setOrderTotal(calculatedTotal);
        setIsProcessing(true);
    };

    // ------------------------------------------------------------------
    //  THE CHECKOUT PAYS ONCE, HERE, AND NOWHERE ELSE
    // ------------------------------------------------------------------
    //  This called `handleBuyLuxury` for the brand surge and the headline,
    //  and got a second cashier with them: that function looks the item up in
    //  the LuxoNet catalogue, never finds a LuxeNet item there, and its
    //  not-found branch pays for the item out of the wallet again. So every
    //  order in this shop was charged the quoted total AND the sticker price,
    //  roughly 2.08 times what the screen said. See checkoutCharge.test.ts.
    //
    //  `announceLuxuryPurchase` is the same brand surge and the same headline
    //  with no till attached.
    // ------------------------------------------------------------------
    const handlePaymentComplete = () => {
        const purchasedCartItems = [...cart];
        spendMoney(orderTotal);
        purchaseCart();

        let totalBrandSurge = 0;
        let lastHeadline = '';

        purchasedCartItems.forEach((cartItem) => {
            const result = announceLuxuryPurchase({
                id: cartItem.id,
                name: cartItem.name,
                price: effectivePrice(cartItem, SHOPS, quarter),
                prestigeScore: Math.min(600, Math.max(50, Math.round(cartItem.price / 80000))),
                category: cartItem.category,
                brand: cartItem.name.split(' ')[0] || 'Luxury',
            });
            totalBrandSurge += result.brandValueDelta;
            lastHeadline = result.newsHeadline;
        });

        setIsProcessing(false);

        setTimeout(() => {
            const headlineNotice = lastHeadline ? `\n\n${t('shop.mediaBroadcast')}: "${lastHeadline}"` : '';
            Alert.alert(
                t('shop.acquisitionComplete'),
                t('shop.acquisitionCompleteDesc', {
                    surge: String(totalBrandSurge),
                    headline: headlineNotice,
                }),
                [
                    {
                        text: t('shop.viewInventory'),
                        onPress: () => navigation.navigate('Belongings'),
                    },
                    {
                        text: t('common.ok') || 'OK',
                        style: 'cancel',
                    },
                ],
            );
        }, 400);
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={styles.root}>
            {/* Screen Header with Back Arrow, Subtitle and Category Rule */}
            <ScreenHeader
                title={t('shop.cartTitle')}
                subtitle={t('shop.orderReviewSubtitle')}
                category="company"
            />

            {cart.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                    <View style={styles.emptyIconWrap}>
                        <MaterialCommunityIcons
                            name="cart-outline"
                            size={44}
                            color={theme.colors.textMuted}
                        />
                    </View>
                    <Text style={styles.emptyCartTitle}>{t('luxo.cartEmpty')}</Text>
                    <Text style={styles.emptyCartText}>
                        {t('shop.emptyCartDesc')}
                    </Text>
                    <Pressable
                        onPress={() => navigation.navigate('Shopping')}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueButtonText}>{t('luxo.exploreLuxonet')}</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Items List */}
                    {cart.map((item) => {
                        const look = shopTheme(item.shopId);

                        return (
                            <View key={item.id} style={styles.cartItemCard}>
                                <View style={styles.itemRow}>
                                    <View style={[styles.itemThumbnail, { backgroundColor: look.wash }]}>
                                        <MaterialCommunityIcons
                                            name={iconForItem(item) as any}
                                            size={22}
                                            color={look.tint}
                                        />
                                    </View>

                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemTitle} numberOfLines={2}>
                                            {translateItemName(item.name)}
                                        </Text>
                                        <Text style={styles.itemPrice}>
                                            {formatCurrency(item.price)}
                                        </Text>
                                        <Text style={styles.soldByText}>
                                            {t('shop.boutiqueLabel')}: <Text style={styles.boldText}>{item.website || t('shop.luxonetSovereign')}</Text>
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.itemActions}>
                                    <Pressable
                                        style={styles.actionButton}
                                        onPress={() => removeFromCart(item.id)}
                                    >
                                        <MaterialCommunityIcons
                                            name="trash-can-outline"
                                            size={14}
                                            color="#FF8A8A"
                                        />
                                        <Text style={styles.actionDeleteText}>{t('luxo.remove')}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}

                    {/* Order Summary */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>{t('luxo.breakdown')}</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('shop.subtotal')} ({cart.length}):</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('shop.shippingEscort')}:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(shippingCost)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('shop.luxuryTax')}:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(luxuryTax)}</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t('shop.totalAcquisition')}</Text>
                            <Text style={styles.totalValue}>{formatCurrency(calculatedTotal)}</Text>
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Footer Checkout Bar */}
            {cart.length > 0 && (
                <View style={styles.checkoutFooter}>
                    <View style={styles.footerTotalContainer}>
                        <Text style={styles.footerTotalLabel}>{t('luxo.payableTotal')}</Text>
                        <Text style={styles.footerTotalValue}>{formatCurrency(calculatedTotal)}</Text>
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.checkoutButton,
                            !canAfford && styles.checkoutButtonDisabled,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={handleCheckoutStart}
                    >
                        <Text style={styles.checkoutButtonText}>
                            {canAfford ? t('shop.checkout') : t('shop.insufficientFunds')}
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Payment Processing Modal */}
            <PaymentProcessingModal
                visible={isProcessing}
                amount={orderTotal}
                onComplete={handlePaymentComplete}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: NAV_BAR_CLEARANCE + 110, // Clear CrystalNavBar and checkout bar
    },
    emptyCartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: NAV_BAR_CLEARANCE + 40,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyCartTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    emptyCartText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    continueButton: {
        backgroundColor: '#183D5C',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    continueButtonText: {
        color: '#7DD3FC',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    cartItemCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemThumbnail: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    itemPrice: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    soldByText: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },
    boldText: {
        color: theme.colors.textSecondary,
        fontWeight: '700',
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    actionDeleteText: {
        color: '#FF8A8A',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginTop: 8,
    },
    summaryTitle: {
        color: '#05A8F6',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    totalLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    totalValue: {
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: '900',
    },
    checkoutFooter: {
        position: 'absolute',
        bottom: NAV_BAR_CLEARANCE,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    footerTotalContainer: {
        flex: 1,
    },
    footerTotalLabel: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    footerTotalValue: {
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: '900',
    },
    checkoutButton: {
        backgroundColor: '#183D5C',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutButtonDisabled: {
        backgroundColor: theme.colors.surfaceRaised,
        opacity: 0.6,
    },
    checkoutButtonText: {
        color: '#7DD3FC',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    btnPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
});

export default CartScreen;
