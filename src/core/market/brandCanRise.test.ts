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
    marketingToPoints,
    DECAY_CONVERSION_KEPT,
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
            /const marketingDeltaTotal = marketingToPoints\(\s*marketingBrand\.newBrand - brandValueIndexPrev,\s*\);/,
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


// ============================================================================
//  AND THE OTHER DIRECTION, WHICH I DID NOT MEASURE THE FIRST TIME
// ============================================================================
//
//  Converting the marketing leg fixed the climb and broke the fall. Reported
//  as brand still dropping while meeting demand and spending real money, four
//  years into a run.
//
//  The conversion is symmetric arithmetic and the two sides are not symmetric
//  in the game: a GAIN is stopped by the tier ceiling a few lines later, so
//  converting it in full just reaches that ceiling sooner. A LOSS is stopped
//  only by the floor, which sits far below where a growing company lives, so
//  converting it in full turned "at worst 1.2 of a hundred a quarter" into
//  5.2 points off a brand that might only be 50.
//
//  Measured at the opening default, 67k against a 250k maintenance:
//
//      -0.70 index  ->  -3.03 points converted in full
//
//  And maintenance is a share of the market's benchmark, so it GROWS. A
//  player raising their budget but not fast enough fell behind four times
//  harder than the constant was written for.
// ============================================================================

