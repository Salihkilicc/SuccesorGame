import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Pressable, SafeAreaView, Dimensions, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import BrowserHeader from './BrowserHeader';
import LuxeNetFooter from './LuxeNetFooter';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import BottomStatsBar from '../../../components/common/BottomStatsBar';


const { width, height } = Dimensions.get('window');

interface CartModalProps {
    visible: boolean;
    onClose: () => void;
    onProceedToCheckout?: (amount: number) => void;
    onHomePress?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ visible, onClose, onProceedToCheckout, onHomePress }) => {
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
                />

                {cart.length === 0 ? (
                    <View style={styles.emptyCartContainer}>
                        <Text style={styles.emptyCartEmoji}>🛒</Text>
                        <Text style={styles.emptyCartTitle}>Your LuxeNet Cart is empty</Text>
                        <Text style={styles.emptyCartText}>
                            Check your Saved for later items or continue shopping.
                        </Text>
                        <Pressable onPress={onClose} style={styles.continueButton}>
                            <Text style={styles.continueButtonText}>Continue Shopping</Text>
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
                                    <View style={[styles.itemThumbnail, { backgroundColor: item.brandColor ? `${item.brandColor}20` : '#333' }]}>
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
                                        <Text style={styles.inStockText}>In Stock</Text>
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
                                        <Text style={styles.actionText}>Delete</Text>
                                    </Pressable>
                                    <View style={styles.divider} />
                                    <Pressable style={styles.actionButton}>
                                        <Text style={styles.actionText}>Save for later</Text>
                                    </Pressable>
                                    <View style={styles.divider} />
                                    <Pressable style={styles.actionButton}>
                                        <Text style={styles.actionText}>Compare</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}

                        {/* Order Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Order Summary</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal ({cart.length} items):</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping & Handling:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(shippingCost)}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Luxury Tax (8.0%):</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(luxuryTax)}</Text>
                            </View>

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Order Total:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(orderTotal)}</Text>
                            </View>
                        </View>

                        <LuxeNetFooter style={{ backgroundColor: 'transparent', marginTop: 10, borderTopColor: '#222' }} />
                    </ScrollView>
                )}


                {/* Footer / Proceed Button */}
                {cart.length > 0 && (
                    <View style={styles.checkoutFooter}>
                        <View style={styles.footerTotalContainer}>
                            <Text style={styles.footerTotalLabel}>Total</Text>
                            <Text style={styles.footerTotalValue}>{formatCurrency(orderTotal)}</Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.checkoutButton,
                                pressed && { opacity: 0.9 },
                                !canAfford && { backgroundColor: '#555' }
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

                {/* Info / Stats Bar */}
                <BottomStatsBar onHomePress={onHomePress} />


            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111', // Dark background like ShoppingScreen
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#1a1a1a',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        color: '#3498DB',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Cart Item
    cartItemCard: {
        backgroundColor: '#1a1a1a',
        marginBottom: 12,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    itemThumbnail: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#2C2C2C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    itemEmoji: {
        fontSize: 48,
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    itemTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 22,
    },
    itemPrice: {
        color: '#B33939', // Amazon-ish red for price/deal, or Gold
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    inStockText: {
        color: '#27AE60',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    soldByText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    specText: {
        color: '#666',
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
        backgroundColor: '#252525',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    actionText: {
        color: '#CCC',
        fontSize: 12,
        fontWeight: '500',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#333',
    },

    // Order Summary
    summaryCard: {
        backgroundColor: '#1a1a1a',
        marginTop: 12,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
    },
    summaryTitle: {
        color: '#FFF',
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
        color: '#AAA',
        fontSize: 14,
    },
    summaryValue: {
        color: '#FFF',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    totalLabel: {
        color: '#B33939', // Red for total
        fontSize: 20,
        fontWeight: '700',
    },
    totalValue: {
        color: '#B33939',
        fontSize: 20,
        fontWeight: '700',
    },

    // Checkout Footer (Above Stats Bar)
    checkoutFooter: {
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
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
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footerTotalValue: {
        color: '#B33939',
        fontSize: 22,
        fontWeight: '700',
    },
    checkoutButton: {
        backgroundColor: '#F1C40F', // Amazon Yellow/Gold
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    checkoutButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    checkoutSubtext: {
        color: '#333',
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
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyCartText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    continueButton: {
        backgroundColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CartModal;
