import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import {
    CoreStats,
    Attributes,
    Personality,
    Reputation,
    SecurityState,
    SkillsState,
    EducationState,
    QuarterlyActions,
    MartialArtsSkill,
    HiddenStats // Types dosyasında bu interface'in olduğundan emin ol, yoksa aşağıda tanımladım.
} from '../types';

// Eğer logic dosyasını henüz oluşturmadıysak hata vermemesi için placeholder (geçici) importlar:
// Gerçek logic dosyaları hazır olunca burayı açacağız. Şimdilik store içinde basit mantıkla tutuyoruz.
// import { advanceEducation, applyGraduationBuffs } from '../logic/educationLogic'; 

// --- TYPES (Eksik kalanlar için güvence) ---
// Eğer types.ts'de HiddenStats yoksa burada tanımlı kalsın çökmesin.
interface LocalHiddenStats {
    luck: number;
    security: number;
}

export interface PlayerState {
    // Data Sections
    core: CoreStats;
    attributes: Attributes;
    personality: Personality;
    reputation: Reputation;
    security: SecurityState;
    skills: SkillsState;
    education: EducationState;

    // Hub & Spoke: Action Flags
    quarterlyActions: QuarterlyActions;

    // Hidden / Meta (Legacy Support)
    hidden: LocalHiddenStats;

    // --- ACTIONS ---

    // 1. Generic Updaters
    updateCore: (key: keyof CoreStats, value: number) => void;
    updateAttribute: (key: keyof Attributes, value: number) => void;
    updatePersonality: (key: keyof Personality, value: number) => void;
    updateReputation: (key: keyof Reputation, value: number) => void;
    updateSecurity: (key: keyof SecurityState, value: number) => void;

    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor
    updateHidden: (key: keyof LocalHiddenStats, value: number) => void;

    // 2. Skill Management
    updateSkill: (skill: keyof SkillsState, data: Partial<MartialArtsSkill>) => void;

    // 3. Money Management
    spendMoney: (amount: number) => boolean;
    earnMoney: (amount: number) => void;

    // 4. Action Flags
    performAction: (action: keyof QuarterlyActions) => void;
    resetQuarterlyActions: () => void;

    // 5. Education Helpers
    enrollInProgram: (programId: string) => void;
    makeStudyProgress: (amount: number) => void; // Eski koddan geri geldi
    graduateCurrent: () => void; // Eski koddan geri geldi

    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor
    advanceEducationAction: () => { message?: string; graduated?: boolean };
    setEducationState: (state: Partial<EducationState>) => void;

    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor (Save/Load için kritik)
    setAll: (partial: Partial<PlayerState>) => void;

    reset: () => void;
}

// --- INITIAL STATE ---
const initialState = {
    core: { health: 100, happiness: 100, stress: 0, money: 5000, netWorth: 5000 },
    attributes: { intellect: 10, charm: 10, looks: 10, strength: 10 },
    personality: { riskAppetite: 50, morality: 50, ambition: 50 },
    reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
    security: { digital: 0, personal: 0 },
    skills: { martialArts: { belt: 'White' as const, progress: 0, level: 1 } },
    education: { activeEnrollment: null, completedEducation: [] },
    quarterlyActions: { hasStudied: false, hasTrained: false, hasDated: false, hasSocialized: false },
    hidden: { luck: 50, security: 0 },
};

// --- STORE CREATION ---
export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // --- Generic Updaters ---
            updateCore: (key, value) => set((state) => ({
                core: { ...state.core, [key]: Math.max(0, value) }
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

            updateSecurity: (key, value) => set((state) => ({
                security: { ...state.security, [key]: Math.max(0, Math.min(100, value)) }
            })),

            // ⚠️ FIX: useGameStore için geri geldi
            updateHidden: (key, value) => set((state) => ({
                hidden: { ...state.hidden, [key]: Math.max(0, value) }
            })),

            // --- Skill Management ---
            updateSkill: (skill, data) => set((state) => ({
                skills: {
                    ...state.skills,
                    [skill]: { ...state.skills[skill], ...data }
                }
            })),

            // --- Money Management ---
            spendMoney: (amount) => {
                const { money } = get().core;
                if (money >= amount) {
                    set((state) => ({ core: { ...state.core, money: state.core.money - amount } }));
                    return true;
                }
                return false;
            },
            earnMoney: (amount) => set((state) => ({
                core: { ...state.core, money: state.core.money + amount }
            })),

            // --- Action Flags ---
            performAction: (action) => set((state) => ({
                quarterlyActions: { ...state.quarterlyActions, [action]: true }
            })),

            resetQuarterlyActions: () => set((state) => ({
                quarterlyActions: {
                    hasStudied: false,
                    hasTrained: false,
                    hasDated: false,
                    hasSocialized: false
                }
            })),

            // --- Education ---
            enrollInProgram: (programId) => set((state) => ({
                education: {
                    ...state.education,
                    activeEnrollment: { programId, currentYear: 1, progress: 0 }
                }
            })),

            // ⚠️ FIX: Eski 'Study' fonksiyonu (UI kullanıyor olabilir)
            makeStudyProgress: (bonusAmount) => {
                const state = get();
                const { activeEnrollment } = state.education;
                if (!activeEnrollment) return;

                const newProgress = activeEnrollment.progress + bonusAmount;
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

            // ⚠️ FIX: Manuel mezuniyet fonksiyonu
            graduateCurrent: () => set((state) => {
                const { activeEnrollment, completedEducation } = state.education;
                if (!activeEnrollment) return state;

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

            // ⚠️ FIX: useGameStore için kritik fonksiyon
            // Logic dosyasını bağlayana kadar "Placeholder" olarak çalışır, oyunun çökmesini engeller.
            advanceEducationAction: () => {
                const state = get();
                const { activeEnrollment } = state.education;

                if (!activeEnrollment) return { message: undefined };

                // LOGIC ENTEGRASYONU: İleride buraya gerçek mantığı bağlayacağız.
                // Şimdilik sadece progress %100 ise yıl atlatıyor.
                if (activeEnrollment.progress >= 100) {
                    set((prev) => ({
                        education: {
                            ...prev.education,
                            activeEnrollment: {
                                ...activeEnrollment,
                                currentYear: activeEnrollment.currentYear + 1,
                                progress: 0
                            }
                        }
                    }));
                    return { message: "Year completed!" };
                }

                return { message: undefined };
            },

            setEducationState: (partial) => set((state) => ({
                education: { ...state.education, ...partial }
            })),

            // ⚠️ FIX: useGameStore için geri geldi
            setAll: (partial) => set((state) => ({ ...state, ...partial })),

            reset: () => set({ ...initialState })
        }),
        {
            name: 'succesor_player_hub_v2', // Versiyonu artırdım
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                core: state.core,
                attributes: state.attributes,
                personality: state.personality,
                reputation: state.reputation,
                security: state.security,
                skills: state.skills,
                education: state.education,
                quarterlyActions: state.quarterlyActions,
                hidden: state.hidden,
            }),
        }
    )
);