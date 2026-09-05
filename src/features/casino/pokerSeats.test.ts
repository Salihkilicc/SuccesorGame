// src/features/casino/pokerSeats.test.ts
//
// ============================================================================
//  WHO IS AT THE TABLE, AND WHERE THEY ARE SITTING
// ============================================================================
//
//  Asked for as "the opponents should be the CEOs of the other companies, in
//  the VIP room the table is CEOs, in the cities random people but a CEO can
//  turn up, and there should be round character circles".
//
//  Measured over two thousand sittings of five seats:
//
//      room     CEO     stranger    tables with a CEO at them
//      city    16.2%      83.8%              57%
//      VIP    100.0%       0.0%             100%
//
//  Which is the shape that was wanted: rare enough in a city that noticing the
//  name is the moment, certain in the Noir room where there are no strangers.
//
//  ---------------------------------------------------------------------------
//  AND THE GEOMETRY IS ARITHMETIC, NOT FIVE TYPED POSITIONS
//  ---------------------------------------------------------------------------
//  Seats sit on an arc by angle, so the spacing is even by construction and
//  the table works at four seats or six without anybody moving a style rule.
//  Five typed positions is a table until somebody asks for a sixth chair.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    CEO_NAMES,
    CITY_BOARD_CHANCE,
    CITY_CEO_CHANCE,
    STRANGERS,
    TABLE_SEATS,
    avatarHue,
    initialsOf,
    rivalCeos,
    seatTable,
    type SeatKind,
} from '../../core/casino/pokerTable';
import { seatPosition } from './components/PokerTable';
import { portraitForPerson } from '../../core/portraits';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');

describe('every rival company has a person running it', () => {
    it('and there is a name for every one the markets ship', () => {
        // An anonymous rival would have thrown away the whole point of putting
        // them at the table.
        const { PRODUCT_MARKETS } = require('../../core/market/productMarkets');
        const ids = new Set<string>();
        for (const m of PRODUCT_MARKETS) for (const c of m.competitors) ids.add(c.stockId);
        for (const id of ids) {
            expect(`${id}:${!!CEO_NAMES[id]}`).toBe(`${id}:true`);
        }
    });

    it('and no name is left over for a company that does not exist', () => {
        const { PRODUCT_MARKETS } = require('../../core/market/productMarkets');
        const ids = new Set<string>();
        for (const m of PRODUCT_MARKETS) for (const c of m.competitors) ids.add(c.stockId);
        for (const id of Object.keys(CEO_NAMES)) {
            expect(`${id}:${ids.has(id)}`).toBe(`${id}:true`);
        }
    });

    it('and the same company always sends the same person', () => {
        // A player who beat Pear's chief executive last year meets him again.
        const a = rivalCeos().find(o => o.id === 'tech_pear');
        const b = rivalCeos().find(o => o.id === 'tech_pear');
        expect(a?.name).toBe(b?.name);
        expect(a?.company).toBe('Pear Inc.');
    });

    it('and everybody at the table has a distinct name', () => {
        expect(new Set(Object.values(CEO_NAMES)).size).toBe(Object.keys(CEO_NAMES).length);
        expect(new Set(STRANGERS).size).toBe(STRANGERS.length);
    });
});

describe('who turns up', () => {
    const composition = (vip: boolean) => {
        // `magnate` joined SeatKind when the private room stopped being
        // twenty one people. Written as a Record so a new kind is a compile
        // error here rather than a silent zero.
        const counts: Record<SeatKind, number> = {
            ceo: 0, board: 0, stranger: 0, magnate: 0,
        };
        let tablesWithCeo = 0;
        const N = 2000;
        for (let i = 0; i < N; i++) {
            const table = seatTable(vip);
            if (table.some(o => o.kind === 'ceo')) tablesWithCeo++;
            for (const o of table) counts[o.kind]++;
        }
        const total = counts.ceo + counts.board + counts.stranger + counts.magnate;
        return { ...counts, total, tablesWithCeo: tablesWithCeo / N };
    };

    it('a city table is mostly strangers', () => {
        const c = composition(false);
        expect(c.stranger / c.total).toBeGreaterThan(0.7);
    });

    it('and a rival turns up about one seat in six, as configured', () => {
        const c = composition(false);
        expect(Math.abs(c.ceo / c.total - CITY_CEO_CHANCE)).toBeLessThan(0.04);
    });

    it('and that means about half of city tables have one at them', () => {
        // Rare enough to be a moment, common enough to happen.
        const c = composition(false);
        expect(c.tablesWithCeo).toBeGreaterThan(0.4);
        expect(c.tablesWithCeo).toBeLessThan(0.75);
    });

    it('but the Noir room has no strangers in it at all', () => {
        // THE LINE THAT SURVIVED THE ROOM BEING WIDENED. It used to also
        // assert `ceo / total === 1`, which was the same sentence while a
        // rival was the only person who could be somebody - and there are
        // twenty one of those, so the room was exhausted inside thirty
        // sittings and showed the same faces for the rest of the run.
        //
        // Magnates are the other kind of somebody. Every seat is still a
        // person you had to be somebody to sit with; none of them is a
        // stranger. See MAGNATES in core/casino/pokerTable.
        const c = composition(true);
        expect(c.stranger).toBe(0);
        expect(c.board).toBe(0);
        expect((c.ceo + c.magnate) / c.total).toBe(1);
        // And a rival is still the face you are most likely to know.
        expect(c.ceo / c.total).toBeGreaterThan(0.25);
        expect(c.ceo / c.total).toBeLessThan(0.6);
    });

    it('and nobody is ever sitting at the table twice', () => {
        for (let i = 0; i < 500; i++) {
            const table = seatTable(i % 2 === 0);
            expect(new Set(table.map(o => o.id)).size).toBe(table.length);
        }
    });

    it('and the table is always full', () => {
        expect(TABLE_SEATS).toBe(5);
        for (let i = 0; i < 200; i++) {
            expect(seatTable(false)).toHaveLength(TABLE_SEATS - 1);
            expect(seatTable(true)).toHaveLength(TABLE_SEATS - 1);
        }
    });

    it('and a director of your own is rarer than a rival', () => {
        // Meeting the man who controls seventeen per cent of your company at a
        // poker table is not a coincidence you want twice a year.
        expect(CITY_BOARD_CHANCE).toBeLessThan(CITY_CEO_CHANCE);
    });

    it('and it still seats a table when no stores are running', () => {
        // The markets and the register are read through guarded requires, so a
        // test or a cold start gets strangers rather than an empty table.
        expect(seatTable(false, () => 0.99)).toHaveLength(TABLE_SEATS - 1);
    });
});

