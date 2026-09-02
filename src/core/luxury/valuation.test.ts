// src/core/luxury/valuation.test.ts
//
// ============================================================================
//  A VINTAGE WATCH AND A NEW HELICOPTER AGED IN THE SAME DIRECTION
// ============================================================================
//
//  Asked for as "valuable jewellery or watches, if we buy them they could
//  appreciate year on year, that could be important too".
//
//  Before this the only thing that could move an owned asset's value was its
//  CONDITION, so everything in the catalogue behaved like a car: buy it, watch
//  it wear, sell it for less. The correct strategy was to buy nothing, which
//  is a poor thing for a shop to teach.
//
//  ---------------------------------------------------------------------------
//  THE TEST THAT MATTERS IS THE ONE ABOUT DIRECTION
//  ---------------------------------------------------------------------------
//  Not the rates - those are anchored to figures somebody already wrote and
//  are a matter of taste within a point or two. What has to hold is that the
//  two forces pull SEPARATELY: a neglected classic can be worth more than it
//  cost, and a mint helicopter can be worth less. If both always move the same
//  way then there is one force wearing two names and the decision the player
//  is supposed to be making does not exist.
// ============================================================================

import {
    COLLECTIBLE_DRIFT_PER_YEAR, COLLECTIBLE_TYPES, DRIFT_CEILING, DRIFT_FLOOR,
    DRIFT_PER_YEAR, driftMultiplier, driftRateFor, driftedPrice, marketValueOf,
} from './valuation';
import { UPKEEP_RATE, annualUpkeep, decayed, valueAt, type LuxuryCategory } from './upkeep';
import { ITEMS } from '../../features/shopping/data/shoppingRegistry';

const CATEGORIES = Object.keys(UPKEEP_RATE) as LuxuryCategory[];
const YEAR = 4;

describe('some things go up and some things go down', () => {
    it('watches, stones and land appreciate', () => {
        for (const c of ['WATCH', 'JEWELRY', 'REAL_ESTATE'] as LuxuryCategory[]) {
            expect([c, driftMultiplier(c, undefined, 10 * YEAR) > 1]).toEqual([c, true]);
        }
    });

    it('and cars, aircraft and boats do not', () => {
        for (const c of ['VEHICLE', 'AIRCRAFT', 'MARINE'] as LuxuryCategory[]) {
            expect([c, driftMultiplier(c, undefined, 10 * YEAR) < 1]).toEqual([c, true]);
        }
    });

    it('and a boat is the worst of them, which is the standing joke', () => {
        expect(DRIFT_PER_YEAR.MARINE).toBeLessThan(DRIFT_PER_YEAR.AIRCRAFT);
        expect(DRIFT_PER_YEAR.AIRCRAFT).toBeLessThan(DRIFT_PER_YEAR.VEHICLE);
        expect(DRIFT_PER_YEAR.WATCH).toBeGreaterThan(DRIFT_PER_YEAR.REAL_ESTATE);
    });

    it('and the rates are the ones somebody already wrote down', () => {
        // `appreciationRatePerYear` on the shelved LuxoNet catalogue, which
        // has never had a reader. Four of the six categories are anchored.
        expect(DRIFT_PER_YEAR.VEHICLE).toBeCloseTo(-0.02, 3);
        expect(DRIFT_PER_YEAR.AIRCRAFT).toBeCloseTo(-0.04, 3);
        expect(DRIFT_PER_YEAR.WATCH).toBeCloseTo(0.08, 3);
        expect(DRIFT_PER_YEAR.REAL_ESTATE).toBeCloseTo(0.05, 3);
    });
});

describe('and a collectible ignores the department it was bought in', () => {
    it('a 1962 racer is not a car in the sense a new hypercar is', () => {
        // THE REASON THE RATE IS KEYED ON TYPE FIRST. Both of these are
        // VEHICLE. Keyed on category alone, the most valuable car in the shop
        // would depreciate like a runabout.
        expect(driftRateFor('VEHICLE', 'classic_racer')).toBe(COLLECTIBLE_DRIFT_PER_YEAR);
        expect(driftRateFor('VEHICLE', 'hypercar')).toBe(DRIFT_PER_YEAR.VEHICLE);
        expect(driftMultiplier('VEHICLE', 'classic_racer', 10 * YEAR))
            .toBeGreaterThan(driftMultiplier('VEHICLE', 'hypercar', 10 * YEAR));
    });

    it('and every type on the list is actually in the catalogue', () => {
        // Or the list is a guess. These were read off the data, and a rule
        // keyed on a type nobody uses is a rule that never fires.
        const inUse = new Set(ITEMS.map(i => i.type).filter(Boolean));
        for (const t of COLLECTIBLE_TYPES) {
            expect([t, inUse.has(t)]).toEqual([t, true]);
        }
    });

    it('and the catalogue really does have some of them', () => {
        const collectibles = ITEMS.filter(i => COLLECTIBLE_TYPES.includes(i.type || ''));
        expect(collectibles.length).toBeGreaterThan(5);
    });

    it('and a type nobody has heard of falls back to its category', () => {
        expect(driftRateFor('MARINE', 'hovercraft')).toBe(DRIFT_PER_YEAR.MARINE);
        expect(driftRateFor('SPACECRAFT', undefined)).toBe(0);
        expect(driftMultiplier('SPACECRAFT', undefined, 200)).toBe(1);
    });
});

