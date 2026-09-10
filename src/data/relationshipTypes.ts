// ============================================================================
// CORE RELATIONSHIP ENGINE - TYPE DEFINITIONS
// ============================================================================
// This module contains all type definitions for the relationship simulation
// system, designed as a detailed RPG-style mechanic with cultural diversity,
// social hierarchy, psychometrics, and gameplay buffs.

// 1. ETHNICITY ARCHETYPES (12+ Cultural Diversity)
// These types feed into future 'Cultural Event' systems and AI image generation
export type Ethnicity =
    | 'Caucasian'
    | 'Latina'
    | 'EastAsian'
    | 'SouthAsian'
    | 'MiddleEastern'
    | 'Slavic'
    | 'Scandinavian'
    | 'Mediterranean'
    | 'AfricanAmerican'
    | 'Caribbean'
    | 'RoyalEuropean'
    | 'PacificIslander'
    | 'Mixed';

// 2. SOCIAL HIERARCHY (Impact on Game Economy)
// Each tier provides unique bonuses and gameplay mechanics
export type SocialClass =
    | 'Underclass'        // Bonus: Black Market access
    | 'WorkingClass'      // Standard tier
    | 'MiddleClass'       // Standard tier
    | 'HighSociety'       // Bonus: Party & Network events
    | 'OldMoney'          // Bonus: Low-interest loans, high reputation
    | 'BillionaireHeir'   // Bonus: Cash aid probability
    | 'Royalty'           // Bonus: Max reputation, immunity
    | 'CriminalElite';    // Bonus: Protection. Risk: Prison/Death

// 2b. WHERE SOMEBODY MET YOU, AND WHAT THEY DO
// ----------------------------------------------------------------------------
//  These three lived in features/love/types.ts, on a SECOND partner type that
//  the generator produced and nothing else could read. They move here because
//  this file is meant to be the whole shape of a person, and a shape split
//  across two files is how the game ended up with two of them.
//
//  features/love/types.ts re-exports them, so every existing importer is
//  unchanged.
// ----------------------------------------------------------------------------
export type SocialTier =
    // ------------------------------------------------------------------
    //  THE ROOM ABOVE OLD MONEY
    // ------------------------------------------------------------------
    //  HIGH_SOCIETY opened at five billion and was the top, so a player worth
    //  five billion and a player worth two trillion met exactly the same
    //  people. The dynasty outgrows its own dating pool by the second
    //  generation and then has nowhere left to climb.
    //
    //  GLOBAL_ELITE is the answer: a quarter of a trillion to be seen at all,
    //  and the people in it are heads of houses rather than members of them.
    //  See love/logic/courtship.ts TIER_UNLOCK for the gate and
    //  love/data/jobsData.ts for who is in the room.
    // ------------------------------------------------------------------
    | 'GLOBAL_ELITE'
    | 'HIGH_SOCIETY'
    | 'CORPORATE_ELITE'
    | 'UNDERGROUND'
    | 'BLUE_COLLAR'
    | 'STUDENT_LIFE'
    | 'ARTISTIC';

export interface JobDefinition {
    id: string;
    title: string;
    /**
     * When the job's own name is gendered.
     *
     * Two of them are: an Heir and an Heiress are the same job. `title` stays
     * the default and the one every existing reader sees; this is consulted
     * only when a gender is known. See love/logic/partnerGenerator.titleOf.
     */
    titleFor?: Partial<Record<'male' | 'female', string>>;
    tier: SocialTier;
    buffType?: string;
    buffValue?: number;
}

export interface PersonalityTrait {
    id: string;
    label: string;
    /** What they cost, against the tier's base. 0.6 frugal, 2.5 ruinous. */
    costMultiplier: number;
    description: string;
}

