// src/core/casino/roomPalette.test.ts
//
// ============================================================================
//  EVERY ROOM PLAYED ON THE SAME CLOTH WITH THE SAME CARDS
// ============================================================================
//
//  Asked for as "change the back of the cards for every room, VIP, Istanbul and
//  so on, and change the colours of the table".
//
//  There were nine hardcoded constants doing it - three per felt, three for the
//  card back - written once and identical everywhere. So the rooms differed in
//  the header, the chips and one accent line, and then you sat down at the same
//  table you had just left. The ladder is five cities and a private room, and
//  the point of climbing it is that somewhere else looks like somewhere else.
//
//  ---------------------------------------------------------------------------
//  DERIVED RATHER THAN TYPED, AND THE TESTS ARE THE CONSTRAINTS
//  ---------------------------------------------------------------------------
//  Six rooms times three surfaces is eighteen colours to pick, keep in step and
//  get wrong once. Each room already has an accent its whole theme is built
//  from, so the cloth is that colour taken down to the darkness a cloth needs.
//
//  Which means the tests can check what actually matters instead of hex codes:
//
//    THE CLOTH MUST BE DARK ENOUGH. White numbers are painted on it in every
//    game. Gold and coral lose contrast fast, so this is the constraint that
//    picked the lightness constant rather than an eye.
//    THE RAIL MUST BE DARKER, or the table has no edge.
//    NO TWO ROOMS MAY MATCH, which is the whole request.
//
//  Measured across the ladder:
//
//      Athens        cloth #142933   15.1:1 against white
//      Istanbul      cloth #1B2D2C   14.4:1
//      Las Vegas     cloth #1B1433   17.6:1
//      Monte Carlo   cloth #312B16   14.1:1
//      Macau         cloth #341414   16.7:1
//      Noir          stated, not derived
// ============================================================================

import { CLOTH_L, NOIR_FELT, RAIL_L, contrast, feltFor } from './roomPalette';
import { CASINO_LOCATIONS, VIP_LOCATION } from '../../features/casino/data/casinoData';
import { VIP_LOCATION_ID } from '../../features/casino/data/vipRoom';

const ROOMS = [...CASINO_LOCATIONS, VIP_LOCATION];
const feltOf = (loc: { id: string; theme: { primary: string } }) =>
    feltFor(loc.theme.primary, loc.id === VIP_LOCATION_ID);

describe('every room brings its own cloth', () => {
    it('and no two of them are the same', () => {
        // THE REQUEST, as one assertion.
        const cloths = ROOMS.map(l => feltOf(l).cloth);
        expect(new Set(cloths).size).toBe(ROOMS.length);
    });

    it('and no two card backs are the same either', () => {
        const backs = ROOMS.map(l => feltOf(l).back);
        expect(new Set(backs).size).toBe(ROOMS.length);
    });

    it('and each one carries its own room"s colour', () => {
        // Derived from the accent, so a room that changes its accent changes
        // its table with it and nothing can drift out of step.
        for (const loc of ROOMS) {
            if (loc.id === VIP_LOCATION_ID) continue;
            expect([loc.name, feltOf(loc).cloth]).not.toEqual([loc.name, '#000000']);
            expect(feltOf(loc)).toEqual(feltFor(loc.theme.primary));
        }
    });
});

describe('and a number can still be read on it', () => {
    it('white clears four and a half to one on every cloth', () => {
        // THE CONSTRAINT THAT PICKED THE CONSTANT. Gold and coral go dark
        // slowly; a naive conversion produces a cloth nobody can read on.
        for (const loc of ROOMS) {
            const c = contrast(feltOf(loc).cloth, '#FFFFFF');
            expect([loc.name, c >= 4.5]).toEqual([loc.name, true]);
        }
    });

    it('and on every card back, which carries white pips too', () => {
        for (const loc of ROOMS) {
            const c = contrast(feltOf(loc).back, '#FFFFFF');
            expect([loc.name, c >= 4.5]).toEqual([loc.name, true]);
        }
    });

    it('and the rail is darker than the cloth, or the table has no edge', () => {
        for (const loc of ROOMS) {
            const f = feltOf(loc);
            expect([loc.name, contrast(f.rail, '#FFFFFF') > contrast(f.cloth, '#FFFFFF')])
                .toEqual([loc.name, true]);
        }
        expect(RAIL_L).toBeLessThan(CLOTH_L);
    });

    it('and the lighter sweep is lighter than the cloth, but not by much', () => {
        for (const loc of ROOMS) {
            const f = feltOf(loc);
            const cloth = contrast(f.cloth, '#FFFFFF');
            const light = contrast(f.clothLight, '#FFFFFF');
            expect([loc.name, light < cloth]).toEqual([loc.name, true]);
            expect([loc.name, cloth - light < 8]).toEqual([loc.name, true]);
        }
    });
});

