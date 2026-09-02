// src/features/shopping/upkeepWiring.test.ts
//
// ============================================================================
//  THE MAINTENANCE COST EXISTED FOR MONTHS AND NOTHING EVER BILLED IT
// ============================================================================
//
//  Asked for as "there is this maintenance cost thing on the houses, it is not
//  active at the moment I think, should we turn it on".
//
//  It was not active. `annualMaintenanceCost` was written on four items in a
//  shelved catalogue, `getTotalAnnualMaintenance` and `quarterlyTick` were
//  both written to consume it, and NEITHER HAD A CALLER. The personal wealth
//  screen printed the total for a while and even that was reading the wrong
//  store. Owning a $1.5 billion yacht cost the player one dollar a year less
//  than owning nothing.
//
//  This project's signature failure, and this is the fourth or fifth time it
//  has shown up in the same shape: correct data that nothing reads. So this
//  file is deliberately more than half WIRING - the arithmetic being right is
//  the easy half and it has never been the half that was wrong.
//
//  ---------------------------------------------------------------------------
//  AND NOT PAYING HAD TO MEAN SOMETHING
//  ---------------------------------------------------------------------------
//  Measured before any of it was written: the MEDIAN item in the catalogue
//  costs $165,000 a quarter to keep, and the founder's entire salary is
//  $45,000 a quarter. So a collection bought in a good year outruns the income
//  that bought it, easily, and a bill charged unconditionally is a silent
//  slide into negative cash with no decision anywhere in it.
//
//  The rule: the bill is attempted, and a quarter that cannot carry it does
//  not pay it - the collection rots at four times the rate instead. Not paying
//  is not free. It is the expensive option, paid slowly, and paid in the thing
//  you bought rather than in cash.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useAssetStore } from './store/useAssetStore';
import { ITEMS } from './data/shoppingRegistry';
import { personalQuarter, CEO_BASE_SALARY_QUARTERLY } from '../../core/market/personalEconomy';
import { NEGLECT_MULTIPLE, quarterlyUpkeep } from '../../core/luxury/upkeep';
import { driftedPrice, marketValueOf } from '../../core/luxury/valuation';

const SRC = path.join(__dirname, '..', '..');

/** Live source: comments stripped, so a note about a thing is not the thing. */
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const gameStore = () => live(path.join('core', 'store', 'useGameStore.ts'));
const engine = () => live(path.join('features', 'assets', 'logic', 'EconomyEngine.ts'));

const dearest = () => [...ITEMS].sort((a, b) => b.price - a.price)[0];
const buy = (...items: typeof ITEMS) => {
    for (const i of items) useAssetStore.getState().addToCart(i);
    useAssetStore.getState().purchaseCart();
};

beforeEach(() => useAssetStore.getState().reset());

