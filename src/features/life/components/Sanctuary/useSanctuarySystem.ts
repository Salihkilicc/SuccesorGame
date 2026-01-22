import { useState } from 'react';
import { create } from 'zustand';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useEventStore } from '../../../../core/store/useEventStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { useGameStore } from '../../../../core/store/useGameStore';
import { DOCTORS, Doctor, GROOMING_SERVICES } from './sanctuaryData';

export type SanctuaryResult = {
    title: string;
    message: string;
    stats: { label: string; value: string; isPositive: boolean }[];
};

// ==========================================
// INTERNAL ZUSTAND STORE (Persistent State)
// ==========================================
type SanctuaryStore = {
    // Usage Tracker (Boolean flags for quarterly limits)
    usageTracker: {
        surgery: boolean;
        massage: boolean;
        grooming: boolean;
    };

    // Active Buffs (Temporary stat boosts)
    activeBuffs: {
        freshCut: boolean;
    };

    // Actions
    setUsed: (service: 'surgery' | 'massage' | 'grooming') => void;
    setFreshCut: (isActive: boolean) => void;
    resetQuarter: () => void;
};

const useSanctuaryStore = create<SanctuaryStore>((set) => ({
    usageTracker: {
        surgery: false,
        massage: false,
        grooming: false,
    },
    activeBuffs: {
        freshCut: false,
    },
    setUsed: (service) => set((state) => ({
        usageTracker: { ...state.usageTracker, [service]: true }
    })),
    setFreshCut: (isActive) => set((state) => ({
        activeBuffs: { ...state.activeBuffs, freshCut: isActive }
    })),
    resetQuarter: () => set({
        usageTracker: { surgery: false, massage: false, grooming: false },
        activeBuffs: { freshCut: false },
    }),
}));

// ==========================================
// GLOBAL QUARTER RESET FUNCTION
// ==========================================
export const startNewQuarter = () => {
    const { activeBuffs, resetQuarter } = useSanctuaryStore.getState();
    const playerState = usePlayerStore.getState();

    // 1. Remove Temporary Buffs
    if (activeBuffs.freshCut) {
        // Remove the +5 Luck buff
        const currentLuck = playerState.hidden.luck;
        playerState.updateHidden('luck', Math.max(0, currentLuck - 5));
        console.log('[Sanctuary] Fresh Cut buff removed (-5 Luck)');
    }

    // 2. Reset All State (Buffs + Usage Limits)
    resetQuarter();

    console.log('[Sanctuary] Quarter reset complete. Buffs removed, limits cleared.');
};

