// src/core/casino/pokerRound.ts
//
// ============================================================================
//  A HAND OF SIX HANDED HOLD'EM, AS A STATE MACHINE
// ============================================================================
//
//  The old poker was heads up against something called "the dealer", with a
//  hand evaluation that added up card values. Putting five avatars around a
//  table without changing that would have been decoration - five faces
//  watching a two player game - which is the exact failure this codebase keeps
//  producing.
//
//  So the hand itself is multi-way. This file runs it, and it runs it as a
//  MACHINE rather than as a sequence of timers: `advance` takes a state and
//  returns the next one. The screen calls it on a delay to make the bots look
//  like they are thinking, but the hand would play out identically if it
//  called it in a loop, which is what makes it testable.
//
//  PURE. No stores, no timers, no React, and the die is injected.
// ============================================================================

import { freshDeck, shuffle, type Card } from './blackjack';
import { bestHand, compareHands, handStrength, holeStrength, type HandRank } from './pokerHand';
import { decide, type Action, type Bot } from './pokerBots';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

/** How many board cards are face up on each street. */
export const BOARD_AT: Readonly<Record<Street, number>> = {
    preflop: 0, flop: 3, turn: 4, river: 5, showdown: 5,
};

export const STREET_ORDER: readonly Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export interface Player {
    id: string;
    name: string;
    /** Null for the human, a bot for everybody else. */
    bot: Bot | null;
    hole: Card[];
    stack: number;
    /** Put in this street. */
    committed: number;
    folded: boolean;
    lastAction: Action | null;
    lastAmount: number;
    /** How many times they have acted this hand, and how many were raises. */
    acts: number;
    raises: number;
}

export interface RoundState {
    players: Player[];
    board: Card[];
    deck: Card[];
    street: Street;
    pot: number;
    /** The biggest commitment this street. What everybody has to match. */
    toMatch: number;
    /** Whose turn. Index into players. */
    turn: number;
    /** How many have acted since the last raise. The street ends at everyone. */
    actedSinceRaise: number;
    /**
     * How big the last raise was, which is the smallest the next one may be.
     *
     * THE MISSING RULE, and it made the machine spin. `applyAction` forced a
     * raise to be at least `toMatch + 1`, so once the bet was large a bot
     * whose pot sized raise came out below it raised by ONE CHIP - and four
     * bots doing that in turn reset `actedSinceRaise` forever. Found with the
     * board on the river, four seats each committed 903,010-odd against a
     * toMatch of 903,013, none of them able to close the street.
     *
     * It could not happen before, because hands never got that deep: everyone
     * folded preflop. Fixing the all in bug made deep hands normal and this
     * surfaced within two thousand of them.
     *
     * Real poker has had this rule forever, for exactly this reason: a raise
     * must be at least as big as the one before it, or a table can raise each
     * other a chip at a time until the sun goes out.
     */
    minRaise: number;
    done: boolean;
    /**
     * What the pot WAS, once it has been paid out.
     *
     * `pot` means chips in the middle RIGHT NOW and goes to zero when it is
     * won, because a state where the money is both in the middle and in
     * somebody's stack is a state where a conservation check has to guess
     * which one it means - and a test that has to guess is a test that will
     * be wrong. The screen wants the figure for its "you won X" line, so it
     * is kept here rather than left ambiguous over there.
     */
    potWon: number;
    /** Set at showdown. */
    winners: string[];
    /** Set at showdown, for the screen to name the hand. */
    reveal: { id: string; rank: HandRank }[];
}

const alive = (s: RoundState): Player[] => s.players.filter(p => !p.folded);

/** The player's seat is always index zero. */
export const HUMAN_SEAT = 0;

/**
 * Deal a hand.
 *
 * ---------------------------------------------------------------------------
 *  BLINDS, NOT ANTES, AND THE DIFFERENCE WAS AN EXPLOIT
 * ---------------------------------------------------------------------------
 *  This used to have EVERY seat post the stake, which is tidy and is not
 *  poker. With five players that makes the pot five stakes before a card is
 *  seen, so stealing it is worth four times what the steal costs - and a
 *  player who simply raised every hand returned 130% to 206%, measured.
 *
 *  Making the bots braver helped and did not fix it, because the problem was
 *  never the bots: it was that the prize for aggression was enormous and
 *  permanent. Real poker charges two seats and moves the charge round, which
 *  keeps the preflop pot small and makes stealing it worth roughly nothing.
 *
 *  `button` rotates between hands so the cost falls on everybody in turn.
 */
