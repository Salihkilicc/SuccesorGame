// src/features/shopping/noRealBrands.test.ts
//
// ============================================================================
//  THE SHOP SOLD OTHER PEOPLE'S PRODUCTS
// ============================================================================
//
//  Asked for as "the shop items should not carry brand names, let us not eat a
//  copyright claim".
//
//  Of the 85 items in the catalogue, 56 carried a real one. Bugatti, Ferrari,
//  Rolls-Royce, Patek Philippe, Rolex, Richard Mille, Gulfstream, Boeing,
//  Airbus, the F-22, the MiG-29, the Burj Khalifa, Versailles. The
//  descriptions went further and named real people: Paul Newman's Daytona, the
//  Emperor's Rolex, the Medici.
//
//  ---------------------------------------------------------------------------
//  AND THE GAME ALREADY KNEW BETTER
//  ---------------------------------------------------------------------------
//  Every SHOP in the same files is invented - Velocity Motors, Poseidon Yards,
//  Dynasty 8 Elite, Chronos Swiss - and so is every rival company in the rest
//  of the project: Pear Inc., Gigasoft, Circles. So the tone was already
//  set and settled everywhere except on the items themselves, where somebody
//  reached for the real list because it was quicker.
//
//  ---------------------------------------------------------------------------
//  WHAT IS BANNED AND WHAT IS NOT
//  ---------------------------------------------------------------------------
//  MAKERS AND MODELS AND PEOPLE are banned. A company can be wronged by having
//  its name attached to a product it did not make and did not price.
//
//  PLACES ARE NOT. Monaco, Dubai, Tokyo, Beverly Hills, the Cyclades. A city
//  is not owned by anybody and the casino ladder is already five real cities,
//  so banning them here would make this file disagree with the rest of the
//  game. A named BUILDING is a different thing and is banned: the Burj Khalifa
//  and Versailles are somebody's.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A TEST AND NOT A ONE-OFF PASS THROUGH THE FILES
//  ---------------------------------------------------------------------------
//  The catalogue is about to grow - that is the whole point of the LuxoNet
//  work - and the easiest way to write a convincing luxury item is to name a
//  real one. This has to fail the moment that happens rather than the moment
//  a lawyer notices, which is why it reads every text field on every item and
//  every shop rather than a list somebody remembers to update.
//
//  ---------------------------------------------------------------------------
//  AND THEN THE SAME SWEEP OVER THE REST OF THE GAME
//  ---------------------------------------------------------------------------
//  The shop was where it was worst and it was not where it stopped. Five more
//  files carried real names, and the last section of this file walks all of
//  src rather than a list, because the point of a net is that nobody has to
//  remember to widen it:
//
//      life/NightOut/hookupGameData.ts   Bugatti, Ferrari, Lamborghini,
//                                        Patek, Cartier, Hermès, Birkin,
//                                        Basquiat, Harry Winston
//      life/BlackMarket/blackMarketData.ts   24 modern paintings, 13 gems
//                                        named after houses or people, and
//                                        three weapons with live trademarks
//      love/data/encounterData.ts        a Gulfstream cabin
//      life/Travel/travelData.ts         a Fabergé egg
//      assets/data/marketData.ts         "Airbus-ish", "Lockheed Marvin"
//
//  The nightclub dialogue now names the game's OWN marques - a Corbeau
//  bracelet, a Beaulieu & Fils watch, "I went with the Vaurien myself" -
//  which is better than it was: the shop and the conversation about the shop
//  are one world now instead of two.
//
//  ---------------------------------------------------------------------------
//  WHERE THE LINE IS DRAWN, AND WHY IT IS NOT "SCRUB EVERY PROPER NOUN"
//  ---------------------------------------------------------------------------
//  A COMPANY, a MODERN ARTIST'S ESTATE or a LIVING PERSON goes. Those are the
//  ones with somebody to be wronged and somebody to complain: Picasso, Warhol,
//  Rothko, Hockney, De Beers, Tiffany, Graff.
//
//  A PUBLIC DOMAIN ARTWORK or a HISTORICAL OBJECT stays. The Mona Lisa, the
//  Rosetta Stone, the Koh-i-Noor, Van Gogh's irises. Nobody owns those names,
//  a black market that cannot sell the Mona Lisa is a worse black market, and
//  renaming them would have bought nothing at all.
//
//  A PLACE stays, including a landmark you VISIT: the travel screen offers an
//  after-hours tour of Versailles and that is what tourists do. The shop
//  SELLING Versailles was the problem, and that one went.
//
//  (`love/data/nameData.ts` matches on "Ferrari" and "Chanel" and is left
//  alone. They are a common Italian surname and a common given name, and a
//  person called Ferrari is not a car.)
// ============================================================================

