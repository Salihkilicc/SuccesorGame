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
//  of the project: Pear Inc., Microhard, FaceSpace. So the tone was already
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
//  AND IT COVERS THE SHOP ONLY, WHICH IS NOT THE WHOLE GAME
//  ---------------------------------------------------------------------------
//  Written down so nobody reads a green suite as an all clear. A sweep of the
//  rest of src turned up four more files with the same problem and they are
//  NOT checked here, because widening this file would have meant renaming
//  forty pieces of art in a commit that was asked to fix the shop:
//
//      features/life/NightOut/data/hookupGameData.ts       9 names
//      features/life/BlackMarket/blackMarketData.ts        7 names
//      features/love/data/encounterData.ts                 1 name
//      features/life/Travel/data/travelData.ts             1 name
//
//  (`features/love/data/nameData.ts` also matches, on "Ferrari" and "Chanel".
//  Those are a common Italian surname and a common given name, and a person
//  called Ferrari is not a car. It is left alone on purpose.)
// ============================================================================

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
        // 27 shops and 85 items before this work. Renaming does not change
        // either number, and deleting the awkward ones would have.
        expect(SHOPS.length).toBe(27);
        expect(ITEMS.length).toBe(85);
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
});
