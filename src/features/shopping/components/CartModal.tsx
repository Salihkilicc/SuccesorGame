import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Modal, StyleSheet, ScrollView, Pressable, SafeAreaView, Dimensions, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import BrowserHeader from './BrowserHeader';
import LuxeNetFooter from './LuxeNetFooter';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';


const { width, height } = Dimensions.get('window');

interface CartModalProps {
    visible: boolean;
    onClose: () => void;
    onProceedToCheckout?: (amount: number) => void;
    onHomePress?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ visible, onClose, onProceedToCheckout, onHomePress }) => {
    useLocale();
    const { cart, removeFromCart } = useAssetStore();
    const { money } = useStatsStore();

    // ============================================================================
    // CALCULATIONS (The Commerce Logic)
    // ============================================================================

    const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    const shippingCost = cart.length > 0 ? 5000 : 0; // Flat armored delivery
    const luxuryTax = subtotal * 0.08;
    const orderTotal = subtotal + shippingCost + luxuryTax;

    const canAfford = money >= orderTotal;

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleProceedToCheckout = () => {
        if (!onProceedToCheckout) return;

        if (!canAfford) {
            Alert.alert(
                "Insufficient Funds",
                `You need $${(orderTotal - money).toLocaleString()} more to complete this order.`
            );
            return;
        }

        onProceedToCheckout(orderTotal);
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false} // Full screen opaque like a new page
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.container}>
                {/* Browser Header */}
                <BrowserHeader
                    currentUrl="luxenet://cart"
                    canGoBack={true}
                    onBack={onClose}
                    onCartPress={() => { }} // Already in cart
                    onBelongingsPress={() => { }} // Cart modal does not navigate to belongings directly
                />

                {cart.length === 0 ? (
                    <View style={styles.emptyCartContainer}>
                        <Text style={styles.emptyCartEmoji}>🛒</Text>
                        <Text style={styles.emptyCartTitle}>{t('ui.yourLuxenetCartIsEmpty')}</Text>
                        <Text style={styles.emptyCartText}>{t('ui.checkYourSavedForLater')}</Text>
                        <Pressable onPress={onClose} style={styles.continueButton}>
                            <Text style={styles.continueButtonText}>{t('ui.continueShopping')}</Text>
                        </Pressable>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Items List */}
                        {cart.map((item) => (
                            <View key={item.id} style={styles.cartItemCard}>
                                {/* Row Layout */}
                                <View style={styles.itemRow}>
                                    {/* Thumbnail (Left) */}
                                    <View style={[styles.itemThumbnail, { backgroundColor: item.brandColor ? `${item.brandColor}20` : '#1C242C' }]}>
                                        <Text style={styles.itemEmoji}>
                                            {item.category === 'VEHICLE' ? '🏎️' :
                                                item.category === 'WATCH' ? '⌚' :
                                                    item.category === 'JEWELRY' ? '💎' :
                                                        item.category === 'MARINE' ? '⛵' :
                                                            item.category === 'AIRCRAFT' ? '✈️' : '🏠'}
                                        </Text>
                                    </View>

                                    {/* Details (Middle) */}
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemTitle} numberOfLines={2}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                                        <Text style={styles.inStockText}>{t('ui.inStock')}</Text>
                                        <Text style={styles.soldByText}>
                                            Sold by: <Text style={{ fontWeight: '600' }}>{item.website || 'LuxeNet Certified'}</Text>
                                        </Text>
                                        {item.specs && item.specs[0] && (
                                            <Text style={styles.specText}>{item.specs[0]}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Actions Row */}
                                <View style={styles.itemActions}>
                                    <Pressable style={styles.actionButton} onPress={() => removeFromCart(item.id)}>
                                        <Text style={styles.actionText}>{t('ui.delete')}</Text>
                                    </Pressable>
                                    <View style={styles.divider} />
                                    <Pressable style={styles.actionButton}>
                                        <Text style={styles.actionText}>{t('ui.saveForLater')}</Text>
                                    </Pressable>
                                    <View style={styles.divider} />
                                    <Pressable style={styles.actionButton}>
                                        <Text style={styles.actionText}>{t('ui.compare')}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}

                        {/* Order Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>{t('ui.orderSummary')}</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal ({cart.length} items):</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('ui.shippingHandling')}</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(shippingCost)}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('ui.luxuryTax80')}</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(luxuryTax)}</Text>
                            </View>

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{t('ui.orderTotal')}</Text>
                                <Text style={styles.totalValue}>{formatCurrency(orderTotal)}</Text>
                            </View>
                        </View>

                        <LuxeNetFooter style={{ backgroundColor: 'transparent', marginTop: 10, borderTopColor: 'rgba(255,255,255,0.06)' }} />
                    </ScrollView>
                )}


                {/* Footer / Proceed Button */}
                {cart.length > 0 && (
                    <View style={styles.checkoutFooter}>
                        <View style={styles.footerTotalContainer}>
                            <Text style={styles.footerTotalLabel}>{t('ui.total')}</Text>
                            <Text style={styles.footerTotalValue}>{formatCurrency(orderTotal)}</Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.checkoutButton,
                                pressed && { opacity: 0.9 },
                                !canAfford && { backgroundColor: '#323A40' }
                            ]}
                            onPress={handleProceedToCheckout}
                        >
                            <Text style={styles.checkoutButtonText}>
                                {canAfford ? 'Proceed to Checkout' : 'Insufficient Funds'}
                            </Text>
                            {canAfford && <Text style={styles.checkoutSubtext}>({cart.length} items)</Text>}
                        </Pressable>
                    </View>
                )}

                {/* Info / Stats Bar */}            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C242C', // Dark background like ShoppingScreen
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#434B50',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Cart Item
    cartItemCard: {
        backgroundColor: '#434B50',
        marginBottom: 12,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    itemThumbnail: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    itemEmoji: {
        fontSize: 48,
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    itemTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 22,
    },
    itemPrice: {
        color: '#FF8A8A', // Amazon-ish red for price/deal, or Gold
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    inStockText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    soldByText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginBottom: 4,
    },
    specText: {
        color: '#FFFFFF',
        fontSize: 11,
    },

    // Actions Row
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#434B50',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#323A40',
    },

    // Order Summary
    summaryCard: {
        backgroundColor: '#434B50',
        marginTop: 12,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    summaryTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    totalLabel: {
        color: '#FF8A8A', // Red for total
        fontSize: 20,
        fontWeight: '700',
    },
    totalValue: {
        color: '#FF8A8A',
        fontSize: 20,
        fontWeight: '700',
    },

    // Checkout Footer (Above Stats Bar)
    checkoutFooter: {
        backgroundColor: '#434B50',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        padding: 16,
        paddingBottom: 68, // Exact spacing requested
    },
    footerTotalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    footerTotalLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footerTotalValue: {
        color: '#FF8A8A',
        fontSize: 22,
        fontWeight: '700',
    },
    checkoutButton: {
        backgroundColor: '#434B50', // Amazon Yellow/Gold
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    checkoutSubtext: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    // Empty State
    emptyCartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyCartEmoji: {
        fontSize: 80,
        marginBottom: 24,
        opacity: 0.5,
    },
    emptyCartTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyCartText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    continueButton: {
        backgroundColor: '#323A40',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CartModal;
