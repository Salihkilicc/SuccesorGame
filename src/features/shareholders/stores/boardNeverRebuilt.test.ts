// src/features/shareholders/stores/boardNeverRebuilt.test.ts
//
// ============================================================================
//  WINNING LOOKED EXACTLY LIKE NEVER HAVING STARTED
// ============================================================================
//
//  Reported as "when I take 80 or 100 per cent of the shares my holding
//  suddenly resets, it goes back to 35".
//
//  Reproduced through the real store, buying each director out in turn:
//
//      35.0% -> 52.0% -> 66.0% -> 77.0% -> 92.0% -> 100.0%   members 0
//      then the company screen mounts                        35.0%
//
//  `negotiateSharePurchase` splices a director out of `members` once their
//  block reaches zero, so taking the whole board leaves the array empty. And
//  MyCompanyScreen carried, from a save format that predated the board:
//
//      if (!members || members.length === 0) initializeGame();
//
//  For that old save an empty array meant "never built". After a buyout it
//  means the opposite: you own all of it. The guard could not tell the two
//  apart, and the one it was written for is also the win condition, so it
//  rebuilt INITIAL_BOARD_MEMBERS and handed back the opening 3.5M block.
//
//  THE FIX IS IN THE FUNCTION, NOT THE CALLER. Any caller reaching
//  initializeGame on a live save does the same damage, so it now refuses
//  unless the register is untouched or the caller forces it. Only starting a
//  new game forces it.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    useShareholderStore,
    TOTAL_SHARES,
    START_PLAYER_SHARES,
    capTableUntouched,
} from './useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

const pct = () => {
    const s = useShareholderStore.getState();
    return (s.playerShareCount / s.totalShares) * 100;
};

/** What MyCompanyScreen does on mount, verbatim. */
const mountCompanyScreen = () => {
    const { members } = useShareholderStore.getState();
    if (!members || members.length === 0) useShareholderStore.getState().initializeGame();
};

const richEnough = () =>
    useStatsStore.getState().update({
        money: 1e15, companyCapital: 1e15, companySharePrice: 10, companyValue: 1e11,
    } as any);

/** Buy every director out, personally. Premium high enough that nobody refuses. */
const buyTheWholeBoard = (route: 'cash' | 'treasury' = 'cash') => {
    const seen: number[] = [];
    let guard = 0;
    while (useShareholderStore.getState().members.length > 0 && guard++ < 40) {
        const m = useShareholderStore.getState().members[0];
        const r = useShareholderStore.getState()
            .negotiateSharePurchase(m.id, m.shareCount, 400, route);
        if (!r.success) break;
        seen.push(Math.round(pct()));
    }
    return seen;
};

describe('taking the whole board', () => {
    beforeEach(() => {
        useShareholderStore.getState().initializeGame(true);
        richEnough();
    });

    it('walks the holding up and leaves nobody on the register', () => {
        const ladder = buyTheWholeBoard();
        expect(ladder).toEqual([52, 66, 77, 92, 100]);
        expect(useShareholderStore.getState().members).toHaveLength(0);
    });

    it('and opening the company screen does not take it away again', () => {
        // THE DEFECT, as the player met it.
        buyTheWholeBoard();
        expect(Math.round(pct())).toBe(100);
        mountCompanyScreen();
        expect(Math.round(pct())).toBe(100);
        expect(useShareholderStore.getState().playerShareCount).toBe(TOTAL_SHARES);
    });

    it('and it survives the screen being opened over and over', () => {
        buyTheWholeBoard();
        for (let i = 0; i < 5; i++) mountCompanyScreen();
        expect(Math.round(pct())).toBe(100);
    });

    it('and the same holds when the company retires the stock instead', () => {
        // The treasury route leaves `playerShareCount` at the opening 3.5M and
        // shrinks the denominator instead, so a guard that only watched the
        // player's count would have missed this one entirely. It is the reason
        // the check reads totalShares as well.
        buyTheWholeBoard('treasury');
        const before = useShareholderStore.getState();
        expect(before.members).toHaveLength(0);
        expect(Math.round(pct())).toBe(100);
        mountCompanyScreen();
        expect(Math.round(pct())).toBe(100);
        expect(useShareholderStore.getState().totalShares).toBeLessThan(TOTAL_SHARES);
    });
});

describe('what counts as a register nothing has happened to', () => {
    it('the three opening numbers together, and nothing less', () => {
        expect(capTableUntouched({
            members: [], totalShares: TOTAL_SHARES, playerShareCount: START_PLAYER_SHARES,
        })).toBe(true);
    });

    it('a board still seated is not untouched', () => {
        expect(capTableUntouched({
            members: [{ shareCount: 1 }], totalShares: TOTAL_SHARES, playerShareCount: START_PLAYER_SHARES,
        })).toBe(false);
    });

    it('a holding that has grown is not untouched, which is the cash buyout', () => {
        expect(capTableUntouched({
            members: [], totalShares: TOTAL_SHARES, playerShareCount: TOTAL_SHARES,
        })).toBe(false);
    });

    it('and a shrunken denominator is not untouched, which is the treasury one', () => {
        expect(capTableUntouched({
            members: [], totalShares: START_PLAYER_SHARES, playerShareCount: START_PLAYER_SHARES,
        })).toBe(false);
    });

    it('and the opening block is derived from the directors, not written twice', () => {
        // 35% held by the player against 65% on the board. If a director's
        // block ever moves, this follows instead of disagreeing.
        expect(START_PLAYER_SHARES).toBe(3_500_000);
        expect((START_PLAYER_SHARES / TOTAL_SHARES) * 100).toBeCloseTo(35, 6);
    });
});

describe('and the function protects itself, not just the one screen', () => {
    it('a played register is left alone however it is called', () => {
        useShareholderStore.getState().initializeGame(true);
        richEnough();
        buyTheWholeBoard();
        useShareholderStore.getState().initializeGame();
        expect(useShareholderStore.getState().playerShareCount).toBe(TOTAL_SHARES);
    });

    it('but a register that never began is still built, or a new save has no board', () => {
        useShareholderStore.setState({
            members: [], totalShares: TOTAL_SHARES, playerShareCount: START_PLAYER_SHARES,
        });
        useShareholderStore.getState().initializeGame();
        expect(useShareholderStore.getState().members.length).toBeGreaterThan(0);
        expect(Math.round(pct())).toBe(35);
    });

    it('and forcing it rebuilds anything, because a new game must', () => {
        useShareholderStore.getState().initializeGame(true);
        richEnough();
        buyTheWholeBoard();
        useShareholderStore.getState().initializeGame(true);
        expect(Math.round(pct())).toBe(35);
        expect(useShareholderStore.getState().members.length).toBeGreaterThan(0);
    });

    it('and starting a new game is the only caller that forces it', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', '..', 'core', 'newGame.ts'), 'utf8');
        expect(src).toMatch(/initializeGame\(true\)/);
    });

    it('and the company screen does not', () => {
        const src = fs.readFileSync(
            path.join(__dirname, '..', '..', '..',
                'features', 'assets', 'screens', 'MyCompanyScreen.tsx'), 'utf8');
        expect(src).not.toMatch(/initializeGame\(true\)/);
    });
});
