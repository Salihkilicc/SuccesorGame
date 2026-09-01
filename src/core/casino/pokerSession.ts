// src/core/casino/pokerSession.ts
//
// ============================================================================
//  THE TABLE WAS NEW EVERY HAND, WHICH IS WHY NOTHING WAS AT STAKE
// ============================================================================
//
//  Reported as: "the table keeps changing, it should not - you should sit down
//  with one buy-in and play with it until you leave, and the wheel should keep
//  turning until somebody busts; when one busts another comes. You should be
//  able to sit down with max bet, and not sit down at all if you cannot afford
//  it. And we do not win the money in the pot - the mechanic is weak, it
//  should be like a real table."
//
//  Every word of that is right, and the last sentence is the diagnosis. Here
//  is what the old hook did on every single hand:
//
//      const table = seatTable(vip);              // five NEW people
//      const bots  = seatBots(table.map(...));    // five NEW personalities
//      startRound([...], stack: startingStack)    // everybody's chips reset
//
//  and then settled by comparing your stack to what you started with and
//  moving that difference into your cash. So:
//
//    - THE POT WAS NEVER WON, it was converted. Chips arrived in your stack
//      and were immediately cashed out and the stack thrown away, so the pile
//      in front of you never grew. Winning three hands in a row looked exactly
//      like winning one, three times.
//    - NOBODY COULD EVER BUST. The bot you just stacked came back next hand
//      with a full buy-in and no memory. There was no pressure on them and
//      therefore none on you.
//    - THE PEOPLE CHANGED EVERY HAND, so the read the bots were built for -
//      four personalities, a judgement spread, an aggression counter - could
//      never be used. You cannot play the player when the player leaves after
//      one hand.
//
//  That is not a weak version of poker. It is a slot machine with cards: each
//  pull independent, each outcome settled immediately, no state between them.
//
//  ---------------------------------------------------------------------------
//  SO THERE IS A SESSION NOW, AND IT IS THE THING THAT PERSISTS
//  ---------------------------------------------------------------------------
//  You buy in once. The money leaves your cash THEN and comes back when you
//  stand up, and in between it is chips. Chips move between seats and stay
//  where they land. A bot who runs out is gone, and somebody else sits down
//  with a fresh buy-in.
//
//  Which makes the ordinary things true: a stack in front of somebody means
//  they have been winning, a short stack plays differently because it has to,
//  and standing up with more than you sat down with is the only thing that
//  counts as a win.
//
//  PURE. No stores, no timers, no React, and the die is injected.
// ============================================================================

import type { Bot } from './pokerBots';
import { seatBots } from './pokerBots';
import type { Opponent } from './pokerTable';
import type { Player, RoundState } from './pokerRound';

/**
 * How many big blinds you sit down with.
 *
 * A hundred is the standard buy-in for a live cash game and it is standard for
 * a reason: deep enough that position and reading people matter, shallow
 * enough that a stack can actually be lost in an evening. The old twenty made
 * every hand close to all-in, which is a lottery rather than a game.
 */
export const BUY_IN_BLINDS = 100;

/** What one buy-in costs at a given stake. */
export const buyInFor = (stake: number): number =>
    Math.max(0, Math.round((Number.isFinite(stake) ? stake : 0) * BUY_IN_BLINDS));

/**
 * The largest stake this bankroll can sit down at, from a list of chips.
 *
 * Asked for as "you should be able to sit down with max bet, and if you have
 * no money you should not sit down". Returns 0 when nothing is affordable,
 * which is the caller's cue to refuse rather than to seat them broke.
 */
export const maxStakeFor = (money: number, chips: readonly number[]): number => {
    const cash = Math.max(0, Number.isFinite(money) ? money : 0);
    let best = 0;
    for (const c of chips || []) {
        if (Number.isFinite(c) && c > best && buyInFor(c) <= cash) best = c;
    }
    return best;
};

export interface SessionSeat {
    id: string;
    name: string;
    /** Null for the human. */
    bot: Bot | null;
    stack: number;
    /** Who they are, for the seat label. Absent for the player. */
    who?: Opponent;
    /**
     * How much they have put on this table across the whole session.
     *
     * Buy-ins, not bets. A bot who has rebought twice has three of these, and
     * it is the only honest way to say whether anybody is actually up.
     */
    bought: number;
}

export interface Session {
    seats: SessionSeat[];
    /** The big blind. Every buy-in at this table is BUY_IN_BLINDS of it. */
    stake: number;
    /** Hands played since you sat down. */
    hands: number;
    /** Which seat is on the button. Rotates every hand. */
    button: number;
}

