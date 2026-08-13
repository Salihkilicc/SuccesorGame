// src/components/story/answerFit.test.ts
//
// ============================================================================
//  EVERY CARD IN THE GAME, MEASURED, IN BOTH LANGUAGES
// ============================================================================
//
//  The failure this replaces was only findable by holding an iPhone SE with
//  the system text size at maximum and reaching one of two specific cards -
//  one of which is gated on a ten-year friendship. Nobody was going to find it
//  that way, and it was already there in English.
//
//  So it is arithmetic instead. This runs over the real conversation list and
//  over whatever Turkish is currently in the dictionary, which means a
//  translation that comes back too long fails the suite rather than shipping.
// ============================================================================

import { CONVERSATIONS } from '../../data/story/index';
import { STORY_TR, choiceKey } from '../../data/i18n/storyText';
import {
    answerBlockHeight, charsPerLine,
    ANSWER_CHAR_BUDGET, ENGLISH_CHAR_BUDGET, MAX_ANSWER_BLOCK,
    MAX_FONT_MULTIPLIER, USABLE_HEIGHT,
} from './answerFit';

/** Every card that has answers, in English and in whatever Turkish exists. */
const cards = () => {
    const out: { key: string; en: string[]; tr: string[] }[] = [];
    for (const c of CONVERSATIONS) {
        for (const n of c.nodes) {
            if (!n.choices?.length) continue;
            out.push({
                key: `${c.id}/${n.id}`,
                en: n.choices.map(ch => ch.text),
                tr: n.choices.map((ch, i) =>
                    STORY_TR[choiceKey(c.id, n.id, i)] || ch.text),
            });
        }
    }
    return out;
};

describe('the geometry', () => {
    it('counts a short answer as one line and a long one as more', () => {
        const one = answerBlockHeight(['Yes.']);
        const two = answerBlockHeight(['x'.repeat(charsPerLine() + 1)]);
        expect(two).toBeGreaterThan(one);
        expect(answerBlockHeight([])).toBe(0);
    });

    it('grows with the text size, which is the whole risk', () => {
        const text = ['A sentence of a fairly ordinary length for this game.'];
        expect(answerBlockHeight(text, MAX_FONT_MULTIPLIER))
            .toBeGreaterThan(answerBlockHeight(text, 1));
    });

    it('caps growth below the size at which the cards stop fitting', () => {
        // 3.1 is AX5, iOS's largest. If this ever passes, the cap is doing
        // nothing and the two broken cards are back.
        const worst = ['x'.repeat(59), 'x'.repeat(58)];
        expect(answerBlockHeight(worst, 3.1)).toBeGreaterThan(USABLE_HEIGHT);
        expect(answerBlockHeight(worst, MAX_FONT_MULTIPLIER)).toBeLessThan(USABLE_HEIGHT);
    });
});

describe('every card fits the smallest phone', () => {
    it('in English, at the largest size the cap allows', () => {
        const tall = cards()
            .map(c => ({ key: c.key, h: answerBlockHeight(c.en, MAX_FONT_MULTIPLIER) }))
            .filter(c => c.h > USABLE_HEIGHT);
        expect(tall).toEqual([]);
    });

    it('in Turkish, at the largest size the cap allows', () => {
        const tall = cards()
            .map(c => ({ key: c.key, h: answerBlockHeight(c.tr, MAX_FONT_MULTIPLIER) }))
            .filter(c => c.h > USABLE_HEIGHT);
        expect(tall).toEqual([]);
    });

    it('and the block is bounded anyway, so a miss is a scroll not a dead end', () => {
        // The belt to the braces above. Even if a future card defeats the
        // arithmetic, the last answer stays reachable.
        expect(MAX_ANSWER_BLOCK).toBeLessThan(USABLE_HEIGHT);
    });
});

describe('answers stay button-length', () => {
    it('English leaves room for the 20% that translation adds', () => {
        const over = cards().flatMap(c =>
            c.en.filter(t => t.length > ENGLISH_CHAR_BUDGET)
                .map(t => `${c.key}: ${t.length}ch "${t.slice(0, 40)}..."`));
        expect(over).toEqual([]);
    });

    it('Turkish stays inside two lines', () => {
        // Not a layout failure - a third line costs 18 points and the block
        // scrolls. It is a writing failure: past this length a button stops
        // reading like something a person said.
        const over = cards().flatMap(c =>
            c.tr.filter(t => t.length > ANSWER_CHAR_BUDGET)
                .map(t => `${c.key}: ${t.length}ch "${t.slice(0, 40)}..."`));
        expect(over).toEqual([]);
    });
});
