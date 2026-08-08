import { PartnerProfile } from '../core/types';
import { formatMoney } from '../core/utils';

export interface PartnerBuffResult {
    changes: {
        attributes?: {
            intellect?: number;
            strength?: number;
            charm?: number;
            looks?: number;
        };
        core?: {
            health?: number;
            happiness?: number;
            stress?: number;
        };
        reputation?: {
            social?: number;
            street?: number;
            business?: number;
            police?: number;
            casino?: number;
        };
        personality?: {
            ambition?: number;
        };
        security?: {
            digital?: number;
            personal?: number;
        };
        skills?: {
            martialArts?: {
                progress?: number;
            };
        };
        hidden?: {
            luck?: number; // Replaces generic 'security'
        };
        money?: number;
    };
    notification: string | null;
}

/**
 * Applies buffs based on partner's Occupation and Social Class.
 * Runs quarterly.
 * @param partner The current partner profile.
 * @returns Object containing stat changes and a notification message.
 */
export const applyPartnerBuffs = (partner: PartnerProfile): PartnerBuffResult => {
    const changes: PartnerBuffResult['changes'] = {
        attributes: {},
        core: {},
        reputation: {},
        personality: {},
        security: {},
        skills: {},
        hidden: {},
        money: 0
    };
    let notifications: string[] = [];

    // Safely extract job and social class
    let rawJob = '';
    let socialClass = 'MiddleClass';

    // 1. Legacy Structure
    if (partner.stats) {
        if (partner.stats.occupation) rawJob = partner.stats.occupation;
        if (partner.stats.socialClass) socialClass = partner.stats.socialClass;
    }

    // 2. New Deep Persona Structure
    if (!rawJob && 'job' in partner) {
        const deepPartner = partner as any;
        if (deepPartner.job?.title) rawJob = deepPartner.job.title;

        // Map Tier to Class if needed
        if (deepPartner.job?.tier) {
            const tierMap: Record<string, string> = {
                'HIGH_SOCIETY': 'HighSociety',
                'CORPORATE_ELITE': 'OldMoney',
                'UNDERGROUND': 'CriminalElite',
                'BLUE_COLLAR': 'WorkingClass',
                'STUDENT_LIFE': 'MiddleClass',
                'ARTISTIC': 'MiddleClass'
            };
            socialClass = tierMap[deepPartner.job.tier] || 'MiddleClass';
        }
    }

    const job = rawJob.toLowerCase();

    // --- 1. OCCUPATIONAL BUFFS ---

    // 🛡️ Security & Tech (Hacker, Engineer)
    if (['hacker', 'scientist', 'engineer', 'developer'].some(o => job.includes(o))) {
        changes.security!.digital = 15;
        changes.attributes!.intellect = (changes.attributes!.intellect || 0) + 2;
        notifications.push(`${partner.name} upgraded your digital defenses.`);
    }

    // 🥋 Athlete & Fighter (MMA, Personal Trainer)
    if (['athlete', 'personal trainer', 'mma', 'fighter', 'boxer'].some(o => job.includes(o))) {
        changes.security!.personal = 10;
        changes.skills!.martialArts = { progress: 10 };
        notifications.push(`${partner.name} trained with you. (+10 Gym Progress)`);
    }

    // ⚖️ Law (Lawyer, Judge)
    if (['lawyer', 'judge'].some(o => job.includes(o))) {
        changes.reputation!.police = -10;
        changes.reputation!.business = 5;
    }

    // 🩺 Medical (Doctor, Nurse)
    if (['doctor', 'nurse', 'surgeon'].some(o => job.includes(o))) {
        changes.core!.health = 5;
    }

    // ✨ Social (Influencer, Model)
    if (['model', 'influencer', 'actress'].some(o => job.includes(o))) {
        changes.reputation!.social = 10;
        changes.attributes!.charm = 3;
    }

    // 🎰 Casino (Manager, Dealer)
    if (['casino', 'dealer', 'croupier'].some(o => job.includes(o))) {
        changes.reputation!.casino = 15;
        changes.hidden!.luck = 2;
        notifications.push(`${partner.name} shared casino secrets.`);
    }

    // --- 2. SOCIAL CLASS MULTIPLIERS ---

    // CriminalElite (Yakuza, Mafia)
    if (socialClass === 'CriminalElite') {
        changes.reputation!.street = 15;
        changes.security!.personal = (changes.security!.personal || 0) + 20;
        changes.reputation!.business = -5;
        notifications.push(`${partner.name} sent goons to protect you.`);
    }

    // BillionaireHeir / Royalty
    if (['Royalty', 'BillionaireHeir'].includes(socialClass)) {
        changes.reputation!.business = 15;
        changes.reputation!.social = 15;

        // Cash Gift (20% Chance)
        if (Math.random() < 0.20) {
            const gift = Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;
            changes.money = gift;
            notifications.push(`${partner.name} gave you a gift of ${formatMoney(gift)}.`);
        }
    }

    // HighSociety
    if (socialClass === 'HighSociety') {
        changes.reputation!.social = (changes.reputation!.social || 0) + 10;
    }

    // --- 3. CONSOLIDATE NOTIFICATIONS ---
    let finalNotification = null;
    if (notifications.length > 0) {
        finalNotification = notifications.join('\n');
    }

    return { changes, notification: finalNotification };
};

