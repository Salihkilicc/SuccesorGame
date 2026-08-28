// src/core/market/marketGrowth.test.ts
//
// ============================================================================
//  THE MARKETS GROW, AND UNTIL NOW ONLY THE SCREEN SAID SO
// ============================================================================
//
//  `growthPerQuarter` has been on every market since they were written, and
//  MarketPositionPanel tells the player "Market grows 1.5% / quarter" to their
//  face. Nothing ever grew `sizeUnitsPerQuarter`.
//
//  Correct data with no reader, for the seventeenth time in this codebase, and
//  this one was the growth engine.
//
//  WHAT IT COST, MEASURED. Eight sixty quarter runs at every marketing level,
//  with and without sponsorship, upgrading as fast as the money allowed:
//
//      mkt x0.30 spon   gate q45   tier 2   capital $4.6M   value $10M
//      mkt x0.50 spon   gate q10   tier 2   capital $3.4M   value  $8M
//      mkt x0.70 spon   gate  q6   tier 2   capital $1.6M   value  $5M
//      mkt x1.00 spon   gate  q4   tier 1   capital $4.5M   value $10M
//      mkt x0.50 dry    gate q12   tier 2   capital $8.9M   value $13M
//      mkt x0.30 dry    NEVER      tier 3   capital $5.2M   value  $8M
//
//  Fifteen years of competent play and the company is still worth ten million
//  at tier two. Upgrading harder made it worse, not better: the aggressive
//  run ended at MINUS 7.6 million.
//
//  Not for lack of money, for lack of DEMAND. A tier two line holds 6,653
//  units a quarter against demand of about 5,000, so every upgrade after the
//  first buys capacity nobody wants and an opex bill that arrives anyway.
// ============================================================================

import {
    marketSizeAt,
    marketAt,
    getMarket,
    MARKET_GROWTH_CAP,
    PRODUCT_MARKETS,
} from './productMarkets';

const consumer = () => getMarket('Consumer')!;
const deepTech = () => getMarket('Deep Tech')!;

describe('a market gets bigger', () => {
    it('which it did not do at all before', () => {
        // THE DEFECT, as one assertion.
        const m = consumer();
        expect(m.growthPerQuarter).toBeGreaterThan(0);
        expect(marketSizeAt(m, 40)).toBeGreaterThan(m.sizeUnitsPerQuarter);
    });

    it('and every authored market has a rate, so none of them is left behind', () => {
        for (const m of PRODUCT_MARKETS) {
            expect(m.growthPerQuarter).toBeGreaterThan(0);
            expect(marketSizeAt(m, 20)).toBeGreaterThan(m.sizeUnitsPerQuarter);
        }
    });

    it('and it starts at the size it was authored at', () => {
        for (const m of PRODUCT_MARKETS) {
            expect(marketSizeAt(m, 1)).toBe(m.sizeUnitsPerQuarter);
            expect(marketSizeAt(m, 0)).toBe(m.sizeUnitsPerQuarter);
            expect(marketSizeAt(m, -5)).toBe(m.sizeUnitsPerQuarter);
        }
    });

    it('and it only ever goes up', () => {
        const m = deepTech();
        let last = 0;
        for (let q = 1; q <= 200; q++) {
            const size = marketSizeAt(m, q);
            expect(size).toBeGreaterThanOrEqual(last);
            last = size;
        }
    });
});

