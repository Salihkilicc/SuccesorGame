import React, { useMemo, useState } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useUserStore } from '../../../core/store/useUserStore';
import { useAssetStore } from '../store/useAssetStore';
import BottomStatsBar from '../../../components/common/BottomStatsBar';
import CartModal from '../components/CartModal';
import PaymentProcessingModal from '../components/PaymentProcessingModal';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { Alert } from 'react-native';
import { SHOPS, ITEMS } from '../data/ShoppingData';
import { useLuxeNetNavigation } from '../hooks/useLuxeNetNavigation';
import BrowserHeader from '../components/BrowserHeader';
import AdBannerCarousel from '../components/AdBannerCarousel';
import ShopPreviewCard from '../components/ShopPreviewCard';
import LuxeNetFooter from '../components/LuxeNetFooter';
import { useShoppingWithInventory } from '../hooks/useShopping';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.xl * 3) / 2;

// Categories for Hub Grid
const CATEGORIES = [
    { id: 'VEHICLE', name: 'Vehicles', emoji: '🏎️', color: '#E74C3C' },
    { id: 'REAL_ESTATE', name: 'Real Estate', emoji: '🏠', color: '#2C3E50' },
    { id: 'JEWELRY', name: 'Jewelry', emoji: '💎', color: '#F39C12' },
    { id: 'WATCH', name: 'Watches', emoji: '⌚', color: '#F1C40F' },
    { id: 'MARINE', name: 'Marine', emoji: '⛵', color: '#3498DB' },
    { id: 'AIRCRAFT', name: 'Aircraft', emoji: '✈️', color: '#9B59B6' },
];

