import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import { EducationItem, StatImpact } from '../../features/education/educationTypes';
import { canEnroll, advanceEducation, applyGraduationBuffs } from '../../logic/educationLogic';
import { useStatsStore } from './useStatsStore';
import { usePlayerStore } from './usePlayerStore';

export interface ActiveEducation {
    item: EducationItem;
    progress: number; // Current quarter (0 to durationQuarter)
    currentYear: number; // 1-indexed (e.g. Year 1 of 4)
}

interface EducationState {
    activeAcademic: ActiveEducation | null;
    activeCertificate: ActiveEducation | null;
    completedEducations: string[]; // List of EducationItem IDs

    // Actions
    enroll: (item: EducationItem) => void;
    advanceProgress: () => { academicMessage?: string; certificateMessage?: string };
    study: (slot: 'academic' | 'certificate', multiplier: number) => { message?: string; graduated?: boolean };
    dropOut: (slot: 'academic' | 'certificate') => void;
    reset: () => void;
}

const initialState = {
    activeAcademic: null,
    activeCertificate: null,
    completedEducations: [],
};

// Helper function to apply stat bonuses with proper routing
const applyBonuses = (bonuses: StatImpact[]) => {
    const playerStore = usePlayerStore.getState();

    bonuses.forEach(bonus => {
        const { statId, value } = bonus;

        // Route to correct store and state based on statId
        // Attributes (in PlayerStore)
        if (['intellect', 'charm', 'looks', 'strength'].includes(statId)) {
            const currentValue = playerStore.attributes[statId as keyof typeof playerStore.attributes];
            playerStore.updateAttribute(statId as any, currentValue + value);
        }
        // Core stats (in PlayerStore)
        else if (statId === 'happiness') {
            const currentValue = playerStore.core.happiness;
            playerStore.updateCore('happiness', currentValue + value);
        }
        // Reputation (in PlayerStore)
        else if (['businessTrust', 'highSociety', 'streetCred', 'casinoVIP'].includes(statId)) {
            // Map education stat names to player store reputation keys
            const repMapping: Record<string, keyof typeof playerStore.reputation> = {
                'businessTrust': 'business',
                'highSociety': 'social',
                'streetCred': 'street',
                'casinoVIP': 'casino'
            };
            const repKey = repMapping[statId];
            if (repKey) {
                const currentValue = playerStore.reputation[repKey];
                playerStore.updateReputation(repKey, currentValue + value);
            }
        }
        // Security (in PlayerStore)
        else if (['digitalShield', 'bodyguard'].includes(statId)) {
            const secMapping: Record<string, keyof typeof playerStore.security> = {
                'digitalShield': 'digital',
                'bodyguard': 'personal'
            };
            const secKey = secMapping[statId];
            if (secKey) {
                const currentValue = playerStore.security[secKey];
                playerStore.updateSecurity(secKey, currentValue + value);
            }
        }
        // Martial Arts (in PlayerStore skills)
        else if (statId === 'martialArts') {
            const currentSkill = playerStore.skills.martialArts;
            playerStore.updateSkill('martialArts', {
                level: Math.min(8, currentSkill.level + Math.floor(value / 10)),
                progress: currentSkill.progress + value
            });
        }
        else {
            console.log(`[Education] Unknown stat: ${statId} +${value}`);
        }
    });
};