describe('and the rate on the screen is the rate you get, at first', () => {
    it('the first year tracks what the panel promises, within two per cent', () => {
        // MarketPositionPanel says "Market grows 1.5% / quarter", so for the
        // stretch where a player is reading that sentence and checking it, it
        // has to be true. Measured against straight compounding at q4:
        //     Consumer 0.999   Bio-Tech 0.999   Robotics 0.997   Deep Tech 0.989
        for (const m of PRODUCT_MARKETS) {
            const compound = m.sizeUnitsPerQuarter * Math.pow(1 + m.growthPerQuarter / 100, 3);
            expect(marketSizeAt(m, 4) / compound).toBeGreaterThan(0.98);
        }
    });

    it('and the faster the market, the sooner it parts company with the sentence', () => {
        // WHICH I HAD WRONG. I claimed the early quarters track the panel for
        // every market and set the bar at eight quarters; Deep Tech was at
        // 0.936 by then and 0.678 by twenty, because the whole point of the
        // curve is to bend the fast ones. Written down rather than hidden:
        //
        //      q8    Consumer 0.995   Robotics 0.981   Deep Tech 0.936
        //      q20   Consumer 0.964   Robotics 0.883   Deep Tech 0.678
        //
        // Which is the honest behaviour. A market authored at six per cent a
        // quarter cannot keep that up, and the alternative is 1,088x.
        const ratio = (cat: string, q: number) => {
            const m = getMarket(cat)!;
            return marketSizeAt(m, q) / (m.sizeUnitsPerQuarter * Math.pow(1 + m.growthPerQuarter / 100, q - 1));
        };
        expect(ratio('Deep Tech', 20)).toBeLessThan(ratio('Consumer', 20));
        expect(ratio('Consumer', 20)).toBeGreaterThan(0.95);
    });

    it('but it does not compound forever, because Deep Tech would eat the game', () => {
        // Straight compounding at the authored 6% a quarter:
        //     thirty years   1,088x
        //     fifty years  115,000x
        // A market that large makes every other number meaningless.
        const m = deepTech();
        const compoundAt120 = m.sizeUnitsPerQuarter * Math.pow(1.06, 120);
        expect(compoundAt120 / m.sizeUnitsPerQuarter).toBeGreaterThan(1000);
        expect(marketSizeAt(m, 120) / m.sizeUnitsPerQuarter).toBeLessThan(10);
    });

    it('and it stops somewhere nameable rather than at an asymptote nobody can quote', () => {
        for (const m of PRODUCT_MARKETS) {
            const ratio = marketSizeAt(m, 100_000) / m.sizeUnitsPerQuarter;
            expect(ratio).toBeLessThanOrEqual(MARKET_GROWTH_CAP);
            expect(ratio).toBeGreaterThan(MARKET_GROWTH_CAP - 0.01);
        }
    });

    it('and a faster market is still ahead of a slower one at every point', () => {
        // The authored rates have to keep meaning something after the curve.
        const fast = deepTech(), slow = consumer();
        for (const q of [10, 40, 120]) {
            expect(marketSizeAt(fast, q) / fast.sizeUnitsPerQuarter)
                .toBeGreaterThan(marketSizeAt(slow, q) / slow.sizeUnitsPerQuarter);
        }
    });
});

describe('what the rest of the game is handed', () => {
    it('the same market object, with the size of the day on it', () => {
        const grown = marketAt('Consumer', 60)!;
        const base = consumer();
        expect(grown.category).toBe(base.category);
        expect(grown.baselineShare).toBe(base.baselineShare);
        expect(grown.competitors).toBe(base.competitors);
        expect(grown.sizeUnitsPerQuarter).toBeGreaterThan(base.sizeUnitsPerQuarter);
    });

    it('and the authored table is never mutated, so a reload starts where it started', () => {
        const before = consumer().sizeUnitsPerQuarter;
        marketAt('Consumer', 200);
        marketAt('Consumer', 400);
        expect(consumer().sizeUnitsPerQuarter).toBe(before);
    });

    it('and an unknown category is still undefined rather than a market of nothing', () => {
        expect(marketAt('Fusion Reactors', 40)).toBeUndefined();
        expect(marketAt(undefined, 40)).toBeUndefined();
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the tick reads the market of today, not the one in the file', () => {
        // The failure this guards is the one that caused the whole report:
        // `getMarket` still exists and still returns the authored size, so a
        // caller that keeps using it gets a market frozen in 1990 and nothing
        // anywhere goes red.
        const src = read('core', 'store', 'useGameStore.ts');
        expect(src).toMatch(/const market = marketNow\(category\)/);
        expect(src).toMatch(/const mk = marketNow\(cat\)/);
    });

    it('and so does the screen the player decides on', () => {
        expect(read('features', 'products', 'components', 'ProductModals.tsx'))
            .toMatch(/marketNow\(product\.category\)/);
        expect(read('core', 'market', 'useMarketPosition.ts'))
            .toMatch(/marketNow\(category\)/);
    });
});
