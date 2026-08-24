// src/features/shareholders/stores/buyoutRoutes.test.ts
//
// ============================================================================
//  THAT THE MONEY COMES OUT OF WHOEVER AGREED TO PAY
// ============================================================================
//
//  buyoutFinancing.test.ts proves the quotes are right. This runs the store
//  against them, because a quote nothing spends is the failure this codebase
//  keeps finding: `calculateBuyoutPrice` was eighty correct lines that decided
//  nothing until last week.
//
//  Three things have to be true at once and none of them is visible from the
//  pure module:
//
//    the right purse empties            personal, treasury, or new debt
//    the shares go to the right place   the player, or nowhere at all
//    and the board is asked when it is their money
// ============================================================================

import { useShareholderStore } from './useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

const SHARES = 10_000_000;
const PRICE_PER_SHARE = 100;
const SIBLING_SHARES = 1_000_000;

/** A sibling as runSuccession seats them: Conservative, trust 40, not hostile. */
const SIBLING = {
    id: 'DIR_HEIR_kid2',
    name: 'Nora Hale',
    shareCount: SIBLING_SHARES,
    trait: 'Conservative' as const,
    trust: 40,
    relationship: 50,
    isHostile: false,
    origin: 'Founder' as const,
};

/** Trust 40 -> reluctance 0.60, Conservative -> 0.10. Seventy per cent over. */
const ASK = SIBLING_SHARES * PRICE_PER_SHARE * 1.7;

const setup = (opts: {
    playerCash: number;
    companyCapital: number;
    playerShares: number;
}) => {
    useStatsStore.setState({
        money: opts.playerCash,
        companyCapital: opts.companyCapital,
        companySharePrice: PRICE_PER_SHARE,
        companyValue: SHARES * PRICE_PER_SHARE,
        companyDebtTotal: 0,
    } as any);

    useShareholderStore.setState({
        members: [{ ...SIBLING }],
        totalShares: SHARES,
        playerShareCount: opts.playerShares,
    } as any);
};

/** Meet the ask exactly and force the die to say yes. */
const offerAtAsk = (route?: 'cash' | 'treasury' | 'leveraged') => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
        return useShareholderStore
            .getState()
            .negotiateSharePurchase(SIBLING.id, SIBLING_SHARES, 70, route);
    } finally {
        spy.mockRestore();
    }
};

describe('paying out of your own pocket', () => {
    beforeEach(() => setup({
        playerCash: ASK * 2,
        companyCapital: 1_000_000_000,
        playerShares: 3_300_000,
    }));

    it('empties your wallet and nobody else', () => {
        const capitalBefore = useStatsStore.getState().companyCapital;
        const r = offerAtAsk('cash');

        expect(r.success).toBe(true);
        expect(useStatsStore.getState().money).toBeCloseTo(ASK * 2 - ASK, 2);
        expect(useStatsStore.getState().companyCapital).toBe(capitalBefore);
        expect(useStatsStore.getState().companyDebtTotal).toBe(0);
    });

    it('and the shares end up yours', () => {
        offerAtAsk('cash');
        const st = useShareholderStore.getState();
        expect(st.playerShareCount).toBe(3_300_000 + SIBLING_SHARES);
        expect(st.totalShares).toBe(SHARES);
        expect(st.members).toHaveLength(0);
    });

    it('and it is still the default, so nothing that predates the routes changed', () => {
        const before = useStatsStore.getState().money;
        const r = offerAtAsk();
        expect(r.success).toBe(true);
        expect(useStatsStore.getState().money).toBeCloseTo(before - ASK, 2);
    });
});

describe('letting the company buy it back', () => {
    beforeEach(() => setup({
        // Deliberately broke. This is the successor's actual position and the
        // whole reason the route exists.
        playerCash: ASK / 20,
        companyCapital: ASK * 3,
        playerShares: 3_300_000,
    }));

    it('works when your own money never could', () => {
        expect(offerAtAsk('cash').success).toBe(false);
        expect(offerAtAsk('treasury').success).toBe(true);
    });

    it('spending the treasury and leaving your cash alone', () => {
        const before = useStatsStore.getState().money;
        offerAtAsk('treasury');
        expect(useStatsStore.getState().money).toBe(before);
        expect(useStatsStore.getState().companyCapital).toBeCloseTo(ASK * 3 - ASK, 2);
    });

    it('and the shares are torn up rather than handed over', () => {
        offerAtAsk('treasury');
        const st = useShareholderStore.getState();
        expect(st.playerShareCount).toBe(3_300_000);
        expect(st.totalShares).toBe(SHARES - SIBLING_SHARES);
    });

    it('which raises your percentage without buying you a single share', () => {
        // 33% of ten million becomes 36.7% of nine million. The count did not
        // move; the denominator did.
        const pct = () => {
            const st = useShareholderStore.getState();
            return (st.playerShareCount / st.totalShares) * 100;
        };
        const before = pct();
        offerAtAsk('treasury');
        expect(before).toBeCloseTo(33, 1);
        expect(pct()).toBeCloseTo(36.67, 1);
    });
});

