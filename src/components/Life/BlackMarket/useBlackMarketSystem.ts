import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../store/useStatsStore';
import { useUserStore, InventoryItem } from '../../../store/useUserStore';
import {
    BLACK_MARKET_ARTS,
    BLACK_MARKET_ANTIQUES,
    BLACK_MARKET_JEWELRY,
    BLACK_MARKET_WEAPONS,
    BLACK_MARKET_SUBSTANCES
} from '../../../data/BlackMarketData';

// Types
export type BlackMarketCategory = 'art' | 'antique' | 'jewel' | 'weapon' | 'substance';

export const useBlackMarketSystem = () => {
    const { money, update: updateStats } = useStatsStore();
    const { addItem, inventory } = useUserStore();

    // Modals Visibility
    const [isHubVisible, setHubVisible] = useState(false);
    const [isBelongingsVisible, setBelongingsVisible] = useState(false);

    // Offer State (For Art/Antique/Jewel)
    const [isOfferVisible, setOfferVisible] = useState(false);
    const [currentOffer, setCurrentOffer] = useState<any | null>(null);

    // Weapon/Substance State is handled within their specific sub-modals/lists if needed,
    // but we can track "Active Category for Selection" here if we use a generic modal.
    // For simplicity, we might just pass data to the Hub to render.

    // Effect Message State (Substances)
    const [effectMessage, setEffectMessage] = useState<string | null>(null);

    // --- ACTIONS ---

    const openBlackMarket = useCallback(() => setHubVisible(true), []);
    const closeBlackMarket = useCallback(() => setHubVisible(false), []);

    const openBelongings = useCallback(() => setBelongingsVisible(true), []);
    const closeBelongings = useCallback(() => setBelongingsVisible(false), []);

    // Type A: Random Offer (Art, Antique, Jewel)
    const generateRandomOffer = useCallback((category: 'art' | 'antique' | 'jewel') => {
        let dataset: any[] = [];
        if (category === 'art') dataset = BLACK_MARKET_ARTS;
        if (category === 'antique') dataset = BLACK_MARKET_ANTIQUES;
        if (category === 'jewel') dataset = BLACK_MARKET_JEWELRY;

        // Filter out already owned items?
        // Assuming unique IDs.
        const ownedIds = new Set(inventory.map(i => i.id));
        const availableItems = dataset.filter(item => !ownedIds.has(item.id));

        if (availableItems.length === 0) {
            Alert.alert('Dry Market', 'You have bought everything available in this category!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const item = availableItems[randomIndex];
        setCurrentOffer(item);
        setOfferVisible(true);
    }, [inventory]);

    const acceptOffer = useCallback(() => {
        if (!currentOffer) return;

        if (money < currentOffer.price) {
            Alert.alert('Insufficient Funds', "You can't afford this piece.");
            return;
        }

        // Deduct Money
        updateStats({ money: money - currentOffer.price });

        // Add to Inventory
        const newItem: InventoryItem = {
            id: currentOffer.id,
            name: currentOffer.name,
            price: currentOffer.price,
            type: currentOffer.type, // 'art', 'antique' etc.
            shopId: 'black_market',
            purchasedAt: Date.now(),
            // Store description/effect if needed, or lookup by ID later.
            // For now InventoryItem is minimal.
        };
        addItem(newItem);

        setOfferVisible(false);
        setCurrentOffer(null);
        Alert.alert('Acquired', `You are now the owner of ${newItem.name}. Keep it hidden.`);
    }, [money, currentOffer, updateStats, addItem]);

    const rejectOffer = useCallback(() => {
        setOfferVisible(false);
        setCurrentOffer(null);
    }, []);

    // Type B: Buy Weapon (Selection List)
    const buyWeapon = useCallback((weaponId: string) => {
        const weapon = BLACK_MARKET_WEAPONS.find(w => w.id === weaponId);
        if (!weapon) return;

        // Check ownership
        if (inventory.some(i => i.id === weapon.id)) {
            Alert.alert('Already Owned', 'You already have this weapon.');
            return;
        }

        if (money < weapon.price) {
            Alert.alert('Insufficient Funds', "Not enough cash.");
            return;
        }

        updateStats({ money: money - weapon.price });
        addItem({
            id: weapon.id,
            name: weapon.name,
            price: weapon.price,
            type: 'weapon',
            shopId: 'black_market_arms',
            purchasedAt: Date.now(),
        });
        Alert.alert('Purchased', `${weapon.name} added to your arsenal.`);
    }, [money, inventory, updateStats, addItem]);

    // Type C: Buy Consumable (Substances)
    const buySubstance = useCallback((substanceId: string) => {
        const item = BLACK_MARKET_SUBSTANCES.find(s => s.id === substanceId);
        if (!item) return;

        if (money < item.price) {
            Alert.alert('Insufficient Funds', "Need cash for the stash.");
            return;
        }

        updateStats({ money: money - item.price });

        // Show Effect
        setEffectMessage(item.effect || "Whoa...");
    }, [money, updateStats]);

    const clearEffect = useCallback(() => {
        setEffectMessage(null);
    }, []);

    return {
        // State
        isHubVisible,
        isBelongingsVisible,
        isOfferVisible,
        currentOffer,
        effectMessage,

        // Actions
        openBlackMarket,
        closeBlackMarket,
        openBelongings,
        closeBelongings,

        generateRandomOffer,
        acceptOffer,
        rejectOffer,

        buyWeapon,
        buySubstance,
        clearEffect
    };
};
