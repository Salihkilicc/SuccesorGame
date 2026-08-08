import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, StatusBar, ScrollView, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAssetPortfolio } from '../hooks/useAssetPortfolio';
import AssetCard from '../components/AssetCard';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
    useLocale();
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
        { label: t('ui.realEstate2'), value: 'REAL_ESTATE' },
        { label: t('ui.vehicles2'), value: 'VEHICLE' },
        { label: t('ui.valuables'), value: 'COLLECTION' },
    ];

    return (
        <AppLaunchLoader
            appName="Belongings"
            appIcon={<MaterialCommunityIcons name="treasure-chest" size={64} color="#FFFFFF" />}
            backgroundColor="#1C242C"
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#1C242C" />
                <SafeAreaView style={{ flex: 1 }}>

                    {/* 1. Header (Black Card Style) */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← BACK</Text>
                            </Pressable>
                            <Text style={styles.headerTitle}>{t('ui.portfolioDashboard')}</Text>
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
                                            <Text style={styles.cardBankName}>{t('ui.luxenet')}</Text>
                                            <Text style={styles.cardLabelSmall}>{t('ui.empireReserve')}</Text>
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
                                            <Text style={styles.netWorthLabel}>{t('ui.totalNetWorth')}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBottomRow}>
                                        <Text style={styles.memberName}>{t('ui.memberSince2024')}</Text>
                                        <View style={styles.badgeContainer}>
                                            <Text style={styles.badgeText}>{t('ui.elite')}</Text>
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
                                <Text style={styles.emptyTitle}>{t('ui.noAssetsFound')}</Text>
                                <Text style={styles.emptyText}>{t('ui.visitLuxenetToAcquireItems')}</Text>
                                <Pressable
                                    style={styles.shopAction}
                                    onPress={() => navigation.navigate('Shopping')}
                                >
                                    <Text style={styles.shopActionText}>{t('ui.openCatalog')}</Text>
                                </Pressable>
                            </View>
                        }
                    />
                </SafeAreaView>

                {/* 4. Footer Stats */}            </View>
        </AppLaunchLoader>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C242C', // Deep Black
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingBottom: 12, // Reduced from 20 to tighten layout
        backgroundColor: '#434B50',
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
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#FFFFFF',
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
        backgroundColor: '#434B50', // Matte Black
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: "#1C242C",
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
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 2,
    },
    cardLabelSmall: {
        color: theme.colors.textMuted,
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
        backgroundColor: '#434B50', // Gold/Copper Chip color
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipLine1: {
        width: '100%',
        height: 1,
        backgroundColor: '#323A40',
        marginBottom: 8,
    },
    chipLine2: {
        position: 'absolute',
        width: 1,
        height: '60%',
        backgroundColor: '#323A40',
    },
    netWorthValue: {
        color: '#FFFFFF',
        fontSize: 28, // Scaled for card
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(5,168,246,0.15)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    netWorthLabel: {
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: 'rgba(5,168,246,0.1)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    badgeText: {
        color: theme.colors.warning,
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
        backgroundColor: '#434B50',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    filterChipActive: {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#434B50',
        shadowColor: "#FF8A8A",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    filterText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    filterTextActive: {
        color: theme.colors.textPrimary,
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
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 24,
    },
    shopAction: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#434B50',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    shopActionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    }
});

export default BelongingsScreen;
