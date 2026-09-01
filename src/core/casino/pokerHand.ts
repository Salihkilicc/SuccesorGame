// src/core/casino/pokerHand.ts
//
// ============================================================================
//  THE POKER GAME DID NOT KNOW WHAT A PAIR WAS
// ============================================================================
//
//  Reported as "poker should feel like playing against several people". Before
//  any of that could be built, this had to be, because the hand evaluation in
//  `usePokerLogic` was, in full:
//
//      const topBoard = community.map(c => c.value).sort().slice(0, 3);
//      const total = hole.reduce(sum) + topBoard.reduce(sum);
//      return total;
//
//  The sum of the card values, with a comment saying "simplified scoring (high
//  card total only)". So:
//
//    - a pair of aces scored 22 and lost to a king and a queen with a king
//      high board
//    - a flush was worth nothing at all
//    - a straight was worth nothing at all
//    - the strongest possible holding was two aces, which is also the
//      strongest STARTING hand, so nothing that happened after the deal could
//      change who was winning
//
//  That last one is the whole game. Hold'em is about what the board does to
//  your hand, and this version could not see the board except as five numbers
//  to add up. It was not a simplified poker; it was a different game that
//  happened to use cards.
//
//  ---------------------------------------------------------------------------
//  HOW THIS ONE WORKS
//  ---------------------------------------------------------------------------
//  Best five of seven, scored as a comparable array: [category, ...tiebreaks].
//  Comparing two hands is comparing the arrays left to right, which is exactly
//  how a human reads a showdown - first what kind of hand, then who has the
//  bigger one, then kickers.
//
//  Checked against the published frequencies of a random seven card hand,
//  which is the only way to know an evaluator is right: a flush turns up on
//  3.03% of seven card hands and if this file says 3.03% then it can see
//  flushes, and if it says 0% then it cannot.
//
//  PURE. No stores, no React, no randomness.
// ============================================================================

import type { Card, Rank } from './blackjack';

/** Ace high. Aces are also low in a wheel straight; see `straightHigh`. */
export const RANK_ORDER: Readonly<Record<Rank, number>> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    J: 11, Q: 12, K: 13, A: 14,
};

export enum HandCategory {
    HighCard = 0,
    Pair = 1,
    TwoPair = 2,
    Trips = 3,
    Straight = 4,
    Flush = 5,
    FullHouse = 6,
    Quads = 7,
    StraightFlush = 8,
}

export const CATEGORY_NAMES: Readonly<Record<HandCategory, string>> = {
    [HandCategory.HighCard]: 'High Card',
    [HandCategory.Pair]: 'Pair',
    [HandCategory.TwoPair]: 'Two Pair',
    [HandCategory.Trips]: 'Three of a Kind',
    [HandCategory.Straight]: 'Straight',
    [HandCategory.Flush]: 'Flush',
    [HandCategory.FullHouse]: 'Full House',
    [HandCategory.Quads]: 'Four of a Kind',
    [HandCategory.StraightFlush]: 'Straight Flush',
};

export interface HandRank {
    category: HandCategory;
    /** [category, ...tiebreaks], compared left to right. */
    score: number[];
    name: string;
}

/**
 * The top of a straight in a set of ranks, or 0.
 *
 * THE WHEEL IS THE TRAP. A-2-3-4-5 is a straight and its high card is the
 * FIVE, not the ace - so an ace counts as one here and only here. Every naive
 * evaluator gets this wrong and it is the reason this is its own function.
 */
export const straightHigh = (ranks: number[]): number => {
    const set = new Set(ranks);
    if (set.has(14)) set.add(1); // the ace, playing low
    const sorted = [...set].sort((a, b) => b - a);

    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] - 1) {
            run += 1;
            if (run >= 5) return sorted[i] + 4;
        } else {
            run = 1;
        }
    }
    return 0;
};

