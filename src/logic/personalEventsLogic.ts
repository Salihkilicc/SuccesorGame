// src/logic/personalEventsLogic.ts
//
// ============================================================================
//  PERSONAL EVENTS & NEWS WIRING LOGIC
// ============================================================================
//
//  Bridges personal lifestyle choices, luxury acquisitions, and family crises
//  to corporate impact:
//    - Buying ultra-luxury assets projects executive power and boosts brandValue
//    - Partner crises and tabloid scandals rattle markets and degrade brandValue
//    - Automatically publishes broadcast and tabloid headlines to useNewsStore
//
// ============================================================================

import { useStatsStore } from '../core/store/useStatsStore';
import { useNewsStore, NewsPayload } from '../core/store/useNewsStore';
import { usePlayerStore } from '../core/store/usePlayerStore';
import { useFamilyStore, PartnerStatus } from '../core/store/useFamilyStore';
import { useLuxoNetStore, LuxuryAsset, OwnedLuxuryAsset } from '../core/store/useLuxoNetStore';
import { useIdentityStore } from '../core/store/useIdentityStore';
import { useMarketStore } from '../core/store/useMarketStore';

// ============================================================================
//  TYPES
// ============================================================================

export interface LuxuryPurchaseResult {
    success: boolean;
    error?: string;
    cost: number;
    brandValueDelta: number;
    newBrandValue: number;
    newsHeadline: string;
    ownedAsset?: OwnedLuxuryAsset;
}

export type PartnerCrisisType =
    | 'divorce'
    | 'infidelity'
    | 'extravagance_leak'
    | 'prenup_battle'
    | 'boardroom_feud';

export interface PartnerCrisisResult {
    success: boolean;
    crisisType: PartnerCrisisType;
    brandValueDelta: number;
    newBrandValue: number;
    newsHeadline: string;
    partnerStatusAfter: PartnerStatus;
}

// ============================================================================
//  INTERNAL HELPERS
// ============================================================================

/**
 * Retrieves the current CEO name from IdentityStore or defaults to 'The CEO'.
 */
const getCeoName = (): string => {
    const { firstName, lastName } = useIdentityStore.getState();
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName.length > 0 ? fullName : 'The CEO';
};

/**
 * Retrieves the current company name or defaults to 'Hale'.
 */
const getCompanyName = (): string => {
    const { companyName } = useStatsStore.getState();
    return companyName && companyName.trim().length > 0 ? companyName.trim() : 'Hale';
};

/**
 * Retrieves current quarter safely from market store or falls back to 1.
 */
const getCurrentQuarter = (): number => {
    return useMarketStore.getState().currentQuarter || 1;
};

// ============================================================================
//  1. HANDLE BUY LUXURY
// ============================================================================

/**
 * Executes a luxury asset purchase from LuxoNet:
 * 1. Validates & deducts personal cash from player's wallet.
 * 2. Adds asset to LuxoNet ownedAssets portfolio.
 * 3. Heavily INCREASES corporate brandValue (luxury flaunting signals market dominance & supreme prestige).
 * 4. Pushes an Exclusive / Breaking news article to useNewsStore.
 *
 * @param asset The luxury asset object (or catalog ID) being purchased.
 */
