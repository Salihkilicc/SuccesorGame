// src/core/casino/handRead.test.ts
//
// ============================================================================
//  THE BOTS COULD NOT SEE THEIR OWN CARDS
// ============================================================================
//
//  Asked as "they fold a lot in poker, is it because the hand is bad, and do
//  they actually have hands, and can they bluff". Three fair questions, and
//  measuring them turned up two separate defects.
//
//  ---------------------------------------------------------------------------
//  ONE: PREFLOP, EVERY HAND SCORED ZERO
//  ---------------------------------------------------------------------------
//  `rankHand` needs five cards. Before the flop there are two, so it returned
//  `Incomplete` and `handStrength` turned that into 0:
//
//      A A   0.0000        A K suited   0.0000
//      K K   0.0000        7 2 offsuit  0.0000
//
//  On the street where most of the folding happens, the bots could not tell
//  pocket aces from seven-deuce. What they acted on was `perceivedStrength(0,
//  ...)`, which is pure misread noise, so preflop play was four coin tosses
//  weighted by personality.
//
//  ---------------------------------------------------------------------------
//  TWO: AND POSTFLOP THE SCALE DID NOT MATCH THE THRESHOLDS
//  ---------------------------------------------------------------------------
//  `handStrength` was `(category + within) / 9`, which spreads the nine
//  categories evenly. Hands are not evenly distributed, so over forty thousand
//  flops:
//
//      p25 0.102   p50 0.111   p75 0.176   p90 0.222
//      reaching 0.40, the tight bots' calling bar:  1.6%
//
//  So a rock folded 98.4% of flops whatever it held, and the numbers in
//  PROFILES had never meant what their comments said. "Waits for a hand, then
//  takes your stack" was, in practice, "folds".
//
//  It is the share of hands beaten now, from the published seven card
//  frequencies, which is what a poker player means by a strong hand. Nothing
//  in PROFILES had to move: the thresholds finally mean what they always
//  claimed.
//
//  ---------------------------------------------------------------------------
//  MEASURED, IN REAL DEALT HANDS
//  ---------------------------------------------------------------------------
//                          before    after
//      bot folds            62%       32%
//      bot calls            37%       46%
//      bot raises            2%       22%
//
//  Which answers the original question: they were folding a lot, and it was
//  not because the hand was bad. It was because they could not see it.
// ============================================================================

import { bestHand, handStrength, holeStrength } from './pokerHand';
import { PROFILES } from './pokerBots';
import { freshDeck, shuffle, type Card } from './blackjack';

const C = (rank: string, suit: string): Card => ({ rank, suit, value: 0 } as unknown as Card);

describe('two cards are worth something before the flop', () => {
    it('aces are not the same as seven deuce', () => {
        // THE DEFECT, in one line. Both were 0.0000.
        const aces = holeStrength([C('A', '♠'), C('A', '♥')]);
        const rags = holeStrength([C('7', '♠'), C('2', '♥')]);
        expect(aces).toBeGreaterThan(0.8);
        expect(rags).toBeLessThan(0.25);
        expect(aces).toBeGreaterThan(rags * 3);
    });

    it('and a pair beats two unpaired cards of the same height', () => {
        expect(holeStrength([C('9', '♠'), C('9', '♥')]))
            .toBeGreaterThan(holeStrength([C('9', '♠'), C('8', '♥')]));
    });

    it('and a higher pair beats a lower one', () => {
        const ranks = ['2', '5', '9', 'J', 'A'];
        let last = -1;
        for (const r of ranks) {
            const v = holeStrength([C(r, '♠'), C(r, '♥')]);
            expect(v).toBeGreaterThan(last);
            last = v;
        }
    });

    it('and suited is worth a little more than offsuit, but only a little', () => {
        const suited = holeStrength([C('A', '♠'), C('K', '♠')]);
        const off = holeStrength([C('A', '♠'), C('K', '♥')]);
        expect(suited).toBeGreaterThan(off);
        expect(suited - off).toBeLessThan(0.12);
    });

    it('and the premium hands clear the tight bots" bars without retuning them', () => {
        // The scale was calibrated to the thresholds that already existed,
        // rather than the thresholds being moved to fit a new scale.
        expect(holeStrength([C('A', '♠'), C('A', '♥')])).toBeGreaterThan(PROFILES.surgeon.raiseAt);
        expect(holeStrength([C('A', '♠'), C('K', '♠')])).toBeGreaterThan(PROFILES.surgeon.raiseAt);
        expect(holeStrength([C('7', '♠'), C('2', '♥')])).toBeLessThan(PROFILES.maniac.playAt + 0.05);
    });

    it('and nonsense cannot produce a hand out of nothing', () => {
        expect(holeStrength([])).toBe(0);
        expect(holeStrength([C('A', '♠')])).toBe(0);
        expect(Number.isFinite(holeStrength([C('?', '♠'), C('A', '♥')]))).toBe(true);
    });
});

describe('and strength means the share of hands you beat', () => {
    const strengthOfFlop = () => {
        const d = shuffle(freshDeck());
        const hole = [d.pop()!, d.pop()!];
        return handStrength(bestHand(hole, [d.pop()!, d.pop()!, d.pop()!]));
    };

    it('a real proportion of flops now reach the tight calling bar', () => {
        // THE DEFECT. It was 1.6%, so a rock folded 98.4% of flops whatever
        // it held.
        let clear = 0;
        const N = 20_000;
        for (let i = 0; i < N; i++) if (strengthOfFlop() >= PROFILES.rock.playAt) clear++;
        const share = clear / N;
        expect(share).toBeGreaterThan(0.12);
        expect(share).toBeLessThan(0.45);
    });

    it('and the categories climb in the right order', () => {
        const pair = handStrength({ category: 1, score: [1, 10], name: 'Pair' } as any);
        const twoPair = handStrength({ category: 2, score: [2, 10], name: 'Two Pair' } as any);
        const boat = handStrength({ category: 6, score: [6, 10], name: 'Full House' } as any);
        expect(pair).toBeLessThan(twoPair);
        expect(twoPair).toBeLessThan(boat);
        expect(boat).toBeGreaterThan(0.9);
    });

    it('and a high pair is stronger than a low one without becoming two pair', () => {
        const low = handStrength({ category: 1, score: [1, 3], name: 'Pair' } as any);
        const high = handStrength({ category: 1, score: [1, 14], name: 'Pair' } as any);
        const twoPairFloor = handStrength({ category: 2, score: [2, 2], name: 'Two Pair' } as any);
        expect(high).toBeGreaterThan(low);
        expect(high).toBeLessThanOrEqual(twoPairFloor);
    });

    it('and it stays inside nought and one whatever it is handed', () => {
        for (const bad of [{}, { category: 99, score: [] }, { category: -1, score: [NaN] }]) {
            const v = handStrength(bad as any);
            expect(Number.isFinite(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });
});