/** The player's seat is always index zero. Matches HUMAN_SEAT in pokerRound. */
export const YOU = 'you';

/**
 * Sit down.
 *
 * Everybody buys in for the same amount, including you, because a table where
 * the bots start deeper than the player is not a table, it is a difficulty
 * setting hidden in the chips.
 */
export const openSession = (
    stake: number,
    table: Opponent[],
    roll: () => number = Math.random,
    strong = false,
): Session => {
    const buyIn = buyInFor(stake);
    const bots = seatBots((table || []).map(o => o.name), strong, roll);
    return {
        stake: Math.max(0, Number.isFinite(stake) ? stake : 0),
        hands: 0,
        button: 0,
        seats: [
            { id: YOU, name: 'You', bot: null, stack: buyIn, bought: buyIn },
            ...bots.map((b, i) => ({
                id: table[i].id,
                name: b.name,
                bot: b,
                stack: buyIn,
                who: table[i],
                bought: buyIn,
            })),
        ],
    };
};

/**
 * Carry the finished hand's chips back into the session.
 *
 * The engine has already moved them between seats; this is only the part that
 * makes them STAY there, which is the whole difference between a table and a
 * sequence of unrelated hands.
 */
export const applyHand = (session: Session, round: RoundState): Session => {
    const byId = new Map((round?.players || []).map(p => [p.id, p]));
    return {
        ...session,
        hands: session.hands + 1,
        button: session.seats.length > 0
            ? (session.button + 1) % session.seats.length
            : 0,
        seats: session.seats.map(s => {
            const p = byId.get(s.id);
            return p ? { ...s, stack: Math.max(0, Math.round(p.stack)) } : s;
        }),
    };
};

/**
 * Who cannot pay a blind any more.
 *
 * NOT "who has exactly zero". A seat holding less than one big blind is done:
 * they can post what they have and be all in, and the moment they lose that
 * they are out anyway. Treating them as still playing produces a seat that
 * folds to every bet forever, which looks like a bug and plays like one.
 */
export const isBusted = (seat: SessionSeat, stake: number): boolean =>
    !seat || seat.stack < Math.max(1, stake);

/**
 * Replace anybody who has run out.
 *
 * A new person, a fresh buy-in, and the seat keeps its position at the table
 * so the layout does not shuffle under the player's eyes.
 *
 * The PLAYER is never replaced here. Somebody who has lost their stack has a
 * decision to make - rebuy or walk - and taking that decision away by quietly
 * refilling their chips is the same mistake the old code made everywhere else.
 */
export const replaceBusted = (
    session: Session,
    fresh: Opponent[],
    roll: () => number = Math.random,
    strong = false,
): Session => {
    const buyIn = buyInFor(session.stake);
    let next = 0;
    return {
        ...session,
        seats: session.seats.map((s, i) => {
            if (i === 0 || !isBusted(s, session.stake)) return s;
            const who = (fresh || [])[next++];
            if (!who) return s;
            const [bot] = seatBots([who.name], strong, roll);
            return {
                id: who.id,
                name: who.name,
                bot,
                stack: buyIn,
                who,
                bought: buyIn,
            };
        }),
    };
};

/** How many seats need a new person. */
export const bustedCount = (session: Session): number =>
    (session?.seats || []).filter((s, i) => i > 0 && isBusted(s, session.stake)).length;

/** True when the player themself has run out. */
export const playerBusted = (session: Session): boolean =>
    !!session && isBusted(session.seats[0], session.stake);

/** What you walk away with. */
export const cashOut = (session: Session): number =>
    Math.max(0, Math.round(session?.seats?.[0]?.stack ?? 0));

/**
 * What you are up or down since you sat down.
 *
 * Against what you BOUGHT, not against one buy-in, so a rebuy is counted
 * honestly rather than looking like a win.
 */
export const sessionResult = (session: Session): number =>
    cashOut(session) - Math.max(0, session?.seats?.[0]?.bought ?? 0);

/** The seats, in the shape `startRound` wants. */
export const toPlayers = (
    session: Session,
): Omit<Player, 'hole' | 'committed' | 'folded' | 'lastAction' | 'lastAmount' | 'acts' | 'raises'>[] =>
    (session?.seats || []).map(s => ({
        id: s.id,
        name: s.name,
        bot: s.bot,
        stack: s.stack,
    }));

/**
 * Whether a hand can even be dealt.
 *
 * Two seats with chips is a game. One is not, and dealing it produces a hand
 * that ends before the player acts.
 */
export const canDeal = (session: Session): boolean =>
    (session?.seats || []).filter(s => s.stack > 0).length >= 2;