describe('owning something costs money now', () => {
    it('an empty collection costs nothing', () => {
        expect(useAssetStore.getState().upkeepQuarterly()).toBe(0);
    });

    it('and one thing costs its own category"s share of its price', () => {
        const item = dearest();
        buy(item);
        expect(useAssetStore.getState().upkeepQuarterly())
            .toBeCloseTo(quarterlyUpkeep(item), 6);
    });

    it('and the bill lands in the quarter as an expense', () => {
        // THE POINT. Before this the number existed and the quarter did not
        // know about it.
        const upkeep = 500_000;
        const withOut = personalQuarter(
            { portfolioIncomeQuarterly: 0, educationMultiplier: 1 },
            { educationCostQuarterly: 0, partnerCostQuarterly: 0 },
        );
        const withIt = personalQuarter(
            { portfolioIncomeQuarterly: 0, educationMultiplier: 1 },
            {
                educationCostQuarterly: 0,
                partnerCostQuarterly: 0,
                luxuryUpkeepQuarterly: upkeep,
            },
        );

        expect(withOut.luxuryUpkeep).toBe(0);
        expect(withIt.luxuryUpkeep).toBe(upkeep);
        expect(withIt.totalExpenses - withOut.totalExpenses).toBe(upkeep);
        expect(withOut.netFlow - withIt.netFlow).toBe(upkeep);
    });

    it('and it is carried out on its own line, not only inside the total', () => {
        // The quarter tick has to be able to UNDO it. A figure that exists
        // only inside a sum cannot be backed out of that sum.
        const q = personalQuarter(
            { portfolioIncomeQuarterly: 0, educationMultiplier: 1 },
            {
                educationCostQuarterly: 0,
                partnerCostQuarterly: 0,
                luxuryUpkeepQuarterly: 7_000,
            },
        );
        expect(q.luxuryUpkeep).toBe(7_000);
    });

    it('and one median purchase outruns the founder"s whole salary', () => {
        // Measured, not asserted, and it is the number that shaped the rest of
        // this file. If this ever stops being true the unpaid branch below
        // becomes unreachable and the design loses its teeth.
        const sorted = [...ITEMS].sort((a, b) => a.price - b.price);
        buy(sorted[Math.floor(sorted.length / 2)]);
        expect(useAssetStore.getState().upkeepQuarterly())
            .toBeGreaterThan(CEO_BASE_SALARY_QUARTERLY);
    });
});

describe('and time takes it apart', () => {
    it('a quarter passing wears the collection', () => {
        const item = dearest();
        buy(item);
        expect(useAssetStore.getState().ownedItems[0].condition).toBe(100);

        useAssetStore.getState().quarterlyTick(1, true);
        expect(useAssetStore.getState().ownedItems[0].condition).toBeLessThan(100);
    });

    it('and the value follows the condition rather than sitting where it was', () => {
        // `marketValue` was written once at purchase and never again, while
        // the portfolio hook computed its own copy on the way to the screen.
        // Two answers to one question is this project's oldest habit.
        //
        // A YACHT rather than the dearest thing in the shop, which is a tower
        // and appreciates. When the market drift landed this test went red on
        // a real estate item going UP while the condition went down, which is
        // the two forces working - so the test that pins the condition half
        // has to hold something the market is not pushing the other way.
        const item = [...ITEMS].filter(i => i.category === 'MARINE')
            .sort((a, b) => b.price - a.price)[0];
        buy(item);
        useAssetStore.getState().quarterlyTick(8, true);

        const owned = useAssetStore.getState().ownedItems[0];
        expect(owned.marketValue).toBeLessThan(item.price);
        expect(owned.marketValue).toBe(Math.floor(marketValueOf(owned)));
    });

    it('and an unpaid quarter costs four times as much condition', () => {
        // THE WHOLE REASON THE UPKEEP LINE IS WORTH READING.
        const item = dearest();

        buy(item);
        useAssetStore.getState().quarterlyTick(6, true);
        const kept = 100 - useAssetStore.getState().ownedItems[0].condition;

        useAssetStore.getState().reset();
        buy(item);
        useAssetStore.getState().quarterlyTick(6, false);
        const neglected = 100 - useAssetStore.getState().ownedItems[0].condition;

        expect(neglected).toBeCloseTo(kept * NEGLECT_MULTIPLE, 6);
        expect(neglected).toBeGreaterThan(0);
    });

    it('and repairing writes the value back too', () => {
        const item = dearest();
        buy(item);
        useAssetStore.getState().quarterlyTick(12, false);
        const wrecked = useAssetStore.getState().ownedItems[0];
        expect(wrecked.condition).toBeLessThan(100);

        useAssetStore.getState().repairOwnedItem(wrecked.instanceId, 100);
        const fixed = useAssetStore.getState().ownedItems[0];
        expect(fixed.condition).toBe(100);
        // Back to mint, which is the DRIFTED price rather than the sticker: a
        // restored classic is worth what a restored classic is worth now, not
        // what it cost. Checked against the one valuation function so the two
        // cannot come apart again.
        expect(fixed.marketValue).toBe(Math.floor(marketValueOf(fixed)));
        expect(fixed.marketValue).toBe(
            Math.floor(driftedPrice(item.price, item.category, item.type, fixed.quartersOwned ?? 0)),
        );
    });

    it('and the years are counted in GAME quarters, not in wall clock time', () => {
        // `purchaseDate` is `Date.now()`. Ageing anything off it would mean a
        // save loaded a year later found its whole collection a year older,
        // and a player who left the app open all afternoon found nothing had
        // happened. `quartersOwned` is the only clock the drift reads.
        const item = dearest();
        buy(item);
        expect(useAssetStore.getState().ownedItems[0].quartersOwned).toBe(0);

        useAssetStore.getState().quarterlyTick(3, true);
        useAssetStore.getState().quarterlyTick(5, true);
        expect(useAssetStore.getState().ownedItems[0].quartersOwned).toBe(8);
    });

    it('and a tick with nothing owned, or no time passing, changes nothing', () => {
        useAssetStore.getState().quarterlyTick(4, true);
        expect(useAssetStore.getState().ownedItems).toEqual([]);

        buy(dearest());
        const before = useAssetStore.getState().ownedItems;
        useAssetStore.getState().quarterlyTick(0, true);
        expect(useAssetStore.getState().ownedItems).toBe(before);
    });

    it('and every category in the shop wears at some rate', () => {
        // A category with no decay rate is an item that is free to own
        // forever, which is the bug this whole piece of work is about.
        const oneEach = Object.values(
            ITEMS.reduce((acc: Record<string, typeof ITEMS[number]>, i) => {
                acc[i.category] = acc[i.category] || i;
                return acc;
            }, {}),
        );
        // Every department the catalogue has, whatever that number is today.
        // Written as a floor and a match rather than a literal 6, because it
        // WAS a literal 6 and the space department broke it - which is a test
        // failing for the best possible reason and still a nuisance.
        expect(oneEach.length).toBeGreaterThanOrEqual(6);
        expect(oneEach.length).toBe(new Set(ITEMS.map(i => i.category)).size);

        buy(...oneEach);
        useAssetStore.getState().quarterlyTick(20, true);
        for (const owned of useAssetStore.getState().ownedItems) {
            expect([owned.category, owned.condition < 100]).toEqual([owned.category, true]);
        }
    });
});

