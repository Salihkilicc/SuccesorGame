// src/features/casino/resultPlacement.test.ts
//
// ============================================================================
//  THE NUMBER LANDED ON THE CARDS
// ============================================================================
//
//  Reported as "you cannot tell how much you won - well, you can, but it lands
//  on the cards and it does not look good".
//
//  The popup was positioned at `bottom: '32%'`, centred, with a comment saying
//  that put it "above the controls and below the table, so it never sits on
//  top of the thing the player is watching".
//
//  That comment was true on ONE screen. Four screens use this component and
//  their layouts have nothing in common:
//
//      blackjack   a felt with the player's hand along the bottom
//      poker       your hole cards along the bottom
//      roulette    a betting grid
//      slots       a cabinet
//
//  So one hardcoded percentage lands in a different place on each of them, and
//  on both card games it landed exactly on the cards. A comment asserting a
//  spatial fact that only holds for one of four callers is worse than no
//  comment: it is why nobody checked.
//
//  ---------------------------------------------------------------------------
//  IT RISES INTO THE CASH PILL NOW
//  ---------------------------------------------------------------------------
//  The top right strip, under the balance, is the one region free on all four:
//  every status line is either left aligned or centred and short, and nothing
//  else is up there.
//
//  And it turns out to be right for a better reason than "it fits". The number
//  is a CHANGE IN YOUR BALANCE, and the balance is in that pill. The same rise
//  animation now carries it into the total it just changed, instead of
//  floating in the middle of the felt attached to nothing.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const popup = () => read('components', 'GameResultPopup.tsx');
const screens = {
    blackjack: () => read('screens', 'BlackjackGameScreen.tsx'),
    poker: () => read('screens', 'PokerGameScreen.tsx'),
    roulette: () => read('screens', 'RouletteGameScreen.tsx'),
    slots: () => read('screens', 'SlotsGameScreen.tsx'),
};

describe('the amount is anchored to the balance it changed', () => {
    it('top right, not floating a third of the way up the screen', () => {
        // THE DEFECT, in one line.
        const src = popup();
        const wrap = src.slice(src.indexOf('wrap: {'), src.indexOf('amount: {'));
        expect(wrap).toMatch(/top: 6,/);
        expect(wrap).toMatch(/alignItems: 'flex-end'/);
        expect(wrap).not.toMatch(/bottom: '32%'/);
        expect(wrap).not.toMatch(/alignItems: 'center'/);
    });

    it('and it still rises, because that is what carries it to the pill', () => {
        const src = popup();
        expect(src).toMatch(/const RISE = \d+;/);
        expect(src).toMatch(/outputRange: \[0, -RISE\]/);
    });

    it('and it still takes no taps', () => {
        // The reason a fast player's next spin is not eaten by the last
        // result. Unchanged, and worth keeping pinned.
        expect(popup()).toMatch(/pointerEvents="none"/);
    });

    it('and green and red are still text only', () => {
        // The house rule. They colour a number and never a fill.
        const src = popup();
        expect(src).toMatch(/color: colour/);
        expect(src).not.toMatch(/backgroundColor: colour/);
        expect(src).not.toMatch(/borderColor: colour/);
    });
});

describe('and every screen gives it something that starts below the header', () => {
    // The popup measures from the top of whatever contains it. A screen that
    // hands it the full-screen container puts it BEHIND the header, which is
    // a worse bug than the one being fixed.
    it('blackjack, in the stage', () => {
        const src = screens.blackjack();
        const stageAt = src.indexOf('<View style={styles.stage}>');
        expect(stageAt).toBeGreaterThan(-1);
        expect(src.indexOf('<GameResultPopup')).toBeGreaterThan(stageAt);
    });

    it('poker, in the stage', () => {
        const src = screens.poker();
        const stageAt = src.indexOf('<View style={styles.stage}>');
        expect(stageAt).toBeGreaterThan(-1);
        expect(src.indexOf('<GameResultPopup')).toBeGreaterThan(stageAt);
        expect(src).toMatch(/stage: \{ flex: 1 \}/);
    });

    it('roulette, in the stage', () => {
        const src = screens.roulette();
        const stageAt = src.indexOf('<View style={styles.stage}>');
        expect(stageAt).toBeGreaterThan(-1);
        expect(src.indexOf('<GameResultPopup')).toBeGreaterThan(stageAt);
        expect(src).toMatch(/stage: \{ flex: 1 \}/);
    });

    it('slots, in the content column', () => {
        const src = screens.slots();
        const contentAt = src.indexOf('<View style={styles.content}>');
        expect(contentAt).toBeGreaterThan(-1);
        expect(src.indexOf('<GameResultPopup')).toBeGreaterThan(contentAt);
    });

    it('and none of them leave it as a sibling of the header', () => {
        // Which is where it was, and where `top` would mean the top of the
        // phone rather than the top of the game.
        for (const [name, src] of Object.entries(screens)) {
            const text = src();
            const headerEnd = text.indexOf('/>', text.indexOf('<CasinoHeader'));
            const popupAt = text.indexOf('<GameResultPopup');
            const between = text.slice(headerEnd, popupAt);
            expect([name, /<View style=\{styles\.(stage|content)\}>/.test(between)])
                .toEqual([name, true]);
        }
    });
});
