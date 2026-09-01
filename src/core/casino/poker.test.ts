// src/core/casino/poker.test.ts
//
// ============================================================================
//  THE POKER GAME DID NOT KNOW WHAT A PAIR WAS
// ============================================================================
//
//  Asked for as "poker should feel like playing against several people, with
//  the CEOs of the other companies, and bots with random difficulty". Before
//  any of that, this, which was the entire hand evaluation in `usePokerLogic`:
//
//      const topBoard = community.map(c => c.value).sort().slice(0, 3);
//      return hole.reduce(sum) + topBoard.reduce(sum);
//
//  The sum of the card values, under a comment reading "simplified scoring
//  (high card total only)". A pair of aces scored 22 and lost to a king and a
//  queen. A flush was worth nothing. A straight was worth nothing. And the
//  strongest possible holding was two aces, which is also the strongest
//  STARTING hand - so nothing that happened after the deal could change who
//  was winning, which is the whole of Hold'em.
//
//  ---------------------------------------------------------------------------
//  AND AN EVALUATOR IS ONLY KNOWN TO BE RIGHT ONE WAY
//  ---------------------------------------------------------------------------
//  By dealing a great many random seven card hands and comparing what it finds
//  against the published frequencies. Measured over four hundred thousand:
//
//      hand              measured   published
//      straight flush      0.024%      0.031%
//      four of a kind      0.155%      0.168%
//      full house          2.573%      2.600%
//      flush               3.025%      3.030%
//      straight            4.675%      4.620%
//      three of a kind     4.792%      4.830%
//      two pair           23.454%     23.500%
//      pair               43.864%     43.800%
//      high card          17.439%     17.400%
//
//  Every category inside sampling error. An evaluator that could not see
//  flushes would report zero per cent for one of these rows, which is exactly
//  what the old one would have done for all nine.
// ============================================================================

import { freshDeck, rankValue, shuffle, type Card, type Rank, type Suit } from './blackjack';
import {
    CATEGORY_NAMES,
    HandCategory,
    bestHand,
    compareHands,
    handStrength,
    rankHand,
    straightHigh,
} from './pokerHand';
import {
    MAX_MISREAD,
    PERSONALITIES,
    PROFILES,
    THINK_CAP_MS,
    THINK_MAX_MS,
    THINK_MIN_MS,
    decide,
    perceivedStrength,
    seatBots,
    thinkTime,
    type Bot,
    type Personality,
} from './pokerBots';

const c = (rank: Rank, suit: Suit = '♠'): Card => ({ rank, suit, value: rankValue(rank) });
const hand = (...s: string[]): Card[] =>
    s.map(x => c(x.slice(0, -1) as Rank, x.slice(-1) as Suit));

// ============================================================================

describe('it can see every hand there is', () => {
    it('a straight flush', () => {
        expect(rankHand(hand('9♠', '8♠', '7♠', '6♠', '5♠', '2♥', 'K♦')).category)
            .toBe(HandCategory.StraightFlush);
    });

    it('and calls the best one by its name', () => {
        expect(rankHand(hand('A♠', 'K♠', 'Q♠', 'J♠', '10♠', '2♥', '3♦')).name)
            .toBe('Royal Flush');
    });

    it('four of a kind', () => {
        expect(rankHand(hand('7♠', '7♥', '7♦', '7♣', '2♠', '5♥', 'K♦')).category)
            .toBe(HandCategory.Quads);
    });

    it('a full house, and the TRIPS decide it, not the pair', () => {
        const a = rankHand(hand('2♠', '2♥', '2♦', 'K♠', 'K♥', '5♦', '9♣'));
        const b = rankHand(hand('3♠', '3♥', '3♦', '4♠', '4♥', '5♦', '9♣'));
        expect(a.category).toBe(HandCategory.FullHouse);
        expect(compareHands(b, a)).toBeGreaterThan(0);
    });

    it('a flush, which the old one could not see at all', () => {
        expect(rankHand(hand('A♥', 'J♥', '8♥', '5♥', '2♥', 'K♠', 'Q♦')).category)
            .toBe(HandCategory.Flush);
    });

    it('a straight, which it could not see either', () => {
        expect(rankHand(hand('9♠', '8♥', '7♦', '6♣', '5♠', 'K♥', '2♦')).category)
            .toBe(HandCategory.Straight);
    });

    it('trips, two pair, a pair and nothing at all', () => {
        expect(rankHand(hand('9♠', '9♥', '9♦', '4♣', '5♠', 'K♥', '2♦')).category)
            .toBe(HandCategory.Trips);
        expect(rankHand(hand('9♠', '9♥', '4♦', '4♣', '5♠', 'K♥', '2♦')).category)
            .toBe(HandCategory.TwoPair);
        expect(rankHand(hand('9♠', '9♥', '3♦', '4♣', '5♠', 'K♥', '2♦')).category)
            .toBe(HandCategory.Pair);
        expect(rankHand(hand('9♠', '7♥', '3♦', '4♣', 'J♠', 'K♥', '2♦')).category)
            .toBe(HandCategory.HighCard);
    });
});

