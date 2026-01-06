import { useState, useCallback } from 'react';
import { useUserStore, useStatsStore } from '../../store';
import {
    PartnerProfile,
    PartnerStats,
    Ethnicity,
    SocialClass
} from '../../data/relationshipTypes';
import { ENCOUNTER_DATA, EncounterScenario } from './data/encounterData';
import { NAME_DATABASE } from './data/nameData';

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

const OCCUPATIONS = [
    'Doctor', 'Lawyer', 'Artist', 'Engineer', 'Entrepreneur', 'Model',
    'Teacher', 'Chef', 'Athlete', 'Writer', 'Musician', 'Student',
    'Architect', 'Influencer', 'Scientist', 'CEO'
];

const STYLES = ['Elegant', 'Casual', 'Goth', 'Business', 'Sporty', 'Luxury', 'Bohemian'] as const;

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

export const useEncounterSystem = () => {
    const [currentScenario, setCurrentScenario] = useState<EncounterScenario | null>(null);
    const [candidate, setCandidate] = useState<PartnerProfile | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [cheatingConsequence, setCheatingConsequence] = useState<{ settlement: number; partnerName: string } | null>(null);

    const { partner, setPartner, breakUp } = useUserStore();

    // --- 1. Smart NPC Generator ---
    const generateSmartCandidate = useCallback((context: string, countryId?: string): PartnerProfile => {
        // 1. Determine Ethnicity Weights
        let ethWeights = new Array(ETHNICITIES.length).fill(1); // Base weight

        // Country Logic
        if (countryId === 'japan') {
            const asianIndex = ETHNICITIES.indexOf('EastAsian');
            if (asianIndex !== -1) ethWeights[asianIndex] = 15; // Heavy weight for local
        } else if (countryId === 'dubai') {
            const meIndex = ETHNICITIES.indexOf('MiddleEastern');
            if (meIndex !== -1) ethWeights[meIndex] = 10;
            const saIndex = ETHNICITIES.indexOf('SouthAsian');
            if (saIndex !== -1) ethWeights[saIndex] = 5;
        } else if (countryId === 'france') {
            const medIndex = ETHNICITIES.indexOf('Mediterranean');
            if (medIndex !== -1) ethWeights[medIndex] = 5;
            const cauIndex = ETHNICITIES.indexOf('Caucasian');
            if (cauIndex !== -1) ethWeights[cauIndex] = 5;
        }

        const ethnicity = getRandomWeighted(ETHNICITIES, ethWeights);

        // 2. Determine Social Class Weights
        let classWeights = [1, 5, 10, 3, 1, 0.5, 0.1, 0.5]; // Default curve (heavy MiddleClass)
        // Indexes: Under(0), Working(1), Middle(2), High(3), Old(4), Heir(5), Royal(6), Criminal(7)

        if (context === 'travel_dubai' || countryId === 'dubai') {
            classWeights = [0.1, 1, 3, 8, 5, 5, 2, 1]; // Very rich
        } else if (context === 'club') {
            classWeights[3] += 5; // HighSociety
            classWeights[5] += 2; // Heir
            classWeights[7] += 2; // CriminalElite
        }

        const socialClass = getRandomWeighted(SOCIAL_CLASSES, classWeights);

        // 3. Determine Looks & Stats
        let minLooks = 40;
        let maxLooks = 90;

        if (context === 'gym') {
            minLooks = 70; // Fit people
            maxLooks = 100;
        } else if (countryId === 'france' || context === 'travel_france') {
            minLooks = 60; // Stylish
        }

        const looks = Math.floor(Math.random() * (maxLooks - minLooks + 1)) + minLooks;

        // 4. Generate Stats Matrix
        const stats: PartnerStats = {
            ethnicity,
            age: 18 + Math.floor(Math.random() * 20),
            occupation: OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)],

            looks,
            style: STYLES[Math.floor(Math.random() * STYLES.length)],

            socialClass,
            familyWealth: socialClass === 'BillionaireHeir' ? 90 + Math.random() * 10 : Math.random() * 100,

            intelligence: Math.random() * 100,
            jealousy: Math.random() * 100,
            crazy: Math.random() * 100,
            libido: Math.random() * 100,

            reputationBuff: socialClass === 'Royalty' ? 50 : (Math.random() * 20 - 5),
            financialAidChance: Math.random() * 100,
            networkPower: Math.random() * 100,
        };

        // 5. Generate Name
        const nameSet = NAME_DATABASE[ethnicity] || NAME_DATABASE['Caucasian'];
        const firstName = nameSet.first[Math.floor(Math.random() * nameSet.first.length)];
        const lastName = nameSet.last[Math.floor(Math.random() * nameSet.last.length)];
        const fullName = `${firstName} ${lastName}`;

        // 6. Create Profile
        return {
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: fullName,
            photo: null, // Placeholder for future AI Generation
            stats,
            love: looks > 80 ? 50 : 30, // Initial interest
            relationYears: 0,
            isMarried: false,
            hasPrenup: false,
        };

    }, []);

    // --- 2. Trigger Encounter ---
    const triggerEncounter = useCallback((context: string, countryId?: string): boolean => {
        // 0. Probability Check (Internal)
        let chance = 40; // Default 40%
        if (context === 'gym') chance = 60;
        if (context === 'club') chance = 50;
        if (context === 'travel' || countryId) chance = 70;

        const isSuccess = Math.random() * 100 < chance;

        if (!isSuccess) {
            return false;
        }

        // 1. Select Scenario List
        let scenarios = ENCOUNTER_DATA['generic'];

        // Priority: Country -> Context -> Generic
        if (countryId && ENCOUNTER_DATA[`travel_${countryId}`]) {
            scenarios = ENCOUNTER_DATA[`travel_${countryId}`];
        } else if (ENCOUNTER_DATA[context]) {
            scenarios = ENCOUNTER_DATA[context];
        }

        // 2. Pick Random Scenario
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // 3. Generate Candidate
        const newCandidate = generateSmartCandidate(context, countryId);

        // 4. Update State
        setCurrentScenario(scenario);
        setCandidate(newCandidate);
        setIsVisible(true);

        return true; // Interaction Started!
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
                console.log('🚨 MARRIED PARTNER - 100% CATCH RATE ACTIVATED');
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
