

export interface EducationBuffs {
    salaryMultiplier?: number;
    statBoost?: {
        intellect?: number;
        charm?: number;
        looks?: number;
        strength?: number; // Added strength
        [key: string]: number | undefined;
    };
}

export type ProgramType = 'degree' | 'certificate' | 'postgrad';

export interface EducationProgram {
    id: string;
    name: string;
    type: ProgramType;
    costPerYear: number; // Total cost for certificates
    durationYears: number;
    reqIntellect: number;
    prerequisite?: string;
    buffs: EducationBuffs;
}

export interface EducationData {
    degrees: EducationProgram[];
    postgrad: EducationProgram[];
    certificates: EducationProgram[];
}

export const EDUCATION_DATA: EducationData = {
    degrees: [
        {
            id: 'bs_cs',
            name: 'Computer Science',
            type: 'degree',
            costPerYear: 15000,
            durationYears: 4,
            reqIntellect: 50,
            buffs: { salaryMultiplier: 1.6, statBoost: { intellect: 15 } },
        },
        {
            id: 'ba_psych',
            name: 'Psychology',
            type: 'degree',
            costPerYear: 12000,
            durationYears: 4,
            reqIntellect: 40,
            buffs: { salaryMultiplier: 1.3, statBoost: { charm: 10, intellect: 5 } },
        },
        {
            id: 'llb_law',
            name: 'Law',
            type: 'degree',
            costPerYear: 18000,
            durationYears: 4,
            reqIntellect: 60,
            buffs: { salaryMultiplier: 2.2, statBoost: { intellect: 20, charm: 5 } },
        },
        {
            id: 'md_medicine',
            name: 'Medicine',
            type: 'degree',
            costPerYear: 25000,
            durationYears: 7,
            reqIntellect: 80,
            buffs: { salaryMultiplier: 3.5, statBoost: { intellect: 30 } },
        },
        {
            id: 'bs_business',
            name: 'Business Admin',
            type: 'degree',
            costPerYear: 20000,
            durationYears: 4,
            reqIntellect: 45,
            buffs: { salaryMultiplier: 1.8, statBoost: { intellect: 10, charm: 15 } },
        },
        {
            id: 'bs_eng',
            name: 'Engineering',
            type: 'degree',
            costPerYear: 16000,
            durationYears: 4,
            reqIntellect: 65,
            buffs: { salaryMultiplier: 1.7, statBoost: { intellect: 20 } },
        },
        {
            id: 'bs_arch',
            name: 'Architecture',
            type: 'degree',
            costPerYear: 17000,
            durationYears: 5,
            reqIntellect: 60,
            buffs: { salaryMultiplier: 1.6, statBoost: { intellect: 15 } },
        },
        {
            id: 'ba_polsci',
            name: 'Political Science',
            type: 'degree',
            costPerYear: 14000,
            durationYears: 4,
            reqIntellect: 50,
            buffs: { salaryMultiplier: 1.5, statBoost: { charm: 20, intellect: 5 } },
        },
        {
            id: 'bs_bio',
            name: 'Biology',
            type: 'degree',
            costPerYear: 15000,
            durationYears: 4,
            reqIntellect: 55,
            buffs: { salaryMultiplier: 1.4, statBoost: { intellect: 15 } },
        },
        {
            id: 'bs_math',
            name: 'Mathematics',
            type: 'degree',
            costPerYear: 14000,
            durationYears: 4,
            reqIntellect: 70,
            buffs: { salaryMultiplier: 1.5, statBoost: { intellect: 25 } },
        },
        {
            id: 'ba_arts',
            name: 'Fine Arts',
            type: 'degree',
            costPerYear: 12000,
            durationYears: 4,
            reqIntellect: 30,
            buffs: { salaryMultiplier: 1.2, statBoost: { looks: 15, charm: 10 } },
        },
        {
            id: 'ba_history',
            name: 'History',
            type: 'degree',
            costPerYear: 10000,
            durationYears: 4,
            reqIntellect: 40,
            buffs: { salaryMultiplier: 1.1, statBoost: { intellect: 10 } },
        },
    ],
    postgrad: [
        {
            id: 'mba',
            name: 'MBA',
            type: 'postgrad',
            costPerYear: 35000,
            durationYears: 2,
            reqIntellect: 55,
            prerequisite: 'bs_business', // Loosened logic later if needed
            buffs: { salaryMultiplier: 2.5, statBoost: { intellect: 15, charm: 15 } },
        },
        {
            id: 'phd_cs',
            name: 'PhD Computer Science',
            type: 'postgrad',
            costPerYear: 15000,
            durationYears: 4,
            reqIntellect: 85,
            prerequisite: 'bs_cs',
            buffs: { salaryMultiplier: 3.0, statBoost: { intellect: 40 } },
        },
    ],
    certificates: [
        { id: 'cert_pt', name: 'Personal Trainer', type: 'certificate', costPerYear: 5000, durationYears: 0.25, reqIntellect: 10, buffs: { statBoost: { strength: 15, looks: 5 } } },
        { id: 'cert_real_estate', name: 'Real Estate License', type: 'certificate', costPerYear: 15000, durationYears: 0.5, reqIntellect: 25, buffs: { statBoost: { charm: 10, intellect: 5 } } },
        { id: 'cert_pmp', name: 'PMP Certification', type: 'certificate', costPerYear: 8000, durationYears: 0.25, reqIntellect: 40, buffs: { statBoost: { intellect: 10, charm: 5 } } },
        { id: 'cert_cfa1', name: 'CFA Level 1', type: 'certificate', costPerYear: 12000, durationYears: 0.5, reqIntellect: 60, buffs: { statBoost: { intellect: 15 } } },
        { id: 'cert_cfa2', name: 'CFA Level 2', type: 'certificate', costPerYear: 12000, durationYears: 0.5, reqIntellect: 70, buffs: { statBoost: { intellect: 20 } } },
        { id: 'cert_cfa3', name: 'CFA Level 3', type: 'certificate', costPerYear: 12000, durationYears: 0.5, reqIntellect: 80, buffs: { statBoost: { intellect: 25 } } },
        { id: 'cert_pilot', name: 'Private Pilot License', type: 'certificate', costPerYear: 25000, durationYears: 1, reqIntellect: 50, buffs: { statBoost: { intellect: 10, looks: 5 } } },
        { id: 'cert_commercial_pilot', name: 'Commercial Pilot License', type: 'certificate', costPerYear: 60000, durationYears: 1.5, reqIntellect: 60, buffs: { salaryMultiplier: 2.0, statBoost: { intellect: 20 } } },
        { id: 'cert_sommelier', name: 'Sommelier', type: 'certificate', costPerYear: 10000, durationYears: 0.5, reqIntellect: 30, buffs: { statBoost: { charm: 15, intellect: 5 } } },
        { id: 'cert_cyber', name: 'Cyber Security Expert', type: 'certificate', costPerYear: 20000, durationYears: 0.75, reqIntellect: 65, buffs: { salaryMultiplier: 1.5, statBoost: { intellect: 20 } } },
        { id: 'cert_michelin', name: 'Michelin Chef Training', type: 'certificate', costPerYear: 100000, durationYears: 2, reqIntellect: 40, buffs: { salaryMultiplier: 2.5, statBoost: { charm: 20, looks: 5 } } },
        { id: 'cert_nutrition', name: 'Nutritionist', type: 'certificate', costPerYear: 6000, durationYears: 0.5, reqIntellect: 30, buffs: { statBoost: { health: 10 } } }, // Health specific? state uses health in core.
        { id: 'cert_digital_marketing', name: 'Digital Marketing', type: 'certificate', costPerYear: 4000, durationYears: 0.25, reqIntellect: 20, buffs: { statBoost: { intellect: 5, charm: 5 } } },
        { id: 'cert_yoga', name: 'Yoga Instructor', type: 'certificate', costPerYear: 5000, durationYears: 0.25, reqIntellect: 10, buffs: { statBoost: { health: 5, charm: 5 } } },
        { id: 'cert_barista', name: 'Master Barista', type: 'certificate', costPerYear: 3000, durationYears: 0.1, reqIntellect: 10, buffs: { statBoost: { charm: 5 } } },
        { id: 'cert_aws', name: 'AWS Solutions Architect', type: 'certificate', costPerYear: 5000, durationYears: 0.25, reqIntellect: 50, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_six_sigma_black', name: 'Six Sigma Black Belt', type: 'certificate', costPerYear: 15000, durationYears: 0.5, reqIntellect: 60, buffs: { statBoost: { intellect: 15 } } },
        { id: 'cert_acting', name: 'Acting Workshop', type: 'certificate', costPerYear: 8000, durationYears: 0.5, reqIntellect: 20, buffs: { statBoost: { charm: 20 } } },
        { id: 'cert_photography', name: 'Pro Photography', type: 'certificate', costPerYear: 12000, durationYears: 0.5, reqIntellect: 25, buffs: { statBoost: { looks: 5, charm: 5 } } },
        { id: 'cert_finance', name: 'Financial Modelling', type: 'certificate', costPerYear: 9000, durationYears: 0.25, reqIntellect: 55, buffs: { statBoost: { intellect: 10 } } },
    ],
};
