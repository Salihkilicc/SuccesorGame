// src/core/market/brandCanRise.test.ts
//
// ============================================================================
//  IT ONLY EVER WENT DOWN
// ============================================================================
//
//  Reported as brand never rising however well the company did, and growth
//  being impossible. It was not the market being harsh.
//
//  `updateBrand` works entirely on the 0-100 INDEX - its ceiling is
//  `tier.brandCeiling`, 22 at tier one - so the marketing contribution it
//  produces is an index delta. It was handed straight to
//  `advanceCategoryBrand`, which adds it to a scale that runs past four
//  hundred. Four fifths of every marketing quarter was thrown away.
//
//  Measured, at 1% share with the budget at four times the benchmark, ten
//  quarters:
//
//      raw        18.0 -> ... -> 15.8   falling, and nothing stops it
//      converted  18.0 -> ... -> 22.0   climbing to the tier ceiling
//
//  (My first hand measurement said 31.1 for the converted run. That one
//  computed the marketing delta once and reused it; the tick recomputes it
//  every quarter and `updateBrand` cannot exceed the tier ceiling, so it
//  stops at 22. Correct, and it makes the gap four points rather than
//  fifteen. See the note on the ceiling rule below.)
//
//  ---------------------------------------------------------------------------
//  THE FOURTH TIME, IN THE ONE CHANNEL THE PLAYER CONTROLS
//  ---------------------------------------------------------------------------
//  Same unit mismatch as the sponsorship, the scene amounts and the acquisition
//  gain. Those three were caught because somebody said "this does nothing".
//  This one was caught because everything did nothing.
//
//  Which is the lesson this file exists for. brandUnits.test.ts pins the
//  arithmetic and brandStored.test.ts pins what the tick stores, and BOTH
//  passed the entire time marketing was being divided by 4.33. Neither of them
//  asks the question a player asks: can this number go up.
// ============================================================================

import {
    advanceCategoryBrand,
    brandEquilibrium,
    brandIndex,
    indexToPoints,
    ACQUISITION_BRAND_MAX,
} from './brand';
import { updateBrand } from './attraction';
import { getTier } from './capacity';
import fs from 'fs';
import path from 'path';

/** The marketing leg, as the tick computes it: an INDEX delta. */
const marketingDeltaIndex = (currentIndex: number) => {
    const tier = getTier(1);
    const after = updateBrand({
        currentBrand: currentIndex,
        unitsSold: 5_000,
        unmetDemand: 0,
        marketingSpend: 4_000_000,
        marketingBenchmarkTotal: 1_000_000,
        averageQuality: 4,
        brandCeiling: tier.brandCeiling,
        brandFloor: tier.brandFloor,
    } as never) as unknown as { newBrand: number };
    return after.newBrand - currentIndex;
};

/** Ten quarters of a young company that is spending on marketing. */
const run = (quarters: number, convert: boolean, share = 1) => {
    let points = indexToPoints(18);
    for (let q = 0; q < quarters; q++) {
        const delta = marketingDeltaIndex(brandIndex(points));
        points = advanceCategoryBrand({
            current: points,
            share,
            servedRatio: 1,
            marketingDelta: convert ? indexToPoints(delta) : delta,
        }).newBrand;
    }
    return brandIndex(points);
};

describe('a company that markets well', () => {
    it('sees its brand rise', () => {
        // The whole complaint, as one assertion.
        expect(run(10, true)).toBeGreaterThan(18);
    });

    it('and it rises every quarter rather than settling immediately', () => {
        const early = run(2, true);
        const later = run(10, true);
        expect(later).toBeGreaterThan(early);
    });

    it('and without the conversion it fell instead, which is what was reported', () => {
        expect(run(10, false)).toBeLessThan(18);
    });

    it('and it climbs to the ceiling its factory allows, rather than past it', () => {
        // ----------------------------------------------------------------
        //  THE FIRST NUMBER I QUOTED WAS WRONG, AND USEFULLY SO
        // ----------------------------------------------------------------
        //  Measuring by hand I got 31.1 against 15.8 and wrote "a gap of
        //  fifteen points". That run computed the marketing delta ONCE, at a
        //  brand of 18, and reused it for ten quarters. The tick recomputes
        //  it every quarter, and `updateBrand` cannot exceed the tier
        //  ceiling - 22 at tier one - so the delta shrinks to nothing as the
        //  brand approaches it.
        //
        //  So the real behaviour is: it rises to the ceiling and stops, which
        //  is the design. The ceiling is what your factory can support; the
        //  fix was never supposed to let marketing buy past it.
        //
        //  The honest gap is about four and a half points. Smaller than I
        //  first said and the difference between climbing and sinking.
        // ----------------------------------------------------------------
        const tier = getTier(1);
        const climbed = run(10, true);
        expect(climbed).toBeGreaterThan(18);
        expect(climbed).toBeLessThanOrEqual(tier.brandCeiling + 0.001);
        expect(climbed - run(10, false)).toBeGreaterThan(3);
    });
});

