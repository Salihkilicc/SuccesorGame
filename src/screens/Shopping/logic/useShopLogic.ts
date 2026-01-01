import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, useUserStore } from '../../../store';
import { SHOP_DATA } from '../../../data/ShoppingData'; // Yolunu kontrol et

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

export const useShopLogic = (shopId?: string) => {
    const { money, update: updateStats } = useStatsStore();
    const { addItem, inventory } = useUserStore();

    const shop = useMemo(() => SHOPS.find(s => s.id === shopId), [shopId]);

    const formatMoney = (value: number) => {
        return `$${value.toLocaleString()}`;
    };

    const handleBuy = (item: ShopItem) => {
        if (!shop) return;
        const currentShop = shop; // Capture for closure safety

        // Zaten sahip mi?
        const isOwned = inventory.some(
            invItem => invItem.id === item.id || (invItem.name === item.name && invItem.shopId === currentShop.id)
        );

        if (isOwned) return;

        if (money < item.price) {
            Alert.alert('Insufficient Funds', "You don't have enough cash to buy this item.");
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Buy ${item.name} for ${formatMoney(item.price)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    style: 'default',
                    onPress: () => {
                        // Parayı düş
                        updateStats({ money: money - item.price });

                        // Envantere ekle
                        addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            type: item.type,
                            shopId: shop.id,
                            brand: (item as any).brand,
                            location: (item as any).location,
                            purchasedAt: Date.now(),
                        });

                        if (item.type === 'ring') {
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
        return inventory.some(invItem => invItem.id === itemId);
    };

    return {
        shop,
        money,
        handleBuy,
        checkIfOwned,
        formatMoney,
        SHOP_DATA: SHOPS // Listeleme ekranı için typed const
    };
};