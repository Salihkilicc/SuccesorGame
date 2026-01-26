import React, { useMemo } from 'react';
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
import { SHOP_DATA } from '../data/ShoppingData';
import BottomStatsBar from '../../../components/common/BottomStatsBar';

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
    Velocity: { name: 'Velocity Motors', color: '#E74C3C', emoji: '🏎️' },
    Dynasty8: { name: 'Dynasty 8', color: '#2C3E50', emoji: '🏠' },
    Luxe: { name: 'Luxe Vault', color: '#F1C40F', emoji: '💎' },
    Elitas: { name: 'Elitas Travel', color: '#3498DB', emoji: '✈️' },
};

const ShoppingBrowseView = ({
    website,
    onBack,
    onCartPress,
    onHomePress,
}: ShoppingBrowseViewProps) => {
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
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: brandConfig.color }]}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                    <Text style={styles.backText}>Back</Text>
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
                        <Text style={styles.emptyText}>No items available</Text>
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
                                                    ? '#555'
                                                    : inCart
                                                        ? '#27AE60'
                                                        : brandConfig.color,
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
            <BottomStatsBar onHomePress={onHomePress} />
        </SafeAreaView>
    );
};

export default ShoppingBrowseView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    backIcon: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    backText: {
        color: '#FFF',
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
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    cartButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
        backgroundColor: theme.colors.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: '#FFF',
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
        color: '#666',
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
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#2A2A2A',
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
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
    },
    itemPrice: {
        color: '#27AE60',
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
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
