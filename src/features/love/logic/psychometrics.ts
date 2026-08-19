// src/features/love/logic/psychometrics.ts
//
// ============================================================================
//  A PERSON THE PLAYER MEETS HAS TO ARRIVE COMPLETE
// ============================================================================
//
//  `PartnerStats` has fifteen fields - social class, family wealth, jealousy,
//  crazy, libido, reputation, financial aid, network - and `generatePartner`
//  produced NONE of them. It returned the shelved `Partner` type, which has
//  four stats and no psychometrics at all.
//
//  So the whole relationship system was reading fields that only ever existed
//  on one hand-written demo partner. Every partner the player actually met was
//  blank in exactly the places the system does its work, and the symptom would
//  have been "the buffs do nothing" rather than anything that looks like a bug.
//
//  ---------------------------------------------------------------------------
//  DERIVED, NOT ROLLED
//  ---------------------------------------------------------------------------
//  The obvious fix is fifteen random numbers. That produces a Corporate Shark
//  with no network and a Loyal Confidante who is dangerous, and the player
//  cannot learn anything from a label that does not predict behaviour.
//
//  So: a baseline from the TIER (where they live, what their family has) and a
//  fingerprint from the PERSONALITY (who they are), with a little jitter so two
//  Power Brokers are not identical. The label on the card is a promise about
//  the numbers behind it.
// ============================================================================

import type {
    PartnerStats,
    PersonalityTrait,
    SocialClass,
    SocialTier,
} from '../../../data/relationshipTypes';

// ---------------------------------------------------------------------------
//  THREE FIELDS BELONG TO BOTH THE ROOM AND THE PERSON
// ---------------------------------------------------------------------------
//  The first draft let the personality REPLACE the tier's value on every
//  field, and two tests caught what that produces:
//
//    An Old-Money Elegance student had the same family wealth as an Old-Money
//    Elegance heiress, because `sophisticated` set 95 and the tier stopped
//    mattering.
//
//    A Loyal Confidante from the criminal tier cost you NOTHING to be seen
//    with, because `supportive` set +6 over the tier's -12 - so the one trade
//    that tier exists to offer was cancelled by being nice.
//
//  `familyWealth`, `reputationBuff` and `networkPower` are properties of where
//  somebody comes from AND of who they are. For those the personality is an
//  OFFSET. Jealousy, crazy, libido, intelligence and financial aid are the
//  person alone, and there the personality is the answer.
// ---------------------------------------------------------------------------

/** The fields a personality states outright. */
type Traits = {
    jealousy: number;
    crazy: number;
    libido: number;
    intelligence: number;
    financialAidChance: number;
};

/** The fields a personality only leans on. Added to the tier's baseline. */
type Nudges = Partial<{
    familyWealth: number;
    reputationBuff: number;
    networkPower: number;
}>;

type Fingerprint = Traits & Nudges;

/**
 * Where a tier puts somebody, socially.
 *
 * The two vocabularies were never reconciled: `SocialTier` is where you meet
 * them and `SocialClass` is what the game does about it. One table, here,
 * rather than a guess at each call site.
 */
export const CLASS_FOR_TIER: Record<SocialTier, SocialClass> = {
    HIGH_SOCIETY: 'OldMoney',
    CORPORATE_ELITE: 'HighSociety',
    ARTISTIC: 'MiddleClass',
    UNDERGROUND: 'CriminalElite',
    BLUE_COLLAR: 'WorkingClass',
    STUDENT_LIFE: 'WorkingClass',
};

/**
 * What the tier gives everybody in it, before personality.
 *
 * Family wealth and network are properties of the room, not of the person, so
 * they belong here. Everything else is who they are and belongs below.
 */
const TIER_BASE: Record<SocialTier, Required<Nudges>> = {
    HIGH_SOCIETY: { familyWealth: 85, networkPower: 55, reputationBuff: 10 },
    CORPORATE_ELITE: { familyWealth: 50, networkPower: 65, reputationBuff: 8 },
    ARTISTIC: { familyWealth: 25, networkPower: 30, reputationBuff: 4 },
    // The one tier where the reputation is a penalty. Being seen with them is
    // the cost and the network is real anyway, which is the whole trade this
    // class exists to offer. Deep enough that no personality can cancel it.
    UNDERGROUND: { familyWealth: 35, networkPower: 50, reputationBuff: -22 },
    BLUE_COLLAR: { familyWealth: 15, networkPower: 15, reputationBuff: 0 },
    STUDENT_LIFE: { familyWealth: 20, networkPower: 10, reputationBuff: 2 },
};

