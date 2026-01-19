import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useUserStore } from '../../../../core/store/useUserStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { useGameStore } from '../../../../core/store/useGameStore';

// ============================================================================
// 1. TYPE DEFINITIONS & CONSTANTS
// ============================================================================

export type GymViewType = 'HUB' | 'MEMBERSHIP' | 'MARTIAL_ARTS' | 'TRAINER' | 'SUPPLEMENTS' | 'WORKOUT';

export type MembershipTier = 'STANDARD' | 'TITANIUM'; // $2500 vs $50k
export type BodyType = 'Skinny' | 'Fit' | 'Muscular' | 'Godlike';
export type MartialArtStyle = 'boxing' | 'mma' | 'muaythai' | 'bjj' | 'karate';
export type BeltRank = 0 | 1 | 2 | 3 | 4 | 5; // White -> Black
export type TrainerTier = 'none' | 'rookie' | 'local' | 'influencer' | 'legend';
export type WorkoutType = 'Yoga' | 'Weights' | 'Running' | 'Pilates';
export type SupplementType = 'protein' | 'creatine' | 'steroids';

export const BELT_TITLES: Record<BeltRank, string> = {
    0: 'White Belt',
    1: 'Blue Belt',
    2: 'Purple Belt',
    3: 'Brown Belt',
    4: 'Black Belt',
    5: 'Grandmaster',
};

export const MEMBERSHIP_PRICING = {
    STANDARD: { annual: 2500, monthly: 250 },
    TITANIUM: { annual: 50000, monthly: 5000, req: 'Godlike' },
} as const;

export const TRAINER_COSTS: Record<TrainerTier, number> = {
    none: 0,
    rookie: 50,
    local: 200,
    influencer: 1000,
    legend: 10000,
};

export const TRAINER_MULTIPLIERS: Record<TrainerTier, number> = {
    none: 1.0,
    rookie: 1.1,
    local: 1.5,
    influencer: 2.5,
    legend: 5.0,
};

export const FATIGUE_LIMIT = 80;

// ============================================================================
// 2. MODAL VISIBILITY STORE (Internal)
// ============================================================================

interface GymUIState {
    isVisible: boolean;
    activeView: GymViewType;
    openGym: () => void;
    closeGym: () => void;
    navigate: (view: GymViewType) => void;
}

export const useGymUIStore = create<GymUIState>((set) => ({
    isVisible: false,
    activeView: 'HUB',
    openGym: () => set({ isVisible: true, activeView: 'HUB' }),
    closeGym: () => set({ isVisible: false }),
    navigate: (view) => set({ activeView: view }),
}));

// ============================================================================
// 3. MAIN HOOK
// ============================================================================

