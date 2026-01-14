import { EducationItem } from '../educationTypes';

export const EDUCATION_DATA: EducationItem[] = [
    // ========================================
    // BACHELOR'S DEGREES (12 Items)
    // Cost: $7,500/quarter, Duration: 16 quarters (4 years)
    // ========================================

    // 1. Computer Science - Tech Focus
    {
        id: 'degree_cs',
        title: 'B.S. Computer Science',
        type: 'degree',
        field: 'Technology',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 15,
            salaryMultiplier: 1.25
        },
        quarterlyBonuses: [
            { statId: 'digitalShield', value: 1 }
        ],
        completionBonuses: [
            { statId: 'digitalShield', value: 5 },
            { statId: 'intellect', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 2. Business Administration - Business Focus
    {
        id: 'degree_business',
        title: 'B.S. Business Administration',
        type: 'degree',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 12,
            salaryMultiplier: 1.20
        },
        quarterlyBonuses: [
            { statId: 'businessTrust', value: 1 }
        ],
        completionBonuses: [
            { statId: 'businessTrust', value: 5 },
            { statId: 'intellect', value: 3 },
            { statId: 'highSociety', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 3. Fine Arts - Arts Focus
    {
        id: 'degree_fine_arts',
        title: 'B.A. Fine Arts',
        type: 'degree',
        field: 'Arts',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 8,
            salaryMultiplier: 1.10
        },
        quarterlyBonuses: [
            { statId: 'charm', value: 1 }
        ],
        completionBonuses: [
            { statId: 'charm', value: 5 },
            { statId: 'looks', value: 3 },
            { statId: 'happiness', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 4. Psychology - Science/Social Focus
    {
        id: 'degree_psychology',
        title: 'B.S. Psychology',
        type: 'degree',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 12,
            salaryMultiplier: 1.15
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 5 },
            { statId: 'happiness', value: 3 },
            { statId: 'charm', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 5. Political Science - Law Prep
    {
        id: 'degree_polsci',
        title: 'B.A. Political Science',
        type: 'degree',
        field: 'Social Sciences',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 12,
            salaryMultiplier: 1.15
        },
        quarterlyBonuses: [
            { statId: 'highSociety', value: 1 }
        ],
        completionBonuses: [
            { statId: 'highSociety', value: 5 },
            { statId: 'intellect', value: 3 },
            { statId: 'charm', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 6. Biology - Medical Prep
    {
        id: 'degree_biology',
        title: 'B.S. Biology',
        type: 'degree',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 14,
            salaryMultiplier: 1.18
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 5 },
            { statId: 'happiness', value: 3 },
            { statId: 'digitalShield', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 7. Engineering - Tech/Business Focus
    {
        id: 'degree_engineering',
        title: 'B.S. Engineering',
        type: 'degree',
        field: 'Technology',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 15,
            salaryMultiplier: 1.30
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 5 },
            { statId: 'businessTrust', value: 3 },
            { statId: 'digitalShield', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 8. Marketing - Business/Social Focus
    {
        id: 'degree_marketing',
        title: 'B.S. Marketing',
        type: 'degree',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 10,
            salaryMultiplier: 1.18
        },
        quarterlyBonuses: [
            { statId: 'charm', value: 1 }
        ],
        completionBonuses: [
            { statId: 'charm', value: 5 },
            { statId: 'businessTrust', value: 3 },
            { statId: 'highSociety', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 9. Physics - Pure Science Focus
    {
        id: 'degree_physics',
        title: 'B.S. Physics',
        type: 'degree',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 16,
            salaryMultiplier: 1.22
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 5 },
            { statId: 'digitalShield', value: 3 },
            { statId: 'happiness', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 10. Economics - Business/Analytics Focus
    {
        id: 'degree_economics',
        title: 'B.S. Economics',
        type: 'degree',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 13,
            salaryMultiplier: 1.25
        },
        quarterlyBonuses: [
            { statId: 'businessTrust', value: 1 }
        ],
        completionBonuses: [
            { statId: 'businessTrust', value: 5 },
            { statId: 'intellect', value: 3 },
            { statId: 'highSociety', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 11. Nursing - Health/Care Focus
    {
        id: 'degree_nursing',
        title: 'B.S. Nursing',
        type: 'degree',
        field: 'Health',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 12,
            salaryMultiplier: 1.20
        },
        quarterlyBonuses: [
            { statId: 'happiness', value: 1 }
        ],
        completionBonuses: [
            { statId: 'happiness', value: 5 },
            { statId: 'intellect', value: 3 },
            { statId: 'charm', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 12. Architecture - Design/Tech Focus
    {
        id: 'degree_architecture',
        title: 'B.Arch. Architecture',
        type: 'degree',
        field: 'Arts',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {},
        benefits: {
            intelligenceBonus: 14,
            salaryMultiplier: 1.28
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 5 },
            { statId: 'looks', value: 3 },
            { statId: 'businessTrust', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // ========================================
    // MASTER'S DEGREES (12 Items)
    // Cost: $7,500/quarter, Duration: 8 quarters (2 years)
    // Requires: Specific Bachelor's Degree
    // ========================================

    // 1. MBA - Business Leadership
    {
        id: 'master_mba',
        title: 'MBA (Master of Business Administration)',
        type: 'master',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_business'
        },
        benefits: {
            intelligenceBonus: 20,
            salaryMultiplier: 1.50
        },
        quarterlyBonuses: [
            { statId: 'businessTrust', value: 1 }
        ],
        completionBonuses: [
            { statId: 'businessTrust', value: 10 },
            { statId: 'highSociety', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 2. M.S. Data Science
    {
        id: 'master_data_science',
        title: 'M.S. Data Science',
        type: 'master',
        field: 'Technology',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_cs'
        },
        benefits: {
            intelligenceBonus: 25,
            salaryMultiplier: 1.60
        },
        quarterlyBonuses: [
            { statId: 'digitalShield', value: 1 }
        ],
        completionBonuses: [
            { statId: 'digitalShield', value: 10 },
            { statId: 'intellect', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 3. M.S. Clinical Psychology
    {
        id: 'master_clinical_psych',
        title: 'M.S. Clinical Psychology',
        type: 'master',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_psychology'
        },
        benefits: {
            intelligenceBonus: 18,
            salaryMultiplier: 1.40
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 10 },
            { statId: 'charm', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 4. J.D. (Law School)
    {
        id: 'master_law',
        title: 'J.D. (Juris Doctor)',
        type: 'master',
        field: 'Law',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_polsci'
        },
        benefits: {
            intelligenceBonus: 22,
            salaryMultiplier: 1.70
        },
        quarterlyBonuses: [
            { statId: 'highSociety', value: 1 }
        ],
        completionBonuses: [
            { statId: 'highSociety', value: 10 },
            { statId: 'businessTrust', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 5. M.D. (Medical School)
    {
        id: 'master_medicine',
        title: 'M.D. (Doctor of Medicine)',
        type: 'master',
        field: 'Health',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_biology'
        },
        benefits: {
            intelligenceBonus: 30,
            salaryMultiplier: 2.00
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 10 },
            { statId: 'highSociety', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 6. M.S. Civil Engineering
    {
        id: 'master_civil_eng',
        title: 'M.S. Civil Engineering',
        type: 'master',
        field: 'Technology',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_engineering'
        },
        benefits: {
            intelligenceBonus: 24,
            salaryMultiplier: 1.55
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 10 },
            { statId: 'businessTrust', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 7. MFA (Master of Fine Arts)
    {
        id: 'master_fine_arts',
        title: 'MFA (Master of Fine Arts)',
        type: 'master',
        field: 'Arts',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_fine_arts'
        },
        benefits: {
            intelligenceBonus: 15,
            salaryMultiplier: 1.30
        },
        quarterlyBonuses: [
            { statId: 'charm', value: 1 }
        ],
        completionBonuses: [
            { statId: 'charm', value: 10 },
            { statId: 'looks', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 8. M.S. Marketing Analytics
    {
        id: 'master_marketing',
        title: 'M.S. Marketing Analytics',
        type: 'master',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_marketing'
        },
        benefits: {
            intelligenceBonus: 18,
            salaryMultiplier: 1.45
        },
        quarterlyBonuses: [
            { statId: 'charm', value: 1 }
        ],
        completionBonuses: [
            { statId: 'charm', value: 10 },
            { statId: 'businessTrust', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 9. M.S. Physics
    {
        id: 'master_physics',
        title: 'M.S. Physics',
        type: 'master',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_physics'
        },
        benefits: {
            intelligenceBonus: 26,
            salaryMultiplier: 1.50
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 10 },
            { statId: 'digitalShield', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 10. M.S. Economics
    {
        id: 'master_economics',
        title: 'M.S. Economics',
        type: 'master',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_economics'
        },
        benefits: {
            intelligenceBonus: 22,
            salaryMultiplier: 1.55
        },
        quarterlyBonuses: [
            { statId: 'businessTrust', value: 1 }
        ],
        completionBonuses: [
            { statId: 'businessTrust', value: 10 },
            { statId: 'intellect', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 11. M.S. Nursing (Nurse Practitioner)
    {
        id: 'master_nursing',
        title: 'M.S. Nursing (NP)',
        type: 'master',
        field: 'Health',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_nursing'
        },
        benefits: {
            intelligenceBonus: 20,
            salaryMultiplier: 1.60
        },
        quarterlyBonuses: [
            { statId: 'happiness', value: 1 }
        ],
        completionBonuses: [
            { statId: 'happiness', value: 10 },
            { statId: 'intellect', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // 12. M.Arch (Master of Architecture)
    {
        id: 'master_architecture',
        title: 'M.Arch (Master of Architecture)',
        type: 'master',
        field: 'Arts',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 8,
        requirements: {
            requiredDegreeId: 'degree_architecture'
        },
        benefits: {
            intelligenceBonus: 22,
            salaryMultiplier: 1.65
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 1 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 10 },
            { statId: 'looks', value: 5 }
        ],
        salaryMultiplier: 1.35
    },

    // ========================================
    // PHD PROGRAMS (6 Items)
    // Cost: $7,500/quarter, Duration: 16-20 quarters
    // Requires: Specific Master's Degree
    // Massive Completion Bonuses
    // ========================================

    // 1. PhD in Artificial Intelligence
    {
        id: 'phd_ai',
        title: 'PhD in Artificial Intelligence',
        type: 'phd',
        field: 'Technology',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 20,
        requirements: {
            requiredDegreeId: 'master_data_science'
        },
        benefits: {
            intelligenceBonus: 40,
            salaryMultiplier: 2.50
        },
        quarterlyBonuses: [
            { statId: 'digitalShield', value: 2 }
        ],
        completionBonuses: [
            { statId: 'digitalShield', value: 20 },
            { statId: 'intellect', value: 15 }
        ],
        salaryMultiplier: 1.5
    },

    // 2. PhD in Economics
    {
        id: 'phd_economics',
        title: 'PhD in Economics',
        type: 'phd',
        field: 'Business',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 18,
        requirements: {
            requiredDegreeId: 'master_economics'
        },
        benefits: {
            intelligenceBonus: 35,
            salaryMultiplier: 2.20
        },
        quarterlyBonuses: [
            { statId: 'businessTrust', value: 2 }
        ],
        completionBonuses: [
            { statId: 'businessTrust', value: 20 },
            { statId: 'highSociety', value: 10 }
        ],
        salaryMultiplier: 1.5
    },

    // 3. PhD in Neuroscience
    {
        id: 'phd_neuroscience',
        title: 'PhD in Neuroscience',
        type: 'phd',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 20,
        requirements: {
            requiredDegreeId: 'master_medicine'
        },
        benefits: {
            intelligenceBonus: 45,
            salaryMultiplier: 2.80
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 2 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 20 },
            { statId: 'highSociety', value: 10 }
        ],
        salaryMultiplier: 1.5
    },

    // 4. PhD in Theoretical Physics
    {
        id: 'phd_physics',
        title: 'PhD in Theoretical Physics',
        type: 'phd',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 20,
        requirements: {
            requiredDegreeId: 'master_physics'
        },
        benefits: {
            intelligenceBonus: 50,
            salaryMultiplier: 2.30
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 2 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 20 },
            { statId: 'digitalShield', value: 10 }
        ],
        salaryMultiplier: 1.5
    },

    // 5. PhD in Political Philosophy
    {
        id: 'phd_political_philosophy',
        title: 'PhD in Political Philosophy',
        type: 'phd',
        field: 'Social Sciences',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 16,
        requirements: {
            requiredDegreeId: 'master_law'
        },
        benefits: {
            intelligenceBonus: 38,
            salaryMultiplier: 2.00
        },
        quarterlyBonuses: [
            { statId: 'highSociety', value: 2 }
        ],
        completionBonuses: [
            { statId: 'highSociety', value: 20 },
            { statId: 'intellect', value: 10 }
        ],
        salaryMultiplier: 1.5
    },

    // 6. PhD in Psychology
    {
        id: 'phd_psychology',
        title: 'PhD in Psychology',
        type: 'phd',
        field: 'Science',
        cost: 7500,
        isMonthlyCost: true,
        durationQuarter: 18,
        requirements: {
            requiredDegreeId: 'master_clinical_psych'
        },
        benefits: {
            intelligenceBonus: 40,
            salaryMultiplier: 2.10
        },
        quarterlyBonuses: [
            { statId: 'intellect', value: 2 }
        ],
        completionBonuses: [
            { statId: 'intellect', value: 20 },
            { statId: 'charm', value: 10 }
        ],
        salaryMultiplier: 1.5
    },

    // ========================================
    // CERTIFICATES (23 Items)
    // Short-term, practical skills
    // No prerequisites, varied costs and durations
    // ========================================

    // 1. Martial Arts - White Belt
    {
        id: 'cert_martial_white',
        title: 'Martial Arts Certification (White Belt)',
        type: 'certificate',
        field: 'Combat',
        cost: 8000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 2,
            salaryMultiplier: 1.02
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'martialArts', value: 3 },
            { statId: 'strength', value: 2 }
        ]
    },

    // 2. Martial Arts - Black Belt
    {
        id: 'cert_martial_black',
        title: 'Martial Arts Certification (Black Belt)',
        type: 'certificate',
        field: 'Combat',
        cost: 25000,
        isMonthlyCost: false,
        durationQuarter: 8,
        requirements: {},
        benefits: {
            intelligenceBonus: 5,
            salaryMultiplier: 1.08
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'martialArts', value: 10 },
            { statId: 'strength', value: 5 }
        ]
    },

    // 3. Private Security License
    {
        id: 'cert_private_security',
        title: 'Private Security License',
        type: 'certificate',
        field: 'Security',
        cost: 12000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.10
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'bodyguard', value: 5 },
            { statId: 'strength', value: 3 }
        ]
    },

    // 4. Executive Protection (Bodyguard)
    {
        id: 'cert_bodyguard',
        title: 'Executive Protection Specialist',
        type: 'certificate',
        field: 'Security',
        cost: 30000,
        isMonthlyCost: false,
        durationQuarter: 4,
        requirements: {},
        benefits: {
            intelligenceBonus: 5,
            salaryMultiplier: 1.25
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'bodyguard', value: 10 },
            { statId: 'strength', value: 5 },
            { statId: 'highSociety', value: 3 }
        ]
    },

    // 5. Ethical Hacking Certificate
    {
        id: 'cert_ethical_hacking',
        title: 'Certified Ethical Hacker (CEH)',
        type: 'certificate',
        field: 'Technology',
        cost: 18000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 8,
            salaryMultiplier: 1.20
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'digitalShield', value: 8 },
            { statId: 'intellect', value: 4 }
        ]
    },

    // 6. Commercial Pilot License
    {
        id: 'cert_pilot',
        title: 'Commercial Pilot License',
        type: 'certificate',
        field: 'Luxury',
        cost: 90000,
        isMonthlyCost: false,
        durationQuarter: 6,
        requirements: {},
        benefits: {
            intelligenceBonus: 10,
            salaryMultiplier: 1.40
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'highSociety', value: 8 },
            { statId: 'intellect', value: 5 },
            { statId: 'happiness', value: 3 }
        ]
    },

    // 7. Real Estate License
    {
        id: 'cert_real_estate',
        title: 'Real Estate License',
        type: 'certificate',
        field: 'Business',
        cost: 5000,
        isMonthlyCost: false,
        durationQuarter: 1,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.15
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'businessTrust', value: 5 },
            { statId: 'charm', value: 3 }
        ]
    },

    // 8. Certified Personal Trainer
    {
        id: 'cert_personal_trainer',
        title: 'Certified Personal Trainer',
        type: 'certificate',
        field: 'Health',
        cost: 10000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.12
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'strength', value: 5 },
            { statId: 'looks', value: 4 },
            { statId: 'happiness', value: 2 }
        ]
    },

    // 9. Acting Workshop Certificate
    {
        id: 'cert_acting',
        title: 'Professional Acting Workshop',
        type: 'certificate',
        field: 'Arts',
        cost: 8000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 2,
            salaryMultiplier: 1.05
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 6 },
            { statId: 'looks', value: 4 }
        ]
    },

    // 10. Bartending Certificate
    {
        id: 'cert_bartending',
        title: 'Professional Bartending Certificate',
        type: 'certificate',
        field: 'Service',
        cost: 3000,
        isMonthlyCost: false,
        durationQuarter: 1,
        requirements: {},
        benefits: {
            intelligenceBonus: 1,
            salaryMultiplier: 1.05
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 4 },
            { statId: 'streetCred', value: 3 }
        ]
    },

    // 11. Barista Certification
    {
        id: 'cert_barista',
        title: 'Professional Barista Certification',
        type: 'certificate',
        field: 'Service',
        cost: 2500,
        isMonthlyCost: false,
        durationQuarter: 1,
        requirements: {},
        benefits: {
            intelligenceBonus: 1,
            salaryMultiplier: 1.03
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 3 },
            { statId: 'happiness', value: 2 }
        ]
    },

    // 12. Welding Certification
    {
        id: 'cert_welding',
        title: 'Certified Welder',
        type: 'certificate',
        field: 'Trades',
        cost: 12000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.18
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'strength', value: 5 },
            { statId: 'streetCred', value: 4 }
        ]
    },

    // 13. Electrician License
    {
        id: 'cert_electrician',
        title: 'Licensed Electrician',
        type: 'certificate',
        field: 'Trades',
        cost: 15000,
        isMonthlyCost: false,
        durationQuarter: 4,
        requirements: {},
        benefits: {
            intelligenceBonus: 5,
            salaryMultiplier: 1.25
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'strength', value: 4 },
            { statId: 'intellect', value: 3 },
            { statId: 'streetCred', value: 3 }
        ]
    },

    // 14. First Aid Certification
    {
        id: 'cert_first_aid',
        title: 'First Aid Certification',
        type: 'certificate',
        field: 'Health',
        cost: 2000,
        isMonthlyCost: false,
        durationQuarter: 1,
        requirements: {},
        benefits: {
            intelligenceBonus: 1,
            salaryMultiplier: 1.02
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'intellect', value: 2 },
            { statId: 'happiness', value: 3 }
        ]
    },

    // 15. EMT Certification
    {
        id: 'cert_emt',
        title: 'Emergency Medical Technician (EMT)',
        type: 'certificate',
        field: 'Health',
        cost: 8000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 4,
            salaryMultiplier: 1.15
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'intellect', value: 4 },
            { statId: 'happiness', value: 5 },
            { statId: 'strength', value: 2 }
        ]
    },

    // 16. Social Media Marketing
    {
        id: 'cert_social_media',
        title: 'Social Media Marketing Certificate',
        type: 'certificate',
        field: 'Business',
        cost: 6000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.10
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 5 },
            { statId: 'businessTrust', value: 3 },
            { statId: 'digitalShield', value: 2 }
        ]
    },

    // 17. Cryptocurrency Trading Course
    {
        id: 'cert_crypto_trading',
        title: 'Cryptocurrency Trading Certification',
        type: 'certificate',
        field: 'Finance',
        cost: 10000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 5,
            salaryMultiplier: 1.12
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'digitalShield', value: 5 },
            { statId: 'intellect', value: 3 }
        ],
        salaryMultiplier: 1.2
    },

    // 18. Sommelier Certification
    {
        id: 'cert_sommelier',
        title: 'Certified Sommelier',
        type: 'certificate',
        field: 'Luxury',
        cost: 15000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 4,
            salaryMultiplier: 1.15
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'highSociety', value: 6 },
            { statId: 'charm', value: 4 }
        ]
    },

    // 19. Photography Certificate
    {
        id: 'cert_photography',
        title: 'Professional Photography Certificate',
        type: 'certificate',
        field: 'Arts',
        cost: 7000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 3,
            salaryMultiplier: 1.08
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 4 },
            { statId: 'looks', value: 3 },
            { statId: 'happiness', value: 2 }
        ]
    },

    // 20. Yoga Instructor Certification
    {
        id: 'cert_yoga',
        title: 'Certified Yoga Instructor',
        type: 'certificate',
        field: 'Health',
        cost: 5000,
        isMonthlyCost: false,
        durationQuarter: 2,
        requirements: {},
        benefits: {
            intelligenceBonus: 2,
            salaryMultiplier: 1.07
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'happiness', value: 5 },
            { statId: 'looks', value: 3 },
            { statId: 'strength', value: 2 }
        ]
    },

    // 21. Project Management (PMP)
    {
        id: 'cert_pmp',
        title: 'Project Management Professional (PMP)',
        type: 'certificate',
        field: 'Business',
        cost: 12000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 6,
            salaryMultiplier: 1.22
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'businessTrust', value: 6 },
            { statId: 'intellect', value: 4 }
        ]
    },

    // 22. Automotive Mechanic
    {
        id: 'cert_mechanic',
        title: 'Certified Automotive Technician',
        type: 'certificate',
        field: 'Trades',
        cost: 10000,
        isMonthlyCost: false,
        durationQuarter: 3,
        requirements: {},
        benefits: {
            intelligenceBonus: 4,
            salaryMultiplier: 1.16
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'strength', value: 4 },
            { statId: 'intellect', value: 3 },
            { statId: 'streetCred', value: 3 }
        ]
    },

    // 23. Culinary Arts Certificate
    {
        id: 'cert_culinary',
        title: 'Culinary Arts Certificate',
        type: 'certificate',
        field: 'Arts',
        cost: 14000,
        isMonthlyCost: false,
        durationQuarter: 4,
        requirements: {},
        benefits: {
            intelligenceBonus: 4,
            salaryMultiplier: 1.12
        },
        quarterlyBonuses: [],
        completionBonuses: [
            { statId: 'charm', value: 5 },
            { statId: 'happiness', value: 4 },
            { statId: 'highSociety', value: 2 }
        ]
    }
];
