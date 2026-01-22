// src/features/life/components/Sanctuary/sanctuaryData.ts

// ==========================================
// 🏥 DOCTORS DATA
// ==========================================

export type Doctor = {
    id: string;
    name: string;
    cost: number;
    successRate: number; // 0.0 - 1.0
    looksMin?: number;
    looksMax?: number;
    success: {
        charm: number;
        highSociety?: number;
        message: string;
    };
    failure: {
        charm: number;
        stress: number;
        message: string;
    };
};

export const DOCTORS: Doctor[] = [
    {
        id: 'intern',
        name: 'The Intern',
        cost: 20000,
        successRate: 0.5, // 50%
        looksMin: 10,
        looksMax: 20,
        success: {
            charm: 5,
            message: 'Risky but cheap. Can improve Looks slightly.',
        },
        failure: {
            charm: -5,
            stress: 10,
            message: 'It... didn\'t go well. You look worse and feel terrible.',
        },
    },
    {
        id: 'perfect',
        name: 'Dr. Perfect',
        cost: 100000,
        successRate: 0.9, // 90%
        looksMin: 20,
        looksMax: 30,
        success: {
            charm: 15,
            message: 'Professional care. Significant Looks boost.',
        },
        failure: {
            charm: 0,
            stress: 5,
            message: 'Minor disappointment. Not quite perfect this time.',
        },
    },
    {
        id: 'celebrity',
        name: 'The Celebrity Surgeon',
        cost: 500000,
        successRate: 1.0, // 100%
        looksMin: 30,
        looksMax: 40,
        success: {
            charm: 25,
            highSociety: 5,
            message: 'World-class artistry. Massive Looks & Status boost.',
        },
        failure: {
            charm: 0,
            stress: 0,
            message: '', // Never fails
        },
    },
];

// ==========================================
// 💇 GROOMING DATA
// ==========================================

export type GroomingService = {
    id: string;
    name: string;
    cost: number;
    luck: number;
    message: string;
};

export const GROOMING_SERVICES: GroomingService[] = [
    {
        id: 'fresh_cut',
        name: 'Fresh Cut & Style',
        cost: 2500,
        luck: 5,
        message: 'Fresh & Lucky! (+5 Luck for this quarter)',
    },
];

// ==========================================
// 💆 MASSAGE DATA
// ==========================================

export type MassageService = {
    id: string;
    name: string;
    cost: number;
    stress: number; // Amount of stress relief (positive number)
    health: number;
    description: string;
};

export const MASSAGE_SERVICES: MassageService[] = [
    {
        id: 'quick_rub',
        name: 'Quick Rub',
        cost: 500,
        stress: 2,
        health: 0,
        description: 'Quick relief for tired muscles.'
    },
    {
        id: 'deep_tissue',
        name: 'Deep Tissue',
        cost: 1500,
        stress: 7,
        health: 2,
        description: 'Intense pressure to release tension.'
    },
    {
        id: 'royal_treatment',
        name: 'Royal Treatment',
        cost: 5000,
        stress: 20,
        health: 5,
        description: 'The ultimate royal cleansing ritual.'
    },
];

// ==========================================
// 👑 MEMBERSHIP DATA
// ==========================================

export type Membership = {
    id: string;
    name: string;
    cost: number;
    description: string;
    benefits: string[];
};

export const VIP_MEMBERSHIP: Membership = {
    id: 'vip_platinum',
    name: 'VIP Platinum Access',
    cost: 20000,
    description: 'Exclusive quarterly membership with premium benefits',
    benefits: [
        'FREE Royal Massage Services',
        'Priority Booking',
        'Complimentary Refreshments',
        'VIP Lounge Access',
    ],
};
