import { useState, useCallback, useMemo } from 'react';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useUserStore, InventoryItem } from '../../../../core/store/useUserStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { Alert } from 'react-native';
import { HOOKUP_SCENARIOS, HookupScenario, getRandomScenario } from './data/hookupGameData';
import { Partner } from '../../../love/types';


import { VENUES, REGIONAL_NAMES, RegionCode, Venue } from './data/nightOutVenues';
import { generateMiniGamePartner, calculateWildNightOutcome } from './logic/nightOutUtils';



export type NightOutOutcome = 'enjoyment' | 'hookup';
export type SetupStep = 'region_select' | 'venue_select' | 'travel_select' | 'completed';
export type TravelMethod = 'budget' | 'standard' | 'luxury' | 'own';

export const useNightOutSystem = (triggerEncounter?: (context: string) => boolean) => {
    // --- UI STATES ---
    const [setupModalVisible, setSetupModalVisible] = useState(false);
    const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);
    const [nightEndModalVisible, setNightEndModalVisible] = useState(false);
    const [pregnancyModalVisible, setPregnancyModalVisible] = useState(false);
    const [conclusionModalVisible, setConclusionModalVisible] = useState(false);
    const [hookupGameVisible, setHookupGameVisible] = useState(false);
    const [isHangarOpen, setIsHangarOpen] = useState(false);

    // --- DATA STATES ---
    const [outcomeType, setOutcomeType] = useState<NightOutOutcome | null>(null);
    const [conclusionData, setConclusionData] = useState<{
        text: string;
        stats: string[];
        isWild?: boolean;
        enjoymentScore?: number;
        themeColor?: string;
        venueEmoji?: string;
        venueName?: string;
    } | null>(null);

    const [currentScenario, setCurrentScenario] = useState<HookupScenario | null>(null);
    // Product Note: Using Partner type from main game, but will populate with local data
    const [currentPartner, setCurrentPartner] = useState<any | null>(null);

    // --- WIZARD STATES ---
    const [step, setStep] = useState<SetupStep>('region_select');
    const [selectedRegion, setSelectedRegion] = useState<RegionCode | null>(null);
    const [selectedClub, setSelectedClub] = useState<Venue | null>(null);
    const [travelCostAmount, setTravelCostAmount] = useState(0);
    const [travelReputationChange, setTravelReputationChange] = useState(0);

    // Store access
    const { money, update: updateStats } = useStatsStore();
    const { inventory } = useUserStore();
    const { updateCore, updateAttribute, updateReputation, core, attributes, reputation } = usePlayerStore();
    // Helper to keep code consistent with snippet
    const playerStore = { reputation };

    // Check if user owns a private jet
    const hasPrivateJet = useMemo(() => {
        return inventory.some(item => item.type === 'aircraft' || item.type === 'plane');
    }, [inventory]);

    const totalCost = (selectedClub?.entryFee || 0) + travelCostAmount;

    const startNightOut = useCallback(() => {
        setSetupModalVisible(true);
        // Reset to initial step
        setStep('region_select');
        setSelectedRegion(null);
        setSelectedClub(null);
        setTravelCostAmount(0);
        setTravelReputationChange(0);
    }, []);

    const selectRegion = useCallback((region: RegionCode) => {
        setSelectedRegion(region);
        setStep('venue_select');
    }, []);

    const selectVenue = useCallback((venue: Venue) => {
        setSelectedClub(venue);
        // If USA (Local) venue, skip travel selection and go straight to confirmation
        if (venue.region === 'USA') {
            setTravelCostAmount(0);
            setTravelReputationChange(0);
            setStep('completed');
        } else {
            setStep('travel_select');
        }
    }, []);

    const selectTravelMethod = useCallback((method: TravelMethod) => {
        let cost = 0;
        let repChange = 0;

        switch (method) {
            case 'budget':
                cost = 20000;
                repChange = -1;
                break;
            case 'standard':
                cost = 30000;
                repChange = 0;
                break;
            case 'luxury':
                cost = 50000;
                repChange = 1;
                break;
            case 'own':
                if (!hasPrivateJet) {
                    Alert.alert('No Private Jet', 'You need to own a private jet to use this option.');
                    return;
                }
                cost = 5000; // Fuel cost
                repChange = 0;
                break;
        }

        setTravelCostAmount(cost);
        setTravelReputationChange(repChange);

        // Apply reputation change immediately
        if (repChange !== 0) {
            const currentSocial = reputation?.social || 0;
            updateReputation('social', Math.max(0, Math.min(100, currentSocial + repChange)));
        }

        setStep('completed');
    }, [hasPrivateJet, reputation, updateReputation]);

    const confirmNightOut = useCallback(() => {
        if (!selectedClub) {
            Alert.alert('No Venue Selected', 'Please select a venue first.');
            return;
        }

        if (money < totalCost) {
            Alert.alert('Insufficient Funds', "You can't afford this night out yet.");
            return;
        }

        // 1. Deduct Money
        updateStats({
            money: money - totalCost,
        });

        // Update Attribute Charm (Base benefit)
        updateAttribute('charm', Math.min(100, attributes.charm + 5));
        // Note: Stress/Health base updates moved to specific outcomes for finer control, 
        // except keeping a small base health cost for realism? 
        // Let's stick to the plan: modify stress based on outcome.
        updateCore('health', Math.max(0, core.health - 5));

        setSetupModalVisible(false);

        // 2. Determine outcome with specific probabilities
        const roll = Math.random(); // 0.0 to 1.0

        if (roll < 0.20) {
            // 20% Chance: Hookup Mini-Game
            const scenario = getRandomScenario();
            // Use selectedClub region if available, ensuring fallback is handled but club should always be selected here
            const miniPartner = generateMiniGamePartner(selectedClub.region);

            setCurrentScenario(scenario);
            setCurrentPartner(miniPartner);

            setTimeout(() => {
                setHookupGameVisible(true);
            }, 300);

        } else if (roll < 0.30) {
            // 10% Chance: Love Encounter (20% - 30%)
            if (triggerEncounter) {
                const hasEncounter = triggerEncounter('club');
                if (hasEncounter) {
                    // Encounter modal will open automatically
                    return;
                }
            }
            // If encounter fails to trigger, fall through to enjoyment logic
            // (Using the same logic as below for consistency)
            const enjoymentScore = Math.floor(Math.random() * 100) + 1;
            const stressReduction = Math.ceil(enjoymentScore / 10);
            updateCore('stress', Math.max(0, core.stress - stressReduction));

            setTimeout(() => {
                setConclusionData({
                    text: selectedClub.vibeText,
                    stats: [`Stress -${stressReduction}`],
                    enjoymentScore,
                    themeColor: selectedClub.themeColor,
                    venueEmoji: selectedClub.emoji,
                    venueName: selectedClub.name
                });
                setConclusionModalVisible(true);
            }, 300);

        } else {
            // 70% Chance: Just Enjoyment (30% - 100%)
            const enjoymentScore = Math.floor(Math.random() * 100) + 1;
            const stressReduction = Math.ceil(enjoymentScore / 10); // 1 to 10

            updateCore('stress', Math.max(0, core.stress - stressReduction));

            setTimeout(() => {
                setConclusionData({
                    text: selectedClub.vibeText,
                    stats: [`Stress -${stressReduction}`],
                    enjoymentScore,
                    themeColor: selectedClub.themeColor,
                    venueEmoji: selectedClub.emoji,
                    venueName: selectedClub.name
                });
                setConclusionModalVisible(true);
            }, 300);
        }

    }, [money, totalCost, updateStats, triggerEncounter, core, attributes, updateCore, updateAttribute, selectedClub]);

    const handleHookupGameSuccess = useCallback(() => {
        setHookupGameVisible(false);

        // Success rewards
        updateCore('stress', Math.max(0, core.stress - 20));
        updateCore('happiness', Math.min(100, core.happiness + 30));
        updateAttribute('charm', Math.min(100, attributes.charm + 3));

        // Show Night End decision modal (replaces Condom Modal)
        setTimeout(() => {
            setNightEndModalVisible(true);
        }, 300);
    }, [core, attributes, updateCore, updateAttribute]);

    const handleHookupGameFail = useCallback(() => {
        setHookupGameVisible(false);

        // No rewards, just close
        setTimeout(() => {
            Alert.alert('Better Luck Next Time', 'She wasn\'t feeling the vibe. Maybe next time!');
        }, 300);
    }, []);

    const handleHookupAccept = useCallback(() => {
        setOutcomeModalVisible(false);
        setTimeout(() => {
            setNightEndModalVisible(true);
        }, 300);
    }, []);

    const handleOutcomeClose = useCallback(() => {
        setOutcomeModalVisible(false);
        setOutcomeType(null);
    }, []);

    const handleNightEndDecision = useCallback((choice: 'classy' | 'wild') => {
        setNightEndModalVisible(false);

        if (choice === 'classy') {
            const hotelCost = 2000;
            updateCore('stress', Math.max(0, core.stress - 10));

            updateStats({ money: money - hotelCost });
            setConclusionData({
                text: "You ended the night peacefully in fresh sheets. A well-deserved rest.",
                stats: ["Stress -10", "-$2,000"],
                isWild: false
            });
            setTimeout(() => setConclusionModalVisible(true), 300);

        } else {
            // WILD CALCULATION (High Risk, High Reward: Stress -25, but independent risks)
            const result = calculateWildNightOutcome(money);

            // Apply Results
            if (result.moneyLost > 0) {
                updateStats({ money: money - result.moneyLost });
            }

            if (result.healthChange !== 0) {
                updateCore('health', Math.max(0, core.health + result.healthChange));
            }

            if (result.trustChange !== 0) {
                const currentTrust = playerStore.reputation?.business || 0;
                updateReputation('business', Math.max(0, currentTrust + result.trustChange));
            }

            // Apply Stats Update (Massive Stress Relief)
            updateCore('stress', Math.max(0, core.stress + result.stressChange));

            setConclusionData({
                text: result.narrative,
                stats: result.statsDisplay,
                isWild: true
            });

            // 4. Pregnancy Risk (7%)
            if (result.triggerPregnancy) {
                setPregnancyModalVisible(true);
            }

            setTimeout(() => setConclusionModalVisible(true), 300);
        }
    }, [core, money, updateCore, updateStats]);

    const handleConclusionClose = useCallback(() => {
        setConclusionModalVisible(false);
    }, []);



    // Navigation Helper
    const goBack = useCallback(() => {
        if (isHangarOpen) {
            setIsHangarOpen(false);
            return;
        }

        switch (step) {
            case 'completed':
                // From confirmation to travel (or venue if USA)
                if (selectedClub?.region === 'USA') {
                    setStep('venue_select');
                } else {
                    setStep('travel_select');
                }
                break;
            case 'travel_select':
                setStep('venue_select');
                break;
            case 'venue_select':
                setStep('region_select');
                setSelectedRegion(null);
                break;
            case 'region_select':
                setSetupModalVisible(false);
                break;
        }
    }, [step, selectedClub, isHangarOpen]);

    return {
        // State
        setupModalVisible,
        outcomeModalVisible,
        outcomeType,
        nightEndModalVisible,
        pregnancyModalVisible,
        conclusionModalVisible,
        conclusionData,
        hookupGameVisible,
        currentScenario,
        currentPartner,
        // Multi-step flow state
        step,
        selectedRegion,
        selectedClub,
        travelCostAmount,
        travelReputationChange,
        hasPrivateJet,
        totalCost,

        // Hangar State
        isHangarOpen,
        setIsHangarOpen,
        goBack,

        // Actions
        setSetupModalVisible,
        startNightOut,
        selectRegion,
        selectVenue,
        selectTravelMethod,
        confirmNightOut,
        handleHookupAccept,
        handleOutcomeClose,
        handleNightEndDecision,
        setPregnancyModalVisible,
        setConclusionModalVisible,
        handleConclusionClose,
        handleHookupGameSuccess,
        handleHookupGameFail,
    };
};
