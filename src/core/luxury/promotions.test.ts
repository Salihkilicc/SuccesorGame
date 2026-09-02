// src/core/luxury/promotions.test.ts
//
// ============================================================================
//  A BANNER THAT SAYS 15% OFF AND A CHECKOUT THAT HAS NEVER HEARD OF IT
// ============================================================================
//
//  Asked for as "I would like the shops to have taken out adverts, and for
//  those to change, and to be able to run campaigns".
//
//  The adverts were a hardcoded array of three shops, identical in the first
//  quarter and the fortieth, out of a catalogue of twenty seven.
//
//  ---------------------------------------------------------------------------
//  AND THE FAILURE THIS FILE IS REALLY GUARDING AGAINST
//  ---------------------------------------------------------------------------
//  Not "the ads do not rotate". The one that matters is a campaign that is
//  drawn and never charged, because that is the shape of nearly every defect
//  found in this project: a maintenance cost nobody billed, an appreciation
//  rate nobody read, a luxury row reading a store nobody writes to, a repair
//  formula the value curve had never been compared with.
//
//  A discount is therefore not a property of the banner. It is a property of
//  the ITEM AT THIS QUARTER, and the banner is generated from the same
//  function the till calls. The tests that matter are the ones at the bottom,
//  which check that the shelf, the cart and the till all ask it.
// ============================================================================

import {
    CAMPAIGNS_AT_ONCE, CAMPAIGN_QUARTERS, DISCOUNT_STEPS, FEATURED_COUNT,
    campaignsFor, discountFor, effectivePrice, featuredFor,
} from './promotions';
import { ITEMS, SHOPS } from '../../features/shopping/data/shoppingRegistry';

const QUARTERS = Array.from({ length: 120 }, (_, i) => i);

describe('the front page changes, and it changes on a schedule', () => {
    it('something is always running', () => {
        for (const q of QUARTERS) {
            expect([q, campaignsFor(SHOPS, q).length]).toEqual([q, CAMPAIGNS_AT_ONCE]);
        }
    });

    it('and an offer stands for a whole window, not for one quarter', () => {
        // Or the shop changes its mind every three months and no offer is ever
        // worth waiting for.
        for (let w = 0; w < 40; w++) {
            const first = campaignsFor(SHOPS, w * CAMPAIGN_QUARTERS);
            for (let i = 1; i < CAMPAIGN_QUARTERS; i++) {
                expect([w, i, campaignsFor(SHOPS, w * CAMPAIGN_QUARTERS + i)])
                    .toEqual([w, i, first]);
            }
        }
    });

    it('and then it changes, measured in QUARTERS rather than in windows', () => {
        // WALKED BY QUARTER ON PURPOSE, and a probe is the reason. The first
        // version of this indexed by window - `campaignsFor(w * WINDOW)` - and
        // it passed with the window length set to a hundred thousand, because
        // thirty windows is thirty distinct answers however long a window is.
        // A test that cannot see the front page freeze for the whole run is
        // not a test of a rotation.
        //
        // Thirty years of quarters, which is about the length of one
        // generation's run.
        const seen = new Set<string>();
        for (const q of QUARTERS) {
            seen.add(campaignsFor(SHOPS, q).map(c => c.shopId).sort().join('|'));
        }
        expect(seen.size).toBeGreaterThan(QUARTERS.length / CAMPAIGN_QUARTERS - 10);
        expect(seen.size).toBeGreaterThan(20);
    });

    it('and a window is short enough that a run sees many of them', () => {
        // The other half of the same thing: the rotation being correct is
        // worth nothing if it turns once a century.
        expect(CAMPAIGN_QUARTERS).toBeLessThanOrEqual(4);
        expect(CAMPAIGN_QUARTERS).toBeGreaterThan(0);
    });

    it('and it works its way round the whole catalogue, not three favourites', () => {
        // THE DEFECT. Three shops out of twenty seven, forever.
        const shopsSeen = new Set<string>();
        for (let w = 0; w < 60; w++) {
            for (const c of campaignsFor(SHOPS, w * CAMPAIGN_QUARTERS)) {
                shopsSeen.add(c.shopId);
            }
        }
        expect(shopsSeen.size).toBeGreaterThan(SHOPS.length * 0.7);
    });

    it('and no shop is on offer twice in the same quarter', () => {
        for (const q of QUARTERS) {
            const ids = campaignsFor(SHOPS, q).map(c => c.shopId);
            expect([q, new Set(ids).size]).toEqual([q, ids.length]);
        }
    });

    it('and the same quarter always gives the same answer', () => {
        // No Math.random anywhere, which is what makes a reload show the same
        // front page and two screens agree with each other.
        for (const q of [0, 1, 7, 33, 119]) {
            expect(campaignsFor(SHOPS, q)).toEqual(campaignsFor(SHOPS, q));
            expect(featuredFor(SHOPS, q).map(f => f.shop.id))
                .toEqual(featuredFor(SHOPS, q).map(f => f.shop.id));
        }
    });

    it('and it survives a quarter it was never given', () => {
        for (const q of [-5, 0.5, NaN, Infinity]) {
            expect(campaignsFor(SHOPS, q as number).length).toBe(CAMPAIGNS_AT_ONCE);
        }
        expect(campaignsFor([], 3)).toEqual([]);
    });
});