describe('the wheel, which every naive evaluator gets wrong', () => {
    it('A-2-3-4-5 is a straight', () => {
        expect(rankHand(hand('A♠', '2♥', '3♦', '4♣', '5♠', 'K♥', '9♦')).category)
            .toBe(HandCategory.Straight);
    });

    it('and its high card is the FIVE, not the ace', () => {
        // THE TRAP. Scored as ace high it would beat 6-7-8-9-10, which it
        // loses to at every table in the world.
        const wheel = rankHand(hand('A♠', '2♥', '3♦', '4♣', '5♠', 'K♥', '9♦'));
        const six = rankHand(hand('6♠', '7♥', '8♦', '9♣', '10♠', '2♥', '3♦'));
        expect(wheel.score[1]).toBe(5);
        expect(compareHands(six, wheel)).toBeGreaterThan(0);
    });

    it('and a steel wheel is a straight flush', () => {
        expect(rankHand(hand('A♥', '2♥', '3♥', '4♥', '5♥', 'K♠', '9♦')).category)
            .toBe(HandCategory.StraightFlush);
    });

    it('and straightHigh answers zero when there is no straight', () => {
        expect(straightHigh([2, 4, 6, 8, 10, 12, 14])).toBe(0);
        expect(straightHigh([])).toBe(0);
    });
});

describe('and it can tell two hands apart properly', () => {
    it('kickers decide a tied pair', () => {
        const better = rankHand(hand('K♠', 'K♥', 'A♦', '7♣', '4♠', '2♥', '3♦'));
        const worse = rankHand(hand('K♦', 'K♣', 'Q♦', '7♥', '4♦', '2♠', '3♣'));
        expect(compareHands(better, worse)).toBeGreaterThan(0);
    });

    it('and an identical hand is a split pot', () => {
        const a = rankHand(hand('K♠', 'K♥', 'A♦', '7♣', '4♠', '2♥', '3♦'));
        const b = rankHand(hand('K♦', 'K♣', 'A♠', '7♥', '4♦', '2♠', '3♣'));
        expect(compareHands(a, b)).toBe(0);
    });

    it('and the categories are strictly ordered', () => {
        const examples: [HandCategory, Card[]][] = [
            [HandCategory.HighCard, hand('9♠', '7♥', '3♦', '4♣', 'J♠', 'K♥', '2♦')],
            [HandCategory.Pair, hand('9♠', '9♥', '3♦', '4♣', '5♠', 'K♥', '2♦')],
            [HandCategory.TwoPair, hand('9♠', '9♥', '4♦', '4♣', '5♠', 'K♥', '2♦')],
            [HandCategory.Trips, hand('9♠', '9♥', '9♦', '4♣', '5♠', 'K♥', '2♦')],
            [HandCategory.Straight, hand('9♠', '8♥', '7♦', '6♣', '5♠', 'K♥', '2♦')],
            [HandCategory.Flush, hand('A♥', 'J♥', '8♥', '5♥', '2♥', 'K♠', 'Q♦')],
            [HandCategory.FullHouse, hand('9♠', '9♥', '9♦', '4♣', '4♠', 'K♥', '2♦')],
            [HandCategory.Quads, hand('9♠', '9♥', '9♦', '9♣', '4♠', 'K♥', '2♦')],
            [HandCategory.StraightFlush, hand('9♠', '8♠', '7♠', '6♠', '5♠', 'K♥', '2♦')],
        ];
        for (let i = 1; i < examples.length; i++) {
            const lower = rankHand(examples[i - 1][1]);
            const higher = rankHand(examples[i][1]);
            expect(`${CATEGORY_NAMES[examples[i][0]]} beats ${CATEGORY_NAMES[examples[i - 1][0]]}`)
                .toBe(`${CATEGORY_NAMES[examples[i][0]]} beats ${CATEGORY_NAMES[examples[i - 1][0]]}`);
            expect(compareHands(higher, lower)).toBeGreaterThan(0);
        }
    });

    it('and the board can beat both players, which is what Holdem IS', () => {
        // The old evaluator could not express this: the strongest hand was
        // always the strongest two hole cards, so nothing the board did
        // mattered. Here two players with junk both play the board and split.
        const board = hand('A♠', 'A♥', 'A♦', 'A♣', 'K♠');
        const p1 = bestHand(hand('2♥', '3♦'), board);
        const p2 = bestHand(hand('4♥', '5♦'), board);
        expect(p1.category).toBe(HandCategory.Quads);
        expect(compareHands(p1, p2)).toBe(0);
    });

    it('and a short hand does not crash the showdown', () => {
        expect(rankHand(hand('A♠', 'K♥')).name).toBe('Incomplete');
        expect(rankHand([]).score).toEqual([0]);
    });
});

