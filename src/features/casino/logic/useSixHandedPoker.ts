// src/features/casino/logic/useSixHandedPoker.ts
//
// ============================================================================
//  THE HOOK THAT SITS FIVE PEOPLE DOWN
// ============================================================================
//
//  Replaces the heads-up hook. Everything about who wins is in
//  core/casino/pokerRound.ts; this holds the money, the clock and the seating,
//  which is all a hook should ever hold.
//
//  THE CLOCK IS THE INTERESTING PART. The engine would play a whole hand out
//  in a single synchronous call, and that is exactly what it must not look
//  like. So each bot's action is scheduled on its own delay - a different one
//  every time, longer for a raise than for a fold - and that stagger is the
//  entire "playing against people" feeling. See pokerBots.thinkTime.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { REPUTATION_CEILING, reputationForBet } from '../data/casinoData';
import { casinoAlert } from '../../../data/i18n/casinoText';
import { thinkTime } from '../../../core/casino/pokerBots';
import { seatTable, type Opponent } from '../../../core/casino/pokerTable';
import {
    BOARD_AT,
    HUMAN_SEAT,
    advance,
    applyAction,
    startRound,
    visibleBoard,
    waitingForHuman,
    type RoundState,
} from '../../../core/casino/pokerRound';
import {
    BLINDS_PER_BUY_IN,
    RAISE_MIN_PCT,
    RAISE_STEPS,
    blindFor,
    nudgeRaise,
    raiseAmount,
} from '../../../core/casino/pokerStakes';
import {
    BUY_IN_BLINDS,
    applyHand,
    buyInFor,
    bustedCount,
    canDeal,
    cashOut,
    openSession,
    playerBusted,
    replaceBusted,
    sessionResult,
    toPlayers,
    type Session,
} from '../../../core/casino/pokerSession';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * What every seat starts a session with, as a multiple of the stake.
 *
 * SHELVED, and kept because the tuning notes refer to it. Twenty big blinds is
 * a shove-fest rather than a cash game, and it was chosen when a "session" was
 * one hand long so it never had to be deeper. The real number lives in
 * core/casino/pokerSession.ts now.
 */
export const STARTING_STACK_MULTIPLE = BUY_IN_BLINDS;

// ============================================================================
//  THE BEATS BETWEEN THE ACTIONS
// ============================================================================
//
//  Asked for as "do not let it play too fast, put animation in between".
//
//  The engine settles a whole hand in one synchronous call, and the temptation
//  is to let it - it is correct and it is instant. But a hand that resolves in
//  a frame is a number appearing, which is the same complaint the slots and the
//  roulette wheel both had.
//
//  So there are two kinds of pause and they do different work:
//
//    THINKING   between one player and the next, a different length every time.
//               See pokerBots.thinkTime. This is what makes five bots read as
//               five people rather than one loop.
//    THE STREET a longer beat when the board changes, because the flop landing
//               is the moment of the hand and it should not arrive in the
//               middle of somebody's call.
//    SHOWDOWN   and the hand is over before anybody says who won.
// ============================================================================

/** The pause when a new street is about to be dealt. */
export const STREET_BEAT_MS = 620;
/** And between the three flop cards as they land. */
export const BOARD_CARD_MS = 170;
/**
 * How long the finished hand sits there before the pot is awarded.
 *
 * Long enough for the last board card to land and turn over, plus a moment to
 * look at it. Without it the river card and the result arrive together, which
 * is the same complaint blackjack had: being told the answer while the thing
 * that decided it is still moving.
 *
 * RAISED FROM 900 WHEN THE HANDS WENT FACE UP. There was nothing to look at
 * before - the opponents' cards were never shown - so the pause only had to
 * cover the last board card. Now up to five hands turn over and each carries
 * what it made, and a player who is meant to learn something from that needs
 * time to read it. The cards take CARD_SHOW_MS to turn; the rest is reading.
 */
export const SHOWDOWN_MS = 1700;

