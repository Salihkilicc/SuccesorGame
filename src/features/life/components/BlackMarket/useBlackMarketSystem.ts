import { useState, useCallback, useMemo } from 'react';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useUserStore, InventoryItem } from '../../../../core/store/useUserStore';
import { useGameStore } from '../../../../core/store/useGameStore';
import {
    BlackMarketItem,
    BlackMarketCategory,
    getRandomDeal
} from './blackMarketData';

// --- TYPES ---

export interface BlackMarketState {
    suspicion: number; // Police Heat (0-100)
    quarterlyDrugUsage: number; // Tracks drug consumption per quarter
    currentDeal: BlackMarketItem | null; // The ONE random item being offered
    activeView: 'HUB' | 'DEAL' | 'RAID'; // NEW: View State Manager
}

export interface BlackMarketData {
    suspicion: number;
    quarterlyDrugUsage: number;
    currentDeal: BlackMarketItem | null;
    streetRep: number;
    currentQuarter: number;
    activeView: 'HUB' | 'DEAL' | 'RAID';
}

export interface BlackMarketActions {
    openCategory: (category: BlackMarketCategory) => void;
    buyItem: () => { success: boolean; message: string; warning?: string };
    passItem: () => void;
    consumeDrug: (item: BlackMarketItem) => { success: boolean; message: string; warning?: string };
    triggerRaid: () => { shouldRaid: boolean; chance: number }; // Kept for manual checks if needed
    resetQuarterlyUsage: () => void;
    decaySuspicion: () => void; // NEW: Quarterly decay
    closeRaid: () => void; // NEW: Reset view after raid
}

// --- CONSTANTS ---

const SUSPICION_THRESHOLD = 80; // Raid chance activates above this
const RAID_BASE_CHANCE = 0.50; // 50% chance when suspicion > 80
const ADDICTION_THRESHOLD = 3; // Drugs per quarter before addiction kicks in
const CATEGORY_OPEN_SUSPICION = 15; // Opening a category adds +15% suspicion

// --- HOOK ---

/**
 * BLACK MARKET SYSTEM HOOK (REFACTORED)
 * 
 * Uses massive data sets with tier-based Street Rep system.
 * Single random deal mechanic per category.
 */
