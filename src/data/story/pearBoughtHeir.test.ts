// src/data/story/pearBoughtHeir.test.ts
//
// ============================================================================
//  THE COMPLETION LETTER, AND WHICH OF THE TWO ARRIVES
// ============================================================================
//
//  Two faults were reported in one sentence, and they pull in opposite
//  directions, which is why they are measured together.
//
//    BUYING PEAR ENDED THE RUN. It raised an ending, and the game stopped on
//    the largest thing a player can do. Fixed next door in pearBought.ts; the
//    guard lives here because "no ending effect" is exactly the kind of thing
//    that gets put back by a later edit that looks tidy.
//
//    AND THE LETTER WAS THE FOUNDER'S, WHOEVER OPENED IT. It has a 1997
//    valuation in it, nineteen years, the player's father by name, and a two
//    line refusal the writer kept himself. By the fourth generation the seat is
//    held by somebody four names down the roster who was not born for any of
//    it. So there are two letters and exactly one can ever fire.
//
//  ---------------------------------------------------------------------------
//  MEASURED THROUGH THE GATE, NOT BY READING `when`
//  ---------------------------------------------------------------------------
//  Asserting that the arrays contain the right conditions is the failure this
//  codebase keeps producing: correct data that nothing reads. `testAll` is the
//  function the runner actually calls, so both letters are put in front of it
//  in a founder's world and an heir's world and asked to answer.
// ============================================================================

import { pearBought } from './pearBought';
import { pearBoughtHeir } from './pearBoughtHeir';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS, type Dials } from '../../core/story/state';
import { STORY_TR } from '../i18n/storyText';
import { subjectKey, nodeKey, choiceKey } from '../i18n/storyText';
import type { Conversation } from '../../core/story/graph';

const world = (flags: Record<string, boolean>): World => ({
    dials: { ...INITIAL_DIALS } as Dials,
    flags: flags as never,
    quarter: 40,
    capital: 1_000_000_000,
    cash: 100_000_000,
    morale: 75,
    marketShare: 30,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
});

const choices = (c: Conversation) => c.nodes.flatMap(n => n.choices ?? []);
const effects = (c: Conversation) => choices(c).flatMap(ch => ch.effects ?? []);

/** Every line a player can read in a conversation. */
const lines = (c: Conversation) => [
    c.subject ?? '',
    ...c.nodes.map(n => n.text),
    ...choices(c).map(ch => ch.text),
];

describe('buying him is a victory, not the end of the run', () => {
    it('neither letter ends the game', () => {
        // ------------------------------------------------------------------
        //  THE REPORTED BUG
        // ------------------------------------------------------------------
        //  Both closes raised `boughtPear` and the run stopped. The other
        //  endings are losing the company, dying, or choosing to stop. This
        //  one was a punishment for succeeding.
        // ------------------------------------------------------------------
        for (const c of [pearBought, pearBoughtHeir]) {
            const ends = effects(c).filter(e => e.kind === 'ending');
            expect({ id: c.id, ends }).toEqual({ id: c.id, ends: [] });
        }
    });

    it('and every close still says out loud that it happened', () => {
        // A silent close on the largest purchase in the game reads as a bug.
        // The headline is what an ending used to do, in one line.
        for (const c of [pearBought, pearBoughtHeir]) {
            const closes = choices(c).filter(ch => !ch.next);
            expect(closes.length).toBeGreaterThan(0);
            for (const ch of closes) {
                const news = (ch.effects ?? []).filter(e => e.kind === 'news');
                expect({ id: c.id, text: ch.text, news: news.length })
                    .toEqual({ id: c.id, text: ch.text, news: 1 });
            }
        }
    });

    it('and no dead end: every card can be left', () => {
        for (const c of [pearBought, pearBoughtHeir]) {
            for (const n of c.nodes) {
                expect({ id: c.id, node: n.id, out: (n.choices ?? []).length })
                    .not.toEqual({ id: c.id, node: n.id, out: 0 });
            }
        }
    });

    it('and every branch it offers actually exists', () => {
        for (const c of [pearBought, pearBoughtHeir]) {
            const ids = new Set(c.nodes.map(n => n.id));
            const broken = choices(c).map(ch => ch.next).filter(n => n && !ids.has(n));
            expect({ id: c.id, broken }).toEqual({ id: c.id, broken: [] });
            expect(ids.has(c.start)).toBe(true);
        }
    });
});

