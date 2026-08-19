// src/core/store/useFamilyStore.ts
//
// ============================================================================
//  FAMILY, DYNASTY & SUCCESSION STORE (UPGRADED)
// ============================================================================
//
//  Integrates deep PartnerProfile (psychometrics: jealousy, crazy, libido;
//  social hierarchy: HighSociety, OldMoney, Royalty; and marriage status)
//  alongside the Succession Heirs system.
//
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';
import {
    PartnerProfile,
    ExPartnerProfile,
    PartnerStats,
    SocialClass,
    Ethnicity,
    BREAKUP_REASONS,
} from '../../data/relationshipTypes';

// Re-export relationship types for ease of import
export type { PartnerProfile, ExPartnerProfile, PartnerStats, SocialClass, Ethnicity };
export { BREAKUP_REASONS };

// Backwards compatibility alias
export type Partner = PartnerProfile;
export type PartnerStatus = 'Dating' | 'Engaged' | 'Married' | 'Separated' | 'Divorced';

// ============================================================================
//  SUCCESSION HEIR TYPES
// ============================================================================

export type ChildEducationLevel =
    | 'None'
    | 'Preschool'
    | 'Elementary'
    | 'HighSchool'
    | 'University'
    | 'IvyLeague'
    | 'Graduated';

export type ChildRole =
    | 'Infant'
    | 'Toddler'
    | 'Student'
    | 'Intern'
    | 'Manager'
    | 'Executive'
    | 'SuccessorCandidate'
    | 'Independent';

export interface ChildStats {
    intellect: number;       // 0-100: Strategic & cognitive aptitude
    charm: number;           // 0-100: Charisma and negotiation
    businessAcumen: number;  // 0-100: Core succession suitability metric
    loyalty: number;         // 0-100: Loyalty to player & family empire
    ambition: number;        // 0-100: Leadership drive
    health: number;          // 0-100: Vitality and resilience
    creativity: number;      // 0-100: Innovation and vision
}

export interface Child {
    id: string;
    name: string;
    gender: 'Male' | 'Female';
    age: number;
    birthYear?: number;
    birthQuarter?: number;
    avatar?: string;
    educationLevel: ChildEducationLevel;
    role: ChildRole;
    stats: ChildStats;
    relationshipWithPlayer: number; // 0-100
    isSuccessorCandidate: boolean;
    traits: string[];
    allowance: number;              // Quarterly support ($)
}

// ============================================================================
//  STORE STATE & ACTIONS
// ============================================================================

export interface FamilyState {
    partner: PartnerProfile | null;
    exPartners: ExPartnerProfile[];
    children: Child[];
    designatedSuccessorId: string | null;
    familyReputation: number;       // 0-100 Dynasty prestige
    _hasHydrated: boolean;
}

export interface FamilyActions {
    setHasHydrated: (v: boolean) => void;

    // --- Partner Actions ---
    setPartner: (partner: PartnerProfile | null) => void;
    updatePartner: (updates: Partial<PartnerProfile>) => void;
    updatePartnerStats: (updates: Partial<PartnerStats>) => void;
    updateLove: (amount: number) => void;
    updatePartnerLove: (delta: number) => void; // Alias for updateLove
    marry: (hasPrenup?: boolean) => boolean;
    breakup: (reason?: string) => ExPartnerProfile | null;

    // --- Succession Children Actions ---
    addChild: (child: Omit<Child, 'id'> | Child) => string;
    updateChild: (id: string, updates: Partial<Child>) => void;
    updateChildStats: (id: string, statsDelta: Partial<ChildStats>) => void;
    removeChild: (id: string) => void;
    setSuccessorCandidate: (id: string, isCandidate: boolean) => void;
    designateSuccessor: (id: string | null) => void;
    adjustChildRelationship: (id: string, delta: number) => void;
    setChildAllowance: (id: string, amount: number) => void;

    // --- Lifecycle Simulation ---
    ageUpFamily: () => void;

    // --- Utility ---
    reset: () => void;
    /** Development only. See the note above DEMO_PARTNER. */
    loadDemoFamily: () => void;
}

