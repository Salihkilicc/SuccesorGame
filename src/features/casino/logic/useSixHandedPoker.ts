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
import { seatBots, thinkTime } from '../../../core/casino/pokerBots';
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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** What every seat starts a session with, as a multiple of the stake. */
export const STARTING_STACK_MULTIPLE = 20;

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
// ============================================================================

/** The pause when a new street is about to be dealt. */
export const STREET_BEAT_MS = 620;
/** And between the three flop cards as they land. */
export const BOARD_CARD_MS = 170;

export const useSixHandedPoker = (initialBet: number, vip: boolean) => {
    const { money, setField } = useStatsStore();
    const { reputation, updateReputation } = usePlayerStore();
    const casinoReputation = reputation.casino;

    const [ante, setAnte] = useState(initialBet);
    /**
     * Which seat is on the button.
     *
     * Rotates every hand so the blinds fall on everybody in turn. Without it
     * the same two seats pay every time, which is a tax rather than a rota.
     */
    const button = useRef(0);
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
            if (from.done) settle(from);
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

    /** Pay the hand out. The engine already moved chips between seats. */
    const settle = useCallback((s: RoundState) => {
        const you = s.players[HUMAN_SEAT];
        if (!you) return;
        const startingStack = ante * STARTING_STACK_MULTIPLE;
        const delta = you.stack - startingStack;

        setField('money', Math.max(0, money + delta));
        reputationUp(reputationForBet(ante));

        if (s.winners.includes(you.id) && delta > 0) {
            setStatus(`You take ${s.potWon.toLocaleString()}.`);
            setResultPopup({ type: 'win', amount: delta });
        } else if (delta === 0) {
            setStatus('Split.');
            setResultPopup({ type: 'push', amount: 0 });
        } else {
            const best = s.reveal.find(r => r.id === s.winners[0]);
            setStatus(best ? `${best.rank.name} takes it.` : 'The pot goes elsewhere.');
            setResultPopup({ type: 'loss', amount: -delta });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ante, money, setField, reputationUp]);

    const deal = useCallback(() => {
        if (ante <= 0) return casinoAlert('Place Bet', 'Choose a stake first.');
        const startingStack = ante * STARTING_STACK_MULTIPLE;
        if (money < startingStack) {
            return casinoAlert('Not enough cash', 'Lower the stake or build more bankroll.');
        }

        clearTimers();
        setResultPopup(null);

        const table = seatTable(vip);
        const bots = seatBots(table.map(o => o.name), vip);
        setOpponents(table);

        const fresh = startRound([
            { id: 'you', name: 'You', bot: null, stack: startingStack },
            ...bots.map((b, i) => ({ id: table[i].id, name: b.name, bot: b, stack: startingStack })),
        ], ante, Math.random, button.current);
        button.current = (button.current + 1) % (bots.length + 1);

        roundRef.current = fresh;
        setRound(fresh);
        setStatus('Your move.');
    }, [ante, money, vip]);

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
        },
        actions: {
            deal,
            act,
            setAnte,
            closePopup: () => setResultPopup(null),
        },
    };
};
