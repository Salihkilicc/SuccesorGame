// src/core/casino/blackjack.ts
//
// ============================================================================
//  THE TABLE, SEPARATED FROM THE SHOW
// ============================================================================
//
//  Third of the four engines. `useBlackjackLogic` held a deck in component
//  state, shuffled it with `Math.random` inline, counted aces in a `useMemo`,
//  ran the dealer's whole draw inside the `stand` handler and paid out from a
//  closure over `money`. None of it could be tested and none of it could be
//  animated: the dealer's cards all appear at once because the loop that draws
//  them is a `while` inside an event handler.
//
//  This file answers three questions and holds nothing:
//
//      what is this hand worth        handValue
//      what does the dealer do        dealerPlay
//      who gets the money             settle
//
//  Separating the dealer's draw matters most. `dealerPlay` returns the cards
//  IN ORDER, so the screen can lay them down one at a time - which is the
//  whole of "there should be a table in the middle and it should feel real".
//  The old code could not do that because by the time the handler returned,
//  the dealer had already finished.
//
//  PURE. No stores, no timers, no React, and the shuffle is injected.
// ============================================================================

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank =
    | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
    | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    rank: Rank;
    suit: Suit;
    /** Face value. An ace counts eleven here and is demoted by `handValue`. */
    value: number;
}

export const SUITS: readonly Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: readonly Rank[] = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
];

export const rankValue = (rank: Rank): number => {
    if (rank === 'A') return 11;
    if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
    return parseInt(rank, 10);
};

/** An unshuffled fifty two. */
export const freshDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) deck.push({ rank, suit, value: rankValue(rank) });
    }
    return deck;
};

/**
 * Fisher-Yates, with the die injected.
 *
 * The old shuffle was the same algorithm written inline in the hook, which
 * meant it could not be checked - and an unfair shuffle is the one bug in a
 * card game that nobody would ever notice by playing.
 */
export const shuffle = (deck: Card[], roll: () => number = Math.random): Card[] => {
    const out = [...deck];
    for (let i = out.length - 1; i > 0; i--) {
        const raw = roll();
        const die = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
        const j = Math.floor(die * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

// ============================================================================
//  WHAT A HAND IS WORTH
// ============================================================================

export interface HandValue {
    total: number;
    /** Two cards making twenty one. Pays more, and only off the deal. */
    isBlackjack: boolean;
    /** Over twenty one. */
    isBust: boolean;
    /** An ace is still counting as eleven, so the hand cannot bust on one card. */
    isSoft: boolean;
}

export const handValue = (cards: Card[]): HandValue => {
    const hand = cards || [];
    let total = hand.reduce((sum, c) => sum + (c?.value ?? 0), 0);
    let aces = hand.filter(c => c?.rank === 'A').length;
    let softAces = aces;

    // Demote aces from eleven to one, one at a time, only as far as needed.
    while (total > 21 && softAces > 0) {
        total -= 10;
        softAces -= 1;
    }

    return {
        total,
        isBlackjack: hand.length === 2 && total === 21,
        isBust: total > 21,
        isSoft: softAces > 0,
    };
};

// ============================================================================
//  WHAT THE DEALER DOES
// ============================================================================
//
//  STANDS ON ALL SEVENTEEN, including a soft one. That is the player friendly
//  rule and it is what the old `while (total < 17)` already did; writing it
//  down because it is worth about two tenths of a per cent and because the
//  alternative - hitting soft seventeen - is the single most common house
//  variation and somebody will eventually ask which one this is.
// ============================================================================

export const DEALER_STANDS_ON = 17;

export interface DealerPlay {
    /** The dealer's full hand at the end. */
    cards: Card[];
    /**
     * The cards drawn, in the order they were drawn.
     *
     * The reason this function exists rather than a `while` loop in a click
     * handler: the screen lays these down one at a time. A dealer who arrives
     * at nineteen instantly is not a dealer, it is a number appearing.
     */
    drawn: Card[];
    /** What is left of the shoe. */
    deck: Card[];
}

export const dealerPlay = (dealerCards: Card[], deck: Card[]): DealerPlay => {
    const cards = [...(dealerCards || [])];
    const rest = [...(deck || [])];
    const drawn: Card[] = [];

    // A guard rather than a bare `while`: an empty shoe used to spin here.
    let safety = 0;
    while (handValue(cards).total < DEALER_STANDS_ON && rest.length > 0 && safety++ < 20) {
        const card = rest.pop();
        if (!card) break;
        cards.push(card);
        drawn.push(card);
    }

    return { cards, drawn, deck: rest };
};

// ============================================================================
//  WHO GETS THE MONEY
// ============================================================================

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose';

/** Total returned per unit staked. The stake is included. */
export const PAYOUT: Readonly<Record<Outcome, number>> = {
    /** Three to two, which is the classic and the reason to want a natural. */
    blackjack: 2.5,
    win: 2,
    push: 1,
    lose: 0,
};

export interface Settlement {
    outcome: Outcome;
    /** Total returned, stake included. */
    returned: number;
    /** returned - stake. Negative when the hand is lost. */
    net: number;
}

/**
 * Who won, decided from two hands rather than from six branches in a handler.
 *
 * A NATURAL BEATS A DRAWN TWENTY ONE, which the old code got right by accident
 * and only at the deal: it checked `isBlackjack` before anything else and
 * never again. Here it is checked in one place for both hands, so a player who
 * draws to twenty one against a dealer's natural loses, as they should.
 */
export const settle = (
    playerCards: Card[],
    dealerCards: Card[],
    bet: number,
): Settlement => {
    const stake = Math.max(0, Number.isFinite(bet) ? bet : 0);
    const p = handValue(playerCards);
    const d = handValue(dealerCards);

    const decide = (): Outcome => {
        if (p.isBlackjack && d.isBlackjack) return 'push';
        if (p.isBlackjack) return 'blackjack';
        if (d.isBlackjack) return 'lose';
        if (p.isBust) return 'lose';
        if (d.isBust) return 'win';
        if (p.total > d.total) return 'win';
        if (d.total > p.total) return 'lose';
        return 'push';
    };

    const outcome = decide();
    const returned = Math.round(stake * PAYOUT[outcome]);
    return { outcome, returned, net: returned - stake };
};

// ============================================================================
//  BASIC STRATEGY
// ============================================================================
//
//  Not used by the game - the player decides for themselves. It exists so the
//  house edge can be MEASURED rather than asserted, which is the question that
//  was asked out loud earlier: "is blackjack the most generous table in the
//  game, and should it be".
//
//  The simplified table, which is worth about a tenth of a per cent less than
//  the full one and fits in a paragraph:
//
//      hard 17+            stand
//      hard 13-16          stand against a dealer 2-6, otherwise hit
//      hard 12             stand against 4-6, otherwise hit
//      hard 11 or less     hit
//      soft 18             stand against 2-8, otherwise hit
//      soft 19+            stand
//      soft 17 or less     hit
// ============================================================================

export const shouldHit = (playerCards: Card[], dealerUpCard: Card): boolean => {
    const p = handValue(playerCards);
    if (p.isBust) return false;

    const up = dealerUpCard?.rank === 'A' ? 11 : (dealerUpCard?.value ?? 10);
    const dealerWeak = up >= 2 && up <= 6;

    if (p.isSoft) {
        if (p.total >= 19) return false;
        if (p.total === 18) return up >= 9 || up === 11;
        return true;
    }

    if (p.total >= 17) return false;
    if (p.total >= 13) return !dealerWeak;
    if (p.total === 12) return !(up >= 4 && up <= 6);
    return true;
};
