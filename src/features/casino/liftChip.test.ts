// src/features/casino/liftChip.test.ts
//
// ============================================================================
//  THE ONLY WAY TO CHANGE YOUR MIND WAS TO CLEAR THE WHOLE TABLE
// ============================================================================
//
//  Chips already go ON the table - each position draws its own stack. What
//  there was no way to do was take ONE back. The dock had CLEAR and nothing
//  else, so a player who laid nine chips carefully and put the tenth on the
//  wrong number started the whole layout again.
//
//  A long press on the position lifts the last chip placed there, which makes
//  the gesture the exact inverse of the tap: three taps and three long
//  presses leave the table as they found it.
//
//  The rule is tested through the REAL exported function, not a copy of it:
//  a copy agrees with itself while the hook does something else, and that is
//  how tests here have stayed green through bugs before. The WIRING is tested
//  by reading the component, because the failure this codebase produces over
//  and over is a correct function that nothing calls - a `removeBet` no
//  Pressable is holding would pass every behaviour test in this file.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { withoutLastChip as lift } from './logic/useRouletteLogic';
import type { BetType, PlacedBet } from './logic/useRouletteLogic';

const chip = (type: BetType, amount: number): PlacedBet => ({ type, amount });

describe('a long press takes one chip back', () => {
    it('the last one placed on that position, not the first', () => {
        // Chips of different sizes stack on one number. The newest is the one
        // the player is looking at when they decide it was a mistake.
        const table = [chip('S17', 100), chip('S17', 5_000)];
        expect(lift(table, 'S17')).toEqual([chip('S17', 100)]);
    });

    it('and only from the position that was held', () => {
        const table = [chip('S17', 100), chip('RED', 500), chip('S17', 250)];
        expect(lift(table, 'RED')).toEqual([chip('S17', 100), chip('S17', 250)]);
    });

    it('and it is the exact inverse of the tap that placed it', () => {
        // ------------------------------------------------------------------
        //  THE PROPERTY THAT MAKES THE GESTURE MAKE SENSE
        // ------------------------------------------------------------------
        //  Three taps then three long presses is an empty table again. If
        //  removal took the whole stack, or the oldest chip, this would not
        //  hold and the player could not undo their way back.
        // ------------------------------------------------------------------
        let table: PlacedBet[] = [];
        const laid: PlacedBet[] = [chip('S7', 100), chip('S7', 100), chip('S7', 2_500)];
        for (const c of laid) table = [...table, c];
        for (let i = 0; i < laid.length; i++) table = lift(table, 'S7');
        expect(table).toEqual([]);
    });

    it('and holding an empty position does nothing at all', () => {
        const table = [chip('S17', 100)];
        expect(lift(table, 'S22')).toBe(table);
        expect(lift([], 'BLACK')).toEqual([]);
    });

    it('and the total falls by exactly the chip that was lifted', () => {
        const total = (b: PlacedBet[]) => b.reduce((s, x) => s + x.amount, 0);
        const table = [chip('LOW', 1_000), chip('LOW', 250), chip('EVEN', 900)];
        expect(total(table) - total(lift(table, 'LOW'))).toBe(250);
    });
});

describe('and something is actually holding the gesture', () => {
    const src = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, ...p), 'utf8');

    const table = src('components', 'RouletteTable.tsx');
    const screen = src('screens', 'RouletteGameScreen.tsx');
    const hook = src('logic', 'useRouletteLogic.ts');

    it('the hook offers it', () => {
        expect(hook).toMatch(/const removeBet = \(type: BetType\)/);
        // Returned from `actions`, or the screen cannot reach it.
        expect(hook).toMatch(/actions: \{[\s\S]*?\n *removeBet,/);
        // And it goes through the rule this file imports, rather than
        // reimplementing it three lines inside a setState.
        expect(hook).toContain('withoutLastChip(prev, type)');
    });

    it('and the screen passes it to the table', () => {
        expect(screen).toMatch(/onRemoveBet=\{actions\.removeBet\}/);
    });

    it('and every position on the table is holdable, not just the numbers', () => {
        // Eleven bet positions are written out in this file: zero, the grid,
        // three dozens and six outside bets. A tap without a matching hold is
        // a bet the player cannot take back.
        const taps = [...table.matchAll(/onPress=\{\(\) => onPlaceBet\((.+?)\)\}/g)].map(m => m[1]);
        const holds = [...table.matchAll(/onLongPress=\{\(\) => onRemoveBet\((.+?)\)\}/g)].map(m => m[1]);
        expect(taps.length).toBeGreaterThanOrEqual(11);
        expect(holds).toEqual(taps);
    });

    it('and both cells really hand it to a Pressable', () => {
        // The prop can be threaded all the way down and then not used, which
        // is this codebase's signature failure. Two components, two uses.
        expect(table.match(/onLongPress=\{onLongPress\}/g)).toHaveLength(2);
        expect(table.match(/delayLongPress=\{LIFT_CHIP_MS\}/g)).toHaveLength(2);
    });

    it('and the hold is shorter than the platform default', () => {
        // 500ms is long enough that a player who meant to lay a second chip
        // and paused gets a removal instead.
        const ms = Number(/const LIFT_CHIP_MS = (\d+)/.exec(table)?.[1]);
        expect(ms).toBeGreaterThan(200);
        expect(ms).toBeLessThan(500);
    });

    it('and the player is told the gesture exists', () => {
        // Nobody long presses a number to see what happens. Both languages,
        // because a hint that only exists in English is not a hint here.
        expect(screen).toContain("t('casino.liftChip')");
        for (const lang of ['tr', 'en']) {
            const dict = fs.readFileSync(
                path.join(__dirname, '..', '..', 'core', 'i18n', `${lang}.ts`), 'utf8');
            expect({ lang, has: /'casino\.liftChip': '.+'/.test(dict) })
                .toEqual({ lang, has: true });
        }
    });
});