describe('and exactly one of the two arrives', () => {
    const FOUNDER = world({ ownsPear: true });
    const HEIR = world({ ownsPear: true, succeeded: true });

    it('the founder gets the letter with 1997 in it', () => {
        expect(testAll(pearBought.when, FOUNDER)).toBe(true);
        expect(testAll(pearBoughtHeir.when, FOUNDER)).toBe(false);
    });

    it('and every generation after gets the other one', () => {
        // `succeeded` is raised by the first succession and never comes off,
        // so this is generation two and generation forty alike.
        expect(testAll(pearBoughtHeir.when, HEIR)).toBe(true);
        expect(testAll(pearBought.when, HEIR)).toBe(false);
    });

    it('and never both, in any of the four worlds there are', () => {
        // ------------------------------------------------------------------
        //  THE WHOLE POINT, STATED AS A COUNT
        // ------------------------------------------------------------------
        //  Two letters with the same subject line and the same reference
        //  number landing in one inbox is a worse bug than the one this was
        //  written to fix.
        // ------------------------------------------------------------------
        for (const owns of [false, true]) {
            for (const succeeded of [false, true]) {
                const w = world({ ownsPear: owns, succeeded });
                const firing = [pearBought, pearBoughtHeir]
                    .filter(c => testAll(c.when, w)).map(c => c.id);
                expect({ owns, succeeded, firing })
                    .toEqual({ owns, succeeded, firing: owns ? [firing[0]] : [] });
                expect(firing.length).toBe(owns ? 1 : 0);
            }
        }
    });

    it('and neither one fires off a bid he merely noticed', () => {
        // `movedOnPear` is raised by an approach. A letter conceding the
        // company from a man who still owns it would be the loudest bug in
        // the game.
        const w = world({ movedOnPear: true, succeeded: true });
        expect(testAll(pearBought.when, w)).toBe(false);
        expect(testAll(pearBoughtHeir.when, w)).toBe(false);
    });
});

describe('and the runner can actually play the new one', () => {
    it('it is registered, or it is a file nothing reads', () => {
        expect(CONVERSATIONS.map(c => c.id)).toContain(pearBoughtHeir.id);
    });

    it('and scheduled, urgent, on no quarter and no dice', () => {
        const beat = STORY_BEATS.find(b => b.conversation === pearBoughtHeir.id);
        expect(beat).toBeDefined();
        expect(beat?.urgent).toBe(true);
        expect(beat?.chance).toBeUndefined();
        // No quarter: the acquisition may close in quarter forty or never.
        expect((beat as { quarter?: number } | undefined)?.quarter).toBeUndefined();
    });

    it('and it comes from the same desk, on the same channel', () => {
        expect(pearBoughtHeir.from).toBe(pearBought.from);
        expect(pearBoughtHeir.channel).toBe('mail');
        expect(pearBoughtHeir.subject).toBe(pearBought.subject);
        // Same filing system, however many generations. That is the idea.
        expect(pearBoughtHeir.subject).toContain('7724-B');
    });

    it('and its id is its own', () => {
        expect(pearBoughtHeir.id).not.toBe(pearBought.id);
        const ids = CONVERSATIONS.map(c => c.id);
        expect(ids.filter(i => i === pearBoughtHeir.id)).toHaveLength(1);
    });
});

describe('and it says nothing only the founder could say', () => {
    const text = lines(pearBoughtHeir).join(' ').toLowerCase();

    it('no 1997, no nineteen years, no father', () => {
        // ------------------------------------------------------------------
        //  THE REPORTED SENTENCE
        // ------------------------------------------------------------------
        //  "sanki ikinci nesil satin almis gibi konusuyor". Every one of
        //  these is a thing the person now holding the seat cannot have
        //  lived through, and by generation four they are being signed by
        //  somebody who was not there for any of them.
        // ------------------------------------------------------------------
        for (const claim of ['1997', 'nineteen years', 'your father', 'i have done it myself']) {
            expect({ claim, said: text.includes(claim) }).toEqual({ claim, said: false });
        }
    });

    it('and the founder\'s letter still says all of them, or the split bought nothing', () => {
        // The probe on the assertion above: if these ever stop being in the
        // original, the test passing means only that both letters went bland.
        const original = lines(pearBought).join(' ').toLowerCase();
        for (const claim of ['1997', 'nineteen years', 'your father']) {
            expect({ claim, said: original.includes(claim) }).toEqual({ claim, said: true });
        }
    });

    it('and what it does say is the file rather than the man', () => {
        expect(text).toContain('predates me');
        expect(text).toContain('inherited a grudge');
    });

    it('and no dash got into any of it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        for (const c of [pearBought, pearBoughtHeir]) {
            expect({ id: c.id, bad: lines(c).filter(l => DASH.test(l)) })
                .toEqual({ id: c.id, bad: [] });
        }
    });
});

describe('and it is in Turkish, like the rest of the game', () => {
    it('every card, every answer and the subject line', () => {
        // A new scene reaching a Turkish player in English is the silent
        // half of adding one. Coverage is not asserted globally, so it has
        // to be asserted here.
        const missing: string[] = [];
        const check = (key: string) => {
            if (!(STORY_TR[key] ?? '').trim()) missing.push(key);
        };
        check(subjectKey(pearBoughtHeir.id));
        for (const n of pearBoughtHeir.nodes) {
            check(nodeKey(pearBoughtHeir.id, n.id));
            (n.choices ?? []).forEach((_, i) => check(choiceKey(pearBoughtHeir.id, n.id, i)));
        }
        expect(missing).toEqual([]);
    });

    it('and no dash got into the Turkish either', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        const mine = Object.entries(STORY_TR)
            .filter(([k]) => k.startsWith(`${pearBoughtHeir.id}/`));
        expect(mine.length).toBeGreaterThan(10);
        expect(mine.filter(([, v]) => DASH.test(v)).map(([k]) => k)).toEqual([]);
    });
});
