// src/core/casino/pokerBots.ts
//
// ============================================================================
//  FIVE PEOPLE AT THE TABLE, AND NONE OF THEM SOLVING ANYTHING
// ============================================================================
//
//  Asked for as "poker should feel like playing with several people, the
//  opponents should be the CEOs of the other companies, there should be bots,
//  their difficulty random, like the poker games on the Play Store".
//
//  The research question was whether this needs game theory. It does not, and
//  the reason is worth stating: a GTO solver plays UNEXPLOITABLY, which from
//  the other side of the table feels like playing against a wall. What makes
//  a poker game feel populated is that the five people are DIFFERENT from each
//  other and consistent with themselves.
//
//  So the standard two axes, which is how poker players have described each
//  other since long before anybody solved anything:
//
//                  passive                 aggressive
//      tight       THE ROCK                THE SURGEON
//                  waits for a hand,       waits for a hand,
//                  then just calls         then takes your stack
//
//      loose       THE CROWD               THE MANIAC
//                  plays everything,       plays everything,
//                  folds to pressure       raises with all of it
//
//  ---------------------------------------------------------------------------
//  AND DIFFICULTY IS AN ERROR MARGIN, NOT A DIFFERENT BRAIN
//  ---------------------------------------------------------------------------
//  Every bot gets a `judgement` between 0 and 1, rolled when they sit down. It
//  does not change how they play; it changes how well they SEE. A weak player
//  looks at a pair of sevens and might think it is a monster or might think it
//  is nothing, and then plays that misreading perfectly consistently with their
//  personality.
//
//  Which is what a bad poker player actually is. They do not have a worse
//  strategy - they have a worse read, and they follow it faithfully.
//
//  PURE. No stores, no timers, and the die is injected.
// ============================================================================

export type Personality = 'rock' | 'surgeon' | 'crowd' | 'maniac';

export const PERSONALITIES: readonly Personality[] = ['rock', 'surgeon', 'crowd', 'maniac'];

export interface Profile {
    /** Below this perceived strength they will not put money in. Tight is high. */
    playAt: number;
    /** Above this they want to raise. */
    raiseAt: number;
    /** How often they actually do, once they want to. */
    aggression: number;
    /** How much of the pot they raise. */
    raiseSize: number;
}

export const PROFILES: Readonly<Record<Personality, Profile>> = {
    // Waits, and waits, and then calls you down with the winner.
    rock: { playAt: 0.42, raiseAt: 0.72, aggression: 0.25, raiseSize: 0.5 },
    // Waits, and then it is expensive.
    surgeon: { playAt: 0.40, raiseAt: 0.55, aggression: 0.80, raiseSize: 0.75 },
    // In every pot, out of every pot the moment it costs anything.
    crowd: { playAt: 0.18, raiseAt: 0.80, aggression: 0.15, raiseSize: 0.4 },
    // In every pot, and raising with all of them.
    maniac: { playAt: 0.12, raiseAt: 0.34, aggression: 0.85, raiseSize: 0.9 },
};

export const PERSONALITY_NAMES: Readonly<Record<Personality, string>> = {
    rock: 'Rock',
    surgeon: 'Surgeon',
    crowd: 'Crowd',
    maniac: 'Maniac',
};

// ============================================================================

export type Action = 'fold' | 'check' | 'call' | 'raise';

export interface Bot {
    id: string;
    name: string;
    personality: Personality;
    /**
     * How well they read their own hand, 0 to 1.
     *
     * THIS IS THE DIFFICULTY. It is not a different strategy, it is a clearer
     * pair of eyes: at 1 they see their hand exactly, at 0 their read is a
     * coin toss they then follow perfectly.
     */
    judgement: number;
    stack: number;
}

export interface Decision {
    action: Action;
    /** Chips to put in. Zero for a fold or a check. */
    amount: number;
}

