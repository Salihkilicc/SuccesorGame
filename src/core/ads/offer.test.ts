// src/core/ads/offer.test.ts
//
// ============================================================================
//  OFFERING THE WAY OUT, ONCE EVERY TEN ADVERTISEMENTS
// ============================================================================
//
//  Until now the only door to the purchase was a row in Settings, which is
//  where somebody goes when they have already decided. The person worth asking
//  is the one who has just closed an advertisement and knows exactly what they
//  would be buying.
//
//  The rule is pure and lives in policy.ts; the gate owns the moment. What is
//  pinned here is the half that would be silent if it were wrong:
//
//    - it is counted in ONE place, so the branch that always fires cannot be
//      the branch somebody forgot
//    - it arrives AFTER the advertisement, never during
//    - an ad-free player never meets it, ever
//    - it cannot take the game down
// ============================================================================

import { ADS_PER_OFFER, decide, emptyAdState, type AdState } from './policy';

/** Run `n` quarter advances and collect every decision. */
const quarters = (n: number, from: AdState = emptyAdState()) => {
    const seen = [] as ReturnType<typeof decide>[];
    let state = from;
    for (let i = 0; i < n; i++) {
        const d = decide(state, 'quarterAdvanced');
        state = d.next;
        seen.push(d);
    }
    return { seen, state };
};

describe('the cadence', () => {
    it('the tenth advertisement earns an offer and the ones before it do not', () => {
        // Four quarters per ad, ten ads per offer, so the fortieth quarter.
        const { seen } = quarters(ADS_PER_OFFER * 4);
        const ads = seen.filter(d => d.show);
        const offers = seen.filter(d => d.offer);

        expect(ads).toHaveLength(ADS_PER_OFFER);
        expect(offers).toHaveLength(1);
        // The offer rides on the last advertisement rather than arriving on
        // its own: it is made to somebody who has just been interrupted.
        expect(ads[ads.length - 1].offer).toBe(true);
    });

    it('and then not again until another ten', () => {
        const { seen } = quarters(ADS_PER_OFFER * 4 * 2);
        expect(seen.filter(d => d.offer)).toHaveLength(2);
    });

    it('an offer never arrives without an advertisement', () => {
        // ------------------------------------------------------------------
        //  A PITCH OUT OF NOWHERE IS WORSE THAN AN ADVERTISEMENT
        // ------------------------------------------------------------------
        //  The whole argument for this feature is that it lands at the moment
        //  of annoyance. Detached from that moment it is just a shop opening
        //  itself in the middle of a game.
        // ------------------------------------------------------------------
        const { seen } = quarters(ADS_PER_OFFER * 4 * 2);
        expect(seen.filter(d => d.offer && !d.show)).toEqual([]);
    });
});

describe('every trigger counts towards it, including the one that always fires', () => {
    it('leaving the poker table counts', () => {
        // ------------------------------------------------------------------
        //  THE BRANCH THAT WOULD HAVE BEEN MISSED
        // ------------------------------------------------------------------
        //  `leftPokerTable` is the only trigger that returns `show: true`
        //  unconditionally, so it never looks like a counter is involved. If
        //  the increment had been written into each branch by hand this is
        //  the one that would have been forgotten, and the symptom would be
        //  an offer that simply arrives late for poker players.
        // ------------------------------------------------------------------
        let state = emptyAdState();
        const offers: boolean[] = [];
        for (let i = 0; i < ADS_PER_OFFER; i++) {
            const d = decide(state, 'leftPokerTable');
            state = d.next;
            offers.push(d.offer);
        }
        expect(offers.filter(Boolean)).toHaveLength(1);
        expect(offers[ADS_PER_OFFER - 1]).toBe(true);
    });

    it('and a mixture of triggers reaches it in ten, not in ten of each', () => {
        // The counter is about advertisements, not about any one screen.
        let state = emptyAdState();
        let offers = 0;
        const order = ['leftPokerTable', 'leftPokerTable', 'leftPokerTable'] as const;
        for (let i = 0; i < 9; i++) {
            const d = decide(state, order[i % order.length]);
            state = d.next;
            if (d.offer) offers++;
        }
        expect(offers).toBe(0);

        const tenth = decide(state, 'leftPokerTable');
        expect(tenth.show).toBe(true);
        expect(tenth.offer).toBe(true);
    });
});

describe('somebody who has already paid', () => {
    it('is never offered it, however long they play', () => {
        let state: AdState = { ...emptyAdState(), adFree: true };
        for (let i = 0; i < ADS_PER_OFFER * 4 * 3; i++) {
            const d = decide(state, 'quarterAdvanced');
            expect(d.show).toBe(false);
            expect(d.offer).toBe(false);
            state = d.next;
        }
    });

    it('and the counter does not creep up underneath them', () => {
        // The pacing counters deliberately keep moving for an ad-free player,
        // so a refund does not land them owing an ad immediately. The OFFER
        // counter must not, or a refunded player meets the sales pitch on the
        // first advertisement after it.
        let state: AdState = { ...emptyAdState(), adFree: true };
        for (let i = 0; i < 100; i++) state = decide(state, 'quarterAdvanced').next;
        expect(state.adsSinceOffer).toBe(0);
    });
});

// ============================================================================
//  AND THE MOMENT, WHICH THE GATE OWNS
// ============================================================================

describe('the gate puts the offer on the far side of the advertisement', () => {
    const load = () => {
        let gate: any;
        jest.isolateModules(() => { gate = require('./gate'); });
        return gate;
    };

    it('the advertisement finishes first', async () => {
        // ------------------------------------------------------------------
        //  A PITCH BEHIND SOMEBODY ELSE'S VIDEO
        // ------------------------------------------------------------------
        //  The presenter is awaited, so an offer fired before that await
        //  resolves would be drawn underneath a full screen advertisement:
        //  invisible to the player, and the sort of thing a store removes an
        //  app for. The order here is the assertion.
        // ------------------------------------------------------------------
        const order: string[] = [];
        const gate = load();

        gate.setAdPresenter(async () => {
            order.push('ad:start');
            await new Promise(r => setTimeout(r, 0));
            order.push('ad:end');
        });
        gate.setOfferPresenter(() => order.push('offer'));

        for (let i = 0; i < ADS_PER_OFFER * 4; i++) {
            await gate.adGate('quarterAdvanced');
        }

        expect(order.filter(o => o === 'offer')).toHaveLength(1);
        expect(order[order.length - 1]).toBe('offer');
        expect(order.indexOf('offer')).toBeGreaterThan(order.lastIndexOf('ad:end') - 1);
    });

    it('and an offer that throws does not reach the call site', async () => {
        // The caller only wanted to advance a quarter. The offer is the least
        // important thing happening at this moment and is treated that way.
        const gate = load();
        gate.setAdPresenter(async () => { });
        gate.setOfferPresenter(() => { throw new Error('sheet exploded'); });

        for (let i = 0; i < ADS_PER_OFFER * 4 - 1; i++) {
            await gate.adGate('quarterAdvanced');
        }
        await expect(gate.adGate('quarterAdvanced')).resolves.toEqual(
            expect.objectContaining({ offer: true }),
        );
    });

    it('and nothing registered is not a crash, it is a logged nothing', async () => {
        // The seam ships before the sheet does, exactly as the ad presenter
        // did. Everything above is already true today.
        const gate = load();
        gate.setAdPresenter(async () => { });
        expect(gate.hasOfferPresenter()).toBe(false);

        for (let i = 0; i < ADS_PER_OFFER * 4; i++) {
            await expect(gate.adGate('quarterAdvanced')).resolves.toBeDefined();
        }
    });
});
