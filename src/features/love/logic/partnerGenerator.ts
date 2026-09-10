// ============================================================================
//  IT PRODUCES THE TYPE THAT CAN BE STORED
// ============================================================================
//
//  This returned `Partner` - the second partner type - and nothing that stores
//  a partner could read it. `age` and `gender` at the top level rather than in
//  `stats`, `relationshipLevel` rather than `love`, `avatar` rather than
//  `photo`, and none of the fifteen psychometric fields at all.
//
//  So the player met somebody with no social class, no jealousy and no network:
//  the whole of what the relationship system does with a person, missing on
//  arrival, on every partner except the one hand-written demo.
//
//  `PartnerProfile` now, complete, with the psychometrics derived from the
//  personality and the tier that this file was already picking. See
//  logic/psychometrics.ts for why they are derived rather than rolled.
// ============================================================================

import { JOBS_DATABASE } from '../data/jobsData';
import { PERSONALITY_TRAITS } from '../data/personalitiesData';
import { NAME_DATABASE, namesFor } from '../data/nameData';
import type {
    Ethnicity,
    JobDefinition,
    PartnerProfile,
    SocialTier,
} from '../../../data/relationshipTypes';
import { fingerprintFor } from './psychometrics';
import { upkeepFor } from './partnerUpkeep';
import { backgroundKeyFor } from '../data/backgrounds';

/**
 * How somebody dresses, by tier. Cosmetic and stated as such.
 *
 * `style`, `looks` and `ethnicity` are the three fields in PartnerStats that
 * touch no mechanic and are not meant to. Saying so here is what stops the
 * next person wiring them to something.
 */
const STYLE_FOR_TIER: Record<SocialTier, PartnerProfile['stats']['style']> = {
    // The room above old money dresses like it has nothing to prove.
    GLOBAL_ELITE: 'Elegant',
    HIGH_SOCIETY: 'Luxury',
    CORPORATE_ELITE: 'Business',
    ARTISTIC: 'Bohemian',
    UNDERGROUND: 'Goth',
    BLUE_COLLAR: 'Casual',
    STUDENT_LIFE: 'Sporty',
};

// ============================================================================
//  SHELVED: THE SEVEN NUMBERS THAT WERE TYPED RATHER THAN DERIVED
// ============================================================================
//
//  Reported as: the partners are not rich, make them rich, and make it follow
//  prestige. These are why they were not. A student to a reigning queen is two
//  hundred times, and the GATE between those two rooms is nothing against a
//  quarter of a trillion - so the ladder of people went flat against the
//  ladder of money and stayed flat for the rest of the dynasty.
//
//  MEASURED at the moment a player stands on each gate: a GLOBAL_ELITE partner
//  cost between 0.01% and 0.04% of what the player earned that month.
//
//  logic/partnerUpkeep.ts derives all seven from `TIER_UNLOCK` and the real
//  `payCeiling` instead, so the price of the room decides the price of the
//  people in it and the two cannot drift apart again.
//
//  const TIER_BASE_COSTS: Record<SocialTier, number> = {
//      'GLOBAL_ELITE': 40000,
//      'HIGH_SOCIETY': 10000,
//      'CORPORATE_ELITE': 5000,
//      'UNDERGROUND': 2000,
//      'ARTISTIC': 800,
//      'BLUE_COLLAR': 500,
//      'STUDENT_LIFE': 200,
//  };
// ============================================================================

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ============================================================================
//  WHO WALKS IN, AND WHAT THEY ARE CALLED
// ============================================================================
//
//  The gender was `Math.random() > 0.5` and it consulted NOBODY. So a woman
//  playing this game was shown a woman half the time, forever, with no way to
//  say otherwise - and the man she was shown the other half was called Emma,
//  because the name came off a list with no men on it. See data/nameData.ts.
//
//  Reported as "kadinken date e basinca daha cok erkek gelmesi lazim hepsi
//  degil ama erkekken de arada erkek gelmeli".
//
//  MOSTLY, NOT ONLY - that is the whole request, and it is why this is a
//  probability rather than a rule. One in five is enough to be a real
//  possibility and not enough to feel random.
// ============================================================================

