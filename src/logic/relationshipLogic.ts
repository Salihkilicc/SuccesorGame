import { PartnerProfile } from '../core/types';

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

    const { occupation, socialClass } = partner.stats;
    const job = occupation.toLowerCase();

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
            notifications.push(`${partner.name} gave you a gift of $${gift.toLocaleString()}.`);
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

export const getPartnerPerks = (partner: PartnerProfile): Perk[] => {
    const perks: Perk[] = [];
    const { occupation, socialClass } = partner.stats;
    const job = occupation.toLowerCase();

    // 🛡️ Security & Tech (Hacker, Engineer)
    if (['hacker', 'scientist', 'engineer', 'developer', 'cyber', 'it_specialist'].some(o => job.includes(o))) {
        perks.push({
            id: 'hacker_shield',
            icon: '💻',
            title: 'Cyber Sentinel',
            desc: '+15 Digital Security, +2 Intellect',
            color: '#3498db'
        });
    }

    // 🥋 Athlete & Fighter (MMA, Personal Trainer)
    if (['athlete', 'personal trainer', 'mma', 'fighter', 'boxer', 'gym'].some(o => job.includes(o))) {
        perks.push({
            id: 'fighter_spirit',
            icon: '🥊',
            title: 'Corner Man',
            desc: '+10 Gym Progress, +10 Personal Security',
            color: '#e67e22'
        });
    }

    // ⚖️ Law (Lawyer, Judge)
    if (['lawyer', 'judge', 'attorney', 'prosecutor'].some(o => job.includes(o))) {
        perks.push({
            id: 'legal_immunity',
            icon: '⚖️',
            title: 'Legal Immunity',
            desc: 'Clears Police Heat, -10 Risk',
            color: '#9b59b6'
        });
    }

    // 🩺 Medical (Doctor, Nurse)
    if (['doctor', 'nurse', 'surgeon', 'paramedic'].some(o => job.includes(o))) {
        perks.push({
            id: 'private_care',
            icon: '🩺',
            title: 'Private Care',
            desc: '+10 Health, Fast Recovery',
            color: '#2ecc71'
        });
    }

    // ✨ Social (Influencer, Model)
    if (['model', 'influencer', 'actress', 'actor', 'celebrity'].some(o => job.includes(o))) {
        perks.push({
            id: 'social_status',
            icon: '✨',
            title: 'Social Status',
            desc: '+15 Social Rep, VIP Access',
            color: '#e91e63'
        });
    }

    // 🎰 Casino (Manager, Dealer)
    if (['casino', 'dealer', 'croupier', 'pit boss', 'manager'].some(o => job.includes(o))) {
        perks.push({
            id: 'house_edge',
            icon: '🎰',
            title: 'House Edge',
            desc: '+15 Casino Rep, +2 Luck',
            color: '#e74c3c'
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
            color: '#c0392b'
        });
    }

    // BillionaireHeir / Royalty
    if (['Royalty', 'BillionaireHeir'].includes(socialClass)) {
        perks.push({
            id: 'royal_treasury',
            icon: '👑',
            title: 'Royal Treasury',
            desc: ' Chance for $50k Gifts, +20 Business Rep',
            color: '#f1c40f'
        });
    }

    // HighSociety
    if (socialClass === 'HighSociety') {
        perks.push({
            id: 'elite_network',
            icon: '🥂',
            title: 'Elite Network',
            desc: '+10 Social Rep, Exclusive Invites',
            color: '#9b59b6'
        });
    }

    return perks;
};
