// src/core/story/manipulation.test.ts
//
// ============================================================================
//  BREAKING YOUR OWN COMPANY TO BUY IT CHEAPLY
// ============================================================================
//
//  Asked for as: "either close this route, or let them go to prison for it,
//  with a new game over from manipulation. But how will we know?"
//
//  The knowing is the whole problem and it is worth restating, because a
//  detector that gets this wrong is worse than no detector. A falling share
//  price is not a crime. A chief executive buying stock while their company
//  falls apart is not a criminal either; that is usually the bravest entry in
//  the file. So "the price fell and they bought" convicts the honest player
//  and the guilty one at the same rate.
//
//  WHAT SEPARATES THEM IS WHETHER IT COMES BACK. A real collapse stays
//  collapsed. A manufactured one recovers, because there was never anything
//  wrong with the company, and it recovers just after the buying stops.
//
//  Measured across the cases the rule has to tell apart:
//
//    bought at        took    board    wealth    case  defence  verdict
//    2% of value      65pt    hated    broke     0.98    0.17    PRISON
//    2% of value      65pt    hated    rich      0.98    0.42    PRISON
//    2% of value      65pt    adored   rich      0.98    0.75    FINE
//    12% x3 bites     24pt    hated    rich      1.00    0.42    PRISON
//    15% of value     18pt    mixed    mid       0.77    0.38    BARRED
//    20% of value     10pt    mixed    mid       0.40    0.38    FINE
//    20% of value     10pt    adored   rich      0.40    0.75    none
//    30% of value      5pt    mixed    mid       0.18       -    none
//    30% of value      5pt    hated    broke     0.18       -    none
//
//  The last two are the honest player and they are acquitted by the strength
//  of the case rather than by their defence, which is the property that
//  matters: being poor and disliked must not be what convicts somebody.
// ============================================================================

import {
    CASE_MINIMUM,
    INVESTIGATION_WINDOW,
    RECOVERY_RATIO,
    SUSPICION_DEPRESSION,
    SUSPICION_MIN_GAIN,
    caseStrength,
    defenceStrength,
    depressionOf,
    isStale,
    judge,
    provenBuys,
    recordSuspicion,
    type SuspiciousBuy,
} from './manipulation';

const buy = (over: Partial<SuspiciousBuy> = {}): SuspiciousBuy => ({
    quarter: 10, referenceAtBuy: 170, priceAtBuy: 3.4, gained: 65, ...over,
});

// ============================================================================

describe('leg one: was the stock on the floor when you bought', () => {
    const base = {
        quarter: 10, price: 3.4, reference: 170,
        ownershipBefore: 35, ownershipAfter: 100,
    };

    it('a big purchase into a collapse is written down', () => {
        expect(recordSuspicion(base)).not.toBeNull();
    });

    it('and the same purchase at a healthy price is not', () => {
        // Buying half the company is not suspicious. Buying it for nothing is.
        expect(recordSuspicion({ ...base, price: 170 })).toBeNull();
    });

    it('and the line is where the constant says it is, on both sides', () => {
        const at = 170 * SUSPICION_DEPRESSION;
        expect(recordSuspicion({ ...base, price: at })).not.toBeNull();
        expect(recordSuspicion({ ...base, price: at * 1.02 })).toBeNull();
    });
});

describe('leg two: was it worth investigating', () => {
    const base = {
        quarter: 10, price: 3.4, reference: 170,
        ownershipBefore: 35, ownershipAfter: 36,
    };

    it('topping up by a point is nobody business, however cheap the stock', () => {
        expect(recordSuspicion(base)).toBeNull();
    });

    it('and the threshold is the constant, not a number in this file', () => {
        expect(recordSuspicion({ ...base, ownershipAfter: 35 + SUSPICION_MIN_GAIN }))
            .not.toBeNull();
        expect(recordSuspicion({ ...base, ownershipAfter: 35 + SUSPICION_MIN_GAIN - 0.01 }))
            .toBeNull();
    });

    it('and selling is not buying', () => {
        expect(recordSuspicion({ ...base, ownershipAfter: 10 })).toBeNull();
    });

    it('and a company with no reference yet records nothing', () => {
        // The first quarter of a run, before there is any history.
        expect(recordSuspicion({ ...base, reference: 0, ownershipAfter: 100 })).toBeNull();
    });
});

