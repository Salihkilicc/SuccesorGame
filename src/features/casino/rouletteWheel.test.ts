// src/features/casino/rouletteWheel.test.ts
//
// ============================================================================
//  IT WAS A FERRIS WHEEL EMOJI
// ============================================================================
//
//  Reported as "roulette needs animation, spin the ball around the wheel". The
//  whole of what was there:
//
//      <Animated.View style={{ rotate }}><Text>🎡</Text></Animated.View>
//
//  A fairground emoji turning once every eight hundred milliseconds, at a
//  perfectly constant speed, for three seconds, with NO RELATIONSHIP to the
//  number that came out at the end. The wait felt like nothing was happening
//  because nothing was: the loop was decorative and the result appeared after
//  it, from a `setTimeout` callback that had not run yet when the animation
//  started.
//
//  The wheel is real now, and the thing that makes it real is the order the
//  work happens in: THE NUMBER IS CHOSEN BEFORE ANYTHING TURNS, and the
//  animation's only job is to arrive at it.
//
//  This file cannot render a component - there is no renderer in this project
//  - so it checks the two things that would actually break: that the number is
//  decided before the show rather than during it, and that the wheel is built
//  out of the engine rather than out of a second copy of the wheel.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { POCKET_ARC, WHEEL_ORDER, numberAtAngle, spinAngles } from '../../core/casino/roulette';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const wheel = () => read('components', 'RouletteWheel.tsx');
const hook = () => read('logic', 'useRouletteLogic.ts');
const screen = () => read('screens', 'RouletteGameScreen.tsx');

describe('the emoji is gone', () => {
    it('there is no ferris wheel anywhere in the roulette screen', () => {
        expect(screen()).not.toContain('🎡');
        expect(screen()).not.toMatch(/styles\.wheelEmoji/);
    });

    it('and the screen draws the real wheel instead', () => {
        expect(screen()).toMatch(/<RouletteWheel/);
        expect(screen()).toMatch(/import RouletteWheel from '\.\.\/components\/RouletteWheel'/);
    });
});

describe('the number is chosen before anything turns', () => {
    it('the hook settles the spin OUTSIDE the timer', () => {
        // THE DESIGN. If the result is produced inside the callback, the
        // animation has nothing to aim at and can only be decorative - which
        // is exactly what the emoji was.
        const src = hook();
        const settleAt = src.indexOf('const settlement = spinRoulette(bets);');
        const timerAt = src.indexOf('setTimeout(() => {', src.indexOf('handleSpin'));
        expect(settleAt).toBeGreaterThan(-1);
        expect(timerAt).toBeGreaterThan(-1);
        expect(settleAt).toBeLessThan(timerAt);
    });

    it('and hands the wheel the number it is aiming at', () => {
        expect(hook()).toMatch(/setPendingResult\(settlement\.result\)/);
        expect(hook()).toMatch(/pendingResult,/);
        expect(screen()).toMatch(/result=\{pendingResult \?\? spinResult\}/);
    });

    it('and clears it once the player has been shown the number', () => {
        // Otherwise the wheel keeps aiming at last spin's pocket forever.
        expect(hook()).toMatch(/setPendingResult\(null\)/);
    });
});

