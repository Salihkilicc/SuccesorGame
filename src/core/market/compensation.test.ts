// src/core/market/compensation.test.ts
//
// The CEO bonus is money that appears in the player's personal account once
// a year, and the two ways it can be wrong are both silent: paying on the
// wrong quarter, or paying on the wrong base. Neither would throw. So the
// rule is pinned here rather than trusted.

import {
    CEO_BONUS_RATE,
    EMPTY_ACCRUAL,
    accrueCeoBonus,
    projectedBonus,
    quartersToBonus,
    type BonusAccrual,
} from './compensation';

/** Run a list of quarterly profits through the accrual, collecting payouts. */
const runYears = (profits: number[]) => {
    let acc: BonusAccrual = { ...EMPTY_ACCRUAL };
    const paid: number[] = [];
    profits.forEach(p => {
        const r = accrueCeoBonus(acc, p, 1);
        acc = r.next;
        paid.push(r.paid);
    });
    return { acc, paid };
};

describe('CEO annual bonus', () => {
    it('pays on the fourth quarter and not before', () => {
        const { paid } = runYears([1e6, 1e6, 1e6, 1e6]);
        expect(paid.slice(0, 3)).toEqual([0, 0, 0]);
        expect(paid[3]).toBe(4e6 * CEO_BONUS_RATE);
    });

    it('resets the counter, so eight quarters pay exactly twice', () => {
        const { paid } = runYears(Array(8).fill(1e6));
        expect(paid.filter(x => x > 0)).toEqual([160_000, 160_000]);
    });

    it('pays nothing on a losing year rather than clawing cash back', () => {
        const { paid, acc } = runYears([-2e6, 5e5, 5e5, 5e5]);
        expect(paid[3]).toBe(0);
        expect(acc.profitAccrued).toBe(0);
    });

    it('does not carry a loss into the next bonus year', () => {
        // Tax already carries losses forward. Doing it here as well would
        // charge the player twice for the same bad year.
        const { paid } = runYears([-2e6, 5e5, 5e5, 5e5, 1e6, 1e6, 1e6, 1e6]);
        expect(paid[7]).toBe(160_000);
    });

    it('nets the year rather than paying on the good quarters alone', () => {
        const { paid } = runYears([3e6, -1e6, 2e6, 1e6]);
        expect(paid[3]).toBe(5e6 * CEO_BONUS_RATE);
    });

    it('settles in one go when a tick advances the whole year', () => {
        const r = accrueCeoBonus({ ...EMPTY_ACCRUAL }, 4e6, 4);
        expect(r.paid).toBe(160_000);
        expect(r.next).toEqual(EMPTY_ACCRUAL);
    });

    it('projects the number that actually lands', () => {
        const { acc } = runYears([1e6, 1e6, 1e6]);
        expect(quartersToBonus(acc)).toBe(1);
        const projected = projectedBonus({ profitAccrued: acc.profitAccrued + 1e6, quartersAccrued: 4 });
        expect(accrueCeoBonus(acc, 1e6, 1).paid).toBe(projected);
    });

    it('survives a save that predates the field', () => {
        // Old saves have no accrual at all; the tick must not crash on them.
        expect(accrueCeoBonus(undefined as any, 1e6, 4).paid).toBe(40_000);
    });
});