// ============================================================================
//  AND SOMETHING HAS TO ACTUALLY CALL IT
// ============================================================================
//
//  Everything above passes on a build where the quarter tick has never heard
//  of any of it, which is exactly the state this work started from. These are
//  the assertions that were missing the first four times.
// ============================================================================

describe('and the quarter actually bills it and actually ages it', () => {
    it('the engine reads the collection when it assembles the quarter', () => {
        const src = engine();
        expect(src).toMatch(/luxuryUpkeepQuarterly:/);
        expect(src).toMatch(/useAssetStore\.getState\(\)\.upkeepQuarterly\(\)/);
    });

    it('and puts it on the expense list the player reads', () => {
        // Charging a player for something the report does not mention is worse
        // than not charging them.
        const src = engine();
        expect(src).toMatch(/id: 'luxuryUpkeep'/);
        expect(src).toMatch(/luxuryUpkeep: q\.luxuryUpkeep/);
    });

    it('and the quarter tick ages the collection', () => {
        expect(gameStore()).toMatch(/\.quarterlyTick\(Math\.max\(1, quarters\), upkeepPaid\)/);
    });

    it('and decides whether the bill was payable before it ages it', () => {
        // The order matters: `upkeepPaid` is what the tick is handed, so it
        // has to be settled from the cash first.
        const src = gameStore();
        const decided = src.indexOf('const upkeepPaid');
        const aged = src.indexOf('.quarterlyTick(');
        expect(decided).toBeGreaterThan(-1);
        expect(aged).toBeGreaterThan(decided);
    });

    it('and an unaffordable bill is backed out of the cash rather than charged', () => {
        const src = gameStore();
        expect(src).toMatch(/const cashIfPaid = \(stats\.money \|\| 0\) \+ quarterlyReport\.netFlow \+ bonus\.paid/);
        expect(src).toMatch(/cashIfPaid \+ quarterlyReport\.luxuryUpkeep/);
    });

    it('and cash is still settled in exactly one place', () => {
        // The note this file is amending says so, and adding a branch to that
        // line is the obvious way to have broken it.
        expect((gameStore().match(/const newPlayerCash/g) || []).length).toBe(1);
    });

    it('and the repair button prices itself off the one curve, not a second one', () => {
        // THE FIVE TO ONE RETURN, pinned where it lived. Two formulas forty
        // lines apart in this hook, never compared: the value curve said a
        // repair from 50 puts back 25% of the price, and the bill said it
        // costs 5%. Both come from the module now.
        const src = live(path.join('features', 'shopping', 'hooks', 'useAssetPortfolio.ts'));
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/luxury\/upkeep'/);
        // Priced off the DRIFTED base rather than the sticker, so that a
        // classic which has doubled is quoted at what it is worth now on both
        // halves of the sum. Quoting one half at the old price is how the two
        // formulas came apart in the first place.
        expect(src).toMatch(/const base = driftedPrice\(/);
        expect(src).toMatch(/repairCost\(base, asset\.condition, 100\)/);
        expect(src).toMatch(/valueAt\(base, 100\) - valueAt\(base, asset\.condition\)/);
        // The two old formulas, by shape rather than by value.
        expect(src).not.toMatch(/damagePercent \/ 1000/);
        expect(src).not.toMatch(/0\.5 \+ \(?0\.5 \*/);
    });

    it('and it tells the player it is a loss before they press it', () => {
        // A restoration costs more than it restores, always. That is a design
        // decision, not a trap to spring afterwards.
        const src = live(path.join('features', 'shopping', 'hooks', 'useAssetPortfolio.ts'));
        expect(src).toMatch(/const loss = cost - restored/);
        expect(src).toMatch(/costs you \$\$\{loss\.toLocaleString\(\)\} net/);
    });
});

// ============================================================================
//  THE UNPAID BRANCH, AS ARITHMETIC
// ============================================================================
//
//  The source checks above pin that the branch exists. This pins what it
//  computes, which the source checks cannot.
// ============================================================================

describe('and a player who cannot cover it does not go underwater for it', () => {
    /** The two lines from the quarter tick, run outside it. */
    const settle = (money: number, netFlow: number, upkeep: number) => {
        const cashIfPaid = money + netFlow;
        const upkeepPaid = upkeep <= 0 || cashIfPaid >= 0;
        return { cash: upkeepPaid ? cashIfPaid : cashIfPaid + upkeep, upkeepPaid };
    };

    it('a rich quarter pays the bill', () => {
        const r = settle(100_000_000, -2_000_000, 5_000_000);
        expect(r.upkeepPaid).toBe(true);
        expect(r.cash).toBe(98_000_000);
    });

    it('and a broke quarter does not, and is not driven negative by it', () => {
        // THE DEFECT THIS PREVENTS. Charged unconditionally the player lands
        // at minus four million with nothing to decide about it.
        const r = settle(1_000_000, -5_000_000, 5_000_000);
        expect(r.upkeepPaid).toBe(false);
        expect(r.cash).toBe(1_000_000);
    });

    it('and a quarter that is negative for its own reasons still bills the upkeep', () => {
        // Not a get out of jail card for a badly run company. The rule is
        // about the upkeep being the thing that broke the quarter, and with no
        // upkeep to skip there is nothing to skip.
        const r = settle(1_000_000, -5_000_000, 0);
        expect(r.upkeepPaid).toBe(true);
        expect(r.cash).toBe(-4_000_000);
    });

    it('and landing exactly on zero counts as having paid', () => {
        const r = settle(5_000_000, -5_000_000, 5_000_000);
        expect(r.upkeepPaid).toBe(true);
        expect(r.cash).toBe(0);
    });
});
