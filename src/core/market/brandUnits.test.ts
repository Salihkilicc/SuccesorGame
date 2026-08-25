// src/core/market/brandUnits.test.ts
//
// ============================================================================
//  TWO SCALES, ONE FIELD NAME
// ============================================================================
//
//  Reported three ways in one message: hosting an event seemed to buy nothing,
//  a signed sponsorship changed nothing, and a conversation that printed a
//  brand gain changed nothing. Three symptoms, one cause.
//
//  Brand exists on two scales.
//
//      brandByCategory   POINTS.  share x 43.3, so 433 at 10% share.
//      brandValue        INDEX.   0 to 100, and what six modules read.
//
//  `stats.brandValue` was being written with the POINTS. Attraction, hiring
//  pull, valuation multiples, contract partners and the facility ceilings all
//  clamp their brand argument at 100, so from 2.31% market share onwards -
//  which a company reaches in its first year - every one of them was pinned at
//  its maximum and could not be moved again by anything.
//
//  Measured, before the fix:
//
//      share   points   index   valuation mult   hiring pull
//      1%       43.3     10.0        1.103          2.083
//      2%       86.6     20.0        1.412          3.165
//      2.31%   100.0     23.1        1.550  <- max  3.500  <- max
//      5%      216.5     50.0        1.550          3.500
//      10%     433.0    100.0        1.550          3.500
//
//  From 2.31% onwards the two right columns never move again. Everything a
//  player does to their reputation after their first year was arithmetic with
//  no reader.
//
//  ---------------------------------------------------------------------------
//  AND THE TWO INPUTS WERE IN THE OTHER UNIT
//  ---------------------------------------------------------------------------
//  `SPONSOR_PEAK_POINTS` is 40 and was chosen to mean forty of a hundred. The
//  authored scene amounts - `brand: -25` - mean a quarter of the whole scale.
//  Both were added to the points scale unconverted, so both landed as a
//  4.33th of what they said. A global sponsorship moved a 5% brand by 9%; a
//  local one by half of one per cent.
//
//  ---------------------------------------------------------------------------
//  WHY THE EXISTING TESTS DID NOT CATCH ANY OF IT
//  ---------------------------------------------------------------------------
//  Two of them set `brandValue: 40` and `brandByCategory: { Consumer: 40 }` in
//  the same fixture, as though those were the same scale. The engine muddled
//  them the same way, so the assertions agreed with the bug. A third checked
//  that `equilibriumBonus` was wired to `sponsorLift` - which it was - and had
//  nothing to say about what the number meant.
//
//  So this file tests the CONVERSION and the CONSEQUENCE, not the wiring.
// ============================================================================

import {
    brandIndex,
    indexToPoints,
    brandEquilibrium,
    BRAND_INDEX_SCALE,
    advanceCategoryBrand,
    applyCorporateShock,
    corporateBrandFrom,
} from './brand';
import { brandValuationMultiplier } from './brand';
import { brandFactor } from './attraction';
import { SPONSOR_OFFERS, sponsorPeak, sponsorGlow } from './sponsorship';

describe('the two scales', () => {
    it('are not the same, and the ratio is named', () => {
        expect(BRAND_INDEX_SCALE).toBeGreaterThan(1);
        expect(brandIndex(indexToPoints(37))).toBeCloseTo(37, 6);
        expect(indexToPoints(brandIndex(160))).toBeCloseTo(160, 6);
    });

    it('and a modest market share already saturates every reader of the index', () => {
        // THE DEFECT, as a number. This is why nothing could be felt.
        const pointsAtSmallShare = brandEquilibrium(2.31);
        expect(pointsAtSmallShare).toBeGreaterThanOrEqual(100);

        // Fed the points, two different shares are indistinguishable.
        expect(brandValuationMultiplier(brandEquilibrium(3)))
            .toBeCloseTo(brandValuationMultiplier(brandEquilibrium(10)), 6);
        expect(brandFactor(brandEquilibrium(3)))
            .toBeCloseTo(brandFactor(brandEquilibrium(10)), 6);

        // Fed the index, they are not.
        expect(brandValuationMultiplier(brandIndex(brandEquilibrium(3))))
            .toBeLessThan(brandValuationMultiplier(brandIndex(brandEquilibrium(10))));
        expect(brandFactor(brandIndex(brandEquilibrium(3))))
            .toBeLessThan(brandFactor(brandIndex(brandEquilibrium(10))));
    });
});

