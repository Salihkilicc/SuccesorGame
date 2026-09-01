// src/core/casino/pokerSession.test.ts
//
// ============================================================================
//  A SEQUENCE OF UNRELATED HANDS IS NOT A POKER TABLE
// ============================================================================
//
//  Reported as: "the table keeps changing, it should not be like that - you
//  should sit down with one bet and play with it until you leave, and it
//  should keep going until someone busts; when one busts another comes. You
//  should be able to sit down with max bet and not sit down if you have no
//  money. And we do not win the money in the pot - this mechanic is weak, it
//  should be like a real table."
//
//  Here is what the old hook did on every single hand:
//
//      const table = seatTable(vip);            // five NEW people
//      const bots  = seatBots(...);             // five NEW personalities
//      startRound([...], stack: startingStack)  // everybody's chips reset
//
//  and settled by moving (your stack - one buy-in) into your cash. Three
//  consequences, and the player felt all three:
//
//    THE POT WAS NEVER WON, IT WAS CONVERTED. Chips landed in your stack and
//    were immediately cashed and the stack discarded. Winning three hands in a
//    row was indistinguishable from winning one hand three times, because the
//    pile in front of you never grew.
//
//    NOBODY COULD BUST. The bot you just stacked returned next hand with a
//    full buy-in and no memory, so there was never any pressure on anybody.
//
//    THE PEOPLE CHANGED EVERY HAND, so the read the bots exist for - four
//    personalities, a judgement spread, an aggression counter that survives
//    the street - could never be used by the player. You cannot play the
//    player when the player leaves after one hand.
//
//  That is a slot machine with cards. These tests pin the thing that makes it
//  a table instead: state between hands.
// ============================================================================

import {
    BUY_IN_BLINDS, applyHand, bustedCount, buyInFor, canDeal, cashOut,
    isBusted, maxStakeFor, openSession, playerBusted, replaceBusted,
    sessionResult, toPlayers, YOU,
} from './pokerSession';
import { advanceToHuman, applyAction, startRound, type RoundState } from './pokerRound';
import type { Opponent } from './pokerTable';

const people = (n: number, tag = 'a'): Opponent[] =>
    Array.from({ length: n }, (_, i) => ({
        id: `${tag}${i}`, name: `Player ${tag}${i}`, kind: 'stranger' as const,
    }));

/** A fixed die, so a session plays out the same way every run. */
const die = (seed = 1) => {
    let n = seed;
    return () => {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
    };
};

const STAKE = 100;

describe('you buy in once', () => {
    it('and everybody sits down with the same chips', () => {
        // A table where the bots start deeper than the player is not a table,
        // it is a difficulty setting hidden in the chips.
        const s = openSession(STAKE, people(4), die());
        expect(s.seats).toHaveLength(5);
        const stacks = new Set(s.seats.map(x => x.stack));
        expect(stacks.size).toBe(1);
        expect(s.seats[0].id).toBe(YOU);
    });

    it('and a buy-in is a hundred blinds, not twenty', () => {
        // Twenty is a shove-fest. It was chosen when a "session" was one hand
        // long, so it never had to be deep enough for anything else.
        expect(BUY_IN_BLINDS).toBe(100);
        expect(buyInFor(STAKE)).toBe(STAKE * 100);
    });

    it('and nonsense stakes cannot conjure chips', () => {
        for (const bad of [NaN, -5, Infinity]) {
            expect(buyInFor(bad as number)).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(buyInFor(bad as number))).toBe(true);
        }
    });
});