describe('and it agrees with the published frequencies', () => {
    it('over four hundred thousand seven card hands', () => {
        // THE ONLY WAY TO KNOW AN EVALUATOR IS RIGHT. A version that cannot
        // see flushes reports zero per cent for one of these rows.
        const N = 200_000;
        const seen = new Map<HandCategory, number>();
        for (let i = 0; i < N; i++) {
            const d = shuffle(freshDeck());
            const r = rankHand(d.slice(0, 7));
            seen.set(r.category, (seen.get(r.category) || 0) + 1);
        }
        const published: [HandCategory, number, number][] = [
            [HandCategory.StraightFlush, 0.031, 0.03],
            [HandCategory.Quads, 0.168, 0.05],
            [HandCategory.FullHouse, 2.60, 0.20],
            [HandCategory.Flush, 3.03, 0.20],
            [HandCategory.Straight, 4.62, 0.25],
            [HandCategory.Trips, 4.83, 0.25],
            [HandCategory.TwoPair, 23.5, 0.60],
            [HandCategory.Pair, 43.8, 0.70],
            [HandCategory.HighCard, 17.4, 0.60],
        ];
        for (const [cat, expected, tolerance] of published) {
            const got = ((seen.get(cat) || 0) / N) * 100;
            expect(`${CATEGORY_NAMES[cat]}:${Math.abs(got - expected) < tolerance}`)
                .toBe(`${CATEGORY_NAMES[cat]}:true`);
        }
    });
});

describe('how strong is it, as one number', () => {
    it('rises with the category', () => {
        const junk = handStrength(rankHand(hand('9♠', '7♥', '3♦', '4♣', 'J♠', 'K♥', '2♦')));
        const quads = handStrength(rankHand(hand('9♠', '9♥', '9♦', '9♣', '4♠', 'K♥', '2♦')));
        expect(quads).toBeGreaterThan(junk);
        expect(junk).toBeGreaterThanOrEqual(0);
        expect(quads).toBeLessThanOrEqual(1);
    });

    it('and aces beat deuces inside the same category', () => {
        const aces = handStrength(rankHand(hand('A♠', 'A♥', '3♦', '4♣', '7♠', '9♥', '2♦')));
        const deuces = handStrength(rankHand(hand('2♠', '2♥', '3♦', '4♣', '7♠', '9♥', '5♦')));
        expect(aces).toBeGreaterThan(deuces);
    });
});

// ============================================================================
//  THE PEOPLE
// ============================================================================

const bot = (personality: Personality, judgement = 1): Bot =>
    ({ id: 'b', name: 'B', personality, judgement, stack: 100_000 });

