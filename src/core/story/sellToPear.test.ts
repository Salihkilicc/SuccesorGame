// src/core/story/sellToPear.test.ts
//
// ============================================================================
//  THE LAST NUMBER THE PLAYER EVER READS
// ============================================================================
//
//  Selling to Pear is the only effect in the game with no quarter after it.
//  The ending fires in the same breath, so nothing recalculates and nothing
//  gets a second chance to be right.
//
//  That matters because `netWorth` is maintained ONCE A QUARTER, inside
//  advanceMonth, as cash plus your share of the valuation. Every other effect
//  can leave it alone because a tick always follows. This one cannot: the
//  closing record reads it, and a player who signed for a billion and a
//  quarter would be told on the last screen of the game that they were worth
//  four hundred million.
//
//  Which is the sort of thing that is only ever seen by somebody finishing the
//  game, once, and never reported clearly.
// ============================================================================

import { gameSink } from './gameSink';
import { useStatsStore } from '../store/useStatsStore';
import { pearOfferAmount } from './pearPrice';
import { readRecord } from './readRecord';
import { useStoryStore } from '../store/useStoryStore';

const setUp = (companyValue: number, money: number) => {
    useStoryStore.setState({ ending: null } as never);
    useStatsStore.setState({ companyValue, money, netWorth: money + companyValue * 0.4 } as never);
};

describe('signing', () => {
    it('pays exactly what the letter quoted', () => {
        setUp(1_000_000_000, 5_000_000);
        const before = (useStatsStore.getState() as any).money;
        gameSink().sellToPear();
        expect((useStatsStore.getState() as any).money)
            .toBe(before + pearOfferAmount(1_000_000_000));
    });

    it('and the floor still binds for the first letter', () => {
        setUp(4_500_000, 50_000);
        gameSink().sellToPear();
        expect((useStatsStore.getState() as any).money).toBe(50_000 + 48_000_000);
    });

    it('and it moves net worth, because no quarter is coming', () => {
        // The bug this exists for. Without it the record reads the figure
        // from before the sale.
        setUp(1_000_000_000, 5_000_000);
        gameSink().sellToPear();
        const stats = useStatsStore.getState() as any;
        expect(stats.netWorth).toBe(stats.money);
        expect(stats.netWorth).toBeGreaterThan(1_000_000_000);
    });

    it('and does not pay twice for the thing it just gave away', () => {
        // Set rather than added. The holding CONVERTS; adding the proceeds on
        // top of a net worth that still counts the company would credit the
        // player for both.
        setUp(1_000_000_000, 5_000_000);
        const inflated = (useStatsStore.getState() as any).netWorth;
        gameSink().sellToPear();
        const after = (useStatsStore.getState() as any).netWorth;
        expect(after).toBeLessThan(inflated + pearOfferAmount(1_000_000_000));
    });

    it('so the closing record shows the sale rather than the week before it', () => {
        // End to end, through the reader the overlay actually uses.
        setUp(1_000_000_000, 5_000_000);
        gameSink().sellToPear();
        const worth = readRecord().find(r => r.label === 'You were worth')!;
        expect(worth.value).toBe('$1.3B');
    });
});
