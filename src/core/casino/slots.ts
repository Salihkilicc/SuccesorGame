// src/core/casino/slots.ts
//
// ============================================================================
//  THE MACHINE, SEPARATED FROM THE SHOW
// ============================================================================
//
//  Second of the four engines, and the one that needed it most. Reported as
//  "the slots are very slow, one spin every four seconds, they spin and spin,
//  and they are simple".
//
//  MEASURED. `useSlotsLogic` ran `setTimeout(2000)`, then a second
//  `setTimeout(1140)` for "suspense", so a spin took 3.14 seconds before the
//  reel stagger on top. And during those two seconds it called `setGrid` from
//  a `setInterval` every ninety milliseconds - a full React re-render of the
//  whole machine, eleven times a second, on the JavaScript thread. That is
//  both halves of the complaint: it is slow, and the spinning itself is what
//  makes it slow.
//
//  None of that belongs next to the maths. This file decides what happened in
//  one synchronous call and has no opinion about how long it should take to
//  say so.
//
//  ---------------------------------------------------------------------------
//  AND THE OTHER COMPLAINT: "SLOTS NEVER PAY"
//  ---------------------------------------------------------------------------
//  Also measured, and it turned out to be false in the letter and true in the
//  spirit. The Ticker pays on 34% of spins. It is not stingy; it is BORING,
//  because the thing it pays 23% of the time is 1.5x - you stake a thousand
//  and get fifteen hundred, which is not a win, it is your money coming back
//  with a tip.
//
//  Meanwhile roulette pays 2x on 48.6% of spins and feels generous, at a
//  return only three points higher.
//
//  So the return does not move. The SHAPE does: the second prize becomes big
//  enough to be a win and correspondingly rarer. Same 94%, fewer and larger
//  parcels. See SECOND_PRIZE below.
//
//  PURE. No stores, no timers, no React, and the die is injected.
// ============================================================================

export type SlotOutcome = 'jackpot' | 'second' | 'nothing';

export interface SlotMachine {
    /** Payout for three of a kind, cheapest face first. Total return per unit. */
    payouts: readonly number[];
    /** Total return for two of a kind. */
    twoKindMultiplier: number;
    /** Chance of three of a kind. */
    jackpotOdds: number;
}

/** What every machine returns over a long enough evening. */
export const TARGET_RTP = 0.94;

/**
 * Three of a kind is equally likely to be any face, so a jackpot is worth the
 * AVERAGE of the payout table.
 */
export const meanJackpot = (m: SlotMachine): number => {
    const p = m.payouts;
    if (!p || p.length === 0) return 0;
    return p.reduce((a, b) => a + b, 0) / p.length;
};

/**
 * The chance of two of a kind, SOLVED rather than stored.
 *
 * Three numbers decide a return - the payout table, the jackpot rate and the
 * two-kind rate - and if all three are typed by hand then editing any one of
 * them silently moves the machine off its target. So two are the design and
 * the third falls out of them:
 *
 *      jackpot x meanPayout  +  second x twoKind  =  TARGET_RTP
 *
 * Which means raising the second prize AUTOMATICALLY makes it rarer, and that
 * is precisely the change this rewrite is making. The reshaping did not need
 * new arithmetic; it needed one number edited and this function left alone.
 */
export const secondOdds = (m: SlotMachine): number => {
    const two = Math.max(0.01, m.twoKindMultiplier);
    const fromJackpot = m.jackpotOdds * meanJackpot(m);
    const remaining = TARGET_RTP - fromJackpot;
    return Math.max(0, Math.min(1 - m.jackpotOdds, remaining / two));
};

export const expectedReturn = (m: SlotMachine): number =>
    m.jackpotOdds * meanJackpot(m) + secondOdds(m) * m.twoKindMultiplier;

/**
 * Whether a machine can be balanced at all.
 *
 * Solving the second rate absorbs a payout edit only while there is slack to
 * absorb it with. Once the jackpot leg alone exceeds the target, the second
 * prize goes to zero and the machine still pays out more than it takes.
 */
export const isBalanced = (m: SlotMachine): boolean =>
    m.jackpotOdds * meanJackpot(m) <= TARGET_RTP;

// ============================================================================
//  THE SPIN
// ============================================================================

export interface SlotSpin {
    outcome: SlotOutcome;
    /** Three indices into the payout table, left to right. What the reels show. */
    payline: [number, number, number];
    /** Total returned per unit staked. Zero on a loss. */
    multiplier: number;
}