import fs from 'fs';
import path from 'path';
import { ITEMS, SHOPS } from './data/shoppingRegistry';
import { initialLuxuryCatalog } from '../../core/store/useLuxoNetStore';

// ============================================================================
//  THE LIST
// ============================================================================
//
//  Everything the catalogue actually carried, plus the obvious neighbours of
//  each. Not exhaustive across all of luxury, and it does not need to be: it
//  is a net under the specific mistake this catalogue made, and it is checked
//  below for having been quietly emptied.
// ============================================================================

const CAR_MAKERS = [
    'Bugatti', 'Koenigsegg', 'Pagani', 'McLaren', 'Lamborghini', 'Bentley',
    'Rolls-Royce', 'Rolls Royce', 'Maybach', 'Mercedes', 'Ferrari', 'Porsche',
    'Nissan', 'Nismo', 'Lexus', 'Toyota', 'Subaru', 'Rezvani', 'Rimac',
    'Pininfarina', 'Aspark', 'Aston Martin', 'Jaguar', 'Bramabilla',
];

//  Model names only, and only the distinctive ones. `Tourbillon`, `Utopia`,
//  `Phantom`, `Raptor` and `Hercules` were on this list and came off it: the
//  first is a horological complication every watchmaker uses and the rest are
//  ordinary English. Banning a common word buys nothing here - the maker is
//  banned, so the product cannot survive under its own name anyway - and it
//  costs a false positive on the day somebody writes "utopian".
const CAR_MODELS = [
    'Chiron', 'Veyron', 'Jesko', 'Solus', 'Revuelto', 'Mulliner', 'Batur',
    'Droptail', 'GTO', 'Skyline GT-R', 'Z-Tune', 'LFA', 'Impreza',
    'Knight XV', 'Nevera', 'Battista', 'Uhlenhaut', 'Scaglietti', 'AMG',
    'G63', 'Countach', 'Testarossa',
];

const WATCH_MAKERS = [
    'Patek', 'Audemars', 'Piguet', 'Vacheron', 'Constantin', 'Jacob & Co',
    'Richard Mille', 'Rolex', 'Graff', 'Chopard', 'Omega', 'Cartier',
    'Boucheron', 'Harry Winston', 'Tiffany', 'Bvlgari', 'Van Cleef',
];

const WATCH_MODELS = [
    'Grandmaster Chime', 'Nautilus', 'Royal Oak', 'Cabinotiers', 'Daytona',
    'Submariner', 'Bao Dai', 'Hallucination', 'Ref. 1518',
];

const AIR_AND_SEA = [
    'Airbus', 'Boeing', 'Bombardier', 'Gulfstream', 'Lockheed', 'Sikorsky',
    'Mikoyan', 'MiG', 'F-22', 'Black Hawk', 'Blackhawk', 'UH-60',
    'A380', '747', 'ACH160', 'Embraer', 'Cessna', 'Dassault', 'Falcon',
    'Lurssen', 'Lürssen', 'Feadship', 'Nobiskrug', 'Oceanco', 'Benetti',
    'Azimut', 'Royal Caribbean', 'Cunard', 'Carnival', 'Triton', 'Migaloo',
];

const PLACES_THAT_BELONG_TO_SOMEBODY = [
    'Burj Khalifa', 'Versailles', 'Medici', 'Buckingham', 'Kremlin',
    'Taj Mahal', 'Empire State',
];

//  The second sweep. Everything above was caught by reading the item NAMES;
//  these were all hiding in the four-word `specs` chips and the descriptions,
//  where a real name reads as flavour rather than as a claim. "Marvel Collab",
//  "Pharrell", "Ralph Lauren", "Yamaha Tuned", "IMAX Theater", "Le Mans",
//  "F1 Track View". Worth the note: the names were the obvious half and the
//  specs were most of the actual count.
const REAL_PEOPLE_AND_WORKS = [
    'Paul Newman', 'Oppenheimer', 'Pink Star', 'Hope Diamond', 'Spencer',
    'Mona Lisa', 'Gran Turismo', 'Godzilla', 'Nurburgring', 'Nürburgring',
    'Grand Prix', 'Formula 1', 'F1', 'Rothschild', 'Onassis', 'Pharrell',
    'Ralph Lauren', 'Yamaha', 'Marvel', 'Black Panther', 'IMAX', 'Le Mans',
    'Mille Miglia', 'WRC', 'Aeroloft', 'Silver Arrow', 'Marine One',
    'Bao Dai', 'Jaeger', 'Utopia',
];

const BANNED = [
    ...CAR_MAKERS,
    ...CAR_MODELS,
    ...WATCH_MAKERS,
    ...WATCH_MODELS,
    ...AIR_AND_SEA,
    ...PLACES_THAT_BELONG_TO_SOMEBODY,
    ...REAL_PEOPLE_AND_WORKS,
];

