// src/core/market/sponsorGlow.test.ts
//
// ============================================================================
//  THE SPONSORSHIP THAT WAS GONE IN TWO QUARTERS
// ============================================================================
//
//  Reported as "hic kalici degil, 2 quarter suruyor sonra etkisi bitiyor", and
//  the measurement agreed. A deal added `brandPerQuarter` to the brand VALUE
//  every quarter of its term, and `advanceCategoryBrand` walks brand towards
//  `share x BRAND_POINTS_PER_SHARE` at a quarter to a third of the gap per
//  tick, so anything added to the value is pulled back out:
//
//      a one-off +10 at an 8% share
//        q1 +8.3   q2 +6.9   q3 +5.7   q4 +4.8   q6 +3.3
//
//  The largest contract in the game costs 384 million across sixteen quarters,
//  peaked at +39 brand points, and was down to +9 eight quarters after it
//  ended. Nine points for three hundred and eighty four million.
//
//  ---------------------------------------------------------------------------
//  AND THE FILE ALREADY CONTAINED THE DIAGNOSIS
//  ---------------------------------------------------------------------------
//  The drought note at the top of sponsorship.ts says the penalty was written
//  as a CEILING penalty rather than a per-quarter subtraction for exactly this
//  reason, and quotes the measurement. So the thing that punishes you was
//  built to stick and the thing you paid for was not, one page apart in one
//  file. That asymmetry is the actual bug; the numbers are a symptom.
// ============================================================================

import {
    sponsorPeak,
    sponsorGlow,
    totalContractValue,
    maxContractValue,
    offerById,
    SPONSOR_OFFERS,
    SPONSOR_PEAK_POINTS,
} from './sponsorship';
import { advanceCategoryBrand, brandEquilibrium } from './brand';

const SHARE = 8;
const BASE = brandEquilibrium(SHARE);

/** Run a deal through the real brand walk and return the lift each quarter. */
const lifts = (offerId: string, extraQuarters = 8): number[] => {
    const offer = offerById(offerId)!;
    let brand = BASE;
    const out: number[] = [];
    for (let q = 0; q < offer.quarters + extraQuarters; q++) {
        brand = advanceCategoryBrand({
            current: brand,
            share: SHARE,
            servedRatio: 1,
            equilibriumBonus: sponsorGlow(offer, q),
        }).newBrand;
        out.push(brand - BASE);
    }
    return out;
};

describe('the size of a deal', () => {
    it('comes from what it costs', () => {
        const biggest = SPONSOR_OFFERS
            .reduce((a, b) => (totalContractValue(a) > totalContractValue(b) ? a : b));
        expect(sponsorPeak(biggest)).toBeCloseTo(SPONSOR_PEAK_POINTS, 6);
        expect(totalContractValue(biggest)).toBe(maxContractValue());
    });

    it('by its square root, so the small ones are still worth reading', () => {
        // The dearest contract costs five hundred times the cheapest. On a
        // straight proportion every local deal would be a rounding error and
        // there would be no reason to open the letter.
        const cheap = sponsorPeak(offerById('spon-l-9')!);
        const dear = sponsorPeak(offerById('spon-g-2')!);
        expect(dear / cheap).toBeGreaterThan(20);
        expect(dear / cheap).toBeLessThan(60);
        expect(cheap).toBeGreaterThan(0.5);
    });

    it('and it climbs with the tier without any tier being named', () => {
        // The gate is money, and money is what the tiers already differ by.
        const local = sponsorPeak(offerById('spon-l-1')!);
        const national = sponsorPeak(offerById('spon-n-3')!);
        const global = sponsorPeak(offerById('spon-g-2')!);
        expect(national).toBeGreaterThan(local);
        expect(global).toBeGreaterThan(national);
    });
});

describe('and it arrives whole and fades', () => {
    it('full size on the quarter it is signed', () => {
        const offer = offerById('spon-g-2')!;
        expect(sponsorGlow(offer, 0)).toBeCloseTo(sponsorPeak(offer), 6);
    });

    it('nothing left by the end of the term', () => {
        const offer = offerById('spon-g-2')!;
        expect(sponsorGlow(offer, offer.quarters)).toBe(0);
    });

    it('half way through, half of it', () => {
        const offer = offerById('spon-g-2')!;
        expect(sponsorGlow(offer, offer.quarters / 2))
            .toBeCloseTo(sponsorPeak(offer) / 2, 6);
    });

    it('and it never goes negative past the end', () => {
        const offer = offerById('spon-l-1')!;
        expect(sponsorGlow(offer, 999)).toBe(0);
    });
});

