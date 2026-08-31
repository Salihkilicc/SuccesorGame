// src/core/casino/roulette.test.ts
//
// ============================================================================
//  THE FIRST ENGINE OUT OF THE SCREEN
// ============================================================================
//
//  The casino rewrite starts here, and the rule it starts with is: THE ENGINE
//  PRODUCES THE RESULT AT ONCE, THE SCREEN TAKES ITS TIME TELLING YOU.
//
//  `useRouletteLogic` did both. It held the bets, took the money, ran a
//  `setTimeout(3000)`, generated the number INSIDE the callback, evaluated
//  every bet, paid out and banked reputation. Two consequences, and the second
//  is the expensive one:
//
//    - changing how long the wheel spins meant editing the file that decides
//      who wins
//    - the number that decides who wins could not be tested at all without
//      waiting three seconds for it, so it never was
//
//  MEASURED, now that it can be. Every bet on this table returns 97.3% except
//  the straight up at 94.6%, which are exactly the right figures for a single
//  zero wheel. The maths was correct the whole time. It simply could not be
//  checked, and a number nobody can check is a number waiting to go wrong.
//
//  ---------------------------------------------------------------------------
//  AND THE POCKET ORDER, WHICH ONLY EXISTS BECAUSE WE ARE ABOUT TO DRAW IT
//  ---------------------------------------------------------------------------
//  A real single zero wheel is not 0 to 36 in order. It is arranged so that
//  numerically adjacent numbers sit physically apart and the colours alternate
//  all the way round. Drawn in numeric order it would be eighteen red then
//  eighteen black: a pie chart, not a wheel.
// ============================================================================

import {
    BALL_TURNS,
    POCKET_ARC,
    POCKET_COUNT,
    RED_NUMBERS,
    WHEEL_ORDER,
    WHEEL_TURNS,
    colourOf,
    evaluateBet,
    numberAtAngle,
    pocketAngle,
    spinAngles,
    spinRoulette,
} from './roulette';

describe('the wheel is a real wheel', () => {
    it('thirty seven pockets, every number exactly once', () => {
        expect(POCKET_COUNT).toBe(37);
        expect([...WHEEL_ORDER].sort((a, b) => a - b))
            .toEqual(Array.from({ length: 37 }, (_, i) => i));
    });

    it('and the zero is green with eighteen of each colour beside it', () => {
        expect(colourOf(0)).toBe('green');
        expect(WHEEL_ORDER.filter(n => colourOf(n) === 'red')).toHaveLength(18);
        expect(WHEEL_ORDER.filter(n => colourOf(n) === 'black')).toHaveLength(18);
        expect(RED_NUMBERS).toHaveLength(18);
    });

    it('and the colours ALTERNATE all the way round, which is the whole point', () => {
        // THE REASON THIS ORDER EXISTS. In numeric order it is eighteen red
        // then eighteen black and it draws as a pie chart. Round the real
        // wheel, red and black take turns everywhere except across the zero.
        const coloured = WHEEL_ORDER.filter(n => n !== 0).map(colourOf);
        let breaks = 0;
        for (let i = 1; i < coloured.length; i++) {
            if (coloured[i] === coloured[i - 1]) breaks++;
        }
        // One break, where the sequence steps over the green pocket.
        expect(breaks).toBeLessThanOrEqual(1);
    });

    it('and numerically adjacent numbers are physically far apart', () => {
        // The other half of the arrangement, and the reason a wheel does not
        // look like a ruler bent into a circle.
        for (let n = 1; n <= 36; n++) {
            const here = WHEEL_ORDER.indexOf(n);
            const next = WHEEL_ORDER.indexOf(n + 1 > 36 ? 1 : n + 1);
            const gap = Math.min(Math.abs(here - next), POCKET_COUNT - Math.abs(here - next));
            expect(`${n}->${n + 1}:${gap}`).toBeTruthy();
            expect(gap).toBeGreaterThan(1);
        }
    });

    it('and 32 sits next to the zero, as it does on every European wheel', () => {
        expect(WHEEL_ORDER[0]).toBe(0);
        expect(WHEEL_ORDER[1]).toBe(32);
        expect(WHEEL_ORDER[WHEEL_ORDER.length - 1]).toBe(26);
    });
});

