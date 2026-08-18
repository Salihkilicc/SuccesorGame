// src/logic/relationshipEvents.ts
//
// ============================================================================
//  RELATIONSHIP EVENTS & NEWS PIPELINE WIRING
// ============================================================================
//
//  Connects romantic milestones and relationship fallouts to corporate impact:
//    - Marriage to partners boosts brandValue (+3 to +4 pts) & publishes news.
//    - Breakups/Divorce slightly decreases brandValue (-3 to -4 pts) & publishes news.
//    - Child births celebrate newborn heirs (+2 pts brandValue) & publishes news.
//    - Rejected proposals slightly lower brandValue (-2 pts) & publish society gossip.
//
// ============================================================================

import { useStatsStore } from '../core/store/useStatsStore';
import { useNewsStore, NewsPayload } from '../core/store/useNewsStore';
import { usePlayerStore } from '../core/store/usePlayerStore';
import { useFamilyStore } from '../core/store/useFamilyStore';
import { useIdentityStore } from '../core/store/useIdentityStore';
import { useMarketStore } from '../core/store/useMarketStore';
import { ExPartnerProfile, SocialClass } from '../data/relationshipTypes';

export interface RelationshipEventResult {
    success: boolean;
    error?: string;
    brandValueDelta: number;
    newBrandValue: number;
    newsHeadline: string;
    exPartner?: ExPartnerProfile | null;
}

const getCeoName = (): string => {
    const { firstName, lastName } = useIdentityStore.getState();
    const first = (firstName || 'Salih').trim();
    const last = (lastName || 'Hale').trim();
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full : 'Salih Hale';
};

const getCompanyName = (): string => {
    const { companyName } = useStatsStore.getState();
    return companyName && companyName.trim().length > 0 ? companyName.trim() : 'Hale Corp';
};

const getCurrentQuarter = (): number => {
    return useMarketStore.getState().currentQuarter || 1;
};

// ============================================================================
//  1. HANDLE MESSY BREAKUP / DIVORCE
// ============================================================================
export const handleMessyBreakup = (reason: string = 'drifted'): RelationshipEventResult => {
    const familyStore = useFamilyStore.getState();
    const partner = familyStore.partner;

    if (!partner) {
        return {
            success: false,
            error: 'No active partner to break up with.',
            brandValueDelta: 0,
            newBrandValue: useStatsStore.getState().brandValue ?? 0,
            newsHeadline: '',
        };
    }

    const currentQ = getCurrentQuarter();
    const ceo = getCeoName();
    const company = getCompanyName();
    const partnerName = partner.name;
    const isElite = (
        ['HighSociety', 'OldMoney', 'Royalty', 'BillionaireHeir', 'CriminalElite'] as SocialClass[]
    ).includes(partner.stats.socialClass);
    const wasMarriedWithoutPrenup = partner.isMarried && !partner.hasPrenup;

    // 1. Moderate Brand Value Penalty (-3 to -4 points)
    const brandPenalty = isElite || partner.isMarried ? 4 : 3;

    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.max(0, currentBrand - brandPenalty);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    // 2. Financial Settlement (if married without prenup -> 50% Wealth Halving!)
    const playerStore = usePlayerStore.getState();
    let settlementAmount = 0;
    if (wasMarriedWithoutPrenup) {
        const cash = playerStore.core.money;
        settlementAmount = Math.floor(cash * 0.5); // 50% divorce settlement (Nakit yarılanıyor)
        if (settlementAmount > 0) {
            playerStore.spendMoney(settlementAmount);
        }
    }

    // Adjust Player Vitals
    playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 25));
    playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 30));

    // 3. Formulate Dynamic Media Headline
    let headline = `Executive Separation: ${ceo} and ${partnerName} part ways.`;
    let newsBody = `Following a personal separation between ${ceo} and ${partnerName}, market observers note leadership restructuring at ${company}.`;

    if (partner.isMarried) {
        if (wasMarriedWithoutPrenup) {
            headline = `High-Stakes Divorce: ${ceo} forfeits 50% fortune ($${(settlementAmount / 1_000_000).toFixed(1)}M) in split with ${partnerName}!`;
            newsBody = `Marital dissolution for ${company} leadership rattles Wall Street as ${ceo} dissolves marriage without a prenup, transferring $${settlementAmount.toLocaleString()} to ${partnerName}.`;
        } else {
            headline = `Ironclad Divorce: ${ceo} and ${partnerName} dissolve marriage with protected assets.`;
            newsBody = `Following the dissolution of marriage between ${ceo} and ${partnerName}, corporate assets and personal reserves remain protected under prenuptial terms.`;
        }
    } else if (isElite) {
        headline = `High-Society Fallout: ${ceo} and ${partnerName} end relationship.`;
        newsBody = `Elite social circles report that ${ceo}, head of ${company}, and ${partnerName} have officially separated.`;
    }

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Media',
        source: 'Silicon Chronicle',
        headline,
        text: newsBody,
        quarter: currentQ,
        readTime: '2 min read',
        isHero: false,
    };

    useNewsStore.getState().addSingleNews(newsPayload);

    // 4. Archive into Ex-Partners and clear partner in FamilyStore
    const exPartnerRecord = familyStore.breakup(reason);

    return {
        success: true,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: headline,
        exPartner: exPartnerRecord,
    };
};

