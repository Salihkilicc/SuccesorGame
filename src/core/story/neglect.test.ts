// src/core/story/neglect.test.ts
//
// ============================================================================
//  THE PENALTY THAT IS NOT A PENALTY
// ============================================================================
//
//  The question was whether a player who ignores their messages should take
//  cumulative damage, or lose brand value. This is the answer that got built
//  instead, and these tests are mostly about the ways the obvious version goes
//  wrong.
//
//  A drain would punish the wrong thing. Not reading your messages is usually
//  not a strategy, it is a player who has not worked out that the messages
//  matter - and a hidden counter never tells them. So the consequence arrives
//  from the PERSON: they write again, they mention it, and their dial moves one
//  tick. Still cumulative, still costly over years, and every step of it has a
//  name on it.
// ============================================================================

import { whoWasIgnored, NEGLECT_MONTHS, NEGLECT_STEP, type Neglectable } from './neglect';
import { NEGLECT_LINES } from '../../data/story/neglect';
import { CAST } from '../../data/story/cast';

const thread = (over: Partial<Neglectable> = {}): Neglectable => ({
    id: 'cfo',
    unread: 1,
    messages: [{ from: 'them', atMonth: 1 }],
    ...over,
});

describe('who has been left waiting', () => {
    it('nobody, when the message only just arrived', () => {
        expect(whoWasIgnored([thread()], 1 + NEGLECT_MONTHS - 1)).toEqual([]);
    });

    it('but they notice after a whole quarter', () => {
        expect(whoWasIgnored([thread()], 1 + NEGLECT_MONTHS)).toEqual(['cfo']);
    });

    it('and never for a thread that has been read', () => {
        expect(whoWasIgnored([thread({ unread: 0 })], 99)).toEqual([]);
    });

    it('and never for a thread that holds only your own words', () => {
        // An unread count with nothing from them in it should not be possible,
        // and if it ever is, the answer is silence rather than a crash.
        expect(whoWasIgnored([thread({ messages: [{ from: 'player', atMonth: 1 }] })], 99))
            .toEqual([]);
    });
});

describe('the clock runs from the NEWEST message, not the oldest', () => {
    it('so somebody who followed up last month is not chased for the one before', () => {
        // Written the other way round first, and it was wrong in a way that
        // reads as the game not keeping up: a person who wrote in March and
        // again in May gets told off for the March one.
        const t = thread({
            messages: [
                { from: 'them', atMonth: 1 },
                { from: 'them', atMonth: 5 },
            ],
        });
        expect(whoWasIgnored([t], 6)).toEqual([]);
        expect(whoWasIgnored([t], 5 + NEGLECT_MONTHS)).toEqual(['cfo']);
    });
});

describe('nobody is chased twice for one silence', () => {
    it('not in the quarter they were chased', () => {
        const t = thread({ chasedAtMonth: 4 });
        expect(whoWasIgnored([t], 4)).toEqual([]);
        expect(whoWasIgnored([t], 4 + NEGLECT_MONTHS - 1)).toEqual([]);
    });

    it('but a quarter later they will, which is what makes it cumulative', () => {
        // The chase itself lands in the thread as a new message, so in the
        // real game the clock above restarts from it too. Ignoring somebody
        // for five years costs five years of this, one tick at a time, and
        // that is the design: the damage compounds, the source is a person.
        const t = thread({ chasedAtMonth: 4 });
        expect(whoWasIgnored([t], 4 + NEGLECT_MONTHS)).toEqual(['cfo']);
    });
});

describe('what it costs', () => {
    it('one small step, because one ignored message is carelessness', () => {
        // The weight is meant to come from repetition, not from any single
        // instance. A number big enough to matter once would make a player who
        // missed one message feel cheated.
        expect(NEGLECT_STEP).toBeLessThan(5);
        expect(NEGLECT_STEP).toBeGreaterThan(0);
    });

    it('and a quarter is a quarter, which is the clock everything else uses', () => {
        expect(NEGLECT_MONTHS).toBe(3);
    });
});

describe('what they say', () => {
    it('is written per person, not generated', () => {
        expect(Object.keys(NEGLECT_LINES).length).toBeGreaterThan(3);
    });

    it('and every one of them is somebody in the cast', () => {
        for (const id of Object.keys(NEGLECT_LINES)) expect(CAST[id]).toBeDefined();
    });

    it('and every dial named is a real one', () => {
        const { INITIAL_DIALS } = require('./state');
        for (const line of Object.values(NEGLECT_LINES)) {
            if (line.dial) expect(INITIAL_DIALS).toHaveProperty(line.dial);
        }
    });

    it('while NOBODY says "you have not read my message"', () => {
        // The line that would turn this from writing into a notification with
        // a face on it. Real people mention the thing they wrote about.
        for (const line of Object.values(NEGLECT_LINES)) {
            expect(line.text.toLowerCase()).not.toContain('unread');
            expect(line.text.toLowerCase()).not.toMatch(/read my|read your|did not read/);
        }
    });

    it('and the father costs nothing, because he has no dial', () => {
        // The COO has none either, and for the same reason - see the note in
        // core/story/state.ts. Being noticed by him is not a number.
        expect(NEGLECT_LINES.father.dial).toBeUndefined();
        expect(NEGLECT_LINES.coo.dial).toBeUndefined();
    });

    it('and no dash got into any of it', () => {
        const PUNCTUATION_DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        for (const line of Object.values(NEGLECT_LINES)) {
            expect(PUNCTUATION_DASH.test(line.text)).toBe(false);
        }
    });
});
