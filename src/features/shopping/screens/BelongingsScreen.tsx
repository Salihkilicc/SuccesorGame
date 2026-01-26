import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, StatusBar, ScrollView, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAssetPortfolio } from '../hooks/useAssetPortfolio';
import AssetCard from '../components/AssetCard';
import BottomStatsBar from '../../../components/common/BottomStatsBar';

const { width } = Dimensions.get('window');
const GAP = 12;

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrencyMain = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${amount.toLocaleString()}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={[styles.filterChip, active && styles.filterChipActive]}
    >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================

const BelongingsScreen = () => {
    const navigation = useNavigation<any>();
    const {
        filteredItems,
        netWorth,
        selectedCategory,
        setSelectedCategory,
        sellAsset,
        repairAsset
    } = useAssetPortfolio();

    // Map internal filter types to display labels
    const FILTERS: { label: string; value: typeof selectedCategory }[] = [
        { label: 'ALL', value: 'ALL' },
        { label: 'REAL ESTATE', value: 'REAL_ESTATE' },
        { label: 'VEHICLES', value: 'VEHICLE' },
        { label: 'VALUABLES', value: 'COLLECTION' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* 1. Header (Black Card Style) */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← BACK</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>PORTFOLIO DASHBOARD</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Net Worth Card (Centered, Aspect Ratio 1.58) */}
                    <View style={styles.cardWrapper}>
                        <View style={styles.cardContainer}>
                            {/* Card Texture Overlay (Simulated) */}
                            <View style={styles.cardTexture} />

                            <View style={styles.cardContent}>
                                <View style={styles.cardTopRow}>
                                    <View>
                                        <Text style={styles.cardBankName}>LUXENET</Text>
                                        <Text style={styles.cardLabelSmall}>EMPIRE RESERVE</Text>
                                    </View>
                                    <Text style={styles.cardLabelSmall}>2026</Text>
                                </View>

                                <View style={styles.cardCenter}>
                                    <View style={styles.chipGraphic}>
                                        <View style={styles.chipLine1} />
                                        <View style={styles.chipLine2} />
                                    </View>
                                    <View>
                                        <Text style={styles.netWorthValue}>{formatCurrencyMain(netWorth)}</Text>
                                        <Text style={styles.netWorthLabel}>TOTAL NET WORTH</Text>
                                    </View>
                                </View>

                                <View style={styles.cardBottomRow}>
                                    <Text style={styles.memberName}>MEMBER SINCE 2024</Text>
                                    <View style={styles.badgeContainer}>
                                        <Text style={styles.badgeText}>ELITE</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. Filter Bar */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
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

                {/* 3. Asset Grid */}
                <FlatList
                    key={2} // Force strict grid mode
                    data={filteredItems}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', gap: GAP }}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={{ width: (width - 40 - GAP) / 2 }}>
                            <AssetCard
                                item={item}
                                variant="grid"
                                onSell={sellAsset}
                                onRepair={repairAsset}
                                onPropose={() => {
                                    Alert.alert('Propose', 'Features coming soon!');
                                }}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🏛️</Text>
                            <Text style={styles.emptyTitle}>NO ASSETS FOUND</Text>
                            <Text style={styles.emptyText}>Visit LuxeNet to acquire items.</Text>
                            <Pressable
                                style={styles.shopAction}
                                onPress={() => navigation.navigate('Shopping')}
                            >
                                <Text style={styles.shopActionText}>OPEN CATALOG</Text>
                            </Pressable>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* 4. Footer Stats */}
            <BottomStatsBar onHomePress={() => navigation.navigate('Home')} />
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505', // Deep Black
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingBottom: 12, // Reduced from 20 to tighten layout
        backgroundColor: '#050505',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 10,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    backButtonText: {
        color: '#666',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#444',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // Black Card
    cardWrapper: {
        alignItems: 'center',
    },
    cardContainer: {
        width: '100%',
        maxWidth: 340,
        aspectRatio: 1.58, // Credit Card Ratio
        backgroundColor: '#0F0F0F', // Matte Black
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    cardTexture: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.02)', // Subtle noise/texture hint
        zIndex: 0,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        zIndex: 1,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardBankName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 2,
    },
    cardLabelSmall: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cardCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    chipGraphic: {
        width: 44,
        height: 34,
        backgroundColor: '#E6CBA6', // Gold/Copper Chip color
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#C6A886',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipLine1: {
        width: '100%',
        height: 1,
        backgroundColor: '#C6A886',
        marginBottom: 8,
    },
    chipLine2: {
        position: 'absolute',
        width: 1,
        height: '60%',
        backgroundColor: '#C6A886',
    },
    netWorthValue: {
        color: '#FFF',
        fontSize: 28, // Scaled for card
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(255, 215, 0, 0.15)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    netWorthLabel: {
        color: '#888',
        fontSize: 9,
        letterSpacing: 2,
        marginTop: 2,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberName: {
        color: '#AAA',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    badgeText: {
        color: '#FFD700',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Filters
    filterContainer: {
        marginBottom: 12, // Reduced from 16
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20, // Pill shape
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
    },
    filterChipActive: {
        borderColor: '#FFD700',
        backgroundColor: '#222',
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    filterText: {
        color: '#666',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    filterTextActive: {
        color: '#FFD700',
    },

    // List
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for BottomStatsBar
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
        opacity: 0.8,
        width: width - 40,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    shopAction: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#222',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#333',
    },
    shopActionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    }
});

export default BelongingsScreen;
