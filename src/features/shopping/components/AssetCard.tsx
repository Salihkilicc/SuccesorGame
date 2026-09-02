// src/features/shopping/components/AssetCard.tsx
//
// ============================================================================
//  EXECUTIVE ASSET CARD COMPONENT
// ============================================================================
//
//  Solid surface card displaying owned luxury assets with category-specific
//  curated colors, condition progress bar, market value, and action buttons.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { iconForItem, shopTheme } from '../data/shopIdentity';
import { OwnedAsset } from '../types';
import { t, useLocale } from '../../../core/i18n';
import { translateCategory } from '../../../data/i18n/profileLoveShopText';

interface AssetCardProps {
    item: OwnedAsset;
    onSell: (item: OwnedAsset) => void;
    onRepair: (item: OwnedAsset) => void;
    onPropose?: (item: OwnedAsset) => void;
    variant?: 'list' | 'grid';
}

const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000_000) return `$${(amount / 1_000_000_000_000).toFixed(2)}T`;
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
};

// SHELVED: the fourth copy of the department icon list, and the one on the
// screen where it hurt most. A collection of forty things drew six symbols, so
// the inventory looked like a spreadsheet of categories rather than a vault.
//
//   const getCategoryTheme = (category: string) => { switch (category) { ... } };

export const AssetCard: React.FC<AssetCardProps> = ({
    item,
    onSell,
    onRepair,
    onPropose,
    variant = 'grid',
}) => {
    useLocale();
    const isGrid = variant === 'grid';
    // The SELLING SHOP'S colour and the ITEM'S own symbol. A vault of forty
    // things drew six symbols in six colours before this, so an inventory
    // read as a spreadsheet of departments rather than as a collection.
    const look = shopTheme(item.shopId);
    const symbol = iconForItem(item);
    const categoryLabel = translateCategory(item.category);

    // Condition color
    const condition = Math.max(0, Math.min(100, item.condition || 100));
    const conditionColor = condition < 60 ? '#FFA94D' : '#05A8F6';

    if (isGrid) {
        return (
            <View style={styles.gridCard}>
                {/* Header Icon + Category Badge */}
                <View style={styles.gridTopRow}>
                    <View style={[styles.iconWrap, { backgroundColor: look.wash }]}>
                        <MaterialCommunityIcons
                            name={symbol as any}
                            size={18}
                            color={look.tint}
                        />
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryText, { color: look.tint }]} numberOfLines={1}>
                            {categoryLabel}
                        </Text>
                    </View>
                </View>

                {/* Asset Name */}
                <Text style={styles.assetName} numberOfLines={2}>
                    {item.name}
                </Text>

                {/* Market Value */}
                <Text style={styles.marketValue}>
                    {formatCurrency(item.marketValue || item.price)}
                </Text>

                {/* Condition Bar */}
                <View style={styles.conditionRow}>
                    <View style={styles.conditionTrack}>
                        <View
                            style={[
                                styles.conditionFill,
                                { width: `${condition}%`, backgroundColor: conditionColor },
                            ]}
                        />
                    </View>
                    <Text style={[styles.conditionPercent, { color: conditionColor }]}>
                        {condition}%
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    {['VEHICLE', 'MARINE', 'AIRCRAFT', 'WATCH', 'JEWELRY', 'COLLECTION'].includes(item.category) && (
                        <Pressable
                            style={({ pressed }) => [styles.btnAction, pressed && styles.btnPressed]}
                            onPress={() => onSell(item)}
                        >
                            <Text style={styles.btnActionText}>{t('shop.sell')}</Text>
                        </Pressable>
                    )}

                    {item.category === 'REAL_ESTATE' && (
                        condition < 100 ? (
                            <Pressable
                                style={({ pressed }) => [styles.btnAction, styles.btnBlue, pressed && styles.btnPressed]}
                                onPress={() => onRepair(item)}
                            >
                                <Text style={styles.btnBlueText}>{t('shop.repair')}</Text>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={({ pressed }) => [styles.btnAction, pressed && styles.btnPressed]}
                                onPress={() => onSell(item)}
                            >
                                <Text style={styles.btnActionText}>{t('shop.sell')}</Text>
                            </Pressable>
                        )
                    )}

                    {['shop_vow_eternity', 'shop_the_promise'].includes(item.shopId) && onPropose && (
                        <Pressable
                            style={({ pressed }) => [styles.btnAction, styles.btnAmber, pressed && styles.btnPressed]}
                            onPress={() => onPropose(item)}
                        >
                            <Text style={styles.btnAmberText}>{t('shop.propose')}</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    // List Variant
    return (
        <View style={styles.listCard}>
            <View style={[styles.iconWrap, { backgroundColor: look.wash }]}>
                <MaterialCommunityIcons
                    name={symbol as any}
                    size={22}
                    color={look.tint}
                />
            </View>

            <View style={styles.listInfoBlock}>
                <Text style={styles.listTitle} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.listSubtitle}>
                    {categoryLabel} • {formatCurrency(item.marketValue || item.price)}
                </Text>
            </View>

            <Pressable
                style={({ pressed }) => [styles.btnAction, pressed && styles.btnPressed]}
                onPress={() => onSell(item)}
            >
                <Text style={styles.btnActionText}>{t('shop.sell')}</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    gridCard: {
        backgroundColor: theme.colors.surface, // Solid surface, NO border
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        justifyContent: 'space-between',
        minHeight: 165,
    },
    gridTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        maxWidth: 85,
    },
    categoryText: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    assetName: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 16,
        marginBottom: 4,
    },
    marketValue: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 8,
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    conditionTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.surfaceRaised,
        overflow: 'hidden',
    },
    conditionFill: {
        height: '100%',
        borderRadius: 2,
    },
    conditionPercent: {
        fontSize: 9,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 6,
    },
    btnAction: {
        flex: 1,
        backgroundColor: theme.colors.surfaceRaised,
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnBlue: {
        backgroundColor: '#183D5C',
    },
    btnBlueText: {
        color: '#7DD3FC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    btnAmber: {
        backgroundColor: '#4E3A20',
    },
    btnAmberText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    btnActionText: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    btnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },

    // List Styles
    listCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    listInfoBlock: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    listTitle: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    listSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
});

export default AssetCard;
