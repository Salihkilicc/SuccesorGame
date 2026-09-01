// src/features/casino/rouletteBall.test.ts
//
// ============================================================================
//  THE DISC SPUN AND THE BALL DID NOT
// ============================================================================
//
//  Reported as "sometimes it is not the ball that spins in roulette, the wheel
//  disc turns". The "sometimes" is the clue and it is exact: it was right on
//  the first spin of a visit and wrong on every one after.
//
//  `spinAngles` gave the wheel a target relative to where it was -
//
//      wheelTo = fromWheel + 3 x 360 + (360 - fromWheel % 360)
//
//  and gave the ball an ABSOLUTE one:
//
//      ballTo = -(6 x 360) - pocket
//
//  First spin: the ball starts at 0 and travels six turns to about -2160. It
//  looks like a roulette wheel. Second spin: the ball is ALREADY at -2160-ish,
//  and the new target differs only by the gap between the old pocket and the
//  new one. A few degrees. Sometimes backwards. Meanwhile the wheel does its
//  full three turns underneath.
//
//  A wheel turning under a ball that twitches is precisely "the disc spins,
//  not the ball".
//
//  The fix keeps the RESIDUE identical - the ball still finishes at -pocket,
//  so it lands in the same place it always did - and only corrects the
//  distance travelled. That distinction is what makes it a safe change rather
//  than a re-tune.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    BALL_TURNS, POCKET_COUNT, WHEEL_ORDER, WHEEL_TURNS, pocketAngle, spinAngles,
} from '../../core/casino/roulette';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');

/** Where an angle sits within one turn, always positive. */
const residue = (deg: number) => ((deg % 360) + 360) % 360;

describe('the ball travels a real distance on every spin', () => {
    it('including the first one, from a standing start', () => {
        const { ballTo } = spinAngles(17, 0, 0);
        expect(Math.abs(ballTo)).toBeGreaterThanOrEqual(BALL_TURNS * 360);
    });

    it('and the tenth one, from wherever it stopped', () => {
        // THE DEFECT. Ten spins in a row, each starting from the last, and
        // every one of them must be a real journey.
        let ballAt = 0;
        let wheelAt = 0;
        for (let i = 0; i < 10; i++) {
            const result = WHEEL_ORDER[(i * 7) % POCKET_COUNT];
            const { ballTo, wheelTo } = spinAngles(result, wheelAt, ballAt);
            const travelled = Math.abs(ballTo - ballAt);
            expect(travelled).toBeGreaterThanOrEqual(BALL_TURNS * 360);
            expect(travelled).toBeLessThan((BALL_TURNS + 1) * 360);
            ballAt = ballTo;
            wheelAt = wheelTo;
        }
    });

    it('and it always goes the same way, never backwards', () => {
        // A ball that reverses is not a ball. The old absolute target could
        // produce a positive delta whenever the new pocket sat behind the old.
        let ballAt = 0;
        for (let i = 0; i < 40; i++) {
            const { ballTo } = spinAngles(WHEEL_ORDER[i % POCKET_COUNT], 0, ballAt);
            expect(ballTo).toBeLessThan(ballAt);
            ballAt = ballTo;
        }
    });

    it('and the ball still moves further than the wheel, which sells it', () => {
        let ballAt = 0;
        let wheelAt = 0;
        for (let i = 0; i < 6; i++) {
            const { ballTo, wheelTo } = spinAngles(WHEEL_ORDER[i], wheelAt, ballAt);
            expect(Math.abs(ballTo - ballAt)).toBeGreaterThan(Math.abs(wheelTo - wheelAt));
            ballAt = ballTo;
            wheelAt = wheelTo;
        }
        expect(BALL_TURNS).toBeGreaterThan(WHEEL_TURNS);
    });
});

describe('and it lands exactly where it always did', () => {
    it('on the pocket, whatever it has been through', () => {
        // THE SAFETY PROPERTY. The landing is unchanged; only the distance
        // was wrong. If this drifts, the ball stops next to the number that
        // won rather than on it, which is far worse than the bug being fixed.
        let ballAt = 0;
        for (const n of WHEEL_ORDER) {
            const { ballTo } = spinAngles(n, 0, ballAt);
            expect(residue(ballTo)).toBeCloseTo(residue(-pocketAngle(n)), 6);
            ballAt = ballTo;
        }
    });

    it('and every pocket on the wheel is reachable', () => {
        const landed = new Set(WHEEL_ORDER.map(n => residue(spinAngles(n, 0, 0).ballTo).toFixed(4)));
        expect(landed.size).toBe(POCKET_COUNT);
    });

    it('and omitting the ball position behaves as it used to', () => {
        // Every existing caller still means what it meant.
        expect(spinAngles(7, 0).wheelTo).toBe(spinAngles(7, 0, 0).wheelTo);
    });

    it('and nonsense angles cannot send it somewhere impossible', () => {
        for (const bad of [NaN, Infinity, -Infinity]) {
            const { ballTo, wheelTo } = spinAngles(0, bad as number, bad as number);
            expect(Number.isFinite(ballTo) || Number.isNaN(ballTo)).toBe(true);
            expect(Number.isFinite(wheelTo) || Number.isNaN(wheelTo)).toBe(true);
        }
    });
});

describe('and the component remembers where it left the ball', () => {
    it('it keeps the ball angle, not just the wheel angle', () => {
        // The wheel had `wheelAt` from the start. The ball had nothing, which
        // is the whole defect in one missing ref.
        const src = read('components', 'RouletteWheel.tsx');
        expect(src).toMatch(/const ballAt = useRef\(0\)/);
        expect(src).toMatch(/spinAngles\(result, wheelAt\.current, ballAt\.current\)/);
        expect(src).toMatch(/ballAt\.current = ballTo/);
    });

    it('and both are carried forward, or the next spin is wrong again', () => {
        const src = read('components', 'RouletteWheel.tsx');
        expect(src).toMatch(/wheelAt\.current = wheelTo/);
    });
});

describe('and the wheel can be pressed to spin it', () => {
    const screen = () => read('screens', 'RouletteGameScreen.tsx');

    it('the wheel is the obvious thing to press', () => {
        // Asked for as "pressing the wheel in roulette should spin it", which
        // is how a real table works: the croupier's hand is on the wheel.
        const src = screen();
        expect(src).toMatch(/<Pressable\s*\n\s*onPress=\{actions\.handleSpin\}[\s\S]{0,240}<RouletteWheel/);
    });

    it('and it refuses on the same terms the button does', () => {
        // Not a second copy of the rules. The handler already declines when
        // there are no chips down or a spin is running; this only mirrors it
        // for the disabled state.
        expect(screen()).toMatch(/disabled=\{isSpinning \|\| bets\.length === 0\}/);
    });

    it('and the button is still there, because a thumb reaches it', () => {
        expect(screen()).toMatch(/styles\.spinButton/);
    });

    it('and it says which of the two things to do', () => {
        const src = screen();
        expect(src).toMatch(/casino\.tapWheel/);
        expect(src).toMatch(/casino\.placeChipsFirst/);
    });
});