export const useEducationStore = create<EducationState>()(
    persist(
        (set, get) => ({
            ...initialState,

            enroll: (item: EducationItem) => {
                const { activeAcademic, activeCertificate, completedEducations } = get();
                const stats = useStatsStore.getState();

                const isCertificate = item.type === 'certificate';
                const isAcademic = item.type === 'degree' || item.type === 'master' || item.type === 'phd';

                // 1. Check track-specific enrollment
                if (isCertificate) {
                    if (activeCertificate) {
                        throw new Error("You are already enrolled in a certificate. Finish or drop it first.");
                    }
                } else if (isAcademic) {
                    if (activeAcademic) {
                        throw new Error("You are already enrolled in an academic program. Finish or drop it first.");
                    }
                }

                // 2. Check Logic (Reqs & Funds)
                const check = canEnroll({
                    completedEducations,
                    activeProgramId: undefined,
                    money: stats.money
                }, item.id);

                if (!check.success) {
                    throw new Error(check.reason || "Unable to enroll.");
                }

                // 3. Deduct Cost
                const cost = check.costToPay || 0;
                if (!stats.spendMoney(cost)) {
                    throw new Error("Insufficient funds for initial payment.");
                }

                // 4. Set Active in appropriate track
                const newActive: ActiveEducation = {
                    item,
                    progress: 0,
                    currentYear: 1
                };

                if (isCertificate) {
                    set({ activeCertificate: newActive });
                } else if (isAcademic) {
                    set({ activeAcademic: newActive });
                }
            },

            advanceProgress: () => {
                const state = get();
                const { activeAcademic, activeCertificate, completedEducations } = state;
                let newAcademic = activeAcademic ? { ...activeAcademic } : null;
                let newCertificate = activeCertificate ? { ...activeCertificate } : null;
                const newCompleted = [...completedEducations];
                let academicMessage: string | undefined;
                let certificateMessage: string | undefined;

                // ========================================
                // 1. Handle Academic Track (INDEPENDENT)
                // ========================================
                if (newAcademic) {
                    const { item } = newAcademic;

                    // Apply Quarterly Bonuses
                    if (item.quarterlyBonuses && item.quarterlyBonuses.length > 0) {
                        applyBonuses(item.quarterlyBonuses);
                    }

                    // Increment Progress
                    newAcademic.progress += 1;

                    // Check for Completion
                    if (newAcademic.progress >= item.durationQuarter) {
                        // Apply Completion Bonuses
                        if (item.completionBonuses && item.completionBonuses.length > 0) {
                            applyBonuses(item.completionBonuses);
                        }

                        // Apply legacy graduation buffs
                        applyGraduationBuffs(
                            item.id,
                            usePlayerStore.getState().updateAttribute,
                            usePlayerStore.getState().updateReputation,
                            usePlayerStore.getState().attributes,
                            usePlayerStore.getState().reputation
                        );

                        // Graduate - ONLY clear academic
                        newCompleted.push(item.id);
                        newAcademic = null;
                        academicMessage = `🎓 Graduated from ${item.title}!`;
                    }
                }

                // ========================================
                // 2. Handle Certificate Track (INDEPENDENT)
                // ========================================
                if (newCertificate) {
                    const { item } = newCertificate;

                    // Apply Quarterly Bonuses
                    if (item.quarterlyBonuses && item.quarterlyBonuses.length > 0) {
                        applyBonuses(item.quarterlyBonuses);
                    }

                    // Increment Progress
                    newCertificate.progress += 1;

                    // Check for Completion
                    if (newCertificate.progress >= item.durationQuarter) {
                        // Apply Completion Bonuses
                        if (item.completionBonuses && item.completionBonuses.length > 0) {
                            applyBonuses(item.completionBonuses);
                        }

                        // Apply legacy graduation buffs
                        applyGraduationBuffs(
                            item.id,
                            usePlayerStore.getState().updateAttribute,
                            usePlayerStore.getState().updateReputation,
                            usePlayerStore.getState().attributes,
                            usePlayerStore.getState().reputation
                        );

                        // Complete - ONLY clear certificate
                        newCompleted.push(item.id);
                        newCertificate = null;
                        certificateMessage = `📜 Completed ${item.title}!`;
                    }
                }

                // Update state
                set({
                    activeAcademic: newAcademic,
                    activeCertificate: newCertificate,
                    completedEducations: newCompleted
                });

                // Return combined message for useGameStore compatibility
                const combinedMessage = [academicMessage, certificateMessage].filter(Boolean).join(' ');
                return {
                    academicMessage,
                    certificateMessage,
                    message: combinedMessage || undefined // For backward compatibility
                };
            },

            study: (slot: 'academic' | 'certificate', multiplier: number) => {
                const { activeAcademic, activeCertificate, completedEducations } = get();
                const active = slot === 'academic' ? activeAcademic : activeCertificate;

                if (!active) return {};

                const logicState = {
                    programId: active.item.id,
                    currentYear: active.currentYear,
                    progress: active.progress
                };

                const result = advanceEducation(logicState, multiplier);

                if (result.status === 'graduated') {
                    const newCompleted = [...completedEducations, active.item.id];

                    // Apply completion bonuses
                    if (active.item.completionBonuses && active.item.completionBonuses.length > 0) {
                        applyBonuses(active.item.completionBonuses);
                    }

                    applyGraduationBuffs(
                        active.item.id,
                        usePlayerStore.getState().updateAttribute,
                        usePlayerStore.getState().updateReputation,
                        usePlayerStore.getState().attributes,
                        usePlayerStore.getState().reputation
                    );

                    if (slot === 'academic') {
                        set({
                            activeAcademic: null,
                            completedEducations: newCompleted
                        });
                    } else {
                        set({
                            activeCertificate: null,
                            completedEducations: newCompleted
                        });
                    }

                    return { message: result.message, graduated: true };
                } else {
                    const change = result.progressChange || 0;
                    const newProgress = Math.min(100, active.progress + change);

                    if (slot === 'academic') {
                        set({
                            activeAcademic: {
                                ...active,
                                progress: newProgress
                            }
                        });
                    } else {
                        set({
                            activeCertificate: {
                                ...active,
                                progress: newProgress
                            }
                        });
                    }

                    return { message: result.message || "You studied hard." };
                }
            },

            dropOut: (slot: 'academic' | 'certificate') => {
                if (slot === 'academic') {
                    set({ activeAcademic: null });
                } else {
                    set({ activeCertificate: null });
                }
            },

            reset: () => set({ ...initialState })
        }),
        {
            name: 'succesor_education_v3', // Version bump for bug fixes
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                activeAcademic: state.activeAcademic,
                activeCertificate: state.activeCertificate,
                completedEducations: state.completedEducations
            })
        }
    )
);