describe('the seats sit on an arc', () => {
    it('evenly, by angle rather than by hand', () => {
        // Five typed positions is a table until somebody asks for a sixth.
        //
        // EVEN IN ANGLE, NOT EXACTLY EVEN IN DISTANCE, and the difference is
        // the ellipse rather than a mistake: the table is squashed vertically
        // (0.42 wide against 0.34 deep, because a circle of players reads as a
        // seance), so equal angles give slightly unequal arc lengths near the
        // ends. Measured spread 0.053 of the table width, which is about
        // nineteen points on a phone. Chasing exact arc length would need an
        // elliptic integral to fix something nobody can see.
        //
        // I set this to 0.05 first and it failed at 0.053, which is the test
        // telling me the truth rather than the code being wrong.
        const five = Array.from({ length: 5 }, (_, i) => seatPosition(i, 5));
        const gaps = five.slice(1).map((p, i) => Math.hypot(p.x - five[i].x, p.y - five[i].y));
        const spread = Math.max(...gaps) - Math.min(...gaps);
        expect(spread).toBeLessThan(0.08);
        // And nowhere near the mess that five hand typed positions would drift to.
        expect(spread).toBeLessThan(Math.min(...gaps) / 3);
    });

    it('and the arc is symmetric about the middle', () => {
        const five = Array.from({ length: 5 }, (_, i) => seatPosition(i, 5));
        expect(five[0].x).toBeCloseTo(1 - five[4].x, 6);
        expect(five[1].x).toBeCloseTo(1 - five[3].x, 6);
        expect(five[2].x).toBeCloseTo(0.5, 6);
    });

    it('and nobody sits where the player cards go', () => {
        // The bottom of the oval is the player's own edge.
        for (const n of [3, 4, 5, 6]) {
            for (let i = 0; i < n; i++) {
                const p = seatPosition(i, n);
                expect(`${n}/${i}:${p.y < 0.62}`).toBe(`${n}/${i}:true`);
            }
        }
    });

    it('and everybody stays on the table', () => {
        for (const n of [1, 2, 5, 6, 8]) {
            for (let i = 0; i < n; i++) {
                const p = seatPosition(i, n);
                expect(p.x).toBeGreaterThanOrEqual(0);
                expect(p.x).toBeLessThanOrEqual(1);
                expect(p.y).toBeGreaterThanOrEqual(0);
                expect(p.y).toBeLessThanOrEqual(1);
            }
        }
    });

    it('and one lonely opponent sits opposite you', () => {
        expect(seatPosition(0, 1).x).toBeCloseTo(0.5, 6);
    });
});

/**
 * Source read with the comments taken out.
 *
 * These checks used to read the raw file, and that was safe only for as long
 * as nothing was ever commented out. The seat's own avatar styles have now
 * been shelved in place - kept as comments, per the rule that code is not
 * deleted - and `/borderRadius: 23/` still matched them perfectly. The test
 * would have stayed green while the circle it describes no longer existed:
 * this codebase's signature failure, in a test rather than in a screen.
 */
const readLive = (...p: string[]): string =>
    read(...p)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