export const handleBuyLuxury = (
    asset: LuxuryAsset | { id: string; name: string; price: number; prestigeScore?: number; category?: string; brand?: string },
): LuxuryPurchaseResult => {
    const price = asset.price;
    const playerStore = usePlayerStore.getState();
    const currentCash = playerStore.core.money;

    // 1. Verify personal funds
    if (currentCash < price) {
        return {
            success: false,
            error: `Insufficient personal funds. Price: $${price.toLocaleString()}, Available: $${currentCash.toLocaleString()}`,
            cost: 0,
            brandValueDelta: 0,
            newBrandValue: useStatsStore.getState().brandValue ?? 0,
            newsHeadline: '',
        };
    }

    // 2. Execute transaction via LuxoNet store if item exists in catalog
    const luxoStore = useLuxoNetStore.getState();
    const currentQ = getCurrentQuarter();
    const purchaseOutcome = luxoStore.buyAsset(asset.id, 2026, currentQ);

    // If not in catalog, deduct cash directly through PlayerStore
    if (!purchaseOutcome.success && purchaseOutcome.error?.includes('Item not found')) {
        const spent = playerStore.spendMoney(price);
        if (!spent) {
            return {
                success: false,
                error: 'Could not deduct funds from player wallet.',
                cost: 0,
                brandValueDelta: 0,
                newBrandValue: useStatsStore.getState().brandValue ?? 0,
                newsHeadline: '',
            };
        }
    } else if (!purchaseOutcome.success) {
        return {
            success: false,
            error: purchaseOutcome.error || 'Failed to complete luxury acquisition.',
            cost: 0,
            brandValueDelta: 0,
            newBrandValue: useStatsStore.getState().brandValue ?? 0,
            newsHeadline: '',
        };
    }

    // 3. Calculate Brand Value Surge
    // Luxury items exhibit immense signaling power. Scaled with price tier and prestige score.
    const prestige = 'prestigeScore' in asset && asset.prestigeScore ? asset.prestigeScore : 100;
    const baseBoost = Math.max(6, Math.min(25, Math.round(prestige / 25)));

    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.min(100, currentBrand + baseBoost);
    const brandDelta = newBrand - currentBrand;

    // Apply Brand Surge to StatsStore
    useStatsStore.setState((s) => ({
        ...s,
        brandValue: newBrand,
    }));

    // 4. Generate & Push News Headline
    const ceo = getCeoName();
    const company = getCompanyName();

    const headlines: string[] = [
        `${company} CEO acquires ${asset.name} in massive power display!`,
        `High Society Buzz: ${ceo} spotted with ultra-exclusive ${asset.name}.`,
        `Executive Dominance: ${company} leadership splurges $${(price / 1_000_000).toFixed(1)}M on ${asset.name}.`,
        `${company} brand surges as CEO's luxury lifestyle captivates global media.`,
    ];

    const chosenHeadline = headlines[Math.floor(Math.random() * headlines.length)];
    const newsStoryText = `In a lavish show of wealth and executive influence, ${ceo}, head of ${company}, has officially purchased the ${asset.name} valued at $${price.toLocaleString()}. Industry analysts note that this bold acquisition elevates ${company}'s global prestige and cultural footprint.`;

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Exclusive',
        source: 'Silicon Chronicle',
        headline: chosenHeadline,
        text: newsStoryText,
        quarter: currentQ,
        readTime: '2 min read',
        isHero: true,
    };

    useNewsStore.getState().addNewsBatch([newsPayload]);

    return {
        success: true,
        cost: price,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: chosenHeadline,
        ownedAsset: purchaseOutcome.asset,
    };
};

// ============================================================================
//  2. HANDLE PARTNER CRISIS
// ============================================================================

/**
 * Simulates a personal partner scandal or divorce crisis:
 * 1. Updates the partner's status & love level in useFamilyStore.
 * 2. DECREASES corporate brandValue (investors panic over CEO distraction & governance instability).
 * 3. Pushes a sensational gossip / market headline to useNewsStore.
 *
 * @param crisisType Type of family crisis ('divorce' | 'infidelity' | 'prenup_battle', etc.)
 * @param severity Optional custom severity multiplier (default: 1)
 */