const ShoppingScreen = () => {
    const navigation = useNavigation<any>();
    const userName = useUserStore((state) => state.name);
    const { addToCart, isOwned, cart } = useAssetStore();
    const { getShopItems, getTrendingItems } = useShoppingWithInventory();

    // Internal Navigation Hook
    const {
        currentUrl,
        currentView,
        selectedCategory,
        selectedShopId,
        goToCategory,
        visitShop,
        goBack
    } = useLuxeNetNavigation();

    // Modal State
    // Modal State
    const [showCart, setShowCart] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);

    // ============================================================================
    // CHECKOUT HANDLERS
    // ============================================================================
    const { spendMoney } = useStatsStore();
    const { purchaseCart } = useAssetStore();

    const handleCheckoutStart = (amount: number) => {
        setOrderTotal(amount);
        setShowCart(false); // Close cart first
        setTimeout(() => setIsProcessing(true), 500); // Open payment with slight delay for smooth transition
    };

    const handlePaymentComplete = () => {
        // Actual Transaction Logic
        spendMoney(orderTotal);
        purchaseCart();

        setIsProcessing(false);

        // Final Success Message
        setTimeout(() => {
            Alert.alert(
                "Acquisition Complete",
                "The assets have been transferred to your portfolio. Delivery agents have been dispatched.",
                [{ text: "Excellent" }]
            );
        }, 500);
    };

    // ============================================================================
    // DATA HELPERS
    // ============================================================================

    // Trending items (filtered by ownership)
    const trendingItems = useMemo(() => {
        return getTrendingItems(6);
    }, [getTrendingItems]);

    const formatPrice = (price: number) => {
        if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
        if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
        return `$${price}`;
    };

    // ============================================================================
    // RENDER: HUB VIEW
    // ============================================================================
    const renderHub = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Welcome */}
            <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
                <Text style={styles.subtitleText}>The world's marketplace is yours.</Text>
            </View>

            {/* Ads */}
            <AdBannerCarousel onPressBanner={visitShop} />

            {/* Departments Grid */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse Departments</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map(cat => (
                        <Pressable
                            key={cat.id}
                            onPress={() => goToCategory(cat.id)}
                            style={({ pressed }) => [
                                styles.categoryCard,
                                { backgroundColor: `${cat.color}15`, borderColor: cat.color },
                                pressed && styles.pressed
                            ]}
                        >
                            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                            <Text style={[styles.categoryName, { color: cat.color }]}>{cat.name}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Trending Items */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending Now</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                    {trendingItems.map(item => {
                        const shop = SHOPS.find(s => s.id === item.shopId);
                        const color = shop?.bannerColor || '#FFF';
                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => item.shopId && visitShop(item.shopId)}
                                style={styles.trendingCard}
                            >
                                <View style={[styles.trendingIcon, { backgroundColor: `${color}20` }]}>
                                    <Text style={styles.trendingEmoji}>
                                        {item.category === 'VEHICLE' ? '🏎️' :
                                            item.category === 'WATCH' ? '⌚' :
                                                item.category === 'JEWELRY' ? '💎' :
                                                    item.category === 'MARINE' ? '⛵' :
                                                        item.category === 'AIRCRAFT' ? '✈️' : '🏠'}
                                    </Text>
                                </View>
                                <Text style={styles.trendingName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.trendingPrice}>{formatPrice(item.price)}</Text>
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            <LuxeNetFooter />

        </ScrollView >
    );

    // ============================================================================
    // RENDER: CATEGORY LIST VIEW
    // ============================================================================
    const renderCategoryList = () => {
        const filteredShops = SHOPS.filter(s => s.category === selectedCategory);
        const categoryMeta = CATEGORIES.find(c => c.id === selectedCategory);

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.categoryHeader, { borderColor: categoryMeta?.color || '#FFF' }]}>
                    <Text style={styles.categoryHeaderEmoji}>{categoryMeta?.emoji}</Text>
                    <Text style={[styles.categoryHeaderTitle, { color: categoryMeta?.color }]}>
                        {categoryMeta?.name} Directorate
                    </Text>
                </View>

                {filteredShops.map(shop => (
                    <ShopPreviewCard
                        key={shop.id}
                        shopId={shop.id}
                        name={shop.name}
                        description={shop.description}
                        emoji={shop.emoji}
                        color={shop.bannerColor}
                        onVisit={() => visitShop(shop.id)}
                    />
                ))}

                <LuxeNetFooter />

            </ScrollView>
        );
    };

    // ============================================================================
    // RENDER: SHOP DETAIL VIEW
    // ============================================================================
    const renderShopDetail = () => {
        const shop = SHOPS.find(s => s.id === selectedShopId);
        if (!shop) return null;

        // Get filtered shop items (hides owned items except rings)
        const shopItems = getShopItems(shop.id).map((item: any) => ({
            ...item,
            website: shop.name,
            brandColor: shop.bannerColor,
        }));

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Shop Banner */}
                <View style={[styles.shopBanner, { backgroundColor: shop.bannerColor }]}>
                    <Text style={styles.shopBannerEmoji}>{shop.emoji}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.shopBannerTitle}>{shop.name}</Text>
                        <Text style={styles.shopBannerDesc}>{shop.description}</Text>
                    </View>
                </View>

                {/* Items Grid */}
                <View style={styles.itemsGrid}>
                    {shopItems.map((item: any) => {
                        const owned = isOwned(item.id);
                        const isInCart = cart.some(c => c.id === item.id);

                        return (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={[styles.itemImage, { backgroundColor: `${shop.bannerColor}20` }]}>
                                    <Text style={styles.itemEmoji}>{shop.emoji}</Text>
                                </View>

                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>

                                    {/* Specs */}
                                    <View style={styles.specsRow}>
                                        {item.specs?.slice(0, 2).map((spec: string, idx: number) => (
                                            <View key={idx} style={[styles.specTag, { borderColor: shop.bannerColor }]}>
                                                <Text style={[styles.specText, { color: shop.bannerColor }]}>{spec}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Add Button */}
                                <Pressable
                                    onPress={() => !owned && !isInCart && addToCart(item)}
                                    style={({ pressed }) => [
                                        styles.addButton,
                                        { backgroundColor: owned ? '#333' : isInCart ? '#27AE60' : shop.bannerColor },
                                        pressed && !owned && !isInCart && styles.pressed
                                    ]}
                                    disabled={owned || isInCart}
                                >
                                    <Text style={styles.addButtonText}>
                                        {owned ? 'Owned' : isInCart ? 'In Cart' : 'Add to Cart'}
                                    </Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>

                <LuxeNetFooter />

            </ScrollView >
        );
    };

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            {/* Persistent Browser Header */}
            <BrowserHeader
                currentUrl={currentUrl}
                canGoBack={currentView !== 'HUB'}
                onBack={goBack}
                onCartPress={() => setShowCart(true)}
            />

            {/* Dynamic Content */}
            <View style={styles.contentArea}>
                {currentView === 'HUB' && renderHub()}
                {currentView === 'CATEGORY_LIST' && renderCategoryList()}
                {currentView === 'SHOP_DETAIL' && renderShopDetail()}
            </View>

            {/* Footer */}
            <BottomStatsBar onHomePress={() => navigation.navigate('Home')} />

            {/* Cart Modal */}
            <CartModal
                visible={showCart}
                onClose={() => setShowCart(false)}
                onProceedToCheckout={handleCheckoutStart}
                onHomePress={() => {
                    setShowCart(false);
                    navigation.navigate('Home');
                }}
            />

            {/* Payment Processor */}
            <PaymentProcessingModal
                visible={isProcessing}
                amount={orderTotal}
                onComplete={handlePaymentComplete}
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    contentArea: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: theme.spacing.md,
        letterSpacing: -0.5,
    },

    // Welcome
    welcomeSection: {
        marginBottom: theme.spacing.lg,
    },
    welcomeText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    subtitleText: {
        color: '#888',
        fontSize: 14,
    },

    // Categories
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    categoryCard: {
        width: (width - theme.spacing.lg * 3) / 2,
        padding: theme.spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    categoryEmoji: {
        fontSize: 32,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },

    // Trending
    horizontalRow: {
        gap: theme.spacing.md,
        paddingRight: theme.spacing.md,
    },
    trendingCard: {
        width: 140,
        backgroundColor: '#2A2A2A',
        borderRadius: 16,
        padding: theme.spacing.md,
        gap: 6,
    },
    trendingIcon: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    trendingEmoji: { fontSize: 32 },
    trendingName: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        minHeight: 34,
    },
    trendingPrice: {
        color: '#27AE60',
        fontSize: 14,
        fontWeight: '700',
    },

    // Category List View
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        marginBottom: theme.spacing.lg,
    },
    categoryHeaderEmoji: { fontSize: 24 },
    categoryHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Shop Detail View
    shopBanner: {
        padding: theme.spacing.xl,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    shopBannerEmoji: { fontSize: 40 },
    shopBannerTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    shopBannerDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    itemCard: {
        width: CARD_WIDTH,
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        gap: 8,
    },
    itemImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemEmoji: { fontSize: 40 },
    itemInfo: { gap: 4, flex: 1 },
    itemName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        height: 36,
    },
    itemPrice: {
        color: '#27AE60',
        fontSize: 15,
        fontWeight: '700',
    },
    specsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    specTag: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    specText: {
        fontSize: 9,
        fontWeight: '700',
    },
    addButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});

export default ShoppingScreen;