// src/core/story/estateChattels.test.ts
//
// ============================================================================
//  THE ONE THING THAT SHOULD HAVE BEEN HARDEST TO KEEP PASSED INTACT
// ============================================================================
//
//  Asked for as "if our father buys everything, does that reset, or does it
//  come down to us, is it shared out, what happens, we never got into this".
//
//  Nothing happened. `runSuccession` has never mentioned the collection, so
//  the cash was split down to the child and the stock down to the share, and a
//  thirty billion dollar fleet came through whole and untaxed. The heir woke
//  up owning every yacht their father had ever bought.
//
//  (Worth correcting an earlier reading of this: `newGame.ts` DOES wipe the
//  collection, and that was reported as "inheritance wipes everything". It is
//  not the same path. A new game is a new family; a succession is the same
//  one, and succession was the path that did nothing.)
//
//  ---------------------------------------------------------------------------
//  IT DOES NOT DIVIDE, SO IT IS SOLD
//  ---------------------------------------------------------------------------
//  Three siblings cannot have a third of a yacht each. So the chattels follow
//  the seat, the siblings are paid out of the cash they were already getting,
//  and the duty is raised by selling from the most valuable down - which is
//  what an executor does with a bill and a fortnight.
//
//  MEASURED on a full eighty five piece collection worth $33.95B:
//
//      sold      7 pieces      kept     78 pieces
//      survives  39.0% of the VALUE, 92% of the COLLECTION
//
//  Nobody designed that second number and it is the best thing about the rule.
//  The island and the yacht go; the watches come down. Small things survive an
//  estate, and they always have.
//
//      gen 1   $33.95B -> $13.25B   78 pieces
//      gen 2   $13.25B ->  $5.50B   70 pieces
//      gen 3    $5.50B ->  $2.34B   63 pieces
//      gen 4    $2.34B ->  $1.00B   56 pieces
//
//  The same shape as the shareholding, which the file next door already says
//  out loud: one generation and the family still has it, three and they are
//  showing visitors a photograph.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    CHATTEL_DUTY_RATE, FORCED_SALE_RATE, divideBelongings, type Chattel,
} from './inheritance';
import { ITEMS } from '../../features/shopping/data/shoppingRegistry';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const runSuccession = () => live(path.join('core', 'story', 'runSuccession.ts'));

/** The whole catalogue, as a collection somebody owned. */
const wholeCollection = (): Array<Chattel & { category: string }> =>
    ITEMS.map((i, n) => ({
        instanceId: `own_${n}`,
        name: i.name,
        marketValue: i.price,
        category: i.category,
    }));

const worth = (items: readonly Chattel[]) =>
    items.reduce((s, i) => s + i.marketValue, 0);

