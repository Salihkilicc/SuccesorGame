// src/core/market/buyout.ts
//
// ============================================================================
//  BUYING SOMEBODY OFF THE REGISTER
// ============================================================================
//
//  One question - will this shareholder sell, and for how much - was being
//  answered in FOUR places, and they did not agree with each other.
//
//    1. `calculateBuyoutPrice` in the shareholder store worked out a price
//       from trust and personality. Careful, deterministic, with a refusal
//       reason written for the player. Nothing enforced it.
//    2. `calculateNegotiationChance` in the same store threw a die against
//       trust, inside `negotiateSharePurchase`, after the screen had already
//       told the player the offer was accepted.
//    3. `negotiateSharePurchase` then worked the price out AGAIN from a
//       different source - `useEquityStore.stockPrice` where the screen had
//       used `stats.companySharePrice` - and spent that instead.
//    4. And ShareholderProfileModal copied the chance formula inline, by
//       hand, to draw its likelihood bar.
//
//  The visible result was a screen that said "Offer accepted", listed what
//  you would pay and what your stake would become, and then said "Purchase
//  failed" when you confirmed it.
//
//  ---------------------------------------------------------------------------
//  AND THE COMPARISON THAT MADE THE PRICE DECORATIVE
//  ---------------------------------------------------------------------------
//  The screen built its offer as `sharePrice * shareCount`, a TOTAL for the
//  parcel. The store returned `sharePrice * (1 + premium)`, a PER SHARE ask.
//  Then it compared them. A member holding 1.25 million shares at thirty cents
//  was offered 375,000 dollars against an ask of fifty one cents, so the test
//  passed at every premium the stepper could produce, including the one the
//  screen itself labels "insulted".
//
//  Two quantities called `basePrice` in two files, in two different units.
//  Which is why the names in here carry their unit.
//
//  ---------------------------------------------------------------------------
//  THE DIE STAYS, BUT IT STOPS DECIDING
//  ---------------------------------------------------------------------------
//  Asked for directly: "sans atisi cok etkilemesin ama yine de heyecani
//  olsun". So the shape is:
//
//    below the ask     they refuse, and the screen says what they want
//    at the ask        BUYOUT_BASE_CHANCE - high, not certain
//    well above it     certain
//
//  A refusal at or above the ask is not a re-roll of the same die. It costs a
//  quarter and it MOVES something: they take a serious offer seriously, trust
//  rises by TRUST_ON_SERIOUS_OFFER, and the next ask is lower and likelier.
//  Without that, buying out three siblings is a slot machine, and the second
//  generation is supposed to be a campaign somebody can plan.
//
//  PURE. No stores, no clock, and the die is injected.
// ============================================================================

/** Only what the rule needs, so this stays testable without a BoardMember. */
export type Holder = {
    /** 0-100. How much they trust the player. */
    trust: number;
    /** Drives the personality premium. Unknown traits pay the default. */
    trait?: string;
    /** How many shares they hold. */
    shareCount: number;
};

// ============================================================================
//  WHAT THEY ASK
// ============================================================================

/**
 * The personality premium, on top of reluctance.
 *
 * Lifted unchanged from the store's `calculateBuyoutPrice`, which had the
 * numbers right and only lacked anybody reading them. A Loyalist takes the
 * market price because that is what being a loyalist means; a Shark charges
 * half again because he can see you need it.
 */
export const TRAIT_PREMIUM: Readonly<Record<string, number>> = {
    Shark: 0.50,
    Snake: 0.40,
    Aggressive: 0.25,
    Visionary: 0.15,
    Conservative: 0.10,
    Loyalist: 0.00,
};

/** Anything not in the table above. */
export const DEFAULT_TRAIT_PREMIUM = 0.20;

/**
 * Below this, a Shark or a Snake will not sell at any price.
 *
 * The only hard no in the system, and it needs to exist: without it there is
 * no such thing as an enemy on the register, only an expensive friend. Note
 * that it is the two predatory traits and not simply low trust - a Loyalist
 * who has lost faith in you will still take a fair price, because he is not
 * holding the shares to hurt you.
 */
export const HOSTILE_TRUST_FLOOR = 15;

/** How much of the company one holding is, as a fraction. */
export const holdingFraction = (holder: Holder, totalShares: number): number =>
    totalShares > 0 ? Math.max(0, holder.shareCount) / totalShares : 0;

export type BuyoutAsk = {
    canSell: boolean;
    /** Why not, in words the screen can show. Null when they will sell. */
    refusalReason: string | null;
    /** Reluctance plus trait, as a fraction. 0.7 means they want 70 per cent over. */
    premium: number;
    /** The market price of one share, unchanged. */
    marketPerShare: number;
    /** What they want for ONE share. */
    askPerShare: number;
    /** What they want for THE WHOLE HOLDING. This is the number to compare. */
    askTotal: number;
};

/**
 * What this holder wants for everything they have.
 *
 * `name` is passed separately rather than living on Holder so that this file
 * never has to know what a board member is.
 */