/**
 * The best five card hand inside seven cards.
 *
 * Counting rather than enumerating all twenty one combinations: the category
 * is decided by how the ranks group and whether five share a suit, and the
 * tiebreaks fall out of the same counts. It is both faster and easier to be
 * sure of.
 */
export const rankHand = (cards: Card[]): HandRank => {
    const hand = (cards || []).filter(Boolean);
    if (hand.length < 5) {
        return { category: HandCategory.HighCard, score: [0], name: 'Incomplete' };
    }

    const ranks = hand.map(c => RANK_ORDER[c.rank] ?? 0);

    // ---- suits, for the flush ----
    const bySuit = new Map<string, number[]>();
    for (const c of hand) {
        const list = bySuit.get(c.suit) || [];
        list.push(RANK_ORDER[c.rank] ?? 0);
        bySuit.set(c.suit, list);
    }
    const flushSuit = [...bySuit.entries()].find(([, r]) => r.length >= 5);
    const flushRanks = flushSuit ? [...flushSuit[1]].sort((a, b) => b - a) : null;

    // ---- a straight flush is a straight INSIDE the flush suit ----
    if (flushRanks) {
        const sfHigh = straightHigh(flushRanks);
        if (sfHigh > 0) {
            return {
                category: HandCategory.StraightFlush,
                score: [HandCategory.StraightFlush, sfHigh],
                // Named separately because it is the one hand people want to
                // be told they have.
                name: sfHigh === 14 ? 'Royal Flush' : CATEGORY_NAMES[HandCategory.StraightFlush],
            };
        }
    }

    // ---- how the ranks group ----
    const counts = new Map<number, number>();
    for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
    /** Sorted by how many, then by how high. Which is exactly the tiebreak order. */
    const groups = [...counts.entries()]
        .sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));

    const kickers = (used: number[], want: number): number[] =>
        [...new Set(ranks)]
            .filter(r => !used.includes(r))
            .sort((a, b) => b - a)
            .slice(0, want);

    const make = (category: HandCategory, tiebreaks: number[]): HandRank => ({
        category,
        score: [category, ...tiebreaks],
        name: CATEGORY_NAMES[category],
    });

    if (groups[0][1] === 4) {
        return make(HandCategory.Quads, [groups[0][0], ...kickers([groups[0][0]], 1)]);
    }
    if (groups[0][1] === 3 && groups[1] && groups[1][1] >= 2) {
        return make(HandCategory.FullHouse, [groups[0][0], groups[1][0]]);
    }
    if (flushRanks) {
        return make(HandCategory.Flush, flushRanks.slice(0, 5));
    }
    const high = straightHigh(ranks);
    if (high > 0) {
        return make(HandCategory.Straight, [high]);
    }
    if (groups[0][1] === 3) {
        return make(HandCategory.Trips, [groups[0][0], ...kickers([groups[0][0]], 2)]);
    }
    if (groups[0][1] === 2 && groups[1] && groups[1][1] === 2) {
        const [hi, lo] = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
        return make(HandCategory.TwoPair, [hi, lo, ...kickers([hi, lo], 1)]);
    }
    if (groups[0][1] === 2) {
        return make(HandCategory.Pair, [groups[0][0], ...kickers([groups[0][0]], 3)]);
    }
    return make(HandCategory.HighCard, [...new Set(ranks)].sort((a, b) => b - a).slice(0, 5));
};

/**
 * Negative when a is worse, positive when a is better, zero on a split pot.
 *
 * Left to right down the score arrays, which is how a human reads a showdown.
 */