/** Every scrap of text a player can read about one thing in the shop. */
const textOf = (o: Record<string, unknown>): string =>
    Object.entries(o)
        .filter(([, v]) => typeof v === 'string' || Array.isArray(v))
        .map(([, v]) => (Array.isArray(v) ? v.join(' ') : String(v)))
        .join(' | ');

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Which banned words appear in a blob, if any.
 *
 * WHOLE WORDS, not substrings. A plain `includes` reported the London palace
 * as a Ferrari, because "Kensington" contains "gto" - and a matcher that
 * cries wolf is one somebody eventually edits into silence.
 */
const hitsIn = (text: string): string[] =>
    BANNED.filter(b => new RegExp(`(^|[^a-z0-9])${escape(b)}([^a-z0-9]|$)`, 'i').test(text));

describe('nothing in the shop is somebody else"s product', () => {
    it('no item name, brand, description or spec carries a real one', () => {
        // THE REQUEST, as one assertion. Reported per item rather than as a
        // count, because a bare number tells whoever adds the 86th item
        // nothing about which word to change.
        const offenders = ITEMS
            .map(i => ({ id: i.id, hits: hitsIn(textOf(i as unknown as Record<string, unknown>)) }))
            .filter(o => o.hits.length > 0);

        expect(offenders).toEqual([]);
    });

    it('and neither does any shop front', () => {
        const offenders = SHOPS
            .map(s => ({ id: s.id, hits: hitsIn(textOf(s as unknown as Record<string, unknown>)) }))
            .filter(o => o.hits.length > 0);

        expect(offenders).toEqual([]);
    });

    it('and neither does the shelved LuxoNet catalogue', () => {
        // Shelved is not gone. Its four items are the ones the maintenance and
        // valuation work is going to lift the economics from, so they will be
        // read again and they should be clean when they are.
        const offenders = initialLuxuryCatalog
            .map(a => ({ id: a.id, hits: hitsIn(textOf(a as unknown as Record<string, unknown>)) }))
            .filter(o => o.hits.length > 0);

        expect(offenders).toEqual([]);
    });
});

// ============================================================================
//  AND THE TEST ITSELF HAS TO STAY HONEST
// ============================================================================
//
//  Two ways to make the assertions above pass without fixing anything: empty
//  the list, or delete the items. Both are one line and both look like
//  tidying, so both are pinned.
// ============================================================================

describe('and the check cannot be passed by making it smaller', () => {
    it('the banned list is not quietly emptied', () => {
        expect(BANNED.length).toBeGreaterThan(90);
        for (const group of [CAR_MAKERS, WATCH_MAKERS, AIR_AND_SEA]) {
            expect(group.length).toBeGreaterThan(10);
        }
    });

    it('and the words in it really are caught when they appear', () => {
        // The net, tested on a fish. Without this the matcher could be broken
        // in some way that makes every assertion above vacuously true.
        expect(hitsIn('a lovely Bugatti Chiron')).toEqual(
            expect.arrayContaining(['Bugatti', 'Chiron']),
        );
        expect(hitsIn('THE PATEK PHILIPPE NAUTILUS')).toEqual(
            expect.arrayContaining(['Patek', 'Nautilus']),
        );
        expect(hitsIn('a quiet villa with a pool')).toEqual([]);
    });

    it('and the catalogue was renamed rather than trimmed', () => {
        // 27 shops and 85 items when the renaming was done, and this asserted
        // both exactly - the point being that deleting the awkward items would
        // have passed a "no real brands" check trivially.
        //
        // The catalogue has GROWN since, to 29 and 108, so the assertion is a
        // floor now rather than an equality. The guarantee it was written for
        // survives: you still cannot pass this file by deleting things.
        expect(SHOPS.length).toBeGreaterThanOrEqual(27);
        expect(ITEMS.length).toBeGreaterThanOrEqual(85);
    });

    it('and no shop on the front page opens on an empty grid', () => {
        // Reported as "some shops are empty". Glacier Row had NO ITEMS AT ALL
        // and nothing anywhere said so: the registry's own validator checks
        // for orphaned items and duplicate ids and never asked the question
        // the other way round.
        const empty = SHOPS
            .filter(s => !ITEMS.some(i => i.shopId === s.id))
            .map(s => s.name);
        expect(empty).toEqual([]);
    });

    it('and no shop is so thin it looks unfinished', () => {
        const thin = SHOPS
            .map(s => ({ name: s.name, n: ITEMS.filter(i => i.shopId === s.id).length }))
            .filter(s => s.n < 2);
        expect(thin).toEqual([]);
    });

    it('and every item still has a name and a price', () => {
        for (const i of ITEMS) {
            expect([i.id, i.name.trim().length > 0]).toEqual([i.id, true]);
            expect([i.id, i.price > 0]).toEqual([i.id, true]);
        }
    });
});

