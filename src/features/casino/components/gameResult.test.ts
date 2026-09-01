// src/features/casino/components/gameResult.test.ts
//
// ============================================================================
//  A DOOR BETWEEN EVERY TWO SPINS
// ============================================================================
//
//  What was there: a full screen overlay, a card with a coloured border and a
//  glow, a trophy emoji, VICTORY or DEFEAT in twenty two point, and a
//  sentence explaining that the winnings had been deposited to your cash
//  balance. After every hand.
//
//  On the Ticker a win is better than one spin in nine, so that is a card to
//  dismiss every few seconds. A casino is a rhythm - spin, see, spin - and
//  anything that has to be got past between two spins stops being a
//  celebration and becomes a door. After the fourth one the player is closing
//  doors rather than playing.
//
//  Worse, it TOOK THE TAP. Both the popup and the slots BIG WIN curtain
//  covered the button with a Pressable, so a player going again while one was
//  up dismissed it instead of spinning.
//
//  Asked for as "oyuncuyu oyundan ayirmasin ve de sadece belli etsin para
//  miktarini ... basmasak da gorunup kaybolsa".
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');

const code = (...p: string[]) => read(...p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*)/.test(l))
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .join('\n');

const POPUP = ['GameResultPopup.tsx'];
const SLOTS = ['..', 'screens', 'SlotsGameScreen.tsx'];

describe('the result', () => {
    it('is the amount and nothing else', () => {
        const src = code(...POPUP);
        // The words and the picture are gone.
        expect(src).not.toMatch(/VICTORY|DEFEAT|casino\.victory|casino\.defeat/);
        expect(src).not.toMatch(/winSub|lossSub|drawSub/);
        expect([...src].some(ch => {
            const o = ch.codePointAt(0) ?? 0;
            return (o >= 0x1F300 && o <= 0x1FAFF) || (o >= 0x2600 && o <= 0x27BF);
        })).toBe(false);
        // And the number is still there.
        expect(src).toMatch(/formatMoney\(/);
    });

    it('and it takes no taps at all', () => {
        // Not "dismissing is optional" - there is nothing to dismiss. The
        // button underneath stays live while the number fades.
        const src = code(...POPUP);
        expect(src).toMatch(/pointerEvents="none"/);
        expect(src).not.toMatch(/<Pressable/);
    });

    it('and it goes on its own', () => {
        const src = code(...POPUP);
        expect(src).toMatch(/LIFETIME_MS/);
        expect(src).toMatch(/onHide\?\.\(\)/);
    });

    it('and it does not sit on top of the table', () => {
        // A card in the middle of the screen covered the thing the player was
        // watching.
        //
        // THIS USED TO PIN `bottom: '32%'` and that was the wrong thing to
        // pin. A percentage from the bottom is a different place on each of
        // the four screens that use this - on both card games it was the
        // cards - so the test was enforcing the very number that caused the
        // complaint "it lands on the cards". It is anchored to the cash pill
        // now; see resultPlacement.test.ts for the whole argument.
        const src = code(...POPUP);
        expect(src).toMatch(/top: 6,/);
        expect(src).not.toMatch(/bottom: '\d+%'/);
    });
});

describe('the colours', () => {
    it('are the profit and loss ones, which is what this actually is', () => {
        const src = code(...POPUP);
        expect(src).toMatch(/theme\.colors\.success/);
        expect(src).toMatch(/theme\.colors\.danger/);
    });

    it('and they colour a number rather than a border or a glow', () => {
        // The house rule: the signal colours are TEXT tokens. The old card
        // broke it twice, with a coloured border and a coloured shadow.
        const src = code(...POPUP);
        expect(src).not.toMatch(/borderColor: (accentColor|colour)/);
        expect(src).not.toMatch(/shadowColor: (accentColor|colour)/);
        expect(src).not.toMatch(/backgroundColor: (accentColor|colour)/);
        expect(src).toMatch(/color: colour/);
    });

    it('and a push is neither', () => {
        // The stake came back. Showing the figure with no sign says that more
        // clearly than the word PUSH did.
        expect(code(...POPUP)).toMatch(/isPush\s*\?\s*theme\.colors\.textMuted/);
    });
});

describe('the slots curtain', () => {
    it('is gone', () => {
        const src = code(...SLOTS);
        expect(src).not.toMatch(/styles\.winOverlay/);
        expect(src).not.toMatch(/ui\.bigWin/);
        expect(src).not.toMatch(/tapScreenToContinue/);
    });

    it('and the amount is drawn by the one component that does it', () => {
        expect(code(...SLOTS)).toMatch(/<GameResultPopup/);
    });

    it('while its styles are shelved rather than deleted', () => {
        // They record what the screen used to be.
        expect(read(...SLOTS)).toContain('winOverlay');
        expect(read(...SLOTS)).toContain('bigWinText');
    });
});

describe('what a loss is worth', () => {
    it('is the stake, in every game', () => {
        // FOUND BY THIS CHANGE. Slots passed `winAmount` on a loss, which is
        // zero, so the result read "-$0". Nobody had noticed because the word
        // DEFEAT was the loudest thing on the card and the number was
        // decoration next to it. Blackjack and poker already passed the stake.
        const slots = code('..', 'logic', 'useSlotsLogic.ts');
        expect(slots).toMatch(/resultType === 'win' \? winAmount : bet/);
        expect(slots).not.toMatch(/setLastResult\(\{ type: resultType, amount: winAmount \}\)/);

        expect(code('..', 'logic', 'useBlackjackLogic.ts'))
            .toMatch(/type: 'loss', amount: bet/);
    });
});
