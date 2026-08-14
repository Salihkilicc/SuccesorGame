// src/data/story/noDashes.test.ts
//
// ============================================================================
//  NO DASHES IN ANYTHING THE PLAYER READS
// ============================================================================
//
//  A house rule, and it is the player's: the em-dash is banned from the game.
//  Where one was doing work, a comma does it instead, or the sentence is
//  rewritten.
//
//  There is a practical argument underneath the preference. This script is
//  going out in several languages, and the em-dash is an English punctuation
//  habit: Turkish uses it for reported speech, German hardly uses it at all,
//  and a translator handed 107 of them either keeps a mark that reads oddly in
//  their language or quietly makes a hundred separate decisions nobody reviews.
//  A comma translates.
//
//  WHAT THIS DOES NOT CHECK: comments. Half this codebase reasons in prose and
//  its section rules are made of hyphens, and nobody plays the comments. The
//  ban is on the script, not on the source.
//
//  It also does not touch HYPHENATED WORDS - mid-market, well-chosen, one in
//  ten - which are spelling rather than punctuation. Only a dash with space
//  around it, or an em/en dash anywhere, is punctuation.
// ============================================================================

import { CONVERSATIONS } from './index';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';
import { CAST } from './cast';
import { ENDINGS } from './endings';

/** A dash used as punctuation, as opposed to a hyphen inside a word. */
const PUNCTUATION_DASH = /[—–]|(?:^|\s)-(?:\s|$)/;

const spoken = (): { where: string; text: string }[] => {
    const out: { where: string; text: string }[] = [];
    for (const c of CONVERSATIONS) {
        if (c.subject) out.push({ where: `${c.id}/subject`, text: c.subject });
        for (const n of c.nodes) {
            out.push({ where: `${c.id}/${n.id}`, text: n.text });
            (n.choices ?? []).forEach((ch, i) =>
                out.push({ where: `${c.id}/${n.id}#${i}`, text: ch.text }));
        }
    }
    return out;
};

describe('the script', () => {
    it('has no dashes in any line, subject or answer', () => {
        const offenders = spoken()
            .filter(l => PUNCTUATION_DASH.test(l.text))
            .map(l => `${l.where}: ${l.text.slice(0, 80)}`);
        expect(offenders).toEqual([]);
    });

    it('and there is a lot of script for that to be true of', () => {
        // Guards the guard. A filter that quietly stopped finding lines would
        // pass this file for ever.
        expect(spoken().length).toBeGreaterThan(1000);
    });

    it('while hyphenated words are left alone, because they are spelling', () => {
        expect(PUNCTUATION_DASH.test('a mid-market company')).toBe(false);
        expect(PUNCTUATION_DASH.test('one, two')).toBe(false);
        expect(PUNCTUATION_DASH.test('a thing — and another')).toBe(true);
        expect(PUNCTUATION_DASH.test('a thing - and another')).toBe(true);
    });
});

describe('and the rest of what is read', () => {
    it('the tutorial says nothing with a dash in it', () => {
        const lines = (TUTORIAL_SEQUENCE as any[])
            .flatMap(l => [l.title, l.instruction].filter(Boolean));
        expect(lines.filter(t => PUNCTUATION_DASH.test(t))).toEqual([]);
    });

    it('nor does anybody in the cast', () => {
        const lines = Object.values(CAST as Record<string, any>)
            .flatMap(p => [p.name, p.role].filter(Boolean));
        expect(lines.filter(t => PUNCTUATION_DASH.test(t))).toEqual([]);
    });

    it('nor any ending, which is the last thing anybody reads', () => {
        // A record keyed by ending id, not a list. The first draft of this
        // called `.flatMap` on it and threw, which is a better failure than
        // the alternative: `Object.values` on something that was secretly an
        // array would have quietly checked nothing.
        const lines = Object.values(ENDINGS as Record<string, any>)
            .flatMap(e => [e.title, e.text, e.body].filter(Boolean));
        expect(lines.length).toBeGreaterThan(3);
        expect(lines.filter(t => PUNCTUATION_DASH.test(t))).toEqual([]);
    });
});
