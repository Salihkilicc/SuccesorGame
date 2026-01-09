import { useState } from 'react';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useEventStore } from '../../../../core/store/useEventStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

export type SanctuaryResult = {
    title: string;
    message: string;
    stats: { label: string; value: string; isPositive: boolean }[];
};

export const useSanctuarySystem = () => {
    // Hub Visibility
    const [isHubVisible, setHubVisible] = useState(false);

    // Sub-Modals Visibility
    const [isGroomingVisible, setGroomingVisible] = useState(false);
    const [isMassageVisible, setMassageVisible] = useState(false);
    const [isSunStudioVisible, setSunStudioVisible] = useState(false);
    const [isSurgeryVisible, setSurgeryVisible] = useState(false);

    // Result Modal
    const [isResultVisible, setResultVisible] = useState(false);
    const [resultData, setResultData] = useState<SanctuaryResult | null>(null);

    // Store actions
    const { money, update: updateStats } = useStatsStore();
    const { setLastLifeEvent } = useEventStore();

    // --- Hub Actions ---
    const openSanctuary = () => setHubVisible(true);

    // Navigation fix: This ensures everything resets properly.
    const closeSanctuary = () => {
        setResultVisible(false);
        setHubVisible(false);
        setGroomingVisible(false);
        setMassageVisible(false);
        setSunStudioVisible(false);
        setSurgeryVisible(false);
        setResultData(null);
    };

    // --- Universal Service Handler ---
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
        // Merge stat updates carefully. For simple numbers (like stress - 10), 
        // the passed statUpdates should essentially be the FINAL new value logic 
        // or we handle calculation here.
        // To simplify, we'll assume the caller passes the DELTA logic or the FINAL values?
        // Actually, passing FINAL values is safer if calculated in the component, 
        // but passing DELTAS is more reusable. 
        // Let's assume the caller calculates the final values to pass in `statUpdates` 
        // OR we stick to specific methods wrapping this handler. 

        // Better approach: Caller determines "Start Grooming" -> Calculates new stats -> Calls this.
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
        setGroomingVisible(false);
        setMassageVisible(false);
        setSunStudioVisible(false);
        setSurgeryVisible(false);
        setHubVisible(false); // Close hub effectively too so we don't flash back

        // 4. Show Result
        setTimeout(() => {
            setResultVisible(true);
        }, 300); // Short delay for smooth transition
    };


    // --- Specific Openers ---
    const openGrooming = () => {
        setHubVisible(false);
        setTimeout(() => setGroomingVisible(true), 300);
    };

    const openMassage = () => {
        setHubVisible(false);
        setTimeout(() => setMassageVisible(true), 300);
    };

    const openSunStudio = () => {
        setHubVisible(false);
        setTimeout(() => setSunStudioVisible(true), 300);
    };

    const openSurgery = () => {
        setHubVisible(false);
        setTimeout(() => setSurgeryVisible(true), 300);
    };

    return {
        isHubVisible,
        closeSanctuary,
        openSanctuary,

        // Sub-modals state
        isGroomingVisible, setGroomingVisible,
        isMassageVisible, setMassageVisible,
        isSunStudioVisible, setSunStudioVisible,
        isSurgeryVisible, setSurgeryVisible,

        // Result Modal
        isResultVisible,
        resultData,

        // Actions
        openGrooming,
        openMassage,
        openSunStudio,
        openSurgery,

        // The core handler
        handleServicePurchase,
    };
};
