import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, useUserStore, usePlayerStore } from '../../../core/store';
import { calculateShoppingDiscount } from '../../../logic/statsLogic';
import { SHOP_DATA } from '../data/ShoppingData';

export interface ShopItem {
    id: string;
    name: string;
    price: number;
    type: string;
    brand?: string;
    location?: string;
}

export interface Shop {
    id: string;
    name: string;
    category: string;
    subCategory?: string;
    description?: string;
    items: ShopItem[];
}

// Cast implicit any from JS file
const SHOPS = SHOP_DATA as unknown as Shop[];

export const useShopLogic = (shopId?: string, triggerEncounter?: (type: string) => boolean) => {
    const { money, spendMoney } = useStatsStore();
    const { addItem, inventory } = useUserStore();
    const { attributes, reputation } = usePlayerStore();

    // Calculate Discount
    const discountPercent = useMemo(() => {
        return calculateShoppingDiscount(attributes.charm, reputation.social);
    }, [attributes.charm, reputation.social]);

    const getDiscountedPrice = (price: number) => {
        if (discountPercent === 0) return price;
        return Math.floor(price * (1 - discountPercent / 100));
    };

    const shop = useMemo(() => SHOPS.find(s => s.id === shopId), [shopId]);

    const formatMoney = (value: number) => {
        return `$${value.toLocaleString()}`;
    };

    const handleBuy = (item: ShopItem) => {
        if (!shop) return;
        const currentShop = shop; // Capture for closure safety

        const isRing = item.type === 'ring';

        // Zaten sahip mi? (Yüzükler hariç)
        if (!isRing) {
            const isOwned = inventory.some(
                invItem => invItem.id === item.id || (invItem.name === item.name && invItem.shopId === currentShop.id)
            );
            if (isOwned) return;
        }

        const finalPrice = getDiscountedPrice(item.price);

        if (money < finalPrice) {
            Alert.alert('Insufficient Funds', "You don't have enough cash to buy this item.");
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Buy ${item.name} for ${formatMoney(finalPrice)}?${discountPercent > 0 ? `\n(Includes ${discountPercent}% discount!)` : ''}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    style: 'default',
                    onPress: () => {
                        // Secure Spending (Single Source of Truth)
                        const success = spendMoney(finalPrice);
                        if (!success) {
                            Alert.alert('Error', 'Transaction failed.');
                            return;
                        }

                        // Envantere ekle (Yüzükler için unique ID)
                        const inventoryId = isRing ? `${item.id}_${Date.now()}` : item.id;

                        addItem({
                            id: inventoryId,
                            name: item.name,
                            price: finalPrice,
                            type: item.type,
                            shopId: shop.id,
                            brand: (item as any).brand,
                            location: (item as any).location,
                            purchasedAt: Date.now(),
                        });

                        // 5% Chance for Shopping Encounter
                        if (triggerEncounter && Math.random() < 0.05) {
                            triggerEncounter('shopping');
                            // We don't return here, we let the success alert show (or maybe suppress it if encounter handles it?)
                            // Usually encounter happens "after" leaving or during.
                            // Let's show the success alert and then the encounter might pop up over it or after.
                        }

                        if (isRing) {
                            Alert.alert('Success', `You purchased ${item.name}! This can be used for proposals.`);
                        } else {
                            Alert.alert('Success', `You are now the owner of ${item.name}!`);
                        }
                    },
                },
            ]
        );
    };

    const checkIfOwned = (itemId: string) => {
        // Rings are never considered "owned" in the context of disabling the button
        // because we save them with unique IDs in inventory.
        return inventory.some(invItem => invItem.id === itemId);
    };

    return {
        shop,
        money,
        handleBuy,
        checkIfOwned,
        formatMoney,
        SHOP_DATA: SHOPS, // Listeleme ekranı için typed const
        getDiscountedPrice,
        discountPercent
    };
};

// ============================================================================
// INVENTORY-AWARE SHOPPING HOOK
// ============================================================================

/**
 * Hook for shopping with inventory management
 * Filters out owned items from shops (except rings)
 */
export const useShoppingWithInventory = () => {
    const { ownedItems, isOwned } = useAssetStore();

    // Ring shop IDs (these items can be purchased multiple times)
    const RING_SHOP_IDS = ['shop_vow_eternity', 'shop_the_promise'];

    /**
     * Get filtered shop items (hides owned items except rings)
     */
    const getShopItems = (shopId: string) => {
        // Import ITEMS from data
        const { ITEMS } = require('../data/ShoppingData');

        return ITEMS.filter((item: any) => {
            // 1. Must belong to this shop
            if (item.shopId !== shopId) return false;

            // 2. Check ownership
            const itemIsOwned = isOwned(item.id);

            // 3. Ring Exception: Always show rings even if owned
            const isRingShop = RING_SHOP_IDS.includes(item.shopId);

            if (itemIsOwned && !isRingShop) {
                return false; // Hide owned items (stock depleted)
            }

            return true; // Show item
        });
    };

    /**
     * Get trending items (excludes owned items except rings)
     */
    const getTrendingItems = (count: number = 6) => {
        const { ITEMS } = require('../data/ShoppingData');

        const availableItems = ITEMS.filter((item: any) => {
            const itemIsOwned = isOwned(item.id);
            const isRingShop = RING_SHOP_IDS.includes(item.shopId);
            return !itemIsOwned || isRingShop;
        });

        return [...availableItems]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
    };

    return {
        getShopItems,
        getTrendingItems,
        ownedItems,
        isOwned,
    };
};

// Re-export for convenience
import { useAssetStore } from '../store/useAssetStore';