export const useSanctuarySystem = () => {
    // Connect to Internal Store
    const { usageTracker, activeBuffs, setUsed, setFreshCut } = useSanctuaryStore();

    // Navigation State (UI-only, no need to persist)
    const [activeView, setActiveView] = useState<'HUB' | 'MASSAGE' | 'GROOMING' | 'SURGERY' | 'SUN_STUDIO'>('HUB');
    const [isHubVisible, setHubVisible] = useState(false);

    // Result Modal (UI-only)
    const [isResultVisible, setResultVisible] = useState(false);
    const [resultData, setResultData] = useState<SanctuaryResult | null>(null);

    // VIP Membership State (UI-only, resets quarterly via startNewQuarter)
    const [isVIPMember, setVIPMember] = useState(false);

    // Store actions
    const { money, update: updateStats } = useStatsStore();
    const { setLastLifeEvent } = useEventStore();

    // --- Navigation Actions ---
    const openSanctuary = () => {
        setHubVisible(true);
        setActiveView('HUB');
    };

    const closeSanctuary = () => {
        setHubVisible(false);
        setActiveView('HUB');
        setResultData(null);
    };

    const navigate = (view: 'HUB' | 'MASSAGE' | 'GROOMING' | 'SURGERY' | 'SUN_STUDIO') => {
        setActiveView(view);
    };

    const goBack = () => {
        setActiveView('HUB');
    };

    // --- VIP Membership Action ---
    const buyMembership = () => {
        const currentStats = useStatsStore.getState();

        if (currentStats.money < 20000) {
            // Not enough money - ideally show alert
            return false;
        }

        // Deduct money
        updateStats({ money: currentStats.money - 20000 });

        // Set VIP status
        setVIPMember(true);

        // Show success result
        setResultData({
            title: 'VIP PLATINUM ACTIVATED',
            message: 'Welcome to the elite club! Enjoy FREE Royal Massages this quarter. 👑',
            stats: [
                { label: 'Money', value: '-$20,000', isPositive: false },
                { label: 'Status', value: 'VIP Member', isPositive: true },
            ],
        });

        setHubVisible(false);
        setTimeout(() => setResultVisible(true), 300);

        return true;
    };

    // --- Surgery Action with RNG ---
    const performSurgery = (doctorId: string) => {
        const doctor = DOCTORS.find(d => d.id === doctorId);
        if (!doctor) return;

        const currentStats = useStatsStore.getState();
        const playerState = usePlayerStore.getState();

        // Check if surgery already performed this quarter
        if (usageTracker.surgery) {
            // Already used - could show alert
            console.log('[Sanctuary] Surgery already performed this quarter');
            return;
        }

        // Check money
        if (currentStats.money < doctor.cost) {
            return;
        }

        // Deduct money
        updateStats({ money: currentStats.money - doctor.cost });

        // Mark as used
        setUsed('surgery');

        // RNG Check
        const isSuccess = Math.random() < doctor.successRate;

        if (isSuccess) {
            // Success Path
            // Calculate Looks Increase based on doctor tier
            let looksIncrease = 0;
            if (doctor.looksMin !== undefined && doctor.looksMax !== undefined) {
                looksIncrease = Math.floor(Math.random() * (doctor.looksMax - doctor.looksMin + 1)) + doctor.looksMin;
            }

            const newCharm = Math.min(100, playerState.attributes.charm + doctor.success.charm);
            const newLooks = Math.min(100, playerState.attributes.looks + looksIncrease);

            playerState.updateAttribute('charm', newCharm);
            playerState.updateAttribute('looks', newLooks);

            // High Society bonus if applicable
            if (doctor.success.highSociety) {
                const newHighSociety = Math.min(100, playerState.reputation.social + doctor.success.highSociety);
                playerState.updateReputation('social', newHighSociety);
            }

            setResultData({
                title: 'SURGERY SUCCESSFUL',
                message: `Surgery Successful! \n✨ Looks +${looksIncrease} \n💖 Charm +${doctor.success.charm}`,
                stats: [
                    { label: 'Looks', value: `+${looksIncrease}`, isPositive: true },
                    { label: 'Charm', value: `+${doctor.success.charm}`, isPositive: true },
                    ...(doctor.success.highSociety ? [{ label: 'High Society', value: `+${doctor.success.highSociety}`, isPositive: true }] : []),
                ],
            });
        } else {
            // Failure Path
            // Botched surgery: -10 Looks, +20 Stress
            const looksDecrease = 10;
            const stressIncrease = 20;

            const newCharm = Math.max(0, playerState.attributes.charm + doctor.failure.charm);
            const newStress = Math.min(100, playerState.core.stress + stressIncrease);
            const newLooks = Math.max(0, playerState.attributes.looks - looksDecrease);

            playerState.updateAttribute('charm', newCharm);
            playerState.updateCore('stress', newStress);
            playerState.updateAttribute('looks', newLooks);

            setResultData({
                title: 'SURGERY FAILED',
                message: 'It went wrong... You look worse.',
                stats: [
                    { label: 'Looks', value: `-${looksDecrease}`, isPositive: false },
                    { label: 'Stress', value: `+${stressIncrease}`, isPositive: false },
                    ...(doctor.failure.charm !== 0 ? [{ label: 'Charm', value: `${doctor.failure.charm}`, isPositive: false }] : []),
                ],
            });
        }

        // Close surgery modal and show result
        setHubVisible(false); // Close main modal
        setTimeout(() => setResultVisible(true), 300);
    };

    // --- Fresh Cut Action (Temporary Luck Boost) ---
    const getFreshCut = () => {
        const service = GROOMING_SERVICES.find(s => s.id === 'fresh_cut');
        if (!service) return;

        const currentStats = useStatsStore.getState();
        const playerState = usePlayerStore.getState();

        // Check if already active
        if (activeBuffs.freshCut) {
            console.log('[Sanctuary] Fresh Cut buff already active');
            return;
        }

        // Check money
        if (currentStats.money < service.cost) {
            return;
        }

        // Deduct money
        updateStats({ money: currentStats.money - service.cost });

        // Apply Luck boost
        const newLuck = Math.min(100, playerState.hidden.luck + service.luck);
        playerState.updateHidden('luck', newLuck);

        // Set active buff flag
        setFreshCut(true);

        // Mark as used
        setUsed('grooming');

        // Show result
        setResultData({
            title: service.name.toUpperCase(),
            message: 'Fresh cut! +5 Luck (Temporary)',
            stats: [
                { label: 'Luck', value: `+${service.luck}`, isPositive: true },
                { label: 'Duration', value: '1 Quarter', isPositive: true },
            ],
        });

        // Close sanctuary and show result
        setHubVisible(false);
        setTimeout(() => setResultVisible(true), 300);
    };

    // --- Universal Service Handler (Legacy - kept for compatibility) ---
    const handleServicePurchase = (
        cost: number,
        statUpdates: Record<string, number>,
        resultTitle: string,
        resultMessage: string,
        displayStats: { label: string; value: string; isPositive: boolean }[]
    ) => {
        const currentStats = useStatsStore.getState();

        if (currentStats.money < cost) {
            // Ideally show alert, for now just logic block
            return;
        }

        // 1. Deduct Money & Update Stats
        const newMoney = currentStats.money - cost;
        updateStats({ money: newMoney });

        // Handle Player Stats Updates (Health, Stress, Charisma->Charm)
        const playerStore = usePlayerStore.getState();
        Object.entries(statUpdates).forEach(([key, value]) => {
            if (key === 'health') playerStore.updateCore('health', value);
            if (key === 'stress') playerStore.updateCore('stress', value);
            if (key === 'charisma') playerStore.updateAttribute('charm', value);
        });

        // 2. Prepare Result Data
        setResultData({
            title: resultTitle,
            message: resultMessage,
            stats: displayStats
        });

        // 3. Manage Modals
        // Close all sub-modals immediately
        // Show Success Logic
        setResultData({
            title: resultTitle.toUpperCase(),
            message: resultMessage,
            stats: displayStats,
        });

        // Close sanctuary
        setHubVisible(false);
        setActiveView('HUB');

        // Show Result
        setTimeout(() => setResultVisible(true), 300);
    };

    return {
        // Navigation
        isHubVisible,
        activeView,
        openSanctuary,
        closeSanctuary,
        navigate,
        goBack,

        // State
        isResultVisible,
        resultData,
        closeResult: () => setResultVisible(false),
        isVIPMember,
        usageTracker,
        activeBuffs,

        // Actions
        buyMembership,
        performSurgery,
        getFreshCut,
        handleServicePurchase,
    };
};
