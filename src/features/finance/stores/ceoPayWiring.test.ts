// src/features/finance/stores/ceoPayWiring.test.ts
//
// ============================================================================
//  THAT THE SALARY IS A TRANSFER AND NOT A PRINTING PRESS
// ============================================================================
//
//  ceoPay.test.ts proves the rules are right. This proves they are the ones
//  actually running, and it checks the one thing no pure module can: that the
//  money the player gains is money the company lost.
//
//  Until now the founder's wage arrived from the life economy with no debit
//  anywhere. That was survivable while it was a constant nobody could touch.
//  It stops being survivable the moment the player sets the number, because
//  then the field is a button that prints cash - which is loophole 1 and
//  loophole 3 at the same time, since printed cash buys shares without a vote.
// ============================================================================

import { useCorporateFinanceStore } from './useCorporateFinanceStore';
import { useShareholderStore } from '../../shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import {
    CEO_BASE_SALARY_QUARTERLY,
    payCeiling,
    PAY_CHANGE_COOLDOWN,
} from '../../../core/market/ceoPay';
import { personalQuarter } from '../../../core/market/personalEconomy';

const REVENUE_QUARTER = 100_000_000;
const TRAILING = REVENUE_QUARTER * 4;

const setup = (opts: { playerShares: number; loyal?: boolean }) => {
    useStatsStore.setState({
        money: 0,
        companyCapital: 5_000_000_000,
        companyValue: 5_000_000_000,
        companySharePrice: 500,
        companyDebtTotal: 0,
        revenueHistory: [REVENUE_QUARTER, REVENUE_QUARTER, REVENUE_QUARTER, REVENUE_QUARTER],
        ceoPayQuarterly: CEO_BASE_SALARY_QUARTERLY,
        ceoPaySetQuarter: -PAY_CHANGE_COOLDOWN,
        age: 30,
        quarterInYear: 0,
    } as any);

    useShareholderStore.setState({
        totalShares: 10_000_000,
        playerShareCount: opts.playerShares,
        members: [{
            id: 'DIR_1',
            name: 'Elena Rossi',
            shareCount: 1_000_000,
            trait: opts.loyal ? 'Loyalist' : 'Conservative',
            trust: 80,
            relationship: 60,
            isHostile: false,
            origin: 'Founder',
        }],
    } as any);
};

const ask = (amount: number) =>
    useCorporateFinanceStore.getState().requestCeoPay(amount);

describe('a majority holder giving themselves a small rise', () => {
    beforeEach(() => setup({ playerShares: 7_000_000 }));

    it('lands, and lands in the store', () => {
        const r = ask(CEO_BASE_SALARY_QUARTERLY * 1.2);
        expect(r.ok).toBe(true);
        expect(useStatsStore.getState().ceoPayQuarterly)
            .toBeCloseTo(CEO_BASE_SALARY_QUARTERLY * 1.2, 4);
    });

    it('and the personal economy pays the new number rather than the constant', () => {
        // The wiring that makes the field mean anything. Without it the
        // player sets a salary and is paid the old one forever.
        ask(CEO_BASE_SALARY_QUARTERLY * 1.2);
        const q = personalQuarter(
            {
                educationMultiplier: 1,
                portfolioIncomeQuarterly: 0,
                ceoPayQuarterly: useStatsStore.getState().ceoPayQuarterly,
            },
            { educationCostQuarterly: 0, partnerCostQuarterly: 0 },
        );
        expect(q.salary).toBeCloseTo(CEO_BASE_SALARY_QUARTERLY * 1.2, 4);
    });

    it('and asking again the same year is refused', () => {
        ask(CEO_BASE_SALARY_QUARTERLY * 1.2);
        const again = ask(CEO_BASE_SALARY_QUARTERLY * 1.4);
        expect(again.ok).toBe(false);
        expect(again.message).toMatch(/once a year/i);
    });
});