describe('and it cannot run away over a dynasty', () => {
    it('nothing ever exceeds the ceiling or falls through the floor', () => {
        // A run is decades and continues through successors. Eight per cent a
        // year for thirty years is ten times over, which is not a collectible,
        // it is a bug that pays out.
        for (const c of CATEGORIES) {
            for (const q of [0, 40, 200, 4000]) {
                const m = driftMultiplier(c, undefined, q);
                expect([c, q, m <= DRIFT_CEILING && m >= DRIFT_FLOOR]).toEqual([c, q, true]);
            }
        }
        expect(driftMultiplier('VEHICLE', 'classic', 100_000)).toBe(DRIFT_CEILING);
        expect(driftMultiplier('MARINE', undefined, 100_000)).toBe(DRIFT_FLOOR);
    });

    it('and the ceiling binds on the things that rise, not on the things that fall', () => {
        // The right way round. An appreciating asset that runs away is an
        // exploit; a depreciating one that reaches zero is a thing the player
        // goes on paying upkeep for and can never sell.
        expect(driftMultiplier('WATCH', undefined, 20 * YEAR)).toBe(DRIFT_CEILING);
        expect(driftMultiplier('AIRCRAFT', undefined, 20 * YEAR)).toBeGreaterThan(DRIFT_FLOOR);
    });

    it('and owning something for no time at all changes nothing', () => {
        expect(driftMultiplier('WATCH', undefined, 0)).toBe(1);
        expect(driftedPrice(1_000, 'WATCH', undefined, 0)).toBe(1_000);
        expect(driftMultiplier('WATCH', undefined, -50)).toBe(1);
    });

    it('and it compounds per quarter, not in a jump once a year', () => {
        // A collection valued every quarter would otherwise sit flat for three
        // and leap on the fourth, which reads as a bug on the screen.
        const a = driftMultiplier('WATCH', undefined, 1);
        const b = driftMultiplier('WATCH', undefined, 2);
        expect(a).toBeGreaterThan(1);
        expect(b).toBeGreaterThan(a);
        expect(driftMultiplier('WATCH', undefined, YEAR)).toBeCloseTo(1.08, 4);
    });
});

// ============================================================================
//  AND THE TWO FORCES REALLY ARE TWO
// ============================================================================
//
//  The whole design in four assertions. If condition and the market always
//  moved together there would be one force with two names, and choosing
//  between a hypercar and a vintage racer would not be a choice.
// ============================================================================

describe('condition and the market are separate forces', () => {
    const PRICE = 100_000_000;

    it('a neglected classic can still be worth more than it cost', () => {
        const wrecked = marketValueOf({
            price: PRICE, category: 'VEHICLE', type: 'classic',
            condition: 55, quartersOwned: 15 * YEAR,
        });
        expect(wrecked).toBeGreaterThan(PRICE);
    });

    it('and a mint helicopter is worth less than it cost', () => {
        const perfect = marketValueOf({
            price: PRICE, category: 'AIRCRAFT', type: 'luxury_heli',
            condition: 100, quartersOwned: 10 * YEAR,
        });
        expect(perfect).toBeLessThan(PRICE);
    });

    it('and condition still bites on a thing the market likes', () => {
        // Or the drift has swallowed the upkeep work whole and there is no
        // reason to pay a bill again.
        const args = {
            price: PRICE, category: 'WATCH' as const,
            quartersOwned: 10 * YEAR,
        };
        expect(marketValueOf({ ...args, condition: 40 }))
            .toBeLessThan(marketValueOf({ ...args, condition: 100 }));
    });

    it('and the market still bites on a thing in perfect condition', () => {
        const args = { price: PRICE, category: 'MARINE' as const, condition: 100 };
        expect(marketValueOf({ ...args, quartersOwned: 10 * YEAR }))
            .toBeLessThan(marketValueOf({ ...args, quartersOwned: 0 }));
    });

    it('and the two multiply rather than one overwriting the other', () => {
        const asset = {
            price: PRICE, category: 'WATCH' as const, type: undefined,
            condition: 70, quartersOwned: 6 * YEAR,
        };
        expect(marketValueOf(asset)).toBeCloseTo(
            valueAt(driftedPrice(PRICE, 'WATCH', undefined, 6 * YEAR), 70), 6,
        );
    });

    it('and nonsense in gives a number out', () => {
        expect(Number.isFinite(marketValueOf({
            price: NaN, category: 'WATCH', condition: NaN, quartersOwned: NaN,
        }))).toBe(true);
        expect(marketValueOf({ price: 100, category: 'WATCH', condition: 100 }))
            .toBe(100);
    });
});

