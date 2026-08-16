// src/features/shopping/screens/ShoppingScreen.tsx
//
// ============================================================================
//  LUXONET STORE — SOVEREIGN LUXURY MARKETPLACE SCREEN
// ============================================================================
//
//  Full-fledged screen presenting hypercars, megamansions, haute horlogerie,
//  superyachts, private jets with curated category colors, horizontal swipe
//  gesture paging, official ScreenHeader, and bottom CrystalNavBar clearance.
//
// ============================================================================

import React, { useMemo, useState, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Text,
    Pressable,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useAssetStore } from '../store/useAssetStore';
import { useShoppingWithInventory } from '../hooks/useShopping';
import { useLuxeNetNavigation } from '../hooks/useLuxeNetNavigation';
import { SHOPS } from '../data/shoppingRegistry';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import AdBannerCarousel from '../components/AdBannerCarousel';
import ShopPreviewCard from '../components/ShopPreviewCard';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 32 - 12) / 2;

// Categories for Hub Grid with curated game palette
const CATEGORIES = [
    {
        id: 'VEHICLE',
        name: 'Vehicles',
        icon: 'car-sports',
        desc: 'Hypercars & Exotics',
        color: '#FFA94D',
        bg: '#4E3A20',
    },
    {
        id: 'REAL_ESTATE',
        name: 'Real Estate',
        icon: 'home-city-outline',
        desc: 'Mansions & Penthouses',
        color: '#38BDF8',
        bg: '#183852',
    },
    {
        id: 'WATCH',
        name: 'Watches',
        icon: 'watch',
        desc: 'Haute Horlogerie',
        color: '#C084FC',
        bg: '#3B2050',
    },
    {
        id: 'JEWELRY',
        name: 'Jewelry',
        icon: 'diamond-stone',
        desc: 'Heirloom & Rings',
        color: '#FBBF24',
        bg: '#4E3A20',
    },
    {
        id: 'MARINE',
        name: 'Marine',
        icon: 'ferry',
        desc: 'Superyachts',
        color: '#22D3EE',
        bg: '#163A48',
    },
    {
        id: 'AIRCRAFT',
        name: 'Aircraft',
        icon: 'airplane',
        desc: 'Private Jets',
        color: '#818CF8',
        bg: '#282C4A',
    },
];

const TABS = [
    {
        id: 'ALL',
        name: 'Overview',
        icon: 'view-dashboard-outline',
        color: '#05A8F6',
        bg: '#183D5C',
    },
    ...CATEGORIES,
];

const getCategoryTheme = (category: string) => {
    const found = CATEGORIES.find((c) => c.id === category);
    if (found) return found;
    return {
        id: category,
        name: category,
        icon: 'briefcase-outline',
        desc: 'Luxury',
        color: '#05A8F6',
        bg: '#183D5C',
    };
};