describe('a sponsorship', () => {
    const share = 5;
    const settled = brandEquilibrium(share);

    /** Some quarters of the walk, with and without a deal, in INDEX terms. */
    const gapAfter = (quarters: number, converted: boolean, offerId?: string) => {
        const best = offerId
            ? SPONSOR_OFFERS.find(o => o.id === offerId)!
            : SPONSOR_OFFERS.reduce((a, b) => sponsorPeak(a) > sponsorPeak(b) ? a : b);
        let none = settled;
        let deal = settled;
        for (let q = 0; q < quarters; q++) {
            const glow = sponsorGlow(best, q);
            none = advanceCategoryBrand({ current: none, share, servedRatio: 1 }).newBrand;
            deal = advanceCategoryBrand({
                current: deal, share, servedRatio: 1,
                equilibriumBonus: converted ? indexToPoints(glow) : glow,
            }).newBrand;
        }
        return brandIndex(deal) - brandIndex(none);
    };

    it('is worth something a player can see, once converted', () => {
        // Four quarters in, on the index the screen shows.
        expect(gapAfter(4, true)).toBeGreaterThan(5);
    });

    it('and the deals a young company can actually reach were worth nothing', () => {
        // ----------------------------------------------------------------
        //  THE CLAIM, NARROWED TO WHAT IS TRUE
        // ----------------------------------------------------------------
        //  My first version of this rule said the bug made EVERY deal
        //  worthless and measured the biggest contract in the game, which
        //  came out at 6.8 index points unconverted - undersized, but not
        //  invisible. The rule failed and the honest repair was the claim,
        //  not the threshold.
        //
        //  What was actually invisible is the tier a player meets in their
        //  first years. A local deal peaks at 1.0 to 1.9 points against an
        //  equilibrium of 216, and it is the one the complaint was about.
        // ----------------------------------------------------------------
        const local = SPONSOR_OFFERS.filter(o => o.tier === 'local');
        expect(local.length).toBeGreaterThan(0);
        for (const o of local) {
            expect(gapAfter(4, false, o.id)).toBeLessThan(0.5);
        }
    });

    it('and even the biggest one was undersized rather than felt', () => {
        // 6.8 against the 16 it is worth once converted. The design says a
        // global sponsorship is forty of a hundred; it was delivering nine.
        const raw = gapAfter(4, false);
        const converted = gapAfter(4, true);
        expect(converted).toBeGreaterThan(raw * 2);
    });

    it('and even the smallest deal is no longer a rounding error', () => {
        const cheapest = SPONSOR_OFFERS.reduce((a, b) =>
            sponsorPeak(a) < sponsorPeak(b) ? a : b);
        const raw = sponsorPeak(cheapest);
        // Under one point of the category scale before, so it rounded away on
        // a screen that shows whole numbers.
        expect(raw).toBeLessThan(2);
        expect(indexToPoints(raw)).toBeGreaterThan(4);
    });
});

describe('a scene that moves the brand', () => {
    const cats = () => ({ Consumer: brandEquilibrium(5) });

    it('lands the amount it was authored to land, on the index', () => {
        // `brand: -25` means a quarter of the scale the writer could see.
        const before = brandIndex(corporateBrandFrom(cats(), ['Consumer']));
        const after = brandIndex(corporateBrandFrom(
            applyCorporateShock(cats(), indexToPoints(-25), ['Consumer']),
            ['Consumer'],
        ));
        expect(before - after).toBeCloseTo(25, 4);
    });

    it('and it used to land a twentieth of that', () => {
        const before = brandIndex(corporateBrandFrom(cats(), ['Consumer']));
        const after = brandIndex(corporateBrandFrom(
            applyCorporateShock(cats(), -25, ['Consumer']),
            ['Consumer'],
        ));
        expect(before - after).toBeLessThan(6);
    });

    it('and it works upwards on the same terms', () => {
        const before = brandIndex(corporateBrandFrom(cats(), ['Consumer']));
        const after = brandIndex(corporateBrandFrom(
            applyCorporateShock(cats(), indexToPoints(10), ['Consumer']),
            ['Consumer'],
        ));
        expect(after - before).toBeCloseTo(10, 4);
    });
});
