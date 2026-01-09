import { useState, useCallback } from 'react';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useUserStore } from '../../../core/store/useUserStore';
import { triggerEvent } from '../../../event/eventEngine'; // Assuming we might want to trigger random events later

export type TripVibe = 'Standard' | 'Ultra-Rich';

export type ActivityType =
    | 'All-Inclusive Resort' | 'Cultural Trip' | 'Partying & Nightclubs' | 'Family Vacation' // Standard
    | 'Private Island Retreat' | 'Superyacht Week' | 'Luxury Safari' | 'High-Stakes Gambling Tour' | 'Wellness & Detox Sanctuary'; // Ultra-Rich

export type CompanionType = 'Myself' | 'Partner' | 'Kids' | 'Family'; // Family = Partner + Kids

export const COUNTRIES = [
    'Switzerland', 'Maldives', 'Japan', 'Italy', 'France', 'USA', 'Monaco', 'Dubai', 'Thailand', 'Greece',
    'Bora Bora', 'Brazil', 'Singapore', 'UK', 'Australia', 'Egypt', 'Turkey', 'Aspen', 'Caribbean', 'South Africa'
];

export const ACTIVITIES: Record<TripVibe, ActivityType[]> = {
    'Standard': ['All-Inclusive Resort', 'Cultural Trip', 'Partying & Nightclubs', 'Family Vacation'],
    'Ultra-Rich': ['Private Island Retreat', 'Superyacht Week', 'Luxury Safari', 'High-Stakes Gambling Tour', 'Wellness & Detox Sanctuary'],
};

// Base costs
const BASE_COST_PER_COUNTRY = 2000;
const ACTIVITY_COSTS: Record<ActivityType, number> = {
    'All-Inclusive Resort': 1500,
    'Cultural Trip': 1000,
    'Partying & Nightclubs': 2000,
    'Family Vacation': 2500,
    'Private Island Retreat': 20000,
    'Superyacht Week': 50000,
    'Luxury Safari': 15000,
    'High-Stakes Gambling Tour': 10000, // + gambling money potentially?
    'Wellness & Detox Sanctuary': 8000,
};

export const useTravelSystem = (triggerEncounter?: (context: string, countryId?: string) => boolean) => {
    // Modal Visibility States
    const [destinationModalVisible, setDestinationModalVisible] = useState(false);
    const [companionModalVisible, setCompanionModalVisible] = useState(false);
    const [resultModalVisible, setResultModalVisible] = useState(false);

    // Selection States
    const [selectedCountry, setSelectedCountry] = useState<string>(COUNTRIES[0]);
    const [selectedVibe, setSelectedVibe] = useState<TripVibe>('Standard');
    const [selectedActivity, setSelectedActivity] = useState<ActivityType>(ACTIVITIES['Standard'][0]);
    const [selectedCompanion, setSelectedCompanion] = useState<CompanionType | null>(null);

    // Result States
    const [totalCost, setTotalCost] = useState(0);
    const [enjoyment, setEnjoyment] = useState(0);

    // Store access
    const { money, spendMoney, setField: setStatsField } = useStatsStore();
    const { partner, family } = useUserStore();

    const children = family.filter(m => m.relation === 'Son' || m.relation === 'Daughter');
    const hasPartner = !!partner;
    const hasChildren = children.length > 0;

    const openTravel = useCallback(() => {
        setDestinationModalVisible(true);
        // Reset selection defaults
        setSelectedCountry(COUNTRIES[0]);
        setSelectedVibe('Standard');
        setSelectedActivity(ACTIVITIES['Standard'][0]);
    }, []);

    const closeTravel = useCallback(() => {
        setDestinationModalVisible(false);
        setCompanionModalVisible(false);
        setResultModalVisible(false);
    }, []);

    const goToCompanionSelection = useCallback(() => {
        setDestinationModalVisible(false);
        // Short delay for smooth transition if needed, or immediate
        setTimeout(() => setCompanionModalVisible(true), 300);
    }, []);

    const calculateCost = useCallback((companion: CompanionType) => {
        let multiplier = 1;
        if (companion === 'Partner') multiplier = 2;
        if (companion === 'Kids') multiplier = 1 + children.length;
        if (companion === 'Family') multiplier = 1 + 1 + children.length; // Self + Partner + Kids

        const base = BASE_COST_PER_COUNTRY; // Could vary by country later
        const activity = ACTIVITY_COSTS[selectedActivity];

        return (base + activity) * multiplier;
    }, [selectedActivity, children.length]);

    const confirmTrip = useCallback((companion: CompanionType) => {
        const cost = calculateCost(companion);
        console.log(`[Travel] Calculating cost: (${BASE_COST_PER_COUNTRY} + ${ACTIVITY_COSTS[selectedActivity]}) * multiplier = ${cost}`);

        if (money < cost) {
            // Insufficient funds - could show alert
            return;
        }

        // Deduct money
        if (!spendMoney(cost)) {
            console.warn('[Travel] Insufficient funds for trip');
            return;
        }
        setTotalCost(cost);
        setSelectedCompanion(companion);

        // Calculate RNG Enjoyment
        const minEnjoyment = 60;
        const maxEnjoyment = 100;
        const randomEnjoyment = Math.floor(Math.random() * (maxEnjoyment - minEnjoyment + 1)) + minEnjoyment;
        setEnjoyment(randomEnjoyment);

        // Close companion modal
        setCompanionModalVisible(false);

        // CRITICAL: Only trigger encounter if traveling ALONE
        if (companion === 'Myself' && triggerEncounter) {
            // Map country name to encounter system country ID
            const countryMap: Record<string, string> = {
                'Japan': 'japan',
                'France': 'france',
                'USA': 'usa',
                'Dubai': 'dubai'
            };
            const countryId = countryMap[selectedCountry];

            const hasEncounter = triggerEncounter('travel', countryId);
            if (hasEncounter) {
                // Encounter modal will open, don't show result modal yet
                return;
            }
        }

        // No encounter or traveling with companion - show result
        setTimeout(() => setResultModalVisible(true), 300);

    }, [money, selectedActivity, selectedCountry, calculateCost, setStatsField, triggerEncounter]);

    return {
        // Visibility
        destinationModalVisible,
        companionModalVisible,
        resultModalVisible,

        // Actions
        openTravel,
        closeTravel,
        goToCompanionSelection,
        confirmTrip,

        // State Setters
        setDestinationModalVisible,
        setCompanionModalVisible,
        setResultModalVisible,
        setSelectedCountry,
        setSelectedVibe,
        setSelectedActivity,

        // Selection Values
        selectedCountry,
        selectedVibe,
        selectedActivity,

        // Computed / Context
        hasPartner,
        hasChildren,
        partnerName: partner?.name,
        childrenCount: children.length,

        // Results
        totalCost,
        enjoyment,
        selectedCompanion
    };
};
