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

    // 2. Financial Settlement (if married without prenup)
    const playerStore = usePlayerStore.getState();
    if (wasMarriedWithoutPrenup) {
        const cash = playerStore.core.money;
        const settlement = Math.round(cash * 0.15); // 15% cash settlement
        if (settlement > 0) {
            playerStore.spendMoney(settlement);
        }
    }

    // Adjust Player Vitals
    playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 15));
    playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 20));

    // 3. Formulate Dynamic Media Headline
    let headline = `Executive Separation: ${ceo} and ${partnerName} part ways.`;
    let newsBody = `Following a personal separation between ${ceo} and ${partnerName}, market observers note leadership restructuring at ${company}.`;

    if (partner.isMarried) {
        headline = `High-Stakes Divorce: ${ceo} and ${partnerName} split amid corporate scrutiny.`;
        newsBody = `Marital dissolution for ${company} leadership rattles headline columns as ${ceo} and ${partnerName} officially dissolve their marriage.`;
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
//  2. HANDLE MARRIAGE
// ============================================================================
export const handleMarriage = (hasPrenup: boolean = true): RelationshipEventResult => {
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

    // 1. Moderate Brand Value Surge (+3 to +4 points)
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
    playerStore.updateCore('happiness', Math.min(100, playerStore.core.happiness + 20));
    playerStore.updateCore('stress', Math.max(0, playerStore.core.stress - 10));

    // 2. Formulate Positive Dynamic Headline
    const headline = isElite
        ? `High-Society Wedding: ${ceo} and ${partnerName} marry in lavish ceremony!`
        : `Executive Milestone: ${company} CEO ${ceo} ties the knot with ${partnerName}.`;

    const newsBody = `In a celebrated high-profile union, ${ceo}, CEO of ${company}, has married ${partnerName}. The union signals long-term stability and bolsters ${company}'s public prestige.`;

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

    // 3. Update Family Store
    familyStore.marry(hasPrenup);

    return {
        success: true,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: headline,
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