export const useBlackMarketSystem = () => {
    // --- Store Access ---
    const { money, spendMoney } = useStatsStore();
    const { addItem } = useUserStore();
    const {
        reputation,
        attributes,
        core,
        blackMarket, // Persistent state
        updateReputation,
        updateAttribute,
        updateCore,
        updatePersonality,
        updateBlackMarket // Updater
    } = usePlayerStore();
    const { currentMonth } = useGameStore();

    // --- Local State (Transient) ---
    // Suspicion and drug usage are now in store
    const [currentDeal, setCurrentDeal] = useState<BlackMarketItem | null>(null);
    const [pendingItem, setPendingItem] = useState<BlackMarketItem | null>(null); // NEW: Item pending purchase during raid
    const [activeView, setActiveView] = useState<'HUB' | 'DEAL' | 'RAID'>('HUB');

    // --- Computed State ---
    const suspicion = blackMarket?.suspicion || 0;
    const quarterlyDrugUsage = blackMarket?.quarterlyDrugUsage || 0;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    const streetRep = reputation.street || 0;

    // --- HELPER: Raid Trigger Logic ---
    /**
     * "The Any Button Rule"
     * Checks if raid should trigger BEFORE any action.
     * @returns true if Raid Triggered (Action should be blocked)
     */
    const checkRaidRisk = useCallback((itemAttempted?: BlackMarketItem): boolean => {
        if (suspicion >= SUSPICION_THRESHOLD) {
            const roll = Math.random();
            if (roll < RAID_BASE_CHANCE) {
                // TRIGGER RAID
                setActiveView('RAID');
                if (itemAttempted) {
                    setPendingItem(itemAttempted); // Store the item we wanted
                }
                setCurrentDeal(null); // Clear the immediate deal view
                console.log(`[BlackMarket] RAID TRIGGERED! Suspicion: ${suspicion}, Roll: ${roll}`);
                return true; // BLOCK ACTION
            }
        }
        return false; // ALLOW ACTION
    }, [suspicion]);

    // --- ACTIONS ---

    /**
     * Open a category and get ONE random deal
     * Increases suspicion immediately
     */
    const openCategory = useCallback((category: BlackMarketCategory) => {
        // 1. Check Raid Risk FIRST
        if (checkRaidRisk()) return;

        // Increase suspicion
        const newSuspicion = Math.min(100, suspicion + CATEGORY_OPEN_SUSPICION);
        updateBlackMarket('suspicion', newSuspicion);

        // Get random deal based on Street Rep
        const deal = getRandomDeal(category, streetRep);
        setCurrentDeal(deal);
        setActiveView('DEAL'); // Switch to Deal View

        console.log(`[BlackMarket] Opened ${category}, Suspicion +${CATEGORY_OPEN_SUSPICION}%`);
    }, [streetRep, suspicion, updateBlackMarket, checkRaidRisk]);

    /**
     * Consume a drug item
     * Applies immediate effects and tracks addiction
     */
    const consumeDrug = useCallback((item: BlackMarketItem): { success: boolean; message: string; warning?: string } => {
        // NOTE: Raid Risk is now ONLY during browsing (openCategory).
        // Once deal is open, consumption is "safe" (bribed/secured).

        if (!item.isDrug) {
            return { success: false, message: 'This item is not consumable.' };
        }

        // Apply Immediate Effects
        updateCore('health', Math.max(0, (core.health || 0) - 20));
        updateCore('happiness', Math.min(100, (core.happiness || 0) + 25));
        updateAttribute('charm', Math.max(0, (attributes.charm || 0) - 5));

        // Street Rep gain (50% of normal for drugs)
        const newStreetRep = Math.min(100, streetRep + item.streetRepGain);
        updateReputation('street', newStreetRep);

        // Increase Suspicion
        const newSuspicion = Math.min(100, suspicion + 10);
        updateBlackMarket('suspicion', newSuspicion);

        // Track Quarterly Usage
        const newUsage = quarterlyDrugUsage + 1;
        updateBlackMarket('quarterlyDrugUsage', newUsage);

        // Addiction Check
        let warningMessage: string | undefined;
        if (newUsage > ADDICTION_THRESHOLD) {
            // Addiction Penalties
            const penaltySuspicion = Math.min(100, newSuspicion + 10); // Additional Police Heat +10
            updateBlackMarket('suspicion', penaltySuspicion);

            updatePersonality('morality', Math.max(0, (usePlayerStore.getState().personality.morality || 0) - 10));
            updateAttribute('intellect', Math.max(0, (attributes.intellect || 0) - 5));
            updateReputation('business', Math.max(0, (reputation.business || 0) - 10));

            warningMessage = '⚠️ ADDICTION WARNING: Your excessive usage is affecting your life.';
        }

        setCurrentDeal(null); // Close deal view
        setPendingItem(null); // Clear pending
        setActiveView('HUB'); // Return to hub

        return {
            success: true,
            message: `Consumed ${item.name}. Health -20, Happiness +25, Charisma -5`,
            warning: warningMessage
        };
    }, [quarterlyDrugUsage, core, attributes, reputation, streetRep, suspicion, updateCore, updateAttribute, updateReputation, updatePersonality, updateBlackMarket]);

    /**
     * Buy the current deal
     */
    const buyItem = useCallback((): { success: boolean; message: string; warning?: string } => {
        // NOTE: Raid Risk is ONLY during openCategory now.
        // Purchasing is considered "safe" once the deal is presented.

        if (!currentDeal) {
            return { success: false, message: 'No deal available.' };
        }

        // Check Money
        if (money < currentDeal.price) {
            return { success: false, message: 'Insufficient funds.' };
        }

        // Deduct Money
        if (!spendMoney(currentDeal.price)) {
            return { success: false, message: 'Transaction failed.' };
        }

        // Route based on item type
        if (currentDeal.isDrug) {
            // Drugs are consumed immediately
            const result = consumeDrug(currentDeal);
            return result;
        } else {
            // Assets/Weapons/Jewelry are added to inventory
            const newItem: InventoryItem = {
                id: currentDeal.id,
                name: currentDeal.name,
                price: currentDeal.price,
                type: currentDeal.type,
                shopId: 'black_market',
                purchasedAt: Date.now()
            };
            addItem(newItem);

            // Apply Street Rep gain
            const newStreetRep = Math.min(100, streetRep + currentDeal.streetRepGain);
            updateReputation('street', newStreetRep);

            // High Society Bonus Logic
            let messageAddition = '';

            // Tier 4 Bonus (Business Trust)
            if (currentDeal.tier === 4) {
                updateReputation('business', Math.min(100, (reputation.business || 0) + 5));
            }

            // High Value Bonus (High Society)
            // If item costs >= $100M, gain +5 High Society (Social Rep)
            if (currentDeal.price >= 100_000_000) {
                const currentHighSociety = reputation.social || 0;
                updateReputation('social', Math.min(100, currentHighSociety + 5));
                messageAddition = ' +5 High Society 🎩';
            }

            setCurrentDeal(null); // Clear deal after purchase
            setActiveView('HUB'); // Return to Hub

            return {
                success: true,
                message: `Acquired ${currentDeal.name}. Street Rep +${currentDeal.streetRepGain.toFixed(1)}${messageAddition}`
            };
        }
    }, [currentDeal, money, streetRep, reputation, spendMoney, addItem, updateReputation, consumeDrug]);

    /**
     * Pass on the current deal (close overlay and return to hub)
     */
    const passItem = useCallback(() => {
        setCurrentDeal(null);
        setActiveView('HUB');
    }, []);

    /**
     * Resolve Raid Outcome
     * Called when the police game ends.
     */
    const resolveRaid = useCallback((won: boolean): { message: string, success: boolean } => {
        let resultMessage = '';

        if (won) {
            // SCENE A: ESCAPED
            // Reward: Halve Suspicion (don't reset to 0)
            const halvedSuspicion = Math.floor(suspicion * 0.5);
            updateBlackMarket('suspicion', halvedSuspicion);

            // Note: NO free item reward anymore.
            resultMessage = 'Escaped! You shook off the heat. Suspicion halved.';

            // If there was a pending item (from openCategory interruption if we used it there?), 
            // since we removed risk from buyItem, pendingItem might not be set.
            // But if we ever re-introduce risk, clearing it is safe.
            setPendingItem(null);
        } else {
            // SCENE B: CAUGHT
            // 1. Financial Tiered Penalty
            let fine = 0;
            if (money > 100_000_000) {
                fine = 1_000_000;
            } else if (money > 1_000_000) {
                fine = 100_000;
            } else {
                fine = Math.floor(money * 0.10);
            }

            if (fine > 0) spendMoney(fine);

            // 2. Stat Penalties
            updateCore('happiness', Math.max(0, (core.happiness || 0) - 10));
            updateReputation('business', Math.max(0, (reputation.business || 0) - 10)); // Business Trust
            updateReputation('social', Math.max(0, (reputation.social || 0) - 10)); // High Society
            updatePersonality('morality', Math.max(0, (usePlayerStore.getState().personality.morality || 0) - 5));

            // 3. Street Rep GAIN (Criminal Cred)
            updateReputation('street', Math.min(100, streetRep + 1));

            // 4. Reset Suspicion
            updateBlackMarket('suspicion', 0);

            resultMessage = `Caught! Fined $${fine.toLocaleString()}. Lost Trust, gained Street Rep (+1).`;
        }

        // --- IMMEDIATE VIEW RESET ---
        // Ensuring zero delay transition back to Hub
        console.log('[BlackMarket] Raid Resolved. Switching to HUB immediately.');
        setPendingItem(null);
        setCurrentDeal(null);
        setActiveView('HUB');

        return { success: won, message: resultMessage };
    }, [money, suspicion, reputation, activeView, updateBlackMarket, spendMoney, updateReputation, updateCore, updatePersonality, core, streetRep]);

    /**
     * Check if a police raid should be triggered (Legacy/Manual check)
     * Now primarily handled by checkRaidRisk internally.
     */
    const triggerRaid = useCallback((): { shouldRaid: boolean; chance: number } => {
        const triggered = checkRaidRisk();
        return {
            shouldRaid: triggered,
            chance: RAID_BASE_CHANCE * 100
        };
    }, [checkRaidRisk]);

    /**
     * Reset quarterly drug usage counter
     */
    const resetQuarterlyUsage = useCallback(() => {
        updateBlackMarket('quarterlyDrugUsage', 0);
    }, [updateBlackMarket]);

    /**
     * Decay Suspicion (Quarterly)
     * Reduces suspicion by 90%
     */
    const decaySuspicion = useCallback(() => {
        const decayed = Math.floor(suspicion * 0.10); // Reduce TO 10% (drop by 90%)
        updateBlackMarket('suspicion', decayed);
        console.log(`[BlackMarket] Decay Applied. ${suspicion} -> ${decayed}`);
    }, [suspicion, updateBlackMarket]);

    /**
     * Manually close raid view (e.g. after game)
     * @deprecated Use resolveRaid instead
     */
    const closeRaid = useCallback(() => {
        setActiveView('HUB');
    }, []);

    // --- RETURN API ---

    return {
        // Data Group
        data: {
            suspicion,
            quarterlyDrugUsage,
            currentDeal,
            pendingItem, // Expose for debugging if needed
            streetRep,
            currentQuarter,
            activeView
        } as BlackMarketData & { pendingItem: BlackMarketItem | null },

        // Actions Group
        actions: {
            openCategory,
            buyItem,
            passItem,
            consumeDrug,
            triggerRaid,
            resetQuarterlyUsage,
            decaySuspicion,
            closeRaid,
            resolveRaid // NEW
        } as BlackMarketActions & { resolveRaid: (won: boolean) => { message: string, success: boolean } }
    };
};

// --- RE-EXPORTS ---
export type { BlackMarketItem, BlackMarketCategory };
export { getRandomDeal };
