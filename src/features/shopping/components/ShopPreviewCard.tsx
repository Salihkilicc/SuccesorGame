import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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

const ShopPreviewCard = ({ shopId, name, emoji, description, color, onVisit }: ShopPreviewCardProps) => {

    // Get 3 random items for this shop
    const previewItems = useMemo(() => {
        const shopItems = ITEMS.filter(item => item.shopId === shopId);
        // Shuffle and take 3
        return shopItems.sort(() => 0.5 - Math.random()).slice(0, 3);
    }, [shopId]);

    const formatPrice = (price: number) => {
        if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
        if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
        return `$${price}`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Pressable
                onPress={onVisit}
                style={({ pressed }) => [
                    styles.header,
                    pressed && styles.headerPressed
                ]}
            >
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                        <Text style={styles.emoji}>{emoji}</Text>
                    </View>
                    <View>
                        <Text style={styles.shopName}>{name}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>
                </View>

                <View style={[styles.visitButton, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.visitText, { color: color }]}>Visit Site ›</Text>
                </View>
            </Pressable>

            {/* Items Preview */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemsScroll}
            >
                {previewItems.map(item => (
                    <Pressable
                        key={item.id}
                        onPress={onVisit} // Clicking an item also goes to the shop
                        style={({ pressed }) => [
                            styles.itemCard,
                            pressed && styles.itemPressed
                        ]}
                    >
                        <View style={[styles.itemImage, { backgroundColor: '#2A2A2A' }]}>
                            <Text style={styles.itemEmoji}>
                                {item.category === 'VEHICLE' ? '🏎️' :
                                    item.category === 'WATCH' ? '⌚' :
                                        item.category === 'JEWELRY' ? '💎' :
                                            item.category === 'MARINE' ? '⛵' :
                                                item.category === 'AIRCRAFT' ? '✈️' : '🏠'}
                            </Text>
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

export default ShopPreviewCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    headerPressed: {
        backgroundColor: '#252525',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    shopName: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    description: {
        color: '#888',
        fontSize: 13,
    },
    visitButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    visitText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Items
    itemsScroll: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    itemCard: {
        width: 120,
        gap: 8,
    },
    itemPressed: {
        opacity: 0.8,
    },
    itemImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemEmoji: {
        fontSize: 32,
    },
    itemInfo: {
        gap: 2,
    },
    itemName: {
        color: '#CCC',
        fontSize: 12,
        fontWeight: '600',
    },
    itemPrice: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
