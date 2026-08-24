// src/core/market/buyout.test.ts
//
// ============================================================================
//  THE BUYOUT THAT COULD NOT BE REFUSED
// ============================================================================
//
//  What this is really pinning is a units mismatch across a file boundary,
//  which is the kind of thing no type catches: both sides were `number`.
//
//  The screen built `companySharePrice * member.shareCount` and called it
//  `basePrice`. The store built `currentStockPrice * (1 + premium)` and called
//  THAT `basePrice` too. One is a parcel, one is a share. Then the screen
//  compared its parcel against the store's share and treated the result as a
//  negotiation.
//
//  The arithmetic: a director holding 1,250,000 shares of a company trading at
//  thirty cents is a 375,000 dollar holding. The store, asked what he wants,
//  said fifty one cents. 375,000 is comfortably more than 0.51, so he accepted
//  - at every premium the control could produce, including minus twenty, which
//  the same screen labels "insulted".
//
//  So the entire trust-and-personality pricing system, which is careful and
//  correct and about eighty lines long, decided nothing at all.
// ============================================================================

import {
    buyoutAsk,
    acceptanceChance,
    settleBuyout,
    holdingFraction,
    TRAIT_PREMIUM,
    DEFAULT_TRAIT_PREMIUM,
    HOSTILE_TRUST_FLOOR,
    BUYOUT_BASE_CHANCE,
    BUYOUT_CERTAIN_MARGIN,
    TRUST_ON_SERIOUS_OFFER,
    MAX_ASK_PREMIUM,
} from './buyout';

/** The director from the bug report. */
const DIRECTOR = { trust: 40, trait: 'Conservative', shareCount: 1_250_000 };
const PRICE = 0.30;

describe('what they ask for', () => {
    it('is a price for the holding, not for one share', () => {
        const ask = buyoutAsk(DIRECTOR, PRICE);
        // Trust 40 -> reluctance 0.60, Conservative -> 0.10. Seventy per cent.
        expect(ask.premium).toBeCloseTo(0.70, 6);
        expect(ask.askPerShare).toBeCloseTo(0.51, 6);
        expect(ask.askTotal).toBeCloseTo(0.51 * 1_250_000, 4);
    });

    it('and the two are far enough apart that confusing them is not survivable', () => {
        // 637,500 against 0.51. This is the whole bug in one assertion: any
        // plausible parcel price clears any plausible per share ask.
        const ask = buyoutAsk(DIRECTOR, PRICE);
        expect(ask.askTotal / ask.askPerShare).toBe(1_250_000);
    });

    it('costs more from somebody who does not trust you', () => {
        const warm = buyoutAsk({ ...DIRECTOR, trust: 90 }, PRICE);
        const cold = buyoutAsk({ ...DIRECTOR, trust: 10 }, PRICE);
        expect(cold.askTotal).toBeGreaterThan(warm.askTotal);
    });

    it('and a Loyalist takes the market price', () => {
        // At full trust, nothing on top at all. The only holder who ever does.
        const ask = buyoutAsk({ trust: 100, trait: 'Loyalist', shareCount: 1000 }, PRICE);
        expect(ask.premium).toBe(0);
        expect(ask.askTotal).toBeCloseTo(PRICE * 1000, 6);
    });

    it('while an unknown trait pays the default rather than nothing', () => {
        // A trait the table has never heard of used to fall through a switch
        // to 0.20. Falling through to zero would make new traits free.
        const ask = buyoutAsk({ trust: 100, trait: 'Wizard', shareCount: 1000 }, PRICE);
        expect(ask.premium).toBeCloseTo(DEFAULT_TRAIT_PREMIUM, 6);
    });
});

describe('the ones who will not sell', () => {
    it('are the predators, and only when trust has gone', () => {
        for (const trait of ['Shark', 'Snake']) {
            const ask = buyoutAsk({ trust: HOSTILE_TRUST_FLOOR - 1, trait, shareCount: 100 }, PRICE);
            expect(ask.canSell).toBe(false);
            expect(ask.refusalReason).toContain('not sell');
        }
    });

    it('and a Loyalist who has lost faith still names a price', () => {
        // He is not holding the shares to hurt you. Without this, low trust
        // alone would mean an enemy, and there would be no such thing as an
        // expensive friend.
        const ask = buyoutAsk({ trust: 1, trait: 'Loyalist', shareCount: 100 }, PRICE);
        expect(ask.canSell).toBe(true);
        expect(ask.premium).toBeCloseTo(0.99, 6);
    });

    it('and a refusal quotes no price at all', () => {
        const ask = buyoutAsk({ trust: 0, trait: 'Shark', shareCount: 100 }, PRICE);
        expect(ask.askTotal).toBe(0);
        expect(ask.askPerShare).toBe(0);
    });
});

