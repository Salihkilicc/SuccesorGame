import {
    checkNoConfidence,
    voteNoConfidence,
    FOUNDER_GRACE_PERIOD_MONTHS,
    FOUNDER_GRACE_PERIOD_QUARTERS,
    type CompanyContext,
    type GovMember,
} from './governance';

describe('Founder Grace Period (First 4 Years Governance Protection)', () => {
    const mockMembers: GovMember[] = [
        {
            id: 'm1',
            name: 'Director 1',
            trait: 'Conservative',
            trust: 10,
            shareCount: 200_000,
            temperament: 'Conservative',
            seatOrigin: 'inherited',
        },
        {
            id: 'm2',
            name: 'Director 2',
            trait: 'Shark',
            trust: 15,
            shareCount: 150_000,
            temperament: 'Aggressive',
            seatOrigin: 'appointed',
        },
    ];

    const failingContext: CompanyContext = {
        profitable: false,
        leverage: 10,
        inBreach: true,
        lossStreak: 6,
        priceVsPeak: 0.2,
    };

    it('blocks no-confidence vote trigger during the first 4 years', () => {
        // Player holds only 30% (< 50% majority), loss streak is 6, trust is critically low
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            elapsedQuarters: 4, // end of year one
        });

        expect(check.inGracePeriod).toBe(true);
        expect(check.conditionsMet).toBe(3); // All 3 conditions are technically met
        expect(check.triggered).toBe(false); // But vote is NOT triggered because of grace period
    });

    it('blocks it on the last quarter of year four, and not one after', () => {
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            elapsedQuarters: FOUNDER_GRACE_PERIOD_QUARTERS,
        });

        expect(check.inGracePeriod).toBe(true);
        expect(check.triggered).toBe(false);
    });

    it('triggers no-confidence vote after the first 4 years if conditions are met', () => {
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            elapsedQuarters: FOUNDER_GRACE_PERIOD_QUARTERS + 1,
        });

        expect(check.inGracePeriod).toBe(false);
        expect(check.conditionsMet).toBe(3);
        expect(check.triggered).toBe(true);
    });
});


// ============================================================================
//  THE PROTECTION THAT NEVER EXPIRED
// ============================================================================
//
//  Reported as "bu board beni ilk dort yil koruyor ya, o cok daha fazla
//  suruyor, bitmiyor bile olabilir". It never ended.
//
//  The check was an OR of two clocks in different units:
//
//      currentMonth <= 48  ||  quarter <= 16
//
//  so either could keep the founder protected on its own. And the one the
//  caller passed - `useGameStore.currentMonth` - WRAPS to 1-12 every year, so
//  it never reached 48 and the quarter derived from it never reached 4. Both
//  halves were permanently true and the board could not depose anybody at any
//  point in a run.
//
//  useGameStore documents the identical trap forty lines from where it built
//  this context: the quarterly period label "read Q2 Year 1 nearly forever"
//  because it too derived a year from a field that wraps. Two bugs, one cause,
//  and the second was written after the first was found and explained.
//
//  The three tests above never caught it because they passed the two clocks in
//  AGREEMENT - 48 with 16, 49 with 17 - which is the one case where an OR of
//  two units behaves.
// ============================================================================

describe('the founder protection', () => {
    // Its own board rather than the one above, which lives inside another
    // describe. Two hostile directors and a player under the threshold, so
    // all three no-confidence conditions are met and only the grace period
    // is deciding anything.
    const hostileBoard: GovMember[] = [
        { id: 'a', name: 'A', trait: 'Conservative', trust: 10, shareCount: 200_000 },
        { id: 'b', name: 'B', trait: 'Shark', trust: 15, shareCount: 150_000 },
    ];

    const failing = {
        profitable: false,
        leverage: 5,
        inBreach: true,
        lossStreak: 6,
        priceVsPeak: 0.2,
    };

    it('is measured in one unit that does not wrap', () => {
        // A month that wraps to 1-12 can never express year five.
        const late = checkNoConfidence(hostileBoard, 30, {
            ...failing,
            elapsedQuarters: 40,
        });
        expect(late.inGracePeriod).toBe(false);
        expect(late.triggered).toBe(true);
    });

    it('and it ends, which is the whole complaint', () => {
        // Walk a decade a quarter at a time. There has to be a first quarter
        // where the board can act, and it has to be quarter seventeen.
        const firstUnprotected = Array.from({ length: 40 }, (_, i) => i + 1)
            .find(q => !checkNoConfidence(hostileBoard, 30, {
                ...failing, elapsedQuarters: q,
            }).inGracePeriod);
        expect(firstUnprotected).toBe(FOUNDER_GRACE_PERIOD_QUARTERS + 1);
    });

    it('and a context with no clock at all is NOT protected', () => {
        // The old shape defaulted to safety: an absent field meant the OR
        // fell through to the other one. Absent now means the board is free,
        // because a protection nobody can prove has expired is the bug this
        // whole entry is about.
        const noClock = checkNoConfidence(hostileBoard, 30, { ...failing });
        expect(noClock.inGracePeriod).toBe(false);
    });
});
