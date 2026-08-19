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
    MarriageProposalResult,
    BREAKUP_REASONS,
} from '../../data/relationshipTypes';
import { useStatsStore } from './useStatsStore';

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
    /**
     * WHICH ROOMS ARE COOL ON YOU, AND UNTIL WHEN.
     *
     * Keyed by SocialTier, valued with the quarter the door opens again. A
     * refusal that costs nothing is a re-roll, and a player who can tap again
     * immediately will tap until it lands.
     *
     * On the TIER rather than the person: candidates are generated fresh every
     * time and their ids mean nothing, so remembering an individual would
     * remember nobody. Being knocked back at a level and finding that level
     * cooler for a while is the truer version anyway - word gets around a
     * small room.
     */
    courtshipCooldown: Partial<Record<string, number>>;
    exPartners: ExPartnerProfile[];
    children: Child[];
    designatedSuccessorId: string | null;
    familyReputation: number;       // 0-100 Dynasty prestige
    /**
     * Which generation is in the chair. The founder is 1.
     *
     * Here rather than in useGameStore because it is a fact about the FAMILY,
     * and because it must be wiped by a new game and carried by a succession -
     * which is exactly the line this store already sits on.
     */
    generation: number;
    /**
     * The parent who outlived the last chief executive.
     *
     * Set by a succession and never by anything else. She holds no stock (see
     * inheritance.ts) so she is not on the register, and without this she would
     * simply cease to exist at the moment she became the most interesting
     * person in the family.
     */
    survivingParent: { name: string; age: number } | null;
    _hasHydrated: boolean;
}

export interface FamilyActions {
    setHasHydrated: (v: boolean) => void;

    // --- Partner Actions ---
    setPartner: (partner: PartnerProfile | null) => void;
    updatePartner: (updates: Partial<PartnerProfile>) => void;
    updatePartnerStats: (updates: Partial<PartnerStats>) => void;
    updateLove: (amount: number) => void;
    /**
     * Alias for `updateLove`.
     *
     * @orphan-ok-symbol updatePartnerLove
     *
     * LoveScreen was the only caller and LoveScreen is shelved - the
     * relationship system lives inside Profile now. Kept because it is one
     * line and because a store with two names for one action is a smaller
     * problem than a screen that has to remember which one this store uses.
     */
    updatePartnerLove: (delta: number) => void;
    marry: (hasPrenup?: boolean) => boolean;
    /**
     * Ask, and find out. Moved here from useUserStore, which held the only
     * real version of it while this store held the only real partner.
     */
    proposeMarriage: (withPrenup: boolean, locationBonus?: number) => MarriageProposalResult;
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
    /** A room has said no. See `courtshipCooldown`. */
    noteRefusal: (tier: string, untilQuarter: number) => void;
}

export type FamilyStore = FamilyState & FamilyActions;

// ============================================================================
//  INITIAL DATA / PLACEHOLDERS
// ============================================================================

const generateId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

// ============================================================================
//  THE FOUR NUMBERS THE PARTNER SYSTEM ACTUALLY TURNS ON
// ============================================================================

/** Half of what the player owns personally. See `breakup`. */
export const DIVORCE_SHARE = 0.5;

/**
 * How much a prenup costs you before intelligence is counted.
 *
 * Thirty points off a love score of a hundred. Asking somebody who adores you
 * to sign is still a real question; asking somebody who does not is a no.
 */
export const PRENUP_BASE_RESISTANCE = 30;

/**
 * And how much their intelligence adds to it.
 *
 * Five, so a partner at 100 intelligence adds twenty more points of
 * resistance. It is the one line in relationshipTypes.ts that describes a
 * psychometric field doing something, and it was doing it in the store nobody
 * wrote a partner into.
 */
export const PRENUP_INTELLIGENCE_DIVISOR = 5;

/** What a refusal takes off, so asking is not free. Doubled with a prenup. */
export const PROPOSAL_REFUSAL_COST = 4;

/**
 * Whose family will not allow a marriage without one.
 *
 * Their decision, not the player's and not the partner's, which is the point
 * of having social class as a field at all.
 */
