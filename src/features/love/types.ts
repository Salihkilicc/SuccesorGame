export type SocialTier = 'HIGH_SOCIETY' | 'CORPORATE_ELITE' | 'UNDERGROUND' | 'BLUE_COLLAR' | 'STUDENT_LIFE' | 'ARTISTIC';

export interface JobDefinition {
    id: string;
    title: string;
    tier: SocialTier;
    buffType?: string; // e.g. 'MEDICAL_DISCOUNT'
    buffValue?: number;
}

export interface PersonalityTrait {
    id: string;
    label: string; // e.g. 'Gold Digger', 'Humble'
    costMultiplier: number; // 1.5x, 0.8x
    description: string;
}

// Full Partner Interface
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
    };
    finances: {
        monthlyCost: number; // Calculated expense
    };
    isMarried: boolean;
    hasPrenup: boolean;
}
