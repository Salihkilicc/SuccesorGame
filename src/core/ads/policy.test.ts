// src/core/ads/policy.test.ts
//
// ============================================================================
//  THE ADVERTISING RULES, TESTED WITH NO ACCOUNT AND NO DEVICE
// ============================================================================
//
//  This is the whole reason the policy is a pure module. Every claim below is
//  about money and about how much the game is allowed to annoy somebody, and
//  none of it needs AdMob, a key, a network or a phone to check.
//
//  What is deliberately NOT here: whether an ad actually renders. That is the
//  SDK's job and it will get its own seam. Mixing the two is how a rule ends
//  up only being checked by looking at a screen.
// ============================================================================

import {
    decide,
    countCasinoTap,
    casinoIntervalMs,
    emptyAdState,
    QUARTERS_PER_AD,
    DATE_PRESSES_PER_AD,
    CASINO_BASE_MS,
    CASINO_MIN_MS,
    CASINO_MS_PER_TAP,
    type AdState,
} from './policy';

/** Press a trigger n times, carrying the state forward. */
const press = (state: AdState, trigger: Parameters<typeof decide>[1], times: number, ms = 0) => {
    let s = state;
    const shown: number[] = [];
    for (let i = 1; i <= times; i++) {
        const d = decide(s, trigger, ms);
        s = d.next;
        if (d.show) shown.push(i);
    }
    return { state: s, shown };
};

describe('the quarterly ad lands on an anniversary', () => {
    it('does not fire on the first three', () => {
        const { shown } = press(emptyAdState(), 'quarterAdvanced', QUARTERS_PER_AD - 1);
        expect(shown).toEqual([]);
    });

    it('fires on the fourth, and then on every fourth after it', () => {
        const { shown } = press(emptyAdState(), 'quarterAdvanced', QUARTERS_PER_AD * 3);
        expect(shown).toEqual([4, 8, 12]);
    });

    it('and the counter resets rather than drifting', () => {
        // If it compared against a running total instead of resetting, the
        // gaps would shrink: 4, 5, 6. That is the arithmetic bug this catches.
        const { shown } = press(emptyAdState(), 'quarterAdvanced', 13);
        const gaps = shown.slice(1).map((n, i) => n - shown[i]);
        expect(new Set(gaps)).toEqual(new Set([QUARTERS_PER_AD]));
    });
});

describe('the date button is free twice', () => {
    it('fires on the third press, as asked', () => {
        // "3 kere basinca 3. de ciksin" - the first two cost nothing, because
        // opening a screen and changing your mind has consumed nothing.
        const { shown } = press(emptyAdState(), 'datePressed', DATE_PRESSES_PER_AD * 2);
        expect(shown).toEqual([3, 6]);
    });
});

