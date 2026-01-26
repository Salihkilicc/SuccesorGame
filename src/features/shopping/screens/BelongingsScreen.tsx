import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAssetStore } from '../store/useAssetStore';
import { ITEMS } from '../data/ShoppingData';


// ============================================================================
// TYPES & HELPERS
// ============================================================================

type FilterType = 'ALL' | 'REAL_ESTATE' | 'VEHICLE' | 'COLLECTION';

const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const FilterTab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={[styles.filterTab, active && styles.filterTabActive]}
    >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
);

const AssetCard = ({ item, condition, onAction }: { item: any; condition: number; onAction: (action: string, item: any) => void }) => {
    // Determine primary action based on category
    let actionLabel = 'View';
    let actionColor = '#555';

    if (item.category === 'REAL_ESTATE') {
        actionLabel = 'Manage';
        actionColor = '#2980B9'; // Blue
    } else if (item.category === 'VEHICLE' || item.category === 'MARINE' || item.category === 'AIRCRAFT') {
        actionLabel = 'Sell';
        actionColor = '#C0392B'; // Red
    } else if (['shop_vow_eternity', 'shop_the_promise'].includes(item.shopId)) {
        actionLabel = 'Propose';
        actionColor = '#E67E22'; // Orange
    }

    return (
        <View style={styles.card}>
            {/* Visual (Left) */}
            <View style={styles.cardImageContainer}>
                <Text style={styles.cardEmoji}>
                    {item.category === 'VEHICLE' ? '🏎️' :
                        item.category === 'WATCH' ? '⌚' :
                            item.category === 'JEWELRY' ? '💎' :
                                item.category === 'MARINE' ? '⛵' :
                                    item.category === 'AIRCRAFT' ? '✈️' : '🏠'}
                </Text>
            </View>

            {/* Details (Center) */}
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

                <View style={styles.cardMetaRow}>
                    <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
                    <View style={styles.conditionBadge}>
                        <Text style={styles.conditionText} >{condition}% Cond.</Text>
                    </View>
                </View>
            </View>

            {/* Action (Right) */}
            <Pressable
                style={[styles.actionButton, { backgroundColor: actionColor }]}
                onPress={() => onAction(actionLabel, item)}
            >
                <Text style={styles.actionButtonText}>{actionLabel}</Text>
            </Pressable>
        </View>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BelongingsScreen = () => {
    const navigation = useNavigation<any>();
    const { ownedItems } = useAssetStore();
    const [filter, setFilter] = useState<FilterType>('ALL');

    // 1. Merge Owned Items with Master Data
    const portfolio = useMemo(() => {
        return ownedItems.map(owned => {
            const masterItem = ITEMS.find(i => i.id === owned.itemId);
            if (!masterItem) return null; // Should not happen if data integrity is kept
            return {
                ...masterItem,
                purchaseDate: owned.purchaseDate,
                condition: owned.condition ?? 100,
            };
        }).filter(Boolean) as any[]; // Remove nulls
    }, [ownedItems]);

    // 2. Calculate Net Worth
    const netWorth = useMemo(() => {
        return portfolio.reduce((sum, item) => sum + item.price, 0);
    }, [portfolio]);

    // 3. Filter Logic
    const filteredPortfolio = useMemo(() => {
        if (filter === 'ALL') return portfolio;
        if (filter === 'REAL_ESTATE') return portfolio.filter(i => i.category === 'REAL_ESTATE');
        if (filter === 'VEHICLE') return portfolio.filter(i => ['VEHICLE', 'MARINE', 'AIRCRAFT'].includes(i.category));
        if (filter === 'COLLECTION') return portfolio.filter(i => ['WATCH', 'JEWELRY'].includes(i.category));
        return portfolio;
    }, [portfolio, filter]);

    // 4. Action Handlers
    const handleAction = (action: string, item: any) => {
        if (action === 'Sell') {
            Alert.alert('Sell Asset', `Selling ${item.name} is not available in this version yet.`);
        } else if (action === 'Manage') {
            Alert.alert('Manage Property', `Property management for ${item.name} coming soon.`);
        } else if (action === 'Propose') {
            Alert.alert('Propose', 'Will you make the ultimate commitment? (Feature coming soon)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
                <View>
                    <Text style={styles.headerTitle}>My Assets</Text>
                    <Text style={styles.netWorthLabel}>Net Worth: <Text style={styles.netWorthValue}>{formatCurrency(netWorth)}</Text></Text>
                </View>
                <View style={{ width: 60 }} /> {/* Spacer for centering */}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FilterTab label="All" active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
                <FilterTab label="Real Estate" active={filter === 'REAL_ESTATE'} onPress={() => setFilter('REAL_ESTATE')} />
                <FilterTab label="Vehicles" active={filter === 'VEHICLE'} onPress={() => setFilter('VEHICLE')} />
                <FilterTab label="Collection" active={filter === 'COLLECTION'} onPress={() => setFilter('COLLECTION')} />
            </View>

            {/* Content List */}
            <FlatList
                data={filteredPortfolio}
                keyExtractor={(item, index) => `${item.id}_${index}`} // Unique key even if duplicates exist (rings)
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <AssetCard
                        item={item}
                        condition={item.condition}
                        onAction={handleAction}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🏦</Text>
                        <Text style={styles.emptyTitle}>Your Portfolio is Empty</Text>
                        <Text style={styles.emptyText}>Visit LuxeNet to acquire your first asset.</Text>
                        <Pressable
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Shopping')}
                        >
                            <Text style={styles.shopButtonText}>Go Shopping</Text>
                        </Pressable>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        width: 60,
    },
    backButtonText: {
        color: '#888',
        fontSize: 16,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    netWorthLabel: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
    },
    netWorthValue: {
        color: '#27AE60',
        fontWeight: '700',
    },

    // Filters
    filterContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#333',
    },
    filterTabActive: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    filterText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#000',
    },

    // List
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: 100,
    },

    // Card
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginBottom: theme.spacing.md,
        padding: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#2C2C2C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardEmoji: {
        fontSize: 24,
    },
    cardDetails: {
        flex: 1,
        gap: 4,
    },
    cardName: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardPrice: {
        color: '#AAA',
        fontSize: 13,
    },
    conditionBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(39, 174, 96, 0.15)',
    },
    conditionText: {
        color: '#27AE60',
        fontSize: 10,
        fontWeight: '700',
    },

    // Action Button
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        opacity: 0.7,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
        marginBottom: 24,
    },
    shopButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    shopButtonText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default BelongingsScreen;