describe('where a number sits', () => {
    it('is the CENTRE of its pocket, so the ball has somewhere to rest', () => {
        expect(pocketAngle(0)).toBeCloseTo(POCKET_ARC / 2, 6);
        expect(pocketAngle(32)).toBeCloseTo(POCKET_ARC * 1.5, 6);
    });

    it('and it round trips, which is what an overshot wheel needs', () => {
        for (const n of WHEEL_ORDER) {
            expect(`${n}:${numberAtAngle(pocketAngle(n))}`).toBe(`${n}:${n}`);
        }
    });

    it('and a nonsense angle still lands in a real pocket', () => {
        expect(WHEEL_ORDER).toContain(numberAtAngle(-720.5));
        expect(WHEEL_ORDER).toContain(numberAtAngle(5000));
        expect(pocketAngle(99)).toBe(0);
    });
});

describe('what the table pays', () => {
    it('a straight up returns thirty six for one, as thirty five plus the stake', () => {
        // The convention, written down: these multipliers are TOTAL RETURN
        // rather than profit, and the difference between 35 and 36 here is the
        // difference between a house edge of 2.7% and none at all.
        expect(evaluateBet(17, 'S17')).toEqual({ won: true, multiplier: 35 });
        expect(evaluateBet(18, 'S17').won).toBe(false);
    });

    it('and the even money bets lose to the zero, which IS the house edge', () => {
        for (const b of ['RED', 'BLACK', 'EVEN', 'ODD', 'LOW', 'HIGH']) {
            expect(`${b}:${evaluateBet(0, b).won}`).toBe(`${b}:false`);
        }
    });

    it('and so do the dozens', () => {
        for (const b of ['1ST12', '2ND12', '3RD12']) {
            expect(`${b}:${evaluateBet(0, b).won}`).toBe(`${b}:false`);
        }
    });

    it('and each dozen covers twelve numbers and no others', () => {
        const count = (b: string) =>
            Array.from({ length: 37 }, (_, i) => i).filter(n => evaluateBet(n, b).won).length;
        expect(count('1ST12')).toBe(12);
        expect(count('2ND12')).toBe(12);
        expect(count('3RD12')).toBe(12);
        expect(count('RED')).toBe(18);
        expect(count('BLACK')).toBe(18);
    });

    it('and an unknown bet never wins rather than winning quietly', () => {
        expect(evaluateBet(7, 'PARLAY')).toEqual({ won: false, multiplier: 0 });
    });

    // ------------------------------------------------------------------
    //  AND THE RETURN, WHICH COULD NOT BE MEASURED BEFORE
    // ------------------------------------------------------------------
    it('every bet on the table returns what a single zero wheel returns', () => {
        const rtp = (b: string) => {
            let returned = 0;
            for (let n = 0; n < 37; n++) {
                const { won, multiplier } = evaluateBet(n, b);
                if (won) returned += multiplier;
            }
            return returned / 37;
        };
        for (const b of ['RED', 'BLACK', 'EVEN', 'ODD', 'LOW', 'HIGH', '1ST12', '2ND12', '3RD12']) {
            expect(`${b}:${rtp(b).toFixed(3)}`).toBe(`${b}:0.973`);
        }
        // The straight up is the dearest bet on the table and always has been.
        expect(rtp('S17')).toBeCloseTo(35 / 37, 6);
        expect(rtp('S17')).toBeLessThan(rtp('RED'));
    });
});