export const startRound = (
    players: Omit<Player, 'hole' | 'committed' | 'folded' | 'lastAction' | 'lastAmount' | 'acts' | 'raises'>[],
    ante: number,
    roll: () => number = Math.random,
    button: number = 0,
): RoundState => {
    const deck = shuffle(freshDeck(), roll);
    const stake = Math.max(0, Number.isFinite(ante) ? ante : 0);
    const n = (players || []).length;

    /** Who pays, and how much. Two seats, not all of them. */
    const smallSeat = n > 1 ? (button + 1) % n : 0;
    const bigSeat = n > 1 ? (button + 2) % n : 0;

    const seated: Player[] = (players || []).map((p, i) => {
        const due = i === bigSeat ? stake : i === smallSeat ? Math.floor(stake / 2) : 0;
        const post = Math.min(p.stack, due);
        return {
            ...p,
            hole: [deck.pop()!, deck.pop()!],
            stack: p.stack - post,
            committed: post,
            folded: false,
            lastAction: null,
            lastAmount: 0,
            acts: 0,
            raises: 0,
        };
    });

    return {
        players: seated,
        board: [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!],
        deck,
        street: 'preflop',
        pot: seated.reduce((sum, p) => sum + p.committed, 0),
        toMatch: stake,
        // The human acts first, which is the only concession to there being no
        // button: the player is never left waiting to find out it is their go.
        turn: HUMAN_SEAT,
        actedSinceRaise: 0,
        // The big blind is the opening minimum. Every raise after it has to
        // be at least as big as the last one.
        minRaise: Math.max(1, stake),
        done: false,
        potWon: 0,
        winners: [],
        reveal: [],
    };
};

/** What the board looks like on this street. */
export const visibleBoard = (s: RoundState): Card[] =>
    (s.board || []).slice(0, BOARD_AT[s.street] ?? 0);

/** How strong a player's hand is right now, 0 to 1. */
export const strengthOf = (s: RoundState, p: Player): number => {
    const board = visibleBoard(s);
    // PREFLOP IS A DIFFERENT QUESTION. There is no five card hand to rank yet.
    return board.length === 0
        ? holeStrength(p.hole)
        : handStrength(bestHand(p.hole, board));
};

/**
 * Whose turn it is next.
 *
 * ALL IN IS NOT A DECISION, and skipping it here is the fix for the worst bug
 * this table has had.
 *
 * A seat with no chips left has already paid for the hand and is entitled to
 * see it through to a showdown. It was still being ASKED to act, and `decide`
 * ends `if (seen >= needed && stack > 0) call` - so with a stack of zero it
 * fell through to a fold, every single time, and folded itself out of a pot it
 * had already bought.
 *
 * Instrumented against a player who raised every decision, over four thousand
 * hands:
 *
 *      hands ending with everybody folding      99.9%
 *      hands reaching a showdown                 0.1%
 *
 *  The bully was not being respected, and the bots were not being cowardly.
 *  Anybody who called them all in was quietly removed from the hand on the
 *  next street, so the pot came back uncontested no matter what anybody held.
 */
const nextLiveSeat = (s: RoundState, from: number): number => {
    for (let step = 1; step <= s.players.length; step++) {
        const i = (from + step) % s.players.length;
        const p = s.players[i];
        if (!p.folded && p.stack > 0) return i;
    }
    // Everybody left is all in. Nobody has a decision, so the hand runs out.
    for (let step = 1; step <= s.players.length; step++) {
        const i = (from + step) % s.players.length;
        if (!s.players[i].folded) return i;
    }
    return from;
};

/** Seats that can still put chips in. Everybody else is along for the ride. */
const canAct = (s: RoundState): Player[] =>
    s.players.filter(p => !p.folded && p.stack > 0);