// ============================================================================
//  2. HANDLE MARRIAGE & PRENUP NEGOTIATION
// ============================================================================
export const handleMarriage = (
    wantsPrenup: boolean = true,
    locationBonus: number = 0,
): RelationshipEventResult & { wasForcedPrenup?: boolean; actualPrenup?: boolean; settlementProtected?: boolean } => {
    const familyStore = useFamilyStore.getState();
    const partner = familyStore.partner;

    if (!partner) {
        return {
            success: false,
            error: 'No active partner to marry.',
            brandValueDelta: 0,
            newBrandValue: useStatsStore.getState().brandValue ?? 0,
            newsHeadline: '',
        };
    }

    if (partner.isMarried) {
        return {
            success: false,
            error: 'Already married to this partner.',
            brandValueDelta: 0,
            newBrandValue: useStatsStore.getState().brandValue ?? 0,
            newsHeadline: '',
        };
    }

    const currentQ = getCurrentQuarter();
    const ceo = getCeoName();
    const company = getCompanyName();
    const partnerName = partner.name;

    // === 1. PRENUP ACCEPTANCE PROBABILITY LOGIC ===
    // Base chance is partner's romantic love level (0-100)
    const baseChance = partner.love;

    // Intelligent partners resent prenups more: penalty = 30 + (intelligence / 5)
    const partnerIntelligence = partner.stats?.intelligence || 50;
    const prenupPenalty = wantsPrenup ? 30 + Math.floor(partnerIntelligence / 5) : 0;
    const finalChance = Math.max(5, Math.min(98, baseChance - prenupPenalty + locationBonus));

    // Special Classes (Royalty, BillionaireHeir) ALWAYS require a Prenup
    const forcedPrenup = (['Royalty', 'BillionaireHeir'] as SocialClass[]).includes(partner.stats.socialClass);
    const actualPrenup = wantsPrenup || forcedPrenup;

    const roll = Math.random() * 100;

    // Check if rejected due to prenup demand
    if (roll > finalChance && wantsPrenup && !forcedPrenup) {
        // Love drops by 20 due to prenup insult/trust issues
        familyStore.updateLove(-20);
        const playerStore = usePlayerStore.getState();
        playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 15));
        playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 10));

        const rejRes = handleProposalRejected(partnerName);
        return {
            success: false,
            error: `${partnerName} was insulted by the Prenup demand and refused your proposal! Trust damaged (-20 Love).`,
            brandValueDelta: rejRes.brandValueDelta,
            newBrandValue: rejRes.newBrandValue,
            newsHeadline: rejRes.newsHeadline,
            actualPrenup: false,
        };
    }

    // === 2. MARRIAGE ACCEPTED ===
    const isElite = (
        ['HighSociety', 'OldMoney', 'Royalty', 'BillionaireHeir'] as SocialClass[]
    ).includes(partner.stats.socialClass);

    const brandBoost = isElite ? 4 : 3;
    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.min(100, currentBrand + brandBoost);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    // Boost Player Vitals
    const playerStore = usePlayerStore.getState();
    playerStore.updateCore('happiness', Math.min(100, playerStore.core.happiness + 25));
    playerStore.updateCore('stress', Math.max(0, playerStore.core.stress - 15));

    // Formulate Positive Dynamic Headline
    const prenupNotice = forcedPrenup && !wantsPrenup
        ? ' (Royal dynasty insisted on ironclad prenuptial agreement)'
        : actualPrenup
        ? ' (Protected with prenuptial accord)'
        : ' (Without prenuptial agreement — 50% fortune at stake)';

    const headline = isElite
        ? `High-Society Wedding: ${ceo} and ${partnerName} marry in lavish ceremony!`
        : `Executive Milestone: ${company} CEO ${ceo} ties the knot with ${partnerName}.`;

    const newsBody = `In a celebrated high-profile union, ${ceo}, CEO of ${company}, has married ${partnerName}${prenupNotice}. The union signals long-term stability and bolsters ${company}'s public prestige.`;

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Exclusive',
        source: 'Bloomberg Tech',
        headline,
        text: newsBody,
        quarter: currentQ,
        readTime: '2 min read',
        isHero: true,
    };

    useNewsStore.getState().addSingleNews(newsPayload);

    // Save marriage status & prenup state to FamilyStore
    familyStore.marry(actualPrenup);

    return {
        success: true,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: headline,
        wasForcedPrenup: forcedPrenup,
        actualPrenup,
        settlementProtected: actualPrenup,
    };
};