describe('whether they take it', () => {
    const ask = buyoutAsk(DIRECTOR, PRICE);

    it('is never, below the asking price', () => {
        // A price you can undercut by rolling well is not a price.
        expect(acceptanceChance(ask.askTotal - 1, ask.askTotal)).toBe(0);
        expect(acceptanceChance(0, ask.askTotal)).toBe(0);
    });

    it('is high but not certain when you meet it exactly', () => {
        expect(acceptanceChance(ask.askTotal, ask.askTotal)).toBeCloseTo(BUYOUT_BASE_CHANCE, 6);
        expect(BUYOUT_BASE_CHANCE).toBeLessThan(1);
    });

    it('and certain once you are well over', () => {
        expect(acceptanceChance(ask.askTotal * (1 + BUYOUT_CERTAIN_MARGIN), ask.askTotal)).toBe(1);
        expect(acceptanceChance(ask.askTotal * 10, ask.askTotal)).toBe(1);
    });

    it('climbing in between rather than jumping', () => {
        const half = acceptanceChance(ask.askTotal * (1 + BUYOUT_CERTAIN_MARGIN / 2), ask.askTotal);
        expect(half).toBeGreaterThan(BUYOUT_BASE_CHANCE);
        expect(half).toBeLessThan(1);
    });

    it('and an insulting offer is refused, which it never used to be', () => {
        // -20 per cent, the bottom of the stepper. Under the old comparison
        // this was accepted every single time.
        const insulting = PRICE * DIRECTOR.shareCount * 0.8;
        expect(acceptanceChance(insulting, ask.askTotal)).toBe(0);
    });
});

describe('settling it', () => {
    const ask = buyoutAsk(DIRECTOR, PRICE);

    it('tells the screen it was too low rather than that they rolled badly', () => {
        const v = settleBuyout(1, ask, () => 0);
        expect(v.tooLow).toBe(true);
        expect(v.accepted).toBe(false);
        expect(v.trustGain).toBe(0);
    });

    it('accepts on a good roll and refuses on a bad one', () => {
        expect(settleBuyout(ask.askTotal, ask, () => 0).accepted).toBe(true);
        expect(settleBuyout(ask.askTotal, ask, () => 0.99).accepted).toBe(false);
    });

    it('and a serious offer that fails still moves them', () => {
        // The point of this. Three attempts gets almost anybody, so buying out
        // a sibling is a campaign rather than a lever on a slot machine.
        const v = settleBuyout(ask.askTotal, ask, () => 0.99);
        expect(v.trustGain).toBe(TRUST_ON_SERIOUS_OFFER);
    });

    it('while a successful one pays for itself', () => {
        expect(settleBuyout(ask.askTotal, ask, () => 0).trustGain).toBe(0);
    });

    it('and somebody who will not sell is not rolled for', () => {
        const no = buyoutAsk({ trust: 0, trait: 'Shark', shareCount: 100 }, PRICE);
        const v = settleBuyout(1e12, no, () => 0);
        expect(v.accepted).toBe(false);
        expect(v.chance).toBe(0);
    });

    it('and repeated refusals converge rather than repeating', () => {
        // Walk it the way the store does: each no raises trust, which lowers
        // the next ask. Four quarters of meeting the price should leave them
        // materially cheaper than they started.
        let trust = DIRECTOR.trust;
        const first = buyoutAsk({ ...DIRECTOR, trust }, PRICE).askTotal;
        for (let i = 0; i < 4; i++) {
            const a = buyoutAsk({ ...DIRECTOR, trust }, PRICE);
            const v = settleBuyout(a.askTotal, a, () => 0.99);
            expect(v.accepted).toBe(false);
            trust = Math.min(100, trust + v.trustGain);
        }
        const later = buyoutAsk({ ...DIRECTOR, trust }, PRICE).askTotal;
        expect(later).toBeLessThan(first);
    });
});

describe('the dearest holder in the game', () => {
    it('can actually be paid', () => {
        // Reluctance tops out at 1 and a Shark adds half again, so an ask can
        // reach 150 per cent while the offer control stopped at 100. The most
        // expensive holders were priced and then unbuyable, and nothing
        // noticed because every offer was passing anyway.
        const worst = buyoutAsk({ trust: HOSTILE_TRUST_FLOOR, trait: 'Shark', shareCount: 100 }, PRICE);
        expect(worst.canSell).toBe(true);
        expect(worst.premium).toBeLessThanOrEqual(MAX_ASK_PREMIUM);
        expect(MAX_ASK_PREMIUM).toBeCloseTo(1 + TRAIT_PREMIUM.Shark, 6);
    });
});

describe('a holding as a share of the company', () => {
    it('is zero when nothing has been issued rather than a division by zero', () => {
        expect(holdingFraction(DIRECTOR, 0)).toBe(0);
        expect(holdingFraction(DIRECTOR, 10_000_000)).toBeCloseTo(0.125, 6);
    });
});