describe('and the chips stay where they land', () => {
    it('a hand moves them between seats and the next hand starts from there', () => {
        // THE DEFECT, as one assertion. Chips used to be reset every hand.
        const s = openSession(STAKE, people(4), die());
        const before = s.seats.map(x => x.stack);

        let round = startRound(toPlayers(s), s.stake, die(9), s.button);
        while (!round.done) {
            round = round.players[round.turn].bot
                ? advanceToHuman(round, die(round.pot + 3))
                : applyAction(round, 'fold', 0);
        }
        const after = applyHand(s, round);

        expect(after.seats.map(x => x.stack)).not.toEqual(before);
        // And nothing was created or destroyed.
        const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
        expect(sum(after.seats.map(x => x.stack))).toBe(sum(before));
    });

    it('and the button moves on, so the blinds are a rota not a tax', () => {
        const s = openSession(STAKE, people(4), die());
        const round = startRound(toPlayers(s), s.stake, die(2), s.button);
        expect(applyHand(s, round).button).toBe((s.button + 1) % s.seats.length);
    });

    it('and the hand count is what tells you a session happened', () => {
        let s = openSession(STAKE, people(4), die());
        for (let i = 0; i < 3; i++) {
            s = applyHand(s, startRound(toPlayers(s), s.stake, die(i + 5), s.button));
        }
        expect(s.hands).toBe(3);
    });

    it('and a stack really can grow across hands, which is the whole point', () => {
        // Hand it a round where the player won everything, three times, and
        // check the pile is bigger each time rather than reset.
        let s = openSession(STAKE, people(4), die());
        const start = s.seats[0].stack;
        for (let i = 0; i < 3; i++) {
            const fake = {
                players: s.seats.map((seat, idx) => ({
                    ...seat, stack: idx === 0 ? seat.stack + 500 : seat.stack - 125,
                })),
            } as unknown as RoundState;
            s = applyHand(s, fake);
        }
        expect(s.seats[0].stack).toBe(start + 1500);
    });
});

describe('and somebody who runs out leaves', () => {
    it('a seat below one blind is done', () => {
        // NOT "exactly zero". A seat with less than a blind can post what it
        // has and be all in, and a seat treated as still playing after that
        // folds to every bet forever - which looks like a bug and plays like
        // one.
        expect(isBusted({ stack: 0 } as any, STAKE)).toBe(true);
        expect(isBusted({ stack: STAKE - 1 } as any, STAKE)).toBe(true);
        expect(isBusted({ stack: STAKE } as any, STAKE)).toBe(false);
    });

    it('and is replaced by somebody new with a fresh buy-in', () => {
        const s = openSession(STAKE, people(4), die());
        const broke = {
            ...s,
            seats: s.seats.map((x, i) => (i === 2 ? { ...x, stack: 0 } : x)),
        };
        expect(bustedCount(broke)).toBe(1);

        const filled = replaceBusted(broke, people(1, 'z'), die(4));
        expect(filled.seats[2].stack).toBe(buyInFor(STAKE));
        expect(filled.seats[2].id).toBe('z0');
        expect(bustedCount(filled)).toBe(0);
    });

    it('and the seat keeps its place, so the table does not shuffle', () => {
        const s = openSession(STAKE, people(4), die());
        const broke = {
            ...s,
            seats: s.seats.map((x, i) => (i === 3 ? { ...x, stack: 0 } : x)),
        };
        const filled = replaceBusted(broke, people(1, 'z'), die(4));
        for (const i of [0, 1, 2, 4]) {
            expect(filled.seats[i].id).toBe(s.seats[i].id);
        }
    });

    it('and the PLAYER is never quietly refilled', () => {
        // Somebody who has lost their stack has a decision to make. Topping
        // them up without asking is the same mistake the old model made
        // everywhere else.
        const s = openSession(STAKE, people(4), die());
        const broke = {
            ...s,
            seats: s.seats.map((x, i) => (i === 0 ? { ...x, stack: 0 } : x)),
        };
        const filled = replaceBusted(broke, people(3, 'z'), die(4));
        expect(filled.seats[0].stack).toBe(0);
        expect(filled.seats[0].id).toBe(YOU);
        expect(playerBusted(filled)).toBe(true);
    });

    it('and a hand is not dealt to a table of one', () => {
        const s = openSession(STAKE, people(4), die());
        const empty = { ...s, seats: s.seats.map((x, i) => ({ ...x, stack: i === 0 ? x.stack : 0 })) };
        expect(canDeal(empty)).toBe(false);
        expect(canDeal(s)).toBe(true);
    });
});

