import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAssetStore } from '../store/useAssetStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { OwnedAsset, ProductCategory } from '../types';
import { quarterlyUpkeep, repairCost, valueAt } from '../../../core/luxury/upkeep';
import { driftedPrice, marketValueOf } from '../../../core/luxury/valuation';

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
     *  Both now come from core/luxury, where the repair is PRICED OFF the
     *  value it restores and cannot be profitable by construction.
     *
     *  `marketValueOf` also carries the market drift, so a vintage watch here
     *  can be worth more than it cost while a helicopter is worth less. The
     *  store writes the same figure on every tick; this recomputes it so the
     *  list is right in the frame before the next quarter lands.
     * ----------------------------------------------------------------------
     */
    const portfolioItems = useMemo(() => {
        // Since ownedItems are now full objects, we just need to calculate dynamic value
        const enriched = ownedItems.map(asset => {
            const marketValue = Math.floor(marketValueOf(asset));
            return {
                ...asset,
                marketValue,
                // ----------------------------------------------------------
                //  WHAT IT COSTS AND WHAT IT DID, PER THING
                // ----------------------------------------------------------
                //  The inventory has never said either. A player paying an
                //  upkeep bill every quarter could not find out which of
                //  their forty things was responsible for it, and a watch
                //  that had doubled looked exactly like a jet that had
                //  halved. Both are computed HERE rather than in the card,
                //  so the totals below and the rows are the same arithmetic.
                // ----------------------------------------------------------
                upkeep: quarterlyUpkeep(asset),
                gain: marketValue - (asset.price || 0),
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
            // SPACE rides with the other things that move. A department with
            // one filter tab of its own and eight items in it would be a tab
            // that is empty for most of a run; a fleet is a fleet.
            return portfolioItems.filter(
                i => ['VEHICLE', 'MARINE', 'AIRCRAFT', 'SPACE'].includes(i.category));
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
     * What the whole collection costs to keep, per quarter.
     *
     * The figure the quarterly report already charges, shown on the screen
     * that owns the things being charged for. `useAssetStore.upkeepQuarterly`
     * is the same sum over the same list; this one is derived from the
     * enriched rows so the header and the cards cannot disagree.
     */
    const upkeepQuarterly = useMemo(
        () => portfolioItems.reduce((sum, item) => sum + item.upkeep, 0),
        [portfolioItems],
    );

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
        // Priced off the DRIFTED price, not the sticker. Restoring a classic
        // that has doubled puts back twice as much value and costs twice as
        // much to do; quoting either half at the old price would put the two
        // formulas out of step again, which is the whole defect above.
        const base = driftedPrice(
            asset.price, asset.category, asset.type, asset.quartersOwned ?? 0,
        );
        const cost = Math.floor(repairCost(base, asset.condition, 100));
        const restored = Math.floor(valueAt(base, 100) - valueAt(base, asset.condition));
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
        upkeepQuarterly,

        // State
        selectedCategory,
        setSelectedCategory,

        // Actions
        sellAsset,
        repairAsset,
    };
};

