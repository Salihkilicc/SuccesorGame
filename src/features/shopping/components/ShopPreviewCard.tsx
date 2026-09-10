// src/features/shopping/components/ShopPreviewCard.tsx
//
// ============================================================================
//  LUXONET BOUTIQUE PREVIEW CARD
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { t, useLocale } from '../../../core/i18n';
import { translateShopDescription, translateItemName } from '../../../data/i18n/profileLoveShopText';
import { ITEMS } from '../data/shoppingRegistry';
import { iconForItem, shopTheme } from '../data/shopIdentity';
import { onShelf, shelfIds } from '../logic/shelfNow';

// ------------------------------------------------------------------
//  THE SHOP'S LOOK COMES FROM ITS ID, NOT FROM PROPS
// ------------------------------------------------------------------
//  `emoji` and `color` were passed in and `emoji` was never even read -
//  the card drew a generic storefront for all twenty seven shops while
//  the caller dutifully handed it a symbol it ignored. Both are gone;
//  `shopTheme(shopId)` is the one place a shop's look is decided.
// ------------------------------------------------------------------
type ShopPreviewCardProps = {
    shopId: string;
    name: string;
    description: string;
    onVisit: () => void;
};

// SHELVED: a fourth copy of the department icon list, one screen away from
// three others. `iconForItem` is per ITEM rather than per department, which is
// the whole point of the change, and there is one of it.
//
//   const getCategoryIcon = (category: string) => { switch (category) { ... } };

export const ShopPreviewCard = ({
    shopId,
    name,
    description,
    onVisit,
}: ShopPreviewCardProps) => {
    // Re-renders when the language changes; every t() below needs it.
    useLocale();
    const look = shopTheme(shopId);

    const previewItems = useMemo(() => {
        // Gated, or the card advertises three things the shop behind it will
        // not sell you for another generation. See logic/shelfNow.
        const open = shelfIds();
        const shopItems = ITEMS.filter(
            (item) => item.shopId === shopId && onShelf(item.id, open),
        );
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
                    <View style={[styles.iconContainer, { backgroundColor: look.wash, borderColor: look.edge }]}>
                        <MaterialCommunityIcons
                            name={look.icon as any}
                            size={20}
                            color={look.tint}
                        />
                    </View>
                    <View style={styles.titlesWrap}>
                        <Text style={styles.shopName}>{name}</Text>
                        <Text style={styles.description} numberOfLines={1}>
                            {translateShopDescription(description)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.visitButton, { backgroundColor: look.wash, borderColor: look.edge }]}>
                    <Text style={[styles.visitText, { color: look.tint }]}>{t('luxo.enter')}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color={look.tint} />
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
                        <View style={[styles.itemImage, { backgroundColor: look.wash }]}>
                            <MaterialCommunityIcons
                                name={iconForItem(item) as any}
                                size={20}
                                color={look.tint}
                            />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {translateItemName(item.name)}
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
        borderWidth: 1,
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
        borderWidth: 1,
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
