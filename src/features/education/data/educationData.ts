// src/features/education/data/educationData.ts
//
// ============================================================================
//  THE DEGREES ARE READ BY A PLAYER, SO THEY GO THROUGH THE DOOR
// ============================================================================
//
//  Fifty three titles sat here as English literals and reached the enrolment
//  screen through a variable, which is the one shape `scripts/untranslated.js`
//  cannot see: it reads .tsx files, and a string that arrives from a .ts
//  catalogue sails past a green sweep. The same blind spot hid the laboratory
//  tiers and the magnate lines before this.
//
//  A GETTER RATHER THAN A VALUE, for the reason written out in
//  src/data/i18n/catalogueText.test.ts: a value is evaluated once at module
//  load, in whatever language happened to be active then, and does not follow
//  the player when they change language in Settings. A getter is read at the
//  moment it is drawn.
//
//  `field` is deliberately NOT translated. Nothing renders it; it is the
//  engine's category and translating it would turn a key into prose.
// ============================================================================

import { t } from '../../../core/i18n';
import { EducationItem } from '../educationTypes';

export const EDUCATION_DATA: EducationItem[] = [
    // ========================================
    // BACHELOR'S DEGREES (12 Items)
    // Cost: $7,500/quarter, Duration: 16 quarters (4 years)
    // ========================================

    // 1. Computer Science - Tech Focus
    {
        id: 'degree_cs',
        get title() { return t('edu.degree_cs'); },
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
        get title() { return t('edu.degree_business'); },
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
        get title() { return t('edu.degree_fine_arts'); },
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
        get title() { return t('edu.degree_psychology'); },
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
        get title() { return t('edu.degree_polsci'); },
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
        get title() { return t('edu.degree_biology'); },
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
        get title() { return t('edu.degree_engineering'); },
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
        get title() { return t('edu.degree_marketing'); },
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
        get title() { return t('edu.degree_physics'); },
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
        get title() { return t('edu.degree_economics'); },
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
        get title() { return t('edu.degree_nursing'); },
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
        get title() { return t('edu.degree_architecture'); },
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
        get title() { return t('edu.master_mba'); },
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
        get title() { return t('edu.master_data_science'); },
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
        get title() { return t('edu.master_clinical_psych'); },
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
        get title() { return t('edu.master_law'); },
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
        get title() { return t('edu.master_medicine'); },
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
        get title() { return t('edu.master_civil_eng'); },
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
        get title() { return t('edu.master_fine_arts'); },
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
        get title() { return t('edu.master_marketing'); },
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
        get title() { return t('edu.master_physics'); },
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
        get title() { return t('edu.master_economics'); },
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
        get title() { return t('edu.master_nursing'); },
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
        get title() { return t('edu.master_architecture'); },
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
        get title() { return t('edu.phd_ai'); },
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
        get title() { return t('edu.phd_economics'); },
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
        get title() { return t('edu.phd_neuroscience'); },
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
        get title() { return t('edu.phd_physics'); },
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
        get title() { return t('edu.phd_political_philosophy'); },
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
        get title() { return t('edu.phd_psychology'); },
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
        get title() { return t('edu.cert_martial_white'); },
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
        get title() { return t('edu.cert_martial_black'); },
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
        get title() { return t('edu.cert_private_security'); },
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
        get title() { return t('edu.cert_bodyguard'); },
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
        get title() { return t('edu.cert_ethical_hacking'); },
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
        get title() { return t('edu.cert_pilot'); },
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
        get title() { return t('edu.cert_real_estate'); },
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
        get title() { return t('edu.cert_personal_trainer'); },
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
        get title() { return t('edu.cert_acting'); },
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
        get title() { return t('edu.cert_bartending'); },
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
        get title() { return t('edu.cert_barista'); },
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
        get title() { return t('edu.cert_welding'); },
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
        get title() { return t('edu.cert_electrician'); },
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
        get title() { return t('edu.cert_first_aid'); },
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
        get title() { return t('edu.cert_emt'); },
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
        get title() { return t('edu.cert_social_media'); },
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
        get title() { return t('edu.cert_crypto_trading'); },
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
        get title() { return t('edu.cert_sommelier'); },
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
        get title() { return t('edu.cert_photography'); },
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
        get title() { return t('edu.cert_yoga'); },
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
        get title() { return t('edu.cert_pmp'); },
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
        get title() { return t('edu.cert_mechanic'); },
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
        get title() { return t('edu.cert_culinary'); },
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