describe('leg three: and then it either came back or it did not', () => {
    const led = [buy({ quarter: 10 })];

    it('a company still on the floor proves nothing, ever', () => {
        // THE HONEST PLAYER'S PROTECTION, and it is absolute rather than
        // probabilistic. A real disaster that stays a disaster is never a
        // case, no matter how much stock was bought or how cheaply.
        for (let q = 10; q <= 10 + INVESTIGATION_WINDOW; q++) {
            expect(provenBuys(led, { quarter: q, price: 3.5 })).toHaveLength(0);
        }
    });

    it('and a company that comes back is the case', () => {
        expect(provenBuys(led, { quarter: 14, price: 170 })).toHaveLength(1);
    });

    it('and it has to come back far enough to be obvious', () => {
        const need = 170 * RECOVERY_RATIO;
        expect(provenBuys(led, { quarter: 14, price: need })).toHaveLength(1);
        expect(provenBuys(led, { quarter: 14, price: need * 0.98 })).toHaveLength(0);
    });

    it('and coming back after the window is too late to charge', () => {
        expect(provenBuys(led, { quarter: 10 + INVESTIGATION_WINDOW, price: 170 })).toHaveLength(1);
        expect(provenBuys(led, { quarter: 11 + INVESTIGATION_WINDOW, price: 170 })).toHaveLength(0);
    });

    it('and waiting the window out is the escape, at the price of the crime', () => {
        // This is the trade the whole mechanic exists for: you can beat the
        // charge, and beating it means four years of deliberately running a
        // broken company, which is every penny the crime was worth.
        expect(isStale(buy({ quarter: 10 }), 10 + INVESTIGATION_WINDOW)).toBe(false);
        expect(isStale(buy({ quarter: 10 }), 11 + INVESTIGATION_WINDOW)).toBe(true);
        expect(INVESTIGATION_WINDOW).toBe(16);
    });

    it('and the future does not convict the past', () => {
        expect(provenBuys(led, { quarter: 2, price: 999 })).toHaveLength(0);
    });
});

// ============================================================================

describe('how strong the case is', () => {
    it('grows with how far under the real value you bought', () => {
        const shallow = caseStrength([buy({ priceAtBuy: 68 })]);   // 40% of 170
        const deep = caseStrength([buy({ priceAtBuy: 3.4 })]);     // 2%
        expect(deep).toBeGreaterThan(shallow);
    });

    it('and with how much of the company you took', () => {
        expect(caseStrength([buy({ gained: 40 })]))
            .toBeGreaterThan(caseStrength([buy({ gained: 5 })]));
    });

    it('and doing it repeatedly is worse than doing it once', () => {
        const once = caseStrength([buy({ gained: 8, priceAtBuy: 20 })]);
        const thrice = caseStrength([1, 2, 3].map(i =>
            buy({ quarter: 8 + i, gained: 8, priceAtBuy: 20 })));
        expect(thrice).toBeGreaterThan(once);
    });

    it('and it never runs past one, however many times you did it', () => {
        const many = Array.from({ length: 20 }, (_, i) => buy({ quarter: i }));
        expect(caseStrength(many)).toBeLessThanOrEqual(1);
    });

    it('and no purchases is no case', () => {
        expect(caseStrength([])).toBe(0);
    });

    it('and depression is measured against the reference, not against zero', () => {
        expect(depressionOf(50, 100)).toBeCloseTo(0.5, 6);
        expect(depressionOf(100, 100)).toBe(0);
        expect(depressionOf(0, 100)).toBe(1);
        expect(depressionOf(150, 100)).toBe(0);
        expect(depressionOf(50, 0)).toBe(0);
    });
});