export const handlePartnerCrisis = (
    crisisType: PartnerCrisisType = 'divorce',
    severity: number = 1,
): PartnerCrisisResult => {
    const familyStore = useFamilyStore.getState();
    const partner = familyStore.partner;
    const currentQ = getCurrentQuarter();
    const ceo = getCeoName();
    const company = getCompanyName();
    const partnerName = partner?.name || 'Partner';

    // 1. Update Family Store State
    let brandPenalty = 10 * severity;
    let resultingStatus: PartnerStatus = 'Divorced';

    switch (crisisType) {
        case 'divorce':
            brandPenalty = Math.round(12 * severity);
            resultingStatus = 'Divorced';
            familyStore.breakup('divorce');
            break;

        case 'prenup_battle':
            brandPenalty = Math.round(15 * severity);
            resultingStatus = 'Separated';
            familyStore.updateLove(-40);
            break;

        case 'infidelity':
            brandPenalty = Math.round(10 * severity);
            resultingStatus = 'Separated';
            familyStore.updateLove(-50);
            break;

        case 'extravagance_leak':
            brandPenalty = Math.round(8 * severity);
            resultingStatus = partner?.isMarried ? 'Married' : 'Dating';
            familyStore.updateLove(-15);
            break;

        case 'boardroom_feud':
            brandPenalty = Math.round(14 * severity);
            resultingStatus = partner?.isMarried ? 'Married' : 'Dating';
            familyStore.updateLove(-25);
            break;
    }

    // 2. Reduce Corporate Brand Value
    const currentBrand = useStatsStore.getState().brandValue ?? 18;
    const newBrand = Math.max(0, currentBrand - brandPenalty);
    const brandDelta = newBrand - currentBrand; // Negative number

    useStatsStore.setState((s) => ({
        ...s,
        brandValue: newBrand,
    }));

    // Also increase player stress and reduce happiness slightly
    const playerStore = usePlayerStore.getState();
    playerStore.updateCore('stress', Math.min(100, playerStore.core.stress + 20));
    playerStore.updateCore('happiness', Math.max(0, playerStore.core.happiness - 25));

    // 3. Generate Gossip & Financial News Headline
    const headlineTemplates: Record<PartnerCrisisType, string[]> = {
        divorce: [
            `Messy divorce for ${company} CEO scares investors.`,
            `High-Stakes Separation: ${ceo} and ${partnerName} split amidst asset division questions.`,
            `Marital collapse for ${company} chief sparks corporate governance jitters.`,
        ],
        prenup_battle: [
            `Billion-dollar prenup feud between ${ceo} and ${partnerName} leaks to press!`,
            `${company} stock wavers as CEO becomes embroiled in bitter family court battle.`,
        ],
        infidelity: [
            `Tabloid Bomb: ${ceo} caught in explosive personal scandal.`,
            `Public fallout as rumors rock ${company} CEO's private life.`,
        ],
        extravagance_leak: [
            `Leaked financial records reveal lavish lifestyle of ${company} CEO and spouse.`,
            `Critics slam ${ceo}'s unchecked personal spending during volatile market conditions.`,
        ],
        boardroom_feud: [
            `Family drama spills into boardroom: ${partnerName} challenges ${company} CEO's direction.`,
            `Internal discord at ${company} following bitter public dispute involving CEO's partner.`,
        ],
    };

    const templateList = headlineTemplates[crisisType] || headlineTemplates.divorce;
    const chosenHeadline = templateList[Math.floor(Math.random() * templateList.length)];

    const newsStoryText = `Market analysts express concern following reports of severe personal friction involving ${ceo}, CEO of ${company}, and ${partnerName}. Shares showed early turbulence as institutional investors question leadership focus and potential settlement liquidations.`;

    const newsPayload: NewsPayload = {
        type: 'player',
        category: 'Breaking',
        source: 'Bloomberg Tech',
        headline: chosenHeadline,
        text: newsStoryText,
        quarter: currentQ,
        readTime: '3 min read',
        isHero: true,
    };

    useNewsStore.getState().addNewsBatch([newsPayload]);

    return {
        success: true,
        crisisType,
        brandValueDelta: brandDelta,
        newBrandValue: newBrand,
        newsHeadline: chosenHeadline,
        partnerStatusAfter: resultingStatus,
    };
};
