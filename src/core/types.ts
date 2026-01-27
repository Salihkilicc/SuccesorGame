// src/data/types.ts

// --- Feature Imports ---
// (Eğer productsData dosyan yoksa bu satırı silebilirsin, ama var görünüyor)
import { Product, ProductStatus } from '../features/products/data/productsData';
import {
    Ethnicity,
    SocialClass,
    PartnerStats,
    PartnerProfile,
    ExPartnerProfile,
    MarriageProposalResult,
    BREAKUP_REASONS,
} from '../data/relationshipTypes';

// --- Re-Exports ---
export type { Product, ProductStatus };
export type {
    Ethnicity,
    SocialClass,
    PartnerStats,
    PartnerProfile,
    ExPartnerProfile,
    MarriageProposalResult,
};
export { BREAKUP_REASONS };

// ==========================================
// 🧠 HUB & SPOKE: MASTER PLAYER TYPES
// ==========================================

// 1. CORE VITALS (Temel Yaşam)
export interface CoreStats {
    health: number;      // 0-100
    happiness: number;   // 0-100
    stress: number;      // 0-100
    money: number;       // Kişisel Cüzdan
    netWorth: number;    // Toplam Varlık
}

// 2. ATTRIBUTES (Genetik ve Gelişim)
export interface Attributes {
    intellect: number;   // 0-100
    charm: number;       // 0-100
    looks: number;       // 0-100
    strength: number;    // 0-100
}

// 3. PERSONALITY (Karakter)
export interface Personality {
    riskAppetite: number; // 0-100
    strategicSense: number; // 0-100
    morality: number;     // 0-100
    ambition: number;     // 0-100
}

// 4. REPUTATION NETWORK (İtibar Ağı - YENİ)
export interface Reputation {
    social: number;      // High Society
    street: number;      // Underground / Crime
    business: number;    // Corporate World
    police: number;      // Heat Level (0-100)
    casino: number;      // VIP Status
}

// 5. SECURITY & SURVIVAL (Güvenlik - YENİ)
export interface SecurityState {
    digital: number;     // Hacklenmeme oranı %
    personal: number;    // Fiziksel koruma oranı %
}

// 6. SKILLS (Yetenekler - YENİ)
export interface MartialArtsSkill {
    belt: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Black';
    progress: number;
    level: number;
}

export interface SkillsState {
    martialArts: MartialArtsSkill;
}

// 7. ACTION FLAGS (Çeyrek Hakları - YENİ)
export interface QuarterlyActions {
    hasStudied: boolean;
    hasTrained: boolean;
    hasDated: boolean;
    hasGambled?: boolean;
    hasSocialized?: boolean;
}

// 8. EDUCATION STATE
export interface ActiveEnrollment {
    programId: string;
    currentYear: number;
    progress: number;
}

export interface EducationState {
    activeEnrollment: ActiveEnrollment | null;
    completedEducation: string[];
}

// 9. HIDDEN / META STATS (Eksik olan buydu - EKLENDİ)
export interface HiddenStats {
    luck: number;
    security: number; // Legacy support
}