describe('and what you can answer it with', () => {
    it('a board that will speak for you is worth more than money', () => {
        const loyal = defenceStrength({ boardLoyalty: 100, personalWealth: 0 });
        const rich = defenceStrength({ boardLoyalty: 0, personalWealth: 1e12 });
        expect(loyal).toBeGreaterThan(rich);
    });

    it('and money stops buying anything past a point', () => {
        // Or the endgame billionaire is simply immune, which removes the
        // mechanic exactly where it is most needed.
        const a = defenceStrength({ boardLoyalty: 50, personalWealth: 250_000_000 });
        const b = defenceStrength({ boardLoyalty: 50, personalWealth: 250_000_000_000 });
        expect(b).toBe(a);
    });

    it('and nothing buys a perfect defence', () => {
        expect(defenceStrength({ boardLoyalty: 100, personalWealth: 1e12 })).toBeLessThan(1);
    });

    it('and a hostile board with no money answers almost nothing', () => {
        expect(defenceStrength({ boardLoyalty: 0, personalWealth: 0 })).toBe(0);
    });
});

// ============================================================================

describe('the verdict', () => {
    const exploit = [buy()];
    const hatedBroke = { boardLoyalty: 30, personalWealth: 5_000_000 };
    const hatedRich = { boardLoyalty: 30, personalWealth: 500_000_000 };
    const adoredRich = { boardLoyalty: 90, personalWealth: 500_000_000 };

    it('the exploit as reported ends in prison', () => {
        // The case the feature was asked for. If this ever stops being prison
        // the feature has quietly stopped existing.
        expect(judge(exploit, hatedBroke).verdict).toBe('prison');
        expect(judge(exploit, hatedRich).verdict).toBe('prison');
    });

    it('and money alone does not buy a way out of it', () => {
        expect(judge(exploit, hatedRich).verdict).toBe('prison');
    });

    it('but a board that loves you and the money to fight brings it down to a fine', () => {
        // Unmistakably how this goes in life, and it gives board loyalty a
        // consequence it did not have before.
        expect(judge(exploit, adoredRich).verdict).toBe('fine');
    });

    it('and the best possible defence still cannot make the worst case go away', () => {
        const perfect = { boardLoyalty: 100, personalWealth: 1e12 };
        expect(judge(exploit, perfect).verdict).not.toBe('none');
    });

    it('and taking it in small bites does not help', () => {
        const salami = [1, 2, 3].map(i => buy({ quarter: 8 + i, gained: 8, priceAtBuy: 20 }));
        expect(judge(salami, hatedRich).verdict).toBe('prison');
    });

    it('and there is a middle where you keep your freedom and lose the chair', () => {
        const middling = [buy({ referenceAtBuy: 100, priceAtBuy: 15, gained: 18 })];
        expect(judge(middling, { boardLoyalty: 55, personalWealth: 80_000_000 }).verdict)
            .toBe('barred');
    });

    it('and the honest player is never charged at all', () => {
        // Five points at thirty per cent of the reference, in a company that
        // then genuinely recovered. Acquitted by the WEAKNESS OF THE CASE,
        // which is what stops poverty and an unpopular board from being what
        // convicts somebody.
        const honest = [buy({ referenceAtBuy: 100, priceAtBuy: 30, gained: 5 })];
        expect(caseStrength(honest)).toBeLessThan(CASE_MINIMUM);
        expect(judge(honest, hatedBroke).verdict).toBe('none');
        expect(judge(honest, adoredRich).verdict).toBe('none');
    });

    it('and the fine is a share of the PLAYER wealth, not the company', () => {
        // The company was the victim. Taking the penalty out of its accounts
        // would be the crime paying for its own punishment.
        //
        // I wrote this first against the ten point case, which the acquittal
        // band turns into no charge at all - the expectation was copied from a
        // measurement taken before that band existed.
        const j = judge(exploit, adoredRich);
        expect(j.verdict).toBe('fine');
        expect(j.fine).toBe(Math.round(500_000_000 * 0.35));
    });

    it('and only a fine carries one', () => {
        expect(judge(exploit, hatedBroke).fine).toBe(0);
    });

    it('and it shows its working, so a screen can explain itself', () => {
        const j = judge(exploit, hatedRich);
        expect(j.caseStrength).toBeGreaterThan(0);
        expect(j.defenceStrength).toBeGreaterThan(0);
        expect(j.margin).toBeCloseTo(j.caseStrength - j.defenceStrength, 9);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(judge([], { boardLoyalty: NaN, personalWealth: NaN }).verdict).toBe('none');
        expect(Number.isFinite(judge(exploit, { boardLoyalty: NaN, personalWealth: NaN }).margin))
            .toBe(true);
    });
});