describe('the executor takes his cut in objects', () => {
    it('the duty is a share of what the collection is worth', () => {
        const all = wholeCollection();
        expect(divideBelongings(all).dutyDue)
            .toBeCloseTo(worth(all) * CHATTEL_DUTY_RATE, 0);
    });

    it('and it is raised by selling, from the most valuable down', () => {
        // What an executor does with a bill and a fortnight. It is also the
        // better story, and the two happen to be the same thing.
        const all = wholeCollection();
        const { sold } = divideBelongings(all);
        const dearest = [...all].sort((a, b) => b.marketValue - a.marketValue);

        expect(sold.length).toBeGreaterThan(0);
        expect(sold.map(s => s.instanceId))
            .toEqual(dearest.slice(0, sold.length).map(s => s.instanceId));
    });

    it('and it sells exactly enough and not one piece more', () => {
        // Both halves. Stopping short leaves a duty unpaid; going one over is
        // an executor helping himself.
        const all = wholeCollection();
        const { sold, raised, dutyDue } = divideBelongings(all);

        expect(raised).toBeGreaterThanOrEqual(dutyDue);
        const withoutLast = sold.slice(0, -1)
            .reduce((s, i) => s + i.marketValue * FORCED_SALE_RATE, 0);
        expect(withoutLast).toBeLessThan(dutyDue);
    });

    it('and a forced sale does not fetch the market price', () => {
        // The same fraction the shop's own resale pays. If an estate sale
        // fetched more than the player can get voluntarily, dying would be a
        // way to liquidate well.
        expect(FORCED_SALE_RATE).toBeLessThan(1);
        const one: Chattel[] = [{ instanceId: 'a', name: 'A', marketValue: 1_000 }];
        expect(divideBelongings(one).raised).toBe(1_000 * FORCED_SALE_RATE);
    });

    it('and the lumpy remainder goes to the heir rather than to nobody', () => {
        // One item, a 40% duty, and a sale that raises 70% of the whole thing.
        const one: Chattel[] = [{ instanceId: 'a', name: 'A', marketValue: 1_000 }];
        const d = divideBelongings(one);
        expect(d.kept).toEqual([]);
        expect(d.surplusCash).toBeCloseTo(700 - 400, 6);
    });

    it('and nothing is created or lost in the accounting', () => {
        const all = wholeCollection();
        const d = divideBelongings(all);
        expect(worth(d.kept) + worth(d.sold)).toBeCloseTo(worth(all), 0);
        expect(d.raised).toBeCloseTo(worth(d.sold) * FORCED_SALE_RATE, 0);
        expect(d.surplusCash).toBeCloseTo(d.raised - d.dutyDue, 6);
    });

    it('and an empty estate is not an error', () => {
        const d = divideBelongings([]);
        expect(d).toEqual({ kept: [], sold: [], dutyDue: 0, raised: 0, surplusCash: 0 });
    });

    it('and a duty of nothing takes nothing', () => {
        const all = wholeCollection();
        const d = divideBelongings(all, 0);
        expect(d.sold).toEqual([]);
        expect(d.kept.length).toBe(all.length);
    });
});

// ============================================================================
//  AND WHAT THAT DOES OVER A DYNASTY, WHICH IS THE POINT
// ============================================================================

describe('and a fortune does not survive four generations', () => {
    it('about four tenths of the value comes down each time', () => {
        // Measured rather than chosen: 40% duty raised at 70% on the dollar
        // costs nearer 57% of the collection. The band is wide because the
        // last sale overshoots by however lumpy the fleet is.
        const survived = worth(divideBelongings(wholeCollection()).kept)
            / worth(wholeCollection());
        expect(survived).toBeGreaterThan(0.3);
        expect(survived).toBeLessThan(0.5);
    });

    it('but almost all of the PIECES do, and nobody designed that', () => {
        // THE BEST THING ABOUT THE RULE. Seven disposals cover the duty on
        // eighty five pieces, because the top of a collection is where the
        // money is. So an heir loses the island and keeps the watches.
        const all = wholeCollection();
        const { kept, sold } = divideBelongings(all);
        expect(sold.length).toBeLessThan(all.length * 0.15);
        expect(kept.length).toBeGreaterThan(all.length * 0.85);
    });

    it('and what comes down is the small and the collectible', () => {
        // Every watch survives and the top of the market is what went.
        //
        // The SECOND half of this used to name REAL_ESTATE, because islands
        // and towers were the dearest things in the shop. Then the space
        // department arrived at $1.76B against $265B for everything else, and
        // the executor started selling orbital assets instead - so every piece
        // of real estate came through and this went red.
        //
        // Which is the rule working, not breaking: whatever sits at the top of
        // the market is what an estate has to sell.
        //
        // It was then rewritten to "everything sold comes from the dearest
        // DEPARTMENT, whichever that is today", and that went red too, when
        // the generational waves put two hundred billion of chartered city
        // and half a trillion of roofed sea into real estate. Space is no
        // longer so far ahead that one department covers the whole bill, so
        // the executor now reaches into two.
        //
        // The department framing was the mistake both times. `divideBelongings`
        // has never known what a department is: it sorts by value and sells
        // from the top down. So THAT is what is asserted here now, and it is
        // the sentence in the title of the test - everything sold is dearer
        // than everything kept. It cannot go red for a data change again,
        // because it is the rule rather than a symptom of the rule.
        //
        // `divideBelongings` takes and returns `Chattel`, which has no
        // category - deliberately, since the estate rule does not care what
        // department a thing came from. The category is carried alongside for
        // this test only, so both sides are widened rather than the module.
        type Categorised = Chattel & { category: string };
        const all = wholeCollection();
        const division = divideBelongings(all);
        const kept = division.kept as Categorised[];
        const sold = division.sold as Categorised[];
        const keptCats = kept.map(k => k.category);

        const allWatches = all.filter(i => i.category === 'WATCH').length;
        expect(keptCats.filter(c => c === 'WATCH').length).toBe(allWatches);

        expect(sold.length).toBeGreaterThan(0);
        const cheapestSold = Math.min(...sold.map(s => s.marketValue));
        const dearestKept = Math.max(...kept.map(k => k.marketValue));
        expect(cheapestSold).toBeGreaterThanOrEqual(dearestKept);

        // And it really did come off the top of the market, or the line above
        // would also pass on a collection of forty identical watches.
        const dearest = Math.max(...all.map(i => i.marketValue));
        expect(sold.some(s => s.marketValue === dearest)).toBe(true);
    });

    it('and four generations of it leaves a photograph', () => {
        let items: Chattel[] = wholeCollection();
        const first = worth(items);
        for (let g = 0; g < 4; g++) items = divideBelongings(items).kept;
        expect(worth(items) / first).toBeLessThan(0.05);
        // And still a collection, rather than an empty room.
        expect(items.length).toBeGreaterThan(40);
    });
});

