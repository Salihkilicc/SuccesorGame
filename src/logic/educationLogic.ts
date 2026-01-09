import { EDUCATION_DATA } from '../data/educationData';
import { PlayerState } from '../core/store/usePlayerStore';

/**
 * Checks if a player can enroll in a specific education program.
 * @param player The current player state (for attributes and previous education).
 * @param currentMoney The player's current money (from useStatsStore).
 * @param programId The ID of the program to enroll in.
 * @returns { success: boolean; reason?: string }
 */
export const canEnroll = (
    player: PlayerState,
    currentMoney: number,
    programId: string
): { success: boolean; reason?: string } => {
    // 1. Find the program
    const allPrograms = [
        ...EDUCATION_DATA.degrees,
        ...EDUCATION_DATA.postgrad,
        ...EDUCATION_DATA.certificates,
    ];
    const program = allPrograms.find((p) => p.id === programId);

    if (!program) {
        return { success: false, reason: 'Program not found.' };
    }

    // 2. Check Money
    if (currentMoney < program.costPerYear) {
        return { success: false, reason: 'Insufficient funds.' };
    }

    // 3. Check Intellect
    if (player.attributes.intellect < program.reqIntellect) {
        return { success: false, reason: `Intellect too low (Required: ${program.reqIntellect}).` };
    }

    // 4. Check Prerequisites
    if (program.prerequisite) {
        // Generic check for "Any Bachelor Degree"
        if (program.prerequisite === 'Any Bachelor Degree') {
            const hasDegree = player.education.completedEducation.some(id =>
                EDUCATION_DATA.degrees.some(d => d.id === id)
            );
            if (!hasDegree) {
                return { success: false, reason: 'Requires any Bachelor Degree.' };
            }
        }
        else if (program.prerequisite === 'Master Degree or Medicine') {
            // Check for specific high level degrees
            const hasMaster = player.education.completedEducation.some(id =>
                id === 'mba' || id === 'md_medicine' // Assuming MBA is master level for logic simplicity here
            );
            if (!hasMaster) {
                return { success: false, reason: 'Requires a Master Degree or MD.' };
            }
        }
        else {
            const hasPrerequisite = player.education.completedEducation.includes(program.prerequisite);
            if (!hasPrerequisite) {
                const prereqProgram = allPrograms.find((p) => p.id === program.prerequisite);
                const prereqName = prereqProgram ? prereqProgram.name : program.prerequisite;
                return { success: false, reason: `Prerequisite missing: ${prereqName}` };
            }
        }
    }

    // 5. Check already completed or enrolled
    if (player.education.completedEducation.includes(programId)) {
        return { success: false, reason: 'You have already completed this program.' };
    }
    if (player.education.activeEnrollment?.programId === programId) {
        return { success: false, reason: 'You are already enrolled in this program.' };
    }

    return { success: true };
};

// --- ADVANCEMENT LOGIC ---

export type EducationResult = {
    status: 'in_progress' | 'year_complete' | 'graduated';
    message: string;
    statReward?: { stat: string; amount: number };
    newProgress?: number;
    newYear?: number;
};

/**
 * Advances the active education program by one quarter.
 * @param activeProgram The player's active program state.
 * @returns EducationResult identifying what happened (progress, year up, or graduation).
 */