/** How often the person who turns up is the player's own gender. */
export const SAME_GENDER_CHANCE = 0.2;

/**
 * Which way the next candidate leans.
 *
 * `playerGender` undefined - an old save, a run started before the field -
 * falls back to the coin this used to flip, because guessing wrong on every
 * candidate is worse than not guessing at all.
 *
 * `roll` is injected so the split can be measured rather than asserted.
 */
export const partnerGenderFor = (
    playerGender: 'male' | 'female' | undefined,
    roll: number,
): 'male' | 'female' => {
    if (playerGender !== 'male' && playerGender !== 'female') {
        return roll > 0.5 ? 'female' : 'male';
    }
    const same = roll < SAME_GENDER_CHANCE;
    if (same) return playerGender;
    return playerGender === 'female' ? 'male' : 'female';
};

/**
 * Which way the player was drawn, or undefined if nothing knows.
 *
 * Read HERE rather than passed in by the four call sites, because a parameter
 * with a default is a parameter three of them will forget - and a forgotten
 * one looks exactly like the bug this is fixing. `require` inside the function
 * for the same reason useSponsorshipStore.penalty does it: this module is
 * imported by tests that have no stores.
 */
const playerGender = (): 'male' | 'female' | undefined => {
    try {
        const { useIdentityStore } = require('../../../core/store/useIdentityStore');
        const g = useIdentityStore.getState().gender;
        return g === 'male' || g === 'female' ? g : undefined;
    } catch {
        return undefined;
    }
};

