// src/logic/relationshipEvents.ts
//
// ============================================================================
//  RELATIONSHIP EVENTS & NEWS PIPELINE WIRING
// ============================================================================
//
//  Connects romantic milestones and relationship fallouts to corporate impact:
//    - Marriage to high-profile partners boosts brandValue & media prestige.
//    - Messy breakups with high-society or volatile partners tank brandValue
//      and trigger high-impact Silicon / Tabloid headlines.
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
    const full = `${firstName || ''} ${lastName || ''}`.trim();
    return full.length > 0 ? full : 'The CEO';
};

const getCompanyName = (): string => {
    const { companyName } = useStatsStore.getState();
    return companyName && companyName.trim().length > 0 ? companyName.trim() : 'Hale';
};

const getCurrentQuarter = (): number => {
    return useMarketStore.getState().currentQuarter || 1;
};

// ============================================================================
//  1. HANDLE MESSY BREAKUP
// ============================================================================

/**
 * Handles a relationship breakup or high-stakes divorce:
 * - If partner has high 'crazy' (>50) or belongs to elite social classes
 *   (HighSociety, OldMoney, Royalty, BillionaireHeir), heavily DECREASES brandValue.
 * - Pushes a sensational breaking news headline to useNewsStore.
 * - Manages financial settlement if married without prenup.
 */
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
    const isVolatile = partner.stats.crazy >= 50 || partner.stats.jealousy >= 60;
    const wasMarriedWithoutPrenup = partner.isMarried && !partner.hasPrenup;

    // 1. Calculate Brand Value Penalty
    let brandPenalty = 6; // Base penalty

    if (isElite) brandPenalty += 10;
    if (isVolatile) brandPenalty += 8;
    if (partner.isMarried) brandPenalty += 6;

    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.max(0, currentBrand - brandPenalty);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    // 2. Financial Settlement (if married without prenup)
    const playerStore = usePlayerStore.getState();
    if (wasMarriedWithoutPrenup) {
        const cash = playerStore.core.money;
        const settlement = Math.round(cash * 0.25); // 25% cash settlement
        if (settlement > 0) {
            playerStore.spendMoney(settlement);
        }
    }

    // Adjust Player Vitals
    playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 30));
    playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 35));

    // 3. Formulate Scandalous Media Headline
    let headline = `CEO's messy public breakup scares board members.`;
    let newsBody = `Following a volatile fallout between ${ceo} and ${partnerName}, institutional investors express concern over executive stability at ${company}.`;

    if (isElite && isVolatile) {
        headline = `Scandal at ${company}: ${partnerName} exposes explosive personal drama with ${ceo}!`;
        newsBody = `High-society circles in uproar as leaked disputes between ${ceo} and ${partnerName} dominate headlines, placing immense pressure on ${company}'s board.`;
    } else if (partner.isMarried) {
        headline = `High-Stakes Divorce: ${ceo} and ${partnerName} split amidst corporate scrutiny.`;
        newsBody = `Marital dissolution for ${company} leadership rattles shareholder confidence as financial terms and executive distraction become top concerns.`;
    } else if (isElite) {
        headline = `High-Society Fallout: ${ceo} and ${partnerName} part ways abruptly.`;
        newsBody = `Elite social networks report that ${ceo}, head of ${company}, has officially separated from ${partnerName}.`;
    }

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Breaking',
        source: 'Silicon Chronicle',
        headline,
        text: newsBody,
        quarter: currentQ,
        readTime: '3 min read',
        isHero: true,
    };

    useNewsStore.getState().addNewsBatch([newsPayload]);

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

/**
 * Handles a high-profile executive wedding:
 * - INCREASES corporate brandValue (+8 to +20 points).
 * - Pushes a positive high-society headline to useNewsStore.
 * - Sets isMarried: true in useFamilyStore.
 */
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

    // 1. Calculate Brand Value Surge
    const isElite = (
        ['HighSociety', 'OldMoney', 'Royalty', 'BillionaireHeir'] as SocialClass[]
    ).includes(partner.stats.socialClass);

    let brandBoost = 10;
    if (isElite) brandBoost += 10;
    if (partner.stats.looks >= 85) brandBoost += 4;

    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.min(100, currentBrand + brandBoost);
    const brandDelta = newBrand - currentBrand;

    useStatsStore.setState((s) => ({ ...s, brandValue: newBrand }));

    // Boost Player Vitals
    const playerStore = usePlayerStore.getState();
    playerStore.updateCore('happiness', Math.min(100, playerStore.core.happiness + 30));
    playerStore.updateCore('stress', Math.max(0, playerStore.core.stress - 15));

    // 2. Formulate Positive Society Headline
    const headline = isElite
        ? `High-Society Wedding: ${ceo} and ${partnerName} marry in lavish gala!`
        : `Executive Milestone: ${company} CEO ${ceo} ties the knot with ${partnerName}.`;

    const newsBody = `In a celebrated high-profile ceremony, ${ceo}, CEO of ${company}, has married ${partnerName}. The union signals long-term stability and bolsters ${company}'s cultural stature.`;

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

    useNewsStore.getState().addNewsBatch([newsPayload]);

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
//  3. HANDLE GIFT
// ============================================================================

/**
 * Handles sending a luxury gift to the partner:
 * - Deducts cash, increases partner love (+15 to +25), boosts player happiness.
 */
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
