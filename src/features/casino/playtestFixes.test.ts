// src/features/casino/playtestFixes.test.ts
//
// ============================================================================
//  WHAT THE FIRST PLAYTHROUGH FOUND
// ============================================================================
//
//  Four things, and three of them were real defects that no test I had written
//  would have caught, because all three live in the gap between a component
//  rendering and a component rendering AGAIN.
//
//  1. "THE SLOT PLAYS BY ITSELF NOW AND THEN WHILE IT IS SITTING STILL."
//     `iconStrip(symbols)` was called inside the returned state object, so it
//     built a new array on every render. The Reel has that array in its effect
//     dependencies, so every render re-ran the effect and replayed the landing
//     animation. A machine spinning with nobody touching it.
//
//  2. "THREE CAME UP SIDE BY SIDE AND IT COUNTED IT AS A LOSS."
//     The player was right and so was the machine. The reel window was three
//     symbols tall and only the MIDDLE row is the payline, so three of a kind
//     in the top row is a loss that looks exactly like a win. A three row
//     window belongs on a machine with three paylines.
//
//  3. "THE POKER HAND ENDS IMMEDIATELY, EVERYTHING OPENS AT ONCE."
//     The bot chain was started from inside a `setRound` updater. React is
//     allowed to run an updater more than once and does so on every render in
//     development, so TWO chains were advancing the same hand in parallel. The
//     stagger was never broken; it was being run twice over.
//
//  4. "WHEN I PLACE A BET THE WHEEL STAYS UP AT THE TOP."
//     Not a defect, a layout mistake: the betting table is tall, so laying a
//     chip scrolled the wheel off screen and the spin happened where the
//     player could not see it.
//
//  The lesson in the first three is the same one: a test that reads source
//  cannot see a render loop. These are pinned by their SHAPE - the thing that
//  made each of them possible - rather than by their symptom.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');

describe('the slot no longer spins by itself', () => {
    it('the reel strip is memoised rather than rebuilt every render', () => {
        // THE DEFECT. A new array identity on every render, in the dependency
        // list of an effect that animates.
        const hook = read('logic', 'useSlotsLogic.ts');
        expect(hook).toMatch(/const symbolIcons = useMemo\(\(\) => iconStrip\(symbols\), \[symbols\]\)/);
        expect(hook).toMatch(/^\s+symbolIcons,$/m);
        expect(hook).not.toMatch(/symbolIcons: iconStrip\(symbols\)/);
    });

    it('and nothing else in the returned state builds an array either', () => {
        // The rule rather than the instance: anything constructed in the
        // returned object is a new identity every render, and any of it can
        // land in a dependency list.
        const hook = read('logic', 'useSlotsLogic.ts');
        const returned = hook.slice(hook.lastIndexOf('return {'));
        expect(returned).not.toMatch(/iconStrip\(/);
        expect(returned).not.toMatch(/\.map\(/);
    });

    it('and the symbols themselves are memoised on the faces, not the object', () => {
        expect(read('logic', 'useSlotsLogic.ts'))
            .toMatch(/\[variant, faces\.join\(','\)\]/);
    });
});

describe('and every symbol on screen is one that counts', () => {
    it('the reel window is ONE row, not three', () => {
        // THE DEFECT. Three rows on a single payline machine means two thirds
        // of what the player is looking at cannot win, and looks identical to
        // the third that can.
        const reel = read('components', 'Reel.tsx');
        expect(reel).toMatch(/height: SYMBOL_HEIGHT,\n/);
        expect(reel).not.toMatch(/height: SYMBOL_HEIGHT \* 3/);
    });

    it('and the payline sits on that row rather than below it', () => {
        // It was offset by one symbol to mark the middle of three.
        const reel = read('components', 'Reel.tsx');
        const payline = reel.slice(reel.indexOf('payline: {'));
        expect(payline).toMatch(/top: 0,/);
        expect(payline).not.toMatch(/top: SYMBOL_HEIGHT,/);
    });
});

describe('and the poker bots act one at a time again', () => {
    const hook = () => read('logic', 'useSixHandedPoker.ts');

    it('nothing is scheduled from inside a state updater', () => {
        // THE DEFECT, and it is a shape rather than a line: React may run an
        // updater more than once, so anything with an effect in it happens
        // more than once too.
        expect(hook()).not.toMatch(/setRound\(current => \{[\s\S]*?setTimeout/);
        expect(hook()).not.toMatch(/setRound\(current => \{[\s\S]*?runBots/);
    });

    it('and the player action reads the hand from a ref instead', () => {
        const src = hook();
        expect(src).toMatch(/const current = roundRef\.current;/);
        expect(src).toMatch(/setRound\(next\);\s*runBots\(next\);/);
    });

    it('and the ref is kept level with the state everywhere it moves', () => {
        // A ref that drifts from the state it mirrors is worse than no ref.
        const src = hook();
        const assignments = (src.match(/roundRef\.current = /g) || []).length;
        expect(assignments).toBeGreaterThanOrEqual(3);
    });

    it('and the chain still staggers, which was never the broken part', () => {
        expect(hook()).toMatch(/}, wait\);/);
        expect(hook()).toMatch(/thinkTime\(/);
    });
});

describe('and the wheel stays where it can be seen', () => {
    const screen = () => read('screens', 'RouletteGameScreen.tsx');

    it('it sits outside the ScrollView, so laying a chip cannot scroll it away', () => {
        const src = screen();
        const wheelAt = src.indexOf('<RouletteWheel');
        const scrollAt = src.indexOf('<ScrollView');
        expect(wheelAt).toBeGreaterThan(-1);
        expect(wheelAt).toBeLessThan(scrollAt);
    });

    it('and it is smaller, because a wheel that is always there can be', () => {
        // 230 -> 168 when it was pinned, then 168 -> 176 when the hub became
        // the spin button and needed to be a comfortable target. What this
        // pins is the point: a wheel that never leaves the screen does not
        // have to dominate it.
        const size = Number((screen().match(/size=\{(\d+)\}/) || [])[1]);
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThan(200);
    });
});

describe('and the table labels fit', () => {
    it('a rival CEO can be told apart from a stranger at a glance', () => {
        // Reported as "you cannot tell who the CEOs are". A company name that
        // truncates to "Gener..." says nothing, and naming the rival is the
        // entire reason they are at the table rather than a stranger.
        const seat = read('components', 'PokerSeat.tsx');
        expect(seat).toMatch(/fontSize: 7,/);
        expect(seat).toMatch(/width: 86/);
    });

    it('and the seat box on the screen is as wide as the seat itself', () => {
        // Or the label is clipped by its container and the smaller font buys
        // nothing at all.
        expect(read('screens', 'PokerGameScreen.tsx')).toMatch(/const SEAT_W = 86;/);
    });
});
