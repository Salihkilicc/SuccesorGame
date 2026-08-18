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

    it('blocks no-confidence vote trigger during the first 4 years (month <= 48)', () => {
        // Player holds only 30% (< 50% majority), loss streak is 6, trust is critically low
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            currentMonth: 12, // Year 1
            quarter: 4,
        });

        expect(check.inGracePeriod).toBe(true);
        expect(check.conditionsMet).toBe(3); // All 3 conditions are technically met
        expect(check.triggered).toBe(false); // But vote is NOT triggered because of grace period
    });

    it('blocks no-confidence vote trigger at month 48 (end of Year 4)', () => {
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            currentMonth: FOUNDER_GRACE_PERIOD_MONTHS,
            quarter: FOUNDER_GRACE_PERIOD_QUARTERS,
        });

        expect(check.inGracePeriod).toBe(true);
        expect(check.triggered).toBe(false);
    });

    it('triggers no-confidence vote after the first 4 years (month 49 / quarter 17) if conditions are met', () => {
        const check = checkNoConfidence(mockMembers, 30, {
            ...failingContext,
            currentMonth: 49, // Year 5 Month 1
            quarter: 17,
        });

        expect(check.inGracePeriod).toBe(false);
        expect(check.conditionsMet).toBe(3);
        expect(check.triggered).toBe(true);
    });
});
