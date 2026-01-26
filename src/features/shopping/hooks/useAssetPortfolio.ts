import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { OwnedAsset, ProductCategory } from '../types';

export type PortfolioFilter = 'ALL' | 'REAL_ESTATE' | 'VEHICLE' | 'COLLECTION';

export const useAssetPortfolio = () => {
    const { ownedItems, removeOwnedItem, repairOwnedItem } = useAssetStore();
    const { earnMoney, spendMoney } = useStatsStore();

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<PortfolioFilter>('ALL');

    /**
     * Data Enrichment
     * Calculates current market value based on condition
     */
    const portfolioItems = useMemo(() => {
        // Since ownedItems are now full objects, we just need to calculate dynamic value
        const enriched = ownedItems.map(asset => {
            // Current Value Calculation: Base Price * Condition Factor
            const conditionFactor = 0.5 + (0.5 * (asset.condition / 100));
            const currentMarketValue = Math.floor(asset.price * conditionFactor);

            return {
                ...asset,
                marketValue: currentMarketValue,
            };
        });

        // Sort by Market Value (High to Low)
        return enriched.sort((a, b) => b.marketValue - a.marketValue);
    }, [ownedItems]);

    /**
     * Filter Logic
     */
    const filteredItems = useMemo(() => {
        if (selectedCategory === 'ALL') return portfolioItems;

        if (selectedCategory === 'REAL_ESTATE') {
            return portfolioItems.filter(i => ['REAL_ESTATE'].includes(i.category));
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
    const sellAsset = (asset: OwnedAsset) => {
        // Resale Logic: 70% of current market value
        const resalePrice = Math.floor(asset.marketValue * 0.7);

        Alert.alert(
            'Confirm Sale',
            `Sell ${asset.name} for $${resalePrice.toLocaleString()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sell Asset',
                    style: 'destructive',
                    onPress: () => {
                        earnMoney(resalePrice);
                        removeOwnedItem(asset.instanceId);
                        Alert.alert('Asset Sold', `You received $${resalePrice.toLocaleString()}.`);
                    }
                }
            ]
        );
    };

    const repairAsset = (asset: OwnedAsset) => {
        if (asset.condition >= 100) {
            Alert.alert('Perfect Condition', 'This asset is already in mint condition.');
            return;
        }

        // Repair cost: 1% of value per 10% condition missing
        const damagePercent = 100 - asset.condition;
        const repairCost = Math.floor(asset.price * (damagePercent / 1000));

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
                            repairOwnedItem(asset.instanceId, 100);
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

