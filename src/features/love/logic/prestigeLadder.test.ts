// src/features/love/logic/prestigeLadder.test.ts
//
// ============================================================================
//  EIGHT TAPS FROM OLD MONEY TO A STUDENT BAR
// ============================================================================
//
//  Reported as the partners not getting richer as the company does. Every
//  piece looked right: `tiersOpenTo` tracks the money exactly, `TIER_STANDING`
//  ranks the rooms, and ONE tap in a clean quarter always produced the best
//  room the player had earned. Measured that way, at six wealths, it was
//  perfect - which is why it survived.
//
//  The demotion was in the SEARCH. It took the best room NOT COOLING OFF, and
//  a refusal shuts a room. So the second tap after a no got the next room
//  down, and the third got the one below that. Measured over one quarter of
//  ordinary tapping at a billion dollars, before anything changed:
//
//      refused -> ARTISTIC -> ARTISTIC -> ARTISTIC -> refused
//              -> BLUE_COLLAR -> refused -> STUDENT_LIFE
//
//  Nobody plays one tap a quarter. From the seat this is indistinguishable
//  from the money doing nothing, and worse than that: the FIRST card sets the
//  expectation and every card after it is poorer.
//
//  It also explains something that never added up. UNDERGROUND sits at the
//  bottom of TIER_STANDING and is therefore never the best room at any wealth
//  at all - so the cascade was the ONLY way anybody ever reached it. A tier
//  that can only be found by being turned down twice is a leak, not a design.
// ============================================================================

import { runCourtship, availableTiers, earnedTier } from './runCourtship';
import { TIER_STANDING, TIER_UNLOCK, tiersOpenTo } from './courtship';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useFamilyStore, initialFamilyState } from '../../../core/store/useFamilyStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import type { SocialTier } from '../../../data/relationshipTypes';

const rank = (t: SocialTier) => TIER_STANDING.indexOf(t);

/** A run, at a given size, with a given standing, and a clean history. */
const world = (companyValue: number, reputation: number) => {
    useStatsStore.setState({ companyValue } as never);
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true } as never);
    useStoryStore.setState({
        dials: { ...useStoryStore.getState().dials, publicReputation: reputation },
    } as never);
};

const WEALTHS: [string, number][] = [
    ['a new company', 4_500_000],
    ['a hundred million', 100_000_000],
    ['a billion', 1_000_000_000],
    ['ten billion', 10_000_000_000],
    ['five hundred billion', 500_000_000_000],
    ['two trillion', 2_000_000_000_000],
];

describe('a quarter of tapping never walks the player downhill', () => {
    it('at any of the six sizes, with a middling reputation', () => {
        for (const [label, value] of WEALTHS) {
            world(value, 60);
            const earned = earnedTier()!;
            const met: SocialTier[] = [];
            for (let tap = 0; tap < 12; tap++) {
                const r = runCourtship();
                if (r.kind === 'candidate') met.push(r.tier);
            }
            const below = met.filter(t => rank(t) < rank(earned));
            expect({ label, earned, below }).toEqual({ label, earned, below: [] });
        }
    });

    it('and a refusal costs the quarter rather than a rung', () => {
        // ------------------------------------------------------------------
        //  THE EXACT SEQUENCE THAT WAS REPORTED
        // ------------------------------------------------------------------
        //  A billion dollars and a die that always says no. Before: the tier
        //  walked down the ladder. Now: one refusal, then silence.
        // ------------------------------------------------------------------
        world(1_000_000_000, 60);
        const seq = Array.from({ length: 8 }, () => {
            const r = runCourtship(() => 1);
            return r.kind === 'candidate' ? r.tier : r.kind;
        });
        expect(seq[0]).toBe('refused');
        expect(seq.slice(1)).toEqual(Array(7).fill('nobody'));
    });

    it('and the room comes back once the cooling off is over', () => {
        // The cost is a WAIT, not a demotion, so the ladder has to be
        // climbable again afterwards or this is just a harsher bug.
        world(1_000_000_000, 60);
        expect(runCourtship(() => 1).kind).toBe('refused');
        expect(runCourtship(() => 0).kind).toBe('nobody');

        useFamilyStore.setState({ courtshipCooldown: {} } as never);
        expect(runCourtship(() => 0).kind).toBe('candidate');
    });
});

describe('and the room is the one the money bought', () => {
    it('every wealth lands on its own rung and no other', () => {
        for (const [label, value] of WEALTHS) {
            world(value, 95);
            const r = runCourtship(() => 0);
            expect({ label, kind: r.kind }).toEqual({ label, kind: 'candidate' });
            if (r.kind === 'candidate') {
                expect({ label, tier: r.tier }).toEqual({ label, tier: earnedTier() });
            }
        }
    });

    it('and it climbs strictly as the company grows', () => {
        const ladder = WEALTHS.map(([, v]) => {
            useStatsStore.setState({ companyValue: v } as never);
            return rank(earnedTier()!);
        });
        for (let i = 1; i < ladder.length; i++) {
            expect(ladder[i]).toBeGreaterThanOrEqual(ladder[i - 1]);
        }
        // And it really moves, or a flat ladder would pass the line above.
        expect(ladder[ladder.length - 1]).toBeGreaterThan(ladder[0] + 2);
    });

    it('and the earned room ignores the cooling off, which is the whole point', () => {
        world(2_000_000_000_000, 60);
        const top = earnedTier();
        useFamilyStore.setState({
            courtshipCooldown: { [top as string]: 99_999 },
        } as never);
        // Still the room they earned...
        expect(earnedTier()).toBe(top);
        // ...and therefore nobody, rather than the rung below it.
        expect(availableTiers()).not.toContain(top);
        expect(runCourtship(() => 0).kind).toBe('nobody');
    });
});

describe('and the tier nobody could reach on purpose', () => {
    it('UNDERGROUND is the best room at no wealth at all', () => {
        // ------------------------------------------------------------------
        //  WHY THIS IS HERE
        // ------------------------------------------------------------------
        //  It is bottom of TIER_STANDING by design - the room that is always
        //  open must never be the default, because it is the one that costs
        //  reputation to be seen in. Which means the cascade was the only
        //  route to it, and the cascade was the bug.
        // ------------------------------------------------------------------
        for (const value of [0, 1e6, 4.5e6, 5e7, 1e9, 1e12, 1e15]) {
            useStatsStore.setState({ companyValue: value } as never);
            expect({ value, best: earnedTier() }).not.toEqual({ value, best: 'UNDERGROUND' });
        }
        expect(TIER_STANDING[0]).toBe('UNDERGROUND');
        expect(TIER_UNLOCK.UNDERGROUND).toBe(0);
    });

    it('and it is still open, so nothing that reads the list has changed', () => {
        // `tiersOpenTo` is unchanged and other things read it. Only the
        // SEARCH picks differently.
        expect(tiersOpenTo(4_500_000)).toContain('UNDERGROUND');
    });
});