export type FamilyStore = FamilyState & FamilyActions;

// ============================================================================
//  INITIAL DATA / PLACEHOLDERS
// ============================================================================

const generateId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// ============================================================================
//  A NEW GAME HAS NO FAMILY IN IT
// ============================================================================
//
//  These two constants were the store's INITIAL STATE, and `reset()` put them
//  back. So every new game opened with a girlfriend of a year and three
//  children - sixteen, eight and three - none of whom the player had met, and
//  the player is twenty-five. The eldest would have arrived when they were
//  nine.
//
//  It is worth being precise about why the new-game audit never caught it.
//  That audit looks for state SURVIVING a reset, and nothing survived: the
//  reset put the family back deliberately, every time, exactly as written.
//  A wrong initial value and a leak look identical from the outside and only
//  one of them is a leak.
//
//  They are demo data now, loaded only in a development build - see
//  `loadDemoFamily` at the bottom of this file. Kept rather than deleted
//  because they are the only fully-populated PartnerProfile and Child objects
//  in the tree, and every screen in features/love and features/profile was
//  laid out against them. Deleting them would mean guessing what those
//  screens are supposed to render.
// ============================================================================

export const DEMO_PARTNER: PartnerProfile = {
    id: 'partner_sophia_vance',
    name: 'Sophia Vance',
    photo: null,
    love: 85,
    relationYears: 1,
    isMarried: false,
    hasPrenup: false,
    stats: {
        ethnicity: 'RoyalEuropean',
        age: 29,
        occupation: 'Art Gallery Director & Philanthropist',
        looks: 92,
        style: 'Luxury',
        socialClass: 'HighSociety',
        familyWealth: 90,
        intelligence: 88,
        jealousy: 40,
        crazy: 65,
        libido: 75,
        reputationBuff: 15,
        financialAidChance: 25,
        networkPower: 85,
    },
    job: {
        title: 'Gallery Director',
        tier: 'Tier 3',
        buffType: 'reputation',
        buffValue: 12,
    },
    finances: {
        monthlyCost: 8500,
    },
};

export const DEMO_CHILDREN: Child[] = [
    {
        id: 'child_alexander_1',
        name: 'Alexander Hale',
        gender: 'Male',
        age: 16,
        birthYear: 2010,
        birthQuarter: 1,
        educationLevel: 'HighSchool',
        role: 'SuccessorCandidate',
        stats: {
            intellect: 92,
            charm: 86,
            businessAcumen: 89,
            loyalty: 85,
            ambition: 94,
            health: 90,
            creativity: 76,
        },
        relationshipWithPlayer: 88,
        isSuccessorCandidate: true,
        traits: ['Prodigy', 'Ambitious', 'Strategic Mind'],
        allowance: 2500,
    },
    {
        id: 'child_elena_2',
        name: 'Elena Hale',
        gender: 'Female',
        age: 8,
        birthYear: 2018,
        birthQuarter: 3,
        educationLevel: 'Elementary',
        role: 'Student',
        stats: {
            intellect: 84,
            charm: 80,
            businessAcumen: 60,
            loyalty: 94,
            ambition: 70,
            health: 96,
            creativity: 91,
        },
        relationshipWithPlayer: 96,
        isSuccessorCandidate: false,
        traits: ['Creative Genius', 'Quick Learner'],
        allowance: 500,
    },
    {
        id: 'child_lucas_3',
        name: 'Lucas Hale',
        gender: 'Male',
        age: 3,
        birthYear: 2023,
        birthQuarter: 2,
        educationLevel: 'Preschool',
        role: 'Toddler',
        stats: {
            intellect: 78,
            charm: 92,
            businessAcumen: 50,
            loyalty: 98,
            ambition: 65,
            health: 99,
            creativity: 88,
        },
        relationshipWithPlayer: 100,
        isSuccessorCandidate: false,
        traits: ['Curious Explorer'],
        allowance: 200,
    },
];

export const initialFamilyState: FamilyState = {
    partner: null,
    exPartners: [],
    children: [],
    designatedSuccessorId: null,
    /**
     * FIFTY, not eighty-two.
     *
     * A dynasty's prestige at the start of a run is neither good nor bad: the
     * player has inherited a company and done nothing with it yet. Eighty-two
     * was the number that went with the family that is no longer here.
     */
    familyReputation: 50,
    _hasHydrated: false,
};

