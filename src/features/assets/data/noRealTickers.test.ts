// src/features/assets/data/noRealTickers.test.ts
//
// ============================================================================
//  THE MARKET IS A PARODY AND NOT A COPY
// ============================================================================
//
//  `noRealBrands.test.ts` already walks all of src, and it stayed green on a
//  file carrying `UnitedHealth`, `AdobeFake`, `SpotifyStream`, `HerbalLife
//  Scam`, and sixty seven NYSE and NASDAQ tickers verbatim. Not because the
//  net was broken: because its list is cars, watches, luxury houses and
//  artists. The stock market is a different sector and nobody had swept it.
//
//  So this is that sweep, and it is deliberately NOT a list of the names that
//  were found. It is the rule that made them wrong:
//
//      1. a name may not contain a real company's mark
//      2. a symbol may not be a real listed ticker
//
//  ---------------------------------------------------------------------------
//  THE TICKER WAS THE WORSE HALF
//  ---------------------------------------------------------------------------
//  A name can be a joke. `TSLA` is not a joke, it is an identifier issued by
//  an exchange, and an entry called `Edison Motors` trading under `TSLA` IS
//  Tesla to anybody reading the screen. The names were argued about for an
//  afternoon; the symbols were the part that had no defence at all.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE JOKES MOVED INTO THE DESCRIPTIONS
//  ---------------------------------------------------------------------------
//  The catalogue is meant to be funny; that is worth money and it is why the
//  parody existed. A joke in a NAME is a trademark question. The same joke in
//  a DESCRIPTION is prose about an invented company, and prose is where it has
//  been put: 'Software giant that controls your PC' names nobody and lands the
//  same way.
//
//  This file is not legal advice and neither was the decision behind it. It is
//  a rule that keeps the catalogue on the safe side of a question nobody here
//  is qualified to answer.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..', '..');

/** Both halves of the market: the catalogue, and the rival list beside it. */
const FILES = [
    'src/features/assets/data/marketData.ts',
    'src/core/market/productMarkets.ts',
];

const source = (rel: string) =>
    fs.readFileSync(path.join(ROOT, rel), 'utf8')
        .split('\n').map(l => l.split('//')[0]).join('\n');

const field = (rel: string, name: string): string[] =>
    [...source(rel).matchAll(new RegExp(`${name}:\\s*'([^']+)'`, 'g'))].map(m => m[1]);

/**
 * Tickers that belong to somebody. Every one of these was in this repo.
 *
 * Kept as the ACTUAL former contents rather than a sample, so the test is a
 * record of what was shipped as well as a guard against it returning.
 */
const REAL_TICKERS = [
    'TSLA', 'UNH', 'JNJ', 'JPM', 'INTC', 'ADBE', 'SPOT', 'HLF', 'LMT', 'CAT',
    'SHEL', 'AXP', 'BRK', 'MA', 'PFE', 'CRM', 'HOOD', 'SQ', 'VISA', 'ALGN',
    'SPCE', 'RUN', 'SPY', 'QQQ', 'ICLN', 'GLD', 'VYM',
    'BTC', 'ETH', 'SOL', 'DOGE', 'PEPE', 'BNB', 'ADA', 'DOT', 'LINK', 'SHIB',
    'LTC', 'XMR', 'MATIC', 'SFM', 'APE',
];

/**
 * Marks that may not appear inside a name, as a substring.
 *
 * Substring rather than equality on purpose: `AdobeFake`, `SpotifyStream` and
 * `HerbalLife Scam` were all "not the real name" and all carried the real one
 * whole. Appending a word to somebody's mark is not a disguise.
 */
const REAL_MARKS = [
    'Adobe', 'Spotify', 'HerbalLife', 'Herbalife', 'UnitedHealth', 'Visa',
    'JP Morgan', 'JPMorgan', 'General Motors', 'Shell', 'SolarCity',
    'Salesforce', 'SalesForce', 'Intel', 'Berkshire', 'Lockheed',
    'Caterpillar', 'Medicare', 'MediCare', 'Johnson & Johnson',
    'Binance', 'Cardano', 'Solana', 'Polygon', 'Chainlink', 'Shiba',
    'Monero', 'Litecoin', 'LiteCoin', 'Ethereum', 'SafeMoon', 'Coinbase',
    'Robinhood', 'Mastercard', 'MasterCard', 'Skynet', 'SkyNet',
    'S&P', 'StartApp', 'Facebook', 'MySpace', 'Netflix', 'Nvidia', 'Pfizer',
    'Biogen', 'Airbus', 'Microsoft', 'OpenAI',
];

describe('no symbol is a ticker somebody else owns', () => {
    for (const rel of FILES) {
        it(`${rel} carries none of them`, () => {
            const used = field(rel, 'symbol');
            expect(used.length).toBeGreaterThan(0);
            expect(used.filter(s => REAL_TICKERS.includes(s))).toEqual([]);
        });
    }
});

describe('no name carries a real mark', () => {
    for (const rel of FILES) {
        it(`${rel} carries none of them`, () => {
            const offenders: string[] = [];
            for (const n of field(rel, 'name')) {
                for (const mark of REAL_MARKS) {
                    if (n.toLowerCase().includes(mark.toLowerCase())) {
                        offenders.push(`${n}  contains  ${mark}`);
                    }
                }
            }
            expect(offenders).toEqual([]);
        });
    }
});

describe('and the one that was not a trademark question', () => {
    it('no company name accuses anybody of anything', () => {
        // ------------------------------------------------------------------
        //  `HerbalLife Scam` WAS THE ONE THAT KEPT ME UP
        // ------------------------------------------------------------------
        //  Every other entry was a question about marks. This one attached the
        //  word "Scam" to a real, named, trading company, which is a different
        //  kind of claim entirely and does not need a trademark lawyer to
        //  become a problem.
        //
        //  The joke survives as `Pyramid Wellness`, which describes a business
        //  model and names nobody.
        // ------------------------------------------------------------------
        const accusations = ['Scam', 'Fraud', 'Ponzi', 'Fake'];
        const offenders: string[] = [];
        for (const rel of FILES) {
            for (const n of field(rel, 'name')) {
                for (const word of accusations) {
                    if (n.includes(word)) offenders.push(`${rel}: ${n}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('the two halves of the market agree with each other', () => {
    it('every rival in productMarkets exists in the catalogue under the same symbol', () => {
        // ------------------------------------------------------------------
        //  TWO LISTS, ONE MARKET
        // ------------------------------------------------------------------
        //  productMarkets.ts repeats name and symbol for the competitors in
        //  each sector. A rename that touched one file and not the other would
        //  leave the player buying `Gigasoft` on one screen and competing with
        //  `Microhard` on another, with nothing failing anywhere.
        // ------------------------------------------------------------------
        const catalogue = new Map(
            field(FILES[0], 'symbol').map((s, i) => [s, field(FILES[0], 'name')[i]]),
        );
        const rivals = source(FILES[1]);
        const pairs = [...rivals.matchAll(/name:\s*'([^']+)',\s*symbol:\s*'([^']+)'/g)];
        expect(pairs.length).toBeGreaterThan(0);

        const mismatched = pairs
            .filter(([, name, symbol]) => catalogue.has(symbol) && catalogue.get(symbol) !== name)
            .map(([, name, symbol]) => `${symbol} is '${catalogue.get(symbol)}' in the catalogue and '${name}' here`);
        expect(mismatched).toEqual([]);
    });
});
