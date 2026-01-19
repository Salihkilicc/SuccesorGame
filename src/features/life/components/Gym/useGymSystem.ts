import { useCallback, useMemo } from 'react';
import { useStatsStore } from '../../../../core/store/useStatsStore';
import { useUserStore } from '../../../../core/store/useUserStore';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { useGameStore } from '../../../../core/store/useGameStore';
import { useGymNavigation } from './useGymNavigation';
import {
    GymViewType, BodyType, MembershipTier, MartialArtStyle, BeltRank, TrainerTier, WorkoutType, SupplementType,
    GymStats, GymMartialArts, GymInventory,
    BELT_TITLES, MEMBERSHIP_PRICING, TRAINER_MULTIPLIERS, FATIGUE_CONSTANTS
} from './gymData';

// RE-EXPORT Types for Consumption by Components
export type {
    GymViewType, BodyType, MembershipTier, MartialArtStyle, BeltRank, TrainerTier, WorkoutType, SupplementType, GymStats, GymMartialArts, GymInventory
};
export { BELT_TITLES, MEMBERSHIP_PRICING, TRAINER_MULTIPLIERS };

/**
 * GYM LOGIC HOOK
 * 
 * Pure business logic for the Gym System.
 * Delegates UI state to useGymNavigation.
 * Delegates constants/types to gymData.
 */
export const useGymSystem = () => {
    // --- Store Access ---
    const { money, spendMoney } = useStatsStore();
    const { gymState, updateGymState } = useUserStore();
    const { attributes, core, updateAttribute, updateCore } = usePlayerStore();
    const { currentMonth } = useGameStore();
    const nav = useGymNavigation();

    // --- Computed State ---
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    const strength = attributes.strength || 0;
    const fatigue = gymState.combatStrength || 0;
    const gymMastery = gymState.gymStatus || 0;
    const trainerId = (gymState.trainerId || 'none') as TrainerTier;

    // Body Type
    const bodyType: BodyType = useMemo(() => {
        if (strength < 25) return 'Skinny';
        if (strength < 50) return 'Fit';
        if (strength < 90) return 'Muscular';
        return 'Godlike';
    }, [strength]);

    // Data Objects
    const martialArts: GymMartialArts = {
        style: gymState.selectedArt as MartialArtStyle | null,
        rank: ((gymState.martialArts?.[gymState.selectedArt as MartialArtStyle] || 0) as BeltRank),
        progress: gymState.trainingCount || 0,
        lastTrainedQ: gymState.lastTrainedQuarter || 0,
        title: BELT_TITLES[((gymState.martialArts?.[gymState.selectedArt as MartialArtStyle] || 0) as BeltRank)]
    };

    const usage = gymState.supplementUsage || { protein: 0, creatine: 0, steroids: 0 };
    const inventory: GymInventory = { protein: usage.protein, creatine: usage.creatine, steroids: usage.steroids };

    // --- Actions ---

    const calculatePotentialGain = useCallback(() => 0.2 * (TRAINER_MULTIPLIERS[trainerId] || 1.0), [trainerId]);

    const trainWorkout = useCallback((type: WorkoutType) => {
        if (fatigue > FATIGUE_CONSTANTS.LIMIT) return { success: false, message: `Too fatigued (> ${FATIGUE_CONSTANTS.LIMIT}%)` };

        const gain = calculatePotentialGain();
        const charmGain = gain * 0.10;

        updateGymState({
            gymStatus: Math.min(100, gymMastery + gain),
            combatStrength: Math.min(100, fatigue + FATIGUE_CONSTANTS.WORKOUT_COST),
        });
        updateAttribute('strength', Math.min(100, strength + gain));
        updateAttribute('charm', Math.min(100, (attributes.charm || 0) + charmGain));

        return { success: true, message: `${type} Done! +${gain.toFixed(2)}%`, gains: { strength: gain, charm: charmGain } };
    }, [fatigue, gymMastery, strength, attributes.charm, calculatePotentialGain, updateGymState, updateAttribute]);

    const trainMartialArts = useCallback((style?: MartialArtStyle) => {
        const art = style || martialArts.style;
        if (!art) return { success: false, message: 'Select a style first.' };
        if (fatigue > FATIGUE_CONSTANTS.LIMIT) return { success: false, message: 'Too fatigued' };
        if (martialArts.lastTrainedQ === currentQuarter) return { success: false, message: 'Already trained this quarter.' };

        // Progression
        let nextCount = martialArts.progress + 1;
        let nextRank = martialArts.rank;
        const req = martialArts.rank === 3 ? 6 : 3;
        let promoted = false;

        if (martialArts.rank < 5 && nextCount >= req) {
            nextRank = (martialArts.rank + 1) as BeltRank;
            nextCount = 0;
            promoted = true;
        }

        updateGymState({
            combatStrength: Math.min(100, fatigue + FATIGUE_CONSTANTS.MARTIAL_ARTS_COST),
            trainingCount: nextCount,
            lastTrainedQuarter: currentQuarter,
            martialArts: { ...gymState.martialArts, [art]: nextRank }
        });
        updateAttribute('strength', Math.min(100, strength + 3));

        return {
            success: true,
            message: promoted ? `Promoted to ${BELT_TITLES[nextRank]}!` : 'Training Complete 🥋',
            newBelt: promoted ? BELT_TITLES[nextRank] : undefined
        };
    }, [martialArts, fatigue, currentQuarter, gymState, updateGymState, strength, updateAttribute]);

    const consumeSupplement = useCallback((type: SupplementType) => {
        if (inventory[type] === currentQuarter) return { success: false, message: 'Already used this quarter.' };

        if (type === 'steroids') {
            if ((core.health || 0) < 50) return { success: false, message: 'Health too low' };
            updateCore('health', Math.max(0, (core.health || 0) - 45));
            updateAttribute('strength', Math.min(100, strength + 5));
            updateGymState({ gymStatus: Math.min(100, gymMastery + 7.0) });
        }

        updateGymState({ supplementUsage: { ...usage, [type]: currentQuarter } });
        return { success: true, message: `Consumed ${type}!` };
    }, [inventory, currentQuarter, core.health, strength, gymMastery, usage, updateCore, updateAttribute, updateGymState]);

    const buyMembership = useCallback((tier: MembershipTier) => {
        const price = MEMBERSHIP_PRICING[tier].annual;
        if (tier === 'TITANIUM' && bodyType !== 'Godlike') return { success: false, message: 'Requires Godlike Body' };
        if (money < price) return { success: false, message: 'Insufficient Funds' };
        spendMoney(price);
        updateGymState({ membership: tier });
        return { success: true, message: `Joined ${tier}!` };
    }, [money, bodyType, spendMoney, updateGymState]);

    return {
        // UI & Nav (Top Level)
        isVisible: nav.isVisible,
        activeView: nav.activeView,

        // Data Group
        data: {
            stats: { fatigue, bodyType },
            martialArts,
            inventory,
            membership: gymState.membership,
            trainerId,
            currentQuarter,
        },

        // Actions Group
        actions: {
            openGym: nav.openGym,
            closeGym: nav.closeGym,
            navigate: nav.navigate,
            goBackToHub: nav.goBackToHub,
            trainWorkout,
            trainMartialArts,
            consumeSupplement,
            buyMembership,
            hireTrainer: (tier: TrainerTier) => { updateGymState({ trainerId: tier }); return { success: true, message: 'Hired' }; },
            selectArt: (style: MartialArtStyle) => updateGymState({ selectedArt: style }),
            calculatePotentialGain,
        }
    };
};
