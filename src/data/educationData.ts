

export interface EducationBuffs {
    salaryMultiplier?: number;
    statBoost?: {
        intellect?: number;
        charm?: number;
        looks?: number;
        strength?: number;
        health?: number;
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
    prerequisite?: string; // e.g., 'bs_degree' (generic) or specific ID
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
            id: 'md_medicine',
            name: 'Medicine (MD)',
            type: 'degree',
            costPerYear: 45000,
            durationYears: 7,
            reqIntellect: 85,
            buffs: { salaryMultiplier: 4.0, statBoost: { intellect: 10 } }, // +10 per year = +70 total! High reward.
        },
        {
            id: 'bs_cs',
            name: 'Computer Science (BS)',
            type: 'degree',
            costPerYear: 20000,
            durationYears: 4,
            reqIntellect: 60,
            buffs: { salaryMultiplier: 2.5, statBoost: { intellect: 10 } },
        },
        {
            id: 'llb_law',
            name: 'Law (LLB)',
            type: 'degree',
            costPerYear: 25000,
            durationYears: 4,
            reqIntellect: 70,
            buffs: { salaryMultiplier: 3.0, statBoost: { intellect: 10 } },
        },
        {
            id: 'bs_engineering',
            name: 'Engineering (BS)',
            type: 'degree',
            costPerYear: 22000,
            durationYears: 4,
            reqIntellect: 65,
            buffs: { salaryMultiplier: 2.2, statBoost: { intellect: 10 } },
        },
        {
            id: 'bs_arch',
            name: 'Architecture',
            type: 'degree',
            costPerYear: 18000,
            durationYears: 5,
            reqIntellect: 65,
            buffs: { salaryMultiplier: 2.0, statBoost: { intellect: 10 } },
        },
        {
            id: 'ba_psych',
            name: 'Psychology',
            type: 'degree',
            costPerYear: 15000,
            durationYears: 4,
            reqIntellect: 50,
            buffs: { salaryMultiplier: 1.5, statBoost: { charm: 10 } },
        },
        {
            id: 'ba_arts',
            name: 'Fine Arts',
            type: 'degree',
            costPerYear: 15000,
            durationYears: 4,
            reqIntellect: 40,
            buffs: { salaryMultiplier: 1.2, statBoost: { looks: 5, charm: 5 } }, // Split buff
        },
        {
            id: 'ba_history',
            name: 'History',
            type: 'degree',
            costPerYear: 14000,
            durationYears: 4,
            reqIntellect: 45,
            buffs: { salaryMultiplier: 1.1, statBoost: { intellect: 5, charm: 5 } },
        },
        {
            id: 'ba_polsci',
            name: 'Political Science',
            type: 'degree',
            costPerYear: 16000,
            durationYears: 4,
            reqIntellect: 55,
            buffs: { salaryMultiplier: 1.6, statBoost: { charm: 10 } },
        },
        {
            id: 'bs_biology',
            name: 'Biology',
            type: 'degree',
            costPerYear: 17000,
            durationYears: 4,
            reqIntellect: 55,
            buffs: { salaryMultiplier: 1.4, statBoost: { intellect: 10 } },
        },
        {
            id: 'bs_math',
            name: 'Mathematics',
            type: 'degree',
            costPerYear: 16000,
            durationYears: 4,
            reqIntellect: 70,
            buffs: { salaryMultiplier: 1.8, statBoost: { intellect: 10 } },
        },
        {
            id: 'bs_business',
            name: 'Business Admin',
            type: 'degree',
            costPerYear: 19000,
            durationYears: 4,
            reqIntellect: 50,
            buffs: { salaryMultiplier: 1.9, statBoost: { intellect: 5, charm: 5 } },
        },
    ],
    postgrad: [
        {
            id: 'mba',
            name: 'MBA',
            type: 'postgrad',
            costPerYear: 40000,
            durationYears: 2,
            reqIntellect: 60,
            prerequisite: 'Any Bachelor Degree', // Logic handles this loosely or specific check
            buffs: { salaryMultiplier: 3.5, statBoost: { business: 10, intellect: 5 } }, // 'business' stat implied mapping to 'intellect' or 'charm' usually, or new rep
        },
        {
            id: 'phd_neuro',
            name: 'PhD Neuroscience',
            type: 'postgrad',
            costPerYear: 30000,
            durationYears: 4,
            reqIntellect: 90,
            prerequisite: 'Master Degree or Medicine',
            buffs: { salaryMultiplier: 4.5, statBoost: { intellect: 10 } },
        },
    ],
    certificates: [
        { id: 'cert_pt', name: 'Personal Trainer', type: 'certificate', costPerYear: 5000, durationYears: 0.25, reqIntellect: 20, buffs: { statBoost: { strength: 10 } } },
        { id: 'cert_real_estate', name: 'Real Estate License', type: 'certificate', costPerYear: 10000, durationYears: 0.5, reqIntellect: 30, buffs: { statBoost: { charm: 10 } } },
        { id: 'cert_cfa1', name: 'CFA Level 1', type: 'certificate', costPerYear: 15000, durationYears: 0.5, reqIntellect: 65, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_cyber', name: 'Cyber Security Expert', type: 'certificate', costPerYear: 25000, durationYears: 0.75, reqIntellect: 60, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_michelin', name: 'Michelin Chef Training', type: 'certificate', costPerYear: 80000, durationYears: 2, reqIntellect: 40, buffs: { statBoost: { charm: 15, looks: 5 } } },
        { id: 'cert_pilot', name: 'Pilot License', type: 'certificate', costPerYear: 100000, durationYears: 1.5, reqIntellect: 55, buffs: { statBoost: { intellect: 10, looks: 5 } } },
        { id: 'cert_yoga', name: 'Yoga Instructor', type: 'certificate', costPerYear: 5000, durationYears: 0.25, reqIntellect: 15, buffs: { statBoost: { health: 10 } } },
        { id: 'cert_digital_marketing', name: 'Digital Marketing', type: 'certificate', costPerYear: 6000, durationYears: 0.3, reqIntellect: 30, buffs: { statBoost: { charm: 5, intellect: 5 } } },
        { id: 'cert_six_sigma', name: 'Six Sigma Black Belt', type: 'certificate', costPerYear: 12000, durationYears: 0.5, reqIntellect: 60, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_blockchain', name: 'Blockchain Dev', type: 'certificate', costPerYear: 15000, durationYears: 0.5, reqIntellect: 65, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_acting', name: 'Acting Class', type: 'certificate', costPerYear: 8000, durationYears: 0.5, reqIntellect: 25, buffs: { statBoost: { charm: 10, looks: 5 } } },
        { id: 'cert_sommelier', name: 'Sommelier', type: 'certificate', costPerYear: 10000, durationYears: 0.5, reqIntellect: 35, buffs: { statBoost: { charm: 10 } } },
        { id: 'cert_project_mgmt', name: 'Project Management (PMP)', type: 'certificate', costPerYear: 9000, durationYears: 0.5, reqIntellect: 50, buffs: { statBoost: { intellect: 5, charm: 5 } } },
        { id: 'cert_data_science', name: 'Data Science Bootcamp', type: 'certificate', costPerYear: 18000, durationYears: 0.5, reqIntellect: 60, buffs: { statBoost: { intellect: 10 } } },
        { id: 'cert_welding', name: 'Master Welder', type: 'certificate', costPerYear: 12000, durationYears: 1, reqIntellect: 30, buffs: { statBoost: { strength: 10 } } },
        { id: 'cert_makeup', name: 'Pro Makeup Artist', type: 'certificate', costPerYear: 7000, durationYears: 0.5, reqIntellect: 25, buffs: { statBoost: { looks: 10 } } },
        { id: 'cert_interior', name: 'Interior Design', type: 'certificate', costPerYear: 11000, durationYears: 1, reqIntellect: 40, buffs: { statBoost: { looks: 5, charm: 5 } } },
        { id: 'cert_paramedic', name: 'Paramedic', type: 'certificate', costPerYear: 8000, durationYears: 1, reqIntellect: 45, buffs: { statBoost: { health: 10, intellect: 5 } } },
        { id: 'cert_music_prod', name: 'Music Production', type: 'certificate', costPerYear: 15000, durationYears: 1, reqIntellect: 40, buffs: { statBoost: { charm: 10 } } },
        { id: 'cert_flight_attendant', name: 'Flight Attendant', type: 'certificate', costPerYear: 5000, durationYears: 0.2, reqIntellect: 30, buffs: { statBoost: { looks: 5, charm: 5 } } },
    ],
};
