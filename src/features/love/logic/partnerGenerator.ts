import { Partner, SocialTier, JobDefinition, PersonalityTrait } from '../types';
import { JOBS_DATABASE } from '../data/jobsData';
import { PERSONALITY_TRAITS } from '../data/personalitiesData';
import { NAME_DATABASE } from '../data/nameData';
import { Ethnicity } from '../../../data/relationshipTypes';

const TIER_BASE_COSTS: Record<SocialTier, number> = {
    'HIGH_SOCIETY': 10000,
    'CORPORATE_ELITE': 5000,
    'UNDERGROUND': 2000,
    'ARTISTIC': 800,
    'BLUE_COLLAR': 500,
    'STUDENT_LIFE': 200,
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generatePartner = (forcedTier?: SocialTier): Partner => {
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

    // 3. Calculate Cost
    const baseCost = TIER_BASE_COSTS[job.tier];
    const monthlyCost = Math.floor(baseCost * personality.costMultiplier);

    // 4. Generate Name & Age
    const ethnicities = Object.keys(NAME_DATABASE) as Ethnicity[];
    const ethnicity = getRandomElement(ethnicities);
    const nameSet = NAME_DATABASE[ethnicity];
    const firstName = getRandomElement(nameSet.first);
    const lastName = getRandomElement(nameSet.last);

    // Age generally 18-35, but maybe depend on tier?
    // High Society might be older? Student Life younger?
    let minAge = 18;
    let maxAge = 35;
    if (job.tier === 'STUDENT_LIFE') { maxAge = 25; }
    else if (job.tier === 'CORPORATE_ELITE') { minAge = 25; maxAge = 45; }

    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

    // 5. Initial Stats
    // Random happiness 50-90
    const happiness = Math.floor(Math.random() * 41) + 50;
    // Relationship level starts at 30-50 range
    const relationshipLevel = Math.floor(Math.random() * 21) + 30;

    // 6. Random gender
    const gender: 'male' | 'female' = Math.random() > 0.5 ? 'female' : 'male';

    return {
        id: generateId(),
        name: `${firstName} ${lastName}`,
        age,
        gender,
        avatar: '', // Placeholder
        job,
        personality,
        stats: {
            happiness,
            relationshipLevel,
        },
        finances: {
            monthlyCost,
        },
        isMarried: false,
        hasPrenup: false,
    };
};

/**
 * Generates a list of potential partners (candidates).
 */
export const generatePartnerCandidates = (count: number = 3): Partner[] => {
    return Array.from({ length: count }, () => generatePartner());
};