export const ShoppingScreen = () => {
    const navigation = useNavigation<any>();
    const playerMoney = usePlayerStore((state) => state.core.money);
    const { addToCart, isOwned, cart } = useAssetStore();
    const { getShopItems, getTrendingItems } = useShoppingWithInventory();

    // Internal Navigation Hook
    const {
        currentView,
        selectedShopId,
        visitShop,
        goBack,
    } = useLuxeNetNavigation();

    // Pager & Active Tab State
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const previousCategoryIndexRef = useRef<number>(0);
    const pagerRef = useRef<ScrollView>(null);
    const pillScrollRef = useRef<ScrollView>(null);

    // ============================================================================
    // DATA HELPERS
    // ============================================================================
    const trendingItems = useMemo(() => {
        return getTrendingItems(6);
    }, [getTrendingItems]);

    const formatPrice = (price: number) => {
        if (price >= 1_000_000_000_000) return `$${(price / 1_000_000_000_000).toFixed(2)}T`;
        if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(2)}B`;
        if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
        if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
        return `$${price.toLocaleString()}`;
    };

    // Scroll pager to specified page index
    const scrollToPage = (index: number) => {
        setActiveIndex(index);
        pagerRef.current?.scrollTo({ x: index * width, animated: true });
        pillScrollRef.current?.scrollTo({ x: Math.max(0, index * 90 - 40), animated: true });
    };

    const handleVisitShop = (shopId: string) => {
        const shop = SHOPS.find((s) => s.id === shopId);
        if (shop) {
            const catIndex = CATEGORIES.findIndex((c) => c.id === shop.category);
            previousCategoryIndexRef.current = catIndex >= 0 ? catIndex + 1 : activeIndex;
        } else {
            previousCategoryIndexRef.current = activeIndex;
        }
        visitShop(shopId);
    };

    const handleBack = () => {
        if (currentView === 'SHOP_DETAIL') {
            goBack();
            const targetIndex = previousCategoryIndexRef.current;
            setTimeout(() => {
                scrollToPage(targetIndex);
            }, 60);
        } else if (activeIndex > 0) {
            scrollToPage(0);
        } else {
            navigation.goBack();
        }
    };

    // Horizontal Swipe Listener
    const handlePagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== activeIndex && index >= 0 && index < TABS.length) {
            setActiveIndex(index);
            pillScrollRef.current?.scrollTo({ x: Math.max(0, index * 90 - 40), animated: true });
        }
    };

    // Right Cart Action Button
    const renderCartButton = () => (
        <Pressable
            style={({ pressed }) => [styles.cartBtn, pressed && styles.cartBtnPressed]}
            onPress={() => navigation.navigate('Cart')}
        >
            <MaterialCommunityIcons name="cart-outline" size={20} color="#FFFFFF" />
            {cart.length > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
            )}
        </Pressable>
    );

    // Dynamic header subtitle
    const headerSubtitle = useMemo(() => {
        if (currentView === 'SHOP_DETAIL' && selectedShopId) {
            const shop = SHOPS.find((s) => s.id === selectedShopId);
            return shop ? shop.name.toUpperCase() : 'AUTHORIZED BOUTIQUE';
        }
        if (activeIndex > 0 && TABS[activeIndex]) {
            return `${TABS[activeIndex].name.toUpperCase()} DIRECTORATE`;
        }
        return 'SOVEREIGN LUXURY MARKETPLACE';
    }, [currentView, selectedShopId, activeIndex]);

    // ============================================================================
    // RENDER: HUB / OVERVIEW PAGE (Page 0)
    // ============================================================================
    const renderHubPage = () => (
        <ScrollView
            style={{ width }}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
        >
            {/* VIP Balance & Hero Card */}
            <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                    <View style={styles.crownWrap}>
                        <MaterialCommunityIcons name="crown" size={20} color="#FBBF24" />
                    </View>
                    <View style={styles.heroTitles}>
                        <Text style={styles.heroTitle}>LUXONET BOUTIQUE</Text>
                        <Text style={styles.heroSubtitle}>Exclusive Sovereign Acquisitions</Text>
                    </View>
                    <View style={styles.tierPill}>
                        <Text style={styles.tierPillText}>CENTURION</Text>
                    </View>
                </View>

                <View style={styles.cashRow}>
                    <View>
                        <Text style={styles.cashLabel}>AVAILABLE LIQUIDITY</Text>
                        <Text style={styles.cashFigure}>{formatPrice(playerMoney)}</Text>
                    </View>
                </View>
            </View>

            {/* Ad Carousel */}
            <View style={styles.bannerWrap}>
                <AdBannerCarousel onPressBanner={handleVisitShop} />
            </View>

            {/* Luxury Departments Grid */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>LUXURY DEPARTMENTS</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat, catIdx) => (
                        <Pressable
                            key={cat.id}
                            onPress={() => scrollToPage(catIdx + 1)}
                            style={({ pressed }) => [
                                styles.categoryCard,
                                pressed && styles.cardPressed,
                            ]}
                        >
                            <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                                <MaterialCommunityIcons
                                    name={cat.icon as any}
                                    size={24}
                                    color={cat.color}
                                />
                            </View>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <Text style={styles.categoryDesc} numberOfLines={1}>
                                {cat.desc}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Trending Items */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>TRENDING SHOWCASE</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingScroll}
                >
                    {trendingItems.map((item) => {
                        const shop = SHOPS.find((s) => s.id === item.shopId);
                        const itemCat = getCategoryTheme(item.category);

                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => item.shopId && handleVisitShop(item.shopId)}
                                style={({ pressed }) => [
                                    styles.trendingCard,
                                    pressed && styles.cardPressed,
                                ]}
                            >
                                <View style={[styles.trendingIconWrap, { backgroundColor: itemCat.bg }]}>
                                    <MaterialCommunityIcons
                                        name={itemCat.icon as any}
                                        size={22}
                                        color={itemCat.color}
                                    />
                                </View>
                                <Text style={styles.trendingName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <Text style={styles.trendingPrice}>{formatPrice(item.price)}</Text>
                                <Text style={styles.trendingShop}>
                                    {shop?.name || 'Exclusive'}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
        </ScrollView>
    );

    // ============================================================================
    // RENDER: CATEGORY PAGE (Pages 1..6)
    // ============================================================================
    const renderCategoryPage = (cat: typeof CATEGORIES[0]) => {
        const filteredShops = SHOPS.filter((s) => s.category === cat.id);

        return (
            <ScrollView
                key={cat.id}
                style={{ width }}
                contentContainerStyle={styles.pageContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.catBanner}>
                    <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                        <MaterialCommunityIcons
                            name={cat.icon as any}
                            size={22}
                            color={cat.color}
                        />
                    </View>
                    <View>
                        <Text style={styles.catBannerTitle}>
                            {cat.name.toUpperCase()} HOUSES
                        </Text>
                        <Text style={styles.catBannerSub}>
                            {filteredShops.length} Authorized Boutiques
                        </Text>
                    </View>
                </View>

                {filteredShops.map((shop) => (
                    <ShopPreviewCard
                        key={shop.id}
                        shopId={shop.id}
                        name={shop.name}
                        description={shop.description}
                        emoji={shop.emoji}
                        color={shop.bannerColor}
                        onVisit={() => handleVisitShop(shop.id)}
                    />
                ))}
            </ScrollView>
        );
    };

    // ============================================================================
    // RENDER: SHOP DETAIL VIEW
    // ============================================================================
    const renderShopDetail = () => {
        const shop = SHOPS.find((s) => s.id === selectedShopId);
        if (!shop) return null;

        const shopItems = getShopItems(shop.id).map((item: any) => ({
            ...item,
            website: shop.name,
            brandColor: shop.bannerColor,
        }));

        return (
            <ScrollView
                contentContainerStyle={styles.pageContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Shop Banner */}
                <View style={styles.shopBanner}>
                    <View style={styles.shopTitleRow}>
                        <Text style={styles.shopEmoji}>{shop.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.shopName}>{shop.name}</Text>
                            <Text style={styles.shopDesc}>{shop.description}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Grid */}
                <View style={styles.itemsGrid}>
                    {shopItems.map((item: any) => {
                        const owned = isOwned(item.id);
                        const isInCart = cart.some((c) => c.id === item.id);
                        const itemCat = getCategoryTheme(item.category);

                        return (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemTopRow}>
                                    <View style={[styles.itemIconWrap, { backgroundColor: itemCat.bg }]}>
                                        <MaterialCommunityIcons
                                            name={itemCat.icon as any}
                                            size={16}
                                            color={itemCat.color}
                                        />
                                    </View>
                                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                                </View>

                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.name}
                                </Text>

                                {/* Specs */}
                                {item.specs && item.specs.length > 0 && (
                                    <View style={styles.specsRow}>
                                        {item.specs.slice(0, 2).map((spec: string, idx: number) => (
                                            <View key={idx} style={styles.specTag}>
                                                <Text style={styles.specText}>{spec}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Add Button */}
                                <Pressable
                                    onPress={() =>
                                        isInCart
                                            ? navigation.navigate('Cart')
                                            : !owned && addToCart(item)
                                    }
                                    style={({ pressed }) => [
                                        styles.buyButton,
                                        owned && styles.buyButtonOwned,
                                        isInCart && styles.buyButtonInCart,
                                        pressed && !owned && styles.cardPressed,
                                    ]}
                                    disabled={owned}
                                >
                                    <Text
                                        style={[
                                            styles.buyButtonText,
                                            owned && styles.buyTextOwned,
                                            isInCart && styles.buyTextInCart,
                                        ]}
                                    >
                                        {owned ? 'OWNED' : isInCart ? 'IN CART' : 'ACQUIRE'}
                                    </Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={styles.root}>
            {/* Screen Header with Back Arrow, Dynamic Subtitle and Category Underline */}
            <ScreenHeader
                title="LUXONET STORE"
                subtitle={headerSubtitle}
                category="company"
                onBack={handleBack}
                right={renderCartButton()}
            />

            {/* Horizontal Category Pill Bar (when in Pager mode) */}
            {currentView !== 'SHOP_DETAIL' && (
                <View style={styles.pillBarWrap}>
                    <ScrollView
                        ref={pillScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillScroll}
                    >
                        {TABS.map((tab, idx) => {
                            const isActive = activeIndex === idx;
                            return (
                                <Pressable
                                    key={tab.id}
                                    style={[
                                        styles.catPill,
                                        isActive && styles.catPillActive,
                                    ]}
                                    onPress={() => scrollToPage(idx)}
                                >
                                    <MaterialCommunityIcons
                                        name={tab.icon as any}
                                        size={14}
                                        color={isActive ? '#7DD3FC' : tab.color}
                                        style={{ marginRight: 5 }}
                                    />
                                    <Text
                                        style={[
                                            styles.catPillText,
                                            isActive && styles.catPillTextActive,
                                        ]}
                                    >
                                        {tab.name.toUpperCase()}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Screen Body */}
            <View style={styles.contentArea}>
                {currentView === 'SHOP_DETAIL' ? (
                    renderShopDetail()
                ) : (
                    <ScrollView
                        ref={pagerRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handlePagerScroll}
                        scrollEventThrottle={16}
                    >
                        {renderHubPage()}
                        {CATEGORIES.map((cat) => renderCategoryPage(cat))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    contentArea: {
        flex: 1,
    },
    pageContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: NAV_BAR_CLEARANCE + 32, // Clear CrystalNavBar safely
    },
    // Top Cart Button
    cartBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBtnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#05A8F6',
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },

    // Horizontal Pill Bar
    pillBarWrap: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    pillScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    catPillActive: {
        backgroundColor: '#183D5C',
    },
    catPillText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    catPillTextActive: {
        color: '#7DD3FC',
    },

    // Hero Card
    heroCard: {
        backgroundColor: '#121417',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    crownWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#20242B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    heroTitles: {
        flex: 1,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    heroSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 1,
    },
    tierPill: {
        backgroundColor: '#20242B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tierPillText: {
        color: '#FBBF24',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cashRow: {
        marginTop: 2,
    },
    cashLabel: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    cashFigure: {
        color: theme.colors.primary,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    bannerWrap: {
        marginBottom: 14,
    },

    // Sections
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        color: '#05A8F6',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
        paddingHorizontal: 2,
    },

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: GRID_CARD_WIDTH,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        alignItems: 'flex-start',
    },
    catIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    categoryName: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    categoryDesc: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },
    cardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },

    // Trending Carousel
    trendingScroll: {
        gap: 10,
        paddingVertical: 2,
    },
    trendingCard: {
        width: 145,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 12,
        justifyContent: 'space-between',
    },
    trendingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    trendingName: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 15,
        marginBottom: 6,
    },
    trendingPrice: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },
    trendingShop: {
        color: theme.colors.textMuted,
        fontSize: 10,
    },

    // Category Header Banner
    catBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        gap: 12,
    },
    catBannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    catBannerSub: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },

    // Shop Detail View
    shopBanner: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },
    shopTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shopEmoji: {
        fontSize: 32,
    },
    shopName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    shopDesc: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    itemsGrid: {
        gap: 10,
    },
    itemCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
    },
    itemTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    itemPrice: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    specsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    specTag: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    specText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '600',
    },
    buyButton: {
        backgroundColor: '#183D5C',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyButtonOwned: {
        backgroundColor: theme.colors.surfaceRaised,
    },
    buyButtonInCart: {
        backgroundColor: '#20242B',
    },
    buyButtonText: {
        color: '#7DD3FC',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    buyTextOwned: {
        color: theme.colors.textMuted,
    },
    buyTextInCart: {
        color: '#FBBF24',
    },
});

export default ShoppingScreen;