export const useGymSystem = () => {
    // Stores
    const { money, spendMoney, update: updateStats } = useStatsStore();
    const { gymState, updateGymState } = useUserStore();
    const { attributes, core, updateAttribute, updateCore } = usePlayerStore();
    const { currentMonth } = useGameStore();

    // UI Store
    const ui = useGymUIStore();

    // --- Computed Values ---
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    const strength = attributes.strength || 0;

    const bodyType: BodyType = useMemo(() => {
        if (strength < 25) return 'Skinny';
        if (strength < 50) return 'Fit';
        if (strength < 90) return 'Muscular';
        return 'Godlike';
    }, [strength]);

    const fatigue = gymState.combatStrength || 0;
    const membership = gymState.membership; // 'STANDARD' | 'TITANIUM' | null
    const trainerId = (gymState.trainerId || 'none') as TrainerTier;

    const selectedArt = gymState.selectedArt as MartialArtStyle | null;
    const trainingCount = gymState.trainingCount || 0;
    const lastTrainedQuarter = gymState.lastTrainedQuarter || 0;
    const gymMastery = gymState.gymStatus || 0;

    // Supplement Usage tracking
    const supplementUsage = gymState.supplementUsage || { protein: 0, creatine: 0, steroids: 0 };

    // Get current rank for selected art
    const beltRank = selectedArt
        ? ((gymState.martialArts?.[selectedArt] || 0) as BeltRank)
        : 0;

    const beltTitle = BELT_TITLES[beltRank];

    // --- Helpers ---

    const getMartialArtsLabel = useCallback(() => {
        if (!selectedArt) return 'Martial Arts';
        return `${selectedArt.toUpperCase()} 🥊`;
    }, [selectedArt]);

    const getMartialArtsButtonLabel = getMartialArtsLabel;

    const calculatePotentialGain = useCallback(() => {
        const baseGain = 0.2; // REDUCED from 0.5
        const multiplier = TRAINER_MULTIPLIERS[trainerId] || 1.0;
        return baseGain * multiplier;
    }, [trainerId]);

    // --- Actions ---

    const selectArt = useCallback((style: MartialArtStyle) => {
        updateGymState({ selectedArt: style });
        // Initialize if empty
        if (gymState.martialArts?.[style] === undefined) {
            updateGymState({
                martialArts: { ...gymState.martialArts, [style]: 0 }
            });
        }
    }, [gymState, updateGymState]);

    const trainMartialArts = useCallback((style?: MartialArtStyle) => {
        const artToTrain = style || selectedArt;

        if (!artToTrain) return { success: false, message: 'Select a style first.' };
        if (fatigue > FATIGUE_LIMIT) return { success: false, message: 'Too fatigued (>80%)' };
        if (lastTrainedQuarter === currentQuarter) return { success: false, message: 'Already trained this quarter.' };

        const newFatigue = Math.min(100, fatigue + 45);

        // Progression
        let nextCount = trainingCount + 1;
        let nextRank = beltRank;
        const currentArtRank = (gymState.martialArts?.[artToTrain] || 0) as BeltRank;

        const req = currentArtRank === 3 ? 6 : 3;
        let promoted = false;

        if (currentArtRank < 5 && nextCount >= req) {
            nextRank = (currentArtRank + 1) as BeltRank;
            nextCount = 0;
            promoted = true;
        } else {
            nextRank = currentArtRank;
        }

        updateGymState({
            combatStrength: newFatigue,
            trainingCount: nextCount,
            lastTrainedQuarter: currentQuarter,
            martialArts: {
                ...gymState.martialArts,
                [artToTrain]: nextRank
            }
        });

        updateAttribute('strength', Math.min(100, strength + 3));

        return {
            success: true,
            newBelt: promoted ? BELT_TITLES[nextRank] : undefined,
            newRank: nextRank,
            message: promoted ? `Promoted to ${BELT_TITLES[nextRank]}!` : 'Training Complete'
        };

    }, [fatigue, selectedArt, lastTrainedQuarter, currentQuarter, trainingCount, beltRank, gymState, updateGymState, strength, updateAttribute]);

    const trainWorkout = useCallback((type: WorkoutType) => {
        if (fatigue > FATIGUE_LIMIT) return { success: false, message: 'Too fatigued (Must be < 80%)' };

        const gain = calculatePotentialGain();

        // Stats Affected: Strength and GymMastery = Gain. Charm = 10% of Gain.
        const charmGain = gain * 0.10;

        const newMastery = Math.min(100, gymMastery + gain);
        const newFatigue = Math.min(100, fatigue + 15);

        // Apply Updates
        updateGymState({
            gymStatus: newMastery,
            combatStrength: newFatigue,
        });

        // Update Stats
        updateAttribute('strength', Math.min(100, strength + gain));
        updateAttribute('charm', Math.min(100, (attributes.charm || 0) + charmGain)); // NEW: Charm Gain

        // Trainer Health Bonus (small perk to keep trainer relevant for health)
        // Original logic had specific bonuses, but request implies strict simplified formula.
        // "Strength += actualGain".
        // Use existing health bonus logic? Request says "Stats Affected: Strength, GymMastery, Charm". 
        // It does NOT mention Health. I will remove health gain to strictly follow request.

        return {
            success: true,
            message: `${type} Complete! Mastery +${gain.toFixed(2)}%`,
            gains: { mastery: gain, strength: gain, charm: charmGain }
        };
    }, [fatigue, trainerId, gymMastery, calculatePotentialGain, updateGymState, updateAttribute, strength, attributes.charm]);


    const buyMembership = useCallback((tier: MembershipTier) => {
        const price = MEMBERSHIP_PRICING[tier].annual;
        if (tier === 'TITANIUM' && bodyType !== 'Godlike') {
            return { success: false, message: 'Requires Godlike Body' };
        }
        if (money < price) return { success: false, message: 'Insufficient Funds' };

        spendMoney(price);
        updateGymState({ membership: tier });
        return { success: true, message: `Joined ${tier} Membership!` };
    }, [money, bodyType, spendMoney, updateGymState]);

    const hireTrainer = useCallback((tier: TrainerTier) => {
        updateGymState({ trainerId: tier });
        return { success: true, message: 'Trainer Hired' };
    }, [updateGymState]);

    // --- Consumable Supplement Logic ---
    const consumeSupplement = useCallback((type: SupplementType) => {
        // Init usage if undefined (safe check)
        const usage = gymState.supplementUsage || { protein: 0, creatine: 0, steroids: 0 };

        // Check if already used this quarter
        if (usage[type] === currentQuarter) {
            return { success: false, message: `Already used ${type} this quarter.` };
        }

        let masteryGain = 0;
        let healthCost = 0;
        let strengthGain = 0;

        if (type === 'steroids') {
            masteryGain = 7.0; // Massive Gain
            healthCost = 45;   // Massive Damage
            strengthGain = 5;
        } else {
            // Protein & Creatine: NO STAT GAINS strictly as requested.
            masteryGain = 0;
            healthCost = 0;
            strengthGain = 0;
        }

        // Safety Valve for Steroids
        if (type === 'steroids' && (core.health || 0) < 50) {
            return { success: false, message: 'Health too low for steroids! (Need > 50)' };
        }

        // Apply Logic
        const newMastery = Math.min(100, gymMastery + masteryGain);
        const newHealth = Math.max(0, (core.health || 0) - healthCost); // Clamp at 0
        const newStrength = Math.min(100, strength + strengthGain);

        // Update State
        updateGymState({
            gymStatus: newMastery,
            supplementUsage: {
                ...usage,
                [type]: currentQuarter
            }
        });

        if (healthCost > 0) updateCore('health', newHealth);
        if (strengthGain > 0) updateAttribute('strength', newStrength);

        return {
            success: true,
            message: `Consumed ${type}!`,
            effects: { mastery: masteryGain, health: -healthCost }
        };

    }, [gymState, currentQuarter, gymMastery, core.health, strength, updateGymState, updateCore, updateAttribute]);

    return {
        // State (Single Modal Architecture)
        isVisible: ui.isVisible,
        activeView: ui.activeView,

        // Actions
        openGym: ui.openGym,
        closeGym: ui.closeGym,
        navigate: ui.navigate,
        goBackToHub: () => ui.navigate('HUB'), // Logic Alias as requested

        // Convenience wrappers (Component Compatibility)
        openMartialArts: () => ui.navigate('MARTIAL_ARTS'),
        openTrainer: () => ui.navigate('TRAINER'),
        openMembership: () => ui.navigate('MEMBERSHIP'),
        openSupplements: () => ui.navigate('SUPPLEMENTS'),
        openWorkout: () => ui.navigate('WORKOUT'),

        // Data
        membership,
        bodyType,
        fatigue,
        selectedArt,
        beltRank,
        beltTitle,
        trainingCount,
        lastTrainedQuarter,
        gymState,
        currentQuarter,
        trainerId,
        gymMastery,
        supplementUsage,

        // Constants
        BELT_TITLES,
        MEMBERSHIP_PRICING,
        TRAINER_COSTS,
        TRAINER_MULTIPLIERS,

        // Actions
        getMartialArtsLabel,
        getMartialArtsButtonLabel,
        calculatePotentialGain,
        selectArt,
        trainMartialArts,
        trainWorkout,
        buyMembership,
        hireTrainer,
        consumeSupplement,

        // Legacy/Alias for back compat if needed (but we strictly follow new API)
        exitGym: ui.closeGym
    };
};