describe('borrowing to do it', () => {
    // ------------------------------------------------------------------
    //  A MAJORITY HOLDER, SO THIS BLOCK IS ABOUT THE MONEY AND NOT THE VOTE
    // ------------------------------------------------------------------
    //  Above CONTROL_THRESHOLD only very large decisions go to the board, so
    //  these three can check where the cash came from and where the shares
    //  went without a vote in the way. Whether the board is asked at all is
    //  the block below, which is where a successor's thirty three per cent
    //  belongs.
    // ------------------------------------------------------------------
    beforeEach(() => setup({
        playerCash: 0,
        // Not enough to buy the holding outright, which is the case a loan is
        // for. The lender's own limit is MAX_RECAP_LEVERAGE of the valuation.
        companyCapital: ASK / 2,
        playerShares: 6_000_000,
    }));

    it('works when neither purse holds enough', () => {
        expect(offerAtAsk('treasury').success).toBe(false);
        expect(offerAtAsk('leveraged').success).toBe(true);
    });

    it('and the debt is on the company afterwards', () => {
        const capitalBefore = useStatsStore.getState().companyCapital;
        offerAtAsk('leveraged');
        expect(useStatsStore.getState().companyDebtTotal).toBeCloseTo(ASK, 2);
        expect(useStatsStore.getState().money).toBe(0);
        expect(useStatsStore.getState().companyCapital).toBe(capitalBefore);
    });

    it('retiring the shares the same way a treasury purchase does', () => {
        offerAtAsk('leveraged');
        expect(useShareholderStore.getState().totalShares).toBe(SHARES - SIBLING_SHARES);
    });
});

describe('and when it is the company paying, the company votes', () => {
    it('so a successor at thirty three per cent has to ask their family', () => {
        // ----------------------------------------------------------------
        //  THIS IS THE DESIGN RATHER THAN A SIDE EFFECT
        // ----------------------------------------------------------------
        //  CONTROL_THRESHOLD is fifty and the estate leaves a successor
        //  thirty three, so every company-funded buyout they attempt goes to
        //  a vote - and runSuccession seated their siblings on that board.
        //  Asking your brothers to approve spending the family firm to buy
        //  one of them out is the second generation in one sentence, and it
        //  falls out of two rules that were already written.
        //
        //  Found by this test rather than reasoned about: a company with an
        //  empty treasury cannot get a leveraged buyback past its board, and
        //  should not. Borrowing to retire your own paper buys nothing that
        //  earns and thins the equity underneath the debt.
        // ----------------------------------------------------------------
        setup({ playerCash: 0, companyCapital: 0, playerShares: 3_300_000 });
        const r = offerAtAsk('leveraged');
        expect(r.success).toBe(false);
        expect(r.message).toMatch(/board/i);
    });

    it('while buying it with your own money is nobody else\'s business', () => {
        setup({ playerCash: ASK * 2, companyCapital: 0, playerShares: 3_300_000 });
        const r = offerAtAsk('cash');
        expect(r.success).toBe(true);
        expect(r.message).not.toMatch(/board/i);
    });
});

describe('what the routes cannot do', () => {
    it('is buy below the asking price, whoever is paying', () => {
        // And the seller is asked BEFORE the board is. Putting a number the
        // seller will not take to a vote is not a decision, it is a wasted
        // quarter - this used to come back "the board voted it down" when the
        // real answer was that the offer was too low.
        setup({ playerCash: 1e15, companyCapital: 1e15, playerShares: 3_300_000 });
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
        for (const route of ['cash', 'treasury', 'leveraged'] as const) {
            const r = useShareholderStore
                .getState()
                .negotiateSharePurchase(SIBLING.id, SIBLING_SHARES, 0, route);
            expect(r.success).toBe(false);
            expect(r.message).toMatch(/wants/);
        }
        spy.mockRestore();
    });
});