export const advanceEducation = (
    activeProgram: { programId: string; currentYear: number; progress: number },
    bonusProgress: number = 0 // Extra progress from "Study Hard"
): EducationResult => {
    // 1. Find Data
    const allPrograms = [
        ...EDUCATION_DATA.degrees,
        ...EDUCATION_DATA.postgrad,
        ...EDUCATION_DATA.certificates,
    ];
    const programData = allPrograms.find(p => p.id === activeProgram.programId);

    if (!programData) {
        return { status: 'in_progress', message: 'Error: Program data not found.' };
    }

    // 2. Calculate Progress Increment
    // 4 Quarters = 1 Year. So 1 Quarter = 25% of a year (if year based).
    // HOWEVER: Store treats 'progress' as annual progress (0-100%).
    // So +25% progress per quarter is correct for 1 year = 100%.
    const progressIncrement = 25 + bonusProgress;
    let newProgress = activeProgram.progress + progressIncrement;

    // 3. Check for Year Completion
    if (newProgress >= 100) {
        // Year Completed!
        const nextYear = activeProgram.currentYear + 1;

        // Check for Graduation
        if (activeProgram.currentYear >= programData.durationYears) {
            // GRADUATION
            return {
                status: 'graduated',
                message: `Congratulations! You have graduated from ${programData.name}!`,
                // Graduation might also give a final large buff, but for now we rely on the catalog's 'Graduation Buffs' applied externally.
                // The 'Yearly Boost' logic below applies to INTERMEDIATE years.
            };
        } else {
            // YEAR UP
            // Determine Stat Reward
            const statReward = getYearlyStatReward(programData);

            return {
                status: 'year_complete',
                message: `You completed Year ${activeProgram.currentYear} of ${programData.name}.`,
                statReward,
                newProgress: 0, // Reset progress for next year
                newYear: nextYear
            };
        }
    }

    // Normal Progress
    return {
        status: 'in_progress',
        message: 'Studied hard this quarter.',
        newProgress
    };
};

/**
 * Helper to determine which stat to boost (+10) automatically upon year completion.
 */
const getYearlyStatReward = (program: any): { stat: string; amount: number } | undefined => {
    if (!program.buffs || !program.buffs.statBoost) return undefined;

    const stats = program.buffs.statBoost;
    // Priority: Intellect -> Charm -> Looks -> Strength -> Health -> First Key
    if (stats.intellect) return { stat: 'intellect', amount: 10 };
    if (stats.charm) return { stat: 'charm', amount: 10 };
    if (stats.looks) return { stat: 'looks', amount: 10 };
    if (stats.strength) return { stat: 'strength', amount: 10 };
    if (stats.health) return { stat: 'health', amount: 10 };

    // Fallback: take first key
    const distinctKeys = Object.keys(stats).filter(k => k !== 'salaryMultiplier');
    if (distinctKeys.length > 0) {
        return { stat: distinctKeys[0], amount: 10 };
    }
    return undefined;
};

/**
 * Applies the graduation buffs to the player.
 * @param programId The ID of the program graduated from.
 * @param updateAttribute Callback to update player attributes.
 * @param updateReputation Callback to update player reputation.
 * @returns The applied buffs for display purposes.
 */
export const applyGraduationBuffs = (
    programId: string,
    updateAttribute: (key: any, value: number) => void,
    updateReputation: (key: any, value: number) => void,
    currentAttributes: { intellect: number; charm: number; looks: number; strength: number },
    currentReputation: { social: number; street: number; business: number; police: number }
) => {
    const allPrograms = [
        ...EDUCATION_DATA.degrees,
        ...EDUCATION_DATA.postgrad,
        ...EDUCATION_DATA.certificates,
    ];
    const program = allPrograms.find((p) => p.id === programId);

    if (!program || !program.buffs) return null;

    const { buffs } = program;

    // Apply Stat Boosts
    if (buffs.statBoost) {
        if (buffs.statBoost.intellect) {
            updateAttribute('intellect', currentAttributes.intellect + buffs.statBoost.intellect);
        }
        if (buffs.statBoost.charm) {
            updateAttribute('charm', currentAttributes.charm + buffs.statBoost.charm);
        }
        if (buffs.statBoost.looks) {
            updateAttribute('looks', currentAttributes.looks + buffs.statBoost.looks);
        }
        if (buffs.statBoost.strength) {
            updateAttribute('strength', currentAttributes.strength + buffs.statBoost.strength);
        }
        // Health is usually core stat, handled separately if passed, but updateAttribute typically handles attributes.
        // If updateAttribute accepts 'health', good. If not, player store logic needs to handle it.
        // For strict typing, we assume updateAttribute handles Attributes. 
    }

    return buffs;
};
