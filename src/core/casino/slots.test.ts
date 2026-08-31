// src/core/casino/slots.test.ts
//
// ============================================================================
//  FOUR SECONDS A SPIN, AND A WIN THAT WAS YOUR STAKE BACK WITH A TIP
// ============================================================================
//
//  Reported as "the slots are very slow, one spin every four seconds, they
//  spin and spin, and they are simple" and separately "the slots never pay".
//  Two complaints, and measuring them found that one was exact and the other
//  was false in the letter and completely right in the spirit.
//
//  THE SLOWNESS, measured on the old sequence:
//
//      setTimeout(2000)            the blur
//      + reel stagger 0/300/600    the stops
//      + 400                       the last settle
//      + setTimeout(1140)          "suspense", AFTER everything had landed
//      = 4.14 seconds
//
//  And for the whole first two seconds it called `setGrid` from a
//  `setInterval` every ninety milliseconds: a full React re-render of the
//  machine, eleven times a second, on the JavaScript thread. The spinning was
//  itself what made it slow.
//
//  Now 520 + 400 + 260 = 1.18 seconds, with one state write instead of
//  twenty two, and the 1140ms of suspense deleted outright. A flat wait after
//  the reels have stopped is not suspense, it is a pause: the player can
//  already see what they got.
//
//  THE PAYING, measured on the old numbers:
//
//      machine     any win    what it pays 23% of the time
//      Ticker        34%         x1.5
//      Boardroom     35%         x1.4
//      Dynasty       25%         x1.2
//
//  So it was not stingy. It was BORING. Staking a thousand and receiving
//  fifteen hundred is not a win, it is your money coming back with a tip, and
//  meanwhile roulette pays 2x on 48.6% of spins at a return three points
//  higher and feels generous.
//
//  So the RETURN does not move and the SHAPE does. Measured over two hundred
//  thousand spins on each machine after the reshape:
//
//      machine     RTP      any win    jackpot    near miss
//      Ticker      93.9%      24.8%      11.0%      18.9%
//      Boardroom   94.2%      22.2%       6.0%      19.5%
//      Dynasty     93.6%      11.2%       1.8%      22.3%
//
//  Fewer wins, and every one of them at least doubles the stake.
// ============================================================================

import {
    NEAR_MISS_SHARE,
    TARGET_RTP,
    expectedReturn,
    isBalanced,
    meanJackpot,
    secondOdds,
    slotWin,
    spinSlot,
    type SlotMachine,
} from './slots';
import { SLOT_CONFIG, VARIANTS } from '../../features/casino/logic/slotsData';

const machine = (over: Partial<SlotMachine> = {}): SlotMachine => ({
    payouts: [3, 4, 5, 6, 9],
    twoKindMultiplier: 2,
    jackpotOdds: 0.11,
    ...over,
});

describe('every machine returns the same, whatever it feels like', () => {
    it('all three are on target', () => {
        for (const v of VARIANTS) {
            expect(`${v}:${expectedReturn(SLOT_CONFIG[v]).toFixed(3)}`).toBe(`${v}:0.940`);
        }
    });

    it('and the house still wins, but not by much', () => {
        expect(TARGET_RTP).toBeGreaterThan(0.9);
        expect(TARGET_RTP).toBeLessThan(1);
    });

    it('and raising a payout does NOT move the return, which is the whole design', () => {
        // Three numbers decide a return and two of them are the design; the
        // third falls out. Edit a payout and the second prize rate re-solves.
        // Balanceable, which [9,12,18,30,60] is NOT: at a mean of 25.8 and a
        // jackpot one spin in nine, the jackpot leg alone returns 283% and
        // there is no slack left to solve with. The test found that, and it is
        // exactly what `isBalanced` exists to say.
        const generous = machine({ payouts: [4, 5, 6, 8, 12] });
        expect(isBalanced(generous)).toBe(true);
        expect(expectedReturn(generous)).toBeCloseTo(TARGET_RTP, 3);
        expect(secondOdds(generous)).toBeLessThan(secondOdds(machine()));
    });

    it('and a machine that cannot be balanced says so rather than paying 130%', () => {
        const absurd = machine({ jackpotOdds: 0.5, payouts: [50, 50, 50, 50, 50] });
        expect(isBalanced(absurd)).toBe(false);
        expect(secondOdds(absurd)).toBe(0);
        expect(secondOdds(absurd)).not.toBeNaN();
    });
});

