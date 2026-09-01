// src/features/casino/casinoLayout.test.ts
//
// ============================================================================
//  THE TWO THINGS YOU TOUCH WERE BOTH BELOW THE FOLD
// ============================================================================
//
//  Reported as "on the gambling screens the bet area and the play button are
//  very far down, and because of that we have to move around in the game".
//
//  Three of the four screens wrapped everything in a ScrollView - the table,
//  the chips and the buttons - so the two controls each screen exists for
//  started below the fold on anything but the tallest phone. Every hand began
//  with a scroll.
//
//  The slot was fixed for exactly this a while ago, with a comment that says
//  so: "A SLOT MACHINE DOES NOT SCROLL". The lesson was written down and then
//  applied to one screen out of four, which is how the same defect survives
//  being fixed.
//
//  ---------------------------------------------------------------------------
//  THE RULE, STATED ONCE
//  ---------------------------------------------------------------------------
//      THE THING YOU LOOK AT MAY SCROLL. THE THING YOU ACT WITH MAY NOT.
//
//  Blackjack and poker do not need a scroller at all and no longer have one.
//  Roulette genuinely does - the grid is three columns of twelve plus the
//  outside bets, and it cannot shrink - so there the grid scrolls between a
//  pinned wheel above and pinned controls below. Same rule, different shape.
//
//  ---------------------------------------------------------------------------
//  AND THE FELT'S HEIGHT WAS A NUMBER THAT FITTED ONE PHONE
//  ---------------------------------------------------------------------------
//  Blackjack's felt was a flat 320 with a comment claiming it was "short
//  enough to leave the chips and the buttons on screen without scrolling".
//  The ScrollView wrapped around it made that untrue and hid the evidence: on
//  a shorter phone the felt simply pushed the controls down and the scroller
//  absorbed the mistake. It is derived from the device now.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) =>
    fs.readFileSync(path.join(__dirname, 'screens', ...p), 'utf8');

const blackjack = () => read('BlackjackGameScreen.tsx');
const poker = () => read('PokerGameScreen.tsx');
const roulette = () => read('RouletteGameScreen.tsx');
const slots = () => read('SlotsGameScreen.tsx');

describe('nothing you have to press can scroll away', () => {
    it('blackjack has no scroller at all', () => {
        const src = blackjack();
        expect(src).not.toMatch(/<ScrollView/);
        expect(src).not.toMatch(/^import \{[^}]*ScrollView/m);
        expect(src).toMatch(/stage: \{\s*flex: 1,/);
    });

    it('and poker keeps one for the table but not for the buttons', () => {
        const src = poker();
        // FOLD, CALL and RAISE come after the scroller closes.
        const scrollEnd = src.indexOf('</ScrollView>');
        expect(scrollEnd).toBeGreaterThan(-1);
        expect(src.indexOf("actions.act('fold')")).toBeGreaterThan(scrollEnd);
        expect(src.indexOf('<CustomChipSelector')).toBeGreaterThan(scrollEnd);
        expect(src).toMatch(/controlsDock: \{/);
    });

    it('and roulette keeps one for the grid but not for the chips or SPIN', () => {
        // The grid is the one thing in the casino that genuinely cannot fit.
        const src = roulette();
        const scrollEnd = src.indexOf('</ScrollView>');
        expect(src.indexOf('<RouletteTable')).toBeLessThan(scrollEnd);
        // `<CustomChipSelector`, with the bracket - the bare name also
        // matches the import line at the top of the file, which is before
        // every scroller and would have made this pass on nothing.
        expect(src.indexOf('<CustomChipSelector')).toBeGreaterThan(scrollEnd);
        // THE SPIN BUTTON, by its own style, rather than by the handler.
        // `actions.handleSpin` now appears twice - the wheel itself is
        // pressable, and the wheel is pinned ABOVE the scroller - so matching
        // the handler found the wheel and said the button had moved.
        expect(src.indexOf('styles.spinButton')).toBeGreaterThan(scrollEnd);
    });

    it('and the slot still does not scroll, which it never should have', () => {
        expect(slots()).not.toMatch(/<ScrollView/);
    });

    it('and every pinned dock clears the nav bar itself', () => {
        // Or the buttons sit under the tab bar, which is the bug this rule
        // was written for the first time round.
        expect(blackjack()).toMatch(/paddingBottom: NAV_BAR_CLEARANCE/);
        expect(poker()).toMatch(/controlsDock: \{[\s\S]{0,200}paddingBottom: NAV_BAR_CLEARANCE/);
        expect(roulette()).toMatch(/controlsDock: \{[\s\S]{0,240}paddingBottom: NAV_BAR_CLEARANCE/);
        expect(slots()).toMatch(/paddingBottom: NAV_BAR_CLEARANCE/);
    });

    it('and no scroller pads for a nav bar it no longer sits above', () => {
        // Double clearance leaves a dead band the player can scroll into.
        expect(poker()).not.toMatch(/content: \{ paddingBottom: NAV_BAR_CLEARANCE/);
        expect(roulette()).not.toMatch(/content: \{[^}]*paddingBottom: NAV_BAR_CLEARANCE/);
    });
});

describe('and the felt fits the phone it is on', () => {
    it('its height comes from the window, not from a constant', () => {
        // THE DEFECT. 320 fitted the device it was written on and the
        // ScrollView hid what it did to every smaller one.
        const src = blackjack();
        expect(src).toMatch(/const TABLE_H = Math\.max\(/);
        expect(src).toMatch(/Dimensions\.get\('window'\)\.height - CHROME_H/);
    });

    it('and it is clamped at both ends', () => {
        // A ceiling so it does not sprawl on a tall phone, and a FLOOR
        // because below about 190 the two rows of cards start to touch and a
        // cramped table is worse than a short one.
        const src = blackjack();
        expect(src).toMatch(/Math\.max\(\s*190,/);
        expect(src).toMatch(/Math\.min\(320,/);
    });

    it('and the chrome it subtracts is written down rather than guessed', () => {
        const src = blackjack();
        expect(src).toMatch(/const CHROME_H = [\d + ]+\+ NAV_BAR_CLEARANCE;/);
        expect(src).toMatch(/header 143 \+ stage padding 32/);
    });

    it('and on the phones that matter it lands somewhere sensible', () => {
        // Worked by hand rather than trusted: the constant is only useful if
        // it produces a usable felt at both ends of the range.
        const CHROME = 143 + 32 + 34 + 70 + 80 + 32 + 122; // iOS clearance
        const felt = (h: number) => Math.max(190, Math.min(320, h - CHROME));
        expect(felt(874)).toBe(320);   // iPhone 17 Pro, the ceiling
        expect(felt(844)).toBe(331 > 320 ? 320 : 331); // iPhone 14
        expect(felt(667)).toBe(190);   // SE, the floor
        expect(felt(736)).toBe(223);   // 8 Plus, in between
    });
});