// ============================================================================
//  STORE IMPLEMENTATION
// ============================================================================

export const useFamilyStore = create<FamilyStore>()(
    persist(
        (set, get) => ({
            ...initialFamilyState,

            setHasHydrated: (v) => set({ _hasHydrated: v }),

            // --- Partner Actions ---
            setPartner: (partner) => set({ partner }),

            updatePartner: (updates) =>
                set((state) => ({
                    partner: state.partner ? { ...state.partner, ...updates } : null,
                })),

            updatePartnerStats: (updates) =>
                set((state) => ({
                    partner: state.partner
                        ? {
                              ...state.partner,
                              stats: { ...state.partner.stats, ...updates },
                          }
                        : null,
                })),

            updateLove: (amount) =>
                set((state) => {
                    if (!state.partner) return state;
                    const newLove = Math.max(0, Math.min(100, state.partner.love + amount));
                    return {
                        partner: { ...state.partner, love: newLove },
                    };
                }),

            updatePartnerLove: (delta) => get().updateLove(delta),

            marry: (hasPrenup = true) => {
                const { partner } = get();
                if (!partner || partner.isMarried) return false;
                set({
                    partner: {
                        ...partner,
                        isMarried: true,
                        hasPrenup,
                    },
                });
                return true;
            },

            breakup: (reason = 'drifted') => {
                const { partner, exPartners } = get();
                if (!partner) return null;

                const validReason = (
                    reason in BREAKUP_REASONS
                        ? reason
                        : partner.isMarried
                        ? 'divorce'
                        : 'drifted'
                ) as ExPartnerProfile['breakupReason'];

                const exPartnerRecord: ExPartnerProfile = {
                    ...partner,
                    breakupReason: validReason,
                    breakupDateAge: partner.stats.age,
                    isMarried: false,
                };

                set({
                    partner: null,
                    exPartners: [exPartnerRecord, ...exPartners],
                });

                return exPartnerRecord;
            },

            // --- Succession Children Actions ---
            addChild: (childData) => {
                const id = 'id' in childData && childData.id ? childData.id : generateId('child');
                // Ensure dynasty surname is always 'Hale'
                let formattedName = childData.name ? childData.name.trim() : 'Heir';
                if (!formattedName.endsWith('Hale')) {
                    const firstName = formattedName.split(' ')[0] || 'Heir';
                    formattedName = `${firstName} Hale`;
                }

                const newChild: Child = {
                    ...childData,
                    name: formattedName,
                    id,
                };
                set((state) => ({
                    children: [...state.children, newChild],
                }));
                return id;
            },

            updateChild: (id, updates) =>
                set((state) => ({
                    children: state.children.map((child) =>
                        child.id === id ? { ...child, ...updates } : child,
                    ),
                })),

            updateChildStats: (id, statsDelta) =>
                set((state) => ({
                    children: state.children.map((child) => {
                        if (child.id !== id) return child;
                        const updatedStats: ChildStats = { ...child.stats };
                        (Object.keys(statsDelta) as (keyof ChildStats)[]).forEach((key) => {
                            const delta = statsDelta[key];
                            if (typeof delta === 'number') {
                                updatedStats[key] = Math.max(0, Math.min(100, updatedStats[key] + delta));
                            }
                        });
                        return { ...child, stats: updatedStats };
                    }),
                })),

            removeChild: (id) =>
                set((state) => ({
                    children: state.children.filter((child) => child.id !== id),
                    designatedSuccessorId:
                        state.designatedSuccessorId === id ? null : state.designatedSuccessorId,
                })),

            setSuccessorCandidate: (id, isCandidate) =>
                set((state) => ({
                    children: state.children.map((child) =>
                        child.id === id ? { ...child, isSuccessorCandidate: isCandidate } : child,
                    ),
                })),

            designateSuccessor: (id) =>
                set((state) => ({
                    designatedSuccessorId: id,
                    children: state.children.map((child) => ({
                        ...child,
                        isSuccessorCandidate: child.id === id ? true : child.isSuccessorCandidate,
                        role:
                            child.id === id && child.age >= 16
                                ? ('SuccessorCandidate' as ChildRole)
                                : child.role,
                    })),
                })),

            adjustChildRelationship: (id, delta) =>
                set((state) => ({
                    children: state.children.map((child) => {
                        if (child.id !== id) return child;
                        const newRel = Math.max(0, Math.min(100, child.relationshipWithPlayer + delta));
                        return { ...child, relationshipWithPlayer: newRel };
                    }),
                })),

            setChildAllowance: (id, amount) =>
                set((state) => ({
                    children: state.children.map((child) =>
                        child.id === id ? { ...child, allowance: Math.max(0, amount) } : child,
                    ),
                })),

            // --- Lifecycle Simulation ---
            ageUpFamily: () =>
                set((state) => {
                    const updatedPartner = state.partner
                        ? {
                              ...state.partner,
                              relationYears: state.partner.relationYears + 1,
                              stats: {
                                  ...state.partner.stats,
                                  age: state.partner.stats.age + 1,
                              },
                          }
                        : null;

                    const updatedChildren = state.children.map((child) => {
                        const newAge = child.age + 1;
                        let educationLevel = child.educationLevel;
                        let role = child.role;

                        if (newAge >= 3 && newAge < 6) {
                            educationLevel = 'Preschool';
                            role = 'Toddler';
                        } else if (newAge >= 6 && newAge < 14) {
                            educationLevel = 'Elementary';
                            role = 'Student';
                        } else if (newAge >= 14 && newAge < 18) {
                            educationLevel = 'HighSchool';
                            role = child.isSuccessorCandidate ? 'SuccessorCandidate' : 'Student';
                        } else if (newAge >= 18 && newAge < 22) {
                            educationLevel = educationLevel === 'None' ? 'University' : educationLevel;
                            role = child.isSuccessorCandidate ? 'SuccessorCandidate' : 'Intern';
                        } else if (newAge >= 22) {
                            if (educationLevel !== 'IvyLeague') educationLevel = 'Graduated';
                            role = child.isSuccessorCandidate ? 'SuccessorCandidate' : 'Manager';
                        }

                        return {
                            ...child,
                            age: newAge,
                            educationLevel,
                            role,
                            stats: {
                                ...child.stats,
                                intellect: Math.min(100, child.stats.intellect + (newAge <= 24 ? 1 : 0)),
                                businessAcumen: Math.min(
                                    100,
                                    child.stats.businessAcumen + (child.isSuccessorCandidate ? 2 : 1),
                                ),
                            },
                        };
                    });

                    return {
                        partner: updatedPartner,
                        children: updatedChildren,
                    };
                }),

            // --- Utility ---
            reset: () => set({ ...initialFamilyState, _hasHydrated: true }),

            /**
             * Put the demo family in, for looking at the screens.
             *
             * DEV ONLY, and it refuses in a release build rather than being
             * stripped by the bundler - a function that silently does nothing
             * is easier to debug than one that is not there.
             *
             * This is the one door to that data. It used to be the front door.
             */
            loadDemoFamily: () => {
                if (!__DEV__) {
                    console.warn('[family] loadDemoFamily is a development tool.');
                    return;
                }
                set({
                    partner: DEMO_PARTNER,
                    children: DEMO_CHILDREN,
                    designatedSuccessorId: 'child_alexander_1',
                    familyReputation: 82,
                });
            },
        }),
        {
            name: 'succesor_family_v3',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                partner: state.partner,
                exPartners: state.exPartners,
                children: state.children,
                designatedSuccessorId: state.designatedSuccessorId,
                familyReputation: state.familyReputation,
            }),
            onRehydrateStorage: () => (state) => {
                if (state && Array.isArray(state.children)) {
                    state.children = state.children.map((c) => {
                        const firstName = c.name.split(' ')[0] || 'Heir';
                        return { ...c, name: `${firstName} Hale` };
                    });
                }
                state?.setHasHydrated(true);
            },
        },
    ),
);
