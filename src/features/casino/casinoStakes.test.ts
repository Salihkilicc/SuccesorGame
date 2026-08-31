// src/features/casino/casinoStakes.test.ts
//
// ============================================================================
//  FIVE ROOMS, A CLIMB YOU CAN FINISH, AND A TABLE THAT KNOWS HOW RICH YOU ARE
// ============================================================================
//
//  Asked for as "cut the reputation between casinos, it is absurdly hard to
//  make progress; the money amounts are always the same, bring a percentage
//  system, rising, and in the last casino let us bet five per cent of our
//  money; make it dynamic; and take the casino down to five. Treat this as
//  preparation, we are going to rework the whole thing."
//
//  THE CLIMB. Seven rooms ending at 2100, earned at fifty a quarter, was
//  forty two quarters of maximum effort - ten and a half years of turning up,
//  in a run of about two hundred quarters. Measured against the new ladder:
//
//      Athens         0     the door
//      Istanbul      60     +60   1.2 quarters
//      Las Vegas    180    +120   2.4
//      Monte Carlo  360    +180   3.6
//      Macau        600    +240   4.8      twelve quarters in all
//
//  Three years to the summit instead of ten and a half, and the widening
//  shape survives: every gate still costs more than the one before it.
//
//  THE STAKES. A fixed ceiling can only ever be right for one bankroll, and
//  the whole point of the ladder is that the player changes. So each room
//  takes a share, rising to the five per cent that was asked for by name:
//
//      bankroll        Athens 0.5%   Istanbul 1%   Vegas 2%   Monaco 3.5%   Macau 5%
//      $500K              $50K         $250K        $1.0M       $5.0M       $10.0M
//      $500M              $2.5M        $5.0M       $10.0M      $17.5M       $25.0M
//      $2T                $10B         $20B         $40B         $70B        $100B
//
//  The first row is the FLOOR rather than the share, which is the other half
//  of the design: a percentage of nothing is nothing, and a table that cannot
//  be played at all is worse than one priced for the wrong decade.
//
//  AND ROUNDING THE CEILING WAS A BUG, found by measuring rather than by
//  reasoning. Snapped to 1/2/5, Las Vegas at 2% and Monte Carlo at 3.5% both
//  landed on ten million at a five hundred million bankroll, so an entire
//  room's step up vanished. The ceiling is exact now and only the chips round.
// ============================================================================

import {
    CASINO_LADDER_TOP,
    CASINO_LOCATIONS,
    MAX_REP_PER_QUARTER,
    REPUTATION_CEILING,
} from './data/casinoData';
import { CHIP_FRACTIONS, TOP_ROOM_BET_SHARE, chipsFor, maxBetFor, niceChip } from './data/casinoStakes';

const BANKROLLS = [0, 1, 250_000, 10_000_000, 500_000_000, 50_000_000_000, 2_000_000_000_000];
const last = CASINO_LOCATIONS[CASINO_LOCATIONS.length - 1];

describe('the ladder is five rooms and it can be finished', () => {
    it('five rooms', () => {
        expect(CASINO_LOCATIONS).toHaveLength(5);
        expect(CASINO_LOCATIONS.map(l => l.id))
            .toEqual(['athens', 'istanbul', 'las_vegas', 'monte_carlo', 'macau']);
    });

    it('and the first one is free, or there is no way in', () => {
        expect(CASINO_LOCATIONS[0].requirement).toBe(0);
    });

    it('and the whole climb is about three years of turning up, not ten', () => {
        // THE COMPLAINT, as a number. 2100 at fifty a quarter was 42 quarters.
        const quarters = CASINO_LADDER_TOP / MAX_REP_PER_QUARTER;
        expect(quarters).toBeCloseTo(12, 6);
        expect(quarters).toBeLessThan(20);
    });

    it('and each gate still costs more than the one before it', () => {
        // The reason the rungs were never even: reputation per bet is capped,
        // so an even ladder is cleared faster the higher you climb.
        const gaps = CASINO_LOCATIONS.slice(1).map((l, i) => l.requirement - CASINO_LOCATIONS[i].requirement);
        expect(gaps).toEqual([60, 120, 180, 240]);
        for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
    });

    it('and the top of the bar is the last room, not a round number', () => {
        expect(CASINO_LADDER_TOP).toBe(last.requirement);
    });

    it('and the ceiling is above the ladder, or the last room is unreachable', () => {
        // This exact mistake has been made once already: the clamp stayed at
        // 1000 while the ladder went to 2100.
        expect(REPUTATION_CEILING).toBeGreaterThan(CASINO_LADDER_TOP);
    });
});