describe('the reshape: same money, bigger parcels', () => {
    it('a second prize is now at least double the stake, on every machine', () => {
        // THE COMPLAINT, as a rule. x1.5 is not a win.
        for (const v of VARIANTS) {
            expect(`${v}:${SLOT_CONFIG[v].twoKindMultiplier >= 2}`).toBe(`${v}:true`);
        }
    });

    it('and it rises with the machine, the way the jackpots already did', () => {
        const [a, b, c] = VARIANTS.map(v => SLOT_CONFIG[v].twoKindMultiplier);
        expect(a).toBeLessThan(b);
        expect(b).toBeLessThan(c);
    });

    it('and it is correspondingly rarer, which is what keeps the return still', () => {
        // Raising it without this would be a pay rise, not a reshape.
        for (const v of VARIANTS) {
            const now = secondOdds(SLOT_CONFIG[v]);
            const before = secondOdds({ ...SLOT_CONFIG[v], twoKindMultiplier: 1.5 });
            expect(`${v}:${now < before}`).toBe(`${v}:true`);
        }
    });

    it('and three of a kind still pays far more than two, or the table is noise', () => {
        for (const v of VARIANTS) {
            expect(Math.min(...SLOT_CONFIG[v].payouts))
                .toBeGreaterThan(SLOT_CONFIG[v].twoKindMultiplier);
        }
    });

    it('and the two rates still fit inside one spin', () => {
        for (const v of VARIANTS) {
            const c = SLOT_CONFIG[v];
            expect(c.jackpotOdds + secondOdds(c)).toBeLessThan(0.9);
        }
    });
});

describe('the spin, run for real', () => {
    it('returns what it says over two hundred thousand spins', () => {
        // ------------------------------------------------------------------
        //  A REAL BOUND, NOT A ROUND ONE
        // ------------------------------------------------------------------
        //  I first wrote this as "within two points of 94%", and the Dynasty
        //  failed it - correctly. That machine pays a hundred times the stake
        //  one spin in two hundred and eighty, so a single spin has a standard
        //  deviation of about 6.7 and two hundred thousand of them have a
        //  standard error of 0.015. Two points was 1.3 sigma: a test that
        //  fails one run in five for no reason at all.
        //
        //  So the tolerance is COMPUTED from the machine rather than picked.
        //  Four standard errors, which is one false failure in sixteen
        //  thousand, and it tightens automatically for the quieter machines.
        //  It also documents the volatility ladder: the Dynasty is allowed to
        //  wander four times as far as the Ticker because it genuinely does.
        // ------------------------------------------------------------------
        const N = 200_000;
        for (const v of VARIANTS) {
            const m = SLOT_CONFIG[v];

            // E[X^2] over the three legs, which is what the variance needs.
            const meanSquareJackpot =
                m.payouts.reduce((a, p) => a + p * p, 0) / m.payouts.length;
            const eX2 = m.jackpotOdds * meanSquareJackpot
                + secondOdds(m) * m.twoKindMultiplier ** 2;
            const sd = Math.sqrt(Math.max(0, eX2 - TARGET_RTP ** 2));
            const tolerance = 4 * (sd / Math.sqrt(N));

            let returned = 0;
            for (let i = 0; i < N; i++) returned += spinSlot(m).multiplier;
            const rtp = returned / N;

            expect(`${v}:${Math.abs(rtp - TARGET_RTP) < tolerance}`).toBe(`${v}:true`);
        }
    });

    it('and the volatility ladder is real, not just a difference in feel', () => {
        // The three machines return the same money and differ in how wide the
        // swings are. If that ever stops being true the ladder is decoration.
        const sd = (m: typeof SLOT_CONFIG['ticker']) => {
            const meanSq = m.payouts.reduce((a, p) => a + p * p, 0) / m.payouts.length;
            return Math.sqrt(m.jackpotOdds * meanSq + secondOdds(m) * m.twoKindMultiplier ** 2);
        };
        const [a, b, c] = VARIANTS.map(v => sd(SLOT_CONFIG[v]));
        expect(a).toBeLessThan(b);
        expect(b).toBeLessThan(c);
    });

    it('and a jackpot really is three of the same face', () => {
        const m = machine({ jackpotOdds: 1 });
        for (let i = 0; i < 200; i++) {
            const s = spinSlot(m);
            expect(s.outcome).toBe('jackpot');
            expect(s.payline[0]).toBe(s.payline[1]);
            expect(s.payline[1]).toBe(s.payline[2]);
            expect(s.multiplier).toBe(m.payouts[s.payline[0]]);
        }
    });

    it('and what landed is what it pays, rather than a flat multiple', () => {
        // The payout table was decoration once, and the reels with it.
        const m = machine({ jackpotOdds: 1 });
        const seen = new Set<number>();
        for (let i = 0; i < 500; i++) seen.add(spinSlot(m).multiplier);
        expect(seen.size).toBeGreaterThan(1);
        for (const v of seen) expect(m.payouts).toContain(v);
    });

    it('and a second prize is two of a face and one of another', () => {
        const m = machine({ jackpotOdds: 0, twoKindMultiplier: 2 });
        let seen = 0;
        for (let i = 0; i < 2000 && seen < 50; i++) {
            const s = spinSlot(m);
            if (s.outcome !== 'second') continue;
            seen++;
            const [a, b, c] = s.payline;
            const pairs = (a === b ? 1 : 0) + (b === c ? 1 : 0) + (a === c ? 1 : 0);
            expect(`${a}${b}${c}:${pairs}`).toBe(`${a}${b}${c}:1`);
            expect(s.multiplier).toBe(2);
        }
        expect(seen).toBeGreaterThan(0);
    });

    it('and an ordinary loss is three DIFFERENT faces', () => {
        // Or it looks like a second prize that refused to pay.
        const m = SLOT_CONFIG.dynasty;
        for (let i = 0; i < 5000; i++) {
            const s = spinSlot(m);
            if (s.outcome !== 'nothing' || s.nearMiss) continue;
            const [a, b, c] = s.payline;
            expect(`${a},${b},${c}`).toBe(`${a},${b},${c}`);
            expect(new Set([a, b, c]).size).toBe(3);
            expect(s.multiplier).toBe(0);
        }
    });

    it('and a broken die does not produce a broken spin', () => {
        for (const bad of [() => NaN, () => -1, () => 1, () => Infinity]) {
            const s = spinSlot(SLOT_CONFIG.ticker, bad);
            expect(Number.isFinite(s.multiplier)).toBe(true);
            for (const face of s.payline) {
                expect(face).toBeGreaterThanOrEqual(0);
                expect(face).toBeLessThan(SLOT_CONFIG.ticker.payouts.length);
            }
        }
    });

    it('and a machine with too few faces cannot crash the floor', () => {
        expect(spinSlot(machine({ payouts: [2] })).outcome).toBe('nothing');
    });
});