// ============================================================================
//  AND BUYING THINGS IS STILL NOT AN INVESTMENT
// ============================================================================
//
//  THE ONE THAT WOULD HAVE BITTEN. An appreciating asset plus a resale button
//  is a trade, and the warning given when this work was planned was that
//  repair-and-flip must not print money. The market drift is the same risk in
//  a different shape: hold a classic for fifteen years, sell it for more than
//  you paid.
//
//  MEASURED over the full round trip - 8% luxury tax in, upkeep every year,
//  condition decay, and the 70% resale haircut on the way out:
//
//      ITEM                        10yr ratio   25yr        annualised
//      vintage watch                    1.106   1.727        +2.2%/yr
//      sapphire tourbillon              1.332   1.724        +2.2%/yr
//      private island                   0.858   1.126        +0.5%/yr
//      1962 racer (classic)             0.810   0.773        -1.0%/yr
//      classic coupe                    0.810   0.773        -1.0%/yr
//      new hypercar                     0.369   0.155        -7.2%/yr
//      gigayacht                        0.239   0.057       -10.8%/yr
//
//  The best thing in the shop returns about 2% a year over a quarter century,
//  which is under a stock dividend and far under the market screen. So there
//  is a SPECTRUM of how much a purchase costs you rather than a class of asset
//  that competes with investing - and the classics do not beat the watches,
//  because a classic car costs 2.2% a year to keep and a watch costs 0.3%.
//
//  That is the design: buying luxury is consumption, and the choice is how
//  expensive a kind of consumption. A yacht at minus eleven per cent a year is
//  meant to be the joke it is.
// ============================================================================

describe('and holding something and selling it does not beat investing', () => {
    const RESALE = 0.7;  // useAssetPortfolio.sellAsset
    const TAX = 0.08;    // CartScreen's luxury tax

    /** In, held, out. Every cost the player actually pays. */
    const roundTrip = (item: typeof ITEMS[number], years: number) => {
        const q = years * YEAR;
        const spent = item.price * (1 + TAX) + 5000 + annualUpkeep(item) * years;
        const out = marketValueOf({
            ...item,
            condition: decayed(100, item.category, q, true),
            quartersOwned: q,
        }) * RESALE;
        return out / spent;
    };

    it('nothing in the catalogue returns more than a few per cent a year', () => {
        // THE GUARANTEE. Not per item and not per category - every item, at
        // both horizons, because the exploit only has to exist once.
        for (const item of ITEMS) {
            for (const years of [5, 10, 25, 50]) {
                const ratio = roundTrip(item, years);
                const annualised = Math.pow(ratio, 1 / years) - 1;
                expect([item.id, years, annualised < 0.05])
                    .toEqual([item.id, years, true]);
            }
        }
    });

    it('and the very best of them is still under a stock dividend', () => {
        const best = Math.max(...ITEMS.map(i => Math.pow(roundTrip(i, 25), 1 / 25) - 1));
        expect(best).toBeGreaterThan(0);      // something should be worth keeping
        expect(best).toBeLessThan(0.04);      // and none of it a way to get rich
    });

    it('and a yacht is the joke it is supposed to be', () => {
        const yacht = ITEMS.find(i => i.category === 'MARINE')!;
        expect(roundTrip(yacht, 25)).toBeLessThan(0.2);
    });

    it('and the upkeep is what separates two things the market likes equally', () => {
        // A 1962 racer and a vintage watch are BOTH collectibles and drift at
        // exactly the same rate. The racer still loses money over twenty five
        // years and the watch does not, and the entire difference is that a
        // classic car costs 2.2% a year to keep and a watch costs 0.3%.
        //
        // Which is the reason the two modules have to be read together, and
        // the reason this assertion is here rather than a comment: it would be
        // easy to "fix" a losing classic by raising its drift, and the actual
        // answer is that garages cost money.
        const classic = ITEMS.find(i => i.type === 'classic_racer')!;
        const watch = ITEMS.find(i => i.type === 'vintage_icon')!;

        expect(driftRateFor(classic.category, classic.type))
            .toBe(driftRateFor(watch.category, watch.type));
        expect(UPKEEP_RATE[classic.category as LuxuryCategory])
            .toBeGreaterThan(UPKEEP_RATE[watch.category as LuxuryCategory]);

        expect(roundTrip(classic, 25)).toBeLessThan(1);
        expect(roundTrip(watch, 25)).toBeGreaterThan(1);
    });
});