/** Apply one action from whoever is on the button. */
export const applyAction = (
    state: RoundState,
    action: Action,
    amount: number,
): RoundState => {
    const s: RoundState = {
        ...state,
        players: state.players.map(p => ({ ...p })),
    };
    const p = s.players[s.turn];
    if (!p || s.done) return s;

    const owed = Math.max(0, s.toMatch - p.committed);

    if (action === 'fold') {
        p.folded = true;
        p.lastAction = 'fold';
        p.lastAmount = 0;
    } else if (action === 'raise') {
        // ------------------------------------------------------------------
        //  A RAISE HAS TO BE A REAL RAISE
        // ------------------------------------------------------------------
        //  It was `Math.max(s.toMatch + 1, ...)` - a minimum raise of one
        //  chip. See `minRaise` on the state for the hand that hung on it.
        //
        //  The smallest legal raise is the size of the last one. A player who
        //  cannot cover that is not raising: they call, and go all in if that
        //  is everything they have, which is the real rule and also the only
        //  way the street can ever close.
        // ------------------------------------------------------------------
        const ceiling = p.committed + p.stack;
        const legal = s.toMatch + Math.max(1, s.minRaise);

        if (ceiling < legal) {
            // Cannot make a legal raise. This is a call, all in if need be.
            const put = Math.min(Math.max(0, s.toMatch - p.committed), p.stack);
            p.stack -= put;
            p.committed += put;
            s.pot += put;
            p.lastAction = put > 0 ? 'call' : 'check';
            p.lastAmount = put;
        } else {
            const target = Math.max(legal, Math.min(ceiling, amount));
            const put = target - p.committed;
            p.stack -= put;
            p.committed = target;
            s.pot += put;
            // The next raise has to clear at least this much again.
            s.minRaise = Math.max(s.minRaise, target - s.toMatch);
            s.toMatch = target;
            p.lastAction = 'raise';
            p.lastAmount = target;
            s.actedSinceRaise = 0;
        }
    } else {
        // call or check
        const put = Math.min(owed, p.stack);
        p.stack -= put;
        p.committed += put;
        s.pot += put;
        p.lastAction = put > 0 ? 'call' : 'check';
        p.lastAmount = put;
    }

    // WHO HAS BEEN DOING THE BETTING. Counted here rather than guessed at,
    // because a bot that cannot tell a habitual raiser from a real hand folds
    // to both - which is the hole that let a reckless player return 130%.
    p.acts += 1;
    if (action === 'raise') p.raises += 1;

    s.actedSinceRaise += 1;

    // ---- has the street finished ----
    const live = alive(s);
    if (live.length <= 1) return finish(s);

    const everyoneMatched = live.every(x => x.committed >= s.toMatch || x.stack === 0);
    // COUNTED OVER THE SEATS THAT CAN ACT, not over everybody still in. An
    // all in seat cannot act, so waiting for it to is waiting forever - and
    // the old count made the street close a turn early or a turn late
    // depending on how many were all in.
    const actors = canAct(s).length;
    if (everyoneMatched && (actors === 0 || s.actedSinceRaise >= actors)) return nextStreet(s);

    s.turn = nextLiveSeat(s, s.turn);
    return s;
};

const nextStreet = (state: RoundState): RoundState => {
    const at = STREET_ORDER.indexOf(state.street);
    const next = STREET_ORDER[at + 1];
    if (!next || next === 'showdown') return finish({ ...state, street: 'showdown' });

    return {
        ...state,
        street: next,
        // `acts` and `raises` deliberately SURVIVE the street: a read on
        // somebody is built over a whole hand, not reset every time the board
        // changes.
        players: state.players.map(p => ({ ...p, committed: 0, lastAction: null, lastAmount: 0 })),
        toMatch: 0,
        actedSinceRaise: 0,
        // A new street opens the betting again, and the blind is the floor.
        minRaise: state.minRaise,
        // The first seat that can actually DO something. An all in player
        // opening a street is a player being asked a question with no answer.
        turn: (() => {
            const i = state.players.findIndex(p => !p.folded && p.stack > 0);
            return i >= 0 ? i : state.players.findIndex(p => !p.folded);
        })(),
    };
};

/**
 * Showdown, or everybody else folded.
 *
 * SPLIT POTS ARE REAL. Two identical hands share, which the old evaluator
 * could not even express because it returned one number and ties went to
 * whichever branch was checked first.
 */
