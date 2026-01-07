import { useState, useCallback, useMemo } from 'react';
import { useStatsStore } from '../../../store/useStatsStore';
import { useUserStore, InventoryItem } from '../../../store/useUserStore';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { Alert } from 'react-native';

export type NightOutClub = {
    id: string;
    name: string;
    location: string;
    entryFee: number;
    country: string;
};

export const CLUBS: NightOutClub[] = [
    { id: '1', name: 'Omnia', location: 'Las Vegas', country: 'USA', entryFee: 5000 },
    { id: '2', name: 'Berghain', location: 'Berlin', country: 'Germany', entryFee: 3000 },
    { id: '3', name: 'Ushuaïa', location: 'Ibiza', country: 'Spain', entryFee: 6000 },
    { id: '4', name: 'Cavalli Club', location: 'Dubai', country: 'UAE', entryFee: 10000 },
    { id: '5', name: 'Octagon', location: 'Seoul', country: 'South Korea', entryFee: 4000 },
];

export type NightOutOutcome = 'enjoyment' | 'hookup';

export const useNightOutSystem = (triggerEncounter?: (context: string) => boolean) => {
    const [setupModalVisible, setSetupModalVisible] = useState(false);
    const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);
    const [outcomeType, setOutcomeType] = useState<NightOutOutcome | null>(null);
    const [condomModalVisible, setCondomModalVisible] = useState(false);

    // Selection State
    const [selectedClub, setSelectedClub] = useState<NightOutClub>(CLUBS[0]);
    const [selectedAircraft, setSelectedAircraft] = useState<InventoryItem | null>(null);

    // Store access
    const { money, update: updateStats } = useStatsStore();
    const { inventory } = useUserStore();
    const { updateCore, updateAttribute, core, attributes } = usePlayerStore();

    // Filter Aircrafts
    const aircrafts = useMemo(() => {
        return inventory.filter(item => item.type === 'aircraft' || item.type === 'plane');
    }, [inventory]);

    const needsTravel = selectedClub.country !== 'USA';

    const travelCost = useMemo(() => {
        if (!needsTravel) return 0;
        if (selectedAircraft) {
            // Dynamic cost based on aircraft price (more expensive plane = higher op cost)
            // Heuristic: 0.5% of plane value per trip? Or fixed scaling?
            // Let's go with a simpler model: Base $5k + 0.1% of value
            return 5000 + (selectedAircraft.price * 0.001);
        }
        // Charter Flight default
        return 50000;
    }, [needsTravel, selectedAircraft]);

    const totalCost = selectedClub.entryFee + travelCost;

    const startNightOut = useCallback(() => {
        setSetupModalVisible(true);
        // Reset selections
        setSelectedClub(CLUBS[0]);
        setSelectedAircraft(aircrafts.length > 0 ? aircrafts[0] : null);
    }, [aircrafts]);

    const confirmNightOut = useCallback(() => {
        if (money < totalCost) {
            Alert.alert('Insufficient Funds', "You can't afford this night out yet.");
            return;
        }

        // 1. Deduct Money & Update Stats
        updateStats({
            money: money - totalCost,
        });

        // Update Player Stats
        updateCore('stress', Math.max(0, core.stress - 15));
        updateCore('health', Math.max(0, core.health - 5));
        updateAttribute('charm', Math.min(100, attributes.charm + 5));

        setSetupModalVisible(false);

        // 2. Try to trigger encounter
        if (triggerEncounter) {
            const hasEncounter = triggerEncounter('club');
            if (hasEncounter) {
                // Encounter modal will open, don't show outcome modal yet
                // The outcome modal will be shown after encounter closes
                return;
            }
        }

        // 3. No encounter - proceed with normal outcome
        const roll = Math.random();
        const type: NightOutOutcome = roll < 0.66 ? 'enjoyment' : 'hookup';

        setOutcomeType(type);

        // Small delay for transition
        setTimeout(() => {
            setOutcomeModalVisible(true);
        }, 300);

    }, [money, totalCost, updateStats, triggerEncounter]);

    const handleHookupAccept = useCallback(() => {
        setOutcomeModalVisible(false);
        setTimeout(() => {
            setCondomModalVisible(true);
        }, 300);
    }, []);

    const handleOutcomeClose = useCallback(() => {
        setOutcomeModalVisible(false);
        setOutcomeType(null);
    }, []);

    const handleCondomDecision = useCallback((choice: 'safe' | 'risky') => {
        setCondomModalVisible(false);
        // TODO: Record this risky decision flag for future consequences
        if (choice === 'safe') {
            console.log('[NightOut] Safe choice made');
        } else {
            console.log('[NightOut] Risky choice made');
        }
    }, []);

    return {
        // State
        setupModalVisible,
        outcomeModalVisible,
        outcomeType,
        condomModalVisible,
        selectedClub,
        selectedAircraft,
        aircrafts,
        needsTravel,
        totalCost,

        // Actions
        setSetupModalVisible,
        startNightOut,
        setSelectedClub,
        setSelectedAircraft,
        confirmNightOut,
        handleHookupAccept,
        handleOutcomeClose,
        handleCondomDecision,
    };
};
