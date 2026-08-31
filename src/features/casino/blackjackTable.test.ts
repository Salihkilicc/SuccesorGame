// src/features/casino/blackjackTable.test.ts
//
// ============================================================================
//  THERE WAS NO TABLE
// ============================================================================
//
//  Reported as "blackjack should be better too, there should be a table in the
//  middle, it should turn, it should feel real".
//
//  What was there: two bordered boxes stacked vertically with a faint
//  "BLACKJACK PAYS 3:2" between them, and cards that faded up from forty
//  pixels below wherever they happened to sit. Nothing came from anywhere,
//  which is the difference between a card being DEALT and a card appearing.
//
//  Three changes, and the second is the one that does the work:
//
//    1. A FELT. An oval, a rail, the croupier's arc and the house rules
//       written across the middle where a casino writes them.
//    2. A DECK IN THE CORNER, and every card travels from it. One transform,
//       on the UI thread, with no layout measuring: the card knows where the
//       shoe is relative to its own resting place and animates from there to
//       zero.
//    3. THE HOLE CARD TURNS OVER. It used to be a hard swap between two
//       different components; it is a quarter turn each way now, with the two
//       faces exchanging at the halfway point.
//
//  And the dealer draws ONE AT A TIME, which was impossible before: the draw
//  was a `while` loop inside the `stand` handler, so by the time it returned
//  the dealer had already finished. `dealerPlay` hands the cards back in order.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { DEAL_GAP, DEAL_MS, FLIP_MS } from './components/AnimatedCard';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const card = () => read('components', 'AnimatedCard.tsx');
const felt = () => read('components', 'BlackjackFelt.tsx');
const screen = () => read('screens', 'BlackjackGameScreen.tsx');
const hook = () => read('logic', 'useBlackjackLogic.ts');

describe('there is a felt now', () => {
    it('an oval with a rail, drawn rather than bordered', () => {
        expect(felt()).toMatch(/<Ellipse/);
        expect(felt()).toMatch(/from 'react-native-svg'/);
        expect(screen()).toMatch(/<BlackjackFelt/);
    });

    it('and the croupier arc, which is what makes it blackjack and not poker', () => {
        expect(felt()).toMatch(/<Path/);
    });

    it('and the house rules are ON the felt, where a casino writes them', () => {
        expect(felt()).toMatch(/DEALER MUST STAND ON 17/);
        expect(screen()).toMatch(/label=\{t\('ui\.blackjackPays32'\)\}/);
    });

    it('and the two stacked boxes are gone', () => {
        expect(screen()).not.toMatch(/styles\.handCard/);
        expect(screen()).not.toMatch(/styles\.tableCenter/);
    });
});

describe('and the cards come from somewhere', () => {
    it('there is a shoe on the table', () => {
        expect(screen()).toMatch(/styles\.shoe/);
        expect(screen()).toMatch(/shoeCard/);
    });

    it('and every card is told where it is', () => {
        // THE DEFECT. `translateY` started at a flat 40 for every card, from
        // nowhere in particular, which is a card appearing rather than a card
        // being dealt.
        const src = screen();
        expect(src).toMatch(/fromX=\{DECK_FROM_DEALER\.x\}/);
        expect(src).toMatch(/fromY=\{DECK_FROM_PLAYER\.y\}/);
        expect(card()).toMatch(/fromX\?: number;/);
        expect(card()).not.toMatch(/const translateY = useRef\(new Animated\.Value\(40\)\)/);
    });

    it('and it travels in two dimensions, not just up', () => {
        const src = card();
        expect(src).toMatch(/outputRange: \[0, fromX\]/);
        expect(src).toMatch(/outputRange: \[0, fromY\]/);
        expect(src).toMatch(/\{ translateX \}, \{ translateY \}/);
    });

    it('and the player sits further from the shoe than the dealer does', () => {
        // Or both hands are dealt from the same spot and the table has no
        // geometry at all.
        const src = screen();
        const dealerY = Number((src.match(/DECK_FROM_DEALER = \{ x: \d+, y: (-?\d+) \}/) || [])[1]);
        const playerY = Number((src.match(/DECK_FROM_PLAYER = \{ x: \d+, y: (-?\d+) \}/) || [])[1]);
        expect(Math.abs(playerY)).toBeGreaterThan(Math.abs(dealerY));
    });
});

describe('and the hole card turns over', () => {
    it('rather than being swapped for a different component', () => {
        const src = card();
        expect(src).toMatch(/rotateY: faceUpSpin/);
        expect(src).toMatch(/rotateY: faceDownSpin/);
        expect(src).toMatch(/perspective: 800/);
    });

    it('and the two faces exchange at the halfway point', () => {
        // A quarter turn each way. Without the offset both faces are visible
        // at once for a frame and the card looks transparent.
        const src = card();
        expect(src).toMatch(/outputRange: \['180deg', '360deg'\]/);
        expect(src).toMatch(/outputRange: \['0deg', '180deg'\]/);
    });

    it('and it is its own animation, because it happens much later', () => {
        // The deal and the reveal are minutes apart at a real table.
        const src = card();
        expect(src).toMatch(/}, \[hidden\]\);/);
        expect(FLIP_MS).toBeGreaterThan(200);
    });
});

describe('and the dealer draws one card at a time', () => {
    it('which the old while loop inside the handler could not do', () => {
        expect(hook()).toMatch(/const play = dealerPlay\(dealerCards, deck\)/);
        expect(hook()).not.toMatch(/while \(calculateHand\(nextDealer\)\.total < 17\)/);
    });

    it('and the screen staggers the drawn ones separately from the deal', () => {
        // The first two arrive at the deal; anything after that arrives when
        // the player stands, so it cannot share the deal's stagger.
        expect(screen()).toMatch(/index=\{idx < 2 \? idx : idx - 2\}/);
        expect(screen()).toMatch(/baseDelay=\{idx < 2 \? 100 : 0\}/);
    });

    it('and the settlement is one call rather than four branches in a handler', () => {
        expect(hook()).toMatch(/settle\(playerCards, play\.cards, bet\)\.outcome/);
        expect(hook()).not.toMatch(/if \(dTotal > 21\) resolveRound\('win'\)/);
    });

    it('and the rules are not declared twice', () => {
        // This file had its own `Card` with `rank: string`, which is looser
        // than the engine's and would let a typo through.
        expect(hook()).toMatch(/export type \{ Card \} from '\.\.\/\.\.\/\.\.\/core\/casino\/blackjack'/);
        expect(hook()).not.toMatch(/const createDeck = /);
    });
});

describe('and the whole deal is quick', () => {
    it('four cards land in under a second', () => {
        const fourCards = DEAL_MS + DEAL_GAP * 3;
        expect(fourCards).toBeLessThan(1000);
    });

    it('and every animation is native driven', () => {
        const src = card();
        expect(src).not.toMatch(/useNativeDriver: false/);
        const timings = (src.match(/Animated\.(timing|spring)\(/g) || []).length;
        const natives = (src.match(/useNativeDriver: true/g) || []).length;
        expect(natives).toBe(timings);
    });
});