// ============================================================================
//  PLACES STAY
// ============================================================================
//
//  Written down as an assertion rather than as a comment, because the obvious
//  overreaction to this work is to scrub every proper noun and leave a
//  catalogue of grey nouns that could be anywhere. Half of what makes an
//  island worth $850M is knowing where it is.
// ============================================================================

describe('but the world is still the real world', () => {
    it('the catalogue still says where things are', () => {
        const all = ITEMS.map(i => textOf(i as unknown as Record<string, unknown>)).join(' ');
        const places = ['Monaco', 'Dubai', 'Tokyo', 'London', 'Caribbean', 'Beverly Hills'];
        for (const p of places) {
            expect([p, all.includes(p)]).toEqual([p, true]);
        }
    });

    it('and the black market can still sell you a stolen Mona Lisa', () => {
        // The overreaction this guards against. Public domain artworks and
        // historical objects are nobody's to lose, and a fence with nothing
        // recognisable on the table is not a fence.
        const src = read(BLACK_MARKET);
        for (const keep of ['Mona Lisa', 'Rosetta Stone', 'Koh-i-Noor', 'Van Gogh']) {
            expect([keep, src.includes(keep)]).toEqual([keep, true]);
        }
    });
});

// ============================================================================
//  AND THE SAME SWEEP OVER EVERYTHING ELSE
// ============================================================================
//
//  Walks src rather than a list of files. A named list is a thing somebody has
//  to remember to add to, and the whole failure being fixed here is that the
//  shop was written by somebody who reached for the real names because it was
//  quicker - which is exactly what the next person will do in the next file.
// ============================================================================

const SRC_ROOT = path.join(__dirname, '..', '..');
const BLACK_MARKET = path.join(
    'features', 'life', 'components', 'BlackMarket', 'blackMarketData.ts',
);

/** A source file's live text: comments stripped, so a note is not an offence. */
const liveText = (abs: string) =>
    fs.readFileSync(abs, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const read = (rel: string) => liveText(path.join(SRC_ROOT, rel));

const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full, out); continue; }
        if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
        out.push(full);
    }
    return out;
};

/**
 * Words that are somebody's product, and that no source file may carry.
 *
 * A narrower list than BANNED on purpose. That one is aimed at the shop's own
 * fields, where a model number is a claim; this one is aimed at ninety
 * thousand lines of prose, where `GTO` and `AMG` and `F1` turn up inside
 * unrelated identifiers and the false positives would drown the signal.
 * Makers and estates only.
 */
//
//  PLACES_THAT_BELONG_TO_SOMEBODY is left out entirely. That group exists for
//  the shop, where the offence is SELLING somebody's building. Everywhere else
//  a landmark is a landmark: the travel screen offers an after-hours tour of
//  Versailles, a look at Buckingham Palace and a walk round the Kremlin, which
//  is what a tourist does and what a travel screen is for.
//
//  `Carnival` comes out of AIR_AND_SEA here for the same kind of reason. It is
//  a cruise line and it is also a street party in Rio, and the travel screen
//  means the second one.
const BANNED_EVERYWHERE = [
    ...CAR_MAKERS, ...WATCH_MAKERS,
    ...AIR_AND_SEA.filter(b => b !== 'Carnival'),
    'Basquiat', 'Warhol', 'Rothko', 'Pollock', 'Lichtenstein', 'Hockney',
    'Lucian Freud', 'de Grisogono', 'De Beers', 'Moussaieff', 'Rockefeller',
    'Birkin', 'Hermes', 'Hermès', 'Louis Vuitton', 'Gucci', 'Prada',
    'Dom Perignon', 'Dom Pérignon', 'Macallan', 'Stradivarius',
    'AK-47', 'Desert Eagle', 'RPG-7', 'Elvis', 'Liz Taylor',
];

describe('and no file anywhere in the game carries a maker"s name', () => {
    it('not one, and the ones that are allowed to are named here', () => {
        // `nameData.ts` is a pool of first names and surnames. Ferrari is a
        // common Italian surname and Chanel is a common given name; a person
        // called Ferrari is not a car, and renaming people to avoid a car
        // would be the wrong fix to the wrong problem.
        const ALLOWED = [path.join('features', 'love', 'data', 'nameData.ts')];

        const offenders = walk(SRC_ROOT)
            .filter(f => !ALLOWED.some(a => f.endsWith(a)))
            .filter(f => !f.endsWith('noRealBrands.test.ts'))
            .map(f => ({
                file: path.relative(SRC_ROOT, f),
                hits: BANNED_EVERYWHERE.filter(b =>
                    new RegExp(`(^|[^a-z0-9])${escape(b)}([^a-z0-9]|$)`, 'i').test(liveText(f))),
            }))
            .filter(o => o.hits.length > 0);

        expect(offenders).toEqual([]);
    });
});