// ============================================================================
//  THE NEAR MISS IS GONE, AND IT IS WORTH SAYING WHY
// ============================================================================
//
//  SHELVED:
//
//      /** The first two reels match and the third does not. */
//      nearMiss: boolean;
//
//      /** How often a LOSING spin is dressed as a near miss. */
//      export const NEAR_MISS_SHARE = 0.25;
//
//  The idea was that a quarter of losses would be drawn as `[face, face,
//  other]` so the third reel was worth watching, and the note beside it
//  argued this was honest because the outcome was already decided and only
//  the picture changed.
//
//  That argument was wrong, and the player found the hole in it: the picture
//  IS the game. `[face, face, other]` is also exactly what the second prize
//  looks like, so the machine was drawing the same three symbols in the same
//  three positions for a win and for a loss. Measured over 200,000 spins on
//  the Ticker, it came up as a LOSS twice as often as a win.
//
//  Reported twice, the second time as "two come up side by side and it is
//  still a loss, the slots are not right". Correct both times.
//
//  A near miss is also the one mechanic in slot design whose entire purpose
//  is to mislead the person playing. Removing it costs the machine nothing:
//  the last reel still hangs when the first two match, and that now means a
//  prize has already landed and the only question is how big.
// ============================================================================

const pick = (roll: () => number, n: number): number => {
    const raw = roll();
    const die = Number.isFinite(raw) ? raw : 0;
    return Math.min(n - 1, Math.max(0, Math.floor(die * n)));
};

/**
 * One spin, decided at once.
 *
 * `faces` is how many symbols the machine has, which is also the length of the
 * payout table.
 */
export const spinSlot = (m: SlotMachine, roll: () => number = Math.random): SlotSpin => {
    const faces = m.payouts.length;
    if (faces < 3) {
        return { outcome: 'nothing', payline: [0, 1, 2], multiplier: 0 };
    }

    const rawDie = roll();
    const die = Number.isFinite(rawDie) ? rawDie : 0;
    const jackpot = Math.max(0, m.jackpotOdds);
    const second = secondOdds(m);

    // ---- three of a kind ----
    if (die < jackpot) {
        const face = pick(roll, faces);
        return {
            outcome: 'jackpot',
            payline: [face, face, face],
            multiplier: m.payouts[face] ?? 0,
        };
    }

    // ------------------------------------------------------------------
    //  TWO OF A KIND, ALWAYS SHOWN IN FRONT
    // ------------------------------------------------------------------
    //  It used to put the odd symbol in the middle half the time, for
    //  variety. Variety lost to legibility: `[face, face, other]` every time
    //  means TWO IN FRONT IS ALWAYS A WIN, and the third reel only decides
    //  how much. A machine you can read at a glance beats one with a prettier
    //  spread of losing shapes.
    // ------------------------------------------------------------------
    if (die < jackpot + second) {
        const face = pick(roll, faces);
        let other = pick(roll, faces);
        if (other === face) other = (other + 1) % faces;
        return {
            outcome: 'second',
            payline: [face, face, other],
            multiplier: m.twoKindMultiplier,
        };
    }

    // ------------------------------------------------------------------
    //  NOTHING, AND IT HAS TO LOOK LIKE NOTHING
    // ------------------------------------------------------------------
    //  THE DEFECT, reported twice: "two come up side by side and it is still
    //  a loss". Measured before touching it, over 200,000 spins on the
    //  Ticker:
    //
    //      two side by side, PAID    17,281
    //      two side by side, LOST    35,900
    //
    //  So the shape that pays the second prize appeared, pixel for pixel,
    //  twice as often as a LOSS than as a win. There was no way to tell them
    //  apart, because there was nothing to tell apart: the same three symbols
    //  in the same three positions, one paying and one not.
    //
    //  That came from a "near miss" branch which built `[face, face, third]`
    //  on a quarter of losses, deliberately, to make the third reel worth
    //  watching. The comment two lines below it even claimed the opposite -
    //  that a loss "cannot be mistaken for a second prize that did not pay" -
    //  while the branch above it manufactured exactly that mistake.
    //
    //  A near miss is also the one mechanic in slot design that exists to
    //  mislead, and the player found it by being misled. It is gone. Losses
    //  are three different faces, and the anticipation is carried by the
    //  reels instead: the last one hangs when the first two match, which now
    //  always means a prize has already landed and the only question is its
    //  size. See features/casino/logic/useSlotsLogic.ts -> HANG_MS.
    //
    //  NO ODDS MOVED. `spinSlot` decides the outcome from the die before it
    //  picks a single face, so this changes only what the machine SHOWS.
    // ------------------------------------------------------------------
    const a = pick(roll, faces);
    let b = pick(roll, faces);
    if (b === a) b = (b + 1) % faces;
    let c = pick(roll, faces);
    while (c === a || c === b) c = (c + 1) % faces;
    return { outcome: 'nothing', payline: [a, b, c], multiplier: 0 };
};

/**
 * What a spin is worth, in money.
 *
 * `?? 0` does not catch NaN, so a machine with a broken multiplier used to pay
 * out NaN, which then propagated into the player's balance and turned the
 * whole game's money into NaN. Found by the edge case test.
 */
export const slotWin = (spin: SlotSpin, bet: number): number => {
    const mult = Number.isFinite(spin?.multiplier) ? (spin as SlotSpin).multiplier : 0;
    const stake = Number.isFinite(bet) ? Math.max(0, bet) : 0;
    return Math.round(stake * mult);
};
