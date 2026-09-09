// src/core/story/manipulationNotice.test.ts
//
// ============================================================================
//  "I DID NOT UNDERSTAND WHY"
// ============================================================================
//
//  The report, in as many words: barred from the chair at a hundred per cent
//  ownership, nothing knowingly illegal done, no idea what happened. Two
//  causes. The false positive was fixed earlier - a treasury buyback lifted
//  the ownership percentage and the watch could not tell it from a purchase.
//
//  This is the other one, and it would have been true even with the detection
//  perfect: THE PLAYER WAS NEVER TOLD ANYTHING. A suspicious purchase went
//  into a ledger in silence, sat there for up to sixteen quarters - four years
//  of play - and then a verdict arrived. Working exactly as designed and
//  indistinguishable, from the seat, from the game breaking.
//
//  Nobody is charged without first being asked for their records. Two letters
//  now: one when the file opens, one when it becomes a real case. Each sent
//  once. The innocent are never written to at all, and that half is tested as
//  hard as the guilty half, because a game that warns everybody has just
//  replaced one meaningless signal with another.
// ============================================================================

import {
    noticeStage,
    noticesDue,
    type NoticeStage,
} from './manipulationNotice';
import {
    CASE_MINIMUM,
    caseStrength,
    recordSuspicion,
    type SuspiciousBuy,
} from './manipulation';

/** A purchase deep enough and large enough that the rule records it. */
const dodgy = (quarter: number, gained = 20): SuspiciousBuy =>
    recordSuspicion({
        quarter,
        price: 20,
        reference: 100,
        ownershipBefore: 10,
        ownershipAfter: 10 + gained,
    })!;

describe('the file is announced when it opens, not when it closes', () => {
    it('an empty ledger says nothing, which is most of every run', () => {
        expect(noticeStage([], [])).toBe('quiet');
        expect(noticesDue('quiet', [])).toEqual([]);
    });

    it('and the first entry opens it, before anything is proven', () => {
        // ------------------------------------------------------------------
        //  THE PLACEMENT IS THE WHOLE FIX
        // ------------------------------------------------------------------
        //  Proving needs the price to come BACK, which can be three years
        //  later. Waiting for it is what left the player in the dark, so the
        //  first letter goes on the ledger and not on the proven case.
        // ------------------------------------------------------------------
        expect(noticeStage([dodgy(4)], [])).toBe('opened');
    });

    it('and it hardens only once there is a case worth bringing', () => {
        const buys = [dodgy(4), dodgy(5)];
        expect(caseStrength(buys)).toBeGreaterThanOrEqual(CASE_MINIMUM);
        expect(noticeStage(buys, buys)).toBe('hardened');
    });

    it('and a file too thin to bring stays at the first letter', () => {
        // A SMALL purchase, at the shallowest discount the rule will even
        // write down. It is a question, not a case, and the second letter
        // must not arrive for one that would be dropped.
        //
        // 40 is the floor: `recordSuspicion` refuses anything above 40 per
        // cent of the reference, and refuses a gain under three points. So
        // this is the weakest entry that can exist at all.
        const slight = recordSuspicion({
            quarter: 4, price: 40, reference: 100,
            ownershipBefore: 10, ownershipAfter: 13,
        })!;
        expect(slight).toBeTruthy();
        expect(caseStrength([slight])).toBeLessThan(CASE_MINIMUM);
        expect(noticeStage([slight], [slight])).toBe('opened');
    });

    it('and the bar it uses is the same one the verdict uses', () => {
        // Picked numbers drift apart. This one is read from the judge, so the
        // second letter cannot arrive for a file that would be dropped and
        // cannot fail to arrive for one that would not.
        const src = require('fs').readFileSync(
            require('path').join(__dirname, 'manipulationNotice.ts'), 'utf8');
        expect(src).toContain('CASE_MINIMUM');
        expect(src).not.toMatch(/>= 0\.\d+/);
    });
});

describe('and each letter goes out once', () => {
    it('the second quarter of the same file is silent', () => {
        expect(noticesDue('opened', ['opened'])).toEqual([]);
        expect(noticesDue('hardened', ['opened', 'hardened'])).toEqual([]);
    });

    it('and a run that never escalates gets one letter in forty years', () => {
        let sent: NoticeStage[] = [];
        let posted = 0;
        for (let q = 1; q <= 160; q++) {
            const due = noticesDue(noticeStage([dodgy(4)], []), sent);
            posted += due.length;
            sent = [...sent, ...due];
        }
        expect(posted).toBe(1);
    });

    it('and one that crosses both bars at once still gets both, in order', () => {
        // ------------------------------------------------------------------
        //  THE SKIPPED FIRST LETTER
        // ------------------------------------------------------------------
        //  A player can open and prove a file in the same quarter. Sending
        //  only the louder letter would leave them reading "the review
        //  referred to in our earlier notice" for a notice they never had -
        //  which is the hole this file exists to close, reopened.
        // ------------------------------------------------------------------
        expect(noticesDue('hardened', [])).toEqual(['opened', 'hardened']);
    });

    it('and a save written before the letters existed starts from nothing', () => {
        expect(noticesDue('opened', undefined as never)).toEqual(['opened']);
    });
});

describe('and the innocent hear nothing at all', () => {
    it('buying your own stock on the way up is not a file', () => {
        // No discount, so `recordSuspicion` writes nothing, so the ledger is
        // empty, so no letter. The chain that keeps this honest.
        expect(recordSuspicion({
            quarter: 4, price: 120, reference: 100,
            ownershipBefore: 10, ownershipAfter: 40,
        })).toBeNull();
        expect(noticeStage([], [])).toBe('quiet');
    });

    it('and neither is a fall you did not buy into', () => {
        expect(recordSuspicion({
            quarter: 4, price: 10, reference: 100,
            ownershipBefore: 10, ownershipAfter: 10,
        })).toBeNull();
    });

    it('and neither is a treasury buyback, which is the reported one', () => {
        // The watch subtracts the buyback before this is called. Measured
        // here as the rule it is: a rise with no purchase behind it is not a
        // purchase.
        expect(recordSuspicion({
            quarter: 4, price: 20, reference: 100,
            ownershipBefore: 60, ownershipAfter: 60,
        })).toBeNull();
        expect(noticeStage([], [])).toBe('quiet');
    });
});