// ============================================================================
//  AND SOMETHING HAS TO ACTUALLY DO IT
// ============================================================================
//
//  `divideBelongings` being right is worth nothing if succession never calls
//  it, which is precisely the state this work found the maintenance cost, the
//  luxury row, the appreciation rate and the whole LuxoNet store in.
// ============================================================================

describe('and the succession actually settles the estate', () => {
    it('runSuccession divides the collection', () => {
        const src = runSuccession();
        expect(src).toMatch(/import \{ divideBelongings \} from '\.\/inheritance'/);
        expect(src).toMatch(/settleTheEstate\(\)/);
        expect(src).toMatch(/divideBelongings\(owned\)/);
    });

    it('and writes what survived back to the store the shop reads', () => {
        const src = runSuccession();
        expect(src).toMatch(/useAssetStore\.setState\(\{ ownedItems: division\.kept \}/);
    });

    it('and pays the lumpy surplus into the heir"s account', () => {
        expect(runSuccession()).toMatch(/money: \(s\.money \|\| 0\) \+ division\.surplusCash/);
    });

    it('and tells the player, because a screen full of gaps is not a story', () => {
        // The inventory silently losing its four biggest rows is the exact
        // failure this project keeps finding: a number that moves with nothing
        // to announce it. The letter names what went and what it raised.
        const src = runSuccession();
        expect(src).toMatch(/useMailStore\.getState\(\)\.receiveMail\(/);
        expect(src).toMatch(/Ashcombe & Reyes/);
        expect(src).toMatch(/division\.sold\.map/);
    });

    it('and posts it AFTER the inbox is wiped, or it is the one thing lost', () => {
        // The ordering is the only fragile thing in that file and its own
        // comment says so about the first letter. This is a second letter with
        // the same hazard.
        const src = runSuccession();
        const wipe = src.indexOf('useMailStore.getState().reset()');
        const settle = src.indexOf('settleTheEstate();');
        expect(wipe).toBeGreaterThan(-1);
        expect(settle).toBeGreaterThan(wipe);
    });

    it('and a player who owned nothing gets no letter about nothing', () => {
        const src = runSuccession();
        expect(src).toMatch(/if \(!owned \|\| owned\.length === 0\) return;/);
        expect(src).toMatch(/if \(division\.sold\.length === 0\) return;/);
    });
});

describe('and the letter obeys the house rules', () => {
    it('no em dash and no spaced hyphen anywhere in it', () => {
        // Player visible text. Hyphenated words are fine; a dash is not.
        const src = fs.readFileSync(
            path.join(SRC, 'core', 'story', 'runSuccession.ts'), 'utf8',
        );
        const body = src.slice(src.indexOf('const settleTheEstate'), src.indexOf('const postFirstLetter'));
        const strings = body.match(/'[^']*'|`[^`]*`/g) || [];
        for (const s of strings) {
            expect([s, /—/.test(s)]).toEqual([s, false]);
            expect([s, /\s-\s/.test(s)]).toEqual([s, false]);
        }
    });
});
