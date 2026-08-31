// src/features/casino/slotSpeed.test.ts
//
// ============================================================================
//  FOUR SECONDS, ELEVEN RE-RENDERS A SECOND, AND A PAUSE CALLED SUSPENSE
// ============================================================================
//
//  Reported as "the slots are very slow, one spin every four seconds, they
//  spin and spin". Measured on the old sequence:
//
//      setTimeout(2000)            the blur
//      + reel stagger 0/300/600    the stops
//      + 400                       the last settle
//      + setTimeout(1140)          "suspense"
//      = 4.14 seconds a spin
//
//  Two things were wrong and only the first is obvious.
//
//  ONE: THE SPINNING WAS WHAT MADE IT SLOW. For the whole first two seconds
//  the hook called `setGrid` from a `setInterval` every ninety milliseconds -
//  a full React re-render of the machine, eleven times a second, on the
//  JavaScript thread, purely to make the symbols appear to move. The reel
//  component was ALREADY animating itself on the UI thread. The blur was
//  being done twice, and the expensive copy was the one nobody could see.
//
//  TWO: THE 1140ms WAS NOT SUSPENSE. It ran after every reel had stopped, so
//  the player was looking at the answer and waiting for the game to admit it.
//  That is a pause. Suspense is the third reel still turning while the first
//  two already match, which is the one moment in a spin where the answer is
//  genuinely still coming - and it now costs 450ms and happens only then.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    HANG_MS,
    REEL_GAP,
    SETTLE_MS,
    SPIN_MS,
} from './logic/useSlotsLogic';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const hook = () => read('logic', 'useSlotsLogic.ts');
const reel = () => read('components', 'Reel.tsx');
const screen = () => read('screens', 'SlotsGameScreen.tsx');

/** The old sequence, for the comparison to be a fact rather than a memory. */
const OLD_SPIN_MS = 2000 + 600 + 400 + 1140;

describe('an ordinary spin', () => {
    it('is about a second, and it was four', () => {
        const ordinary = SPIN_MS + REEL_GAP * 2 + SETTLE_MS;
        expect(ordinary).toBe(1180);
        expect(OLD_SPIN_MS).toBe(4140);
        expect(ordinary).toBeLessThan(OLD_SPIN_MS / 3);
    });

    it('and even the slow one is quicker than the old fast one', () => {
        const hanging = SPIN_MS + REEL_GAP * 2 + HANG_MS + SETTLE_MS;
        expect(hanging).toBeLessThan(OLD_SPIN_MS);
    });

    it('and the reels still stop one at a time', () => {
        // They arrive together without this, and a slot machine that resolves
        // all at once has no third reel worth watching.
        expect(REEL_GAP).toBeGreaterThan(120);
    });
});

describe('the flat 1140ms of "suspense" is gone', () => {
    it('there is no second timer waiting after the reels have landed', () => {
        // The player could already see the answer. That is a pause.
        expect(hook()).not.toMatch(/}, 1140\)/);
        expect(hook()).not.toMatch(/DELAY: Suspense/);
    });

    it('and the payout is timed off the LAST reel rather than off a constant', () => {
        // Or the money arrives before the reel it came from has stopped.
        expect(hook()).toMatch(/const lastReelStops = SPIN_MS \+ REEL_GAP \* 2 \+ \(hanging \? HANG_MS : 0\) \+ SETTLE_MS/);
        expect(hook()).toMatch(/setTimeout\(\(\) => processResult\(spin\), lastReelStops\)/);
    });
});

describe('and the machine is not re-rendered eleven times a second', () => {
    it('the ninety millisecond interval is gone', () => {
        // THE DEFECT. A full React re-render of the machine, on the JS thread,
        // to animate something the reel was already animating itself.
        expect(hook()).not.toMatch(/setInterval\(/);
        expect(hook()).not.toMatch(/}, 90\)/);
    });

    it('and the grid is written once, when it lands', () => {
        const src = hook();
        const writes = (src.match(/setGrid\(/g) || []).length;
        // One in the spin, one in the effect that reacts to a machine change.
        expect(writes).toBeLessThanOrEqual(2);
        expect(src).toMatch(/setGrid\(targetGrid\)/);
    });

    it('and the blur belongs to the reel, on the UI thread', () => {
        const src = reel();
        expect(src).toMatch(/useNativeDriver: true/);
        expect(src).not.toMatch(/useNativeDriver: false/);
    });

    it('and the blur is fast enough to BE a blur', () => {
        // At 500ms a revolution the symbols are readable, which is why it
        // looked like a list scrolling rather than a reel spinning.
        expect(reel()).toMatch(/duration: 220 \+ \(stripSymbols\.length \* 8\)/);
        expect(reel()).not.toMatch(/duration: 500 \+ \(stripSymbols\.length \* 20\)/);
    });
});

describe('the anticipation', () => {
    it('the last reel hangs, and only when the first two already match', () => {
        // The one moment where the answer is still coming. Spending it is what
        // the deleted 1140ms was trying and failing to do.
        expect(hook()).toMatch(/const hanging = spin\.payline\[0\] === spin\.payline\[1\]/);
        expect(HANG_MS).toBeGreaterThan(300);
    });

    it('and it changes no odds at all, which is what makes it honest', () => {
        // The outcome is settled before anything moves. `hanging` is read off
        // a decision that has already been made.
        const src = hook();
        const decided = src.indexOf('const spin = spinSlot(config);');
        const hangs = src.indexOf('const hanging = spin.payline[0]');
        expect(decided).toBeGreaterThan(-1);
        expect(hangs).toBeGreaterThan(decided);
    });

    it('and the reels are told about it through one set of numbers', () => {
        // Two copies of a timing is how a reel lands after the money has
        // already been paid.
        expect(hook()).toMatch(/reelDelays: \[0, REEL_GAP, REEL_GAP \* 2 \+ \(hold \? HANG_MS : 0\)\]/);
        expect(screen()).toMatch(/delay=\{reelDelays\[colIdx\] \?\? 0\}/);
        expect(screen()).not.toMatch(/delay=\{colIdx \* 300\}/);
    });

    it('and the settle time comes from the same place', () => {
        expect(screen()).toMatch(/settleMs=\{settleMs\}/);
        expect(reel()).toMatch(/duration: settleMs,/);
        expect(reel()).not.toMatch(/duration: 400,/);
    });
});

describe('and the result comes from the engine', () => {
    it('the hook asks spinSlot rather than rolling its own tiers', () => {
        const src = hook();
        expect(src).toMatch(/const spin = spinSlot\(config\)/);
        expect(src).not.toMatch(/const determineOutcome = \(\): OutcomeTier/);
        expect(src).not.toMatch(/const generateForcedGrid/);
    });

    it('and the maths is no longer next to the icon names', () => {
        // slotsData is the CITY - faces, colours, subtitles. The machine is
        // the engine. It used to be both.
        const data = read('logic', 'slotsData.ts');
        expect(data).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/casino\/slots'/);
        expect(data).not.toMatch(/export const miniOdds = \(config: SlotConfig\)/);
        expect(data).not.toMatch(/export const meanJackpot = \(config: SlotConfig\)/);
    });
});