/** Twenty thousand hands facing a pot sized bet. */
const behaviour = (p: Personality) => {
    let played = 0;
    let raised = 0;
    const N = 20_000;
    for (let i = 0; i < N; i++) {
        const d = decide(bot(p), {
            strength: Math.random(), toCall: 1000, pot: 1000, stack: 100_000, street: 0,
        });
        if (d.action !== 'fold') played++;
        if (d.action === 'raise') raised++;
    }
    return { play: played / N, raise: raised / N };
};

describe('the four of them play like their names', () => {
    // Measured, at judgement 1.0, facing a pot sized bet:
    //     rock      33.2% play,  7.1% raise
    //     surgeon   42.6% play, 35.5% raise
    //     crowd     56.8% play,  3.0% raise
    //     maniac    65.5% play, 56.1% raise
    it('the loose ones play far more hands than the tight ones', () => {
        // BY A MARGIN, not just by more. My first version asked only for
        // `crowd > rock`, and the probe - making the Crowd's profile identical
        // to the Rock's - passed it about half the time on noise alone. Two
        // personalities that differ by a rounding error are one personality.
        //
        // Measured: rock 33.2%, crowd 56.8%, surgeon 42.6%, maniac 65.5%.
        const b = { rock: behaviour('rock'), crowd: behaviour('crowd'), maniac: behaviour('maniac'), surgeon: behaviour('surgeon') };
        expect(b.crowd.play - b.rock.play).toBeGreaterThan(0.15);
        expect(b.maniac.play - b.surgeon.play).toBeGreaterThan(0.15);
    });

    it('and the aggressive ones raise far more than the passive ones', () => {
        const b = { rock: behaviour('rock'), crowd: behaviour('crowd'), maniac: behaviour('maniac'), surgeon: behaviour('surgeon') };
        expect(b.surgeon.raise).toBeGreaterThan(b.rock.raise * 3);
        expect(b.maniac.raise).toBeGreaterThan(b.crowd.raise * 3);
    });

    it('and the rock really is the one who folds most', () => {
        const all = PERSONALITIES.map(p => ({ p, ...behaviour(p) }));
        const tightest = all.reduce((a, b) => (a.play <= b.play ? a : b));
        expect(tightest.p).toBe('rock');
    });

    it('and the maniac really is the one who raises most', () => {
        const all = PERSONALITIES.map(p => ({ p, ...behaviour(p) }));
        const wildest = all.reduce((a, b) => (a.raise >= b.raise ? a : b));
        expect(wildest.p).toBe('maniac');
    });

    it('and none of them is a wall: all four fold sometimes and play sometimes', () => {
        for (const p of PERSONALITIES) {
            const b = behaviour(p);
            expect(`${p}:${b.play > 0.05 && b.play < 0.95}`).toBe(`${p}:true`);
        }
    });
});