export const useSixHandedPoker = (initialBet: number, vip: boolean, roomBuyIn?: number) => {
    const { money, setField } = useStatsStore();
    const { reputation, updateReputation } = usePlayerStore();
    const casinoReputation = reputation.casino;

    // ------------------------------------------------------------------
    //  THE ROOM SETS THE STAKE NOW, NOT A CHIP RACK
    // ------------------------------------------------------------------
    //  Asked for as "in poker remove the bets, set a buy-in for each country
    //  and for the VIP room, and you enter by paying it".
    //
    //  The rail was borrowed from the other three games and never fitted: they
    //  are one-shot, so choosing a stake is the whole decision. Poker is a
    //  session and the betting happens INSIDE the hand, so a rack of four
    //  chips outside the table asked a question a poker door does not have.
    //
    //  `roomBuyIn` is the number on the wall. The big blind falls out of it at
    //  a hundred blinds a stack, so there is one figure to reason about rather
    //  than two that can disagree. See core/casino/pokerStakes.ts.
    // ------------------------------------------------------------------
    const buyIn = Math.max(0, roomBuyIn ?? initialBet * BLINDS_PER_BUY_IN);
    const ante = blindFor(buyIn);

    // ------------------------------------------------------------------
    //  THE SESSION IS THE THING THAT PERSISTS NOW
    // ------------------------------------------------------------------
    //  Reported as "the table keeps changing, it should not - sit down with
    //  one buy-in and play it until you leave; when somebody busts, somebody
    //  else comes. And we do not win the pot, the mechanic is weak."
    //
    //  The old hook reseated five NEW people with FRESH stacks on every hand
    //  and settled by moving your profit straight into your cash. So the pot
    //  was never won, it was converted; no bot could ever bust; and the read
    //  the bots were built for could never be used, because nobody was at the
    //  table long enough to be read.
    //
    //  `session` holds the seats and their chips between hands. Cash moves
    //  exactly twice: out when you sit down, back when you stand up. In
    //  between it is chips, and chips stay where they land.
    //  See core/casino/pokerSession.ts.
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    //  HOW BIG YOUR RAISE IS
    // ------------------------------------------------------------------
    //  Asked for as "the bets should show as percentages, 5 10 20 25 with
    //  plus and minus, like normal poker".
    //
    //  It was one button reading `Math.max(pot, ante * 2)` - a single pot
    //  sized raise, take it or leave it. Which removes the one decision poker
    //  is actually about: not whether to put money in, but how much.
    //
    //  A percentage of your own STACK rather than of the pot. Pot fractions
    //  are the language players use, but five per cent of a pot is almost
    //  always below the minimum raise, so two of the four buttons would give
    //  the same number and look broken. See core/casino/pokerStakes.ts.
    // ------------------------------------------------------------------
    const [raisePct, setRaisePct] = useState<number>(RAISE_STEPS[1] ?? RAISE_MIN_PCT);

    const [session, setSession] = useState<Session | null>(null);
    /** The same session, readable from inside a callback without a stale copy. */
    const sessionRef = useRef<Session | null>(null);

    const [round, setRound] = useState<RoundState | null>(null);
    /** The same hand, readable without going through a state updater. */
    const roundRef = useRef<RoundState | null>(null);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [status, setStatus] = useState('Take a seat.');
    const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss' | 'push'; amount: number } | null>(null);

    /** Every pending bot action, so leaving the screen cancels them. */
    const timers = useRef<any[]>([]);
    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };
    useEffect(() => clearTimers, []);

    const reputationUp = useCallback((delta: number) => {
        try {
            require('../../../core/store/useCasinoRiskStore').useCasinoRiskStore.getState().recordVisit();
        } catch { /* risk store not ready */ }
        let allowed = delta;
        try {
            allowed = require('../../../core/store/useCasinoRiskStore')
                .useCasinoRiskStore.getState().bankReputation(delta);
        } catch { /* not ready */ }
        if (allowed <= 0) return;
        updateReputation('casino', clamp(Math.round(casinoReputation + allowed), 0, REPUTATION_CEILING));
    }, [casinoReputation, updateReputation]);

    /**
     * Walk the bots forward, one visible step at a time.
     *
     * Recursive rather than a loop on purpose: each step schedules the next
     * with its OWN delay, so five bots never move in lockstep.
     */
    const runBots = useCallback((from: RoundState) => {
        roundRef.current = from;
        if (from.done || waitingForHuman(from)) {
            setRound(from);
            // ------------------------------------------------------------
            //  AND THE HAND IS OVER BEFORE ANYBODY SAYS SO
            // ------------------------------------------------------------
            //  `settle` used to run on this line, in the same tick as the
            //  state that ends the hand - so on the river the pot was
            //  awarded while the fifth board card was still turning over.
            //  Same defect blackjack had, milder only because there is less
            //  to look at. The engine has known the winner since the last
            //  action; this is the pause where the table looks at the board.
            // ------------------------------------------------------------
            if (from.done) {
                const id = setTimeout(() => settle(from), SHOWDOWN_MS);
                timers.current.push(id);
            }
            return;
        }
        const actor = from.players[from.turn];
        const next = advance(from);
        if (next === from) { setRound(from); return; }

        // A STREET IS A BIGGER MOMENT THAN A CALL. When the board is about to
        // change, the table waits - and then the new cards land one at a time,
        // which the AnimatedCard stagger does on its own once they appear.
        const streetChanged = next.street !== from.street;
        const dealtNow = (BOARD_AT[next.street] ?? 0) - (BOARD_AT[from.street] ?? 0);
        const wait = streetChanged
            ? STREET_BEAT_MS + Math.max(0, dealtNow) * BOARD_CARD_MS
            : thinkTime(next.players[from.turn]?.lastAction ?? 'call');
        const id = setTimeout(() => {
            roundRef.current = next;
            setRound(next);
            runBots(next);
        }, wait);
        timers.current.push(id);
        // Say what the table is waiting for. "The flop" rather than a name,
        // when the name would be wrong.
        setStatus(streetChanged
            ? next.street.toUpperCase()
            : `${actor?.name ?? 'Someone'} is thinking...`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Book the finished hand.
     *
     * NO CASH MOVES HERE ANY MORE. The engine already moved chips between the
     * seats; this makes them stay there and works out what the hand did to
     * your stack, which is a different question from what it did to your
     * bank account. Your bank account changes twice a session: `sitDown` and
     * `leave`.
     *
     * The old version compared your stack to one buy-in and paid the
     * difference into your cash every hand - which is why winning three in a
     * row looked exactly like winning one three times, and why nobody at the
     * table could ever go broke.
     */
    const settle = useCallback((s: RoundState) => {
        const you = s.players[HUMAN_SEAT];
        const current = sessionRef.current;
        if (!you || !current) return;

        const before = current.seats[HUMAN_SEAT]?.stack ?? 0;
        const delta = you.stack - before;

        const banked = applyHand(current, s);

        // ------------------------------------------------------------------
        //  AND ANYBODY WHO RAN OUT LEAVES
        // ------------------------------------------------------------------
        //  Asked for as "let that person stay until they bust, and when one
        //  busts someone else comes". The seat keeps its position so the
        //  table does not shuffle under the player's eyes; only the person
        //  in it changes. See replaceBusted.
        // ------------------------------------------------------------------
        const gone = bustedCount(banked);
        const refilled = gone > 0
            ? replaceBusted(banked, seatTable(vip, Math.random, gone), Math.random, vip)
            : banked;

        sessionRef.current = refilled;
        setSession(refilled);
        setOpponents(refilled.seats.slice(1).map((s2, i) => s2.who ?? opponents[i]).filter(Boolean) as Opponent[]);

        reputationUp(reputationForBet(ante));

        if (s.winners.includes(you.id) && delta > 0) {
            setStatus(`You take ${s.potWon.toLocaleString()}.`);
            setResultPopup({ type: 'win', amount: delta });
        } else if (delta === 0) {
            setStatus(gone > 0 ? 'Seat filled.' : 'Split.');
            setResultPopup({ type: 'push', amount: 0 });
        } else {
            const best = s.reveal.find(r => r.id === s.winners[0]);
            setStatus(best ? `${best.rank.name} takes it.` : 'The pot goes elsewhere.');
            setResultPopup({ type: 'loss', amount: -delta });
        }

        if (playerBusted(refilled)) {
            setStatus('You are out of chips.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ante, vip, reputationUp, opponents]);

    // ------------------------------------------------------------------
    //  SITTING DOWN, DEALING AND STANDING UP ARE THREE DIFFERENT THINGS
    // ------------------------------------------------------------------
    //  They used to be one function called `deal`, which is the whole bug in
    //  miniature: if buying in and being dealt a hand are the same event, then
    //  every hand is a new buy-in and there is no table.
    // ------------------------------------------------------------------

    /** Buy in and take a seat. Money leaves your cash exactly here. */
    const sitDown = useCallback(() => {
        if (buyIn <= 0) return casinoAlert('Closed', 'This room is not dealing.');
        if (money < buyIn) {
            // Asked for as "if there is no money, do not let them sit down".
            return casinoAlert('Not enough cash', 'Lower the stake or build more bankroll.');
        }

        clearTimers();
        setResultPopup(null);

        const table = seatTable(vip);
        const fresh = openSession(ante, table, Math.random, vip);
        setOpponents(table);
        sessionRef.current = fresh;
        setSession(fresh);
        setField('money', Math.max(0, money - buyIn));
        setRound(null);
        roundRef.current = null;
        setStatus('Take your seat.');
    }, [ante, money, vip, setField]);

    /** Deal the next hand from the chips already on the table. */
    const deal = useCallback(() => {
        const current = sessionRef.current;
        if (!current) return sitDown();
        if (playerBusted(current)) {
            return casinoAlert('Out of chips', 'Leave the table to cash out, or buy in again.');
        }
        if (!canDeal(current)) return;

        clearTimers();
        setResultPopup(null);

        const fresh = startRound(
            toPlayers(current), current.stake, Math.random, current.button,
        );
        roundRef.current = fresh;
        setRound(fresh);
        setStatus('Your move.');
    }, [sitDown]);

    /**
     * Stand up, and take your chips with you.
     *
     * THE OTHER HALF OF THE BUY-IN, and the reason the pot means something: a
     * stack is only a win once it is cash, so the decision of when to leave is
     * a real one. Idempotent, because it is called both by the button and by
     * the screen unmounting - a player who backs out mid-session must not lose
     * their chips to a navigation event.
     */
    const leave = useCallback(() => {
        const current = sessionRef.current;
        if (!current) return 0;
        clearTimers();
        const back = cashOut(current);
        const result = sessionResult(current);
        sessionRef.current = null;
        setSession(null);
        setRound(null);
        roundRef.current = null;
        setField('money', Math.max(0, useStatsStore.getState().money + back));
        setStatus(result >= 0 ? 'You leave ahead.' : 'You leave light.');
        return back;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setField]);

    /**
     * And leaving the screen cashes you out.
     *
     * Chips that only exist inside a hook are chips that vanish when the
     * player presses back. A ref, not the state, because the cleanup runs
     * after the last render and the state it closed over would be stale.
     */
    useEffect(() => () => {
        const current = sessionRef.current;
        if (!current) return;
        const back = cashOut(current);
        sessionRef.current = null;
        if (back > 0) {
            useStatsStore.setState({ money: Math.max(0, useStatsStore.getState().money + back) });
        }
    }, []);

    const act = useCallback((action: 'fold' | 'call' | 'check' | 'raise', amount = 0) => {
        // ------------------------------------------------------------------
        //  NO SIDE EFFECTS INSIDE A STATE UPDATER
        // ------------------------------------------------------------------
        //  Reported as "the hand ends immediately, everything opens at once,
        //  they all arrive at the same time". This used to schedule `runBots`
        //  from inside `setRound(current => ...)`. React is allowed to run an
        //  updater more than once - it does so in development on every render
        //  - so the bot chain was started TWICE, and two chains advancing the
        //  same hand in parallel resolve it in a frame.
        //
        //  The stagger was never broken. It was being run twice over.
        // ------------------------------------------------------------------
        const current = roundRef.current;
        if (!current || !waitingForHuman(current)) return;
        const owed = current.toMatch - current.players[HUMAN_SEAT].committed;
        const next = applyAction(current, action, action === 'raise' ? amount : owed);
        setRound(next);
        runBots(next);
    }, [runBots]);

    const you = round?.players?.[HUMAN_SEAT];
    const owed = round ? Math.max(0, round.toMatch - (you?.committed ?? 0)) : 0;

    return {
        state: {
            money,
            ante,
            round,
            opponents,
            status,
            resultPopup,
            board: round ? visibleBoard(round) : [],
            hole: you?.hole ?? [],
            pot: round?.pot ?? 0,
            owed,
            yourTurn: !!round && waitingForHuman(round),
            handOver: !!round?.done,

            // ---- the session ----
            /** Null until you buy in. The screen shows the lobby when it is. */
            session,
            /** True once you are sitting at a table with chips. */
            seated: !!session,
            /** Your chips. Not your money: your money is in the header. */
            stack: session?.seats?.[HUMAN_SEAT]?.stack ?? 0,
            /** What one buy-in costs at the chosen stake. */
            /** The number on the wall. What it costs to sit down here. */
            buyIn,
            /** Hands played since you sat down. */
            hands: session?.hands ?? 0,
            /** Up or down against everything you have bought in for. */
            sessionUp: session ? sessionResult(session) : 0,
            /** You have run out and cannot be dealt in. */
            broke: !!session && playerBusted(session),
            /** Every seat's chips, so the table can show them. */
            seats: session?.seats ?? [],

            // ---- the raise ladder ----
            /** The four quick sizes, as percentages of your stack. */
            raiseSteps: RAISE_STEPS,
            /** Which one is chosen. */
            raisePct,
            /**
             * What that percentage actually puts in, in chips.
             *
             * Computed here rather than in the screen so the button's LABEL
             * and the amount the engine receives are the same number. Two
             * places computing it is how a button ends up lying about what it
             * will do.
             */
            raiseChips: round
                ? raiseAmount(raisePct, you?.stack ?? 0, you?.committed ?? 0, round.toMatch)
                : 0,
        },
        actions: {
            sitDown,
            deal,
            leave,
            act,
            /** Pick one of the quick sizes. */
            setRaisePct,
            /** Nudge it by five either way, staying inside the ladder. */
            nudgeRaisePct: (by: number) => setRaisePct(p => nudgeRaise(p, by)),
            closePopup: () => setResultPopup(null),
        },
    };
};