export const FORCED_PRENUP_CLASSES: SocialClass[] = ['Royalty', 'BillionaireHeir'];

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
    courtshipCooldown: {},
    exPartners: [],
    children: [],
    designatedSuccessorId: null,
    generation: 1,
    survivingParent: null,
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

            // ------------------------------------------------------------------
            //  ASKING IS A MECHANIC. MARRYING IS A SETTER.
            // ------------------------------------------------------------------
            //  This lived in useUserStore, which is where the second partner
            //  was - so the store with the real partner had a dumb `marry`
            //  and the store with no partner had the interesting question.
            //
            //  The interesting part is `intelligence`: a clever partner is
            //  harder to talk into a prenup, which is the one line in
            //  relationshipTypes.ts that describes a field doing something.
            //  It was doing it in the store nobody wrote a partner into.
            //
            //  It does NOT set state on success. The caller confirms, then
            //  calls `marry` - so a player can be accepted and still walk out
            //  of the room.
            // ------------------------------------------------------------------
            proposeMarriage: (withPrenup, locationBonus = 0) => {
                const { partner } = get();
                if (!partner) {
                    return { success: false, message: 'You need a partner to propose marriage.' };
                }
                if (partner.isMarried) {
                    return { success: false, message: 'You are already married.' };
                }

                // Base chance is how much they love you. Everything else is
                // what you are asking them to sign.
                const prenupPenalty = withPrenup
                    ? PRENUP_BASE_RESISTANCE + partner.stats.intelligence / PRENUP_INTELLIGENCE_DIVISOR
                    : 0;
                const finalChance = partner.love - prenupPenalty + locationBonus;

                // Some people do not get to marry without one, whatever the
                // player chooses. Their family decides, not them.
                const forcedPrenup = FORCED_PRENUP_CLASSES.includes(partner.stats.socialClass);
                const actualPrenup = withPrenup || forcedPrenup;

                if (Math.random() * 100 <= finalChance) {
                    return {
                        success: true,
                        message: forcedPrenup && !withPrenup
                            ? `${partner.name} said yes, and their family insisted on a prenup.`
                            : actualPrenup
                                ? `${partner.name} said yes, and signed.`
                                : `${partner.name} said yes.`,
                    };
                }

                // A refusal costs something, or asking is free and the player
                // asks every quarter until it lands.
                const loveChange = withPrenup ? -PROPOSAL_REFUSAL_COST * 2 : -PROPOSAL_REFUSAL_COST;
                get().updateLove(loveChange);
                return {
                    success: false,
                    message: withPrenup
                        ? `${partner.name} said no, and it was the paperwork they said no to.`
                        : `${partner.name} said no. Not yet, anyway.`,
                    loveChange,
                };
            },

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

                // ------------------------------------------------------
                //  AND THIS IS WHERE THE MONEY GOES
                // ------------------------------------------------------
                //  Half of the player's personal wealth, if they married
                //  without a prenup. It is the single best field in this
                //  whole system - a real decision with a real price - and
                //  it was implemented in useUserStore.breakUp, against the
                //  partner that store never had.
                //
                //  So the prenup protected a partner nobody was seeing,
                //  and breaking up with the real one cost nothing.
                //
                //  PERSONAL cash, not company capital. A divorce takes what
                //  the player owns, not what the shareholders do.
                // ------------------------------------------------------
                if (partner.isMarried && !partner.hasPrenup) {
                    const stats = useStatsStore.getState();
                    const settlement = (stats.money || 0) * DIVORCE_SHARE;
                    stats.setField('money', (stats.money || 0) - settlement);
                    if (__DEV__) {
                        console.log(`[family] divorce settlement: ${Math.round(settlement)}`);
                    }
                }

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

            noteRefusal: (tier, untilQuarter) =>
                set(state => ({
                    courtshipCooldown: { ...state.courtshipCooldown, [tier]: untilQuarter },
                })),

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
                courtshipCooldown: state.courtshipCooldown,
                generation: state.generation,
                survivingParent: state.survivingParent,
            }),
            onRehydrateStorage: () => (state) => {
                // Saves written before a succession existed have neither
                // field, and zustand persist MERGES - so the initial values
                // do not survive a partial rehydrate and `generation` would
                // arrive as undefined into every ordinal on the closing
                // screen.
                if (state && typeof state.generation !== 'number') state.generation = 1;
                if (state && state.survivingParent === undefined) state.survivingParent = null;
                // A save from before the two stores became one may have the
                // player's partner in the other key. See `migrateLegacyPartner`.
                migrateLegacyPartner();

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

// ============================================================================
//  MOVING A PARTNER OUT OF THE STORE THAT NO LONGER HOLDS ONE
// ============================================================================
//
//  Saves written before this migration have the player's partner in
//  `useUserStore.partner`, because that is where the encounter screens wrote.
//  Losing them on upgrade would be the migration doing more damage than the
//  bug it fixes.
//
//  IDEMPOTENT AND ORDER-INDEPENDENT, which is the whole design. Both stores
//  hydrate asynchronously and neither can wait for the other, so this is
//  called from BOTH `onRehydrateStorage` callbacks and whichever lands second
//  is the one that does the work. It refuses if this store already has a
//  partner, so it can never overwrite a real one.
//
//  The source is cleared afterwards. A partner in two places is what this
//  whole step exists to end, and leaving the old copy behind would make the
//  next reader choose.
// ============================================================================
export const migrateLegacyPartner = (): boolean => {
    try {
        const family = useFamilyStore.getState();
        if (family.partner) return false;

        // Required lazily: useUserStore imports from this module's neighbours
        // and a top-level import here closes the cycle.
        const { useUserStore } = require('./useUserStore');
        const legacy = useUserStore.getState().partner;
        if (!legacy) return false;

        family.setPartner(legacy);
        useUserStore.setState({ partner: null });
        if (__DEV__) console.log(`[family] migrated partner "${legacy.name}" from useUserStore.`);
        return true;
    } catch {
        // A migration that throws on launch is worse than one that does not
        // run: the player would lose the app rather than a partner.
        return false;
    }
};