export const finish = (state: RoundState): RoundState => {
    const live = alive(state);
    if (live.length === 0) return { ...state, done: true, pot: 0, potWon: state.pot, winners: [] };

    if (live.length === 1) {
        const w = live[0];
        return {
            ...state,
            done: true,
            street: 'showdown',
            pot: 0,
            potWon: state.pot,
            winners: [w.id],
            reveal: [],
            players: state.players.map(p =>
                p.id === w.id ? { ...p, stack: p.stack + state.pot } : p),
        };
    }

    const board = state.board.slice(0, 5);
    const ranked = live.map(p => ({ id: p.id, rank: bestHand(p.hole, board) }));
    let best = ranked[0];
    for (const r of ranked) if (compareHands(r.rank, best.rank) > 0) best = r;
    const winners = ranked.filter(r => compareHands(r.rank, best.rank) === 0).map(r => r.id);

    // THE ODD CHIP. `floor` on its own quietly destroys up to n-1 chips every
    // split pot, which a conservation test finds and nothing else would. Real
    // rooms give the remainder to the first seat; so does this.
    const share = Math.floor(state.pot / winners.length);
    const remainder = state.pot - share * winners.length;

    return {
        ...state,
        done: true,
        street: 'showdown',
        pot: 0,
        potWon: state.pot,
        winners,
        reveal: ranked,
        players: state.players.map(p =>
            winners.includes(p.id)
                ? { ...p, stack: p.stack + share + (p.id === winners[0] ? remainder : 0) }
                : p),
    };
};

/**
 * Let the bot on the button act.
 *
 * Returns the state unchanged when it is the human's turn, which is how the
 * screen knows to stop and wait rather than needing a flag.
 */
export const advance = (state: RoundState, roll: () => number = Math.random): RoundState => {
    if (state.done) return state;
    const p = state.players[state.turn];
    if (!p) return state;
    // ------------------------------------------------------------------
    //  NOBODY ASKS AN ALL IN PLAYER ANYTHING, INCLUDING THE HUMAN
    // ------------------------------------------------------------------
    //  BEFORE the bot check, and the ordering is the whole of a second bug I
    //  made putting this in. With it below, an all in HUMAN was never
    //  advanced: `waitingForHuman` had just been taught that they have no
    //  decision, and `advance` returns unchanged for anybody without a bot,
    //  so the hand could not move and the machine spun. 3,782 hands out of
    //  4,000 hit the guard.
    //
    //  An all in seat of any kind is checked through. They have paid; they
    //  are entitled to the river.
    // ------------------------------------------------------------------
    if (p.stack <= 0 && !p.folded) {
        return applyAction(state, 'call', 0);
    }
    if (!p.bot) return state;

    const d = decide(
        { ...p.bot, stack: p.stack },
        {
            strength: strengthOf(state, p),
            toCall: Math.max(0, state.toMatch - p.committed),
            pot: state.pot,
            stack: p.stack,
            street: Math.min(3, STREET_ORDER.indexOf(state.street)) as 0 | 1 | 2 | 3,
            aggressorRate: aggressorRate(state),
            // What this seat already has in the middle. See pokerBots -> commitment.
            committed: p.committed,
        },
        roll,
    );
    return applyAction(state, d.action, d.amount);
};

/**
 * How often the player who put the current bet in has been raising.
 *
 * Zero when nobody has bet. This is what turns a bot from a threshold into
 * something that plays the person rather than the cards.
 */
export const aggressorRate = (s: RoundState): number => {
    if (s.toMatch <= 0) return 0;
    // Whoever is at the front of the betting is the one being read.
    const better = s.players.find(p => !p.folded && p.committed >= s.toMatch);
    if (!better || better.acts === 0) return 0;
    return Math.max(0, Math.min(1, better.raises / better.acts));
};

/** True when the table is waiting on the person holding the phone. */
export const waitingForHuman = (s: RoundState): boolean =>
    !s.done
    && s.turn === HUMAN_SEAT
    && !s.players[HUMAN_SEAT]?.folded
    // An all in player has nothing to decide either, and asking them puts a
    // FOLD button in front of somebody who has already paid to see the river.
    && (s.players[HUMAN_SEAT]?.stack ?? 0) > 0;

/** Run every bot until it is the human's turn again or the hand ends. */
export const advanceToHuman = (
    state: RoundState,
    roll: () => number = Math.random,
    guard = 60,
): RoundState => {
    let s = state;
    let n = 0;
    while (!s.done && !waitingForHuman(s) && n++ < guard) {
        const before = s;
        s = advance(s, roll);
        // A machine that cannot move is a machine that will spin. This is the
        // one place that could, so it is the one place that checks.
        if (s === before) break;
    }
    return s;
};