describe('the table knows how rich you are', () => {
    it('the last room takes five per cent of everything, which is what was asked for', () => {
        expect(last.maxBetPercent).toBe(TOP_ROOM_BET_SHARE);
        expect(TOP_ROOM_BET_SHARE).toBe(0.05);
        expect(maxBetFor(last, 1_000_000_000_000)).toBe(50_000_000_000);
    });

    it('and the share rises every room', () => {
        for (let i = 1; i < CASINO_LOCATIONS.length; i++) {
            expect(CASINO_LOCATIONS[i].maxBetPercent)
                .toBeGreaterThan(CASINO_LOCATIONS[i - 1].maxBetPercent);
        }
    });

    it('and the ceiling really does rise room by room, at every fortune', () => {
        // THE ROUNDING BUG. Snapped to 1/2/5, Vegas at 2% and Monte Carlo at
        // 3.5% collided at half a billion and the room's step up disappeared.
        for (const money of BANKROLLS) {
            const maxes = CASINO_LOCATIONS.map(l => maxBetFor(l, money));
            for (let i = 1; i < maxes.length; i++) {
                expect(`${money}:${maxes[i]}>${maxes[i - 1]}`)
                    .toBe(`${money}:${maxes[i]}>${maxes[i - 1]}`);
                expect(maxes[i]).toBeGreaterThan(maxes[i - 1]);
            }
        }
    });

    it('and it really is the share once you are past the floor', () => {
        for (const l of CASINO_LOCATIONS) {
            const rich = 1_000_000_000_000;
            expect(maxBetFor(l, rich)).toBe(Math.floor(rich * l.maxBetPercent));
        }
    });
});

describe('and a broke player can still sit down', () => {
    it('which a percentage on its own cannot manage', () => {
        // A percentage of nothing is nothing: no ceiling, four worthless
        // chips, and a table that cannot be played at all.
        for (const l of CASINO_LOCATIONS) {
            expect(maxBetFor(l, 0)).toBe(l.minMaxBet);
            expect(maxBetFor(l, 0)).toBeGreaterThan(0);
        }
    });

    it('and the floor rises with the room as well', () => {
        for (let i = 1; i < CASINO_LOCATIONS.length; i++) {
            expect(CASINO_LOCATIONS[i].minMaxBet)
                .toBeGreaterThan(CASINO_LOCATIONS[i - 1].minMaxBet);
        }
    });

    it('and rubbish in does not produce rubbish out', () => {
        for (const l of CASINO_LOCATIONS) {
            expect(maxBetFor(l, NaN)).toBe(l.minMaxBet);
            expect(maxBetFor(l, -5_000)).toBe(l.minMaxBet);
            expect(Number.isFinite(maxBetFor(l, Infinity))).toBe(true);
        }
    });
});

describe('the chips on the rail', () => {
    it('are four, ascending, and never repeat a denomination', () => {
        // Rounding can land two fractions on the same number at small
        // ceilings, and a rail with the same chip twice looks broken.
        for (const money of BANKROLLS) {
            for (const l of CASINO_LOCATIONS) {
                const c = chipsFor(l, money);
                expect(c).toHaveLength(CHIP_FRACTIONS.length);
                for (let i = 1; i < c.length; i++) {
                    expect(`${l.id}@${money}:${JSON.stringify(c)}`).toBeTruthy();
                    expect(c[i]).toBeGreaterThan(c[i - 1]);
                }
            }
        }
    });

    it('and the biggest one IS the ceiling, so the rail cannot lie about the limit', () => {
        for (const money of BANKROLLS) {
            for (const l of CASINO_LOCATIONS) {
                const c = chipsFor(l, money);
                expect(c[c.length - 1]).toBe(maxBetFor(l, money));
            }
        }
    });

    it('and none of them is worth more than the ceiling', () => {
        for (const money of BANKROLLS) {
            for (const l of CASINO_LOCATIONS) {
                for (const c of chipsFor(l, money)) {
                    expect(c).toBeLessThanOrEqual(maxBetFor(l, money));
                }
            }
        }
    });

    it('and they are numbers a casino would actually print', () => {
        // 1, 2 or 5 followed by zeros, which is what every chip everywhere is
        // denominated in. Only the top one is exempt: it is the ceiling.
        for (const money of [10_000_000, 500_000_000, 2_000_000_000_000]) {
            for (const l of CASINO_LOCATIONS) {
                for (const c of chipsFor(l, money).slice(0, -1)) {
                    const lead = c / Math.pow(10, Math.floor(Math.log10(c)));
                    expect(`${c}:${lead}`).toMatch(/:(1|2|5)$/);
                }
            }
        }
    });

    it('and niceChip does what it says on small numbers too', () => {
        expect(niceChip(3_481_927)).toBe(2_000_000);
        expect(niceChip(7_000)).toBe(5_000);
        expect(niceChip(1_400)).toBe(1_000);
        expect(niceChip(0)).toBe(0);
        expect(niceChip(-9)).toBe(0);
        expect(niceChip(NaN)).toBe(0);
    });
});

describe('the two rooms that came out are shelved, not deleted', () => {
    const src = require('fs').readFileSync(__dirname + '/data/casinoData.ts', 'utf8');

    it('London and Singapore are still in the file, commented', () => {
        // The standing rule, and the reason is in the request: "we are going
        // to rework the whole casino anyway, treat this as preparation".
        expect(src).toMatch(/\/\/ id: 'london',/);
        expect(src).toMatch(/\/\/ id: 'singapore',/);
    });

    it('and their ids still type check, so an old save naming one does not crash', () => {
        expect(src).toMatch(/\| 'london'/);
        expect(src).toMatch(/\| 'singapore'/);
    });

    it('and nothing reads the list by length or by index', () => {
        // Bringing one back should be uncommenting it and nothing else.
        expect(src).not.toMatch(/CASINO_LOCATIONS\[\d\]/);
    });
});
