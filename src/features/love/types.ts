// ============================================================================
//  THESE THREE MOVED, AND THIS FILE NOW POINTS AT THEM
// ============================================================================
//  data/relationshipTypes.ts owns the whole shape of a person. It used to own
//  most of it, and this file owned the rest on a SECOND partner type - which is
//  how the game came to have two, in two stores, with three ways of setting
//  one. Re-exported rather than moved-and-fixed-up so that every existing
//  importer is unchanged.
// ============================================================================
export type {
    SocialTier,
    JobDefinition,
    PersonalityTrait,
} from '../../data/relationshipTypes';

import type { SocialTier, JobDefinition, PersonalityTrait } from '../../data/relationshipTypes';

/**
 * SHELVED — the second partner type.
 *
 * @orphan-ok-symbol Partner
 *
 * It is the one `generatePartner` used to return, and nothing that stores a
 * partner could read it: `age` and `gender` at the top level rather than in
 * `stats`, `relationshipLevel` rather than `love`, `avatar` rather than
 * `photo`, and none of the fifteen psychometric fields at all. So a partner
 * the player actually met arrived with no social class, no jealousy, no
 * network - the whole of what the relationship system is supposed to do with
 * them, missing on arrival.
 *
 * `PartnerProfile` in data/relationshipTypes.ts is the type now, and the
 * generator produces it directly. Kept because two screens still name it in
 * their prop types and the mapping is easier to check with both in view.
 */
export interface Partner {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female';
    avatar: string; // URL or ID
    job: JobDefinition;
    personality: PersonalityTrait;
    stats: {
        happiness: number;
        relationshipLevel: number; // 0-100 (Love)
        looks: number; // 0-100
        intellect: number; // 0-100
    };
    finances: {
        monthlyCost: number; // Calculated expense
    };
    isMarried: boolean;
    hasPrenup: boolean;
}

// ─────────────────────────────────────────────
//  NPC & İlişki Sistemi (Aşama 1)
// ─────────────────────────────────────────────

export type RelationType =
    | 'Mother'
    | 'Father'
    | 'Sibling'
    | 'Child'
    | 'Friend'
    | 'Partner'
    | 'Ex';

export interface NPC {
    id: string;
    name: string;
    type: RelationType;
    age: number;
    gender: 'Male' | 'Female';
    /** Yakınlık derecesi: 0-100 */
    relationship: number;
    /** Görünüm puanı: 0-100 */
    looks: number;
    /** Zeka puanı: 0-100 */
    smarts: number;
    isDeceased: boolean;
    /** Partner için çeyreklik cinsellik limit kontrolü */
    madeLoveThisQuarter?: boolean;
}