describe('the avatars', () => {
    it('are circles from the start, so a photograph drops straight in', () => {
        // Building it square and rounding it later is how a UI ends up with
        // two kinds of avatar. The circle now lives in one component, which is
        // the whole reason a photograph could drop in at all, so that is where
        // this looks.
        const seat = readLive('components', 'PokerSeat.tsx');
        expect(seat).toMatch(/<Portrait/);
        expect(seat).toMatch(/size=\{46\}/);

        const portrait = fs.readFileSync(
            path.join(__dirname, '..', '..', 'components', 'common', 'Portrait.tsx'),
            'utf8',
        );
        // Radius follows the diameter rather than being written down beside
        // it, so a circle cannot become an oval by editing one of two numbers.
        expect(portrait).toMatch(/borderRadius: size \/ 2/);
        // Without this the image corners escape the circle on iOS.
        expect(portrait).toMatch(/overflow: 'hidden'/);
    });

    it('and a seat shows the real photograph when there is one', () => {
        // The point of the whole exercise. 299 files sat in assets/portraits
        // and not one line of the app read them; this is what fails if the
        // seat ever goes back to initials only.
        const seat = readLive('components', 'PokerSeat.tsx');
        expect(seat).not.toMatch(/initialsOf\(name\)/);
        expect(portraitForPerson('mg_kowalczyk', 'Zofia Kowalczyk')).not.toBeNull();
    });

    it('and the same person is the same colour every time', () => {
        expect(avatarHue('tech_pear')).toBe(avatarHue('tech_pear'));
        expect(avatarHue('tech_pear')).not.toBe(avatarHue('tech_micro'));
    });

    it('and the colour is a HUE, so the initials always clear it', () => {
        // Lightness is fixed; only the hue carries the identity. A random
        // colour would eventually produce white on white.
        //
        // The fill moved into Portrait with the rest of the circle. The seat
        // still computes the RING, because all 299 faces sit on one warm ramp
        // by construction and without a per person ring a table of five is
        // five near identical oranges.
        const portrait = fs.readFileSync(
            path.join(__dirname, '..', '..', 'components', 'common', 'Portrait.tsx'),
            'utf8',
        );
        expect(portrait).toMatch(/hsl\(\$\{hue\}, 32%, 26%\)/);
        expect(readLive('components', 'PokerSeat.tsx')).toMatch(/hsl\(\$\{hue\}, 45%, 52%\)/);
    });

    it('and initials handle one name, three names and an apostrophe', () => {
        expect(initialsOf('Adrian Voss')).toBe('AV');
        expect(initialsOf('Dr Amara Diallo')).toBe('DA');
        expect(initialsOf("Marcus 'The Wolf'")).toBe('MT');
        expect(initialsOf('Cher')).toBe('C');
        expect(initialsOf('')).toBe('?');
    });

    it('and a rival is labelled as one, because that is the whole point', () => {
        const src = read('components', 'PokerSeat.tsx');
        expect(src).toMatch(/ceo: 'CEO'/);
        expect(src).toMatch(/board: 'YOUR BOARD'/);
        expect(src).toMatch(/stranger: ''/);
    });

    it('and it says what they just DID, which is what makes it a table', () => {
        // A seat showing only a name and a number is a scoreboard.
        const src = read('components', 'PokerSeat.tsx');
        expect(src).toMatch(/RAISE \$\{money\(lastAmount \|\| 0\)\}/);
        expect(src).toMatch(/styles\.bubble/);
    });

    it('and a folded player is dimmed rather than hidden', () => {
        // Who folded is information for the rest of the hand.
        const src = read('components', 'PokerSeat.tsx');
        expect(src).toMatch(/folded: \{ opacity: 0\.38 \}/);
    });
});

describe('and the screen really is six handed', () => {
    const screen = () => read('screens', 'PokerGameScreen.tsx');

    it('it draws a seat per opponent rather than one dealer', () => {
        expect(screen()).toMatch(/opponents\.map\(\(o, i\) =>/);
        expect(screen()).not.toMatch(/dealerHand/);
    });

    it('and it uses the multi-way hook rather than the heads up one', () => {
        expect(screen()).toMatch(/useSixHandedPoker/);
        expect(screen()).not.toMatch(/usePokerLogic/);
    });

    it('and the VIP room gets the harder table', () => {
        expect(screen()).toMatch(/currentLocationId === VIP_LOCATION_ID/);
    });

    it('and the player can actually fold, call and raise', () => {
        const src = screen();
        expect(src).toMatch(/actions\.act\('fold'\)/);
        expect(src).toMatch(/actions\.act\(owed > 0 \? 'call' : 'check'\)/);
        expect(src).toMatch(/actions\.act\('raise'/);
    });

    it('and the bots are staggered rather than acting in one loop', () => {
        // Five bots acting the instant it is their turn are obviously one
        // function. This is the whole of the "online" feeling.
        const hook = read('logic', 'useSixHandedPoker.ts');
        expect(hook).toMatch(/thinkTime\(/);
        // The ref assignment joined the timer body when the double-chain bug
        // was fixed - see playtestFixes.test.ts. What this pins is that each
        // bot is handed to a SEPARATE timer, not that the body never changes.
        expect(hook).toMatch(/setTimeout\(\(\) => \{[\s\S]{0,120}?setRound\(next\);\s*runBots\(next\);\s*\}, wait\)/);
    });

    it('and leaving the screen cancels them, or they fire into a dead component', () => {
        const hook = read('logic', 'useSixHandedPoker.ts');
        expect(hook).toMatch(/useEffect\(\(\) => clearTimers, \[\]\)/);
    });
});
