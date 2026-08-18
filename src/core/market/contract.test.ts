// src/core/market/contract.test.ts
import {
    CONTRACT_PARTNERS,
    partnerProductLimits,
    quoteContractOrder,
    blendedQuality,
    marginComparison,
} from './contract';

describe('contract manufacturing scaling', () => {
    const apex = CONTRACT_PARTNERS.find(p => p.id === 'apex')!;
    const meridian = CONTRACT_PARTNERS.find(p => p.id === 'meridian')!;
    const local = CONTRACT_PARTNERS.find(p => p.id === 'local_assembly')!;

    it('scales phone (complexity 50) limits and steps properly', () => {
        const phoneApex = partnerProductLimits(apex, 50);
        expect(phoneApex.minUnits).toBe(200_000);
        expect(phoneApex.maxUnits).toBe(14_000_000);
        expect(phoneApex.step).toBe(280_000);

        const phoneLocal = partnerProductLimits(local, 50);
        expect(phoneLocal.minUnits).toBe(0);
        expect(phoneLocal.maxUnits).toBe(40_000);
        expect(phoneLocal.step).toBe(2_500);
    });

    it('scales electric car (complexity 3000) limits and steps properly', () => {
        const carApex = partnerProductLimits(apex, 3000);
        expect(carApex.minUnits).toBe(3334);
        expect(carApex.maxUnits).toBe(233333);
        expect(carApex.step).toBe(10000);

        const carMeridian = partnerProductLimits(meridian, 3000);
        expect(carMeridian.minUnits).toBe(167);
        expect(carMeridian.maxUnits).toBe(15000);
        expect(carMeridian.step).toBe(500);

        const carLocal = partnerProductLimits(local, 3000);
        expect(carLocal.minUnits).toBe(0);
        expect(carLocal.maxUnits).toBe(666);
        expect(carLocal.step).toBe(50);
    });

    it('scales quantum computer (complexity 700,000) limits properly', () => {
        const qApex = partnerProductLimits(apex, 700_000);
        expect(qApex.minUnits).toBe(15);
        expect(qApex.maxUnits).toBe(1000);
        expect(qApex.step).toBe(50);

        const qMeridian = partnerProductLimits(meridian, 700_000);
        expect(qMeridian.minUnits).toBe(1);
        expect(qMeridian.maxUnits).toBe(64);
        expect(qMeridian.step).toBe(25);
    });

    it('quotes contract orders with yield and cost multiplier', () => {
        const quote = quoteContractOrder(apex, 5000, 25000, 3000);
        expect(quote.units).toBe(5000);
        expect(quote.goodUnits).toBe(Math.floor(5000 * 0.985));
        expect(quote.unitCost).toBe(25000 * 1.30);
        expect(quote.cost).toBe(5000 * (25000 * 1.30));
    });

    it('calculates blended quality and margin comparison correctly', () => {
        const bq = blendedQuality(1000, 9, 1000, 7);
        expect(bq).toBe(8);

        const mc = marginComparison(45000, 25000, apex);
        expect(mc.ownMargin).toBe(20000);
        expect(mc.contractMargin).toBe(45000 - 25000 * 1.30);
    });
});
