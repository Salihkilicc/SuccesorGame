// src/features/casino/rouletteTable.test.ts
//
// ============================================================================
//  IT WAS A GRID OF BUTTONS, NOT A LAYOUT
// ============================================================================
//
//  Reported as "the table has ended up small in the middle... make the roulette
//  table more attractive, it is bad right now".
//
//  The first half was a real defect and it explains the second. The number grid
//  was a ScrollView with `maxHeight: 250` - a scroller INSIDE the screen's own
//  scroller - holding twelve rows that need about four hundred points. So:
//
//    - two thirds of the table was hidden at any moment
//    - reaching it meant a nested scroll gesture fighting the outer one
//    - and the cells had been shrunk to 32 points to fit, which is why
//      everything on the cloth looked cramped
//
//  A nested scroller is almost always a layout giving up, and this one had been
//  paid for twice: once in the hidden rows and once in the size of everything
//  that was visible. The outer scroller was already there. This just lays the
//  numbers out now.
//
//  With the height back, the rest is what a roulette layout actually is:
//
//    A PAINTED CLOTH. The numbers sit in a continuous grid divided by thin
//    white lines. It was rounded rectangles floating two points apart on
//    nothing, which reads as controls on a dark screen rather than a table you
//    are standing at. There is a felt and a rail now, in the same tones the
//    wheel is built from, so the two halves of the screen are one object.
//
//    ROUND CHIPS. The marker was a gold tag pinned to the corner, hanging
//    outside the cell it belonged to, in the one gold in the codebase. Chips
//    are round, they sit ON the number, and the colour that means "your money
//    is here" is the room's own chip colour.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { FELT } from '../../core/casino/roulette';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const table = () => read('components', 'RouletteTable.tsx');
const screen = () => read('screens', 'RouletteGameScreen.tsx');

describe('the whole table is on the table', () => {
    it('there is no scroller inside the scroller', () => {
        // THE DEFECT. Twelve rows in a 250 point window, inside a screen that
        // already scrolls.
        const src = table();
        expect(src).not.toMatch(/<ScrollView/);
        expect(src).not.toMatch(/maxHeight: 250/);
        expect(src).not.toMatch(/nestedScrollEnabled/);
    });

    it('and ScrollView is not imported for nothing', () => {
        expect(table()).not.toMatch(/import \{[^}]*ScrollView[^}]*\} from 'react-native'/);
    });

    it('and all twelve rows are laid out', () => {
        const src = table();
        expect(src).toMatch(/ROULETTE_GRID\.map\(\(row, rowIdx\) =>/);
        // Three columns of twelve, built once at module load.
        expect(src).toMatch(/for \(let row = 0; row < 12; row\+\+\)/);
    });

    it('and the cells grew back, because they no longer have to fit', () => {
        // 32 was a number chosen to squeeze twelve rows into 250 points.
        const src = table();
        const cell = src.slice(src.indexOf('numberCell: {'));
        const height = Number((cell.match(/height: (\d+)/) || [])[1]);
        expect(height).toBeGreaterThan(32);
    });
});

describe('and it is a cloth rather than a container', () => {
    it('the felt has its own tone, not the zero pocket green', () => {
        // A whole table of the pocket green would be the brightest thing on
        // the screen and would fight the rule that keeps green for profit
        // and loss.
        expect(FELT.cloth).toBeTruthy();
        expect(FELT.cloth).not.toBe(FELT.green);
        expect(screen()).toMatch(/backgroundColor: FELT\.cloth/);
    });

    it('and a rail around it, in the wheel"s own rim tone', () => {
        const src = screen();
        const box = src.slice(src.indexOf('tableContainer: {'));
        const decl = box.slice(0, box.indexOf('},'));
        expect(decl).toMatch(/borderColor: FELT\.rim/);
        expect(decl).toMatch(/borderWidth: 3/);
    });

    it('and the gaps between numbers are the painted lines', () => {
        // Two point gaps on nothing read as scattered buttons. A layout is a
        // continuous grid with thin rules through it.
        const src = table();
        expect(src).toMatch(/const RULE = /);
        expect(src).toMatch(/gap: 1\.5/);
        expect(src).toMatch(/borderColor: RULE/);
    });
});

describe('and the chip is a chip', () => {
    it('it takes the room"s colour rather than one gold for every city', () => {
        const src = table();
        expect(src).not.toMatch(/#FFD700/);
        expect(src).toMatch(/const chip = gameTheme\?\.chipColor/);
        expect(src).toMatch(/backgroundColor: chipColor/);
    });

    it('and every cell that can hold one is told which colour', () => {
        // Missing it on one of them is how half a table ends up white.
        const src = table();
        expect((src.match(/chipColor=\{chip\}/g) || []).length).toBeGreaterThanOrEqual(10);
        expect(src).toMatch(/chipColor: string;/);
    });

    it('and it sits on the number rather than hanging off the corner', () => {
        const src = table();
        const chip = src.slice(src.indexOf('chipIndicator: {'));
        const decl = chip.slice(0, chip.indexOf('},'));
        expect(decl).toMatch(/bottom: 2/);
        expect(decl).not.toMatch(/top: -4/);
    });

    it('and its label is dark, because every room colour is a light fill', () => {
        const src = table();
        const txt = src.slice(src.indexOf('chipIndicatorText: {'));
        expect(txt.slice(0, txt.indexOf('},'))).toMatch(/color: '#000000'/);
    });
});
