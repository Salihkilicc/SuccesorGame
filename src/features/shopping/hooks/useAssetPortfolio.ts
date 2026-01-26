import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { ITEMS } from '../data/ShoppingData';

export type PortfolioFilter = 'ALL' | 'REAL_ESTATE' | 'VEHICLE' | 'COLLECTION';

export const useAssetPortfolio = () => {
    const { ownedItems, removeOwnedItem, repairOwnedItem } = useAssetStore();
    const { earnMoney, spendMoney } = useStatsStore();

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<PortfolioFilter>('ALL');

    /**
     * Data Enrichment
     * Merges owned items with master data and calculates current value
     */
    const portfolioItems = useMemo(() => {
        const enriched = ownedItems.map(owned => {
            const masterItem = ITEMS.find(i => i.id === owned.itemId);
            if (!masterItem) return null;

            // Current Value Calculation
            const conditionFactor = 0.5 + (0.5 * (owned.condition / 100));
            const marketValue = Math.floor(masterItem.price * conditionFactor);

            return {
                ...masterItem,
                purchaseDate: owned.purchaseDate,
                condition: owned.condition,
                marketValue,
            };
        }).filter(Boolean) as any[];

        // Sort by Market Value (High to Low)
        return enriched.sort((a, b) => b.marketValue - a.marketValue);
    }, [ownedItems]);

    /**
     * Filter Logic
     */
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'ALL') return portfolioItems;

        if (selectedCategory === 'REAL_ESTATE') {
            return portfolioItems.filter(i => ['REAL_ESTATE', 'ISLAND'].includes(i.category));
        }

        if (selectedCategory === 'VEHICLE') {
            return portfolioItems.filter(i => ['VEHICLE', 'MARINE', 'AIRCRAFT'].includes(i.category));
        }

        if (selectedCategory === 'COLLECTION') {
            return portfolioItems.filter(i => ['WATCH', 'JEWELRY'].includes(i.category));
        }

        return portfolioItems;
    }, [portfolioItems, selectedCategory]);

    /**
     * Statistics
     */
    const netWorth = useMemo(() => {
        return portfolioItems.reduce((sum, item) => sum + item.marketValue, 0);
    }, [portfolioItems]);

    const assetCount = portfolioItems.length;

    /**
     * Actions
     */
    const sellAsset = (item: any) => {
        // Resale Logic: 70% of current market value
        const resalePrice = Math.floor(item.marketValue * 0.7);

        Alert.alert(
            'Confirm Sale',
            `Sell ${item.name} for $${resalePrice.toLocaleString()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell Asset',
                    style: 'destructive',
                    onPress: () => {
                        earnMoney(resalePrice);
                        removeOwnedItem(item.id); // Uses master ID, assuming unique in list or first match
                        // Note: If duplicates exist (rings), assumes Store removes by first found check.

                        Alert.alert('Asset Sold', `You received $${resalePrice.toLocaleString()}.`);
                    }
                }
            ]
        );
    };

    const repairAsset = (item: any) => {
        if (item.condition >= 100) {
            Alert.alert('Perfect Condition', 'This asset is already in mint condition.');
            return;
        }

        // Repair cost: 1% of value per 10% condition missing
        const damagePercent = 100 - item.condition;
        const repairCost = Math.floor(item.price * (damagePercent / 1000));

        Alert.alert(
            'Restoration Service',
            `Restore condition to 100% for $${repairCost.toLocaleString()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    onPress: () => {
                        const success = spendMoney(repairCost);
                        if (success) {
                            repairOwnedItem(item.id, 100);
                            Alert.alert('Restored', 'Asset is now in mint condition.');
                        } else {
                            Alert.alert('Insufficient Funds', 'You cannot afford this restoration.');
                        }
                    }
                }
            ]
        );
    };

    return {
        // Data
        portfolioItems,
        filteredItems,
        netWorth,
        assetCount,

        // State
        selectedCategory,
        setSelectedCategory,

        // Actions
        sellAsset,
        repairAsset,
    };
};
