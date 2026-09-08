// src/core/story/surrogacy.test.ts
//
// ============================================================================
//  A DOOR THAT WAS OPEN TO EVERYONE, AND A DEAD END BEHIND CLOSING IT
// ============================================================================
//
//  The dating pool leans away from the player now rather than flipping a coin,
//  so a woman playing meets a woman about one time in five and can marry her.
//  That made a rule visible that had never been written: the only route to a
//  child was a button whose single condition was `isMarried`, and a couple of
//  the same gender pressing it produced a biological child out of nowhere.
//
//  MEASURED, before anything changed: FamilyMemberScreen line 505, the whole
//  condition was `partner.isMarried`. The two genders were compared nowhere in
//  the file, or anywhere else in the path.
//
//  And closing it alone would have been worse than leaving it. A founder who
//  dies with no children gets `diedWithoutAnHeir` and the RUN ENDS - so a
//  blocked button quietly turns marrying somebody of the same gender into a
//  decision to end the dynasty, which nobody chose and the game never says.
//
//  So: the button closes, a paid route opens, and this file holds both halves
//  plus the thing that matters more than either - that a dynasty started this
//  way actually reaches a successor.
// ============================================================================

import {
    SURROGACY_COST,
    SURROGACY_QUARTERS,
    advanceBooking,
    arrivesThisQuarter,
    canConceiveTogether,
    surrogacyOffer,
    type PendingBirth,
} from './surrogacy';

const booking = (quartersLeft: number): PendingBirth =>
    ({ name: 'Vera', gender: 'Female', quartersLeft });

describe('who needs the second door', () => {
    it('a couple of different genders does not', () => {
        expect(canConceiveTogether('male', 'female')).toBe(true);
        expect(canConceiveTogether('female', 'male')).toBe(true);
    });

    it('and a couple of the same gender does', () => {
        expect(canConceiveTogether('female', 'female')).toBe(false);
        expect(canConceiveTogether('male', 'male')).toBe(false);
    });

    it('and a save older than the field keeps the ordinary route', () => {
        // ------------------------------------------------------------------
        //  WHEN THE GAME DOES NOT KNOW, IT DOES NOT ACT ON A GUESS
        // ------------------------------------------------------------------
        //  PartnerProfile.gender is optional because every save written
        //  before the field has none. Taking the ordinary route away from a
        //  running dynasty over a missing field would be a bug that looks
        //  like a rule.
        // ------------------------------------------------------------------
        expect(canConceiveTogether(undefined, 'female')).toBe(true);
        expect(canConceiveTogether('female', undefined)).toBe(true);
        expect(canConceiveTogether(undefined, undefined)).toBe(true);
    });
});

describe('what the card is told to draw', () => {
    const same = {
        playerGender: 'female' as const,
        partnerGender: 'female' as const,
        isMarried: true,
        money: SURROGACY_COST,
    };

    it('nothing new, for a couple who can simply have one', () => {
        expect(surrogacyOffer({ ...same, partnerGender: 'male' }))
            .toEqual({ kind: 'notNeeded' });
    });

    it('and the offer, with the price and the wait, for a couple who cannot', () => {
        // The price and the wait are IN the offer, so the button can say them
        // before it is pressed rather than in an alert afterwards.
        expect(surrogacyOffer(same)).toEqual({
            kind: 'offered',
            cost: SURROGACY_COST,
            quarters: SURROGACY_QUARTERS,
            affordable: true,
        });
    });

    it('and it is still offered when the money is short, just not affordable', () => {
        // Hiding it would tell a player who cannot afford it today that the
        // route does not exist. It is a price, not a secret.
        const poor = surrogacyOffer({ ...same, money: SURROGACY_COST - 1 });
        expect(poor.kind).toBe('offered');
        expect(poor).toMatchObject({ affordable: false });
    });

    it('and the marriage rule is the one that was already there', () => {
        expect(surrogacyOffer({ ...same, isMarried: false }))
            .toEqual({ kind: 'unavailable', reason: 'notMarried' });
        expect(surrogacyOffer({ ...same, partnerGender: undefined, isMarried: false }))
            .toEqual({ kind: 'notNeeded' });
    });

    it('and once it is paid for the card counts down instead', () => {
        expect(surrogacyOffer({ ...same, pending: booking(2) }))
            .toEqual({ kind: 'waiting', quartersLeft: 2 });
    });

    it('and a booking outlives the couple that made it', () => {
        // ------------------------------------------------------------------
        //  NO REFUND, ON PURPOSE
        // ------------------------------------------------------------------
        //  The money is spent and the arrangement is made. Cancelling on a
        //  break-up would also make book-and-cancel a way to park cash
        //  through a quarter, which is a thing this game's players do.
        // ------------------------------------------------------------------
        expect(surrogacyOffer({ pending: booking(1) }))
            .toEqual({ kind: 'waiting', quartersLeft: 1 });
        expect(surrogacyOffer({ ...same, partnerGender: undefined, pending: booking(3) }).kind)
            .toBe('waiting');
    });
});

describe('and the wait is nine months, counted in quarters', () => {
    it('three of them', () => {
        expect(SURROGACY_QUARTERS).toBe(3);
    });

    it('and it reaches the child in exactly that many ticks, not one more', () => {
        let pending: PendingBirth | null = booking(SURROGACY_QUARTERS);
        const arrivals: number[] = [];
        for (let q = 1; q <= 6; q++) {
            if (arrivesThisQuarter(pending)) arrivals.push(q);
            pending = advanceBooking(pending);
        }
        expect(arrivals).toEqual([SURROGACY_QUARTERS]);
        expect(pending).toBeNull();
    });

    it('and an empty table stays empty', () => {
        expect(advanceBooking(null)).toBeNull();
        expect(arrivesThisQuarter(null)).toBe(false);
    });

    it('and the price is a price rather than a share of what you are worth', () => {
        // A percentage would bill a trillionaire ten billion for a medical
        // and legal arrangement. It is a service; services have prices.
        expect(SURROGACY_COST).toBeGreaterThan(100_000);
        expect(SURROGACY_COST).toBeLessThan(10_000_000);
    });
});
