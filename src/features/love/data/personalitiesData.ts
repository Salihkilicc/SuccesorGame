import { PersonalityTrait } from '../types';

export const PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'gold_digger', label: 'High Maintenance', costMultiplier: 2.5, description: 'Loves luxury, drains wallet.' },
    { id: 'frugal', label: 'Frugal', costMultiplier: 0.5, description: 'Hates spending money.' },
    { id: 'supportive', label: 'Supportive', costMultiplier: 1.0, description: 'Always by your side.' },
    { id: 'party', label: 'Party Animal', costMultiplier: 1.5, description: 'Loves expensive nights out.' },
    { id: 'ambitious', label: 'Ambitious', costMultiplier: 1.2, description: 'Focused on career.' },
];
