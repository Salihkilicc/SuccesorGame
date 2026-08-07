import type { PartnerProfile } from '../../../core/types';

// Progress-bar style gradient: left side fills with purple proportional to love%
// Uses rich multi-stop colors so the card never looks flat
export const getLoveGradient = (love: number): { colors: string[]; locations: number[] } => {
    const pct = Math.max(0, Math.min(100, love)) / 100;

    if (pct <= 0) {
        // Full navy: deep blue with subtle teal shimmer
        return { colors: ['#000000', '#12379F', '#12379F', '#000000'], locations: [0, 0.3, 0.7, 1] };
    }
    if (pct >= 1) {
        // Full purple: vivid violet with highlights
        return { colors: ['#0A2A92', '#0A2A92', '#0A2A92', '#0A2A92'], locations: [0, 0.3, 0.7, 1] };
    }

    // Mixed: purple left (love%) → soft pink transition → rich navy right
    const midPurple = pct * 0.7;
    const transStart = pct - 0.02;
    const transEnd = Math.min(pct + 0.12, 0.97);
    const navyStart = Math.min(pct + 0.13, 0.98);

    return {
        colors: [
            '#0A2A92',   // deep violet start
            '#0A2A92',   // bright purple
            '#12379F',   // lighter purple peak
            '#E06B6B',   // hot pink transition
            '#12379F',   // navy
            '#000000',   // deep midnight end
        ],
        locations: [
            0,
            Math.max(midPurple, 0.01),
            Math.max(transStart, 0.02),
            Math.min(transEnd, 0.96),
            Math.min(navyStart, 0.97),
            1,
        ],
    };
};

export const getPartnerBadge = (partner: PartnerProfile | null, love: number): string => {
    if (partner?.isMarried) return 'Married';
    if (love >= 90) return 'Soulmate';
    if (love >= 70) return 'Lover';
    if (love >= 40) return 'Dating';
    return 'Neutral';
};
