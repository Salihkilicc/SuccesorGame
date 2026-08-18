import { PersonalityTrait } from '../types';

export const PERSONALITY_TRAITS: PersonalityTrait[] = [
    { id: 'power_broker', label: 'Power Broker', costMultiplier: 1.8, description: 'Influential dealmaker, values corporate leverage.' },
    { id: 'sophisticated', label: 'Old-Money Elegance', costMultiplier: 2.0, description: 'Values family heritage, art collections, and discretion.' },
    { id: 'corporate_shark', label: 'Corporate Shark', costMultiplier: 1.5, description: 'Driven by market dominance, aggressive growth, and prestige.' },
    { id: 'gold_digger', label: 'High Maintenance', costMultiplier: 2.5, description: 'Uncompromising luxury taste, drains liquidity.' },
    { id: 'visionary', label: 'Tech Visionary', costMultiplier: 1.3, description: 'Obsessed with bleeding-edge innovation and disrupting monopolies.' },
    { id: 'philanthropist', label: 'Global Philanthropist', costMultiplier: 1.4, description: 'Focuses on foundations, diplomatic clout, and public legacy.' },
    { id: 'hedonist', label: 'Luxury Connoisseur', costMultiplier: 2.2, description: 'Enjoys vintage wines, superyachts, and Michelin dining.' },
    { id: 'ambitious', label: 'Ambitious Climber', costMultiplier: 1.2, description: 'Relentlessly focused on climbing the corporate ladder.' },
    { id: 'supportive', label: 'Loyal Confidante', costMultiplier: 1.0, description: 'Steady anchor, offers counsel during hostile takeovers.' },
    { id: 'frugal', label: 'Strategic Pragmatist', costMultiplier: 0.6, description: 'Hates wasteful vanity spending, values solid ROI.' },
];
