import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage/persist';
import { EDUCATION_DATA } from '../data/educationData';

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
    education: EducationState;

    // Actions
    updateCore: (key: keyof CoreStats, value: number) => void;
    updateAttribute: (key: keyof Attributes, value: number) => void;
    updatePersonality: (key: keyof Personality, value: number) => void;
    updateReputation: (key: keyof Reputation, value: number) => void;
    updateHidden: (key: keyof HiddenStats, value: number) => void;

    // Education Actions
    enrollInProgram: (programId: string) => void;
    makeStudyProgress: (amount: number) => void;
    graduateCurrent: () => void;

    // Bulk update (optional helper)
    setAll: (partial: Partial<PlayerState>) => void;

    reset: () => void;
}

// --- INITIAL STATE ---
const initialState = {
    core: { health: 100, happiness: 100, stress: 0 },
    attributes: { intellect: 10, charm: 10, looks: 10, strength: 10 },
    personality: { riskAppetite: 50, morality: 50, ambition: 50 },
    reputation: { social: 0, street: 0, business: 0, police: 0 },
    hidden: { luck: 50, security: 0 },
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

            makeStudyProgress: (amount) => set((state) => {
                const { activeEnrollment } = state.education;
                if (!activeEnrollment) return state;

                let newProgress = activeEnrollment.progress + amount;

                // Cap progress at 100 for the current check
                // Logic for year advancement happens in UI or dedicated 'advanceYear' logic usually,
                // but prompt implies makeStudyProgress handles progress. 
                // We'll cap at 100. Year advancement might be separate or automatic?
                // "makeStudyProgress(amount): İlerleme kaydetme." -> Just recording progress.
                // We will implement simple clamping. Handling year rollover is likely a separate check or explicit action.
                // However, let's auto-clamp at 100.

                return {
                    education: {
                        ...state.education,
                        activeEnrollment: {
                            ...activeEnrollment,
                            progress: Math.min(100, newProgress)
                        }
                    }
                };
            }),

            graduateCurrent: () => set((state) => {
                const { activeEnrollment, completedEducation } = state.education;
                if (!activeEnrollment) return state;

                // Apply Graduation Buffs
                // Use actions or simple state helpers. Since we are inside set(), we can't easily call get().updateAttribute 
                // without breaking the set() flow or using multiple updates.
                // We will manually apply the buffs logic here or retrieve the buffs data and apply to state.
                // Re-implementing simplified logic here avoids circular dependencies or complex callbacks inside reducers.

                const allPrograms = [
                    ...EDUCATION_DATA.degrees,
                    ...EDUCATION_DATA.postgrad,
                    ...EDUCATION_DATA.certificates,
                ];
                const program = allPrograms.find((p) => p.id === activeEnrollment.programId);

                let newAttributes = { ...state.attributes };
                let newReputation = { ...state.reputation };

                if (program && program.buffs) {
                    if (program.buffs.statBoost) {
                        if (program.buffs.statBoost.intellect) {
                            newAttributes.intellect = Math.min(100, newAttributes.intellect + program.buffs.statBoost.intellect);
                        }
                        // Add other stat boosts here if needed
                    }
                    // Apply reputation buffs similarly if they existed in data
                }

                // Add to completed list
                const newCompleted = completedEducation.includes(activeEnrollment.programId)
                    ? completedEducation
                    : [...completedEducation, activeEnrollment.programId];

                return {
                    attributes: newAttributes,
                    reputation: newReputation,
                    education: {
                        ...state.education,
                        activeEnrollment: null,
                        completedEducation: newCompleted
                    }
                };
            }),

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
                education: state.education
            }),
        }
    )
);
