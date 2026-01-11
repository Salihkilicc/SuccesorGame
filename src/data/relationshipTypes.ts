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

// 3. PARTNER DNA MATRIX (AI Context Data)
// Comprehensive stats that define partner behavior and gameplay impact
export type PartnerStats = {
    // === Identity ===
    ethnicity: Ethnicity;
    age: number;
    occupation: string;

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
    stats: PartnerStats;

    // === Deep Persona Extension ===
    job?: {
        title: string;
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