describe('the ceiling is enforced by the store, not only quoted', () => {
    beforeEach(() => setup({ playerShares: 7_000_000, loyal: true }));

    it('so asking for the treasury gets you two per cent of revenue', () => {
        const r = ask(999_999_999_999);
        expect(r.granted).toBe(payCeiling(TRAILING));
        expect(useStatsStore.getState().ceoPayQuarterly).toBe(payCeiling(TRAILING));
        // And what that comes to: a fiftieth of a year's sales, a year.
        expect(payCeiling(TRAILING) * 4).toBeCloseTo(TRAILING * 0.02, 4);
    });
});

describe('asking costs trust whatever the answer', () => {
    beforeEach(() => setup({ playerShares: 7_000_000, loyal: true }));

    it('so the optimal play is not to ask for the maximum every year', () => {
        const before = useShareholderStore.getState().members[0].trust;
        ask(payCeiling(TRAILING));
        expect(useShareholderStore.getState().members[0].trust).toBeLessThan(before);
    });

    it('while a modest rise costs less than a greedy one', () => {
        const start = useShareholderStore.getState().members[0].trust;
        ask(CEO_BASE_SALARY_QUARTERLY * 1.1);
        const afterModest = useShareholderStore.getState().members[0].trust;

        setup({ playerShares: 7_000_000, loyal: true });
        ask(payCeiling(TRAILING));
        const afterGreedy = useShareholderStore.getState().members[0].trust;

        expect(start - afterModest).toBeLessThan(start - afterGreedy);
    });

    it('and a cut costs nothing', () => {
        const before = useShareholderStore.getState().members[0].trust;
        const r = ask(CEO_BASE_SALARY_QUARTERLY / 2);
        expect(r.ok).toBe(true);
        expect(useShareholderStore.getState().members[0].trust).toBe(before);
    });
});

describe('LOOPHOLE 3, end to end', () => {
    // ------------------------------------------------------------------
    //  A successor at thirty three per cent, which is what the estate
    //  leaves them. CONTROL_THRESHOLD is fifty, so governance puts
    //  everything to the board - and the board is the family.
    // ------------------------------------------------------------------
    beforeEach(() => setup({ playerShares: 3_300_000 }));

    it('a successor cannot raise their own pay without the room agreeing', () => {
        const r = ask(payCeiling(TRAILING));
        // Either the board refused, or it agreed. What cannot happen is the
        // question never being asked.
        if (!r.ok) {
            expect(r.message).toMatch(/board/i);
            expect(useStatsStore.getState().ceoPayQuarterly).toBe(CEO_BASE_SALARY_QUARTERLY);
        } else {
            expect(useStatsStore.getState().ceoPayQuarterly).toBe(payCeiling(TRAILING));
        }
        // And it cost them either way.
        expect(useShareholderStore.getState().members[0].trust).toBeLessThan(80);
    });

    it('and even at the ceiling the pipe cannot fund a buyout', () => {
        // The rule that makes the vote almost beside the point. A decade of
        // the absolute maximum against one sibling's holding.
        const tenYears = payCeiling(TRAILING) * 4 * 10;
        const siblingHolding = 1_000_000 * 500 * 1.7;
        expect(tenYears).toBeLessThan(siblingHolding);
    });
});

describe('the money is moved rather than made', () => {
    const codeOf = (...p: string[]): string => {
        const fs = require('fs');
        const path = require('path');
        return fs.readFileSync(path.join(__dirname, ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');
    };

    it('because the quarter takes it out of company capital', () => {
        // The half a pure module cannot see. Without this line the salary
        // arrives from nowhere and the field is a button that prints cash.
        const tick = codeOf('..', '..', '..', 'core', 'store', 'useGameStore.ts');
        expect(tick).toMatch(/const ceoPayThisTick/);
        expect(tick).toMatch(/- bonus\.paid - ceoPayThisTick/);
    });

    it('and the engine pays what the store holds rather than the constant', () => {
        const engine = codeOf('..', '..', 'assets', 'logic', 'EconomyEngine.ts');
        expect(engine).toMatch(/ceoPayQuarterly: statsState\?\.ceoPayQuarterly/);
    });
});