describe('the marketing leg', () => {
    it('is produced on the index scale, which is why it needs converting', () => {
        // Read off the function rather than asserted: `updateBrand` cannot
        // exceed the tier ceiling, and that ceiling is a 0-100 number.
        const tier = getTier(1);
        expect(tier.brandCeiling).toBeLessThanOrEqual(100);
        const delta = marketingDeltaIndex(18);
        expect(18 + delta).toBeLessThanOrEqual(tier.brandCeiling + 0.001);
    });

    it('and the conversion is a real multiple, not a no-op', () => {
        const delta = marketingDeltaIndex(18);
        expect(delta).toBeGreaterThan(0);
        expect(indexToPoints(delta)).toBeGreaterThan(delta * 4);
    });
});

describe('an acquisition', () => {
    it('carries its gain on the index scale too', () => {
        // ACQUISITION_BRAND_MAX is 12, which is twelve of a hundred rather
        // than twelve of four hundred. Fed raw it was worth a quarter of what
        // the design says, in the one thing that is supposed to move brand in
        // a single step.
        expect(ACQUISITION_BRAND_MAX).toBeLessThanOrEqual(100);

        const settled = brandEquilibrium(5);
        const raw = advanceCategoryBrand({
            current: settled, share: 5, servedRatio: 1,
            acquisitionGain: ACQUISITION_BRAND_MAX,
        }).newBrand;
        const converted = advanceCategoryBrand({
            current: settled, share: 5, servedRatio: 1,
            acquisitionGain: indexToPoints(ACQUISITION_BRAND_MAX),
        }).newBrand;

        expect(brandIndex(converted) - brandIndex(settled))
            .toBeCloseTo(ACQUISITION_BRAND_MAX, 4);
        expect(brandIndex(raw) - brandIndex(settled))
            .toBeLessThan(ACQUISITION_BRAND_MAX / 4);
    });
});


// ============================================================================
//  AND THE TICK HAS TO BE THE ONE DOING IT
// ============================================================================
//
//  Everything above measures the pure functions with the conversion applied BY
//  THE TEST. I reverted both call sites in useGameStore afterwards and all four
//  hundred and three tests in this folder stayed green.
//
//  Which is this project's signature failure, committed by me, in the file
//  written to document it. A pure module tested correctly, with nothing
//  watching the caller.
//
//  So these read the tick. They are source rules and that is a weaker kind of
//  rule - they check the shape of a line rather than the behaviour of a run -
//  but the alternative here is a full game state with products, market share
//  and a factory tier, and a fixture that elaborate tends to prove whatever it
//  was built to prove.
// ============================================================================

