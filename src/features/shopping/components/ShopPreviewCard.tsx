// src/features/shopping/components/ShopPreviewCard.tsx
//
// ============================================================================
//  LUXONET BOUTIQUE PREVIEW CARD
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { ITEMS } from '../data/shoppingRegistry';

type ShopPreviewCardProps = {
    shopId: string;
    name: string;
    emoji: string;
    description: string;
    color: string;
    onVisit: () => void;
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'VEHICLE':
            return 'car-sports';
        case 'WATCH':
            return 'watch';
        case 'JEWELRY':
            return 'diamond-stone';
        case 'MARINE':
            return 'ferry';
        case 'AIRCRAFT':
            return 'airplane';
        default:
            return 'home-city-outline';
    }
};

export const ShopPreviewCard = ({
    shopId,
    name,
    description,
    onVisit,
}: ShopPreviewCardProps) => {
    const previewItems = useMemo(() => {
        const shopItems = ITEMS.filter((item) => item.shopId === shopId);
        return shopItems.slice(0, 3);
    }, [shopId]);

    const formatPrice = (price: number) => {
        if (price >= 1000000000) return `$${(price / 1000000000).toFixed(2)}B`;
        if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}k`;
        return `$${price.toLocaleString()}`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Pressable
                onPress={onVisit}
                style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                            name="storefront-outline"
                            size={20}
                            color="#05A8F6"
                        />
                    </View>
                    <View style={styles.titlesWrap}>
                        <Text style={styles.shopName}>{name}</Text>
                        <Text style={styles.description} numberOfLines={1}>
                            {description}
                        </Text>
                    </View>
                </View>

                <View style={styles.visitButton}>
                    <Text style={styles.visitText}>ENTER</Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color="#7DD3FC" />
                </View>
            </Pressable>

            {/* Items Preview */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemsScroll}
            >
                {previewItems.map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={onVisit}
                        style={({ pressed }) => [styles.itemCard, pressed && styles.itemPressed]}
                    >
                        <View style={styles.itemImage}>
                            <MaterialCommunityIcons
                                name={getCategoryIcon(item.category)}
                                size={20}
                                color="#05A8F6"
                            />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface, // Solid surface, NO border
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerPressed: {
        backgroundColor: theme.colors.surfaceRaised,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#183D5C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titlesWrap: {
        flex: 1,
    },
    shopName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 1,
    },
    description: {
        color: theme.colors.textMuted,
        fontSize: 11,
    },
    visitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#183D5C',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 2,
    },
    visitText: {
        color: '#7DD3FC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    itemsScroll: {
        gap: 8,
        padding: 12,
    },
    itemCard: {
        width: 120,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: 12,
        padding: 10,
        justifyContent: 'space-between',
    },
    itemPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.97 }],
    },
    itemImage: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#183D5C',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    itemInfo: {
        gap: 2,
    },
    itemName: {
        color: theme.colors.textPrimary,
        fontSize: 11,
        fontWeight: '700',
    },
    itemPrice: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '800',
    },
});

export default ShopPreviewCard;
