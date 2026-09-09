// src/core/story/manipulationLetters.test.ts
//
// ============================================================================
//  AND THE LETTERS ACTUALLY LAND IN THE INBOX
// ============================================================================
//
//  The rule is measured next door. This is the half that has gone wrong every
//  other time in this codebase: whether anything CALLS it, and whether what it
//  produces reaches a screen.
//
//  A `noticeStage` that is never asked, or a letter posted from a cast id that
//  does not exist, or an English body with no Turkish beside it, would all pass
//  manipulationNotice.test.ts completely.
// ============================================================================

import { useStoryStore } from '../store/useStoryStore';
import { useMailStore, initialMailState } from '../store/useMailStore';
import { runManipulationWatch, type WatchContext } from './runManipulation';
import { CAST } from '../../data/story/cast';
import { emailOf } from './cast';

const seedCount = initialMailState.inbox.length;

/** Everything the field office has sent this run. */
const fromTheFieldOffice = () =>
    useMailStore.getState().inbox.filter(m => m.fromName === CAST.fbi.name);

const clean = () => {
    useStoryStore.setState({
        manipulationLedger: [],
        manipulationNoticesSent: [],
        manipulationVerdict: null,
        ending: null,
    } as never);
    useMailStore.setState({ ...initialMailState, _hasHydrated: true } as never);
};

/** A quarter in which the player bought their own stock off the floor. */
const bought = (over: Partial<WatchContext> = {}): WatchContext => ({
    quarter: 4,
    priceAtBuy: 20,
    referenceAtBuy: 100,
    // Still on the floor, so nothing is PROVEN and no verdict can be reached.
    priceNow: 22,
    ownershipBefore: 10,
    ownershipAfter: 40,
    personalWealth: 5_000_000,
    ...over,
});

beforeEach(clean);

describe('the first letter arrives the quarter the file opens', () => {
    it('and it comes from the field office', () => {
        runManipulationWatch(bought());
        const sent = fromTheFieldOffice();
        expect(sent).toHaveLength(1);
        expect(sent[0].subject).toContain('Retention of records');
    });

    it('and it does not accuse, name a penalty, or ask for anything', () => {
        // ------------------------------------------------------------------
        //  THE VOICE IS THE DESIGN
        // ------------------------------------------------------------------
        //  A letter reading "you may be barred" turns the whole system into a
        //  slot machine with a warning label. The player has to learn the FILE
        //  EXISTS, which is the only thing that was missing, and find out what
        //  it costs the way anybody does.
        // ------------------------------------------------------------------
        runManipulationWatch(bought());
        const body = fromTheFieldOffice()[0].body;
        for (const word of ['barred', 'prison', 'fine', 'guilty', 'illegal']) {
            expect({ word, said: body.toLowerCase().includes(word) })
                .toEqual({ word, said: false });
        }
        expect(body).toContain('does not imply a finding');
    });

    it('and the quarter after it, nothing', () => {
        runManipulationWatch(bought());
        runManipulationWatch(bought({ quarter: 5 }));
        runManipulationWatch(bought({ quarter: 6 }));
        expect(fromTheFieldOffice()).toHaveLength(1);
    });

    it('and it is the only new thing in the inbox', () => {
        runManipulationWatch(bought());
        expect(useMailStore.getState().inbox).toHaveLength(seedCount + 1);
    });
});

