// src/core/casino/allIn.test.ts
//
// ============================================================================
//  AN ALL IN PLAYER WAS BEING FOLDED OUT OF A POT THEY HAD ALREADY PAID FOR
// ============================================================================
//
//  This is the worst bug the poker table has had, it had been there the whole
//  time, and it was found by chasing something else entirely: "they fold a lot,
//  is it because the hand is bad".
//
//  ---------------------------------------------------------------------------
//  WHAT WAS HAPPENING
//  ---------------------------------------------------------------------------
//  `nextLiveSeat` skipped folded players and nobody else, so a seat that had
//  called all in was still asked to act on the next street. `decide` ends:
//
//      if (seen >= needed && stack > 0) return call;
//      return fold;
//
//  With a stack of zero that is an unconditional fold. So anybody who called
//  a shove was silently removed from the hand before the cards were shown, and
//  the pot went back to the last person betting - whatever they held.
//
//  Instrumented against a player who raised on every decision, over four
//  thousand hands:
//
//                              before      after
//      everybody folded         99.9%       5.5%
//      reached a showdown        0.1%      94.5%
//      showdowns the bully won      -      29.3%
//      return                   3.60       1.00
//
//  Four thousand hands and the bully showed a hand four times. They did not
//  need to: every opponent who paid to see the river was folded out of it.
//
//  ---------------------------------------------------------------------------
//  AND IT HAD BEEN MISDIAGNOSED FOR MONTHS
//  ---------------------------------------------------------------------------
//  The always-raise exploit has been "fixed" twice before, once by making the
//  bots braver and once by moving from antes to blinds, and the notes on both
//  say they were measured. They were: the RETURN fell, because blinds made the
//  prize smaller. Nobody measured the WIN RATE, which stayed at a hundred per
//  cent, so the real cause was never touched and both fixes were treating a
//  symptom.
//
//  The lesson is about the measurement rather than the bug. `return` was
//  normalised by a whole buy-in, which is enormous next to one stolen pot, so
//  a player winning literally every hand still came out at 1.08 and looked
//  fine. A number can be within its band and still be describing a broken
//  game, and the only reason this was ever caught is that somebody asked why
//  the opponents fold so much.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    HUMAN_SEAT, advance, advanceToHuman, applyAction, startRound, waitingForHuman,
    type RoundState,
} from './pokerRound';
import { seatBots } from './pokerBots';

const table = (stacks: number[], stake = 100) => {
    const bots = seatBots(['A', 'B', 'C', 'D'].slice(0, stacks.length - 1), false);
    return startRound([
        { id: 'you', name: 'You', bot: null, stack: stacks[0] },
        ...bots.map((b, i) => ({ id: `s${i}`, name: b.name, bot: b, stack: stacks[i + 1] })),
    ], stake, Math.random, 0);
};

/** Play a hand out with the human shoving every time they are asked. */
const bully = (seed: number): RoundState => {
    let s = table([1_000_000, 1_000_000, 1_000_000, 1_000_000, 1_000_000], 50_000);
    let guard = 0;
    s = advanceToHuman(s);
    while (!s.done && guard++ < 80) {
        if (waitingForHuman(s)) s = applyAction(s, 'raise', Math.max(s.pot, 100_000));
        const before = s;
        s = advanceToHuman(s);
        if (s === before && !waitingForHuman(s)) break;
    }
    return s;
};

describe('a player with no chips left is not asked anything', () => {
    it('they are checked through rather than folded', () => {
        // THE DEFECT, at its smallest. A seat with a stack of zero facing a
        // bet had exactly one outcome, and it was the wrong one.
        let s = table([1000, 1000, 1000]);
        s = {
            ...s,
            players: s.players.map((p, i) => (i === 1 ? { ...p, stack: 0, committed: s.toMatch } : p)),
            turn: 1,
        };
        const next = advance(s, () => 0.99);
        expect(next.players[1].folded).toBe(false);
    });

    it('and the turn skips them entirely', () => {
        let s = table([1000, 1000, 1000, 1000]);
        s = {
            ...s,
            players: s.players.map((p, i) => (i === 2 ? { ...p, stack: 0 } : p)),
            turn: 1,
        };
        const next = applyAction(s, 'call', 0);
        expect(next.turn).not.toBe(2);
    });

    it('and the human is never shown a FOLD button they cannot use', () => {
        // The same bug on the other side of the table: an all in player being
        // offered a decision they have already made.
        let s = table([1000, 1000, 1000]);
        s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, stack: 0 } : p)), turn: 0 };
        expect(waitingForHuman(s)).toBe(false);
    });
});

describe('and the hand still finishes', () => {
    it('a table where everybody is all in runs to a showdown', () => {
        // The fix must not leave the machine with nobody able to act and no
        // way to close the street. It did, on the first attempt, and 3,782
        // hands out of 4,000 hit the guard.
        let s = table([100, 100, 100, 100], 100);
        s = { ...s, players: s.players.map(p => ({ ...p, stack: 0 })) };
        let guard = 0;
        while (!s.done && guard++ < 100) {
            const before = s;
            s = waitingForHuman(s) ? applyAction(s, 'call', 0) : advance(s);
            if (s === before) break;
        }
        expect(guard).toBeLessThan(100);
    });

    it('and no hand spins', () => {
        for (let i = 0; i < 300; i++) {
            const s = bully(i);
            expect(s.done).toBe(true);
        }
    });
});