describe('and what you walk away with is the only thing that counts', () => {
    it('cashing out returns the chips in front of you', () => {
        const s = openSession(STAKE, people(4), die());
        expect(cashOut(s)).toBe(buyInFor(STAKE));
    });

    it('and the result is measured against what you bought, not one buy-in', () => {
        // Or a rebuy looks like a win.
        const s = openSession(STAKE, people(4), die());
        expect(sessionResult(s)).toBe(0);
        const up = { ...s, seats: [{ ...s.seats[0], stack: s.seats[0].stack + 900 }, ...s.seats.slice(1)] };
        expect(sessionResult(up)).toBe(900);
        const rebought = {
            ...s,
            seats: [{ ...s.seats[0], stack: buyInFor(STAKE), bought: buyInFor(STAKE) * 2 }, ...s.seats.slice(1)],
        };
        expect(sessionResult(rebought)).toBe(-buyInFor(STAKE));
    });
});

describe('and you cannot sit down with money you do not have', () => {
    const chips = [100, 500, 1000, 5000];

    it('max stake is the biggest one the bankroll actually covers', () => {
        // Asked for by name. It is also the honest answer to "how much can I
        // play for", which the player should not have to find by tapping
        // chips until the alert stops appearing.
        expect(maxStakeFor(buyInFor(1000), chips)).toBe(1000);
        expect(maxStakeFor(buyInFor(1000) - 1, chips)).toBe(500);
        expect(maxStakeFor(buyInFor(5000) * 10, chips)).toBe(5000);
    });

    it('and zero when nothing is affordable, which is the cue to refuse', () => {
        expect(maxStakeFor(0, chips)).toBe(0);
        expect(maxStakeFor(buyInFor(100) - 1, chips)).toBe(0);
    });

    it('and nonsense money does not open the table', () => {
        for (const bad of [NaN, -1, undefined]) {
            expect(maxStakeFor(bad as number, chips)).toBe(0);
        }
    });
});

describe('and a whole session plays out without losing a chip', () => {
    it('every hand conserves the table, over twenty of them', () => {
        // THE PROPERTY THAT MATTERS. Chips are now the only money in the game
        // for the length of a session, so a leak here is a leak in the
        // player's bankroll that nothing else would catch.
        let s = openSession(STAKE, people(4), die(77));
        const total = s.seats.reduce((a, b) => a + b.stack, 0);

        for (let hand = 0; hand < 20 && canDeal(s); hand++) {
            let round = startRound(toPlayers(s), s.stake, die(hand * 13 + 1), s.button);
            let guard = 0;
            while (!round.done && guard++ < 200) {
                round = round.players[round.turn].bot
                    ? advanceToHuman(round, die(hand + guard))
                    : applyAction(round, guard % 3 === 0 ? 'fold' : 'call', 0);
            }
            s = applyHand(s, round);
            // Replacing a busted seat ADDS chips, so measure before that.
            expect(s.seats.reduce((a, b) => a + b.stack, 0)).toBe(total);
            if (bustedCount(s) > 0) break;
        }
    });

    it('and somebody does eventually go broke, or nothing is at stake', () => {
        // The model is only worth having if busting is reachable. Played
        // aggressively, it should happen inside a reasonable number of hands.
        let s = openSession(STAKE, people(4), die(5));
        let busted = false;
        for (let hand = 0; hand < 400 && canDeal(s) && !busted; hand++) {
            let round = startRound(toPlayers(s), s.stake, die(hand * 7 + 3), s.button);
            let guard = 0;
            while (!round.done && guard++ < 200) {
                round = round.players[round.turn].bot
                    ? advanceToHuman(round, die(hand + guard * 3))
                    : applyAction(round, 'raise', round.pot * 2 + s.stake);
            }
            s = applyHand(s, round);
            busted = bustedCount(s) > 0 || playerBusted(s);
        }
        expect(busted).toBe(true);
    });
});
