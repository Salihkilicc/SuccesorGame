// src/features/shopping/screens/BelongingsScreen.tsx
//
// ============================================================================
//  EXECUTIVE LUXURY ASSET INVENTORY SCREEN
// ============================================================================
//
//  Full-fledged screen featuring the iconic Sovereign Black Card, category
//  filters, asset collection grid, official ScreenHeader and CrystalNavBar.
//
// ============================================================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useAssetPortfolio } from '../hooks/useAssetPortfolio';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import AssetCard from '../components/AssetCard';

const { width } = Dimensions.get('window');
const GAP = 10;
const ITEM_WIDTH = (width - 32 - GAP) / 2;

const formatCurrencyMain = (amount: number) => {
    if (amount >= 1_000_000_000_000) return `$${(amount / 1_000_000_000_000).toFixed(2)}T`;
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
};

const FilterChip = ({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) => (
    <Pressable
        onPress={onPress}
        style={[styles.filterChip, active && styles.filterChipActive]}
    >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
            {label}
        </Text>
    </Pressable>
);

export const BelongingsScreen = () => {
    const identity = useIdentityStore();
    const {
        filteredItems,
        netWorth,
        selectedCategory,
        setSelectedCategory,
        sellAsset,
        repairAsset,
    } = useAssetPortfolio();

    const cardHolderName = `${identity.firstName || 'SALIH'} HALE`.toUpperCase();

    const FILTERS: { label: string; value: typeof selectedCategory }[] = [
        { label: 'ALL', value: 'ALL' },
        { label: 'REAL ESTATE', value: 'REAL_ESTATE' },
        { label: 'VEHICLES', value: 'VEHICLE' },
        { label: 'COLLECTION', value: 'COLLECTION' },
    ];

    return (
        <View style={styles.root}>
            {/* Screen Header with Back Arrow and Blue Rule and Subtitle */}
            <ScreenHeader
                title="INVENTORY"
                subtitle="PORTFOLIO & ASSET VAULT"
                category="company"
            />

            <View style={styles.container}>
                {/* 1. Ultra-Premium Sovereign Black Card */}
                <View style={styles.cardContainer}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardBrand}>LUXONET</Text>
                            <Text style={styles.cardSubtitle}>SOVEREIGN RESERVE</Text>
                        </View>
                        <View style={styles.contactlessWrap}>
                            <MaterialCommunityIcons
                                name="contactless-payment"
                                size={24}
                                color="#E2E8F0"
                            />
                        </View>
                    </View>

                    {/* Card Center: Chip + Valuation */}
                    <View style={styles.cardCenter}>
                        {/* Metallic Smart Chip */}
                        <View style={styles.smartChip}>
                            <View style={styles.chipGridHorizontal} />
                            <View style={styles.chipGridVertical} />
                            <View style={styles.chipCore} />
                        </View>

                        {/* Net Worth Valuation */}
                        <View style={styles.valuationBlock}>
                            <Text style={styles.valuationLabel}>TOTAL ASSET VALUATION</Text>
                            <Text style={styles.valuationValue}>
                                {formatCurrencyMain(netWorth)}
                            </Text>
                        </View>
                    </View>

                    {/* Card Footer: Cardholder Name + VIP Tier Badge */}
                    <View style={styles.cardFooter}>
                        <View style={styles.cardholderBlock}>
                            <Text style={styles.cardholderLabel}>CARDHOLDER</Text>
                            <Text style={styles.cardholderName} numberOfLines={1}>
                                {cardHolderName}
                            </Text>
                        </View>

                        <View style={styles.blackBadge}>
                            <Text style={styles.blackBadgeText}>CENTURION BLACK</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Filter Bar */}
                <View style={styles.filterBar}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                    >
                        {FILTERS.map((f) => (
                            <FilterChip
                                key={f.value}
                                label={f.label}
                                active={selectedCategory === f.value}
                                onPress={() => setSelectedCategory(f.value)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* 3. Asset Grid List */}
                <FlatList
                    data={filteredItems}
                    numColumns={2}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    columnWrapperStyle={styles.gridRow}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={{ width: ITEM_WIDTH }}>
                            <AssetCard
                                item={item}
                                variant="grid"
                                onSell={sellAsset}
                                onRepair={repairAsset}
                                onPropose={() => {
                                    Alert.alert(
                                        'Heirloom',
                                        'You can present this ring to your partner from the partner dossier.',
                                    );
                                }}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons
                                    name="treasure-chest"
                                    size={36}
                                    color={theme.colors.textMuted}
                                />
                            </View>
                            <Text style={styles.emptyTitle}>No Luxury Assets Found</Text>
                            <Text style={styles.emptySubtitle}>
                                Acquire prime real estate, supercars, and haute horlogerie via the
                                LuxoNet Store.
                            </Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#1C242C',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    // Executive Sovereign Black Card
    cardContainer: {
        backgroundColor: '#111317', // Deep matte black obsidian
        borderRadius: 18,
        padding: 20,
        marginBottom: 12,
        height: 190,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardBrand: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2.5,
    },
    cardSubtitle: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginTop: 2,
    },
    contactlessWrap: {
        opacity: 0.85,
    },

    // Chip & Value Row
    cardCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    smartChip: {
        width: 44,
        height: 34,
        borderRadius: 6,
        backgroundColor: '#D4AF37', // Metallic gold chip
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipGridHorizontal: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: '#997F25',
    },
    chipGridVertical: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: '#997F25',
    },
    chipCore: {
        width: 14,
        height: 12,
        borderRadius: 2,
        backgroundColor: '#B5942D',
    },
    valuationBlock: {
        flex: 1,
    },
    valuationLabel: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 3,
    },
    valuationValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardholderBlock: {
        flex: 1,
    },
    cardholderLabel: {
        color: '#64748B',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    cardholderName: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    blackBadge: {
        backgroundColor: '#20242C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    blackBadgeText: {
        color: '#FBBF24',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    // Filter Bar
    filterBar: {
        marginBottom: 10,
    },
    filterScroll: {
        gap: 8,
        paddingVertical: 2,
    },
    filterChip: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    filterChipActive: {
        backgroundColor: '#183D5C',
    },
    filterText: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    filterTextActive: {
        color: '#7DD3FC',
    },

    // Grid List
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    listContent: {
        paddingBottom: NAV_BAR_CLEARANCE + 32, // Clear CrystalNavBar safely
    },
    emptyState: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        color: theme.colors.textMuted,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
});

export default BelongingsScreen;