// ============================================================================
//  3. HANDLE PROPOSAL REJECTED
// ============================================================================
export const handleProposalRejected = (partnerName?: string): RelationshipEventResult => {
    const currentQ = getCurrentQuarter();
    const ceo = getCeoName();
    const company = getCompanyName();
    const resolvedPartnerName = partnerName || useFamilyStore.getState().partner?.name || 'Partner';

    // Moderate Brand Value Penalty (-2 points)
    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.max(0, currentBrand - 2);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    const playerStore = usePlayerStore.getState();
    playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 15));
    playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 10));

    const headline = `Society Gossip: Marriage proposal by ${ceo} turned down.`;
    const newsBody = `Gossip columns report that ${ceo}, head of ${company}, faced an unexpected romantic setback after proposing to ${resolvedPartnerName}. Socialites speculate on the fallout.`;

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Media',
        source: 'Silicon Chronicle',
        headline,
        text: newsBody,
        quarter: currentQ,
        readTime: '1 min read',
        isHero: false,
    };

    useNewsStore.getState().addSingleNews(newsPayload);

    return {
        success: true,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: headline,
    };
};

// ============================================================================
//  4. HANDLE CHILD BIRTH / NEW DYNASTY HEIR
// ============================================================================
export const handleChildBirth = (
    childName: string,
    gender: 'Male' | 'Female' = 'Male',
): RelationshipEventResult => {
    const currentQ = getCurrentQuarter();
    const ceo = getCeoName();
    const company = getCompanyName();
    const partnerName = useFamilyStore.getState().partner?.name || 'Partner';

    const cleanChildName = childName.endsWith('Hale')
        ? childName
        : `${childName.trim()} Hale`;

    // Moderate Brand Value Surge (+2 points)
    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.min(100, currentBrand + 2);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    const playerStore = usePlayerStore.getState();
    playerStore.updateCore('happiness', Math.min(100, playerStore.core.happiness + 20));
    playerStore.updateCore('stress', Math.max(0, playerStore.core.stress - 5));

    const headline = `Dynasty Heir Born: ${ceo} and ${partnerName} welcome ${cleanChildName}.`;
    const newsBody = `${company} leadership marks a momentous personal milestone as ${ceo} and ${partnerName} announce the birth of newborn heir ${cleanChildName} into the Hale family legacy.`;

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Corporate',
        source: 'Bloomberg Tech',
        headline,
        text: newsBody,
        quarter: currentQ,
        readTime: '2 min read',
        isHero: false,
    };

    useNewsStore.getState().addSingleNews(newsPayload);

    return {
        success: true,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: headline,
    };
};

// ============================================================================
//  5. HANDLE GIFT
// ============================================================================
export const handleGift = (giftValue: number = 15000): { success: boolean; error?: string; loveDelta: number } => {
    const familyStore = useFamilyStore.getState();
    const partner = familyStore.partner;

    if (!partner) {
        return { success: false, error: 'No partner to gift.', loveDelta: 0 };
    }

    const playerStore = usePlayerStore.getState();
    if (playerStore.core.money < giftValue) {
        return {
            success: false,
            error: `Insufficient cash ($${giftValue.toLocaleString()} required).`,
            loveDelta: 0,
        };
    }

    playerStore.spendMoney(giftValue);

    const loveBoost = Math.max(10, Math.min(30, Math.round(giftValue / 750)));
    familyStore.updateLove(loveBoost);

    playerStore.updateCore('happiness', Math.min(100, playerStore.core.happiness + 10));

    return { success: true, loveDelta: loveBoost };
};
