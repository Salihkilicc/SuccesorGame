export type EducationType = 'certificate' | 'degree' | 'master' | 'phd';

export interface StatImpact {
    statId: string; // e.g., 'digitalShield', 'intellect', 'businessTrust', etc.
    value: number;
}

export interface EducationRequirements {
    minIntelligence?: number;
    requiredDegreeId?: string; // Prerequisite degree ID
}

export interface EducationBenefits {
    intelligenceBonus: number;
    salaryMultiplier: number;
}

export interface EducationItem {
    id: string;
    title: string;
    type: EducationType;
    field: string; // e.g., 'Technology', 'Business', 'Health'
    cost: number;
    isMonthlyCost: boolean; // True for degrees (tuition), False for certificates (one-time)
    durationQuarter: number; // How many turns (quarters) to complete
    requirements: EducationRequirements;
    benefits: EducationBenefits;
    quarterlyBonuses: StatImpact[]; // Stats gained every quarter while enrolled
    completionBonuses: StatImpact[]; // Stats gained upon graduation
    salaryMultiplier?: number; // Multiplier for monthly salary (e.g., 1.2 = +20%). Only for academic degrees.
}

