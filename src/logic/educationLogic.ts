import { EDUCATION_DATA } from '../features/education/data/educationData';
import { PlayerState } from '../core/store/usePlayerStore';
import { EducationItem } from '../features/education/educationTypes';

/**
 * Checks if a player can enroll in a specific education program.
 */
export const canEnroll = (
    params: {
        completedEducations: string[];
        activeProgramId?: string;
        money: number;
    },
    programId: string
): { success: boolean; reason?: string; costToPay?: number } => {
    const { completedEducations, activeProgramId, money } = params;
    const program = EDUCATION_DATA.find((p) => p.id === programId);

    if (!program) {
        return { success: false, reason: 'Program not found.' };
    }

    // 1. Check Already Completed/Enrolled
    if (completedEducations.includes(programId)) {
        return { success: false, reason: 'Already completed this program.' };
    }
    if (activeProgramId === programId) {
        return { success: false, reason: 'Already enrolled.' };
    }

    // 2. Check Money
    const costToPay = program.isMonthlyCost ? program.cost * 3 : program.cost;

    if (money < costToPay) {
        return { success: false, reason: `Insufficient funds. Need $${costToPay.toLocaleString()}.` };
    }

    // 3. Check Prerequisite Degree
    if (program.requirements.requiredDegreeId) {
        const hasDegree = completedEducations.includes(program.requirements.requiredDegreeId);
        if (!hasDegree) {
            // Find name of required degree
            const reqProgram = EDUCATION_DATA.find(p => p.id === program.requirements.requiredDegreeId);
            const reqName = reqProgram ? reqProgram.title : program.requirements.requiredDegreeId;
            return { success: false, reason: `Prerequisite: ${reqName}` };
        }
    }

    return { success: true, costToPay };
};

export type EducationResult = {
    status: 'in_progress' | 'graduated';
    message: string;
    progressChange?: number;
};

/**
 * Advances the active education program by one quarter.
 */
export const advanceEducation = (
    activeProgram: { programId: string; currentYear: number; progress: number },
    bonusProgressMultiplier: number = 1.0 // 1.0 normal, 1.25 study hard etc.
): EducationResult => {
    const program = EDUCATION_DATA.find(p => p.id === activeProgram.programId);

    if (!program) {
        return { status: 'in_progress', message: 'Error: Program data not found.' };
    }

    // Calculate raw progress increment based on Duration
    // If duration is 16 quarters, each quarter is 100/16 = 6.25%
    const baseProgress = 100 / program.durationQuarter;
    const actualProgress = baseProgress * bonusProgressMultiplier;

    const newProgress = activeProgram.progress + actualProgress;

    if (newProgress >= 100) {
        return {
            status: 'graduated',
            message: `Congratulations! You have completed ${program.title}!`,
        };
    }

    return {
        status: 'in_progress',
        message: 'You made progress in your studies.',
        progressChange: actualProgress
    };
};

/**
 * Helper: Get stat reward. 
 * Since new data system has explicit 'benefits', we can use that to determine rewards.
 * But benefits are usually "Permanent Buffs" on graduation.
 * Intermediate "Study" rewards might just be small Intellect bumps.
 */
export const getQuarterlyStudyReward = (programId: string): { stat: string; amount: number } | undefined => {
    const program = EDUCATION_DATA.find(p => p.id === programId);
    if (!program) return undefined;

    // Award small fraction of the total benefit?
    // Or just generic logic:
    return { stat: 'intellect', amount: 1 };
};

/**
 * Applies the benefits of a graduated program to the player's stats.
 */
export const applyGraduationBuffs = (
    programId: string,
    updateAttribute: (key: any, value: number) => void,
    updateReputation: (key: any, value: number) => void,
    currentAttributes: any,
    currentReputation: any
) => {
    const program = EDUCATION_DATA.find(p => p.id === programId);
    if (!program) return;

    // Apply Intelligence Bonus
    if (program.benefits.intelligenceBonus) {
        const currentIntel = currentAttributes.intellect || 0;
        updateAttribute('intellect', currentIntel + program.benefits.intelligenceBonus);
    }
};