describe('the wheel is built out of the engine', () => {
    it('the pockets come from WHEEL_ORDER rather than from a loop over 0 to 36', () => {
        // A second copy of the wheel is how the pocket order and the payout
        // table drift apart, and this codebase has already paid for that
        // mistake with the brand scale and the buyout price.
        const src = wheel();
        expect(src).toMatch(/WHEEL_ORDER\.map/);
        expect(src).not.toMatch(/Array\.from\(\{ length: 37 \}/);
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/casino\/roulette'/);
    });

    it('and the felt colours come from the engine, shared with the betting table', () => {
        // The table and the wheel had two different reds - #B91C1C and
        // #C0392B - which is a player being shown two colours and told they
        // are the same fact. One set now, next to the colour rule itself.
        expect(wheel()).toMatch(/fill=\{feltColour\(n\)\}/);
        expect(wheel()).toMatch(/stroke=\{FELT\.rim\}/);
        expect(read('components', 'RouletteTable.tsx')).toMatch(/NUMBER_COLORS\[i\] = feltColour\(i\)/);
        // And neither of them keeps a hex of its own for a pocket.
        expect(wheel()).not.toMatch(/#C0392B/);
        expect(read('components', 'RouletteTable.tsx')).not.toMatch(/#B91C1C/);
    });

    it('and the arc is the engine constant, not 360 divided by a literal', () => {
        expect(wheel()).toMatch(/POCKET_ARC/);
        expect(POCKET_ARC).toBeCloseTo(360 / 37, 9);
    });

    it('and the target angles come from spinAngles', () => {
        expect(wheel()).toMatch(/spinAngles\(result, wheelAt\.current\)/);
    });
});

describe('and the four things that make a wheel read as a wheel', () => {
    it('one: the ball goes the other way', () => {
        // A croupier launches it against the spin. One sign, most of the
        // realism, and the engine is what decides it.
        const { wheelTo, ballTo } = spinAngles(17);
        expect(wheelTo).toBeGreaterThan(0);
        expect(ballTo).toBeLessThan(0);
    });

    it('two: it arrives at the pocket the engine already chose', () => {
        for (const n of WHEEL_ORDER) {
            expect(`${n}:${numberAtAngle(-spinAngles(n).ballTo)}`).toBe(`${n}:${n}`);
        }
    });

    it('three: it slows like something with a bearing under it', () => {
        // Not linear and not ease-out-cubic. A long tail that creeps the last
        // few degrees is what a heavy rim does.
        expect(wheel()).toMatch(/Easing\.bezier\(0\.17, 0\.67, 0\.12, 0\.99\)/);
        expect(wheel()).not.toMatch(/easing: Easing\.linear/);
    });

    it('four: the ball DROPS into the pocket at the end', () => {
        // Without it the ball simply stops in mid air on the rim, which is the
        // tell that it was never really orbiting anything.
        // ANCHORED TO THE VALUE IT ANIMATES TO. My first version checked only
        // that the interpolation and the duration existed, so the probe -
        // setting the drop's `toValue` to 0, which means the ball never leaves
        // the rim - left this green.
        const src = wheel();
        expect(src).toMatch(/ballRadius\.setValue\(0\)/);
        expect(src).toMatch(/Animated\.timing\(ballRadius, \{\s*toValue: 1,\s*duration: DROP_MS,/);
        expect(src).toMatch(/outputRange: \[-ballTrackR, -ballRestR\]/);
        // And it rests INSIDE the track, or it has not fallen anywhere.
        expect(src).toMatch(/const ballRestR = r \* 0\.72/);
        expect(src).toMatch(/const ballTrackR = r \* 0\.93/);
    });
});

describe('and it runs on the UI thread', () => {
    it('every animation is native driven', () => {
        // Transforms and opacity only. A wheel that stutters whenever the
        // JavaScript thread is busy is worse than no wheel.
        const src = wheel();
        const timings = src.match(/Animated\.timing\(/g) || [];
        const natives = src.match(/useNativeDriver: true/g) || [];
        expect(timings.length).toBeGreaterThanOrEqual(3);
        expect(natives.length).toBeGreaterThanOrEqual(timings.length);
        expect(src).not.toMatch(/useNativeDriver: false/);
    });

    it('and the whole spin is under three seconds', () => {
        // It was three seconds of nothing. It is 2.4 plus a 0.22 drop of
        // something, which reads shorter than the three did.
        const src = wheel();
        const spin = Number((src.match(/export const SPIN_MS = (\d+)/) || [])[1]);
        const drop = Number((src.match(/export const DROP_MS = (\d+)/) || [])[1]);
        expect(spin + drop).toBeLessThan(3000);
        expect(spin).toBeGreaterThan(1500);
    });
});

describe('and a second spin carries on from the first', () => {
    it('rather than snapping back to zero, which is the tell of a picture', () => {
        expect(wheel()).toMatch(/wheelAt\.current = wheelTo/);
        const first = spinAngles(17);
        expect(spinAngles(4, first.wheelTo).wheelTo).toBeGreaterThan(first.wheelTo);
    });
});