describe('and the private room is stated rather than derived', () => {
    it('because it shares a primary with Monte Carlo', () => {
        // The one collision in the ladder, and exactly the case a derivation
        // gets wrong. Both rooms are gold.
        const monte = CASINO_LOCATIONS.find(l => l.theme.primary === VIP_LOCATION.theme.primary);
        expect(monte).toBeTruthy();
        expect(feltOf(VIP_LOCATION)).not.toEqual(feltOf(monte!));
    });

    it('and it is nearly black, which is what its own theme already says', () => {
        // "The gold has to be the only thing lit." A derived cloth would
        // argue with the room's own description of itself.
        expect(feltOf(VIP_LOCATION)).toEqual(NOIR_FELT);
        expect(contrast(NOIR_FELT.cloth, '#FFFFFF')).toBeGreaterThan(15);
    });
});

describe('and nothing it is handed can produce a broken colour', () => {
    it('every channel of every surface is a real hex', () => {
        for (const loc of ROOMS) {
            for (const v of Object.values(feltOf(loc))) {
                expect([loc.name, v]).toEqual([loc.name, expect.stringMatching(/^#[0-9A-F]{6}$/)]);
            }
        }
    });

    it('and nonsense in gives something drawable out', () => {
        for (const bad of ['', 'nonsense', '#ZZZ', undefined as unknown as string]) {
            for (const v of Object.values(feltFor(bad))) {
                expect(v).toMatch(/^#[0-9A-F]{6}$/);
            }
        }
    });
});

// ============================================================================
//  AND SOMETHING HAS TO ACTUALLY READ IT
// ============================================================================
//
//  Two probes came back green against changes that broke the feature - a card
//  back that ignored its room, and a felt hardcoded straight back to the old
//  green. Both passed because every test above checks the PALETTE and none
//  checked that anything draws with it.
//
//  Which is this codebase's signature failure, arriving one more time in the
//  same shape: correct data that nothing reads. The derivation being right is
//  worth nothing if the table is still painted from a constant.
// ============================================================================

describe('and every surface actually draws with it', () => {
    const fs = require('fs');
    const path = require('path');
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', 'features', 'casino', ...p), 'utf8');

    it('the blackjack felt paints from the room, not a constant', () => {
        const src = read('components', 'BlackjackFelt.tsx');
        expect(src).toMatch(/felt\.cloth/);
        expect(src).toMatch(/felt\.rail/);
        // The old constants are shelved, and nothing live uses their values.
        // Named rather than quoted: writing the old hex here would put it
        // straight back into the file the palette audit reads.
        expect(src).not.toMatch(/^const FELT_DARK/m);
        // Both gradient stops come from the room. White text fills are fine
        // and are why this checks the stops rather than every fill - a probe
        // caught the broader version failing on `fill="#FFFFFF"`.
        expect((src.match(/stopColor=\{felt\.\w+\}/g) || []).length)
            .toBeGreaterThanOrEqual(2);
    });

    it('and the poker felt does too', () => {
        const src = read('components', 'PokerTable.tsx');
        expect(src).toMatch(/felt\.cloth/);
        expect(src).toMatch(/felt\.rail/);
        expect(src).not.toMatch(/^const FELT_DARK/m);
    });

    it('and the card back takes the room"s back rather than one blue', () => {
        const src = read('components', 'AnimatedCard.tsx');
        expect(src).toMatch(/back && \{ backgroundColor: back\.back, borderColor: back\.backEdge \}/);
        expect(src).toMatch(/back && \{ backgroundColor: back\.backPattern \}/);
    });

    it('and both screens work out their room and hand it to everything', () => {
        for (const s of ['BlackjackGameScreen.tsx', 'PokerGameScreen.tsx']) {
            const src = read('screens', s);
            expect([s, /feltFor\(currentLocation\.theme\.primary/.test(src)]).toEqual([s, true]);
            expect([s, /felt=\{felt\}/.test(src)]).toEqual([s, true]);
            // EVERY card on the screen, not just the first one. Counted by
            // walking each tag rather than by comparing two totals: poker
            // also hands the back to PokerSeat, so the totals differ by one
            // for a correct reason and a count would have to know that.
            const tags = src.split('<AnimatedCard').slice(1);
            expect([s, tags.length > 0]).toEqual([s, true]);
            for (const tag of tags) {
                const open = tag.slice(0, tag.indexOf('/>'));
                expect([s, open.includes('back={felt}')]).toEqual([s, true]);
            }
        }
    });

    it('and the private room is the one told it is private', () => {
        for (const s of ['BlackjackGameScreen.tsx', 'PokerGameScreen.tsx']) {
            expect([s, /VIP_LOCATION_ID\)/.test(read('screens', s))]).toEqual([s, true]);
        }
    });
});
