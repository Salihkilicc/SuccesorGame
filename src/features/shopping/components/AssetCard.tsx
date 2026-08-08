import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';

import { OwnedAsset } from '../types';

interface AssetCardProps {
    item: OwnedAsset;
    onSell: (item: OwnedAsset) => void;
    onRepair: (item: OwnedAsset) => void;
    onPropose?: (item: OwnedAsset) => void;
    variant?: 'list' | 'grid';
}

const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
};

const AssetCard: React.FC<AssetCardProps> = ({ item, onSell, onRepair, onPropose, variant = 'list' }) => {
    useLocale();
    const isGrid = variant === 'grid';

    // 1. Determine Visuals based on Category/Value
    const isPremium = item.price > 10000000; // > $10M = Gold Border
    const borderColor = isPremium ? '#05A8F6' : '#323A40';
    const emoji = getEmoji(item.category);

    // 2. Condition Color Logic
    let conditionColor = '#05A8F6'; // Blue
    if (item.condition < 50) conditionColor = '#FF8A8A'; // Red
    else if (item.condition < 80) conditionColor = '#FF8A8A'; // Pink

    // 3. Action Logic
    let ActionButton = null;

    if (['VEHICLE', 'MARINE', 'AIRCRAFT'].includes(item.category)) {
        ActionButton = (
            <Pressable
                style={[styles.actionButton, isGrid && styles.actionButtonTile]}
                onPress={() => onSell(item)}
            >
                <Text style={[styles.actionText, { color: '#FF8A8A' }, isGrid && styles.actionIconTile]}>{isGrid ? '💰' : 'SELL'}</Text>
            </Pressable>
        );
    } else if (item.category === 'REAL_ESTATE') {
        if (item.condition < 100) {
            ActionButton = (
                <Pressable
                    style={[styles.actionButton, isGrid && styles.actionButtonTile]}
                    onPress={() => onRepair(item)}
                >
                    <Text style={[styles.actionText, { color: '#FFFFFF' }, isGrid && styles.actionIconTile]}>{isGrid ? '🔨' : 'RENOVATE'}</Text>
                </Pressable>
            );
        } else {
            if (isGrid) {
                ActionButton = (
                    <View style={styles.actionButtonTile}>
                        <Text style={styles.actionIconTile}>✨</Text>
                    </View>
                )
            } else {
                ActionButton = (
                    <View style={[styles.badge, { backgroundColor: 'rgba(207,208,210,0.2)', borderColor: 'rgba(255,255,255,0.06)' }]}>
                        <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{t('ui.perfect')}</Text>
                    </View>
                );
            }
        }
    } else if (['shop_vow_eternity', 'shop_the_promise'].includes(item.shopId)) {
        // Rings/Proposals
        ActionButton = (
            <Pressable
                style={[styles.actionButton, isGrid && styles.actionButtonTile]}
                onPress={() => onPropose && onPropose(item)}
            >
                <Text style={[styles.actionText, { color: '#FF8A8A' }, isGrid && styles.actionIconTile]}>{isGrid ? '💍' : 'PROPOSE'}</Text>
            </Pressable>
        );
    }

    // ===================================
    // GRID TILE RENDER (COMPACT)
    // ===================================
    if (isGrid) {
        return (
            <View style={[styles.containerTile, { borderColor }]}>
                {/* Row 1: Emoji Left, Action Right */}
                <View style={styles.tileTopRow}>
                    <Text style={styles.tileEmoji}>{emoji}</Text>
                    {ActionButton}
                </View>

                {/* Spacer pushes bottom text down */}
                <View style={{ flex: 1 }} />

                {/* Row 2: Title & Price */}
                <View style={styles.tileBottomInfo}>
                    <Text style={styles.tileTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.tilePrice}>{formatCurrency(item.marketValue)}</Text>
                </View>

                {/* Footer: Condition Strip */}
                <View style={[styles.conditionStrip, { width: `${item.condition}%`, backgroundColor: conditionColor }]} />
            </View>
        );
    }

    // ===================================
    // LIST RENDER (Detailed)
    // ===================================
    return (
        <View style={[styles.container, { borderColor }]}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{emoji}</Text>
                </View>
                <View style={styles.valueContainer}>
                    <Text style={styles.marketValueLabel}>{t('ui.marketValue')}</Text>
                    <Text style={styles.marketValue}>{formatCurrency(item.marketValue)}</Text>
                </View>
            </View>

            {/* Title Row */}
            <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.category.replace('_', ' ')}</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.conditionContainer}>
                    <View style={styles.conditionBarBg}>
                        <View
                            style={[
                                styles.conditionBarFill,
                                { width: `${item.condition}%`, backgroundColor: conditionColor }
                            ]}
                        />
                    </View>
                    <Text style={[styles.conditionText, { color: conditionColor }]}>
                        Cond: {item.condition}%
                    </Text>
                </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
                {ActionButton}
            </View>
        </View>
    );
};

// Helper
const getEmoji = (category: string) => {
    switch (category) {
        case 'VEHICLE': return '🏎️';
        case 'MARINE': return '🚤';
        case 'AIRCRAFT': return '✈️';
        case 'REAL_ESTATE': return '🏠';
        case 'WATCH': return '⌚';
        case 'JEWELRY': return '💎';
        default: return '📦';
    }
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C242C',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#1C242C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    // Grid Tile specific styles
    containerTile: {
        backgroundColor: '#434B50', // Darker background
        borderRadius: 12,
        borderWidth: 1,
        height: 130, // Much more compact
        padding: 10,
        overflow: 'hidden',
        justifyContent: 'space-between',
        shadowColor: "#1C242C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    tileTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tileEmoji: {
        fontSize: 32,
    },
    tileBottomInfo: {
        marginBottom: 6, // Space for condition strip
    },
    tileTitle: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    tilePrice: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: 'monospace', // Tech feel
        fontWeight: '500',
    },
    conditionStrip: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
    },

    // Actions
    actionButtonTile: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#434B50',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 0,
        minWidth: 0,
        paddingVertical: 0,
    },
    actionIconTile: {
        fontSize: 16,
    },

    // Shared / List Styles
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    marketValueLabel: {
        color: '#FFFFFF',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    marketValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    titleRow: {
        marginBottom: 16,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    statsRow: {
        marginBottom: 16,
    },
    conditionContainer: {
        width: '100%',
    },
    conditionBarBg: {
        height: 4,
        backgroundColor: '#323A40',
        borderRadius: 3,
        marginBottom: 4,
        overflow: 'hidden',
    },
    conditionBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 100,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});

export default AssetCard;
