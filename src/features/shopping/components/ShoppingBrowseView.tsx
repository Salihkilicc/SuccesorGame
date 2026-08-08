import React, { useMemo } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    ScrollView,
    StyleSheet,
    Text,
    Pressable,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { theme } from '../../../core/theme';
import { useAssetStore } from '../store/useAssetStore';
import { SHOP_DATA } from '../data/shoppingRegistry';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.xl * 3) / 2;

type ShoppingBrowseViewProps = {
    website: string;
    onBack: () => void;
    onCartPress: () => void;
    onHomePress: () => void;
};

type BrandConfig = {
    name: string;
    color: string;
    emoji: string;
};

const BRAND_CONFIGS: Record<string, BrandConfig> = {
    Velocity: { name: t('ui.velocityMotors'), color: '#E9B8C9', emoji: '🏎️' },
    Dynasty8: { name: t('ui.dynasty8'), color: '#0A2A92', emoji: '🏠' },
    Luxe: { name: t('ui.luxeVault'), color: '#0A2A92', emoji: '💎' },
    Elitas: { name: t('ui.elitasTravel'), color: '#E9B8C9', emoji: '✈️' },
};

const ShoppingBrowseView = ({
    website,
    onBack,
    onCartPress,
    onHomePress,
}: ShoppingBrowseViewProps) => {
    useLocale();
    const { addToCart, isOwned, cart } = useAssetStore();
    const brandConfig = BRAND_CONFIGS[website] || BRAND_CONFIGS.Velocity;

    // Filter items by website
    const items = useMemo(() => {
        const allItems: any[] = [];
        SHOP_DATA.forEach((shop) => {
            shop.items.forEach((item: any) => {
                if (item.website === website) {
                    allItems.push(item);
                }
            });
        });
        return allItems;
    }, [website]);

    const formatPrice = (price: number) => {
        if (price >= 1000000000) {
            return `$${(price / 1000000000).toFixed(1)}B`;
        } else if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `$${(price / 1000).toFixed(0)}K`;
        }
        return `$${price}`;
    };

    const handleAddToCart = (item: any) => {
        if (isOwned(item.id)) {
            return; // Already owned
        }
        addToCart(item);
    };

    const isInCart = (itemId: string) => {
        return cart.some((item) => item.id === itemId);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#31241F" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: brandConfig.color }]}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                    <Text style={styles.backText}>{t('ui.back')}</Text>
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.brandEmoji}>{brandConfig.emoji}</Text>
                    <Text style={styles.brandName}>{brandConfig.name}</Text>
                </View>
                <Pressable onPress={onCartPress} style={styles.cartButton}>
                    <Text style={styles.cartIcon}>🛒</Text>
                    {cart.length > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cart.length}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Items Grid */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('ui.noItemsAvailable')}</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {items.map((item) => {
                            const owned = isOwned(item.id);
                            const inCart = isInCart(item.id);

                            return (
                                <View key={item.id} style={styles.card}>
                                    {/* Item Emoji/Icon */}
                                    <View
                                        style={[
                                            styles.itemIcon,
                                            { backgroundColor: `${brandConfig.color}20` },
                                        ]}
                                    >
                                        <Text style={styles.itemEmoji}>
                                            {brandConfig.emoji}
                                        </Text>
                                    </View>

                                    {/* Item Info */}
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.itemPrice}>
                                            {formatPrice(item.price)}
                                        </Text>

                                        {/* Specs Tags */}
                                        {item.specs && item.specs.length > 0 && (
                                            <View style={styles.specsTags}>
                                                {item.specs.slice(0, 2).map((spec: string, idx: number) => (
                                                    <View
                                                        key={idx}
                                                        style={[
                                                            styles.specTag,
                                                            { borderColor: brandConfig.color },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.specText,
                                                                { color: brandConfig.color },
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {spec}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Action Button */}
                                    <Pressable
                                        onPress={() => handleAddToCart(item)}
                                        disabled={owned || inCart}
                                        style={({ pressed }) => [
                                            styles.addButton,
                                            {
                                                backgroundColor: owned
                                                    ? '#42312A'
                                                    : inCart
                                                        ? '#0A2A92'
                                                        : '#E9B8C9',
                                            },
                                            pressed && !owned && !inCart && styles.addButtonPressed,
                                        ]}
                                    >
                                        <Text style={styles.addButtonText}>
                                            {owned ? 'Owned' : inCart ? 'In Cart' : 'Add to Cart'}
                                        </Text>
                                    </Pressable>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Bottom Spacer for Stats Bar */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Stats Bar */}
            <CrystalNavBar activeTab="Life" variant="dark" />
        </SafeAreaView>
    );
};

export default ShoppingBrowseView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#31241F',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    brandEmoji: {
        fontSize: 24,
    },
    brandName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    cartButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartIcon: {
        fontSize: 20,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#533D35',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    // Content
    content: {
        padding: theme.spacing.lg,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 3,
    },
    emptyText: {
        color: '#7F5E51',
        fontSize: 16,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#31241F',
        borderRadius: 16,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: theme.spacing.sm,
    },
    itemIcon: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemEmoji: {
        fontSize: 48,
    },
    itemInfo: {
        gap: 4,
    },
    itemName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
    },
    itemPrice: {
        color: '#E9B8C9',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 2,
    },
    specsTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    specTag: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    specText: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    addButton: {
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    addButtonPressed: {
        opacity: 0.8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
