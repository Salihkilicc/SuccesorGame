import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { EDUCATION_DATA } from '../data/educationData';
import { advanceEducation, applyGraduationBuffs } from '../logic/educationLogic';

// --- TYPES ---
interface ActiveEnrollment {
    programId: string;
    currentYear: number; // 1-based (e.g., 1st year, 2nd year)
    progress: number; // 0-100% for the current year
}

interface EducationState {
    activeEnrollment: ActiveEnrollment | null;
    completedEducation: string[]; // List of program IDs
}
interface CoreStats {
    health: number;
    happiness: number;
    stress: number;
}

interface Attributes {
    intellect: number;
    charm: number;
    looks: number;
    strength: number;
}

interface Personality {
    riskAppetite: number;
    morality: number;
    ambition: number;
}

interface Reputation {
    social: number;
    street: number;
    business: number;
    police: number;
    casino: number;
}

interface SecurityState {
    digital: number;
    personal: number;
}

interface MartialArtsSkill {
    belt: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Black';
    progress: number;
    level: number;
}

interface SkillsState {
    martialArts: MartialArtsSkill;
}

interface HiddenStats {
    luck: number;
    security: number;
}

export interface PlayerState {
    core: CoreStats;
    attributes: Attributes;
    personality: Personality;
    reputation: Reputation;
    hidden: HiddenStats;
    security: SecurityState;
    skills: SkillsState;
    education: EducationState;

    // Actions
    updateCore: (key: keyof CoreStats, value: number) => void;
    updateAttribute: (key: keyof Attributes, value: number) => void;
    updatePersonality: (key: keyof Personality, value: number) => void;
    updateReputation: (key: keyof Reputation, value: number) => void;
    updateHidden: (key: keyof HiddenStats, value: number) => void;
    updateSecurity: (key: keyof SecurityState, value: number) => void;
    updateSkill: (skill: keyof SkillsState, data: Partial<MartialArtsSkill>) => void;

    // Education Actions
    enrollInProgram: (programId: string) => void;
    makeStudyProgress: (amount: number) => void;
    graduateCurrent: () => void;
    advanceEducationAction: () => { message?: string; graduated?: boolean };

    // Bulk update (optional helper)
    setAll: (partial: Partial<PlayerState>) => void;

    reset: () => void;
}

// --- INITIAL STATE ---
const initialState = {
    core: { health: 100, happiness: 100, stress: 0 },
    attributes: { intellect: 10, charm: 10, looks: 10, strength: 10 },
    personality: { riskAppetite: 50, morality: 50, ambition: 50 },
    reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
    hidden: { luck: 50, security: 0 },
    security: { digital: 0, personal: 0 },
    skills: { martialArts: { belt: 'White' as const, progress: 0, level: 1 } },
    education: { activeEnrollment: null, completedEducation: [] }
};

