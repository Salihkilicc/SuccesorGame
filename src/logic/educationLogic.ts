import { EDUCATION_DATA } from '../data/educationData';
import { PlayerState } from '../store/usePlayerStore';

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
        const hasPrerequisite = player.education.completedEducation.includes(program.prerequisite);
        if (!hasPrerequisite) {
            // Find prerequisite name for better error message
            const prereqProgram = allPrograms.find((p) => p.id === program.prerequisite);
            const prereqName = prereqProgram ? prereqProgram.name : program.prerequisite;
            return { success: false, reason: `Prerequisite missing: ${prereqName}` };
        }
    }

    // 5. Check already completed or enrolled (Optional but good UX)
    if (player.education.completedEducation.includes(programId)) {
        return { success: false, reason: 'You have already completed this program.' };
    }
    if (player.education.activeEnrollment?.programId === programId) {
        return { success: false, reason: 'You are already enrolled in this program.' };
    }

    return { success: true };
};

/**
 * Calculates how much progress is made when the 'Study' action is taken.
 * @param intellect The player's intellect attribute.
 * @returns The amount of progress to add.
 */
export const calculateStudyProgress = (intellect: number): number => {
    // Formula: Base(5) + (Intellect * 0.2)
    return 5 + (intellect * 0.2);
};

// 2. Yearly Boost Logic
export type EducationAdvanceResult =
    | { type: 'continue' }
    | { type: 'advance_year'; nextYear: number; yearlyBoost?: { stat: string; amount: number } }
    | { type: 'graduate' };

/**
 * Determines the next state of education based on current progress.
 * @param currentEnrollment The player's current enrollment state.
 * @param durationYears The total duration of the program.
 * @param programId Optional program ID to calculate yearly boost.
 * @returns The result of the advancement check (continue, year up, or graduate).
 */
export const advanceEducationState = (
    currentEnrollment: { currentYear: number; progress: number; programId?: string },
    durationYears: number
): EducationAdvanceResult => {
    if (currentEnrollment.progress < 100) {
        return { type: 'continue' };
    }

    // Progress >= 100, so we either advance year or graduate
    if (currentEnrollment.currentYear < durationYears) {
        // Calculate Yearly Boost
        let yearlyBoost;
        if (currentEnrollment.programId) {
            const allPrograms = [
                ...EDUCATION_DATA.degrees,
                ...EDUCATION_DATA.postgrad,
                ...EDUCATION_DATA.certificates,
            ];
            const program = allPrograms.find(p => p.id === currentEnrollment.programId);
            if (program && program.buffs && program.buffs.statBoost) {
                // Rule: +10 stat per year based on major
                // We pick the highest boosted stat or primary stat of the major
                const stats = program.buffs.statBoost;
                // Simple logic: Pick intellect if present, else charm, else first available
                if (stats.intellect) yearlyBoost = { stat: 'intellect', amount: 10 };
                else if (stats.charm) yearlyBoost = { stat: 'charm', amount: 10 };
                else if (stats.looks) yearlyBoost = { stat: 'looks', amount: 10 };
                else if (stats.strength) yearlyBoost = { stat: 'strength', amount: 10 };
                else {
                    const firstKey = Object.keys(stats)[0];
                    if (firstKey) yearlyBoost = { stat: firstKey, amount: 10 };
                }
            }
        }

        return {
            type: 'advance_year',
            nextYear: currentEnrollment.currentYear + 1,
            yearlyBoost
        };
    } else {
        return { type: 'graduate' };
    }
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
    updateAttribute: (key: any, value: number) => void, // using 'any' for keys to avoid strict circular type deps if simpler, but ideally matching PlayerState keys
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
        // Add other stats if they appear in data (e.g. charm?)
    }

    // NOTE: Salary Multiplier is handled by the career system checking completedEducation, 
    // so we don't apply it to a simple state number here usually, unless there's a specific 'salaryMultiplier' stat in store.
    // The prompt says "salaryMultiplier: (Bunu daha sonra meslek sisteminde kullanacağız, şimdilik store'a kaydet)".
    // "Store'a kaydet" could mean just having it in the `completedEducation` data is enough (which it is).
    // Or if there was a `player.modifiers` slice. 
    // For now, tracking `completedEducation` is the "save" mechanism.

    return buffs;
};