describe('the near miss is honest', () => {
    it('it only ever describes a spin that has ALREADY lost', () => {
        // THE LINE THIS DOES NOT CROSS. Real machines stack their reels so
        // near misses happen more than chance would give, which changes what
        // a player believes about their odds. This changes nothing except
        // which of two losing pictures gets drawn.
        for (let i = 0; i < 20_000; i++) {
            const s = spinSlot(SLOT_CONFIG.ticker);
            if (s.nearMiss) {
                expect(s.outcome).toBe('nothing');
                expect(s.multiplier).toBe(0);
            }
        }
    });

    it('and it really is a miss: two the same, then not', () => {
        let seen = 0;
        for (let i = 0; i < 20_000 && seen < 200; i++) {
            const s = spinSlot(SLOT_CONFIG.ticker);
            if (!s.nearMiss) continue;
            seen++;
            expect(s.payline[0]).toBe(s.payline[1]);
            expect(s.payline[2]).not.toBe(s.payline[1]);
        }
        expect(seen).toBeGreaterThan(0);
    });

    it('and it happens to about a quarter of losses, not to most of them', () => {
        let losses = 0;
        let near = 0;
        for (let i = 0; i < 50_000; i++) {
            const s = spinSlot(SLOT_CONFIG.ticker);
            if (s.outcome !== 'nothing') continue;
            losses++;
            if (s.nearMiss) near++;
        }
        const share = near / losses;
        expect(Math.abs(share - NEAR_MISS_SHARE)).toBeLessThan(0.03);
        expect(NEAR_MISS_SHARE).toBe(0.25);
    });

    it('and the return is untouched by it, which is the proof', () => {
        // If dressing a loss changed the money, this would be rigging.
        const m = SLOT_CONFIG.boardroom;
        let returned = 0;
        let near = 0;
        for (let i = 0; i < 200_000; i++) {
            const s = spinSlot(m);
            returned += s.multiplier;
            if (s.nearMiss) near++;
        }
        expect(near).toBeGreaterThan(1000);
        expect(Math.abs(returned / 200_000 - TARGET_RTP)).toBeLessThan(0.02);
    });
});

describe('what a spin is worth in money', () => {
    it('is the multiplier times the stake, rounded', () => {
        expect(slotWin({ multiplier: 2.5 } as any, 1000)).toBe(2500);
        expect(slotWin({ multiplier: 0 } as any, 1000)).toBe(0);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(slotWin(null as any, 1000)).toBe(0);
        expect(slotWin({ multiplier: 2 } as any, -5)).toBe(0);
        expect(slotWin({ multiplier: NaN } as any, 1000)).toBe(0);
    });
});

describe('and a mean jackpot is the average of the table', () => {
    it('because three of a kind is equally likely to be any face', () => {
        expect(meanJackpot(machine({ payouts: [1, 2, 3] }))).toBe(2);
        expect(meanJackpot(machine({ payouts: [] }))).toBe(0);
    });
});