export interface Situation {
    /** 0 to 1, from core/casino/pokerHand.ts. */
    strength: number;
    /** What it costs to stay in. Zero when they can check. */
    toCall: number;
    pot: number;
    stack: number;
    /** How many streets have been dealt. Later streets are read more firmly. */
    street: 0 | 1 | 2 | 3;
    /**
     * HOW OFTEN THE PERSON BETTING INTO THEM HAS BEEN RAISING, 0 to 1.
     *
     * Found by measurement and it was the single worst hole in the casino: a
     * player who raised a pot sized bet on almost every hand returned 130.5%.
     * Threshold bots respect a big bet, and four of them folding in turn hands
     * the pot over uncontested, hand after hand, forever.
     *
     * The fix is the thing real players do and the thing the research calls
     * "playing the player": somebody who raises EVERY hand is not telling you
     * anything by raising, so you stop believing them. This loosens the price
     * a bot is willing to pay in proportion to how little the raise means.
     *
     * It is not a special case against the human. It is a read, and a bot at a
     * table of maniacs loosens against them too.
     */
    aggressorRate?: number;
}

/** How wrong a bot's read can be at judgement 0. */
export const MAX_MISREAD = 0.45;

/**
 * How much lower a bot's RAISING bar goes against somebody who raises
 * everything.
 *
 * At an aggression read of 1 - a player who has raised every single time they
 * have acted - a bot needs this much less of a hand before it puts money back
 * in, and it does so more often.
 *
 * IT IS ON THE RAISE AND NOT ON THE CALL, and that was measured the hard way:
 * loosening the CALL took the reckless player from 130% to 161%, because bots
 * that call a pot sized bet on three streets with a weak hand pay the bluffer
 * off three times over. Calling a bluff is how you lose to one slowly. What
 * stops somebody betting every hand is somebody putting it back in.
 */
export const BLUFF_DISCOUNT = 0.30;


/**
 * What this bot THINKS it has.
 *
 * The error shrinks as the board fills in, because a hand gets easier to read
 * the more of it is face up - and because a bot that still cannot count to a
 * flush on the river is not a weak player, it is a broken one.
 */
export const perceivedStrength = (
    actual: number,
    judgement: number,
    street: number,
    roll: () => number = Math.random,
): number => {
    const clear = Math.max(0, Math.min(1, Number.isFinite(judgement) ? judgement : 0.5));
    const streetHelp = 1 - Math.min(3, Math.max(0, street)) * 0.2;
    const spread = MAX_MISREAD * (1 - clear) * streetHelp;
    const raw = roll();
    const wobble = (Number.isFinite(raw) ? raw : 0.5) * 2 - 1;
    const real = Math.max(0, Math.min(1, Number.isFinite(actual) ? actual : 0));
    return Math.max(0, Math.min(1, real + wobble * spread));
};

/**
 * One decision.
 *
 * The order is the order a player thinks in: can I check, is this worth
 * anything, is it worth raising.
 */