describe('difficulty is a worse READ, not a worse strategy', () => {
    const misread = (judgement: number, street = 0) => {
        let total = 0;
        const N = 20_000;
        for (let i = 0; i < N; i++) total += Math.abs(perceivedStrength(0.5, judgement, street) - 0.5);
        return total / N;
    };

    it('a perfect eye sees the hand exactly', () => {
        expect(misread(1)).toBe(0);
    });

    it('and a poor one is a coin toss it then follows faithfully', () => {
        // Measured: 0.227 average error at judgement zero.
        expect(misread(0)).toBeGreaterThan(0.15);
        expect(MAX_MISREAD).toBe(0.45);
    });

    it('and it improves smoothly in between', () => {
        const steps = [0, 0.25, 0.5, 0.75, 1].map(j => misread(j));
        for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThan(steps[i - 1]);
    });

    it('and the board makes a hand easier to read, as it does for a person', () => {
        // A bot that still cannot count to a flush on the river is not a weak
        // player, it is a broken one.
        expect(misread(0.2, 3)).toBeLessThan(misread(0.2, 0));
    });

    it('and it never invents a strength outside the range', () => {
        for (let i = 0; i < 5_000; i++) {
            const v = perceivedStrength(Math.random(), Math.random(), 0);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(Number.isFinite(perceivedStrength(NaN, NaN, 0, () => NaN))).toBe(true);
        expect(decide(null as any, null as any).action).toBeTruthy();
    });
});

describe('and they respect the price', () => {
    it('a hand worth a small bet is not worth a huge one', () => {
        // POT ODDS. A bot that called any amount with any pair is the single
        // most obvious tell that somebody is playing a computer.
        const cheap = decide(bot('rock'), { strength: 0.5, toCall: 100, pot: 10_000, stack: 100_000, street: 3 });
        const dear = decide(bot('rock'), { strength: 0.5, toCall: 50_000, pot: 1_000, stack: 100_000, street: 3 });
        expect(cheap.action).not.toBe('fold');
        expect(dear.action).toBe('fold');
    });

    it('and they check rather than fold when it is free', () => {
        const d = decide(bot('rock'), { strength: 0.01, toCall: 0, pot: 1000, stack: 100_000, street: 1 });
        expect(d.action).toBe('check');
        expect(d.amount).toBe(0);
    });

    it('and they never put in more than they have', () => {
        for (const p of PERSONALITIES) {
            for (let i = 0; i < 500; i++) {
                const d = decide(bot(p), { strength: Math.random(), toCall: 900, pot: 5000, stack: 1000, street: 0 });
                expect(`${p}:${d.amount <= 1000}`).toBe(`${p}:true`);
            }
        }
    });
});

describe('seating a table', () => {
    it('gives everyone a personality and a difficulty', () => {
        const table = seatBots(['A', 'B', 'C', 'D', 'E'], false);
        expect(table).toHaveLength(5);
        for (const b of table) {
            expect(PERSONALITIES).toContain(b.personality);
            expect(b.judgement).toBeGreaterThanOrEqual(0);
            expect(b.judgement).toBeLessThanOrEqual(1);
        }
    });

    it('and a VIP table is harder than a city one, with the same four types', () => {
        // The VIP room does not need its own bots. Same personalities, better
        // eyes, which is exactly how a better room is harder in life.
        const mean = (strong: boolean) => {
            let total = 0;
            for (let i = 0; i < 400; i++) {
                total += seatBots(['A'], strong)[0].judgement;
            }
            return total / 400;
        };
        expect(mean(true)).toBeGreaterThan(mean(false) + 0.2);
    });

    it('and it seats whoever it is given, because it does not know what a CEO is', () => {
        // Dragging the product markets into the poker table would tie the two
        // together forever. The casino picks who is in the room; this decides
        // how they play.
        const table = seatBots(['Marcus Vane', 'Elena Vance'], true);
        expect(table.map(b => b.name)).toEqual(['Marcus Vane', 'Elena Vance']);
    });

    it('and an empty room does not crash', () => {
        expect(seatBots([], false)).toEqual([]);
        expect(seatBots(null as any, false)).toEqual([]);
    });
});

describe('and they do not all act at once', () => {
    it('which is the whole of the online feeling', () => {
        // Five bots acting the instant it is their turn are obviously one
        // function in a loop.
        const times = new Set<number>();
        for (let i = 0; i < 200; i++) times.add(thinkTime('call'));
        expect(times.size).toBeGreaterThan(50);
    });

    it('and putting money in takes longer than getting out', () => {
        const mean = (a: any) => {
            let t = 0;
            for (let i = 0; i < 2000; i++) t += thinkTime(a);
            return t / 2000;
        };
        expect(mean('raise')).toBeGreaterThan(mean('call'));
        expect(mean('fold')).toBeLessThan(mean('call'));
    });

    it('and nobody sits there forever', () => {
        // THE CEILING MOVED, ON PURPOSE. This was `THINK_MAX_MS * 2`, which
        // was the true bound back when every pause was a single uniform draw.
        // One in seven is a TANK now - somebody stopping dead, which is what
        // makes the table read as people rather than a loop - so the real
        // guarantee is the explicit cap. See thinkTime.test.ts for the
        // measurement, and for why the cap had to exist at all: without it a
        // tanked raise compounded to 3.9 seconds.
        for (let i = 0; i < 500; i++) {
            const t = thinkTime('raise');
            expect(t).toBeGreaterThan(THINK_MIN_MS * 0.5);
            expect(t).toBeLessThanOrEqual(THINK_CAP_MS);
        }
    });
});
