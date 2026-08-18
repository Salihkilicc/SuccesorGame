import { useState, useCallback } from 'react';
import { useUserStore, useStatsStore } from '../../../core/store';
import {
    PartnerProfile,
    PartnerStats,
    Ethnicity,
    SocialClass
} from '../../../data/relationshipTypes';
import { Partner } from '../types';
import { generatePartner } from '../logic/partnerGenerator';
import { ENCOUNTER_DATA, EncounterScenario } from '../data/encounterData';

// --- Constants ---
const ETHNICITIES: Ethnicity[] = [
    'Caucasian', 'Latina', 'EastAsian', 'SouthAsian', 'MiddleEastern',
    'Slavic', 'Scandinavian', 'Mediterranean', 'AfricanAmerican',
    'Caribbean', 'RoyalEuropean', 'PacificIslander', 'Mixed'
];

const SOCIAL_CLASSES: SocialClass[] = [
    'Underclass', 'WorkingClass', 'MiddleClass', 'HighSociety',
    'OldMoney', 'BillionaireHeir', 'Royalty', 'CriminalElite'
];

// --- Helper: Weighted Random ---
const getRandomWeighted = <T>(items: T[], weights: number[]): T => {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) return items[i];
        random -= weights[i];
    }
    return items[0];
};

// --- Helper: Convert Deep Persona Partner to PartnerProfile for backward compatibility ---
const convertToPartnerProfile = (deepPartner: Partner): PartnerProfile => {
    // Dynamic SocialClass determination based on job & tier
    let socialClass: SocialClass = 'HighSociety';

    if (deepPartner.job.id === 'dynasty_heiress' || deepPartner.job.id === 'billionaire_heir') {
        socialClass = 'BillionaireHeir';
    } else if (deepPartner.job.id === 'royal_envoy') {
        socialClass = 'Royalty';
    } else if (deepPartner.job.tier === 'CORPORATE_ELITE') {
        socialClass = 'OldMoney';
    } else if (deepPartner.job.tier === 'HIGH_SOCIETY') {
        socialClass = 'HighSociety';
    } else if (deepPartner.job.tier === 'UNDERGROUND') {
        socialClass = 'CriminalElite';
    } else if (deepPartner.job.tier === 'ARTISTIC') {
        socialClass = 'HighSociety';
    } else if (deepPartner.job.tier === 'BLUE_COLLAR') {
        socialClass = 'WorkingClass';
    } else if (deepPartner.job.tier === 'STUDENT_LIFE') {
        socialClass = 'MiddleClass';
    }

    const isTopTier = ['BillionaireHeir', 'Royalty', 'HighSociety', 'OldMoney'].includes(socialClass);

    const stats: PartnerStats = {
        ethnicity: 'RoyalEuropean' as Ethnicity,
        age: deepPartner.age,
        occupation: deepPartner.job.title,
        looks: isTopTier ? 75 + Math.floor(Math.random() * 25) : 60 + Math.floor(Math.random() * 35),
        style: isTopTier ? 'Luxury' : 'Elegant',
        socialClass,
        familyWealth: socialClass === 'BillionaireHeir' ? 95 : socialClass === 'Royalty' ? 98 : isTopTier ? 75 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 60),
        intelligence: isTopTier ? 82 + Math.floor(Math.random() * 18) : 70 + Math.floor(Math.random() * 30),
        jealousy: Math.floor(Math.random() * 70),
        crazy: Math.floor(Math.random() * 60),
        libido: 60 + Math.floor(Math.random() * 40),
        reputationBuff: socialClass === 'Royalty' ? 25 : socialClass === 'BillionaireHeir' ? 20 : isTopTier ? 15 : 5,
        financialAidChance: isTopTier ? 40 + Math.floor(Math.random() * 40) : 15,
        networkPower: isTopTier ? 80 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 40),
    };

    return {
        id: deepPartner.id,
        name: deepPartner.name,
        photo: deepPartner.avatar || null,
        stats,
        love: deepPartner.stats.relationshipLevel,
        relationYears: 0,
        isMarried: deepPartner.isMarried,
        hasPrenup: deepPartner.hasPrenup,
        // Store Deep Persona data as well for access
        ...(deepPartner as any), // Include all Deep Persona fields
    };
};