describe('and a discount is a real discount', () => {
    it('every offer is one of the steps, and none of them is ruinous', () => {
        // A 40% sale on a $6.5B tower moves more value in one press than most
        // quarters of trading. A campaign is a nudge, not a giveaway.
        for (const q of QUARTERS) {
            for (const c of campaignsFor(SHOPS, q)) {
                expect([q, DISCOUNT_STEPS.includes(c.discount)]).toEqual([q, true]);
                expect([q, c.discount <= 0.2]).toEqual([q, true]);
                expect([q, c.discount > 0]).toEqual([q, true]);
            }
        }
    });

    it('and it lands on every item in the shop that is running it', () => {
        const q = 6;
        const campaign = campaignsFor(SHOPS, q)[0];
        const theirs = ITEMS.filter(i => i.shopId === campaign.shopId);
        expect(theirs.length).toBeGreaterThan(0);

        for (const item of theirs) {
            expect([item.id, discountFor(item, SHOPS, q)])
                .toEqual([item.id, campaign.discount]);
            expect([item.id, effectivePrice(item, SHOPS, q)])
                .toEqual([item.id, Math.round(item.price * (1 - campaign.discount))]);
        }
    });

    it('and on nothing else', () => {
        const q = 6;
        const onOffer = new Set(campaignsFor(SHOPS, q).map(c => c.shopId));
        for (const item of ITEMS.filter(i => !onOffer.has(i.shopId))) {
            expect([item.id, discountFor(item, SHOPS, q)]).toEqual([item.id, 0]);
            expect([item.id, effectivePrice(item, SHOPS, q)])
                .toEqual([item.id, Math.round(item.price)]);
        }
    });

    it('and it never gives anything away for nothing', () => {
        for (const q of [0, 3, 11, 40]) {
            for (const item of ITEMS) {
                const p = effectivePrice(item, SHOPS, q);
                expect([item.id, p > 0 || item.price === 0]).toEqual([item.id, true]);
                expect([item.id, p <= item.price]).toEqual([item.id, true]);
                expect([item.id, p >= item.price * 0.8 - 1]).toEqual([item.id, true]);
            }
        }
    });

    it('and a price never comes out with cents on it', () => {
        for (const item of ITEMS) {
            expect(Number.isInteger(effectivePrice(item, SHOPS, 9))).toBe(true);
        }
    });
});

describe('and the front page is full even in a quiet quarter', () => {
    it('there are always three banners', () => {
        for (const q of QUARTERS) {
            expect([q, featuredFor(SHOPS, q).length]).toEqual([q, FEATURED_COUNT]);
        }
    });

    it('and the ones with an offer come first', () => {
        for (const q of [0, 4, 12, 30]) {
            const f = featuredFor(SHOPS, q);
            const discounts = f.map(x => x.discount);
            const sorted = [...discounts].sort((a, b) => (b > 0 ? 1 : 0) - (a > 0 ? 1 : 0));
            expect([q, discounts.map(d => d > 0)]).toEqual([q, sorted.map(d => d > 0)]);
        }
    });

    it('and no shop appears on it twice', () => {
        for (const q of QUARTERS) {
            const ids = featuredFor(SHOPS, q).map(f => f.shop.id);
            expect([q, new Set(ids).size]).toEqual([q, ids.length]);
        }
    });

    it('and every banner names a shop that exists', () => {
        const ids = new Set(SHOPS.map(s => s.id));
        for (const q of [0, 5, 17, 44]) {
            for (const f of featuredFor(SHOPS, q)) {
                expect([q, ids.has(f.shop.id)]).toEqual([q, true]);
            }
        }
    });

    it('and the offer on the banner is the offer at the till', () => {
        // THE ONE THAT MATTERS. Everything else here is a rotation working;
        // this is the difference between a campaign and a picture of one.
        for (const q of [0, 2, 8, 21]) {
            for (const f of featuredFor(SHOPS, q).filter(x => x.discount > 0)) {
                const item = ITEMS.find(i => i.shopId === f.shop.id);
                if (!item) continue;
                expect([q, f.shop.id, effectivePrice(item, SHOPS, q)])
                    .toEqual([q, f.shop.id, Math.round(item.price * (1 - f.discount))]);
            }
        }
    });

    it('and the offer really ends when the banner says it does', () => {
        for (const q of [0, 3, 10, 25]) {
            for (const f of featuredFor(SHOPS, q).filter(x => x.discount > 0)) {
                expect([q, f.endsQuarter >= q]).toEqual([q, true]);
                const after = discountFor({ shopId: f.shop.id }, SHOPS, f.endsQuarter + 1);
                const still = campaignsFor(SHOPS, f.endsQuarter + 1)
                    .some(c => c.shopId === f.shop.id);
                // Either it is gone, or it was drawn again in the next window,
                // which is luck rather than a bug. What must not happen is the
                // banner naming an end date the discount ignores.
                expect([q, still || after === 0]).toEqual([q, true]);
            }
        }
    });
});