/** The job's name as this particular person would say it. */
export const titleOf = (job: JobDefinition, gender?: 'male' | 'female'): string =>
    (gender && job.titleFor?.[gender]) || job.title;

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generatePartner = (forcedTier?: SocialTier): PartnerProfile => {
    // Drawn HERE rather than in the return, because the background is chosen
    // from it - see data/backgrounds.ts. A history drawn from Math.random
    // would re-roll on every render and would not be a history.
    const id = generateId();

    // 1. Pick Job (and derive Tier)
    let job: JobDefinition;

    if (forcedTier) {
        const tierJobs = JOBS_DATABASE.filter(j => j.tier === forcedTier);
        job = getRandomElement(tierJobs.length > 0 ? tierJobs : JOBS_DATABASE);
    } else {
        job = getRandomElement(JOBS_DATABASE);
    }

    // 2. Pick Personality
    const personality = getRandomElement(PERSONALITY_TRAITS);

    // 3. What they cost a month. Derived from the room's own gate rather than
    //    from a typed constant - see logic/partnerUpkeep.ts.
    const monthlyCost = upkeepFor(job.tier, personality);

    // ------------------------------------------------------------------
    //  4. WHO THEY ARE: GENDER FIRST, BECAUSE THE NAME DEPENDS ON IT
    // ------------------------------------------------------------------
    //  This used to be step SIX, three quarters of the way down the function
    //  and long after the name was decided. That ordering is the whole bug:
    //  a name cannot be chosen for a person whose gender has not been rolled
    //  yet, so it was chosen off the female list and the coin was flipped
    //  afterwards over the top of it.
    // ------------------------------------------------------------------
    const gender = partnerGenderFor(playerGender(), Math.random());

    const ethnicities = Object.keys(NAME_DATABASE) as Ethnicity[];
    const ethnicity = getRandomElement(ethnicities);
    const nameSet = namesFor(ethnicity, gender);
    const firstName = getRandomElement(nameSet.first);
    const lastName = getRandomElement(nameSet.last);

    // Age generally 18-35, but maybe depend on tier?
    // High Society might be older? Student Life younger?
    let minAge = 18;
    let maxAge = 35;
    if (job.tier === 'STUDENT_LIFE') { maxAge = 25; }
    else if (job.tier === 'CORPORATE_ELITE') { minAge = 25; maxAge = 45; }

    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

    // 5. Initial Stats. `intellect` is gone: `intelligence` is derived from
    //    the personality now and having both would be two numbers for one
    //    fact, which is how this file came to disagree with the store.
    // Random happiness 50-90
    const happiness = Math.floor(Math.random() * 41) + 50;
    // Relationship level starts at 30-50 range
    const relationshipLevel = Math.floor(Math.random() * 21) + 30;
    // Looks and Intellect ranges
    const looks = Math.floor(Math.random() * 61) + 40; // 40-100

    // --- SMART BUFF ASSIGNMENT LOGIC ---
    let buffType = job.buffType || 'STRESS_RELIEF';
    // Calculate buff value based on Tier Cost (Higher tier = Better buff)
    // Range: 1 - 15
    const tierMultiplier = {
        'GLOBAL_ELITE': 1.7,
        'HIGH_SOCIETY': 1.5,
        'CORPORATE_ELITE': 1.3,
        'UNDERGROUND': 1.2,
        'ARTISTIC': 0.9,
        'BLUE_COLLAR': 0.8,
        'STUDENT_LIFE': 0.6
    }[job.tier] || 1.0;

    let buffValue = Math.floor((Math.random() * 5 + 5) * tierMultiplier); // Base 5-10 * Multiplier
    buffValue = Math.max(1, Math.min(15, buffValue)); // Clamp to 1-15

    // Dynamic Overrides based on Stats/Personality
    // 1. Street Rep (Low Morality / High Risk)
    if ((personality.id === 'gold_digger' || personality.id === 'party') && Math.random() > 0.5) {
        buffType = 'STREET_CRED_BOOST';
    }
    // 2. Business Rep (High Ambition)
    else if (personality.id === 'ambitious' && Math.random() > 0.5) {
        buffType = 'BUSINESS_TRUST_BOOST';
    }
    // 3. High Society (Looks / Charm)
    else if (looks > 70 && Math.random() > 0.5) { // Using looks as proxy for social climbing
        buffType = 'SOCIAL_STATUS_BOOST';
    }
    // 4. Casino VIP (High Risk)
    else if (personality.id === 'party' && Math.random() > 0.7) {
        buffType = 'CASINO_VIP_BOOST';
    }
    // 5. Luck (Rare)
    else if (Math.random() < 0.05) { // 5% Chance
        buffType = 'LUCK_BOOST';
        buffValue = Math.min(5, Math.ceil(buffValue / 2)); // Luck shouldn't be too high
    }

    // Override Job if updated dynamic logic applied
    const dynamicJob = {
        ...job,
        buffType,
        buffValue
    };

    // SHELVED, not deleted: the coin this used to flip, in the place it used
    // to be flipped. It consulted nothing, which is why a woman playing the
    // game met a woman every other tap.
    //
    // // 6. Random gender
    // const gender: 'male' | 'female' = Math.random() > 0.5 ? 'female' : 'male';

    return {
        id,
        name: `${firstName} ${lastName}`,
        photo: null,
        gender,
        stats: {
            ethnicity,
            age,
            // Where they came from. A KEY, and one of five per room.
            background: backgroundKeyFor(job.tier, id),
            // An Heir and an Heiress are one job. See jobsData.titleFor.
            occupation: titleOf(job, gender),
            happiness,
            looks,
            style: STYLE_FOR_TIER[job.tier],
            // The fifteen fields that used to arrive empty.
            ...fingerprintFor(job.tier, personality),
        },
        job: dynamicJob,
        personality,
        finances: {
            monthlyCost,
        },
        // `relationshipLevel` was the old name and `love` is the one every
        // store, screen and buff reads. Same number, one name.
        love: relationshipLevel,
        relationYears: 0,
        isMarried: false,
        hasPrenup: false,
    };
};

/**
 * Generates a list of potential partners (candidates).
 */
export const generatePartnerCandidates = (count: number = 3): PartnerProfile[] => {
    return Array.from({ length: count }, () => generatePartner());
};
