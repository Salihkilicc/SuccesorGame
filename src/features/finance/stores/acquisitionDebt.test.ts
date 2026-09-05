// src/features/finance/stores/acquisitionDebt.test.ts
//
// ============================================================================
//  DEBT RAISED TO BUY A COMPANY USED TO VANISH
// ============================================================================
//
//  Reported as "sirketi dusmanca devralmada borcla alinca o borcu odemiyorsun",
//  and it was worse than not paying it.
//
//  Both doors - the friendly acquisition and the leveraged buyout of a
//  director's block - added `debtRaised` straight onto `companyDebtTotal` and
//  created no loan record. serviceDebtQuarter runs every quarter, sums the
//  LOANS, and writes that sum back over companyDebtTotal. So the borrowing was
//  not merely unserviced: it was ERASED on the next tick.
//
//  Measured before the fix: borrow 400M, and one quarter later the debt is 0,
//  with zero interest and zero principal ever charged. A player could buy any
//  company with money that stopped existing.
// ============================================================================

import { useCorporateFinanceStore } from './useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

const fin = () => useCorporateFinanceStore.getState() as unknown as {
    bookAcquisitionDebt: (amount: number, label?: string) => void;
    serviceDebtQuarter: (q: number) => { interest: number; principal: number };
    loans: { name: string; balance: number; rate: number }[];
};

beforeEach(() => {
    useCorporateFinanceStore.setState({ loans: [], totalDebt: 0 } as never);
    useStatsStore.setState({
        companyDebtTotal: 0, companyCapital: 1_000_000_000,
        companyValue: 2_000_000_000, isPublic: true,
    } as never);
});

describe('debt raised for a deal is a real loan', () => {
    it('and it exists as one, not as a number on a total', () => {
        fin().bookAcquisitionDebt(400_000_000, 'Acquisition: Acme');
        expect(fin().loans).toHaveLength(1);
        expect(useStatsStore.getState().companyDebtTotal).toBe(400_000_000);
        expect(fin().loans[0].name).toContain('Acme');
    });

    it('and the next quarter does not erase it', () => {
        // The measured failure, asserted directly: this used to be 0.
        fin().bookAcquisitionDebt(400_000_000);
        fin().serviceDebtQuarter(1);
        expect(useStatsStore.getState().companyDebtTotal).toBeGreaterThan(300_000_000);
    });

    it('and it charges interest and repays principal, like any other loan', () => {
        fin().bookAcquisitionDebt(400_000_000);
        const first = fin().serviceDebtQuarter(1);
        expect(first.interest).toBeGreaterThan(0);
        expect(first.principal).toBeGreaterThan(0);

        const afterOne = useStatsStore.getState().companyDebtTotal;
        fin().serviceDebtQuarter(1);
        const afterTwo = useStatsStore.getState().companyDebtTotal;
        expect(afterTwo).toBeLessThan(afterOne);
    });

    it('and it is gone once it has been paid off, not before', () => {
        fin().bookAcquisitionDebt(400_000_000);
        // Long enough to clear any term this product carries.
        fin().serviceDebtQuarter(200);
        expect(useStatsStore.getState().companyDebtTotal).toBe(0);
        expect(fin().loans).toHaveLength(0);
    });

    it('and nothing is booked for nothing', () => {
        fin().bookAcquisitionDebt(0);
        fin().bookAcquisitionDebt(-5_000_000);
        fin().bookAcquisitionDebt(NaN);
        expect(fin().loans).toHaveLength(0);
        expect(useStatsStore.getState().companyDebtTotal).toBe(0);
    });

    it('and two deals are two loans, both serviced', () => {
        fin().bookAcquisitionDebt(100_000_000, 'Acquisition: One');
        fin().bookAcquisitionDebt(250_000_000, 'Leveraged buyout');
        expect(fin().loans).toHaveLength(2);
        expect(useStatsStore.getState().companyDebtTotal).toBe(350_000_000);
        const s = fin().serviceDebtQuarter(1);
        expect(s.principal).toBeGreaterThan(0);
    });
});

describe('and both doors go through it', () => {
    const fs = require('fs');
    const path = require('path');
    const live = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', '..', ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');

    it('the acquisition books a loan rather than touching the total', () => {
        const src = live('features', 'finance', 'stores', 'useCorporateFinanceStore.ts');
        // The line that used to be here, and must not come back.
        expect(src).not.toMatch(/companyDebtTotal:\s*\(stats\.companyDebtTotal \|\| 0\) \+ fin\.debtRaised/);
        expect(src).toMatch(/bookAcquisitionDebt\(fin\.debtRaised/);
    });

    it('and so does the leveraged buyout', () => {
        const src = live('features', 'shareholders', 'stores', 'useShareholderStore.ts');
        expect(src).not.toMatch(/companyDebtTotal:\s*\(statsAll\.companyDebtTotal \|\| 0\) \+ quote\.debtRaised/);
        expect(src).toMatch(/bookAcquisitionDebt\(quote\.debtRaised/);
    });
});