// --- STORE ---
export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            ...initialState,

            updateCore: (key, value) => set((state) => ({
                core: { ...state.core, [key]: Math.max(0, Math.min(100, value)) }
            })),

            updateAttribute: (key, value) => set((state) => ({
                attributes: { ...state.attributes, [key]: Math.max(0, Math.min(100, value)) }
            })),

            updatePersonality: (key, value) => set((state) => ({
                personality: { ...state.personality, [key]: Math.max(0, Math.min(100, value)) }
            })),

            updateReputation: (key, value) => set((state) => ({
                reputation: { ...state.reputation, [key]: Math.max(0, Math.min(100, value)) }
            })),

            updateHidden: (key, value) => set((state) => ({
                hidden: { ...state.hidden, [key]: Math.max(0, value) } // No upper limit strictly defined, but usually 100
            })),

            updateSecurity: (key, value) => set((state) => ({
                security: { ...state.security, [key]: Math.max(0, value) }
            })),

            updateSkill: (skill, data) => set((state) => ({
                skills: {
                    ...state.skills,
                    [skill]: { ...state.skills[skill], ...data }
                }
            })),

            enrollInProgram: (programId) => set((state) => {
                // Basic validation: Check if already enrolled not strictly needed if UI handles it, but good for safety
                // Also could check prerequisites here or in UI logic. Store just executes.
                return {
                    education: {
                        ...state.education,
                        activeEnrollment: {
                            programId,
                            currentYear: 1,
                            progress: 0
                        }
                    }
                };
            }),

            makeStudyProgress: (bonusAmount) => {
                const state = get();
                const { activeEnrollment } = state.education;
                if (!activeEnrollment) return;

                // Import logic dynamically (or rely on top level imports if fixed)
                // We use advanceEducation logic but forcing a step.
                // However, "Study Hard" usually adds EXTRA progress on top of quarterly?
                // Or does it just advance time?
                // Prompt: "Study Hard / Cram ... Stress +15 artırır ama o çeyrekteki akademik başarı şansını garantiler."
                // "Actions Button" usually means immediate effect.
                // If it adds progress immediately, it might mess up the quarterly flow (quarter 1 -> quarter 1.5?)
                // Assuming it just adds raw progress % to the current quarter bucket.

                // Let's implement it as: Add progress immediately.
                // If it pushes > 100, we handle year up immediately? Or wait for quarter?
                // "Garantiler" implies success.
                // Let's interpret: Adds significant progress (e.g. +10%) immediately.

                // Re-using logic or local update:
                const { advanceEducation } = require('../logic/educationLogic');
                // We can use advanceEducation with 0 increment but 'bonus' param if we modified it?
                // Or just raw helper.

                // Simplest: Just add progress.
                let newProgress = activeEnrollment.progress + bonusAmount;

                // If progress > 100, we could auto-advance year OR just cap at 100 waiting for quarter tick.
                // Ideally, user studies hard to ensure they pass the year check.
                // Let's cap at 100. The Quarter Tick will trigger the actual Year Up event.
                // Or if we want immediate feedback, we can trigger advancement.
                // Let's just cap at 100 for now. The Quarter Tick will see 100 and Advance.
                // This means 'Study Hard' effectively shortens the time needed or secures the grade.

                set((prev) => ({
                    education: {
                        ...prev.education,
                        activeEnrollment: {
                            ...activeEnrollment,
                            progress: Math.min(100, newProgress)
                        }
                    }
                }));
            },

            graduateCurrent: () => set((state) => {
                const { activeEnrollment, completedEducation } = state.education;
                if (!activeEnrollment) return state;

                // Apply Graduation Buffs logic internally
                // We'll rely on advanceEducationAction to handle the graduation "event" flow which calls this or does similar logic.
                // But keeping this simple action for manual graduation is fine if needed.
                // Since this simple version replicates logic, we'll keep it as is for legacy/manual calls.

                const newCompleted = completedEducation.includes(activeEnrollment.programId)
                    ? completedEducation
                    : [...completedEducation, activeEnrollment.programId];

                return {
                    education: {
                        ...state.education,
                        activeEnrollment: null,
                        completedEducation: newCompleted
                    }
                };
            }),

            advanceEducationAction: () => {
                const state = get();
                const { activeEnrollment } = state.education;

                if (!activeEnrollment) return { message: undefined };

                // Import logic dynamically or use the imported functions at top level if available.
                // We need to ensure we import advanceEducation from logic.
                // NOTE: imports are at top of file, let's assume they are there or we added them.
                // Wait, usePlayerStore had imports at top. I might need to add import for advanceEducation first.
                // I'll assume valid imports for now and if build fails I'll fix imports.

                // Let's defer actual implementation until I verify imports.
                // BUT wait, I am in replace_file_content.
                // I should add the import line at the top first if it's missing.

                // Let's implement the body assuming import is present, then I'll check imports.

                // let's assume imports are correct now.

                const result = advanceEducation(activeEnrollment);

                if (result.status === 'graduated') {
                    // Handle Graduation
                    // Apply buffs
                    const buffs = applyGraduationBuffs(
                        activeEnrollment.programId,
                        (k: keyof Attributes, v: number) => state.updateAttribute(k, v),
                        (k: keyof Reputation, v: number) => state.updateReputation(k, v),
                        state.attributes,
                        state.reputation
                    );

                    // Graduate in State
                    state.graduateCurrent();

                    return { message: result.message, graduated: true };
                } else if (result.status === 'year_complete') {
                    // Handle Year Up
                    const { statReward, newYear } = result;

                    // Apply Stat Reward
                    if (statReward) {
                        if (statReward.stat === 'intellect') state.updateAttribute('intellect', state.attributes.intellect + statReward.amount);
                        else if (statReward.stat === 'charm') state.updateAttribute('charm', state.attributes.charm + statReward.amount);
                        else if (statReward.stat === 'looks') state.updateAttribute('looks', state.attributes.looks + statReward.amount);
                        else if (statReward.stat === 'strength') state.updateAttribute('strength', state.attributes.strength + statReward.amount);
                        else if (statReward.stat === 'health') state.updateCore('health', state.core.health + statReward.amount);
                    }

                    // Update Enrollment
                    set((prev) => ({
                        education: {
                            ...prev.education,
                            activeEnrollment: {
                                ...activeEnrollment,
                                currentYear: newYear || activeEnrollment.currentYear + 1,
                                progress: 0
                            }
                        }
                    }));

                    return { message: result.message };
                } else {
                    // In Progress
                    set((prev) => ({
                        education: {
                            ...prev.education,
                            activeEnrollment: {
                                ...activeEnrollment,
                                progress: result.newProgress || activeEnrollment.progress
                            }
                        }
                    }));
                    return { message: undefined };
                }
            },

            setAll: (partial) => set((state) => ({ ...state, ...partial })),

            reset: () => set({ ...initialState })
        }),
        {
            name: 'succesor_player_v5', // Incremented version for safety
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                core: state.core,
                attributes: state.attributes,
                personality: state.personality,
                reputation: state.reputation,
                hidden: state.hidden,
                security: state.security,
                skills: state.skills,
                education: state.education
            }),
        }
    )
);