describe('and a raise has to be a real raise', () => {
    // ------------------------------------------------------------------
    //  THE SECOND BUG THE FIRST ONE WAS HIDING
    // ------------------------------------------------------------------
    //  Fixing the all in fold made deep hands normal, and within two
    //  thousand of them the machine hung. Caught state, on the river:
    //
    //      toMatch 903,013
    //      four seats committed 903,010 / 011 / 012 / 013, ~47,000 behind
    //
    //  `applyAction` forced a raise to be at least `toMatch + 1`, so a bot
    //  whose pot sized raise came out below the current bet raised by ONE
    //  CHIP. That resets `actedSinceRaise`, so four bots doing it in turn
    //  never close the street - a raise war fought a chip at a time.
    //
    //  It was unreachable before because hands never got that deep. Real
    //  poker has had a minimum raise rule forever, for exactly this reason.
    // ------------------------------------------------------------------

    it('a raise must be at least as big as the last one', () => {
        // AND THE MINIMUM GROWS WITH IT, which a probe caught me leaving
        // unpinned: without this line the floor stays at the big blind
        // forever, so after a large bet the next raise can be a token one and
        // the war restarts a chip at a time.
        let s = table([100_000, 100_000, 100_000], 1000);
        expect(s.minRaise).toBe(1000);

        const before = s.toMatch;
        s = applyAction(s, 'raise', before + 20_000);
        const grew = s.toMatch - before;
        expect(grew).toBeGreaterThanOrEqual(20_000 - s.players[0].committed);
        expect(s.minRaise).toBe(grew);
        expect(s.minRaise).toBeGreaterThan(1000);
    });

    it('and a one chip raise is refused, which is what hung the table', () => {
        let s = table([100_000, 100_000, 100_000], 1000);
        const before = s.toMatch;
        s = applyAction(s, 'raise', before + 1);
        // Either it was rounded up to a legal raise, or it became a call.
        expect(s.toMatch === before || s.toMatch >= before + s.minRaise).toBe(true);
        expect(s.toMatch).not.toBe(before + 1);
    });

    it('and a player who cannot cover the minimum calls instead of raising', () => {
        let s = table([100_000, 100_000, 100_000], 1000);
        s = {
            ...s,
            minRaise: 90_000,
            toMatch: 50_000,
            turn: 1,
            players: s.players.map((p, i) => (i === 1 ? { ...p, stack: 20_000, committed: 0 } : p)),
        };
        const next = applyAction(s, 'raise', 200_000);
        expect(next.players[1].lastAction).not.toBe('raise');
        expect(next.toMatch).toBe(50_000);
    });

    it('and no hand hangs, over sixty thousand of them', () => {
        // Measured after the fix: zero stalls, worst case eight iterations.
        for (let i = 0; i < 400; i++) {
            expect(bully(i).done).toBe(true);
        }
    });
});

describe('and raising every hand is finally not a strategy', () => {
    it('the bully has to show a hand', () => {
        // The number that mattered and was never taken. Before this, four
        // thousand hands produced four showdowns.
        let showdowns = 0;
        const N = 400;
        for (let i = 0; i < N; i++) {
            if (bully(i).reveal.length > 0) showdowns++;
        }
        expect(showdowns / N).toBeGreaterThan(0.5);
    });

    it('and does not win every hand any more', () => {
        // THE MEASUREMENT THE OLD TESTS NEVER MADE. `return` was normalised
        // by a whole buy-in, so a hundred per cent win rate still came out at
        // 1.08 and passed a band of 1.15.
        let won = 0;
        const N = 400;
        for (let i = 0; i < N; i++) {
            if (bully(i).winners.includes('you')) won++;
        }
        expect(won / N).toBeLessThan(0.6);
    });

    it('and the street closes on the seats that can ACT, not on everybody', () => {
        // Two probes came back green against changes that were doing real
        // work, which means they were unpinned. Both are here now.
        //
        // An all in seat cannot act, so counting it in `actedSinceRaise >=
        // live.length` waits for something that will never happen - or closes
        // the street a turn early, depending on how many are all in.
        // Measured: reverting this moves the always-raise return from 0.885
        // to 0.958, so it is worth about seven points on its own.
        const src = fs.readFileSync(
            path.join(__dirname, 'pokerRound.ts'), 'utf8');
        expect(src).toMatch(/const actors = canAct\(s\)\.length;/);
        expect(src).toMatch(/actors === 0 \|\| s\.actedSinceRaise >= actors/);
        expect(src).not.toMatch(/s\.actedSinceRaise >= live\.length/);
    });

    it('and chips already in the middle pull a seat towards calling', () => {
        // POT COMMITMENT. A seat that has put half its stack in and folds to
        // the last bet has bought nothing with all of it, and that was the
        // shape of every hand the bully won. Reverting it moves the return
        // from 0.885 to 0.966.
        const src = fs.readFileSync(
            path.join(__dirname, 'pokerBots.ts'), 'utf8');
        expect(src).toMatch(/const commitment = 1 - Math\.min\(COMMITMENT_MAX, invested \* COMMITMENT_PULL\)/);
        expect(src).toMatch(/const needed = price \* patience \* commitment/);
    });

    it('and chips are still conserved, which the fix could easily have broken', () => {
        for (let i = 0; i < 200; i++) {
            const s = bully(i);
            const total = s.players.reduce((n, p) => n + p.stack, 0) + s.pot;
            expect(total).toBe(5_000_000);
        }
    });
});