export const buyoutAsk = (
    holder: Holder,
    marketPerShare: number,
    name: string = 'They',
): BuyoutAsk => {
    const trust = Number.isFinite(holder?.trust) ? holder.trust : 50;
    const trait = holder?.trait ?? '';
    const shares = Math.max(0, holder?.shareCount ?? 0);
    const market = Math.max(0, marketPerShare || 0);

    if (trust < HOSTILE_TRUST_FLOOR && (trait === 'Shark' || trait === 'Snake')) {
        return {
            canSell: false,
            refusalReason: `${name} will not sell at any price. Trust is ${Math.round(trust)} of 100, and holding the shares is the point.`,
            premium: 0,
            marketPerShare: market,
            askPerShare: 0,
            askTotal: 0,
        };
    }

    // Low trust is expensive. Trust 80 pays 20 per cent, trust 20 pays 80.
    const reluctance = Math.max(0, Math.min(1, (100 - trust) / 100));
    const traitPremium = trait in TRAIT_PREMIUM ? TRAIT_PREMIUM[trait] : DEFAULT_TRAIT_PREMIUM;
    const premium = reluctance + traitPremium;

    const askPerShare = market * (1 + premium);
    return {
        canSell: true,
        refusalReason: null,
        premium,
        marketPerShare: market,
        askPerShare,
        askTotal: askPerShare * shares,
    };
};

/**
 * The most any holder can ever ask, as a premium.
 *
 * Reluctance tops out at 1 and the dearest trait is the Shark at 0.5. The
 * offer control has to be able to REACH this, or there are holders the game
 * prices and then refuses to let you pay - a lock nobody designed. See
 * MemberInteractionModal, where the stepper used to stop at 100.
 */
export const MAX_ASK_PREMIUM = 1 + TRAIT_PREMIUM.Shark;

// ============================================================================
//  WHETHER THEY TAKE IT
// ============================================================================

/**
 * The chance of a yes when you have met the asking price exactly.
 *
 * Not 1. Meeting somebody's number and hearing them say they need to think
 * about it is the whole texture being asked for here, and a control that
 * always works is a button rather than an offer.
 */
export const BUYOUT_BASE_CHANCE = 0.85;

/**
 * How far over the ask makes it certain.
 *
 * Twenty per cent over what they asked for. Deliberately affordable, because
 * the die is meant to add a pause and not a tax: a player who does not want
 * the uncertainty can simply pay to remove it, and paying to remove it is
 * itself a decision about money.
 */
export const BUYOUT_CERTAIN_MARGIN = 0.20;

/**
 * What a serious offer buys you even when it fails.
 *
 * Refusing the same die three times in a row is not tension, it is a slot
 * machine with a four hour lever. So an offer at or above the ask that still
 * comes back no raises their trust: they took it seriously, and next quarter
 * they want less AND are likelier to take it. Three attempts gets almost
 * anybody, which is the intended feel - buying out a sibling is a campaign,
 * not a coin.
 */
export const TRUST_ON_SERIOUS_OFFER = 5;

/**
 * Will they take this?
 *
 * Below the ask is a flat no rather than a long shot. The ask is the whole
 * output of the trust and personality system, and a price you can undercut by
 * rolling well is not a price.
 */
export const acceptanceChance = (offerTotal: number, askTotal: number): number => {
    if (!(askTotal > 0)) return 0;
    const offer = Math.max(0, offerTotal || 0);
    if (offer < askTotal) return 0;

    const over = (offer - askTotal) / askTotal;
    if (over >= BUYOUT_CERTAIN_MARGIN) return 1;

    const climb = (1 - BUYOUT_BASE_CHANCE) * (over / BUYOUT_CERTAIN_MARGIN);
    return Math.min(1, BUYOUT_BASE_CHANCE + climb);
};

export type BuyoutVerdict = {
    accepted: boolean;
    /** 0-1, so a screen can show it before the player commits. */
    chance: number;
    /** Below the ask. The screen should say what they want instead. */
    tooLow: boolean;
    /** They met the price and were turned down anyway. Worth trust. */
    trustGain: number;
};

/**
 * The decision, once. The die is injected so the test is real.
 *
 * Everything that used to answer this question separately now calls here.
 */
export const settleBuyout = (
    offerTotal: number,
    ask: BuyoutAsk,
    roll: () => number = Math.random,
): BuyoutVerdict => {
    if (!ask.canSell) {
        return { accepted: false, chance: 0, tooLow: false, trustGain: 0 };
    }

    const chance = acceptanceChance(offerTotal, ask.askTotal);
    if (chance <= 0) {
        return { accepted: false, chance: 0, tooLow: true, trustGain: 0 };
    }

    const accepted = roll() < chance;
    return {
        accepted,
        chance,
        tooLow: false,
        // Only a refusal earns it. Paying for a yes is its own reward.
        trustGain: accepted ? 0 : TRUST_ON_SERIOUS_OFFER,
    };
};
