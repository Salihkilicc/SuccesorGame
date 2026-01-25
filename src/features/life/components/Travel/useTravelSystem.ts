import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { VACATION_SPOTS, VacationSpot, TravelClass } from './data/travelData';
import { useTravelStore } from './store/useTravelStore';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

export type TravelView = 'HUB' | 'BOOKING' | 'EXPERIENCE' | 'MINIGAME' | 'COLLECTION' | null;

interface ResultData {
    enjoyment: number;
    narrative: string;
    happiness: number;
    foundSouvenir: boolean;
}

export const useTravelSystem = () => {
    // --- STORES ---
    const { money, update: updateStats } = useStatsStore();
    const { updateCore, core } = usePlayerStore();
    const { collectSouvenir, hasSouvenir } = useTravelStore();

    // --- UI STATE ---
    const [currentView, setCurrentView] = useState<TravelView>(null);

    // --- DATA STATE ---
    const [selectedSpot, setSelectedSpot] = useState<VacationSpot | null>(null);
    const [travelClass, setTravelClass] = useState<TravelClass>('ECONOMY');
    const [bringPartner, setBringPartner] = useState(false);
    const [resultData, setResultData] = useState<ResultData | null>(null);

    // --- HELPERS ---
    const getClassMultiplier = (tClass: TravelClass): number => {
        switch (tClass) {
            case 'ECONOMY': return 1;
            case 'BUSINESS': return 2;
            case 'PRIVATE': return 5;
        }
    };

    const calculateEnjoyment = (tClass: TravelClass): number => {
        let min = 0;
        let max = 80;

        if (tClass === 'BUSINESS') {
            min = 30;
            max = 90;
        } else if (tClass === 'PRIVATE') {
            min = 60;
            max = 100;
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const getNarrative = (spot: VacationSpot, enjoyment: number): string => {
        if (enjoyment < 40) {
            const narratives = spot.narratives.low;
            return narratives[Math.floor(Math.random() * narratives.length)];
        } else if (enjoyment < 75) {
            const narratives = spot.narratives.mid;
            return narratives[Math.floor(Math.random() * narratives.length)];
        } else {
            const narratives = spot.narratives.high;
            return narratives[Math.floor(Math.random() * narratives.length)];
        }
    };

    // --- ACTIONS ---
    const openTravel = useCallback(() => {
        setCurrentView('HUB');
    }, []);

    const closeTravel = useCallback(() => {
        setCurrentView(null);
        setSelectedSpot(null);
        setResultData(null);
    }, []);

    const openBooking = useCallback((spot: VacationSpot) => {
        setSelectedSpot(spot);
        setCurrentView('BOOKING');
    }, []);

    const startTrip = useCallback(() => {
        if (!selectedSpot) {
            Alert.alert('Error', 'No destination selected.');
            return;
        }

        const classMultiplier = getClassMultiplier(travelClass);
        const partnerMultiplier = bringPartner ? 2 : 1;
        const totalCost = selectedSpot.baseCost * classMultiplier * partnerMultiplier;

        if (money < totalCost) {
            Alert.alert('Insufficient Funds', "You can't afford this trip.");
            return;
        }

        // Deduct money
        updateStats({ money: money - totalCost });

        // Calculate enjoyment
        const enjoyment = calculateEnjoyment(travelClass);
        const narrative = getNarrative(selectedSpot, enjoyment);

        // Calculate happiness gain (scaled by enjoyment)
        const happinessGain = Math.floor(enjoyment / 5); // 0-20 for economy, up to 20 for private
        updateCore('happiness', Math.min(100, core.happiness + happinessGain));

        // Check for souvenir discovery
        const foundSouvenir = enjoyment > 70 && !hasSouvenir(selectedSpot.souvenir.id);

        setResultData({
            enjoyment,
            narrative,
            happiness: happinessGain,
            foundSouvenir,
        });

        setCurrentView('EXPERIENCE');
    }, [selectedSpot, travelClass, bringPartner, money, updateStats, core, updateCore, hasSouvenir]);

    const onExperienceComplete = useCallback(() => {
        if (!resultData || !selectedSpot) return;

        // Souvenir Probability
        const chance = travelClass === 'PRIVATE' ? 0.70 : travelClass === 'BUSINESS' ? 0.33 : 0.25;

        // Check probability and specific souvenir ID ownership
        if (Math.random() < chance && !hasSouvenir(selectedSpot.souvenir.id)) {
            // Trigger mini-game
            setCurrentView('MINIGAME');
        } else {
            // Close experience, return to LIFE SCREEN (close travel system)
            setCurrentView(null);
            setSelectedSpot(null);
            setResultData(null);
        }
    }, [resultData, selectedSpot, travelClass, hasSouvenir]);

    const onMiniGameComplete = useCallback((success: boolean) => {
        if (success && selectedSpot) {
            collectSouvenir(selectedSpot.souvenir.id);
            Alert.alert('Souvenir Found!', `You collected: ${selectedSpot.souvenir.emoji} ${selectedSpot.souvenir.name}`);
        }

        // Return to LIFE SCREEN (close travel system)
        setCurrentView(null);
        setSelectedSpot(null);
        setResultData(null);
    }, [selectedSpot, collectSouvenir]);

    const openCollection = useCallback(() => {
        setCurrentView('COLLECTION');
    }, []);

    const closeCollection = useCallback(() => {
        setCurrentView('HUB');
    }, []);

    const closeBooking = useCallback(() => {
        setCurrentView('HUB');
        setSelectedSpot(null);
    }, []);

    return {
        // State
        currentView,
        selectedSpot,
        travelClass,
        bringPartner,
        resultData,
        vacationSpots: VACATION_SPOTS,

        // Actions
        openTravel,
        closeTravel,
        setTravelClass,
        setBringPartner,
        openBooking,
        startTrip,
        onExperienceComplete,
        onMiniGameComplete,
        openCollection,
        closeCollection,
        closeBooking,
        setCurrentView,

        // Store methods
        hasSouvenir,
    };
};
