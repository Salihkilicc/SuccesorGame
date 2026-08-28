// src/core/store/statsReset.test.ts
//
// ============================================================================
//  A NEW GAME INHERITED THE OLD ONE
// ============================================================================
//
//  `reset` is `set(() => ({ ...initialStatsState }))` and zustand's `set`
//  MERGES rather than replaces. So any key that is absent from
//  `initialStatsState` is not reset by it - it survives into the next run,
//  silently, for as long as the app is open.
//
//  Found by running three simulated games back to back. The second and third
//  opened the category gate in quarter one at tier one, because
//  `gateClearedByCategory` still held the FIRST run's answer.
//
//  `brandFloorByCategory` had the same hole and had had it all along: a brand
//  new company started with the earned floor of the company before it.
//
//  This is the test that would have caught both, and it is written against the
//  SHAPE rather than a list of field names, so a field added later is covered
//  the day it is added.
// ============================================================================

import { useStatsStore, initialStatsState } from './useStatsStore';

describe('resetting the stats', () => {
    it('clears the category maps, which are what a new run must not inherit', () => {
        useStatsStore.setState({
            brandByCategory: { Consumer: 400 },
            brandFloorByCategory: { Consumer: 200 },
            gateClearedByCategory: { Consumer: true },
        } as any);

        useStatsStore.getState().reset();

        const s = useStatsStore.getState();
        expect(s.brandByCategory).toEqual({});
        expect(s.brandFloorByCategory).toEqual({});
        expect(s.gateClearedByCategory).toEqual({});
    });

    it('and the counters too', () => {
        useStatsStore.setState({ quartersInsolvent: 3, lossStreak: 5 } as any);
        useStatsStore.getState().reset();
        expect(useStatsStore.getState().quartersInsolvent).toBe(0);
        expect(useStatsStore.getState().lossStreak).toBe(0);
    });

    it('and anything else that survives is named here on purpose', () => {
        // THE RULE THAT WOULD HAVE CAUGHT IT. Every object valued field the
        // store writes has to appear in `initialStatsState`, or `reset` cannot
        // clear it. Written against the shape so a field added tomorrow is
        // covered tomorrow.
        //
        // `_hasHydrated` is the one honest exception: it describes the STORE,
        // not the run, and clearing it would tell the app the disk read had
        // not happened.
        useStatsStore.setState({
            brandByCategory: { Consumer: 1 },
            brandFloorByCategory: { Consumer: 1 },
            gateClearedByCategory: { Consumer: true },
        } as any);
        const before = { ...useStatsStore.getState() };
        useStatsStore.getState().reset();
        const after = useStatsStore.getState() as any;

        const leaked = Object.keys(before).filter(k => {
            if (typeof (before as any)[k] === 'function') return false;
            if (k === '_hasHydrated') return false;
            const inInitial = k in (initialStatsState as any);
            return !inInitial && after[k] !== undefined;
        });
        expect(leaked).toEqual([]);
    });
});