/**
 * Who they are, on top of where they live.
 *
 * Every personality in PERSONALITY_TRAITS has an entry. A missing one would
 * mean a partner with tier numbers and no character, which is the failure this
 * file exists to end - so `fingerprintFor` throws rather than falling back.
 */
const PERSONALITY_FINGERPRINT: Record<string, Fingerprint> = {
    // Influence is the whole of him. Nothing to give you but the room.
    power_broker: { networkPower: +30, jealousy: 35, crazy: 30, libido: 45, financialAidChance: 10, intelligence: 70 },
    // Old money. The family is the asset and the discretion is real.
    sophisticated: { familyWealth: +12, reputationBuff: +8, intelligence: 85, jealousy: 25, crazy: 20, libido: 40, financialAidChance: 40 },
    // Wants what you want and will take it from you if that is quicker.
    corporate_shark: { networkPower: +20, jealousy: 60, crazy: 55, intelligence: 80, libido: 55, financialAidChance: 5 },
    // The expensive one. High jealousy, high crazy, and nothing comes back.
    gold_digger: { jealousy: 85, crazy: 90, libido: 70, financialAidChance: 0, reputationBuff: -6, intelligence: 45 },
    visionary: { intelligence: 92, networkPower: +5, jealousy: 20, crazy: 35, libido: 50, financialAidChance: 15 },
    // Public legacy, so the reputation is the point and the money is real.
    philanthropist: { reputationBuff: +14, networkPower: +15, financialAidChance: 45, jealousy: 20, crazy: 15, libido: 40, intelligence: 78 },
    hedonist: { libido: 90, jealousy: 40, crazy: 60, reputationBuff: -9, financialAidChance: 5, intelligence: 55 },
    ambitious: { networkPower: +8, jealousy: 55, crazy: 45, intelligence: 72, libido: 60, financialAidChance: 10 },
    // The one who is worth having. Low everything dangerous, high help.
    supportive: { jealousy: 15, crazy: 10, libido: 55, financialAidChance: 55, reputationBuff: +3, intelligence: 70 },
    frugal: { jealousy: 25, crazy: 20, libido: 45, financialAidChance: 50, reputationBuff: +1, intelligence: 74 },
};

/** ±6, so two Power Brokers are not the same person. */
const JITTER = 6;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

/**
 * The psychometric half of a partner.
 *
 * `looks` is NOT here: it is generated alongside the name and the age, and it
 * is the one number in this set that is not a consequence of who somebody is.
 */
export const fingerprintFor = (
    tier: SocialTier,
    personality: PersonalityTrait,
    /** Injected in tests. The game passes nothing. */
    roll: () => number = Math.random,
): Omit<PartnerStats, 'ethnicity' | 'age' | 'occupation' | 'style' | 'looks' | 'happiness'> => {
    const trait = PERSONALITY_FINGERPRINT[personality.id];
    if (!trait) {
        // Loud, because the alternative is a partner with no character and no
        // sign that anything went wrong. See the note above.
        throw new Error(`No psychometric fingerprint for personality "${personality.id}"`);
    }

    const room = TIER_BASE[tier];
    const jitter = (v: number) => v + (roll() * 2 - 1) * JITTER;

    return {
        socialClass: CLASS_FOR_TIER[tier],

        // The person, stated outright.
        intelligence: clamp(jitter(trait.intelligence)),
        jealousy: clamp(jitter(trait.jealousy)),
        crazy: clamp(jitter(trait.crazy)),
        libido: clamp(jitter(trait.libido)),
        financialAidChance: clamp(jitter(trait.financialAidChance)),

        // The room, leaned on by the person.
        familyWealth: clamp(jitter(room.familyWealth + (trait.familyWealth ?? 0))),
        networkPower: clamp(jitter(room.networkPower + (trait.networkPower ?? 0))),
        // The only one allowed to go negative: being seen with some people
        // costs you. Clamped to a band rather than to 0-100.
        reputationBuff: clamp(
            jitter(room.reputationBuff + (trait.reputationBuff ?? 0)), -25, 30,
        ),
    };
};

/** Every personality has a fingerprint. Read by the test that enforces it. */
export const FINGERPRINTED_PERSONALITIES = Object.keys(PERSONALITY_FINGERPRINT);