// --- PERK SYSTEM ---

export interface Perk {
    id: string;
    icon: string;
    title: string;
    desc: string;
    color: string;
}

export const getPartnerPerks = (partner: PartnerProfile | any): Perk[] => {
    const perks: Perk[] = [];

    // --- NEW SYSTEM (Prioritize buffType) ---
    if (partner.job && partner.job.buffType) {
        const { buffType, buffValue = 0 } = partner.job;
        const val = Math.round(buffValue);

        switch (buffType) {
            case 'STREET_CRED_BOOST':
                perks.push({
                    id: 'street_rep',
                    icon: '🔫',
                    title: 'Street Cred',
                    desc: `+${val} Street Reputation`,
                    color: '#C836CA' // Dark Red
                });
                break;
            case 'BUSINESS_TRUST_BOOST':
                perks.push({
                    id: 'biz_trust',
                    icon: '🤝',
                    title: 'Business Trust',
                    desc: `+${val} Business Reputation`,
                    color: '#C734CA' // Gold
                });
                break;
            case 'SOCIAL_STATUS_BOOST':
            case 'FAME_BOOST':
            case 'REPUTATION_BOOST':
                perks.push({
                    id: 'social_status',
                    icon: '🌟',
                    title: 'Social Status',
                    desc: `+${val} Social Reputation`,
                    color: '#C836CA' // Pink
                });
                break;
            case 'CASINO_VIP_BOOST':
                perks.push({
                    id: 'casino_vip',
                    icon: '🎰',
                    title: 'Casino VIP',
                    desc: `+${val * 10} Casino Reputation`, // Scaled for UI consistency
                    color: '#C836CA' // Red
                });
                break;
            case 'INTELLECT_GAIN':
                perks.push({
                    id: 'intellect',
                    icon: '🧠',
                    title: 'Intellect Boost',
                    desc: `+${val} Intellect`,
                    color: '#6004BD' // Purple
                });
                break;
            case 'CHARM_BOOST':
                perks.push({
                    id: 'charm',
                    icon: '🌹',
                    title: 'Charm Boost',
                    desc: `+${val} Charm`,
                    color: '#C836CA' // Pink
                });
                break;
            case 'STRENGTH_BOOST':
            case 'STRENGTH_TRAINING':
            case 'GYM_GAINS':
                perks.push({
                    id: 'strength',
                    icon: '💪',
                    title: 'Strength Boost',
                    desc: `+${val} Strength`,
                    color: '#C734CA' // Orange
                });
                break;
            case 'PROTECTION':
                perks.push({
                    id: 'protection',
                    icon: '🛡️',
                    title: 'Protection',
                    desc: `+${val} Personal Security`,
                    color: '#11063D' // Navy
                });
                break;
            case 'LUCK_BOOST':
                perks.push({
                    id: 'luck',
                    icon: '🍀',
                    title: 'Lucky charm',
                    desc: `+${val} Luck`,
                    color: '#C8C0EF' // Green
                });
                break;
            case 'STRESS_RELIEF':
                perks.push({
                    id: 'stress_relief',
                    icon: '🧘',
                    title: 'Stress Relief',
                    desc: `-${val} Stress / Turn`,
                    color: '#7B68D7' // Blue
                });
                break;
            case 'MEDICAL_DISCOUNT':
                perks.push({
                    id: 'med_discount',
                    icon: '🏥',
                    title: 'Medical Aid',
                    desc: `Health Recovery Bonus`,
                    color: '#C8C0EF'
                });
                break;
            case 'INVESTMENT_INSIGHT':
                perks.push({
                    id: 'invest_insight',
                    icon: '📈',
                    title: 'Insider Info',
                    desc: `Better Investment Returns`,
                    color: '#C734CA'
                });
                break;
            default:
                // Fallback for unknown types
                perks.push({
                    id: 'generic_buff',
                    icon: '✨',
                    title: 'Partner Bonus',
                    desc: `${buffType.replace(/_/g, ' ')}`,
                    color: 'rgba(255,255,255,0.48)'
                });
                break;
        }

        // Return early if we found a new buff type, ignoring legacy check
        return perks;
    }

    // --- FALLBACK LEGACY LOGIC (If no buffType on job) ---

    // Safely extract job and social class (handling both Old Profile and Deep Persona structures)
    let jobTitle = '';
    let socialClass = 'MiddleClass'; // Default fallback

    // 1. Try Old Structure (PartnerStats)
    if (partner.stats) {
        if (partner.stats.occupation) jobTitle = partner.stats.occupation;
        if (partner.stats.socialClass) socialClass = partner.stats.socialClass;
    }

    // 2. Try Deep Persona Structure (JobDefinition) if failed
    if (!jobTitle && partner.job && partner.job.title) {
        jobTitle = partner.job.title;
        // Map Tier to Class if needed found in simple mapping
        const tierMap: Record<string, string> = {
            'HIGH_SOCIETY': 'HighSociety',
            'CORPORATE_ELITE': 'OldMoney',
            'UNDERGROUND': 'CriminalElite',
            'BLUE_COLLAR': 'WorkingClass',
            'STUDENT_LIFE': 'MiddleClass',
            'ARTISTIC': 'MiddleClass'
        };
        if (partner.job.tier) socialClass = tierMap[partner.job.tier] || 'MiddleClass';
    }

    if (!jobTitle) return []; // No job, no perks

    const job = jobTitle.toLowerCase();

    // 🛡️ Security & Tech (Hacker, Engineer)
    if (['hacker', 'scientist', 'engineer', 'developer', 'cyber', 'it_specialist'].some(o => job.includes(o))) {
        perks.push({
            id: 'hacker_shield',
            icon: '💻',
            title: 'Cyber Sentinel',
            desc: '+15 Digital Security, +2 Intellect',
            color: '#7B68D7'
        });
    }

    // 🥋 Athlete & Fighter (MMA, Personal Trainer)
    if (['athlete', 'personal trainer', 'mma', 'fighter', 'boxer', 'gym'].some(o => job.includes(o))) {
        perks.push({
            id: 'fighter_spirit',
            icon: '🥊',
            title: 'Corner Man',
            desc: '+10 Gym Progress, +10 Personal Security',
            color: '#C734CA'
        });
    }

    // ⚖️ Law (Lawyer, Judge)
    if (['lawyer', 'judge', 'attorney', 'prosecutor'].some(o => job.includes(o))) {
        perks.push({
            id: 'legal_immunity',
            icon: '⚖️',
            title: 'Legal Immunity',
            desc: 'Clears Police Heat, -10 Risk',
            color: '#6004BD'
        });
    }

    // 🩺 Medical (Doctor, Nurse)
    if (['doctor', 'nurse', 'surgeon', 'paramedic'].some(o => job.includes(o))) {
        perks.push({
            id: 'private_care',
            icon: '🩺',
            title: 'Private Care',
            desc: '+10 Health, Fast Recovery',
            color: '#C8C0EF'
        });
    }

    // ✨ Social (Influencer, Model)
    if (['model', 'influencer', 'actress', 'actor', 'celebrity'].some(o => job.includes(o))) {
        perks.push({
            id: 'social_status',
            icon: '✨',
            title: 'Social Status',
            desc: '+15 Social Rep, VIP Access',
            color: '#C836CA'
        });
    }

    // 🎰 Casino (Manager, Dealer)
    if (['casino', 'dealer', 'croupier', 'pit boss', 'manager'].some(o => job.includes(o))) {
        perks.push({
            id: 'house_edge',
            icon: '🎰',
            title: 'House Edge',
            desc: '+15 Casino Rep, +2 Luck',
            color: '#C836CA'
        });
    }

    // --- SOCIAL CLASS PERKS ---

    // CriminalElite (Yakuza, Mafia)
    if (socialClass === 'CriminalElite' || job.includes('yakuza') || job.includes('mafia') || job.includes('boss')) {
        perks.push({
            id: 'syndicate_shield',
            icon: '🗡️',
            title: 'Syndicate Shield',
            desc: '+20 Personal Security, +15 Street Rep',
            color: '#C836CA'
        });
    }

    // BillionaireHeir / Royalty
    if (['Royalty', 'BillionaireHeir'].includes(socialClass)) {
        perks.push({
            id: 'royal_treasury',
            icon: '👑',
            title: 'Royal Treasury',
            desc: ' Chance for $50k Gifts, +20 Business Rep',
            color: '#C734CA'
        });
    }

    // HighSociety
    if (socialClass === 'HighSociety') {
        perks.push({
            id: 'elite_network',
            icon: '🥂',
            title: 'Elite Network',
            desc: '+10 Social Rep, Exclusive Invites',
            color: '#6004BD'
        });
    }

    return perks;
};