describe('what the player actually feels', () => {
    it('is a lift that holds through the middle of the term', () => {
        // The complaint was that it was gone in two quarters. Now the largest
        // deal is still worth more than half its peak at quarter twelve of
        // sixteen, which is the "orta vadeli" that was asked for.
        const l = lifts('spon-g-2');
        const peak = Math.max(...l);
        expect(peak).toBeGreaterThan(25);
        expect(l[11]).toBeGreaterThan(peak * 0.5);
    });

    it('rather than a spike that is gone before the next letter', () => {
        // Under the old shape a single addition had lost half of itself by
        // the fourth quarter. Under this one the fourth quarter is the peak.
        const l = lifts('spon-g-2');
        const peakAt = l.indexOf(Math.max(...l));
        expect(peakAt).toBeGreaterThan(2);
    });

    it('and it does fade, because it is not meant to be permanent', () => {
        // "Kalici degil de biraz etkilesin." Four quarters after a sixteen
        // quarter deal ends there is a mark left and it is going.
        const l = lifts('spon-g-2', 8);
        const atEnd = l[l.length - 1];
        expect(atEnd).toBeLessThan(Math.max(...l) * 0.3);
        expect(atEnd).toBeGreaterThan(0);
    });

    it('while a local deal is small, which is what it costs', () => {
        const l = lifts('spon-l-1');
        expect(Math.max(...l)).toBeLessThan(2);
        expect(Math.max(...l)).toBeGreaterThan(0.2);
    });
});

describe('the mechanism, rather than the numbers', () => {
    it('moves the destination, not the value', () => {
        // The whole fix in one assertion. Adding to the value is washed out by
        // the walk; moving the target is not.
        const asValue = advanceCategoryBrand({
            current: BASE + 40, share: SHARE, servedRatio: 1,
        }).newBrand;
        const asTarget = advanceCategoryBrand({
            current: BASE, share: SHARE, servedRatio: 1, equilibriumBonus: 40,
        }).newBrand;

        // One quarter on: the value version has already given some back and is
        // heading down, the target version is heading up.
        expect(asValue).toBeLessThan(BASE + 40);
        expect(asTarget).toBeGreaterThan(BASE);

        // Four quarters on, the difference is the point.
        let v = BASE + 40;
        let t = BASE;
        for (let q = 0; q < 4; q++) {
            v = advanceCategoryBrand({ current: v, share: SHARE, servedRatio: 1 }).newBrand;
            t = advanceCategoryBrand({
                current: t, share: SHARE, servedRatio: 1, equilibriumBonus: 40,
            }).newBrand;
        }
        expect(t).toBeGreaterThan(v);
    });

    it('and a bonus of nothing changes nothing', () => {
        const plain = advanceCategoryBrand({ current: 100, share: SHARE, servedRatio: 1 }).newBrand;
        const zero = advanceCategoryBrand({
            current: 100, share: SHARE, servedRatio: 1, equilibriumBonus: 0,
        }).newBrand;
        expect(zero).toBe(plain);
    });

    it('and a negative one is not a way to sponsor your way downwards', () => {
        const plain = advanceCategoryBrand({ current: 100, share: SHARE, servedRatio: 1 }).newBrand;
        const negative = advanceCategoryBrand({
            current: 100, share: SHARE, servedRatio: 1, equilibriumBonus: -500,
        }).newBrand;
        expect(negative).toBe(plain);
    });
});

describe('the money is unchanged', () => {
    it('and is still charged every quarter of the term', () => {
        // The asymmetry IS the mechanic: the back half of a long contract is
        // expensive and quiet, which is what makes a ten year deal a
        // commitment rather than a purchase.
        const offer = offerById('spon-g-2')!;
        expect(offer.quarterlyCost).toBeGreaterThan(0);
        expect(totalContractValue(offer)).toBe(offer.quarterlyCost * offer.quarters);
        expect(sponsorGlow(offer, offer.quarters - 1)).toBeGreaterThan(0);
        expect(sponsorGlow(offer, offer.quarters)).toBe(0);
    });
});
