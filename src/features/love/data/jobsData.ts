import { JobDefinition } from '../types';

export const JOBS_DATABASE: JobDefinition[] = [
    // HIGH SOCIETY (High attributes, Social Rep)
    { id: 'model', title: 'Supermodel', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 12 },
    { id: 'heiress', title: 'Heiress', tier: 'HIGH_SOCIETY', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 10 },
    { id: 'diplomat', title: 'Diplomat', tier: 'HIGH_SOCIETY', buffType: 'INTELLECT_GAIN', buffValue: 8 },
    { id: 'socialite', title: 'Socialite', tier: 'HIGH_SOCIETY', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 15 },

    // CORPORATE (Business Rep, Intellect)
    { id: 'ceo', title: 'Tech CEO', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 15 },
    { id: 'surgeon', title: 'Neurosurgeon', tier: 'CORPORATE_ELITE', buffType: 'INTELLECT_GAIN', buffValue: 14 },
    { id: 'lawyer', title: 'Corporate Lawyer', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 12 },
    { id: 'banker', title: 'Investment Banker', tier: 'CORPORATE_ELITE', buffType: 'BUSINESS_TRUST_BOOST', buffValue: 10 },

    // UNDERGROUND (Street Rep, Security, Luck)
    { id: 'mafia', title: 'Mafia Associate', tier: 'UNDERGROUND', buffType: 'STREET_CRED_BOOST', buffValue: 12 },
    { id: 'hacker', title: 'Black Hat Hacker', tier: 'UNDERGROUND', buffType: 'INTELLECT_GAIN', buffValue: 10 }, // Or Security
    { id: 'dealer', title: 'Casino Dealer', tier: 'UNDERGROUND', buffType: 'CASINO_VIP_BOOST', buffValue: 8 },
    { id: 'loan_shark', title: 'Loan Shark', tier: 'UNDERGROUND', buffType: 'STREET_CRED_BOOST', buffValue: 10 },
    { id: 'gambler', title: 'Pro Gambler', tier: 'UNDERGROUND', buffType: 'LUCK_BOOST', buffValue: 5 }, // Luck is powerful, keep lower

    // ARTISTIC (Charm, Social, Stress)
    { id: 'musician', title: 'Rockstar', tier: 'ARTISTIC', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 10 },
    { id: 'actress', title: 'Movie Star', tier: 'ARTISTIC', buffType: 'CHARM_BOOST', buffValue: 12 },
    { id: 'painter', title: 'Artist', tier: 'ARTISTIC', buffType: 'STRESS_RELIEF', buffValue: 8 },
    { id: 'writer', title: 'Novelist', tier: 'ARTISTIC', buffType: 'INTELLECT_GAIN', buffValue: 6 },

    // BLUE COLLAR (Strength, Stress, Street)
    { id: 'nurse', title: 'Nurse', tier: 'BLUE_COLLAR', buffType: 'STRESS_RELIEF', buffValue: 12 },
    { id: 'chef', title: 'Sous Chef', tier: 'BLUE_COLLAR', buffType: 'STRESS_RELIEF', buffValue: 8 },
    { id: 'trainer', title: 'Personal Trainer', tier: 'BLUE_COLLAR', buffType: 'STRENGTH_BOOST', buffValue: 10 },
    { id: 'mechanic', title: 'Mechanic', tier: 'BLUE_COLLAR', buffType: 'STREET_CRED_BOOST', buffValue: 5 },
    { id: 'firefighter', title: 'Firefighter', tier: 'BLUE_COLLAR', buffType: 'STRENGTH_BOOST', buffValue: 12 },

    // STUDENT (Intellect, Potential)
    { id: 'grad_student', title: 'Grad Student', tier: 'STUDENT_LIFE', buffType: 'INTELLECT_GAIN', buffValue: 6 },
    { id: 'med_student', title: 'Med Student', tier: 'STUDENT_LIFE', buffType: 'INTELLECT_GAIN', buffValue: 8 },
    { id: 'party_animal', title: 'Party Animal', tier: 'STUDENT_LIFE', buffType: 'SOCIAL_STATUS_BOOST', buffValue: 5 },
];
