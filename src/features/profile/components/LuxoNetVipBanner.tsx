// src/features/profile/components/LuxoNetVipBanner.tsx
//
// ============================================================================
//  LUXONET STORE VIP BANNER
// ============================================================================
//
//  Ultra-premium VIP luxury marketplace entry card with deep black obsidian
//  styling and direct Portfolio Inventory button.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';

interface LuxoNetVipBannerProps {
    onPress: () => void;
    onInventoryPress?: () => void;
    luxurySummary: {
        count: number;
        totalValueFormatted: string;
        prestige: string | number;
        tier: string;
    };
}

export const LuxoNetVipBanner: React.FC<LuxoNetVipBannerProps> = ({
    onPress,
    onInventoryPress,
    luxurySummary,
}) => {
    return (
        <Pressable
            style={({ pressed }) => [styles.bannerCard, pressed && styles.pressed]}
            onPress={onPress}
        >
            {/* Top Row: VIP Crown + Store Name + Action Chevron */}
            <View style={styles.topRow}>
                <View style={styles.vipIconWrap}>
                    <MaterialCommunityIcons name="crown" size={22} color="#FBBF24" />
                </View>

                <View style={styles.titleBlock}>
                    <Text style={styles.vaultTitle}>LUXONET STORE</Text>
                </View>

                <View style={styles.enterButton}>
                    <Text style={styles.enterText}>ENTER</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#FFFFFF" />
                </View>
            </View>

            {/* Bottom Row: Inventory Action Button + Portfolio Metric Tiles */}
            <View style={styles.metricsRow}>
                <Pressable
                    style={({ pressed }) => [
                        styles.inventoryBtn,
                        pressed && styles.inventoryBtnPressed,
                    ]}
                    onPress={(e) => {
                        e.stopPropagation();
                        onInventoryPress?.();
                    }}
                >
                    <MaterialCommunityIcons name="briefcase" size={14} color="#FFFFFF" />
                    <Text style={styles.inventoryBtnText}>INVENTORY</Text>
                </Pressable>

                <View style={styles.metricTile}>
                    <Text style={styles.metricLabel}>PORTFOLIO</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                        {luxurySummary.totalValueFormatted}
                    </Text>
                </View>

                <View style={styles.metricTile}>
                    <Text style={styles.metricLabel}>PRESTIGE</Text>
                    <Text style={[styles.metricValue, { color: '#FBBF24' }]}>
                        {luxurySummary.prestige}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    bannerCard: {
        backgroundColor: '#121417', // Deep sleek obsidian black surface, NO border
        borderRadius: 16,
        padding: 16,
        marginBottom: 28,
        marginTop: 4,
    },
    pressed: {
        backgroundColor: '#1C1F24',
        transform: [{ scale: 0.99 }],
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    vipIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#20242B', // Elevated dark charcoal
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    titleBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    vaultTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    enterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#262B33',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 2,
    },
    enterText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    metricsRow: {
        flexDirection: 'row',
        backgroundColor: '#0A0C0E', // Sleek black recess
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 6,
        gap: 6,
        alignItems: 'center',
    },
    inventoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#22272F',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    inventoryBtnPressed: {
        backgroundColor: '#303742',
        transform: [{ scale: 0.97 }],
    },
    inventoryBtnText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    metricTile: {
        flex: 1,
        alignItems: 'center',
    },
    metricLabel: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metricValue: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: '700',
    },
});

export default LuxoNetVipBanner;
