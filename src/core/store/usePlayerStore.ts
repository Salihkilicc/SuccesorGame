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
    QuarterlyActions,
    MartialArtsSkill,
    HiddenStats
} from '../types';

// --- TYPES (Eksik kalanlar için güvence) ---
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

    // Hub & Spoke: Action Flags
    quarterlyActions: QuarterlyActions;

    // Hidden / Meta (Legacy Support)
    hidden: LocalHiddenStats;

    // Black Market Persistence
    blackMarket: {
        suspicion: number;
        quarterlyDrugUsage: number;
    };

    // --- ACTIONS ---

    // 1. Generic Updaters
    updateCore: (key: keyof CoreStats, value: number) => void;
    updateAttribute: (key: keyof Attributes, value: number) => void;
    updatePersonality: (key: keyof Personality, value: number) => void;
    updateReputation: (key: keyof Reputation, value: number) => void;
    updateSecurity: (key: keyof SecurityState, value: number) => void;

    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor
    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor
    updateHidden: (key: keyof LocalHiddenStats, value: number) => void;

    updateBlackMarket: (key: 'suspicion' | 'quarterlyDrugUsage', value: number) => void;

    // 2. Skill Management
    updateSkill: (skill: keyof SkillsState, data: Partial<MartialArtsSkill>) => void;

    // 3. Money Management
    spendMoney: (amount: number) => boolean;
    earnMoney: (amount: number) => void;

    // 4. Action Flags
    performAction: (action: keyof QuarterlyActions) => void;
    resetQuarterlyActions: () => void;

    // ⚠️ GERİ EKLENDİ: useGameStore bu fonksiyonu arıyor (Save/Load için kritik)
    setAll: (partial: Partial<PlayerState>) => void;

    reset: () => void;
}

// --- INITIAL STATE ---
const initialState = {
    core: { health: 100, happiness: 100, stress: 0, money: 5000, netWorth: 5000 },
    attributes: { intellect: 10, charm: 10, looks: 50, strength: 10 },
    personality: { riskAppetite: 50, strategicSense: 50, morality: 50, ambition: 50 },
    reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
    security: { digital: 0, personal: 0 },
    skills: { martialArts: { belt: 'White' as const, progress: 0, level: 1 } },
    quarterlyActions: { hasStudied: false, hasTrained: false, hasDated: false, hasSocialized: false },
    hidden: { luck: 10, security: 0 },
    blackMarket: { suspicion: 0, quarterlyDrugUsage: 0 },
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

            updateReputation: (key, value) => set((state) => {
                const max = key === 'casino' ? 1000 : 100;
                return {
                    reputation: { ...state.reputation, [key]: Math.max(0, Math.min(max, value)) }
                };
            }),

            updateSecurity: (key, value) => set((state) => ({
                security: { ...state.security, [key]: Math.max(0, Math.min(100, value)) }
            })),

            // ⚠️ FIX: useGameStore için geri geldi
            updateHidden: (key, value) => set((state) => ({
                hidden: { ...state.hidden, [key]: Math.max(0, value) }
            })),

            updateBlackMarket: (key, value) => set((state) => ({
                blackMarket: { ...state.blackMarket, [key]: Math.max(0, value) }
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

            // ⚠️ FIX: useGameStore için geri geldi
            setAll: (partial) => set((state) => ({ ...state, ...partial })),

            reset: () => set({ ...initialState })
        }),
        {
            name: 'succesor_player_hub_v3', // Version bump for cleanup
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                core: state.core,
                attributes: state.attributes,
                personality: state.personality,
                reputation: state.reputation,
                security: state.security,
                skills: state.skills,
                quarterlyActions: state.quarterlyActions,
                hidden: state.hidden,
                blackMarket: state.blackMarket,
            }),
        }
    )
);