export const useEncounterSystem = () => {
    const [currentScenario, setCurrentScenario] = useState<EncounterScenario | null>(null);
    const [candidate, setCandidate] = useState<PartnerProfile | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

    const { partner, setPartner, breakUp } = useUserStore();

    // --- 1. Smart NPC Generator (Now uses Deep Persona System) ---
    const generateSmartCandidate = useCallback((context: string, countryId?: string): PartnerProfile => {
        // Generate using Deep Persona System
        const deepPartner = generatePartner();

        // Convert to PartnerProfile format for backward compatibility
        const partnerProfile = convertToPartnerProfile(deepPartner);

        console.log('[Deep Persona] Generated partner:', {
            name: deepPartner.name,
            job: deepPartner.job.title,
            tier: deepPartner.job.tier,
            personality: deepPartner.personality.label,
            monthlyCost: deepPartner.finances.monthlyCost
        });

        return partnerProfile;

    }, []);

    // --- 2. Trigger Encounter ---
    const triggerEncounter = useCallback((context: string, countryId?: string, autoShow: boolean = true): { candidate: PartnerProfile, scenario: EncounterScenario } | null => {
        // 0. Probability Check (Internal)
        let chance = 10; // Default 10% (Generic passive background)

        switch (context) {
            case 'VIP_LOUNGE':
            case 'GALA':
            case 'DIRECT':
            case 'profile':
                chance = 100; // 100% Guaranteed - Explicit user action to find a partner
                break;
            case 'gym':
            case 'shopping':
                chance = 5; // Very Rare - Passive gameplay interruptions
                break;
            case 'club':
                chance = 50; // High - Socializing is the point
                break;
            case 'travel':
                chance = 60; // Very High - Vacation romance
                break;
        }

        if (context === 'travel' || countryId) {
            chance = 60; // Very High - Vacation romance
        }

        const roll = Math.random() * 100;
        console.log(`[Encounter] Context: ${context}, Chance: ${chance}%, Roll: ${roll.toFixed(1)}`);

        if (roll > chance) {
            return null;
        }

        // 1. Select Scenario List
        let scenarios = ENCOUNTER_DATA['generic'];

        // Priority: Country -> Context -> Generic
        if (countryId && ENCOUNTER_DATA[`travel_${countryId}`]) {
            scenarios = ENCOUNTER_DATA[`travel_${countryId}`];
        } else if (ENCOUNTER_DATA[context]) {
            scenarios = ENCOUNTER_DATA[context];
        } else if (ENCOUNTER_DATA['VIP_LOUNGE']) {
            scenarios = ENCOUNTER_DATA['VIP_LOUNGE'];
        }

        // 2. Pick Random Scenario
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // 3. Generate Candidate
        const newCandidate = generateSmartCandidate(context, countryId);

        // 4. Update State
        if (autoShow) {
            setCurrentScenario(scenario);
            setCandidate(newCandidate);
            setIsVisible(true);
        }

        return { candidate: newCandidate, scenario }; // Interaction Started!
    }, [generateSmartCandidate]);

    // --- 3. Handle Date Action ---
    const handleDate = useCallback(() => {
        if (!candidate) return { success: false, wasCaught: false, settlement: 0 };

        let wasCaught = false;
        let settlement = 0;

        // A. Cheating Logic
        if (partner) {
            const oldPartnerName = partner.name;
            const statsStore = useStatsStore.getState();
            const currentMoney = statsStore.money;

            // Calculate potential settlement
            if (partner.isMarried && !partner.hasPrenup) {
                settlement = currentMoney * 0.5;
            }

            // 50% chance of being caught immediately if partner is jealous.
            // But if MARRIED -> 100% chance (High Stakes)
            let catchChance = partner.stats.jealousy > 70 ? 50 : 10;
            if (partner.isMarried) {
                catchChance = 100;
                console.log('🚨 MARRIED PARTNER, 100% CATCH RATE ACTIVATED');
            }

            console.log(`🎲 Catch Probability: ${catchChance}% | isMarried: ${partner.isMarried} | Jealousy: ${partner.stats.jealousy}`);

            const roll = Math.random() * 100;
            console.log(`🎲 Roll: ${roll.toFixed(2)} vs ${catchChance}`);

            if (roll < catchChance) {
                wasCaught = true;
                console.log('💔 CAUGHT! Breaking up with reason: cheated');
                breakUp('cheated');
            } else {
                console.log('😌 Not caught. Silent breakup (drifted)');
                breakUp('drifted');
            }

            // Set consequence state to trigger modal (regardless of caught/drifted)
            // Using setTimeout to allow EncounterModal to close properly before showing BreakupModal
            console.log('⏳ Delaying Modal Trigger...');
            setTimeout(() => {
                console.log('🚨 SETTING BREAKUP CONSEQUENCE STATE NOW:', { wasCaught, oldPartnerName });
                setCheatingConsequence({
                    settlement: wasCaught ? settlement : 0,
                    partnerName: oldPartnerName
                });
            }, 600);
        }

        // B. Start New Relationship
        setPartner(candidate);
        setIsVisible(false);

        return {
            success: true,
            message: `You started dating ${candidate.name}!`,
            wasCaught,
            settlement,
            breakupOccurred: !!partner // true if we had a partner before
        };

    }, [candidate, partner, breakUp, setPartner]);

    const closeEncounter = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Helper to get potential cheating consequence without executing
    const getCheatingConsequence = useCallback(() => {
        if (!partner) return 0;
        if (!partner.isMarried || partner.hasPrenup) return 0;

        const statsStore = useStatsStore.getState();
        return statsStore.money * 0.5;
    }, [partner]);

    // Clear cheating consequence state (for modal close)
    const clearConsequence = useCallback(() => {
        setCheatingConsequence(null);
    }, []);


    return {
        isVisible,
        currentScenario,
        candidate,
        triggerEncounter,
        handleDate,
        closeEncounter,
        getCheatingConsequence,
        cheatingConsequence,
        clearConsequence
    };
};
