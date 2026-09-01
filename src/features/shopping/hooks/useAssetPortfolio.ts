import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { OwnedAsset, ProductCategory } from '../types';
import { repairCost, valueAt } from '../../../core/luxury/upkeep';

export type PortfolioFilter = 'ALL' | 'REAL_ESTATE' | 'VEHICLE' | 'COLLECTION';

export const useAssetPortfolio = () => {
    const { ownedItems, removeOwnedItem, repairOwnedItem } = useAssetStore();
    const { earnMoney, spendMoney } = useStatsStore();

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<PortfolioFilter>('ALL');

    /**
     * Data Enrichment
     * Calculates current market value based on condition
     *
     * ----------------------------------------------------------------------
     *  THE CURVE MOVED OUT, AND THAT IS THE WHOLE FIX
     * ----------------------------------------------------------------------
     *  This was `0.5 + 0.5 * (condition / 100)` written here, and the repair
     *  bill forty lines below was `price * damage / 1000` written there, and
     *  the two were never compared to each other. Restoring an asset from 50
     *  condition cost 5% of its price and put back 25% of its price - a five
     *  to one return on any item in the catalogue, repeatable.
     *
     *  Both now come from core/luxury/upkeep, where the repair is PRICED OFF
     *  the value it restores and cannot be profitable by construction.
     * ----------------------------------------------------------------------
     */
    const portfolioItems = useMemo(() => {
        // Since ownedItems are now full objects, we just need to calculate dynamic value
        const enriched = ownedItems.map(asset => ({
            ...asset,
            marketValue: Math.floor(valueAt(asset.price, asset.condition)),
        }));

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

        // ------------------------------------------------------------------
        //  AND THE PLAYER IS TOLD IT IS A LOSS, BECAUSE IT IS ONE
        // ------------------------------------------------------------------
        //  A restoration costs more than the value it puts back, always, by
        //  construction. That is not a trap to spring on somebody after they
        //  press the button: the panel says what it costs, what it restores,
        //  and what the difference is.
        //
        //  The reason to do it anyway is that neglect is worse and compounds
        //  - an unpaid quarter takes four times the condition - so this is a
        //  decision about how fast you are losing, not about whether.
        // ------------------------------------------------------------------
        const cost = Math.floor(repairCost(asset.price, asset.condition, 100));
        const restored = Math.floor(valueAt(asset.price, 100) - valueAt(asset.price, asset.condition));
        const loss = cost - restored;

        Alert.alert(
            'Restoration Service',
            `Restore to mint condition for $${cost.toLocaleString()}.\n\n`
            + `This puts back $${restored.toLocaleString()} of value, so the restoration `
            + `costs you $${loss.toLocaleString()} net. Left alone it will keep falling, `
            + `and four times faster in any quarter you do not pay the upkeep.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    onPress: () => {
                        const success = spendMoney(cost);
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

