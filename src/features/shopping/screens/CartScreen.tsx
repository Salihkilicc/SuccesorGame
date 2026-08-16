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
import { handleBuyLuxury } from '../../../logic/personalEventsLogic';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import PaymentProcessingModal from '../components/PaymentProcessingModal';

const getCategoryTheme = (category: string) => {
    switch (category) {
        case 'VEHICLE':
            return { icon: 'car-sports', color: '#FFA94D', bg: '#4E3A20' };
        case 'REAL_ESTATE':
            return { icon: 'home-city-outline', color: '#38BDF8', bg: '#183852' };
        case 'WATCH':
            return { icon: 'watch', color: '#C084FC', bg: '#3B2050' };
        case 'JEWELRY':
            return { icon: 'diamond-stone', color: '#FBBF24', bg: '#4E3A20' };
        case 'MARINE':
            return { icon: 'ferry', color: '#22D3EE', bg: '#163A48' };
        case 'AIRCRAFT':
            return { icon: 'airplane', color: '#818CF8', bg: '#282C4A' };
        default:
            return { icon: 'briefcase-outline', color: '#05A8F6', bg: '#183D5C' };
    }
};

export const CartScreen = () => {
    const navigation = useNavigation<any>();
    const { cart, removeFromCart, purchaseCart } = useAssetStore();
    const { money, spendMoney } = useStatsStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);

    const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    const shippingCost = cart.length > 0 ? 5000 : 0;
    const luxuryTax = subtotal * 0.08;
    const calculatedTotal = subtotal + shippingCost + luxuryTax;

    const canAfford = money >= calculatedTotal;

    const handleCheckoutStart = () => {
        if (!canAfford) {
            Alert.alert(
                'Insufficient Funds',
                `You need $${(calculatedTotal - money).toLocaleString()} more to complete this acquisition.`,
            );
            return;
        }

        setOrderTotal(calculatedTotal);
        setIsProcessing(true);
    };

    const handlePaymentComplete = () => {
        const purchasedCartItems = [...cart];
        spendMoney(orderTotal);
        purchaseCart();

        let totalBrandSurge = 0;
        let lastHeadline = '';

        purchasedCartItems.forEach((cartItem) => {
            const result = handleBuyLuxury({
                id: cartItem.id,
                name: cartItem.name,
                price: cartItem.price,
                prestigeScore: Math.min(600, Math.max(50, Math.round(cartItem.price / 80000))),
                category: cartItem.category,
                brand: cartItem.name.split(' ')[0] || 'Luxury',
            });
            if (result.success) {
                totalBrandSurge += result.brandValueDelta;
                lastHeadline = result.newsHeadline;
            }
        });

        setIsProcessing(false);

        setTimeout(() => {
            const headlineNotice = lastHeadline ? `\n\nMedia Broadcast: "${lastHeadline}"` : '';
            Alert.alert(
                'Acquisition Complete',
                `The luxury assets have been registered to your portfolio. Corporate Brand Surge: +${totalBrandSurge} pts.${headlineNotice}`,
                [
                    {
                        text: 'VIEW INVENTORY',
                        onPress: () => navigation.navigate('Belongings'),
                    },
                    {
                        text: 'OK',
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
                title="ACQUISITION CART"
                subtitle="ORDER REVIEW & SETTLEMENT"
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
                    <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
                    <Text style={styles.emptyCartText}>
                        Explore the LuxoNet boutique departments to acquire and reserve ultra-luxury assets.
                    </Text>
                    <Pressable
                        onPress={() => navigation.navigate('Shopping')}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueButtonText}>EXPLORE LUXONET</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Items List */}
                    {cart.map((item) => {
                        const itemTheme = getCategoryTheme(item.category);

                        return (
                            <View key={item.id} style={styles.cartItemCard}>
                                <View style={styles.itemRow}>
                                    <View style={[styles.itemThumbnail, { backgroundColor: itemTheme.bg }]}>
                                        <MaterialCommunityIcons
                                            name={itemTheme.icon as any}
                                            size={22}
                                            color={itemTheme.color}
                                        />
                                    </View>

                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemTitle} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.itemPrice}>
                                            {formatCurrency(item.price)}
                                        </Text>
                                        <Text style={styles.soldByText}>
                                            Boutique: <Text style={styles.boldText}>{item.website || 'LuxoNet Sovereign'}</Text>
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
                                        <Text style={styles.actionDeleteText}>REMOVE</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}

                    {/* Order Summary */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>ACQUISITION BREAKDOWN</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal ({cart.length} items):</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Armored Logistics & Vault Escort:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(shippingCost)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Luxury Duty / Tax (8%):</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(luxuryTax)}</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL ACQUISITION COST</Text>
                            <Text style={styles.totalValue}>{formatCurrency(calculatedTotal)}</Text>
                        </View>
                    </View>
                </ScrollView>
            )}

            {/* Footer Checkout Bar */}
            {cart.length > 0 && (
                <View style={styles.checkoutFooter}>
                    <View style={styles.footerTotalContainer}>
                        <Text style={styles.footerTotalLabel}>PAYABLE TOTAL</Text>
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
                            {canAfford ? 'AUTHORIZE TRANSFER' : 'INSUFFICIENT FUNDS'}
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