describe('the quarterly tick', () => {
    const TICK = () =>
        fs.readFileSync(path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter(l => !/^\s*(\/\/|\*)/.test(l))
            .map(l => l.replace(/\s\/\/.*$/, ''))
            .join('\n');

    it('converts the marketing delta before it reaches the walk', () => {
        expect(TICK()).toMatch(
            /const marketingDeltaTotal = indexToPoints\(\s*marketingBrand\.newBrand - brandValueIndexPrev,\s*\);/,
        );
    });

    it('and does not hand it over raw', () => {
        expect(TICK()).not.toMatch(
            /const marketingDeltaTotal = marketingBrand\.newBrand - brandValueIndexPrev;/,
        );
    });

    it('and converts the acquisition gain the same way', () => {
        const src = TICK();
        expect(src).toMatch(/acquisitionGain: indexToPoints\(acquisitionGainByCategory\[cat\] \|\| 0\)/);
        expect(src).not.toMatch(/acquisitionGain: \(acquisitionGainByCategory\[cat\] \|\| 0\),/);
    });

    it('and every index sized input to the walk goes through the same door', () => {
        // The four that were wrong, one at a time, over three sittings:
        // sponsorship, scene shocks, marketing, acquisition. If a fifth is
        // ever added this is the line it has to appear on.
        const src = TICK();
        for (const call of [
            /equilibriumBonus: indexToPoints\(sponsorLift\)/,
            /marketingDelta: marketingDeltaTotal \* weightHere/,
            /acquisitionGain: indexToPoints\(/,
        ]) {
            expect(src).toMatch(call);
        }
    });
});


// ============================================================================
//  AND THE FLOOR THE FACTORY GUARANTEES
// ============================================================================
//
//  Reported as brand being far too hard to raise AT THE START, whatever the
//  player does. Measured on a fresh company, before this:
//
//      brand 18 -> 0.81 in the first quarter, then a crawl to 4.7
//
//  Every tier carries a `brandFloor` - 5 at tier one, rising to 8, 10, 12 as
//  the factory grows - and it was applied inside `updateBrand`, which only
//  produces the marketing DELTA. The walk that decides the actual number uses
//  `earnedFloor`, which is about unlocking a second market and starts at zero.
//
//  So the rule that says "your factory guarantees you this much standing" had
//  no reader on the path that decides the number. The fifth time this session,
//  and the same shape as the other four: authored, correct, unread.
//
//  After, on the same company:
//
//      default budget   5.0 and steady, rather than 0.81 and crawling
//      500k budget      5.0 -> 19.2 over twelve quarters, smoothly
//
//  It is a floor, not a boost: it stops the opening collapse and it rises with
//  the tier, so it is a progression rather than a handout.
// ============================================================================

describe('the tier floor', () => {
    it('rises with the factory, so it is progression rather than a gift', () => {
        const floors = [1, 2, 3, 4].map(l => getTier(l).brandFloor);
        for (let i = 1; i < floors.length; i++) {
            expect(floors[i]).toBeGreaterThan(floors[i - 1]);
        }
    });

    it('and it is on the index scale, like everything else fed to the walk', () => {
        expect(getTier(1).brandFloor).toBeLessThan(getTier(1).brandCeiling);
        expect(getTier(1).brandCeiling).toBeLessThanOrEqual(100);
    });

    it('and it holds a young company up instead of letting it sink to nothing', () => {
        const tier = getTier(1);
        const floorPoints = indexToPoints(tier.brandFloor);

        // A company with no market share and no marketing. Without the floor
        // the walk drags it towards zero; with it, it stops where the factory
        // says it should.
        let bare = indexToPoints(18);
        let held = indexToPoints(18);
        for (let q = 0; q < 8; q++) {
            bare = advanceCategoryBrand({ current: bare, share: 0, servedRatio: 1 }).newBrand;
            held = advanceCategoryBrand({
                current: held, share: 0, servedRatio: 1, floor: floorPoints,
            }).newBrand;
        }
        // Eight quarters at 25% a quarter with the loyalty cushion on the
        // way down leaves 4.05, not the 1.8 a plain 0.75^8 would suggest -
        // measured rather than assumed, which is why this says "below the
        // floor" instead of a number I reasoned my way to.
        expect(brandIndex(bare)).toBeLessThan(tier.brandFloor);
        expect(brandIndex(held)).toBeCloseTo(tier.brandFloor, 4);
        expect(brandIndex(held)).toBeGreaterThan(brandIndex(bare));
    });

    it('and the tick is the one applying it', () => {
        // Source rule, for the same reason as the block above: the pure
        // function takes a floor and will happily be given zero forever.
        const TICK = fs.readFileSync(
            path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8',
        );
        expect(TICK).toMatch(
            /floor: Math\.max\(prevFloors\[cat\] \|\| 0, indexToPoints\(tier\.brandFloor \|\| 0\)\)/,
        );
    });

    it('and it does not become a ceiling by accident', () => {
        // The floor must not stop a company climbing above it.
        const tier = getTier(1);
        let b = indexToPoints(tier.brandFloor);
        for (let q = 0; q < 6; q++) {
            b = advanceCategoryBrand({
                current: b, share: 2, servedRatio: 1,
                floor: indexToPoints(tier.brandFloor),
                marketingDelta: indexToPoints(1),
            }).newBrand;
        }
        expect(brandIndex(b)).toBeGreaterThan(tier.brandFloor);
    });
});