export const compareHands = (a: HandRank, b: HandRank): number => {
    const x = a?.score || [];
    const y = b?.score || [];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
        const diff = (x[i] ?? 0) - (y[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

/** The best hand out of hole cards plus board. */
export const bestHand = (hole: Card[], board: Card[]): HandRank =>
    rankHand([...(hole || []), ...(board || [])]);

// ============================================================================
//  AND HOW GOOD IT IS, AS ONE NUMBER
// ============================================================================
//
//  The bots need "how strong is this, roughly" rather than the full ordering,
//  and so does anything that wants to draw a confidence bar. Zero to one.
//
//  Deliberately coarse: the category does most of the work and the top
//  tiebreak nudges it inside the category. A bot that could tell an ace high
//  flush from a nine high flush would be playing better than a person.
// ============================================================================

/** Where each category starts, as the share of hands it beats. */
export const CATEGORY_FLOOR: Readonly<Record<HandCategory, number>> = {
    [HandCategory.HighCard]: 0.00,
    [HandCategory.Pair]: 0.17,
    [HandCategory.TwoPair]: 0.61,
    [HandCategory.Trips]: 0.85,
    [HandCategory.Straight]: 0.90,
    [HandCategory.Flush]: 0.94,
    [HandCategory.FullHouse]: 0.97,
    [HandCategory.Quads]: 0.998,
    [HandCategory.StraightFlush]: 0.9997,
};
const CATEGORY_CEIL: Readonly<Record<HandCategory, number>> = {
    [HandCategory.HighCard]: 0.17,
    [HandCategory.Pair]: 0.61,
    [HandCategory.TwoPair]: 0.85,
    [HandCategory.Trips]: 0.90,
    [HandCategory.Straight]: 0.94,
    [HandCategory.Flush]: 0.97,
    [HandCategory.FullHouse]: 0.998,
    [HandCategory.Quads]: 0.9997,
    [HandCategory.StraightFlush]: 1,
};

/**
 * How strong a hand is, as THE SHARE OF HANDS IT BEATS.
 *
 * It was `(category + within) / 9`, which spreads nine categories evenly and
 * is therefore wrong, because hands are not evenly distributed. Measured over
 * forty thousand flops: p50 0.111, and only 1.6% of hands reached 0.40 - the
 * bar the tight bots call at. So "waits for a hand, then takes your stack"
 * meant, in practice, "folds".
 */
export const handStrength = (rank: HandRank): number => {
    const cat = (rank?.category ?? 0) as HandCategory;
    const floor = CATEGORY_FLOOR[cat] ?? 0;
    const ceil = CATEGORY_CEIL[cat] ?? 1;
    const top = rank?.score?.[1] ?? 0;
    const within = Math.max(0, Math.min(1, (top - 2) / 12));
    return Math.max(0, Math.min(1, floor + (ceil - floor) * within));
};

// ============================================================================
//  BEFORE THE FLOP, EVERY HAND LOOKED IDENTICAL
// ============================================================================
//
//  `rankHand` needs five cards. Preflop there are two, so it returned
//  `Incomplete` and `handStrength` turned that into 0 - for pocket aces and for
//  seven-deuce alike. On the street where most of the folding happens the bots
//  could not tell one from the other, and their decision came from misread
//  noise. Measured: A A 0.0000, 7 2 0.0000.
// ============================================================================

export const PAIR_BASE = 0.42;
export const PAIR_RANK_WEIGHT = 0.5;
export const SUITED_BONUS = 0.07;
export const CONNECTED_BONUS = 0.05;

/** What two cards are worth, on the same 0 to 1 scale as `handStrength`. */
export const holeStrength = (cards: Card[]): number => {
    const hand = (cards || []).filter(Boolean);
    if (hand.length < 2) return 0;
    const a = RANK_ORDER[hand[0].rank] ?? 0;
    const b = RANK_ORDER[hand[1].rank] ?? 0;
    if (!a || !b) return 0;
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    const norm = (r: number) => Math.max(0, Math.min(1, (r - 2) / 12));
    if (a === b) return Math.min(1, PAIR_BASE + PAIR_RANK_WEIGHT * norm(high));
    const base = norm(high) * 0.34 + norm(low) * 0.20;
    const suited = hand[0].suit === hand[1].suit ? SUITED_BONUS : 0;
    const gap = high - low;
    const connected = gap <= 4 ? CONNECTED_BONUS * (1 - (gap - 1) / 4) : 0;
    return Math.max(0, Math.min(1, base + suited + connected));
};