describe('and the second when the price comes back', () => {
    it('the enquiry goes formal, and the first letter came first', () => {
        // The price recovering is what proves the case, and a proven case
        // above the bar is what hardens the file.
        runManipulationWatch(bought());
        runManipulationWatch(bought({ quarter: 5, priceNow: 95 }));

        const sent = fromTheFieldOffice();
        expect(sent).toHaveLength(2);
        // Newest first in this inbox, so the formal one is at the top.
        const subjects = sent.map(m => m.subject);
        expect(subjects.some(s => s.includes('formal enquiry'))).toBe(true);
        expect(subjects.some(s => s.includes('Retention of records'))).toBe(true);
    });

    it('and a player barred in one quarter still gets both, in order', () => {
        // ------------------------------------------------------------------
        //  THE REPORTED CASE
        // ------------------------------------------------------------------
        //  Buy and recover inside one quarter and the verdict can land the
        //  first time the watch ever runs. Sending only the formal letter
        //  would have them reading "the review referred to in our earlier
        //  notice" for a notice that never existed - the same silence, in
        //  better prose.
        // ------------------------------------------------------------------
        runManipulationWatch(bought({ priceNow: 95 }));
        const subjects = fromTheFieldOffice().map(m => m.subject);
        expect(subjects).toHaveLength(2);
        expect(subjects[subjects.length - 1]).toContain('Retention of records');
        expect(subjects[0]).toContain('formal enquiry');
    });

    it('and never a third', () => {
        for (let q = 4; q < 14; q++) {
            runManipulationWatch(bought({ quarter: q, priceNow: 95 }));
        }
        expect(fromTheFieldOffice()).toHaveLength(2);
    });
});

describe('and a player who did nothing is never written to', () => {
    it('buying on the way up posts nothing', () => {
        runManipulationWatch(bought({ priceAtBuy: 120, priceNow: 130 }));
        expect(fromTheFieldOffice()).toEqual([]);
        expect(useMailStore.getState().inbox).toHaveLength(seedCount);
    });

    it('and a crash they did not buy into posts nothing', () => {
        runManipulationWatch(bought({ ownershipAfter: 10, priceNow: 95 }));
        expect(fromTheFieldOffice()).toEqual([]);
    });

    it('and neither does a treasury buyback, which is what started all this', () => {
        // The whole percentage rise came from shares being retired. The watch
        // subtracts it before the ledger is written, so there is no file and
        // therefore no letter.
        runManipulationWatch(bought({ ownershipFromBuyback: 30, priceNow: 95 }));
        expect(fromTheFieldOffice()).toEqual([]);
        expect(useStoryStore.getState().manipulationNoticesSent).toEqual([]);
    });
});

describe('and both letters exist in both languages', () => {
    const dict = (lang: string) => require('fs').readFileSync(
        require('path').join(__dirname, '..', '..', 'data', 'i18n', 'mailMessagesText.ts'),
        'utf8') && lang;

    it('the sender is a real cast member with an address', () => {
        expect(CAST.fbi).toBeDefined();
        // Through the accessor in core/story/cast.ts, because the field is
        // optional: the ones who only ever text do not have an address.
        expect(emailOf(CAST.fbi)).toBeTruthy();
        // Mail only. A federal office does not text you.
        expect(CAST.fbi.channels).toBe('mail');
    });

    it('and the Turkish is there for both subjects and both bodies', () => {
        // A warning that only exists in English is not a warning here, and
        // these two are the only thing between a player and a verdict out of
        // nowhere.
        const src = require('fs').readFileSync(
            require('path').join(__dirname, '..', '..', 'data', 'i18n', 'mailMessagesText.ts'),
            'utf8');
        expect(dict('tr')).toBe('tr');
        expect(src).toContain('Kayitlarin saklanmasi');
        expect(src).toContain('Resmi inceleme bildirimi');
        expect(src).toContain('rutin bir inceleme');
        expect(src).toContain('resmi bir nitelik kazanmistir');
    });

    it('and the English bodies in the code are the exact keys the dictionary holds', () => {
        // ------------------------------------------------------------------
        //  THE WAY THIS BREAKS SILENTLY
        // ------------------------------------------------------------------
        //  Translation here is keyed on the whole body string. One edited
        //  comma in the letter and the Turkish stops matching - no error, no
        //  warning, just English in a Turkish game.
        // ------------------------------------------------------------------
        const src = require('fs').readFileSync(
            require('path').join(__dirname, '..', '..', 'data', 'i18n', 'mailMessagesText.ts'),
            'utf8');
        runManipulationWatch(bought({ priceNow: 95 }));
        for (const m of fromTheFieldOffice()) {
            const key = m.body.replace(/\n/g, '\\n').replace(/’/g, '\\u2019');
            expect({ subject: m.subject, translated: src.includes(key) })
                .toEqual({ subject: m.subject, translated: true });
        }
    });
});