export const decide = (
    bot: Bot,
    s: Situation,
    roll: () => number = Math.random,
): Decision => {
    const p = PROFILES[bot?.personality] ?? PROFILES.rock;
    const stack = Math.max(0, Number.isFinite(s?.stack) ? s.stack : 0);
    const toCall = Math.max(0, Number.isFinite(s?.toCall) ? s.toCall : 0);
    const pot = Math.max(0, Number.isFinite(s?.pot) ? s.pot : 0);

    const seen = perceivedStrength(s?.strength ?? 0, bot?.judgement ?? 0.5, s?.street ?? 0, roll);

    // ---- raise ----
    //  AND THE ANSWER TO A HABITUAL AGGRESSOR IS TO RAISE BACK, not to call
    //  down. MEASURED, and my first attempt got it exactly backwards: loosening
    //  the CALL against a bluffer took the reckless player from 130% to 161%,
    //  because a bot that calls a pot sized bet on three streets with a weak
    //  hand simply pays them off three times.
    //
    //  What actually stops somebody betting every hand is somebody putting it
    //  back in. Then the bluff costs them, which is the only thing that ever
    //  stops one.
    const aggro = Math.max(0, Math.min(1, s?.aggressorRate ?? 0));
    const fightBack = aggro * BLUFF_DISCOUNT;

    if (seen >= Math.max(0.25, p.raiseAt - fightBack)
        && roll() < Math.min(0.95, p.aggression + aggro * 0.35)
        && stack > toCall) {
        const want = Math.round(Math.max(pot * p.raiseSize, toCall * 2));
        return { action: 'raise', amount: Math.min(stack, Math.max(toCall + 1, want)) };
    }

    // ---- nothing to pay ----
    if (toCall <= 0) return { action: 'check', amount: 0 };

    // ---- is it worth the price ----
    //  POT ODDS, cheaply. A hand worth staying in for a small bet is not worth
    //  staying in for a big one, and a bot that ignored this would call any
    //  amount with any pair, which is the single most obvious tell that
    //  somebody is playing against a computer.
    const price = toCall / Math.max(1, pot + toCall);

    //  The call stays PRICE SENSITIVE even against an aggressor. Paying to see
    //  a bluff is how you lose to one slowly; the punishment happens above, in
    //  the raise.
    if (seen >= p.playAt + price * 0.5 && stack > 0) {
        return { action: 'call', amount: Math.min(stack, toCall) };
    }

    return { action: 'fold', amount: 0 };
};

// ============================================================================
//  AND WHO THEY ARE
// ============================================================================
//
//  Asked for as "the opponents should be the CEOs of the other companies, and
//  in the VIP room the table is CEOs while in the cities it is random people
//  with the occasional CEO".
//
//  This file does not know what a CEO is - that would drag the product markets
//  into the poker table - so it takes NAMES and hands back seated players. The
//  casino picks who is in the room; this decides how they play.
// ============================================================================

/**
 * Seat a table.
 *
 * `strong` raises the average judgement, which is how the VIP room is harder
 * than Athens without a separate set of bots: the same four personalities,
 * with better eyes.
 */
export const seatBots = (
    names: string[],
    strong: boolean,
    roll: () => number = Math.random,
): Bot[] =>
    (names || []).map((name, i) => {
        const pick = roll();
        const personality = PERSONALITIES[
            Math.min(PERSONALITIES.length - 1, Math.floor((Number.isFinite(pick) ? pick : 0) * PERSONALITIES.length))
        ];
        const base = roll();
        const judgement = strong
            ? 0.55 + (Number.isFinite(base) ? base : 0.5) * 0.45
            : 0.15 + (Number.isFinite(base) ? base : 0.5) * 0.65;
        return {
            id: `seat_${i}`,
            name,
            personality,
            judgement: Math.max(0, Math.min(1, judgement)),
            stack: 0,
        };
    });

// ============================================================================
//  AND HOW LONG THEY TAKE
// ============================================================================
//
//  The single thing that makes five bots feel like five people. If they all
//  act the instant it is their turn, they are obviously one function in a
//  loop. A pause, of a DIFFERENT length each time, is the whole illusion.
//
//  Asked for as "it should feel online but be offline".
// ============================================================================

export const THINK_MIN_MS = 400;
export const THINK_MAX_MS = 900;

/**
 * How long this bot sits there before acting.
 *
 * A raise takes longer than a fold, because deciding to put money in is the
 * decision a person actually stops to make.
 */
export const thinkTime = (action: Action, roll: () => number = Math.random): number => {
    const raw = roll();
    const die = Number.isFinite(raw) ? raw : 0.5;
    const span = THINK_MAX_MS - THINK_MIN_MS;
    const base = THINK_MIN_MS + die * span;
    return Math.round(action === 'raise' ? base * 1.35 : action === 'fold' ? base * 0.7 : base);
};