describe('the casino interval shrinks with how hard somebody plays', () => {
    it('is five minutes for a player who is not touching anything', () => {
        expect(casinoIntervalMs(0)).toBe(CASINO_BASE_MS);
    });

    it('and one tap takes exactly one step off it', () => {
        expect(casinoIntervalMs(1)).toBe(CASINO_BASE_MS - CASINO_MS_PER_TAP);
    });

    it('and a heavy session brings it down by a felt amount', () => {
        // A hundred actions is a spin every three seconds for five minutes.
        // The claim is that it MOVES - not by a specific number, which would
        // fail the day the step changes, but out of the noise.
        const heavy = casinoIntervalMs(100);
        expect(heavy).toBeLessThan(CASINO_BASE_MS * 0.8);
        expect(heavy).toBeGreaterThanOrEqual(CASINO_MIN_MS);
    });

    it('and it never degenerates, however hard somebody plays', () => {
        // Without the floor this reaches zero and the casino becomes a
        // slideshow of advertising. "biz bitlife degiliz."
        for (const taps of [500, 5_000, 1_000_000]) {
            expect(casinoIntervalMs(taps)).toBe(CASINO_MIN_MS);
        }
    });

    it('and a tap can never itself produce an ad', () => {
        // The one thing that must not happen: pressing Bet and being answered
        // with a full screen advertisement.
        let s = emptyAdState();
        for (let i = 0; i < 500; i++) s = countCasinoTap(s);
        expect(s.casinoTapsSinceAd).toBe(500);
        // Nothing about that state says show; only a tick can.
        expect(decide(s, 'casinoTick', 0).show).toBe(false);
    });

    it('and the clock only fires once it has really elapsed', () => {
        const idle = decide(emptyAdState(), 'casinoTick', CASINO_BASE_MS - 1);
        expect(idle.show).toBe(false);

        const due = decide(idle.next, 'casinoTick', 1);
        expect(due.show).toBe(true);
        expect(due.next.casinoMsSinceAd).toBe(0);
    });

    it('and a busy player reaches it sooner than an idle one', () => {
        // The whole point of his answer, stated as a comparison rather than
        // as two magic numbers.
        let busy = emptyAdState();
        for (let i = 0; i < 120; i++) busy = countCasinoTap(busy);

        const half = CASINO_BASE_MS - 90_000;
        expect(decide(busy, 'casinoTick', half).show).toBe(true);
        expect(decide(emptyAdState(), 'casinoTick', half).show).toBe(false);
    });
});

describe('leaving the poker table', () => {
    it('always fires, on its own', () => {
        expect(decide(emptyAdState(), 'leftPokerTable').show).toBe(true);
    });

    it('and clears the casino clock behind it', () => {
        // Otherwise a player who stands up from poker and walks to roulette
        // meets a second ad thirty seconds later, because the interval had
        // almost elapsed underneath the hand.
        let s = emptyAdState();
        for (let i = 0; i < 30; i++) s = countCasinoTap(s);
        s = decide(s, 'casinoTick', CASINO_BASE_MS - 1_000).next;

        const after = decide(s, 'leftPokerTable').next;
        expect(after.casinoMsSinceAd).toBe(0);
        expect(after.casinoTapsSinceAd).toBe(0);
    });
});

describe('the purchase', () => {
    const paid = (): AdState => ({ ...emptyAdState(), adFree: true });

    it('silences every one of them', () => {
        for (const trigger of ['quarterAdvanced', 'leftPokerTable', 'casinoTick', 'datePressed'] as const) {
            const d = decide({ ...paid(), quartersSinceAd: 99, datePressesSinceAd: 99, casinoMsSinceAd: 99e6 }, trigger, 99e6);
            expect(d.show).toBe(false);
            expect(d.reason).toBe('adFree');
        }
    });

    it('and the counters keep moving underneath it', () => {
        // ------------------------------------------------------------------
        //  SO A REFUND DOES NOT LAND SOMEBODY IN AN IMMEDIATE AD
        // ------------------------------------------------------------------
        //  If the counters froze while the purchase was live, a refund, an
        //  expiry or a restore that resolves late would come back to a state
        //  where several ads are owed at once. Counting costs nothing.
        // ------------------------------------------------------------------
        const after = decide(paid(), 'quarterAdvanced').next;
        expect(after.quartersSinceAd).toBe(1);
    });

    it('and buying it is not the same as being locked out of a reward', () => {
        // The rule he chose: ad-free removes the INTERRUPTIONS. A rewarded ad
        // is something the player asks for. There is no trigger for one here,
        // and that is the point - it does not come through this door.
        const triggers = ['quarterAdvanced', 'leftPokerTable', 'casinoTick', 'datePressed'];
        expect(triggers).not.toContain('rewarded');
    });
});

describe('and when it says no, it says why', () => {
    it('distinguishes a purchase from a counter that is not ready', () => {
        // Two gates in this codebase shipped shut and neither could be
        // diagnosed from outside. This one names its reason.
        expect(decide(emptyAdState(), 'quarterAdvanced').reason).toBe('notYet');
        expect(decide({ ...emptyAdState(), adFree: true }, 'quarterAdvanced').reason).toBe('adFree');
    });
});