// 3. PARTNER DNA MATRIX (AI Context Data)
// Comprehensive stats that define partner behavior and gameplay impact
export type PartnerStats = {
    // === Identity ===
    ethnicity: Ethnicity;
    age: number;
    occupation: string;
    /**
     * HOW THEY ARE, as opposed to how they feel about you.
     *
     * `love` is the relationship; this is the person. It was on the shelved
     * `Partner` type and had no home here, which is why a generated partner
     * lost it the moment anything tried to store them properly.
     *
     * OPTIONAL, for the same reason `gender` is: every save and every
     * hand-written partner predates it and has no happiness to migrate.
     * Required would mean a migration on read for data that cannot supply it.
     */
    happiness?: number;

    /**
     * WHERE THEY CAME FROM, as an i18n KEY rather than as a sentence.
     *
     * `bg.<tier>.<n>`. A key rather than the rendered line because a player who
     * changes language would otherwise carry a partner whose history is frozen
     * in the old one, and because a raw English sentence in a data file is the
     * one place scripts/untranslated.js cannot see - it reads .tsx only.
     *
     * OPTIONAL, like `happiness` and `gender` above and for the same reason:
     * every save and every hand-written partner predates it. See
     * features/love/data/backgrounds.ts.
     */
    background?: string;

    // === Visuals & Style (UI and AI Image Generation) ===
    looks: number; // 0-100 (affects initial attraction)
    style: 'Elegant' | 'Casual' | 'Goth' | 'Business' | 'Sporty' | 'Luxury' | 'Bohemian';

    // === Socio-Economic Background ===
    socialClass: SocialClass;
    familyWealth: number; // 0-100 (100 = Multi-Billionaire)

    // === Psychometrics (Behavior Determinants) ===
    intelligence: number;  // 0-100 (Reduces prenup acceptance chance)
    jealousy: number;      // 0-100 (Determines reaction severity to cheating)
    crazy: number;         // 0-100 (Post-breakup revenge probability)
    libido: number;        // 0-100 (Relationship frequency & happiness boost)

    // === Gameplay Buffs (Passive Effects) ===
    reputationBuff: number;      // +/- Reputation impact while in relationship
    financialAidChance: number;  // 0-100 (Probability of giving money)
    networkPower: number;        // 0-100 (Career advancement bonus)
};

// 4. MAIN PARTNER PROFILE
// Complete partner data structure with relationship status
export type PartnerProfile = {
    id: string;
    name: string;
    photo: string | null;
    /**
     * OPTIONAL, and that is a migration decision rather than a modelling one.
     *
     * The demo partner and every save written before this have no gender
     * field. Required would mean a migration on read for data that has no
     * gender to migrate; the screens fall back the way they already did.
     */
    gender?: 'male' | 'female';
    stats: PartnerStats;

    /**
     * What sort of person they are. From PERSONALITY_TRAITS.
     *
     * This is where the money comes from - `costMultiplier` against the tier
     * base is the whole of `finances.monthlyCost` - and under the full life
     * sim it is also what the psychometrics are derived from. See
     * features/love/logic/psychometrics.ts.
     */
    personality?: PersonalityTrait;

    // === Deep Persona Extension ===
    job?: {
        /**
         * WHICH job, as opposed to what it was called in English.
         *
         * `generatePartner` has always spread the whole JobDefinition in here,
         * so this field has existed in every stored partner since the
         * beginning - it was simply not DECLARED, and a field the type does
         * not admit to is a field nothing can read.
         *
         * Optional because the hand-written demo partner has no id, and
         * because a save is allowed to be older than this line. Every reader
         * falls back to `title`. See features/love/logic/partnerText.ts.
         */
        id?: string;
        title: string;
        titleFor?: Partial<Record<'male' | 'female', string>>;
        tier: string;
        buffType?: string;
        buffValue?: number;
    };
    finances?: {
        monthlyCost: number;
    };

    // === Relationship Status ===
    love: number;           // 0-100 (Current relationship strength)
    relationYears: number;  // Years/months together
    isMarried: boolean;     // Marriage status
    hasPrenup: boolean;     // CRITICAL: Protects money in divorce
};

// 5. EX-PARTNER HISTORY
// Tracks past relationships with breakup context
export type ExPartnerProfile = PartnerProfile & {
    breakupReason: 'cheated' | 'drifted' | 'money' | 'divorce' | 'family_pressure' | 'boring';
    breakupDateAge: number; // Player's age at breakup
};

// 6. BREAKUP REASONS (For UI Display)
export const BREAKUP_REASONS = {
    cheated: 'Caught cheating',
    drifted: 'Grew apart',
    money: 'Financial disagreements',
    divorce: 'Divorce',
    family_pressure: 'Family pressure',
    boring: 'Lost the spark',
} as const;

// 7. MARRIAGE PROPOSAL RESULT
// Return type for marriage proposal attempts
export type MarriageProposalResult = {
    success: boolean;
    message: string;
    loveChange?: number; // Only present if rejected
};
