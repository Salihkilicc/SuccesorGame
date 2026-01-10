import { JobDefinition } from '../types';

export const JOBS_DATABASE: JobDefinition[] = [
    // HIGH SOCIETY
    { id: 'model', title: 'Supermodel', tier: 'HIGH_SOCIETY', buffType: 'FAME_BOOST', buffValue: 1.5 },
    { id: 'heiress', title: 'Heiress', tier: 'HIGH_SOCIETY', buffType: 'GIFT_BONUS', buffValue: 2.0 },

    // CORPORATE
    { id: 'ceo', title: 'Tech CEO', tier: 'CORPORATE_ELITE', buffType: 'INVESTMENT_INSIGHT', buffValue: 1.2 },
    { id: 'surgeon', title: 'Neurosurgeon', tier: 'CORPORATE_ELITE', buffType: 'MEDICAL_DISCOUNT', buffValue: 0.5 },

    // UNDERGROUND
    { id: 'mafia', title: 'Mafia Associate', tier: 'UNDERGROUND', buffType: 'PROTECTION', buffValue: 1.0 },

    // BLUE COLLAR
    { id: 'nurse', title: 'Nurse', tier: 'BLUE_COLLAR', buffType: 'HEALING_SPEED', buffValue: 1.2 },
    { id: 'chef', title: 'Sous Chef', tier: 'BLUE_COLLAR', buffType: 'ENERGY_BOOST', buffValue: 1.1 },

    // STUDENT
    { id: 'student', title: 'Grad Student', tier: 'STUDENT_LIFE', buffType: 'INTELLECT_GAIN', buffValue: 1.1 },
];