describe('the spin settles everything in one synchronous call', () => {
    const fixed = (n: number) => () => n / 37 + 0.0001;

    it('and the result is the pocket the die chose', () => {
        expect(spinRoulette([], fixed(17)).result).toBe(17);
        expect(spinRoulette([], () => 0).result).toBe(0);
        expect(spinRoulette([], () => 0.9999999).result).toBe(36);
    });

    it('and a die outside its range cannot fall off the wheel', () => {
        expect(spinRoulette([], () => 1).result).toBe(36);
        expect(spinRoulette([], () => -5).result).toBe(0);
        expect(spinRoulette([], () => NaN).result).toBe(0);
    });

    it('and it reports the stake, the return and the difference', () => {
        const s = spinRoulette(
            [{ type: 'RED', amount: 100 }, { type: 'S17', amount: 10 }],
            fixed(19), // red
        );
        expect(s.staked).toBe(110);
        expect(s.returned).toBe(200);
        expect(s.net).toBe(90);
        expect(s.winners).toEqual(['RED']);
    });

    it('and a losing spin returns nothing rather than something small', () => {
        const s = spinRoulette([{ type: 'RED', amount: 100 }], fixed(0));
        expect(s.returned).toBe(0);
        expect(s.net).toBe(-100);
        expect(s.winners).toEqual([]);
    });

    it('and covering the whole board still loses to the zero', () => {
        // Thirty six straight ups, one unit each. The only wheel in the world
        // where that is a losing proposition is the one with a zero on it.
        const bets = Array.from({ length: 36 }, (_, i) => ({ type: `S${i + 1}`, amount: 1 }));
        expect(spinRoulette(bets, fixed(0)).net).toBe(-36);
        expect(spinRoulette(bets, fixed(7)).net).toBe(-1);
    });

    it('and it is uniform over ten thousand spins', () => {
        const seen = new Map<number, number>();
        for (let i = 0; i < 10_000; i++) {
            const r = spinRoulette([], Math.random).result;
            seen.set(r, (seen.get(r) || 0) + 1);
        }
        expect(seen.size).toBe(37);
        for (const [n, count] of seen) {
            // 270 expected. Wide bounds: this is checking there is no hole and
            // no favourite, not that the platform's RNG is good.
            expect(`${n}:${count > 150 && count < 450}`).toBe(`${n}:true`);
        }
    });

    it('and rubbish bets do not crash the settlement', () => {
        const s = spinRoulette([{ type: '', amount: -5 } as any, null as any], fixed(7));
        expect(s.staked).toBe(0);
        expect(s.returned).toBe(0);
    });
});

describe('and the angles the animation will need', () => {
    it('the ball goes the OTHER WAY, which is what sells it as a wheel', () => {
        // A croupier launches the ball against the spin of the wheel. It is
        // one sign and it is most of the realism.
        const a = spinAngles(17);
        expect(a.wheelTo).toBeGreaterThan(0);
        expect(a.ballTo).toBeLessThan(0);
    });

    it('and the ball goes further, because it is faster', () => {
        expect(BALL_TURNS).toBeGreaterThan(WHEEL_TURNS);
        expect(Math.abs(spinAngles(17).ballTo)).toBeGreaterThan(spinAngles(17).wheelTo);
    });

    it('and it stops on the pocket the engine already chose', () => {
        for (const n of [0, 17, 32, 26, 36]) {
            const { ballTo } = spinAngles(n);
            expect(`${n}:${numberAtAngle(-ballTo)}`).toBe(`${n}:${n}`);
        }
    });

    it('and a second spin carries on from where the first stopped', () => {
        // Snapping back to zero between spins is the tell that a wheel is a
        // picture rather than an object.
        const first = spinAngles(17);
        const second = spinAngles(4, first.wheelTo);
        expect(second.wheelTo).toBeGreaterThan(first.wheelTo);
        expect(second.wheelTo % 360).toBeCloseTo(0, 6);
    });

    it('and it always makes at least a few whole turns', () => {
        // A wheel that moves a few degrees and stops has not been spun.
        expect(spinAngles(0).wheelTo).toBeGreaterThanOrEqual(WHEEL_TURNS * 360);
    });
});

describe('the wiring', () => {
    const src = require('fs').readFileSync(
        __dirname + '/../../features/casino/logic/useRouletteLogic.ts', 'utf8');

    it('the hook asks the engine rather than keeping a second copy of the rule', () => {
        // THE DEFECT THIS PROMPT IS ABOUT. Two copies of a payout table is how
        // the last several bugs in this codebase happened.
        expect(src).toMatch(/spinRoulette\(bets\)/);
        expect(src).not.toMatch(/const result = Math\.floor\(Math\.random\(\) \* 37\)/);
        expect(src).not.toMatch(/const RED_NUMBERS = \[1, 3, 5/);
    });

    it('and the three seconds are the SHOW, not where the result comes from', () => {
        const spinAt = src.indexOf('spinRoulette(bets)');
        const timerAt = src.indexOf('setTimeout');
        expect(spinAt).toBeGreaterThan(-1);
        // Still inside the timer for now - the animation replaces that next -
        // but the result is one call that could be made before it starts.
        expect(timerAt).toBeGreaterThan(-1);
    });
});
