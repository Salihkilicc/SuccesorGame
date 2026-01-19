// ============================================================================
// GYM DATA & TYPES
// Data Layer: Contains strict type definitions and constant values.
// NO GAME LOGIC HERE.
// ============================================================================

export type GymViewType = 'HUB' | 'MEMBERSHIP' | 'MARTIAL_ARTS' | 'TRAINER' | 'SUPPLEMENTS' | 'WORKOUT';
export type BodyType = 'Skinny' | 'Fit' | 'Muscular' | 'Godlike';
export type MembershipTier = 'STANDARD' | 'TITANIUM';
export type MartialArtStyle = 'boxing' | 'mma' | 'muaythai' | 'bjj' | 'karate';
export type BeltRank = 0 | 1 | 2 | 3 | 4 | 5; // White -> Black
export type TrainerTier = 'none' | 'rookie' | 'local' | 'influencer' | 'legend';
export type WorkoutType = 'Yoga' | 'Weights' | 'Running' | 'Pilates';
export type SupplementType = 'protein' | 'creatine' | 'steroids';

export interface GymStats {
    fatigue: number; // 0-100
    bodyType: BodyType;
}

export interface GymMartialArts {
    style: MartialArtStyle | null;
    rank: BeltRank;
    progress: number;
    lastTrainedQ: number;
    title: string;
}

export interface GymInventory {
    protein: number;
    creatine: number;
    steroids: number;
}

export const BELT_TITLES: Record<BeltRank, string> = {
    0: 'White Belt',
    1: 'Blue Belt',
    2: 'Purple Belt',
    3: 'Brown Belt',
    4: 'Black Belt',
    5: 'Grandmaster',
};

export const MEMBERSHIP_PRICING = {
    STANDARD: { annual: 2500, monthly: 250 },
    TITANIUM: { annual: 50000, monthly: 5000, req: 'Godlike' },
} as const;

export const TRAINER_COSTS: Record<TrainerTier, number> = {
    none: 0,
    rookie: 50,
    local: 200,
    influencer: 1000,
    legend: 10000,
};

export const TRAINER_MULTIPLIERS: Record<TrainerTier, number> = {
    none: 1.0,
    rookie: 1.1,
    local: 1.5,
    influencer: 2.5,
    legend: 5.0,
};

export const FATIGUE_CONSTANTS = {
    WORKOUT_COST: 15,
    MARTIAL_ARTS_COST: 45,
    LIMIT: 80
};