describe('underspending', () => {
    it('still costs something, because the threshold has to mean something', () => {
        expect(marketingToPoints(-1)).toBeLessThan(0);
    });

    it('but not four times what the constant was written for', () => {
        // The whole regression, as one comparison.
        expect(Math.abs(marketingToPoints(-1))).toBeLessThan(Math.abs(indexToPoints(-1)));
    });

    it('and a gain is still converted in full, which was the original fix', () => {
        expect(marketingToPoints(1)).toBeCloseTo(indexToPoints(1), 6);
    });

    it('and zero stays zero', () => {
        expect(marketingToPoints(0)).toBe(0);
    });

    it('and the asymmetry is named rather than a bare number', () => {
        // An unexplained multiplier here is how the next person reintroduces
        // this in either direction.
        expect(DECAY_CONVERSION_KEPT).toBeGreaterThan(0);
        expect(DECAY_CONVERSION_KEPT).toBeLessThan(1);
    });

    it('and the tick uses the asymmetric door, not the raw conversion', () => {
        // Its own reader: `TICK` above is scoped to the describe that owns it.
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8',
        )
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .map((l: string) => l.replace(/\s\/\/.*$/, ''))
            .join('\n');
        expect(src).toMatch(/marketingToPoints\(/);
        expect(src).not.toMatch(/marketingDeltaTotal = indexToPoints\(/);
    });
});


// ============================================================================
//  AND THE OPENING WAS A DECLINE NOBODY COULD STOP
// ============================================================================
//
//  Reported twice, the second time with the numbers: 15, 13, 12, 11, at the
//  START of a run, while meeting demand.
//
//  Brand walks towards the level market share supports, and a company on its
//  first morning has NO measurable share - the equilibrium is zero. The
//  starting brand of 18 was a claim with nothing underneath it, so the walk
//  dragged it down from the first quarter and marketing had to beat that pull
//  before it could show anything at all.
//
//  Measured over ten quarters from 18:
//
//      67k marketing   13.6 11.2 9.7 8.5 7.6 6.8 6.1 5.6 5.1 5.0
//      300k marketing  13.4 11.9 12.0 12.9 14.2 15.4 16.6 17.8 18.6 19.2
//
//  Even four times the default budget goes backwards for two quarters first.
//  From the tier floor there is nowhere to fall:
//
//      300k marketing  5.4 6.7 8.2 10.0 11.7 13.2 14.6 15.9 17.0 17.8
// ============================================================================

describe('the brand a company starts with', () => {
    const initial = () => {
        const { initialStatsState } = require('../store/useStatsStore');
        return initialStatsState.brandValue as number;
    };

    it('is a level its own factory guarantees', () => {
        expect(initial()).toBe(getTier(1).brandFloor);
    });

    it('and not a level its market share would have to support', () => {
        // 18 index is 78 points, which is 1.8% of a market the company does
        // not have a measurable share of on day one.
        expect(brandEquilibrium(0)).toBe(0);
        expect(indexToPoints(initial())).toBeLessThan(indexToPoints(18));
    });

    it('so there is nowhere for the opening to fall to', () => {
        // The floor and the start are the same number, so the walk has no
        // room to drag the player backwards before their first decision
        // lands.
        expect(initial()).toBeLessThanOrEqual(getTier(1).brandFloor);
    });

    it('and it is derived, so it cannot drift from the floor', () => {
        const fs2 = require('fs');
        const path2 = require('path');
        const src = fs2.readFileSync(
            path2.join(__dirname, '..', 'store', 'useStatsStore.ts'), 'utf8',
        );
        expect(src).toMatch(/brandValue: getTier\(1\)\.brandFloor,/);
        expect(src).not.toMatch(/brandValue: 18,/);
    });
});


// ============================================================================
//  PAY THE UPKEEP AND THE MARKET CANNOT DRAG YOU BACKWARDS
// ============================================================================
//
//  Reported as: "I am above the benchmark, should it not go up? Is that not
//  how we built the game?" It was not, and the player's model was the one the
//  game had promised.
//
//  Being above maintenance made the MARKETING term positive and left the share
//  pull untouched, and the pull is the larger force whenever brand sits above
//  what share supports. Measured at brand 18 with no share, 250k upkeep:
//
//      300k spend  -> marketing +0.50   net -2.56
//      1000k spend -> marketing +4.00   net +0.94
//
//  Four times the upkeep just to stop sliding, while the screen said the
//  budget was above the line.
//
//  Through the real tick, ten quarters from 18:
//
//      67k   18.0 17.9 17.9 17.8 15.1 13.0 11.3 9.8 8.6 7.7
//      300k  18.4 19.5 21.3 22.0 22.0 ...   rises from the first quarter
// ============================================================================

describe('paying the upkeep', () => {
    const settled = indexToPoints(18);

    it('stops the market pulling you down', () => {
        const dragged = advanceCategoryBrand({ current: settled, share: 0, servedRatio: 1 });
        const held = advanceCategoryBrand({
            current: settled, share: 0, servedRatio: 1, maintained: true,
        });
        expect(dragged.newBrand).toBeLessThan(settled);
        expect(held.newBrand).toBe(settled);
    });

    it('and a budget above the line now RISES rather than merely falling slower', () => {
        const r = advanceCategoryBrand({
            current: settled, share: 0, servedRatio: 1,
            maintained: true, marketingDelta: marketingToPoints(0.5),
        });
        expect(r.newBrand).toBeGreaterThan(settled);
    });

    it('but it does not buy you the climb, only the floor under it', () => {
        // Growing your share still lifts you, and that pull is untouched.
        const rising = advanceCategoryBrand({
            current: indexToPoints(5), share: 5, servedRatio: 1, maintained: true,
        });
        expect(rising.newBrand).toBeGreaterThan(indexToPoints(5));
    });

    it('and a scandal can still take you down, because that is not the market forgetting you', () => {
        const hit = advanceCategoryBrand({
            current: settled, share: 0, servedRatio: 1,
            maintained: true, shock: indexToPoints(-10),
        });
        expect(hit.newBrand).toBeLessThan(settled);
    });

    it('and NOT paying it leaves the slide exactly as it was', () => {
        const a = advanceCategoryBrand({ current: settled, share: 0, servedRatio: 1 });
        const b = advanceCategoryBrand({
            current: settled, share: 0, servedRatio: 1, maintained: false,
        });
        expect(a.newBrand).toBe(b.newBrand);
    });

    it('and the threshold is one function, asked by both sides', () => {
        const { meetsMaintenance, maintenanceCost } = require('./attraction');
        expect(maintenanceCost(1_000_000)).toBe(250_000);
        expect(meetsMaintenance(300_000, 1_000_000)).toBe(true);
        expect(meetsMaintenance(67_000, 1_000_000)).toBe(false);
    });

    it('but it does NOT hold you above your own ceiling', () => {
        // ----------------------------------------------------------------
        //  CAUGHT BY conviction.test.ts, NOT BY ME
        // ----------------------------------------------------------------
        //  The first version zeroed the downward pull whenever the upkeep was
        //  paid, full stop. The conviction penalty and the sponsorship
        //  drought both work by LOWERING the ceiling, and a brand that cannot
        //  be pulled down cannot be pulled down to meet a lowered one either.
        //  Two identical companies, one convicted, landed on exactly the same
        //  number.
        // ----------------------------------------------------------------
        const ceiling = indexToPoints(10);
        const above = indexToPoints(30);
        const held = advanceCategoryBrand({
            current: above, share: 0, servedRatio: 1, maintained: true, ceiling,
        });
        expect(held.newBrand).toBeLessThan(above);
    });

    it('and below the ceiling the upkeep still protects you', () => {
        const ceiling = indexToPoints(30);
        const below = indexToPoints(10);
        const held = advanceCategoryBrand({
            current: below, share: 0, servedRatio: 1, maintained: true, ceiling,
        });
        expect(held.newBrand).toBe(below);
    });

    it('and the tick hands it the ceiling its penalties have earned', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8',
        )
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');
        expect(src).toMatch(
            /ceiling: indexToPoints\(Math\.max\(0, \(tier\.brandCeiling \|\| 0\) - ceilingPenalty\)\)/,
        );
        // One penalty, computed once, used by both the marketing leg and the
        // walk. Two copies would drift the first time either was retuned.
        expect((src.match(/const ceilingPenalty =/g) ?? []).length).toBe(1);
        expect(src).toMatch(/ceilingPenalty,/);
    });

    it('and the tick asks it, rather than deciding for itself', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', 'store', 'useGameStore.ts'), 'utf8',
        )
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');
        expect(src).toMatch(
            /maintained: meetsMaintenance\(totalMarketingCost, totalMarketingBenchmark\)/,
        );
    });
});
